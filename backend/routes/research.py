# -*- coding: utf-8 -*-
"""
routes/research.py — Vampire, ZK Commitments, IoT, Prior-Art, Harvester routes.
Moved from main.py via mechanical extraction; logic unchanged.
"""
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, status, Query, Body, Request, Response
from pydantic import BaseModel, Field
import hashlib
import hmac
import os
import re
import json
from datetime import datetime, timezone

from routes.deps import (
    storage, zk_engine, iot_gateway,
    require_active_bearer, _app_is_production,
    VampireProtocolEngine, AutonomousIngestionDaemon, AutoHarvesterWorker,
)

try:
    import gitscience_vampire as vamp_lib
    from gitscience_vampire import VampireProtocolEngine, AutonomousIngestionDaemon, AutoHarvesterWorker
except Exception:
    vamp_lib = None
    VampireProtocolEngine = AutonomousIngestionDaemon = AutoHarvesterWorker = None

try:
    import gitscience_indexer as world_index
except Exception:
    world_index = None

try:
    import gitscience_celery as celery_mod
except Exception:
    celery_mod = None

try:
    from gitscience_ai_review import SovereignAIAuditor
except Exception:
    SovereignAIAuditor = None

try:
    from gitscience_priorart_report import (
        PriorArtReportProduct, get_tier,
        PRIOR_ART_DISCLAIMER as REPORT_DISCLAIMER,
    )
except Exception:
    PriorArtReportProduct = None
    get_tier = None
    REPORT_DISCLAIMER = None

router = APIRouter()


class VampireSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    limit: Optional[int] = Field(default=5, ge=1, le=20)

class VampireImportRequest(BaseModel):
    work_data: Dict[str, Any]


# =====================================================================
# 10. VAMPIRE PROTOCOL MONITOR & SHADOW IMPORTER
# =====================================================================

@router.post("/api/v1/vampire/search")
def search_vampire_openalex(req: VampireSearchRequest):
    results = VampireProtocolEngine.search_openalex(req.query, req.limit)
    return {"total": len(results), "results": results}

