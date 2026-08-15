"""
GitScience Sovereign Storage Engine
Стандарт: ISO 14721 OAIS (Open Archival Information System).
Автоматическое сохранение на физический диск F:\GitScience_Vault (500 GB)
"""
import sqlite3
import os
import json
import hashlib
from typing import List, Dict, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Определение пути хранилища: диск F:\ или локальная папка
if os.path.exists("F:\\"):
    STORAGE_DIR = os.getenv("GITSCIENCE_STORAGE_PATH", "F:\\GitScience_Vault")
else:
    STORAGE_DIR = os.getenv("GITSCIENCE_STORAGE_PATH", os.path.join(BASE_DIR, "storage"))

UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")
CERT_DIR = os.path.join(STORAGE_DIR, "certificates")
DB_PATH = os.path.join(STORAGE_DIR, "gitscience.db")
CONSTANTS_PATH = os.path.join(BASE_DIR, "PROTOCOL_CONSTANTS.json")

# Автоматическое создание всех папок на диске F:
for path in [STORAGE_DIR, UPLOADS_DIR, CERT_DIR]:
    os.makedirs(path, exist_ok=True)

def load_protocol_constants() -> dict:
    if os.path.exists(CONSTANTS_PATH):
        with open(CONSTANTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "version": "2.4.0-GENESIS",
        "founder": {"orcid": "0009-0003-3929-3605"}
    }

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    
    # Реестр манускриптов
    cur.execute("""
    CREATE TABLE IF NOT EXISTS manuscripts (
        serial_number INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        author_name TEXT NOT NULL,
        orcid TEXT NOT NULL,
        category TEXT NOT NULL,
        abstract TEXT,
        file_path TEXT,
        original_filename TEXT,
        sha256_hash TEXT NOT NULL,
        ots_proof_file TEXT,
        git_commit_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_genesis_anchor INTEGER DEFAULT 0
    )
    """)
    
    # Реестр транзакций (Ledger)
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
    conn.commit()
    
    # Genesis Block #0 (Корневой этический анкер)
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
        (serial_number, registration_code, title, author_name, orcid, category, abstract, sha256_hash, ots_proof_file, git_commit_hash, is_genesis_anchor)
        VALUES (0, 'GS-GENESIS-BLOCK-0', 'The Immutable Root & Ethical Charter of Science', 'Canonical Genesis', '0000-0000-0000-0000', 'Ethical Root Foundation', 'Eternal immutable root anchor of the GitScience ledger.', ?, 'GS-GENESIS-BLOCK-0.ots', ?, 1)
        """, (genesis_sha, genesis_commit))
        conn.commit()
        
    conn.close()

def save_uploaded_pdf(file_bytes: bytes, filename: str, title: str, author: str, orcid: str, category: str, abstract: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Расчет честного SHA-256
    real_sha256 = hashlib.sha256(file_bytes).hexdigest()
    real_git_commit = hashlib.sha1(file_bytes).hexdigest()
    
    # Порядковый номер
    cur.execute("SELECT COUNT(*) FROM manuscripts WHERE is_genesis_anchor = 0")
    serial_count = cur.fetchone()[0] + 1
    reg_code = f"GS-2026-{serial_count:05d}"
    
    clean_filename = f"{real_sha256[:12]}_{filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOADS_DIR, clean_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    ots_file = f"{reg_code}.ots"
    
    cur.execute("""
    INSERT INTO manuscripts 
    (registration_code, title, author_name, orcid, category, abstract, file_path, original_filename, sha256_hash, ots_proof_file, git_commit_hash, is_genesis_anchor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (reg_code, title, author, orcid, category, abstract, file_path, filename, real_sha256, ots_file, real_git_commit))
    
    conn.commit()
    conn.close()
    
    return {
        "serial_number": serial_count,
        "registration_code": reg_code,
        "sha256_hash": real_sha256,
        "git_commit_hash": real_git_commit,
        "ots_proof_file": ots_file,
        "file_path": file_path
    }

def get_all_manuscripts() -> List[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT serial_number, registration_code, title, author_name, orcid, category, abstract, sha256_hash, git_commit_hash, created_at, is_genesis_anchor FROM manuscripts WHERE is_genesis_anchor = 0 ORDER BY serial_number DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def get_manuscript_by_code(identifier: str) -> Optional[Dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM manuscripts WHERE registration_code = ? OR serial_number = ?", (identifier, identifier))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def record_transaction(tx_id: str, amount: float, currency: str, author_share: float, infra_share: float, founder_share: float, author_wallet: str, tx_hash: str):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
    INSERT INTO ledger_transactions (tx_id, amount, currency, author_share, infra_share, founder_share, author_wallet, tx_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (tx_id, amount, currency, author_share, infra_share, founder_share, author_wallet, tx_hash))
    conn.commit()
    conn.close()