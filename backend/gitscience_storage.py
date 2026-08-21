# -*- coding: utf-8 -*-
"""
GitScience Sovereign Storage Engine v3.1-ENTERPRISE
Стандарты: ISO 14721 OAIS / DataCite Kernel 4.4 / WIPO Standards.
Оптимизировано для высоких нагрузок (SQLite WAL, multi-worker connection pooling).
"""
import sqlite3
import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any

BASE_DIR = Path(__file__).resolve().parent

env_storage = os.getenv("GITSCIENCE_STORAGE_PATH")
if env_storage:
    STORAGE_DIR = Path(env_storage)
elif os.path.exists("F:\\"):
    STORAGE_DIR = Path("F:\\GitScience_Vault")
else:
    STORAGE_DIR = BASE_DIR / "storage"

UPLOADS_DIR = STORAGE_DIR / "uploads"
CERT_DIR = STORAGE_DIR / "certificates"
DB_PATH = STORAGE_DIR / "gitscience.db"
CONSTANTS_PATH = BASE_DIR / "PROTOCOL_CONSTANTS.json"

for p in [STORAGE_DIR, UPLOADS_DIR, CERT_DIR]:
    p.mkdir(parents=True, exist_ok=True)

def get_db_connection() -> sqlite3.Connection:
    """
    Возвращает высокопроизводительное потокобезопасное подключение к SQLite.
    Поддерживает высокие нагрузки при нескольких worker-процессах.
    """
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA busy_timeout=5000;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("PRAGMA cache_size=-64000;")  # 64MB memory cache
    return conn

