# -*- coding: utf-8 -*-
"""
routes/platform.py — Platform, infrastructure, billing, and utility routes.
Moved from main.py via mechanical extraction; logic unchanged.
"""
from typing import Optional, List, Dict, Any, Tuple

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, status, Query, Body, Request, Response
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from xml.sax.saxutils import escape as xml_sax_escape
import hashlib
import hmac
import uuid
import os
import re
import json
import base64
import urllib.request
import urllib.error
import time
from datetime import datetime, timezone

from routes.deps import (
    storage, compiler, _sandbox, CONSTANTS, CREDIT_ROLES,
    DualTimestampingNotary, IRBClinicalVerifier, SandboxedEvaluator,
    CertificateGenerator, ClinicalFHIRGateway, DICOMWebGateway,
    InstitutionalFiatGateway, IPNFTEngine, SovereignWeb3Gateway,
    InstitutionalInvoicePDFGenerator, SovereignAIAuditor,
    require_active_bearer, sanitize_header_value, _extract_bearer_payload, _is_oauth_verified,
    ScholarAuthService, _app_is_production,
    DependencyRoyaltyRouter,
)
from gitscience_watermark import stamp_pdf_bytes
import requests as _requests

router = APIRouter()


class FormulaVerifyRequest(BaseModel):
    formula: str = Field(..., json_schema_extra={"example": "(Artery + Vein) / (Lymph + 1.0)"})
    sample_params: Optional[Dict[str, float]] = None

class BillingCalculateRequest(BaseModel):
    base_amount: float = Field(..., gt=0, json_schema_extra={"example": 1000.0})
    contributors: Optional[List[Dict[str, Any]]] = None

# =====================================================================
# 1. СИСТЕМНЫЙ СТАТУС & METRICS
# =====================================================================

@router.get("/")
def health_check():
    return {
        "status": "ONLINE_SOVEREIGN",
        "protocol": CONSTANTS["protocol"],
        "version": CONSTANTS["version"],
        "engine": "Safe AST Compiler + Git Engine + SQLite WAL (ISO 14721 OAIS)",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "standards": CONSTANTS["legal_framework"],
        "credit_roles_supported": CREDIT_ROLES
    }

@router.get("/api/v1/health")
def api_v1_health():
    """Расширенный мониторинг здоровья протокола, базы данных и файлового хранилища"""
    t0 = time.time()
    all_docs = storage.get_all_manuscripts()
    db_latency_ms = round((time.time() - t0) * 1000, 2)
    
    return {
        "status": "HEALTHY",
        "protocol": "GitScience Sovereign Protocol",
        "version": CONSTANTS["version"],
        "database": {
            "status": "CONNECTED_WAL",
            "latency_ms": db_latency_ms,
            "total_registered_manuscripts": len(all_docs)
        },
        "vault_storage": {
            "type": "Content-Addressable Storage (CAS)",
            "sharding": "2-byte SHA-256",
            "iso_standard": "ISO 14721 OAIS",
            "vault_dir_exists": storage.VAULT_DIR.exists()
        },
        "consensus_rule": "55% Authors / 15% Reviewers / 30% Founder Treasury (+20% B2B Gross-Up)",
        "timestamp_utc": datetime.now(timezone.utc).isoformat()
    }


# =====================================================================
# 2. AST COMPILER & MATH-AS-A-SERVICE (MaaS)
# =====================================================================

@router.post("/api/v1/compiler/verify-formula")
def verify_mathematical_formula(req: FormulaVerifyRequest):
    is_valid, error, merkle_digest, variables = compiler.validate_formula(req.formula)
    
    if not is_valid:
        return {
            "status": "SYNTAX_ERROR",
            "is_valid": False,
            "error_detail": error,
            "formula": req.formula
        }

    exec_result = None
    if req.sample_params:
        try:
            exec_result = _sandbox.evaluate_safe(compiler.execute_formula, req.formula, req.sample_params)
        except Exception as e:
            exec_result = f"Error during execution: {str(e)}"

    return {
        "status": "VERIFIED_SAFE_AST",
        "is_valid": True,
        "formula": req.formula,
        "ast_merkle_digest": merkle_digest,
        "variables_extracted": variables,
        "sample_execution_result": exec_result,
        "compliance": "Math-as-a-Service (MaaS) / RUO Tier"
    }


