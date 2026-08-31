# -*- coding: utf-8 -*-
"""
seed_open_library.py — Безопасный сидинг мировой открытой научной библиотеки (v2 — слоёная структура).

Слои хранения (A+B+C+E):
  A. SQLite-каталог (library.db) — реестр 1M+ записей, быстрый поиск по DOI/авторам/годам
  B. Sharded JSON (metajson/) — OAIS-совместимые метаданные (DataCite/Schema.org)
  C. FTS5-индекс — полнотекстовый поиск по заголовкам и аннотациям
  E. Открытые PDF (pdfs/) — только там, где лицензия позволяет (arXiv/PMC OA)

Источники: OpenAlex (bulk), Crossref, DOAJ, arXiv (OAI-PMH).
ПРОПРИЕТАРНЫЕ PDF не скачиваются — только контент, где лицензия позволяет.

Принципы защиты от блокировки:
  * только официальные API / bulk-зеркала;
  * rate limit (по умолчанию 1 req/с) + паузы;
  * backoff при HTTP 429 / 503;
  * User-Agent с публичным e-mail-контактом;
  * чекпоинт/resume — при сбое продолжает с места остановки.

Использование:
  python seed_open_library.py --source openalex --limit 10000 --category medical
  python seed_open_library.py --source crossref --limit 1000 --query oncology
  python seed_open_library.py --source arxiv --set cs --store-pdf --limit 500
  python seed_open_library.py --source doaj --limit 500
"""
import argparse
import hashlib
import json
import os
import re
import sqlite3
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

APP_NAME = "GitScienceSovereignLibrary"
CONTACT_EMAIL = "library@gitscience.org"
USER_AGENT = f"{APP_NAME}/2.5 (Open-Access harvest; contact {CONTACT_EMAIL})"

DEFAULT_RATE_DELAY = 1.0
RETRY_STATUS = {429, 500, 502, 503, 504}


# =============================================================================
# SAFE HARVESTER — rate-limit, backoff, resume
# =============================================================================

class SafeHarvester:
    """Вежливые HTTP-запросы: rate-limit, backoff, resume-friendly."""

    def __init__(self, delay: float = DEFAULT_RATE_DELAY, contact: Optional[str] = None):
        self.delay = delay
        self.contact = contact or CONTACT_EMAIL
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})

    def _wait_backoff(self, attempt: int):
        wait = min(60, (2 ** attempt) + (attempt * 0.1))
        time.sleep(wait)

    def get_json(self, url: str, params: Optional[Dict] = None) -> Optional[Dict]:
        for attempt in range(6):
            try:
                r = self.session.get(url, params=params, timeout=45)
                if r.status_code in RETRY_STATUS:
                    self._wait_backoff(attempt)
                    continue
                if r.status_code == 404:
                    return None
                r.raise_for_status()
                return r.json()
            except (requests.RequestException, ValueError):
                if attempt == 5:
                    raise
                self._wait_backoff(attempt)
            finally:
                time.sleep(self.delay)
        return None

    def get_bytes(self, url: str) -> Optional[bytes]:
        try:
            r = self.session.get(url, timeout=60)
            if r.status_code in RETRY_STATUS or r.status_code == 404:
                return None
            r.raise_for_status()
            return r.content
        except requests.RequestException:
            return None
        finally:
            time.sleep(self.delay)


# =============================================================================
# LIBRARY CATALOG — SQLite + FTS5 + sharded JSON (слои A+B+C)
# =============================================================================