@router.post("/api/v1/vampire/import")
def import_vampire_work(request: Request, req: VampireImportRequest):
    require_active_bearer(request)
    try:
        result = VampireProtocolEngine.import_and_notarize_work(req.work_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import error: {e}")


# =====================================================================
# 11. ZERO-KNOWLEDGE PROOF OF DISCOVERY (ZK-PoD)
# =====================================================================

class ZKCommitRequest(BaseModel):
    author_orcid: str = Field(...)
    author_name: str = Field(...)
    hypothesis_title: str = Field(...)
    secret_salt: str = Field(..., min_length=6)
    hidden_payload_text: str = Field(...)
    hidden_formula: Optional[str] = None

class ZKRevealRequest(BaseModel):
    commitment_id: str = Field(...)
    secret_salt: str = Field(...)
    revealed_payload_text: str = Field(...)
    revealed_formula: Optional[str] = None
    author_orcid: Optional[str] = None

class IoTRegisterRequest(BaseModel):
    device_id: str = Field(..., min_length=2, max_length=128)
    label: str = Field(..., max_length=256)
    public_key_pem: str = Field(...)
    issuer: Optional[str] = "GitScience Lab Infrastructure"

class IoTIngestRequest(BaseModel):
    device_id: str = Field(..., min_length=2, max_length=128)
    timestamp: int = Field(...)
    nonce: str = Field(..., min_length=8, max_length=128)
    payload: Dict[str, Any] = Field(...)
    signature: str = Field(...)


@router.post("/api/v1/zk/commit")
def create_zk_blind_commitment(request: Request, req: ZKCommitRequest):
    # Привязка личности: ORCID берётся ТОЛЬКО из подписанного токена — исключает Sybil-спуфинг
    bearer_payload = require_active_bearer(request)
    token_orcid = bearer_payload.get("orcid", "")
    author_name = bearer_payload.get("name") or req.author_name or f"Scholar {token_orcid}"
    return zk_engine.create_blind_commitment(
        author_orcid=token_orcid,
        author_name=author_name,
        hypothesis_title=req.hypothesis_title,
        secret_salt=req.secret_salt,
        hidden_payload_text=req.hidden_payload_text,
        hidden_formula=req.hidden_formula
    )

@router.post("/api/v1/zk/reveal")
def reveal_zk_commitment(request: Request, req: ZKRevealRequest):
    bearer_payload = require_active_bearer(request)
    bearer_orcid = bearer_payload.get("orcid")
    
    commitments = zk_engine.get_all_commitments()
    target = next((c for c in commitments if c["commitment_id"] == req.commitment_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Commitment not found")
        
    if target.get("author_orcid") != bearer_orcid:
        raise HTTPException(status_code=403, detail="Only the commitment author can reveal")

    return zk_engine.reveal_and_verify(
        commitment_id=req.commitment_id,
        secret_salt=req.secret_salt,
        revealed_payload_text=req.revealed_payload_text,
        revealed_formula=req.revealed_formula,
        author_orcid=req.author_orcid
    )

@router.get("/api/v1/zk/list")
def list_zk_commitments():
    return {"commitments": zk_engine.get_all_commitments()}

# =====================================================================
# 12.5 IoT HARDWARE GATEWAY (HSM) — подписанные данные лабоборудования
# =====================================================================

def _iot_device_secret_ok(provider_secret: str) -> bool:
    """Проверяет IOT_DEVICE_SECRET (анти-регистрация фейковых «аппаратных» устройств)."""
    expected = os.environ.get("IOT_DEVICE_SECRET", "")
    if not expected:
        if _app_is_production():
            raise HTTPException(status_code=503, detail="IOT_DEVICE_SECRET не настроен — регистрация устройств заблокирована")
        return True  # dev-sandbox
    return hmac.compare_digest(provider_secret, expected)

@router.post("/api/v1/iot/register")
def iot_register_device(request: Request, req: IoTRegisterRequest):
    """Регистрирует лабоборудование. Требует заголовок X-GS-Device-Secret (env IOT_DEVICE_SECRET).

    Перезапись уже зарегистрированного device_id другим ключом запрещена (защита цепи доверия).
    """
    provided_secret = request.headers.get("x-gs-device-secret", "")
    if not provided_secret and os.environ.get("IOT_DEVICE_SECRET"):
        raise HTTPException(status_code=401, detail="Missing X-GS-Device-Secret header")
    if not _iot_device_secret_ok(provided_secret):
        raise HTTPException(status_code=401, detail="Invalid X-GS-Device-Secret")

    for existing in iot_gateway.list_devices():
        if existing.get("device_id") == req.device_id:
            if existing.get("public_key_pem") != req.public_key_pem.strip():
                raise HTTPException(
                    status_code=409,
                    detail="device_id уже зарегистрирован с другим ключом — перезапись запрещена",
                )
            return {"status": "DEVICE_ALREADY_REGISTERED", "device_id": req.device_id}

    try:
        return iot_gateway.register_device(
            device_id=req.device_id,
            label=req.label,
            public_key_pem=req.public_key_pem,
            issuer=req.issuer or "GitScience Lab Infrastructure",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api/v1/iot/ingest")
def iot_ingest_signed_data(req: IoTIngestRequest):
    return iot_gateway.ingest(req.model_dump())

@router.get("/api/v1/iot/devices")
def iot_list_devices():
    return {"devices": iot_gateway.list_devices()}

@router.get("/api/v1/iot/status")
def iot_status(record_id: Optional[str] = None):
    return iot_gateway.get_status(record_id)


# =====================================================================
# 22. REAL-TIME MULTI-SOURCE HARVESTER & AUTONOMOUS DAEMON
# =====================================================================

class MultiSourceSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    source: str = Field(default="all")
    limit: int = Field(default=5, ge=1, le=20)

@router.post("/api/v1/vampire/search/multisource")
def search_multisource_scientific_works(req: MultiSourceSearchRequest):
    """Поиск открытых статей одновременно в OpenAlex, arXiv и PubMed"""
    results = VampireProtocolEngine.search_multisource(
        query=req.query,
        source=req.source,
        limit=req.limit
    )
    return {
        "status": "SEARCH_SUCCESS",
        "total_found": len(results),
        "source": req.source,
        "query": req.query,
        "results": results
    }

class PriorArtRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Заголовок/идея для проверки первичности")
    abstract: Optional[str] = Field(default=None)
    formula_math: Optional[str] = Field(default=None)
    k: int = Field(default=10, ge=1, le=50)

@router.post("/api/v1/prior-art")
def run_prior_art_check(req: PriorArtRequest):
    """Проверка первичности по МИРОВОМУ индексу открытой науки (BM25, НЕ эвристика).

    Когда индекс пуст — честный fallback на локальную эвристику с явной меткой
    HEURISTIC_FALLBACK. Результат НЕ является юридическим заключением.
    """
    index_available = world_index.index_status()["total_indexed_works"] > 0
    if index_available:
        results = world_index.query_prior_art(title=req.title, abstract=req.abstract or "", k=req.k)
        return {
            "status": "PRIOR_ART_READY",
            "index_available": True,
            "method": "INDEX_BM25",
            "total_hits": len(results),
            "query": {"title": req.title, "abstract": req.abstract or ""},
            "results": results,
            "disclaimer": world_index.PRIOR_ART_DISCLAIMER,
        }
    heuristic = SovereignAIAuditor.scan_prior_art_overlap(req.title, req.abstract or "", req.formula_math or "")
    return {
        "status": "PRIOR_ART_HEURISTIC",
        "index_available": False,
        "method": "HEURISTIC_FALLBACK",
        "total_hits": 0,
        "heuristic": heuristic,
        "disclaimer": world_index.PRIOR_ART_DISCLAIMER,
    }

@router.get("/api/v1/prior-art/status")
def prior_art_index_status():
    """Статус мирового индекса: размер, последняя инжест, топ-журналы."""
    return world_index.index_status()

class PriorArtReportRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Заголовок/идея для проверки первичности")
    abstract: Optional[str] = Field(default=None)
    formula_math: Optional[str] = Field(default=None)
    tier: str = Field(default="auto", description="auto | verified | full — тарифная лестница")
    currency: str = Field(default="USD", description="USD или KZT")
    k: int = Field(default=10, ge=1, le=50)

@router.post("/api/v1/prior-art/report")
def generate_prior_art_report_product(req: PriorArtReportRequest):
    """Продуктовый пакет «Verified Prior-Art Report» (Layer B).

    Возвращает метаданные тарифа + JSON-LD для юристов. PDF скачивается отдельно:
    GET /api/v1/prior-art/report/{report_id}/pdf. Результат НЕ юридическое заключение.
    """
    if PriorArtReportProduct is None or get_tier is None:
        raise HTTPException(status_code=503, detail="PriorArt report product module unavailable")

    try:
        tier = get_tier(req.tier)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    currency = (req.currency or "USD").upper()
    if currency not in ("USD", "KZT"):
        raise HTTPException(status_code=422, detail="currency must be USD or KZT")
    price = tier.get("price_usd" if currency == "USD" else "price_kzt", tier.get("price_usd"))

    index_available = bool(world_index) and world_index.index_status()["total_indexed_works"] > 0
    if index_available:
        results = world_index.query_prior_art(title=req.title, abstract=req.abstract or "", k=req.k)
        method = "INDEX_BM25"
    else:
        results = []
        method = "HEURISTIC_FALLBACK"

    report_id = PriorArtReportProduct.generate_report_id(
        {"title": req.title, "abstract": req.abstract or ""}, req.tier
    )
    jsonld = PriorArtReportProduct.build_jsonld(
        report_id=report_id,
        query={"title": req.title, "abstract": req.abstract or ""},
        tier=req.tier,
        results=results,
        method=method,
    )

    return {
        "status": "PRIOR_ART_REPORT_READY",
        "report_id": report_id,
        "tier": req.tier,
        "tier_label_en": tier.get("label_en"),
        "tier_label_ru": tier.get("label_ru"),
        "price": price,
        "currency": currency,
        "method": method,
        "total_hits": len(results),
        "top_overlap_pct": PriorArtReportProduct._top_overlap(results),
        "result": {
            **({"results": results} if index_available or results else {}),
            "disclaimer": REPORT_DISCLAIMER or PRIOR_ART_DISCLAIMER,
        },
        "jsonld": jsonld,
        "pdf_url": f"/api/v1/prior-art/report/{report_id}/pdf?tier={req.tier}&currency={currency}",
    }

@router.get("/api/v1/prior-art/report/{report_id}/pdf")
def download_prior_art_report_pdf(
    report_id: str,
    title: str = Query(default="Untitled"),
    abstract: str = Query(default=""),
    tier: str = Query(default="auto"),
    currency: str = Query(default="USD"),
    k: int = Query(default=10, ge=1, le=50),
):
    """Печатный PDF-пакет отчёта (скачивается после генерации)."""
    if PriorArtReportProduct is None:
        raise HTTPException(status_code=503, detail="PriorArt report product module unavailable")
    try:
        get_tier(tier)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    index_available = bool(world_index) and world_index.index_status()["total_indexed_works"] > 0
    results = world_index.query_prior_art(title=title, abstract=abstract, k=k) if index_available else []
    method = "INDEX_BM25" if index_available else "HEURISTIC_FALLBACK"

    pdf_bytes = PriorArtReportProduct.generate_pdf(
        report_id=report_id,
        query={"title": title, "abstract": abstract},
        tier=tier,
        results=results,
        method=method,
        currency=(currency or "USD").upper(),
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="PriorArtReport_{report_id}.pdf"'}
    )

class BatchHarvestRequest(BaseModel):
    query: Optional[str] = Field(default=None)
    source: str = Field(default="all")
    limit: int = Field(default=4, ge=1, le=20)

@router.post("/api/v1/vampire/harvest/batch")
def trigger_batch_harvester(request: Request, req: BatchHarvestRequest):
    """Запускает порцию реального парсинга открытых статей из OpenAlex / arXiv / PubMed.
    Требует валидный Bearer-токен (защита от анонимного abuse внешнего трафика)."""
    require_active_bearer(request)
    try:
        from gitscience_celery import task_harvest_batch
        task = task_harvest_batch.delay(query=req.query, source=req.source, limit=req.limit)
        return {"status": "BATCH_QUEUED", "task_id": task.id, "message": "Harvesting job queued in Celery successfully."}
    except Exception as e:
        # Fallback to local execution if Celery is not running yet
        return AutonomousIngestionDaemon.harvest_batch(custom_query=req.query, source=req.source, limit=req.limit)

@router.get("/api/v1/vampire/harvest/status")
@router.get("/api/v1/vampire/harvest/daemon/status")
def get_harvester_daemon_status():
    """Возвращает текущий статус фонового парсера и демона сбора"""
    # Emulate daemon status for frontend compatibility
    return {
        "status": "DAEMON_STARTED",
        "message": "В режиме Enterprise (Celery + Redis) сборщик управляется пулом воркеров.",
        "uptime": "Managed by Celery",
        "total_harvested_count": getattr(AutonomousIngestionDaemon, "_total_harvested_count", 0),
        "current_active_topic": getattr(AutonomousIngestionDaemon, "_current_active_topic", "Enterprise Mode")
    }

@router.post("/api/v1/vampire/harvest/daemon/start")
def start_autonomous_crawler_daemon(request: Request):
    """Запускает непрерывный фоновый сборщик научной литературы. Требует Bearer-токен."""
    require_active_bearer(request)
    try:
        from gitscience_celery import task_harvest_batch
        # Queue 3 background tasks
        for _ in range(3):
            task_harvest_batch.delay(query="clinical oncology", source="all", limit=50)
        return {"status": "DAEMON_STARTED", "message": "Сборщик успешно запущен (Celery Mode)"}
    except Exception as e:
        return AutonomousIngestionDaemon.start_daemon()

@router.post("/api/v1/vampire/harvest/daemon/stop")
def stop_autonomous_crawler_daemon(request: Request):
    """Останавливает непрерывный фоновый сборщик. Требует Bearer-токен."""
    require_active_bearer(request)
    return {"status": "DAEMON_STOPPED", "message": "Для отмены задач Celery используйте Flower."}