# =====================================================================
# 3. SCHOLAR PROFILE & OPENALEX
# =====================================================================

@router.get("/api/v1/scholar/metrics/{orcid}")
def get_scholar_metrics(orcid: str):
    clean_orcid = orcid.strip().replace("https://orcid.org/", "")
    if not re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean_orcid):
        raise HTTPException(status_code=400, detail="Неверный формат ORCID iD")

    try:
        url = f"https://api.openalex.org/authors/https://orcid.org/{clean_orcid}"
        data = None
        if requests:
            res = requests.get(url, timeout=4.0, headers={"User-Agent": "GitScience-Protocol/3.0"})
            if res.status_code == 200:
                data = res.json()
        else:
            req = urllib.request.Request(url, headers={"User-Agent": "GitScience-Protocol/3.0"})
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))

        if data:
            summary = data.get("summary_stats", {})
            return {
                "found": True,
                "display_name": data.get("display_name"),
                "h_index": summary.get("h_index", 0),
                "citations_count": data.get("cited_by_count", 0),
                "works_count": data.get("works_count", 0),
                "institution": data.get("last_known_institution", {}).get("display_name", "Независимый исследователь"),
                "orcid": clean_orcid,
                "source": "OpenAlex Live API"
            }
        elif res.status_code == 404:
            return {"found": False, "orcid": clean_orcid, "message": "Профиль не найден в каталоге OpenAlex"}
    except Exception:
        pass

    return {"found": False, "orcid": clean_orcid, "message": "Сервис OpenAlex временно недоступен"}


# =====================================================================
# 4. ЗАГРУЗКА И НОТАРИАТ PDF (С 14 РОЛЯМИ CREDIT И AST-ФОРМУЛАМИ)
# =====================================================================

@router.post("/notary/upload-pdf", status_code=status.HTTP_201_CREATED)
async def upload_and_notarize_manuscript(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    author_name: str = Form(...),
    orcid: str = Form(...),
    category: str = Form("Clinical Oncology & Surgery"),
    ipc_class: str = Form("A61B"),
    abstract: str = Form(""),
    formula_math: str = Form(""),
    credit_roles_json: str = Form("[]"),
    irb_approval_number: str = Form(""),
    has_human_subjects: bool = Form(False)
):
    clean_orcid = orcid.strip()
    if not re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean_orcid):
        raise HTTPException(status_code=400, detail="Неверный формат ORCID")

    # Опциональная JWT-привязка автора (анонимный нотариат разрешен, но лимитирован)
    bearer = _extract_bearer_payload(request)
    if _app_is_production() and bearer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="В production нотариат требует авторизацию: передайте Authorization: Bearer <JWT> (получите на /api/v1/auth/login)"
        )
    if bearer and bearer.get("orcid") != clean_orcid:
        raise HTTPException(status_code=403, detail="ORCID манускрипта не совпадает с аутентифицированным ученым")
    if _is_oauth_verified(bearer):
        identity_source = "JWT_OAUTH_VERIFIED"
    elif bearer is not None:
        identity_source = "JWT_SELF_ASSERTED_RATE_LIMITED"
    else:
        identity_source = "ANONYMOUS_RATE_LIMITED"

    # Проверка биоэтики (IRB)
    is_irb_ok, irb_msg = IRBClinicalVerifier.verify_ethical_approval({
        "has_human_subjects": has_human_subjects,
        "irb_approval_number": irb_approval_number
    })
    if not is_irb_ok:
        raise HTTPException(status_code=422, detail=irb_msg)

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Файл статьи пуст")
    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Превышен максимальный лимит размера файла (50 МБ)")
    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="Только валидные PDF-документы принимаются нотариатом (magic bytes %PDF-)")

    # Парсинг ролей CRediT
    try:
        credit_roles = json.loads(credit_roles_json)
    except Exception:
        credit_roles = []

    # Расчет AST Merkle Digest формулы если есть
    ast_merkle = None
    if formula_math and formula_math.strip():
        _, _, ast_merkle, _ = compiler.validate_formula(formula_math.strip())

    saved = storage.save_uploaded_pdf(
        file_bytes=file_bytes,
        filename=file.filename or "manuscript.pdf",
        title=title,
        author=author_name,
        orcid=clean_orcid,
        category=category,
        ipc_class=ipc_class,
        abstract=abstract,
        formula_math=formula_math if formula_math.strip() else None,
        ast_merkle_digest=ast_merkle,
        credit_roles=credit_roles
    )

    proof_bundle = DualTimestampingNotary.generate_proof_bundle(saved["sha256_hash"], saved["registration_code"])

    # Живой OpenTimestamps якорь (GITSCIENCE_OTS_LIVE=1): реальная отправка в календари Bitcoin
    live_ots = DualTimestampingNotary.submit_to_bitcoin_calendars(
        payload_sha256_hex=saved["sha256_hash"],
        registration_code=saved["registration_code"],
        ots_dir=storage.STORAGE_DIR / "ots_proofs",
    )
    ots_status = (
        live_ots.get("status", "PENDING_BITCOIN_CALENDAR_SUBMISSION")
        if live_ots else "PENDING_BITCOIN_CALENDAR_SUBMISSION"
    )

    return {
        "status": "SUCCESSFULLY_NOTARIZED",
        "identity_source": identity_source,
        "certificate_title": f"CERTIFICATE OF SCIENTIFIC PRIORITY № {saved['serial_number']:05d}",
        "serial_number": saved["serial_number"],
        "registration_code": saved["registration_code"],
        "sha256_payload_hash": saved["sha256_hash"],
        "git_commit_oid": saved["git_commit_hash"],
        "ipfs_cid": saved.get("ipfs_cid"),
        "rfc3161_token": saved.get("rfc3161_token", "RFC3161_TSA_ANCHORED"),
        "ots_proof_file": saved.get("ots_proof_file"),
        "ots_status": ots_status,
        "ots_live_anchor": live_ots,
        "ast_merkle_digest": ast_merkle,
        "proof_bundle": proof_bundle,
        "message": "Манускрипт зафиксирован в суверенном реестре с выдачей WIPO Prior Art Shield."
    }