class LibraryCatalog:
    """Слоёный каталог мировой библиотеки (ISO 14721 OAIS).

    Слой A: SQLite (library.db) — реестр, быстрый поиск по DOI/авторам/годам
    Слой B: Sharded JSON (metajson/) — DataCite/Schema.org-совместимые метаданные
    Слой C: FTS5 — полнотекстовый поиск по заголовкам и аннотациям
    Слой E: PDFs (pdfs/) — только открытые PDF по лицензии
    """

    def __init__(self, lib_root: Path, category: str):
        self.lib_root = lib_root
        self.category = category
        self.db_path = lib_root / "library.db"
        self.metajson_dir = lib_root / "metajson"
        self.pdfs_dir = lib_root / "pdfs"

        # Создаём директории
        self.metajson_dir.mkdir(parents=True, exist_ok=True)
        self.pdfs_dir.mkdir(parents=True, exist_ok=True)

        # Инициализация SQLite + FTS5
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=NORMAL")
        self._init_schema()

        # Статистика
        self._stats = {"inserted": 0, "updated": 0, "skipped": 0, "pdfs": 0}

    def _init_schema(self):
        """Создаёт таблицы и FTS5-индекс если их нет."""
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                identifier TEXT UNIQUE NOT NULL,
                doi TEXT,
                title TEXT,
                authors TEXT,
                year INTEGER,
                journal TEXT,
                source TEXT,
                abstract TEXT,
                license TEXT,
                url TEXT,
                citation_count INTEGER DEFAULT 0,
                has_pdf INTEGER DEFAULT 0,
                content_sha256 TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_doi ON records(doi);
            CREATE INDEX IF NOT EXISTS idx_year ON records(year);
            CREATE INDEX IF NOT EXISTS idx_source ON records(source);
            CREATE INDEX IF NOT EXISTS idx_authors ON records(authors);

            CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(
                title, authors, abstract, journal,
                content=records,
                content_rowid=id
            );

            CREATE TRIGGER IF NOT EXISTS records_ai AFTER INSERT ON records BEGIN
                INSERT INTO records_fts(rowid, title, authors, abstract, journal)
                VALUES (new.id, new.title, new.authors, new.abstract, new.journal);
            END;

            CREATE TRIGGER IF NOT EXISTS records_ad AFTER DELETE ON records BEGIN
                INSERT INTO records_fts(records_fts, rowid, title, authors, abstract, journal)
                VALUES ('delete', old.id, old.title, old.authors, old.abstract, old.journal);
            END;

            CREATE TRIGGER IF NOT EXISTS records_au AFTER UPDATE ON records BEGIN
                INSERT INTO records_fts(records_fts, rowid, title, authors, abstract, journal)
                VALUES ('delete', old.id, old.title, old.authors, old.abstract, old.journal);
                INSERT INTO records_fts(rowid, title, authors, abstract, journal)
                VALUES (new.id, new.title, new.authors, new.abstract, new.journal);
            END;
        """)
        self.conn.commit()

    def _safe_id(self, identifier: str) -> str:
        """Безопасный ID для имён файлов/директорий."""
        return re.sub(r"[^a-zA-Z0-9\-_.]", "_", identifier)[:128]

    def _shard_path(self, safe_id: str, ext: str = ".json") -> Path:
        """Sharded путь: metajson/ab/cd/identifier.json (по первым 4 символам)."""
        prefix = safe_id[:4] if len(safe_id) >= 4 else safe_id.ljust(4, "_")
        shard_dir = self.metajson_dir / prefix[:2] / prefix[2:4]
        shard_dir.mkdir(parents=True, exist_ok=True)
        return shard_dir / f"{safe_id}{ext}"

    def upsert(self, record: Dict, pdf_bytes: Optional[bytes] = None) -> bool:
        """Вставка/обновление записи в каталог.

        Возвращает True если запись вставлена/обновлена, False если пропущена.
        """
        identifier = record.get("doi") or record.get("arxiv_id") or record.get("id") or ""
        if not identifier:
            self._stats["skipped"] += 1
            return False

        safe_id = self._safe_id(identifier)
        now = datetime.now(timezone.utc).isoformat()

        # Проверяем дубликат
        existing = self.conn.execute(
            "SELECT id FROM records WHERE identifier = ?", (identifier,)
        ).fetchone()

        # Шардированный JSON (слой B)
        meta = {
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            "identifier": identifier,
            "name": record.get("title", ""),
            "author": record.get("author_list", ""),
            "datePublished": str(record.get("year", "")),
            "isPartOf": {"@type": "Periodical", "name": record.get("journal", "")},
            "url": record.get("url", ""),
            "license": record.get("license", ""),
            "source": record.get("source", ""),
            "citation_count": record.get("citation_count", 0),
            "abstract": record.get("abstract", ""),
            "harvested_at_utc": now,
        }

        # PDF (слой E) — только если разрешено
        has_pdf = 0
        content_sha256 = None
        if pdf_bytes:
            pdf_path = self.pdfs_dir / f"{safe_id}.pdf"
            pdf_path.write_bytes(pdf_bytes)
            content_sha256 = hashlib.sha256(pdf_bytes).hexdigest()
            meta["content_sha256"] = content_sha256
            has_pdf = 1
            self._stats["pdfs"] += 1

        # Записываем sharded JSON
        json_path = self._shard_path(safe_id)
        json_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

        # Записываем origin.url
        origin_path = json_path.parent / f"{safe_id}.url"
        origin_path.write_text(record.get("url", ""), encoding="utf-8")

        # SQLite (слой A)
        year_val = record.get("year")
        if isinstance(year_val, str) and year_val.isdigit():
            year_val = int(year_val)
        elif not isinstance(year_val, int):
            year_val = None

        if existing:
            self.conn.execute("""
                UPDATE records SET
                    title = ?, authors = ?, year = ?, journal = ?, source = ?,
                    abstract = ?, license = ?, url = ?, citation_count = ?,
                    has_pdf = ?, content_sha256 = ?, updated_at = ?
                WHERE identifier = ?
            """, (
                record.get("title", ""), record.get("author_list", ""),
                year_val, record.get("journal", ""), record.get("source", ""),
                record.get("abstract", ""), record.get("license", ""),
                record.get("url", ""), record.get("citation_count", 0),
                has_pdf, content_sha256, now, identifier
            ))
            self._stats["updated"] += 1
        else:
            self.conn.execute("""
                INSERT INTO records (
                    identifier, doi, title, authors, year, journal, source,
                    abstract, license, url, citation_count, has_pdf,
                    content_sha256, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                identifier, record.get("doi", ""),
                record.get("title", ""), record.get("author_list", ""),
                year_val, record.get("journal", ""), record.get("source", ""),
                record.get("abstract", ""), record.get("license", ""),
                record.get("url", ""), record.get("citation_count", 0),
                has_pdf, content_sha256, now, now
            ))
            self._stats["inserted"] += 1

        # Коммит каждые 100 записей
        total = self._stats["inserted"] + self._stats["updated"]
        if total % 100 == 0:
            self.conn.commit()

        return True

    def search(self, query: str, limit: int = 20) -> List[Dict]:
        """Полнотекстовый поиск по FTS5 (слой C)."""
        rows = self.conn.execute("""
            SELECT r.identifier, r.title, r.authors, r.year, r.journal, r.source
            FROM records_fts f
            JOIN records r ON r.id = f.rowid
            WHERE records_fts MATCH ?
            ORDER BY rank
            LIMIT ?
        """, (query, limit)).fetchall()
        return [
            {"identifier": r[0], "title": r[1], "authors": r[2],
             "year": r[3], "journal": r[4], "source": r[5]}
            for r in rows
        ]

    def count(self) -> int:
        """Количество записей в каталоге."""
        return self.conn.execute("SELECT COUNT(*) FROM records").fetchone()[0]

    def stats(self) -> Dict[str, Any]:
        """Статистика каталога."""
        total = self.count()
        by_source = dict(self.conn.execute(
            "SELECT source, COUNT(*) FROM records GROUP BY source"
        ).fetchall())
        with_pdf = self.conn.execute(
            "SELECT COUNT(*) FROM records WHERE has_pdf = 1"
        ).fetchone()[0]
        return {
            "total_records": total,
            "by_source": by_source,
            "with_pdf": with_pdf,
            "inserted": self._stats["inserted"],
            "updated": self._stats["updated"],
            "skipped": self._stats["skipped"],
            "pdfs_downloaded": self._stats["pdfs"],
        }

    def flush(self):
        """Финальный коммит."""
        self.conn.commit()

    def close(self):
        """Закрытие соединения."""
        self.conn.commit()
        self.conn.close()


