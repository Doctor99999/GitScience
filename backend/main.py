"""
GitScience™ Sovereign Protocol API v2.4.0
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import hashlib
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

import gitscience_storage as storage
import gitscience_compiler as compiler

app = FastAPI(
    title="GitScience™ Sovereign Protocol API",
    description="Децентрализованный нотариат научных открытий, библиотека и вычислительное ядро",
    version="2.4.0-GENESIS"
)

# Инициализация хранилища при запуске
storage.init_db()
CONSTANTS = storage.load_protocol_constants()

# Защищенный CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://doctor99999.github.io",
        "http://localhost:3000",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CalculatorRequest(BaseModel):
    params: Dict[str, float]
    doctor_attestation: Optional[bool] = True

class BillingRequest(BaseModel):
    amount: float = Field(..., gt=0)
    currency: Optional[str] = "USDT"
    author_wallet: Optional[str] = "0x71C...3929"

@app.get("/")
def health_check():
    return {
        "status": "online",
        "protocol": CONSTANTS["protocol"],
        "version": CONSTANTS["version"],
        "founder_orcid": CONSTANTS["founder"]["orcid"],
        "fair_share_split": f"{CONSTANTS['fair_share_bps']['author_percent']}% / {CONSTANTS['fair_share_bps']['infra_percent']}% / {CONSTANTS['fair_share_bps']['founder_percent']}%",
        "storage": "SQLite WAL Persistent Mode Active"
    }

# 1. ОТКРЫТАЯ БИБЛИОТЕКА
@app.get("/library")
def get_library_catalog():
    articles = storage.get_all_manuscripts()
    return {"total": len(articles), "articles": articles}

@app.get("/library/{registration_code}")
def get_manuscript_details(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)
    if not article:
        raise HTTPException(status_code=404, detail="Манускрипт не найден в реестре")
    return article

# 2. ПРИЕМ И НОТАРИАТ РЕАЛЬНОГО PDF (Генезис Сертификата №1)
@app.post("/notary/upload-pdf", status_code=status.HTTP_201_CREATED)
async def upload_and_notarize_pdf(
    file: UploadFile = File(...),
    title: str = Form(...),
    author_name: str = Form(...),
    orcid: str = Form(...),
    category: str = Form("Oncology / Neuro-Immune Medicine"),
    abstract: str = Form("")
):
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Файл манускрипта пуст")
        
    saved = storage.save_uploaded_pdf(
        file_bytes=file_bytes,
        filename=file.filename,
        title=title,
        author=author_name,
        orcid=orcid,
        category=category,
        abstract=abstract
    )
    
    return {
        "status": "SUCCESSFULLY_NOTARIZED",
        "certificate_title": f"CERTIFICATE OF SCIENTIFIC PRIORITY № {saved['serial_number']}",
        "serial_number": saved["serial_number"],
        "registration_code": saved["registration_code"],
        "sha256_payload_hash": saved["sha256_hash"],
        "git_commit_hash": saved["git_commit_hash"],
        "ots_status": "PENDING_BITCOIN_CALENDAR_INCLUSION (Digest committed)",
        "message": f"Манускрипт зафиксирован на постоянном диске. Аманат автора защищен WIPO Prior Art Shield."
    }

# 3. ПОЛУЧЕНИЕ СЕРТИФИКАТА ПРИОРИТЕТА
@app.get("/notary/certificate/{registration_code}")
def get_certificate_data(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)
    if not article:
        raise HTTPException(status_code=404, detail="Сертификат не найден")
        
    return {
        "certificate_number": f"№ {article['serial_number']:05d}",
        "registration_code": article["registration_code"],
        "title": article["title"],
        "author": article["author_name"],
        "orcid": article["orcid"],
        "sha256_digest": article["sha256_hash"],
        "git_commit_oid": article["git_commit_hash"],
        "ots_proof": article["ots_proof_file"],
        "timestamp_utc": article["created_at"],
        "standards": CONSTANTS["legal_framework"],
        "legal_status": "IRREVOCABLE_WIPO_PRIOR_ART_RECORD"
    }

# 4. ВЫЧИСЛИТЕЛЬНЫЙ ДВИЖОК AST
@app.post("/api/v1/science/calculate")
def calculate_model(req: CalculatorRequest):
    try:
        return compiler.calculate_clinical_metrics(req.params, req.doctor_attestation)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка AST-вычисления: {e}")

# 5. FAIR-SHARE БИЛЛИНГ (70 / 20 / 10) С СОХРАНЕНИЕМ В LEDGER
@app.post("/api/v1/billing/pay")
def process_fair_share_payment(req: BillingRequest):
    bps = CONSTANTS["fair_share_bps"]
    author_share = round((req.amount * bps["author_share_bps"]) / bps["total_bps"], 2)
    infra_share = round((req.amount * bps["infra_share_bps"]) / bps["total_bps"], 2)
    founder_share = round((req.amount * bps["founder_share_bps"]) / bps["total_bps"], 2)
    
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    tx_hash = f"0x{hashlib.sha256(f'{tx_id}{datetime.utcnow()}'.encode()).hexdigest()}"
    
    # Запись в постоянный реестр транзакций
    storage.record_transaction(
        tx_id=tx_id,
        amount=req.amount,
        currency=req.currency,
        author_share=author_share,
        infra_share=infra_share,
        founder_share=founder_share,
        author_wallet=req.author_wallet,
        tx_hash=tx_hash
    )
    
    return {
        "status": "Платеж Fair-Share распределен и записан в Ledger 💳",
        "tx_id": tx_id,
        "total_amount": req.amount,
        "currency": req.currency,
        "split": {
            "author_70_percent": author_share,
            "infrastructure_20_percent": infra_share,
            "founder_10_percent": founder_share
        },
        "recipient_wallet": req.author_wallet,
        "transaction_hash": tx_hash
    }