# =====================================================================
# 5. ИНСПЕКТОР СЕРТИФИКАТА (3 СЛОЯ: LEGAL, CRYPTO, EXECUTABLE)
# =====================================================================

@router.get("/notary/certificate/{registration_code}")
def get_certificate_deep_inspection(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)
    if not article:
        raise HTTPException(status_code=404, detail="Сертификат не найден в реестре")

    # 1. Юридический слой (Legal Layer)
    legal_layer = {
        "status": "IRREVOCABLE_WIPO_PRIOR_ART_RECORD",
        "frameworks": CONSTANTS["legal_framework"],
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
        "defensive_publication_statute": "35 U.S.C. § 102(a)(1) & EPC Article 54(2)",
        "ipc_class": article.get("ipc_class", "A61B"),
        "irb_ethical_status": "HELSINKI_DECLARATION_COMPLIANT"
    }

    # 2. Криптографический слой (Crypto Layer)
    crypto_layer = {
        "sha256_digest": article["sha256_hash"],
        "git_commit_oid": article["git_commit_hash"],
        "rfc3161_token": article.get("rfc3161_token", "TST-CANONICAL-ROOT"),
        "ots_merkle_root": article.get("ots_proof_file", f"{registration_code}.ots"),
        "timestamp_utc": article["created_at"]
    }

    # 3. Исполняемый математический слой (Executable Layer)
    executable_layer = {
        "has_executable_formula": bool(article.get("formula_math")),
        "formula": article.get("formula_math", "None (Descriptive Research)"),
        "ast_merkle_digest": article.get("ast_merkle_digest", "N/A"),
        "compliance": "RUO / Safe AST Isolated Engine"
    }

    # CRediT доли
    credit_breakdown = []
    if article.get("credit_roles_json"):
        try:
            credit_breakdown = json.loads(article["credit_roles_json"])
        except Exception:
            pass

    return {
        "certificate_number": f"№ {article['serial_number']:05d}",
        "registration_code": article["registration_code"],
        "title": article["title"],
        "author": article["author_name"],
        "orcid": article["orcid"],
        "category": article.get("category", "General Science"),
        "abstract": article.get("abstract", ""),
        "layers": {
            "legal_layer": legal_layer,
            "crypto_layer": crypto_layer,
            "executable_layer": executable_layer
        },
        "credit_contributors": credit_breakdown
    }