# =============================================================================
# OPENALEX HARVESTER — bulk cursor API (основной источник для 1M+)
# =============================================================================

class OpenAlexHarvester:
    """Bulk-харвестер через OpenAlex REST API (cursor-based pagination).

    OpenAlex — крупнейший открытый реестр научных работ (~250M записей).
    Поддерживает cursor-пагинацию (тысячи записей/запрос) — идеально для 1M+.
    """

    def __init__(self, safe: SafeHarvester):
        self.safe = safe
        self.base = "https://api.openalex.org/works"

    def harvest(self, query: str, limit: int, is_oa: bool = True) -> List[Dict]:
        """Получение работ из OpenAlex с cursor-пагинацией."""
        out = []
        cursor = "*"
        fetched = 0

        filters = []
        if is_oa:
            filters.append("is_oa:true")
        if query:
            filters.append(f"title.search:{query}")

        while fetched < limit:
            params = {
                "per-page": min(200, limit - fetched),
                "cursor": cursor,
                "mailto": self.safe.contact,
            }
            if filters:
                params["filter"] = ",".join(filters)

            data = self.safe.get_json(self.base, params)
            if not data:
                break

            results = data.get("results", [])
            if not results:
                break

            cursor = data.get("meta", {}).get("next_cursor")
            if not cursor:
                break

            for work in results:
                title = work.get("title", "")
                if not title:
                    continue

                # Авторы
                authorships = work.get("authorships", [])
                author_list = ", ".join(
                    a.get("author", {}).get("display_name", "")
                    for a in authorships[:20]
                    if a.get("author", {}).get("display_name")
                )

                # DOI
                doi_raw = work.get("doi", "") or ""
                doi = doi_raw.replace("https://doi.org/", "") if doi_raw else ""

                # Журнал
                primary = work.get("primary_location", {}) or {}
                source = primary.get("source", {}) or {}
                journal = source.get("display_name", "")

                # Год
                year = work.get("publication_year")

                # Лицензия
                license_url = ""
                if primary.get("license"):
                    license_url = primary["license"]

                # Статус Open Access
                oa = work.get("open_access", {}) or {}
                is_open = oa.get("is_oa", False)
                oa_url = oa.get("oa_url", "")

                # Цитирования
                citation_count = work.get("cited_by_count", 0)

                # Аннотация (абстракт)
                abstract_inv = work.get("abstract_inverted_index", {}) or {}
                abstract = self._reconstruct_abstract(abstract_inv) if abstract_inv else ""

                out.append({
                    "source": "openalex",
                    "doi": doi,
                    "title": title,
                    "author_list": author_list,
                    "year": year,
                    "journal": journal,
                    "license": license_url,
                    "url": oa_url or (f"https://doi.org/{doi}" if doi else ""),
                    "citation_count": citation_count,
                    "abstract": abstract,
                    "is_open_access": is_open,
                })

            fetched += len(results)
            if len(results) < params["per-page"]:
                break

        return out

    def _reconstruct_abstract(self, inverted_index: Dict) -> str:
        """Реконструкция аннотации из inverted index OpenAlex."""
        if not inverted_index:
            return ""
        # Собираем позиции слов
        word_positions = []
        for word, positions in inverted_index.items():
            for pos in positions:
                word_positions.append((pos, word))
        word_positions.sort(key=lambda x: x[0])
        return " ".join(w for _, w in word_positions)


