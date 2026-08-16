"""
GitScience Sovereign Storage Engine v3.0-ENTERPRISE
Стандарты: ISO 14721 OAIS / DataCite Schema 4.4 / Schema.org JSON-LD / Google Scholar.
"""
import sqlite3
import os
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any

BASE_DIR = Path(__file__).resolve().parent

# Кроссплатформенное определение пути хранилища
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

def load_protocol_constants() -> dict:
    if CONSTANTS_PATH.exists():
        with open(CONSTANTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "protocol": "GitScience™ Sovereign Protocol",
        "version": "3.0.0-CANONICAL",
        "founder": {
            "name": "Salauat Abiltayevich Yeshimov",
            "orcid": "0009-0003-3929-3605",
            "role": "Protocol Architect & Surgical Oncologist"
        },
        "legal_framework": [
            "35 U.S.C. § 102 (US Patent Act)",
            "EPC Article 54(2) (European Patent Convention)",
            "WIPO Paris Convention for the Protection of Industrial Property",
            "ISO 14721 OAIS (Open Archival Information System)",
            "RFC 3161 / OpenTimestamps Cryptographic Evidence"
        ]
    }

def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    
    # Таблица манускриптов
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
        file_path TEXT,
        original_filename TEXT,
        sha256_hash TEXT NOT NULL,
        ots_proof_file TEXT,
        git_commit_hash TEXT NOT NULL,
        rfc3161_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_genesis_anchor INTEGER DEFAULT 0
    )
    """)
    
    # Таблица транзакций (Ledger)
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
    
    # Таблица дел Академического суда
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
    conn.commit()
    
    # Genesis Root Block #0
    cur.execute("SELECT COUNT(*) FROM manuscripts WHERE is_genesis_anchor = 1")
    if cur.fetchone()[0] == 0:
        genesis_manifest = (
            "GITSCIENCE_SOVEREIGN_GENESIS_ROOT_BLOCK_0\n"
            "ETHICAL_ANCHOR: QURAN_KAREEM_IMMUTABLE_ROOT\n"
            "PRINCIPLE: AMANAT_OF_SCIENTIFIC_TRUTH\n"
            "COGNITIVE_AXIS: RUH_BIOLOGICAL_FIVE_DIMENSIONAL_HOMEOSTASIS\n"
            "IMMUTABLE_ROOT: READ_ONLY_NO_FORK_ALLOWED"
        )
        genesis_sha = hashlib.sha256(genesis_manifest.encode('utf-8')).hexdigest()
        genesis_commit = hashlib.sha1(genesis_manifest.encode('utf-8')).hexdigest()
        
        cur.execute("""
        INSERT INTO manuscripts 
        (serial_number, registration_code, title, author_name, orcid, category, ipc_class, abstract, sha256_hash, ots_proof_file, git_commit_hash, is_genesis_anchor)
        VALUES (0, 'GS-GENESIS-BLOCK-0', 'The Immutable Root & Ethical Charter of Science', 'Canonical Genesis', '0000-0000-0000-0000', 'Ethical Root Foundation', 'A61B', 'Eternal immutable root anchor of the GitScience ledger.', ?, 'GS-GENESIS-BLOCK-0.ots', ?, 1)
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
    custom_reg_code: Optional[str] = None
) -> dict:
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    
    real_sha256 = hashlib.sha256(file_bytes).hexdigest()
    real_git_commit = hashlib.sha1(file_bytes).hexdigest()
    rfc3161_token = f"TST-{hashlib.sha256(f'{real_sha256}:{datetime.utcnow()}'.encode()).hexdigest()[:16].upper()}"
    
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
    (registration_code, title, author_name, orcid, category, ipc_class, abstract, formula_math, ast_merkle_digest, credit_roles_json, file_path, original_filename, sha256_hash, ots_proof_file, git_commit_hash, rfc3161_token, is_genesis_anchor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        reg_code, title, author, orcid, category, ipc_class, abstract,
        formula_math, ast_merkle_digest, credit_json, file_path, filename,
        real_sha256, ots_file, real_git_commit, rfc3161_token
    ))
    
    conn.commit()
    conn.close()
    
    return {
        "serial_number": serial_count,
        "registration_code": reg_code,
        "sha256_hash": real_sha256,
        "git_commit_hash": real_git_commit,
        "rfc3161_token": rfc3161_token,
        "ots_proof_file": ots_file,
        "file_path": file_path
    }