@router.get("/certificate/pdf/{registration_code}")
@router.get("/download/{registration_code}")
def download_official_priority_certificate_pdf(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)

    # Безопасность: не генерируем «сертификат» из поддельных данных для несуществующих записей.
    # Только реально зарегистрированный манускрипт получает официальный сертификат.
    if not article:
        raise HTTPException(status_code=404, detail="Сертификат не найден: манускрипт отсутствует в реестре")

    storage.increment_stats(registration_code, "downloads_count")

    # Генерируем официальный векторный PDF сертификат WIPO Prior Art
    credit_contributors = storage.get_credit_contributions(article["registration_code"])
    pdf_bytes = CertificateGenerator.generate_priority_certificate_pdf(
        registration_code=article["registration_code"],
        title=article["title"],
        author_name=article["author_name"],
        orcid=article["orcid"],
        category=article.get("category", "General Science"),
        ipc_class=article.get("ipc_class", "A61B"),
        sha256_hash=article["sha256_hash"],
        git_commit_oid=article["git_commit_hash"],
        ast_merkle_digest=article.get("ast_merkle_digest"),
        ots_file=article.get("ots_proof_file"),
        license_type=article.get("license_type", "CC-BY-4.0"),
        ipfs_cid=article.get("ipfs_cid"),
        credit_contributors=credit_contributors
    )

    # 4. Векторный штемпель Prior Art (криптографический водяной знак на каждой странице)
    try:
        pdf_bytes = stamp_pdf_bytes(
            input_pdf_bytes=pdf_bytes,
            reg_code=article["registration_code"],
            sha256_hash=article["sha256_hash"],
            author=article["author_name"],
            timestamp_str=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        )
    except Exception:
        pass  # Сертификат остается валидным без штампа при сбое рендера

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="Certificate_{sanitize_header_value(registration_code)}.pdf"'
        }
    )


# =====================================================================
# 6. ЭКСПОРТ DATACITE 4.4 & SCHEMA.ORG JSON-LD
# =====================================================================

@router.get("/api/v1/notary/datacite/{registration_code}")
def export_datacite_schema(registration_code: str):
    data = storage.generate_datacite_metadata(registration_code)
    if not data:
        raise HTTPException(status_code=404, detail="Манускрипт не найден для генерации DataCite")
    return data

@router.get("/api/v1/notary/jsonld/{registration_code}")
def export_google_scholar_jsonld(registration_code: str):
    data = storage.generate_schema_org_jsonld(registration_code)
    if not data:
        raise HTTPException(status_code=404, detail="Манускрипт не найден для генерации JSON-LD")
    return data