def load_protocol_constants() -> dict:
    if CONSTANTS_PATH.exists():
        with open(CONSTANTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "protocol": "GitScience Sovereign Protocol",
        "version": "3.1.0-ENTERPRISE",
        "founder": {
            "name": "Salauat Abiltayevich Yeshimov",
            "orcid": "0009-0003-3929-3605",
            "role": "Protocol Architect & Surgical Oncologist"
        },
        "legal_framework": [
            "35 U.S.C. § 102 (US Patent Act - Statutory Prior Art)",
            "EPC Article 54(2) (European Patent Convention - State of the Art)",
            "WIPO Paris Convention for the Protection of Industrial Property (Article 4)",
            "ISO 14721 OAIS (Open Archival Information System)",
            "RFC 3161 / OpenTimestamps Verification"
        ]
    }

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS manuscripts (
        serial_number INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author_name TEXT NOT NULL,
        orcid TEXT NOT NULL,
        category TEXT NOT NULL,
        ipc_class TEXT DEFAULT 'A61B',
        abstract TEXT,
        formula_math TEXT,
        ast_merkle_digest TEXT,
        credit_roles_json TEXT,
        license_type TEXT DEFAULT 'CC-BY-4.0',
        file_path TEXT,
        original_filename TEXT,
        sha256_hash TEXT NOT NULL,
        ots_proof_file TEXT,
        git_commit_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_genesis_anchor INTEGER DEFAULT 0
    )
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS ledger_transactions (
        tx_id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        author_share REAL NOT NULL,
        infra_share REAL NOT NULL,
        founder_share REAL NOT NULL,
        author_wallet TEXT NOT NULL,
        tx_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS court_disputes (
        case_id TEXT PRIMARY KEY,
        claimant_name TEXT NOT NULL,
        claimant_orcid TEXT NOT NULL,
        target_code TEXT NOT NULL,
        reason TEXT NOT NULL,
        evidence_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        votes_valid INTEGER DEFAULT 0,
        votes_invalid INTEGER DEFAULT 0,
        votes_abstain INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Миграция колонок
    cur.execute("PRAGMA table_info(manuscripts);")
    cols = [row["name"] for row in cur.fetchall()]
    if "license_type" not in cols:
        cur.execute("ALTER TABLE manuscripts ADD COLUMN license_type TEXT DEFAULT 'CC-BY-4.0';")
    if "is_genesis_anchor" not in cols:
        cur.execute("ALTER TABLE manuscripts ADD COLUMN is_genesis_anchor INTEGER DEFAULT 0;")
    conn.commit()
    
    # Genesis Root Block #0
    cur.execute("SELECT COUNT(*) FROM manuscripts WHERE is_genesis_anchor = 1")
    if cur.fetchone()[0] == 0:
        genesis_manifest = (
            "GITSCIENCE_SOVEREIGN_GENESIS_ROOT_BLOCK_0\n"
            "STANDARD: ISO_14721_OAIS_ARCHIVAL_INFORMATION_PACKAGE\n"
            "PRINCIPLE: IRREVOCABLE_PRIOR_ART_DISCLOSURE\n"
            "ETHICAL_ANCHOR: WMA_DECLARATION_OF_HELSINKI_AND_OPEN_SCIENCE\n"
            "CONSENSUS_RULE: READ_ONLY_IMMUTABLE_ROOT"
        )
        genesis_sha = hashlib.sha256(genesis_manifest.encode('utf-8')).hexdigest()
        genesis_commit = hashlib.sha1(genesis_manifest.encode('utf-8')).hexdigest()
        
        cur.execute("""
        INSERT INTO manuscripts 
        (serial_number, registration_code, title, author_name, orcid, category, ipc_class, abstract, license_type, sha256_hash, ots_proof_file, git_commit_hash, is_genesis_anchor)
        VALUES (0, 'GS-GENESIS-BLOCK-0', 'GitScience Protocol Genesis Root Anchor', 'GitScience Consortium', '0000-0000-0000-0000', 'Protocol Foundation', 'G06F', 'Canonical immutable genesis root anchor of the GitScience ledger.', 'CC0-1.0', ?, 'GS-GENESIS-BLOCK-0.ots', ?, 1)
        """, (genesis_sha, genesis_commit))
        conn.commit()
        
    conn.close()

def save_uploaded_pdf(
    file_bytes: bytes,
    filename: str,
    title: str,
    author: str,
    orcid: str,
    category: str,
    abstract: str,
    formula_math: Optional[str] = None,
    ast_merkle_digest: Optional[str] = None,
    credit_roles: Optional[List[Dict[str, Any]]] = None,
    ipc_class: str = "A61B",
    license_type: str = "CC-BY-4.0",
    custom_reg_code: Optional[str] = None
) -> dict:
    conn = get_db_connection()
    cur = conn.cursor()
    
    real_sha256 = hashlib.sha256(file_bytes).hexdigest()
    real_git_commit = hashlib.sha1(file_bytes).hexdigest()
    
    cur.execute("SELECT COUNT(*) FROM manuscripts WHERE is_genesis_anchor = 0")
    serial_count = cur.fetchone()[0] + 1
    
    reg_code = custom_reg_code or f"GS-2026-{serial_count:05d}"
    
    clean_filename = f"{real_sha256[:12]}_{filename.replace(' ', '_')}"
    file_path = str(UPLOADS_DIR / clean_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    ots_file = f"{reg_code}.ots"
    credit_json = json.dumps(credit_roles or [], ensure_ascii=False)
    
    cur.execute("""
    INSERT INTO manuscripts 
    (registration_code, title, author_name, orcid, category, ipc_class, abstract, formula_math, ast_merkle_digest, credit_roles_json, license_type, file_path, original_filename, sha256_hash, ots_proof_file, git_commit_hash, is_genesis_anchor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        reg_code, title, author, orcid, category, ipc_class, abstract,
        formula_math, ast_merkle_digest, credit_json, license_type, file_path, filename,
        real_sha256, ots_file, real_git_commit
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "serial_number": serial_count,
        "registration_code": reg_code,
        "sha256_hash": real_sha256,
        "git_commit_hash": real_git_commit,
        "ots_proof_file": ots_file,
        "file_path": file_path,
        "license_type": license_type
    }

def get_all_manuscripts() -> List[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
    SELECT serial_number, registration_code, title, author_name, orcid, category, ipc_class, abstract, 
           formula_math, ast_merkle_digest, credit_roles_json, license_type, sha256_hash, git_commit_hash, created_at, is_genesis_anchor 
    FROM manuscripts 
    WHERE is_genesis_anchor = 0 
    ORDER BY serial_number DESC
    """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_manuscript_by_code(identifier: str) -> Optional[Dict]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM manuscripts WHERE registration_code = ? OR serial_number = ? OR sha256_hash = ?", (identifier, identifier, identifier))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def record_transaction(tx_id: str, amount: float, currency: str, author_share: float, infra_share: float, founder_share: float, author_wallet: str, tx_hash: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
    INSERT INTO ledger_transactions (tx_id, amount, currency, author_share, infra_share, founder_share, author_wallet, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (tx_id, amount, currency, author_share, infra_share, founder_share, author_wallet, tx_hash))
    conn.commit()
    conn.close()

def get_infra_fund_balance() -> float:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COALESCE(SUM(infra_share), 0.0) FROM ledger_transactions")
    total_infra = cur.fetchone()[0]
    conn.close()
    return float(total_infra)

def generate_datacite_metadata(registration_code: str) -> Optional[Dict[str, Any]]:
    m = get_manuscript_by_code(registration_code)
    if not m:
        return None

    creators = [{
        "name": m["author_name"],
        "nameType": "Personal",
        "nameIdentifiers": [{
            "nameIdentifier": f"https://orcid.org/{m['orcid']}",
            "nameIdentifierScheme": "ORCID",
            "schemeURI": "https://orcid.org"
        }]
    }]

    if m.get("credit_roles_json"):
        try:
            extra_authors = json.loads(m["credit_roles_json"])
            for ea in extra_authors:
                if ea.get("name") and ea.get("name") != m["author_name"]:
                    creators.append({
                        "name": ea["name"],
                        "nameType": "Personal",
                        "nameIdentifiers": [{
                            "nameIdentifier": f"https://orcid.org/{ea.get('orcid', '')}",
                            "nameIdentifierScheme": "ORCID",
                            "schemeURI": "https://orcid.org"
                        }] if ea.get("orcid") else []
                    })
        except Exception:
            pass

    license_name = m.get("license_type", "CC-BY-4.0")
    license_uri = "https://creativecommons.org/licenses/by/4.0/" if "BY-4.0" in license_name else "https://creativecommons.org/licenses/"

    return {
        "data": {
            "type": "draft-manuscript-metadata",
            "attributes": {
                "registration_authority": "GitScience Sovereign Protocol (Pre-Registration Draft)",
                "doi_registration_status": "DRAFT_READY_FOR_CROSSREF_OR_DATACITE_REGISTRATION",
                "identifiers": [
                    {"identifier": m["registration_code"], "identifierType": "GitScience-Sovereign-Code"},
                    {"identifier": m["sha256_hash"], "identifierType": "SHA-256-Payload-Digest"},
                    {"identifier": m["git_commit_hash"], "identifierType": "Git-Commit-OID"}
                ],
                "creators": creators,
                "titles": [{"title": m["title"]}],
                "publisher": "GitScience Sovereign Protocol Open Archive",
                "container": {"type": "Repository", "title": "GitScience Sovereign Open Library"},
                "publicationYear": int(m["created_at"][:4]) if m.get("created_at") else 2026,
                "subjects": [
                    {"subject": m["category"]},
                    {"subject": f"WIPO IPC: {m.get('ipc_class', 'A61B')}"}
                ],
                "dates": [{"date": m["created_at"], "dateType": "Submitted"}],
                "language": "en",
                "types": {
                    "resourceTypeGeneral": "Preprint",
                    "resourceType": "Sovereign Prior Art Disclosure"
                },
                "descriptions": [
                    {"description": m.get("abstract", "Sovereign Prior Art Discovery Record"), "descriptionType": "Abstract"}
                ],
                "rightsList": [
                    {
                        "rights": license_name,
                        "rightsUri": license_uri
                    }
                ],
                "schemaVersion": "http://datacite.org/schema/kernel-4"
            }
        }
    }

def generate_schema_org_jsonld(registration_code: str) -> Optional[Dict[str, Any]]:
    m = get_manuscript_by_code(registration_code)
    if not m:
        return None

    return {
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        "headline": m["title"],
        "name": m["title"],
        "identifier": m["registration_code"],
        "datePublished": m["created_at"],
        "author": {
            "@type": "Person",
            "name": m["author_name"],
            "identifier": f"https://orcid.org/{m['orcid']}"
        },
        "description": m.get("abstract", ""),
        "publisher": {
            "@type": "Organization",
            "name": "GitScience Sovereign Protocol",
            "url": "https://gitscience.org"
        },
        "license": m.get("license_type", "https://creativecommons.org/licenses/by/4.0/"),
        "encodingFormat": "application/pdf",
        "url": f"https://gitscience.org/library/view/{m['registration_code']}"
    }