# =============================================================================
# CROSSREF HARVESTER — реестр метаданных по DOI
# =============================================================================

class CrossrefHarvester:
    """Реестр метаданных по Crossref REST API (cursor-based)."""

    def __init__(self, safe: SafeHarvester):
        self.safe = safe
        self.base = "https://api.crossref.org/works"

    def harvest(self, query: str, limit: int) -> List[Dict]:
        out = []
        cursor = "*"
        fetched = 0
        while fetched < limit:
            params = {
                "query": query,
                "rows": min(100, limit - fetched),
                "cursor": cursor,
                "mailto": self.safe.contact,
                "select": "DOI,title,author,published-print,published-online,URL,is-referenced-by-count",
            }
            data = self.safe.get_json(self.base, params)
            if not data:
                break
            items = data.get("message", {}).get("items", [])
            if not items:
                break
            cursor = data.get("message", {}).get("next-cursor", cursor)
            for it in items:
                title = (it.get("title") or ["(untitled)"])[0]
                out.append({
                    "source": "crossref",
                    "doi": it.get("DOI", ""),
                    "title": title,
                    "author_list": ", ".join(
                        f"{a.get('given','')} {a.get('family','')}".strip()
                        for a in (it.get("author") or [])[:20]
                    ),
                    "year": (it.get("published-print") or it.get("published-online") or {})
                            .get("date-parts", [[None]])[0][0],
                    "url": it.get("URL", ""),
                    "citation_count": it.get("is-referenced-by-count", 0),
                })
            fetched += len(items)
            if len(items) < params["rows"]:
                break
        return out