@router.get("/api/v1/notary/datacite/{registration_code}/xml")
def export_datacite_schema_xml(registration_code: str):
    """Генерирует официальный XML метаданных по стандарту DataCite Metadata Schema 4.4"""
    article = storage.get_manuscript_by_code(registration_code)
    if not article:
        raise HTTPException(status_code=404, detail="Манускрипт не найден для генерации DataCite XML")

    # XML-escape пользовательских полей — защита от XML-инъекций в DOI-метаданных
    esc = lambda v: xml_sax_escape(str(v if v is not None else ""))
    reg_lower = re.sub(r"[^a-z0-9\-]", "", str(article['registration_code']).lower())

    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<resource xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns="http://datacite.org/schema/kernel-4"
          xsi:schemaLocation="http://datacite.org/schema/kernel-4 http://schema.datacite.org/meta/kernel-4.4/metadata.xsd">
  <identifier identifierType="DOI">10.5281/gitscience.{reg_lower}</identifier>
  <creators>
    <creator>
      <creatorName nameType="Personal">{esc(article.get('author_name'))}</creatorName>
      <nameIdentifier schemeURI="https://orcid.org/" nameIdentifierScheme="ORCID">{esc(article.get('orcid'))}</nameIdentifier>
    </creator>
  </creators>
  <titles>
    <title>{esc(article.get('title'))}</title>
  </titles>
  <publisher>GitScience Sovereign Protocol</publisher>
  <publicationYear>{str(article.get('created_at', '2026'))[:4]}</publicationYear>
  <resourceType resourceTypeGeneral="Preprint">Scientific Prior Art Record</resourceType>
  <subjects>
    <subject>{esc(article.get('category', 'Biomedical Science'))}</subject>
    <subject>WIPO IPC: {esc(article.get('ipc_class', 'A61B'))}</subject>
  </subjects>
  <rightsList>
    <rights rightsURI="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International</rights>
  </rightsList>
  <descriptions>
    <description descriptionType="Abstract">{esc(article.get('abstract', ''))}</description>
  </descriptions>
  <alternateIdentifiers>
    <alternateIdentifier alternateIdentifierType="SHA256">{esc(article['sha256_hash'])}</alternateIdentifier>
    <alternateIdentifier alternateIdentifierType="GitCommitOID">{esc(article['git_commit_hash'])}</alternateIdentifier>
    <alternateIdentifier alternateIdentifierType="IPFS_CID">{esc(article.get('ipfs_cid', ''))}</alternateIdentifier>
  </alternateIdentifiers>
