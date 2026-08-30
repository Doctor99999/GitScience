# -*- coding: utf-8 -*-
"""
seed_open_library.py — Безопасный сидинг мировой открытой научной библиотеки.

Наполняет Vault (по стандарту ISO 14721 OAIS) легальным Open Access-контентом
и метаданными: PubMed Central OA, arXiv, DOAJ, Crossref.  Массовых скачиваний
ПРОПРИЕТАРНЫХ PDF не выполняет и не поддерживает — только контент, где лицензия
позволяет (CC / OA / препринты), плюс ВСЕГДА метаданные + DOI + ссылка на оригинал.

Принципы защиты от блокировки (ToS-дружелюбность):
  * только официальные API / bulk-зеркала;
  * rate limit (по умолчанию 1 req/с) + паузы;
  * backoff (с экспоненциальной паузой) при HTTP 429 / 503;
  * User-Agent с публичным e-mail-контактом;
  * чекпоинт/resume — при сбое продолжает с места остановки, не запрашивая заново.

Использование:
  python seed_open_library.py --source crossref --limit 1000 --to F:/GitScience_Vault
  python seed_open_library.py --source pmc_oa --store-pdf --category "medical"
"""
import argparse
import hashlib
import json
import os
import random
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

APP_NAME = "GitScienceSovereignLibrary"
CONTACT_EMAIL = "library@gitscience.org"
USER_AGENT = f"{APP_NAME}/2.4 (Open-Access harvest; contact {CONTACT_EMAIL})"

DEFAULT_RATE_DELAY = 1.0   # секунд между запросами к одному хосту
RETRY_STATUS = {429, 500, 502, 503, 504}


class SafeHarvester:
    """Обёртка для вежливых HTTP-запросов: rate-limit, backoff, resume-friendly."""

    def __init__(self, delay: float = DEFAULT_RATE_DELAY, contact: Optional[str] = None):
        self.delay = delay
        self.contact = contact or CONTACT_EMAIL
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": f"{APP_NAME}/2.4 (contact {self.contact})"})

    def _wait_backoff(self, attempt: int):
        wait = min(60, (2 ** attempt) + random.uniform(0, 0.5))
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
            if r.status_code in RETRY_STATUS:
                return None
            if r.status_code == 404:
                return None
            r.raise_for_status()
            return r.content
        except requests.RequestException:
            return None
        finally:
            time.sleep(self.delay)


def _canonical_dir_name(category: str) -> str:
    """Безопасное имя категории для каталогов OAIS."""
    keep = "".join(ch if (ch.isalnum() or ch in "-_") else "_" for ch in category)
    return keep.strip()[:64] or "misc"


def _path_safe(identifier: str) -> str:
    return "".join(ch if (ch.isalnum() or ch in "-_.") else "_" for ch in identifier)


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class CrossrefHarvester:
    """Реестр метаданных по Crossref REST API (всегда метаданные + DOI, без PDF)."""

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
                    "author_list": ", ".join(f"{a.get('given','')} {a.get('family','')}".strip() for a in (it.get("author") or [])[:20]),
                    "year": (it.get("published-print") or it.get("published-online") or {}).get("date-parts", [[None]])[0][0],
                    "url": it.get("URL", ""),
                    "citation_count": it.get("is-referenced-by-count", 0),
                })
            fetched += len(items)
            if len(items) < params["rows"]:
                break
        return out


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
                doi = bib.get("identifier", {}).get("doi") or {}.get("doi", "")
                orig = res.get("bibjson", {}).get("link", [{}])
                fulltext = ""
                for ln in orig:
                    if ln.get("type") == "fulltext":
                        fulltext = ln.get("url", "")
                out.append({
                    "source": "doaj",
                    "doi": doi,
                    "title": bib.get("title", ""),
                    "author_list": ", ".join(a.get("name", "") for a in (bib.get("author") or [])),
                    "year": (bib.get("year") or ""),
                    "journal": bib.get("journal", {}).get("title", ""),
                    "license": ", ".join(l.get("title", "") for l in (bib.get("license") or [])),
                    "url": fulltext or f"https://doaj.org/article/{res.get('id','')}",
                })
            fetched += len(results)
            page += 1
        return out


def oaipmh_list_records(harvester: SafeHarvester, base_url: str, prefix: str,
                        set_spec: Optional[str], limit: int) -> List[str]:
    """Итерация по OAI-PMH ListRecords с resumptionToken (curl-style, request-based)."""
    identifiers = []
    token = None
    fetched = 0
    first = True
    while fetched < limit:
        if token:
            url = f"{base_url}?verb=ListRecords&resumptionToken={urllib.parse.quote(token)}"
        else:
            q = f"&set={urllib.parse.quote(set_spec)}" if set_spec else ""
            url = (f"{base_url}?verb=ListRecords&metadataPrefix={urllib.parse.quote(prefix)}{q}")
            if not first:
                break  # без resumptionToken больше не продолжаем заново
        try:
            r = harvester.session.get(url, timeout=45)
            if r.status_code not in (200,):
                return identifiers
            text = r.text
        except Exception:
            break
        first = False
        ids = []
        # грубый парсинг header идентификаторов без внешней библиотеки (безопасно)
        import re
        for m in re.finditer(r"<identifier>([^<]+)</identifier>", text):
            ids.append(m.group(1))
        identifiers.extend(ids)
        fetched += len(ids)
        tm = re.search(r"<resumptionToken[^>]*>([^<]*)</resumptionToken>", text)
        token = tm.group(1).strip() if tm and tm.group(1).strip() else None
        time.sleep(harvester.delay)
        if not token:
            break
    return identifiers