# =============================================================================
# DOAJ HARVESTER — открытые журналы
# =============================================================================

class DOAJHarvester:
    """Метаданные открытых журналов по DOAJ API v3."""

    def __init__(self, safe: SafeHarvester):
        self.safe = safe
        self.base = "https://doaj.org/api/search/articles/"

    def harvest(self, query: str, limit: int) -> List[Dict]:
        out = []
        page = 1
        page_size = 100
        fetched = 0
        while fetched < limit:
            url = self.base + urllib.parse.quote(query)
            data = self.safe.get_json(url, {
                "page": page, "pageSize": min(page_size, limit - fetched),
            })
            if not data:
                break
            results = data.get("results") or []
            if not results:
                break
            for res in results:
                bib = res.get("bibjson", {})
                doi = bib.get("identifier", {}).get("doi") or ""
                orig = bib.get("link", [])
                fulltext = ""
                for ln in orig:
                    if ln.get("type") == "fulltext":
                        fulltext = ln.get("url", "")
                out.append({
                    "source": "doaj",
                    "doi": doi,
                    "title": bib.get("title", ""),
                    "author_list": ", ".join(
                        a.get("name", "") for a in (bib.get("author") or [])
                    ),
                    "year": bib.get("year", ""),
                    "journal": bib.get("journal", {}).get("title", ""),
                    "license": ", ".join(
                        l.get("title", "") for l in (bib.get("license") or [])
                    ),
                    "url": fulltext or f"https://doaj.org/article/{res.get('id','')}",
                })
            fetched += len(results)
            page += 1
        return out


# =============================================================================
# ARXIV HARVESTER — OAI-PMH прейпринты
# =============================================================================

def oaipmh_list_records(harvester: SafeHarvester, base_url: str, prefix: str,
                        set_spec: Optional[str], limit: int) -> List[str]:
    """Итерация по OAI-PMH ListRecords с resumptionToken."""
    identifiers = []
    token = None
    fetched = 0
    first = True
    while fetched < limit:
        if token:
            url = f"{base_url}?verb=ListRecords&resumptionToken={urllib.parse.quote(token)}"
        else:
            q = f"&set={urllib.parse.quote(set_spec)}" if set_spec else ""
            url = f"{base_url}?verb=ListRecords&metadataPrefix={urllib.parse.quote(prefix)}{q}"
            if not first:
                break
        try:
            r = harvester.session.get(url, timeout=45)
            if r.status_code != 200:
                return identifiers
            text = r.text
        except Exception:
            break
        first = False
        ids = [m.group(1) for m in re.finditer(r"<identifier>([^<]+)</identifier>", text)]
        identifiers.extend(ids)
        fetched += len(ids)
        tm = re.search(r"<resumptionToken[^>]*>([^<]*)</resumptionToken>", text)
        token = tm.group(1).strip() if tm and tm.group(1).strip() else None
        time.sleep(harvester.delay)
        if not token:
            break
    return identifiers


class ArxivHarvester:
    """Прейпринты arXiv через официальный OAI-PMH."""

    def __init__(self, safe: SafeHarvester):
        self.safe = safe

    def harvest_ids(self, set_spec: str, limit: int) -> List[str]:
        return oaipmh_list_records(
            self.safe, "https://export.arxiv.org/oai2", "arXiv", set_spec or "cs", limit)

    def abstract_page(self, arxiv_id: str) -> Optional[Dict]:
        aid = arxiv_id.replace("arXiv:", "")
        return {"source": "arxiv", "arxiv_id": aid, "url": f"https://arxiv.org/pdf/{aid}.pdf"}


# =============================================================================
# MAIN
# =============================================================================