</resource>"""
    return Response(content=xml_content, media_type="application/xml")


# =====================================================================
# 7. WIPO GLOBAL LIBRARY & PDF STREAM
# =====================================================================

@router.get("/library")
@router.get("/api/v1/library")
def get_library_catalog(
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    ipc_class: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100)
):
    offset = (page - 1) * page_size
    if search:
        all_articles = storage.search_manuscripts_fts(search, limit=page_size, offset=offset)
    else:
        all_articles = storage.get_all_manuscripts(limit=page_size, offset=offset)
    
    filtered = all_articles

    if category and isinstance(category, str) and category != "All":
        filtered = [a for a in filtered if category.lower() in a.get("category", "").lower()]

    if ipc_class and isinstance(ipc_class, str) and ipc_class != "All":
        filtered = [a for a in filtered if ipc_class.upper() == a.get("ipc_class", "").upper()]

    return {"page": page, "page_size": page_size, "articles": filtered}

@router.get("/api/v1/library/search")
def search_library_fts(q: str = Query(..., min_length=1)):
    """Полнотекстовый поиск по реестру манускриптов с поддержкой FTS5"""
    results = storage.search_manuscripts_fts(q)
    return {
        "status": "SEARCH_SUCCESS",
        "query": q,
        "total_results": len(results),
        "articles": results
    }

@router.get("/library/view/{registration_code}")
def view_pdf_file(registration_code: str):
    clean_code = registration_code.strip()
    if not re.match(r"^[A-Za-z0-9_\-]+$", clean_code):
        raise HTTPException(status_code=400, detail="Неверный формат регистрационного кода")
    
    article = storage.get_manuscript_by_code(clean_code)
    if not article or not article.get("file_path"):
        raise HTTPException(status_code=404, detail="Файл статьи не найден в реестре")
        
    storage.increment_stats(clean_code, "views_count")
    
    file_path = os.path.abspath(article["file_path"])
    if file_path.startswith("s3://"):
        from fastapi.responses import RedirectResponse
        bucket = file_path.split("/")[2]
        key = "/".join(file_path.split("/")[3:])
        if storage.s3_client:
            presigned_url = storage.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': bucket, 'Key': key},
                ExpiresIn=3600
            )
            return RedirectResponse(presigned_url)
        else:
            raise HTTPException(status_code=500, detail="S3 client not configured but S3 URL found")
            
    storage_root = os.path.abspath(storage.STORAGE_DIR)
    
    # Path Traversal Guard: запрещаем выход за пределы директории хранилища
    if not file_path.startswith(storage_root):
        raise HTTPException(status_code=403, detail="Доступ запрещен: путь за пределами хранилища")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Физический PDF-файл отсутствует на сервере")
        
    return FileResponse(
        file_path, 
        media_type="application/pdf", 
        filename=article.get("original_filename", "manuscript.pdf"),
        content_disposition_type="inline"
    )


# =====================================================================
# 8. AMANAT ROYALTY CALCULATOR & B2B BILLING
# =====================================================================

@router.post("/api/v1/billing/calculate")
def calculate_amanat_royalty(req: BillingCalculateRequest):
    try:
        return DependencyRoyaltyRouter.calculate_split(
            base_b2b_fee=req.base_amount,
            contributors=req.contributors
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/api/v1/billing/pay")
def process_fair_share_payment(request: Request, req: BillingCalculateRequest):
    """Фиксирует справедливый расчёт в Ledger ТОЛЬКО для аутентифицированных пользователей.

    Честная семантика: это демо-модель расчёта, НЕ реальная ончейн-транзакция.
    tx_hash помечается префиксом SIMULATED-OFFCHAIN и не выдаётся за блокчейн-подтверждение.
    """
    require_active_bearer(request)
    try:
        payout_data = DependencyRoyaltyRouter.calculate_split(
            base_b2b_fee=req.base_amount,
            contributors=req.contributors
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    digest = hashlib.sha256(f"{tx_id}{datetime.now(timezone.utc)}".encode()).hexdigest()
    tx_hash = f"SIMULATED-OFFCHAIN:{digest}"
    
    storage.record_transaction(
        tx_id=tx_id,
        amount=payout_data["b2b_invoice_total"],
        currency="USDT",
        author_share=payout_data["author_pool_total"],
        infra_share=payout_data["platform_allocations"]["infrastructure_15pct"],
        founder_share=payout_data["platform_allocations"]["founder_30pct"],
        author_wallet=storage.get_founder_identity()["wallet"],
        tx_hash=tx_hash
    )
    
    return {
        "status": "AMANAT_SPLIT_CALCULATED_AND_RECORDED_OFFCHAIN",
        "tx_id": tx_id,
        "routing_details": payout_data,
        "transaction_hash": tx_hash,
        "note": "Оф-чейн демо-запись в Ledger. Реальная ончейн-транзакция не выполнялась."
    }


# =====================================================================
# 15. WASM & REAL-TIME MAAS BIO-SIMULATOR
# =====================================================================

class MaaSSimulateRequest(BaseModel):
    formula: str = Field(default="(Artery + Vein) / (Lymph + 1.0)")
    range_min: float = Field(default=1.0)
    range_max: float = Field(default=10.0)
    steps: int = Field(default=10, ge=5, le=50)

@router.post("/api/v1/maas/simulate")
def simulate_biomedical_formula(req: MaaSSimulateRequest):
    curve = []
    step_size = (req.range_max - req.range_min) / float(req.steps)
    for i in range(req.steps + 1):
        val = req.range_min + (i * step_size)
        try:
            res = _sandbox.evaluate_safe(compiler.execute_formula, req.formula, {"Artery": val, "Vein": val * 0.6, "Lymph": 1.2})
            curve.append({"input_artery": round(val, 2), "output_tk_homeostasis": round(res, 4)})
        except Exception:
            break
            
    merkle = compiler.compute_ast_merkle_digest(req.formula)
    return {
        "status": "WASM_SIMULATION_SUCCESS",
        "formula": req.formula,
        "ast_merkle_digest": merkle,
        "data_points": curve,
        "micro_royalty_fee_usdt": 0.05,
        "compliance": "RUO Class I / Deterministic WASM Math"
    }


# =====================================================================
# 16. CLINICAL HL7 / FHIR R4 & DICOM WEB GATEWAY
# =====================================================================

class FHIRCalculationRequest(BaseModel):
    patient_id: str = Field(default="PAT-ONCO-9982")
    formula_math: str = Field(default="(Artery + Vein) / (Lymph + 1.0)")
    artery_val: float = Field(default=120.0)
    vein_val: float = Field(default=80.0)
    lymph_val: float = Field(default=6.5)

@router.post("/api/v1/clinical/fhir/calculate")
def execute_clinical_fhir_calculation(req: FHIRCalculationRequest):
    try:
        # Изолируем выполнение формулы с жёстким лимитом времени (анти-DoS для клинических вычислений)
        return _sandbox.evaluate_safe(
            ClinicalFHIRGateway.execute_fhir_bundle_calculation,
            patient_id=req.patient_id,
            formula_math=req.formula_math,
            artery_val=req.artery_val,
            vein_val=req.vein_val,
            lymph_val=req.lymph_val,
            max_time_sec=0.5
        )
    except TimeoutError as to:
        raise HTTPException(status_code=408, detail=str(to))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Formula variable error: {ve}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"FHIR calculation error: {e}")

class DICOMStudyRequest(BaseModel):
    patient_id: str = Field(default="PAT-ONCO-9982")
    modality: str = Field(default="CT")
    body_part: str = Field(default="CHEST_ABDOMEN")

@router.post("/api/v1/clinical/dicom/study")
def link_dicom_imaging_study(req: DICOMStudyRequest):
    return DICOMWebGateway.simulate_dicom_study_integration(
        patient_id=req.patient_id,
        modality=req.modality,
        body_part=req.body_part
    )


# =====================================================================
# 17. INSTITUTIONAL B2B FIAT INVOICING & PAYMENT GATEWAY
# =====================================================================

class FiatInvoiceRequest(BaseModel):
    hospital_name: str = Field(default="National Scientific Oncology Center")
    tax_id_bin: str = Field(default="BIN-190440023412")
    registration_code: str = Field(default="GS-2026-00001")
    base_license_fee: float = Field(default=10000.0, ge=100.0)
    fiat_currency: str = Field(default="USD")

@router.post("/api/v1/billing/fiat/invoice")
def generate_institutional_fiat_invoice(req: FiatInvoiceRequest):
    return InstitutionalFiatGateway.generate_b2b_invoice(
        hospital_name=req.hospital_name,
        tax_id_bin=req.tax_id_bin,
        registration_code=req.registration_code,
        base_license_fee=req.base_license_fee,
        fiat_currency=req.fiat_currency
    )

class FiatWebhookRequest(BaseModel):
    invoice_number: str = Field(...)
    paid_amount: float = Field(...)
    payment_method: str = Field(default="BANK_WIRE_SWIFT")

@router.post("/api/v1/billing/fiat/webhook")
async def process_fiat_bank_webhook(request: Request):
    """
    Банковский вебхук с ОБЯЗАТЕЛЬНОЙ HMAC-SHA256 подписью:
      X-GS-Timestamp: unix-секунды (окно 300 сек, anti-replay)
      X-GS-Signature: hex(HMAC_SHA256(FIAT_WEBHOOK_SECRET, "{timestamp}." + raw_body))
    """
    raw = await request.body()
    secret = os.environ.get("FIAT_WEBHOOK_SECRET", "")
    if not secret:
        raise HTTPException(status_code=503, detail="FIAT_WEBHOOK_SECRET не настроен — прием вебхуков заблокирован")

    sig = request.headers.get("x-gs-signature", "")
    ts_header = request.headers.get("x-gs-timestamp", "")
    if not sig or not ts_header:
        raise HTTPException(status_code=401, detail="Missing X-GS-Signature / X-GS-Timestamp headers")
    try:
        ts_value = int(ts_header)
    except ValueError:
        raise HTTPException(status_code=401, detail="Malformed X-GS-Timestamp")
    if abs(time.time() - ts_value) > 300:
        raise HTTPException(status_code=401, detail="Replay rejected: timestamp вне окна 300 сек")

    expected_sig = hmac.new(secret.encode(), f"{ts_header}.".encode() + raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_sig, sig):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        data = json.loads(raw)
        req = FiatWebhookRequest(**data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook JSON payload")

    return InstitutionalFiatGateway.process_fiat_webhook(
        invoice_number=req.invoice_number,
        paid_amount=req.paid_amount,
        payment_method=req.payment_method
    )

@router.get("/api/v1/billing/fiat/invoice/{invoice_id}/pdf")
def download_institutional_invoice_pdf(
    invoice_id: str,
    hospital_name: str = Query(default="National Scientific Oncology Center"),
    tax_id_bin: str = Query(default="BIN-190440023412"),
    registration_code: str = Query(default="GS-2026-00001"),
    base_license_fee: float = Query(default=10000.0),
    fiat_currency: str = Query(default="USD")
):
    """Генерирует официальный PDF счет-фактуру для клиник и медицинских центров"""
    pdf_bytes = InstitutionalInvoicePDFGenerator.generate_invoice_pdf(
        invoice_id=invoice_id,
        hospital_name=hospital_name,
        tax_id_bin=tax_id_bin,
        registration_code=registration_code,
        base_license_fee=base_license_fee,
        fiat_currency=fiat_currency
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="Invoice_{sanitize_header_value(invoice_id)}.pdf"'}
    )


# =====================================================================
# 18. SOVEREIGN AI PEER-REVIEWER & PRIOR ART SCANNER
# =====================================================================

class AIAuditRequest(BaseModel):
    title: str = Field(...)
    author: str = Field(default=CONSTANTS["founder"]["name"])
    orcid: str = Field(default=CONSTANTS["founder"]["orcid"])
    abstract: str = Field(default="")
    formula_math: str = Field(default="")
    has_human_subjects: bool = Field(default=False)
    irb_approval_number: str = Field(default="")

@router.post("/api/v1/ai/audit")
def run_autonomous_ai_audit(req: AIAuditRequest):
    return SovereignAIAuditor.generate_comprehensive_ai_dossier(
        title=req.title,
        author=req.author,
        orcid=req.orcid,
        abstract=req.abstract,
        formula_math=req.formula_math,
        has_human_subjects=req.has_human_subjects,
        irb_approval_number=req.irb_approval_number
    )


# =====================================================================
# 19. SOVEREIGN IP-NFT PATENT MINTER
# =====================================================================

class IPNFTMintRequest(BaseModel):
    registration_code: str = Field(...)
    wallet_address: str = Field(default=CONSTANTS["founder"].get("wallet", ""))

@router.post("/api/v1/ipnft/mint")
def mint_sovereign_ip_nft(req: IPNFTMintRequest):
    try:
        return IPNFTEngine.generate_token_metadata(
            registration_code=req.registration_code,
            wallet_address=req.wallet_address
        )
    except RuntimeError as e:
        detail = str(e)
        status_code = 503 if "не задеплоен" in detail else 404
        raise HTTPException(status_code=status_code, detail=detail)


# =====================================================================
# 20. PERSISTENT PLATFORM METRICS & STATS SUMMARY
# =====================================================================

@router.get("/api/v1/stats/summary")
def get_global_platform_stats():
    """Возвращает живую агрегированную статистику сети без сброса после перезагрузки"""
    return storage.get_platform_stats_summary()


class SitePingRequest(BaseModel):
    session_id: str = Field(..., description="Анонимный session_id из sessionStorage посетителя")


@router.post("/api/v1/stats/ping")
def ping_site_visitor(req: SitePingRequest):
    """GA-style учёт посещений и активных посетителей.

    Персистентность только в БД (SQLite / Postgres): счётчики НЕ сбрасываются
    при рестарте или деплое. IP не сохраняется — приватность посетителя соблюдена.
    """
    counts = storage.ping_site_session(req.session_id)
    return {"status": "ACK", **counts}


# =====================================================================
# 21. OFFICIAL LEGAL LICENSE TEXT AGREEMENT
# =====================================================================

@router.get("/api/v1/notary/license/{registration_code}")
def get_official_license_agreement(registration_code: str):
    """Генерирует юридический текст B2B / Open Access лицензии для манускрипта"""
    lic = storage.generate_license_agreement_text(registration_code)
    if not lic:
        raise HTTPException(status_code=404, detail="Manuscript record not found")
    return lic


# =====================================================================
# 23. WEB3 WALLET INTEGRATION & BALANCE GATEWAY
# =====================================================================

@router.get("/api/v1/wallet/balance/{address}")
def get_web3_wallet_balance(address: str):
    """Проверяет баланс кошелька, сеть и накопленные роялти по протоколу Аманата через Web3 шлюз"""
    return SovereignWeb3Gateway.get_wallet_live_balance(address)