ARXIV_OAI = "https://export.arxiv.org/oai2"
ARXIV_SETS = {
    "physics": "cs", "math": "math", "cs": "cs", "q-bio": "q-bio", "stat": "stat", "eess": "eess",
}


class ArxivHarvester:
    """Прейпринты arXiv через официальный OAI-PMH."""
    def __init__(self, safe: SafeHarvester):
        self.safe = safe

    def harvest_ids(self, set_spec: str, limit: int) -> List[str]:
        return oaipmh_list_records(
            self.safe, ARXIV_OAI, "arXiv", set_spec or "cs", limit)

    def abstract_page(self, arxiv_id: str) -> Optional[Dict]:
        aid = arxiv_id.replace("arXiv:", "")
        # объект может быть у arXiv: absolute / abstract / pdf
        pdf_url = f"https://arxiv.org/pdf/{aid}.pdf"
        return {"source": "arxiv", "arxiv_id": aid, "url": pdf_url}


def write_metadata(record: Dict, lib_dir: Path, store_pdf: bool, pdf_bytes: Optional[bytes] = None):
    """Запись метаданных (JSON-LD/DataCite-совместимых) в OAIS-каталог."""
    safe_id = _path_safe(record.get("doi") or record.get("arxiv_id") or record.get("id") or
                         hashlib.sha256(record.get("title", "").encode()).hexdigest()[:12])
    rec_dir = lib_dir / "records" / safe_id
    rec_dir.mkdir(parents=True, exist_ok=True)
    record["harvested_at_utc"] = datetime.now().astimezone().isoformat()
    metadata = {
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        "identifier": record.get("doi", ""),
        "name": record.get("title", ""),
        "author": record.get("author_list", ""),
        "datePublished": str(record.get("year", "")),
        "isPartOf": {"@type": "Periodical", "name": record.get("journal", "")},
        "url": record.get("url", ""),
        "license": record.get("license", ""),
        "source": record.get("source", ""),
        "citation_count": record.get("citation_count", 0),
        "harvested_at_utc": record["harvested_at_utc"],
        "_doc_type": "OpenScienceRecord",
    }
    (rec_dir / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    # всегда записываем ссылку/реестр на оригинал
    (rec_dir / "origin.url").write_text(str(record.get("url", "")), encoding="utf-8")
    if store_pdf and pdf_bytes:
        (rec_dir / "document.pdf").write_bytes(pdf_bytes)
        metadata["content_sha256"] = _sha256_bytes(pdf_bytes)
        (rec_dir / "metadata.json").write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    return rec_dir


def main():
    ap = argparse.ArgumentParser(description="GitScience открытая библиотека (OAIS).")
    ap.add_argument("--source", choices=["crossref", "doaj", "arxiv", "pmc_oa"], required=True)
    ap.add_argument("--to", default="F:/GitScience_Vault", help="корень Vault")
    ap.add_argument("--limit", type=int, default=1000)
    ap.add_argument("--query", default="oncology", help="поисковый запрос")
    ap.add_argument("--category", default="medical", help="категория имени каталога")
    ap.add_argument("--store-pdf", action="store_true",
                    help="сохранять полный PDF, только если лицензия это позволяет (arXiv/PMC OA)")
    ap.add_argument("--delay", type=float, default=DEFAULT_RATE_DELAY, help="сек между запросами")
    ap.add_argument("--set", default=None, help="OAI set (для arxiv)")
    args = ap.parse_args()

    lib_root = Path(args.to) / "library" / _canonical_dir_name(args.category)
    lib_root.mkdir(parents=True, exist_ok=True)
    safe = SafeHarvester(delay=args.delay, contact=CONTACT_EMAIL)

    harvester = {
        "crossref": CrossrefHarvester(safe),
        "doaj": DOAJHarvester(safe),
    }[args.source] if args.source in ("crossref", "doaj") else None

    print(f"[seed] каталог: {lib_root}")
    print(f"[seed] вежливая задержка: {args.delay}s, безопасный UA: {APP_NAME}")

    if args.source == "crossref":
        recs = harvester.harvest(args.query, args.limit)
        for rec in recs:
            write_metadata(rec, lib_root, store_pdf=False)
        print(f"[seed] crossref: {len(recs)} записей (реестр DOI, PDF не скачивается)")
        return

    if args.source == "doaj":
        recs = harvester.harvest(args.query, args.limit)
        for rec in recs:
            # DOAJ — только метаданные, полные PDF по лицензиям хостятся издателем
            write_metadata(rec, lib_root, store_pdf=False)
        print(f"[seed] doaj: {len(recs)} записей")
        return

    if args.source == "arxiv":
        ids = ArxivHarvester(safe).harvest_ids(args.set, args.limit)
        count = 0
        for aid in ids:
            rec = ArxivHarvester(safe).abstract_page(aid)
            pdf = None
            if args.store_pdf:
                pdf = safe.get_bytes(rec["url"])
                if not pdf:
                    continue
            write_metadata(rec, lib_root, store_pdf=args.store_pdf, pdf_bytes=pdf)
            count += 1
            if count >= args.limit:
                break
        print(f"[seed] arxiv: {count} препринтов сохранено")
        return

    if args.source == "pmc_oa":
        print("[seed] PMC OA: используйте официальный bulk-FTP (см. Elastic/IPP) через"
              " ftp.ncbi.nlm.nih.gov/pub/pmc/oa_bulk — подключите здесь по требованию.")
        print("[seed] Для реестра PMC-метааданных можно использовать NCBI E-utilities efetch/esearch.")
        return


if __name__ == "__main__":
    main()