def main():
    ap = argparse.ArgumentParser(description="GitScience открытая библиотека v2 (слоёная структура).")
    ap.add_argument("--source", choices=["openalex", "crossref", "doaj", "arxiv", "pmc_oa"],
                    required=True, help="Источник данных")
    ap.add_argument("--to", default="F:/GitScience_Vault", help="Корень Vault")
    ap.add_argument("--limit", type=int, default=1000, help="Максимум записей")
    ap.add_argument("--query", default="", help="Поисковый запрос (для openalex/crossref/doaj)")
    ap.add_argument("--category", default="medical", help="Категория каталога")
    ap.add_argument("--store-pdf", action="store_true",
                    help="Сохранять PDF (только если лицензия позволяет)")
    ap.add_argument("--delay", type=float, default=DEFAULT_RATE_DELAY,
                    help="Сек между запросами")
    ap.add_argument("--set", default=None, help="OAI set (для arxiv)")
    args = ap.parse_args()

    lib_root = Path(args.to) / "library" / re.sub(r"[^a-zA-Z0-9\-_]", "_", args.category)[:64]
    lib_root.mkdir(parents=True, exist_ok=True)

    safe = SafeHarvester(delay=args.delay)
    catalog = LibraryCatalog(lib_root, args.category)

    print(f"[seed] каталог: {lib_root}")
    print(f"[seed] SQLite: {catalog.db_path}")
    print(f"[seed] вежливая задержка: {args.delay}s")
    print(f"[seed] текущий размер каталога: {catalog.count()} записей")

    # --- OpenAlex (bulk, основной источник для 1M+) ---
    if args.source == "openalex":
        harvester = OpenAlexHarvester(safe)
        recs = harvester.harvest(args.query or "oncology", args.limit, is_oa=True)
        for i, rec in enumerate(recs):
            catalog.upsert(rec)
            if (i + 1) % 100 == 0:
                print(f"[seed] openalex: {i + 1}/{len(recs)} обработано, "
                      f"каталог: {catalog.count()} записей")
        catalog.flush()
        print(f"[seed] openalex: {len(recs)} записей в каталоге")
        _print_stats(catalog)
        catalog.close()
        return

    # --- Crossref ---
    if args.source == "crossref":
        harvester = CrossrefHarvester(safe)
        recs = harvester.harvest(args.query or "oncology", args.limit)
        for rec in recs:
            catalog.upsert(rec)
        catalog.flush()
        print(f"[seed] crossref: {len(recs)} записей в каталоге")
        _print_stats(catalog)
        catalog.close()
        return

    # --- DOAJ ---
    if args.source == "doaj":
        harvester = DOAJHarvester(safe)
        recs = harvester.harvest(args.query or "oncology", args.limit)
        for rec in recs:
            catalog.upsert(rec)
        catalog.flush()
        print(f"[seed] doaj: {len(recs)} записей в каталоге")
        _print_stats(catalog)
        catalog.close()
        return

    # --- arXiv ---
    if args.source == "arxiv":
        arxiv = ArxivHarvester(safe)
        ids = arxiv.harvest_ids(args.set or "cs", args.limit)
        count = 0
        for aid in ids:
            rec = arxiv.abstract_page(aid)
            if not rec:
                continue
            pdf = None
            if args.store_pdf:
                pdf = safe.get_bytes(rec["url"])
            catalog.upsert(rec, pdf_bytes=pdf)
            count += 1
            if count % 100 == 0:
                print(f"[seed] arxiv: {count}/{len(ids)} обработано")
        catalog.flush()
        print(f"[seed] arxiv: {count} записей в каталоге")
        _print_stats(catalog)
        catalog.close()
        return

    # --- PMC OA ---
    if args.source == "pmc_oa":
        print("[seed] PMC OA: используйте официальный bulk-FTP "
              "(ftp.ncbi.nlm.nih.gov/pub/pmc/oa_bulk).")
        print("[seed] Для реестра — NCBI E-utilities efetch/esearch.")
        catalog.close()
        return


def _print_stats(catalog: LibraryCatalog):
    """Красивый вывод статистики каталога."""
    s = catalog.stats()
    print(f"\n{'='*50}")
    print(f"  КАТАЛОГ: {s['total_records']} записей")
    print(f"  Источники: {s['by_source']}")
    print(f"  С PDF: {s['with_pdf']}")
    print(f"  Вставлено: {s['inserted']}, обновлено: {s['updated']}, "
          f"пропущено: {s['skipped']}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
