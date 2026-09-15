import os
from typing import Optional
from celery import Celery

# Configure Celery
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery(
    "gitscience_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
)

@celery_app.task(name="gitscience.tasks.harvest_batch")
def task_harvest_batch(query: str = "clinical oncology", source: str = "all", limit: int = 5):
    """
    Фоновая задача сбора научных статей (Vampire Harvester).
    Выполняется в изолированном Celery-воркере, не блокируя основной API сервер.
    """
    from gitscience_vampire import VampireProtocolEngine
    import gitscience_storage as storage
    import time

    imported_records = []
    try:
        works = VampireProtocolEngine.search_multisource(query, source=source, limit=limit)
        for work in works:
            try:
                res = VampireProtocolEngine.import_and_notarize_work(work)
                imported_records.append(res)
                time.sleep(2) # Защита от rate-limit
            except Exception as e:
                print(f"Error harvesting work: {e}")
                continue
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

    return {
        "status": "BATCH_HARVEST_COMPLETED",
        "newly_harvested_count": len(imported_records),
        "sample": imported_records[:3]
    }

@celery_app.task(name="gitscience.tasks.sync_prior_art_index")
def task_sync_prior_art_index(limit: int = 5_000, from_year: Optional[int] = None):
    """Инкрементальная синхронизация Мирового индекса науки (OpenAlex → FTS5 каталог).
    Еженедельный график cron/beat; вежливый rate-limit внутри индексера."""
    import time as _t
    t0 = _t.time()
    try:
        from gitscience_indexer import ingest_openalex, index_status
        inserted = ingest_openalex(limit=limit, from_year=from_year)
        return {
            "status": "INDEX_SYNC_COMPLETED",
            "inserted": inserted,
            "elapsed_sec": round(_t.time() - t0, 2),
            "index": index_status(),
        }
    except Exception as e:  # pragma: no cover - worker-only path
        return {"status": "ERROR", "message": str(e)}
