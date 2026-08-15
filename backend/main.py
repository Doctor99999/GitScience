"""
GitScience™ Sovereign Protocol API v2.6.0-CANONICAL
Строгий комплаенс: реальные Git OID, честный OpenAlex API, защищенный CORS и Маршрутизатор Аманата.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import hashlib
import uuid
import os
import re
import requests
from datetime import datetime
from typing import Dict, Any, Optional

import gitscience_storage as storage
from gitscience_fortress import DependencyRoyaltyRouter

app = FastAPI(
    title="GitScience™ Sovereign Protocol API",
    description="Децентрализованный нотариат открытий, реестр манускриптов и B2B маршрутизатор роялти",
    version="2.6.0-CANONICAL"
)

# Инициализация хранилища
storage.init_db()
CONSTANTS = storage.load_protocol_constants()

# Безопасный CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://doctor99999.github.io",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class MethodologyAuditRequest(BaseModel):
    title: str = Field(..., min_length=5)
    abstract: str = Field(..., min_length=20)
    equations: Optional[str] = None
    has_control_group: Optional[bool] = False
    sample_size: Optional[int] = Field(default=0, ge=0)

class BillingRequest(BaseModel):
    amount: float = Field(..., gt=0)
    currency: Optional[str] = "USDT"
    author_wallet: Optional[str] = "0x71C...3929"
    has_assistants: Optional[bool] = False
    assistant_share_pct: Optional[float] = 20.0

@app.get("/")
def health_check():
    return {
        "status": "online",
        "protocol": CONSTANTS["protocol"],
        "version": CONSTANTS["version"],
        "engine": "Real Git Engine (GitPython) + SQLite WAL",
        "timestamp_utc": datetime.utcnow().isoformat()
    }

# 1. ЧЕСТНЫЙ МЕТОДОЛОГИЧЕСКИЙ АНАЛИЗАТОР СТРУКТУРЫ
@app.post("/api/v1/science/audit-methodology")
def audit_methodology(req: MethodologyAuditRequest):
    criteria = {}
    
    has_math = bool(req.equations and len(req.equations.strip()) > 3)
    criteria["mathematical_formalization"] = {
        "passed": has_math,
        "detail": "Формулы предоставлены" if has_math else "Математическая модель не формализована"
    }
    
    has_sample = req.sample_size > 0
    criteria["empirical_sample"] = {
        "passed": has_sample,
        "sample_size": req.sample_size,
        "detail": f"Выборка n={req.sample_size}" if has_sample else "Теоретическое исследование без указания n"
    }
    
    criteria["control_group_validation"] = {
        "passed": req.has_control_group,
        "detail": "Присутствует группа контроля" if req.has_control_group else "Отсутствует группа контроля"
    }

    passed_count = sum(1 for c in criteria.values() if c["passed"])
    readiness_index = round((passed_count / len(criteria)) * 100, 1)

    return {
        "status": "METHODOLOGY_AUDIT_COMPLETE",
        "structure_readiness_score": readiness_index,
        "criteria": criteria,
        "recommendation": "Манускрипт готов к фиксации Prior Art" if readiness_index >= 66.0 else "Рекомендуется дополнить описание выборки"
    }

# 2. ИНТЕГРАЦИЯ С OPENALEX
@app.get("/api/v1/scholar/metrics/{orcid}")
def get_scholar_metrics(orcid: str):
    clean_orcid = orcid.strip().replace("https://orcid.org/", "")
    
    if not re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean_orcid):
        raise HTTPException(status_code=400, detail="Неверный формат ORCID iD")

    try:
        url = f"https://api.openalex.org/authors/https://orcid.org/{clean_orcid}"
        res = requests.get(url, timeout=4.0, headers={"User-Agent": "GitScience-Protocol/2.6"})
        
        if res.status_code == 200:
            data = res.json()
            summary = data.get("summary_stats", {})
            return {
                "found": True,
                "display_name": data.get("display_name"),
                "h_index": summary.get("h_index", 0),
                "citations_count": data.get("cited_by_count", 0),
                "works_count": data.get("works_count", 0),
                "institution": data.get("last_known_institution", {}).get("display_name", "Не указан"),
                "orcid": clean_orcid,
                "source": "OpenAlex Live API"
            }
        elif res.status_code == 404:
            return {
                "found": False,
                "orcid": clean_orcid,
                "message": "Профиль ORCID не найден в глобальной базе OpenAlex"
            }
    except Exception as e:
        pass

    return {
        "found": False,
        "orcid": clean_orcid,
        "message": "Внешний сервис OpenAlex временно недоступен."
    }

# 3. ЗАГРУЗКА И НОТАРИАТ PDF (С ВОДЯНЫМ ЗНАКОМ И РЕАЛЬНЫМ GIT)
@app.post("/notary/upload-pdf", status_code=status.HTTP_201_CREATED)
async def upload_and_notarize_pdf(
    file: UploadFile = File(...),
    title: str = Form(...),
    author_name: str = Form(...),
    orcid: str = Form(...),
    category: str = Form("Clinical Oncology & Surgery"),
    abstract: str = Form("")
):
    clean_orcid = orcid.strip()
    if not re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean_orcid):
        raise HTTPException(status_code=400, detail="Неверный формат ORCID")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Файл статьи пуст")

    saved = storage.save_uploaded_pdf_atomic(
        file_bytes=file_bytes,
        filename=file.filename,
        title=title,
        author=author_name,
        orcid=clean_orcid,
        category=category,
        abstract=abstract
    )
    
    return {
        "status": "SUCCESSFULLY_NOTARIZED",
        "certificate_title": f"CERTIFICATE OF SCIENTIFIC PRIORITY № {saved['serial_number']}",
        "serial_number": saved["serial_number"],
        "registration_code": saved["registration_code"],
        "sha256_payload_hash": saved["sha256_hash"],
        "git_commit_oid": saved["git_commit_hash"],
        "ots_status": "PENDING_BITCOIN_CALENDAR_SUBMISSION",
        "message": "Манускрипт физически закомичен в суверенный Git-репозиторий и зафиксирован в базе."
    }

# 4. ВЫДАЧА СЕРТИФИКАТА ПРИОРИТЕТА
@app.get("/notary/certificate/{registration_code}")
def get_certificate_data(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)
    if not article:
        raise HTTPException(status_code=404, detail="Сертификат не найден в реестре")
        
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

# 5. ОТКРЫТАЯ БИБЛИОТЕКА
@app.get("/library")
def get_library_catalog(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    all_articles = storage.get_all_manuscripts()
    filtered = all_articles

    if category and category != "All":
        filtered = [a for a in filtered if category.lower() in a.get("category", "").lower()]

    if search:
        s = search.lower().strip()
        filtered = [
            a for a in filtered 
            if s in a.get("title", "").lower() 
            or s in a.get("author_name", "").lower() 
            or s in a.get("registration_code", "").lower()
        ]

    return {"total": len(filtered), "articles": filtered}

@app.get("/library/view/{registration_code}")
def view_pdf_file(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)
    if not article or not article.get("file_path"):
        raise HTTPException(status_code=404, detail="Файл статьи не найден")
    
    file_path = article["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Физический файл отсутствует на сервере")
        
    return FileResponse(file_path, media_type="application/pdf", filename=article.get("original_filename", "manuscript.pdf"))

# 6. БИЛЛИНГ С ИСПОЛЬЗОВАНИЕМ AMANAT ROYALTY ROUTER (TAX GROSS-UP)
@app.post("/api/v1/billing/pay")
def process_fair_share_payment(req: BillingRequest):
    # Вызов смарт-маршрутизатора Аманата
    payout_data = DependencyRoyaltyRouter.calculate_split(
        base_b2b_fee=req.amount,
        has_parent_dependency=req.has_assistants,
        assistant_share_pct=req.assistant_share_pct
    )
    
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    tx_hash = f"0x{hashlib.sha256(f'{tx_id}{datetime.utcnow()}'.encode()).hexdigest()}"
    
    # Сохраняем в Ledger данные о главном авторе (остальное можно нормализовать)
    storage.record_transaction(
        tx_id=tx_id,
        amount=payout_data["b2b_invoice_total"],  # Сохраняем счет С НАЛОГОМ
        currency=req.currency,
        author_share=payout_data["payouts_usdt"]["main_author_clean"],
        infra_share=payout_data["payouts_usdt"]["infrastructure"],
        founder_share=payout_data["payouts_usdt"]["founder"],
        author_wallet=req.author_wallet,
        tx_hash=tx_hash
    )
    
    return {
        "status": "Платеж Fair-Share распределен и записан в Ledger",
        "tx_id": tx_id,
        "routing_details": payout_data,
        "recipient_wallet": req.author_wallet,
        "transaction_hash": tx_hash
    }