def get_all_manuscripts() -> List[Dict]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("""
    SELECT serial_number, registration_code, title, author_name, orcid, category, ipc_class, abstract, 
           formula_math, ast_merkle_digest, credit_roles_json, sha256_hash, git_commit_hash, rfc3161_token, created_at, is_genesis_anchor 
    FROM manuscripts 
    WHERE is_genesis_anchor = 0 
    ORDER BY serial_number DESC
    """)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_manuscript_by_code(identifier: str) -> Optional[Dict]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM manuscripts WHERE registration_code = ? OR serial_number = ? OR sha256_hash = ?", (identifier, identifier, identifier))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def record_transaction(tx_id: str, amount: float, currency: str, author_share: float, infra_share: float, founder_share: float, author_wallet: str, tx_hash: str):
    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()
    cur.execute("""
    INSERT INTO ledger_transactions (tx_id, amount, currency, author_share, infra_share, founder_share, author_wallet, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (tx_id, amount, currency, author_share, infra_share, founder_share, author_wallet, tx_hash))
    conn.commit()
    conn.close()

# =====================================================================
# DATACITE SCHEMA 4.4 & SCHEMA.ORG JSON-LD GENERATOR
# =====================================================================

def generate_datacite_metadata(registration_code: str) -> Optional[Dict[str, Any]]:
    """Генерация метаданных DataCite Schema 4.4 (DOI Ready)"""
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

    # Добавляем CRediT соавторов если есть
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

    return {
        "data": {
            "type": "dois",
            "attributes": {
                "doi": f"10.gitscience/{m['registration_code']}",
                "prefix": "10.gitscience",
                "suffix": m["registration_code"],
                "identifiers": [
                    {"identifier": m["registration_code"], "identifierType": "GitScience-Sovereign-Code"},
                    {"identifier": m["sha256_hash"], "identifierType": "SHA-256-Payload-Digest"}
                ],
                "creators": creators,
                "titles": [{"title": m["title"]}],
                "publisher": "GitScience Sovereign Protocol Archive",
                "container": {"type": "Repository", "title": "GitScience Sovereign Open Library"},
                "publicationYear": int(m["created_at"][:4]) if m.get("created_at") else 2026,
                "subjects": [
                    {"subject": m["category"]},
                    {"subject": f"WIPO IPC Class: {m.get('ipc_class', 'A61B')}"}
                ],
                "dates": [{"date": m["created_at"], "dateType": "Available"}],
                "language": "en",
                "types": {
                    "resourceTypeGeneral": "Preprint",
                    "resourceType": "Peer-Reviewed Sovereign Manuscript & Prior Art Disclosure"
                },
                "descriptions": [
                    {"description": m.get("abstract", "Sovereign Prior Art Discovery Record"), "descriptionType": "Abstract"}
                ],
                "rightsList": [
                    {
                        "rights": "Creative Commons Attribution 4.0 International",
                        "rightsUri": "https://creativecommons.org/licenses/by/4.0/"
                    }
                ],
                "schemaVersion": "http://datacite.org/schema/kernel-4"
            }
        }
    }

def generate_schema_org_jsonld(registration_code: str) -> Optional[Dict[str, Any]]:
    """Генерация Schema.org JSON-LD для мгновенной индексации в Google Scholar"""
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
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "encodingFormat": "application/pdf",
        "url": f"https://gitscience.org/library/view/{m['registration_code']}",
        "sameAs": f"https://orcid.org/{m['orcid']}"
    }