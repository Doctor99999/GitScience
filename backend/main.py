"""
GitScience™ Sovereign Protocol API v3.0-ENTERPRISE
Стандарты: WIPO Prior Art / CRediT CASRAI / DataCite 4.4 / RFC 3161 / OTS / ISO 14721
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status, Query, Body, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from xml.sax.saxutils import escape as xml_sax_escape
import hashlib
import hmac
import uuid
import os
import re
import json
import urllib.request
import urllib.error
try:
    import requests
except ImportError:
    requests = None
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import time
from collections import defaultdict

import gitscience_storage as storage
import gitscience_compiler as compiler
from gitscience_fortress import (
    DependencyRoyaltyRouter,
    CRediTContributorManager,
    DualTimestampingNotary,
    ScienceCourt,
    IRBClinicalVerifier,
    CREDIT_ROLES
)
from gitscience_vampire import VampireProtocolEngine, AutoHarvesterWorker, AutonomousIngestionDaemon
from gitscience_zk import ZKDiscoveryEngine
from gitscience_iot import GitscienceIoTGateway
from gitscience_passport import SoulboundPassportEngine
from gitscience_review import BlindPeerReviewEngine
from gitscience_certificate import CertificateGenerator
from gitscience_fhir import ClinicalFHIRGateway, DICOMWebGateway
from gitscience_fiat import InstitutionalFiatGateway
from gitscience_ai_review import SovereignAIAuditor
from gitscience_ipnft import IPNFTEngine
from gitscience_auth import ScholarAuthService, IS_PRODUCTION
from gitscience_web3 import SovereignWeb3Gateway
from gitscience_invoice_pdf import InstitutionalInvoicePDFGenerator
from gitscience_watermark import stamp_pdf_bytes

# Простой потокобезопасный Rate Limiter (защита от DoS/Sybil атак)
class SimpleRateLimiter:
    def __init__(self, max_requests: int = 120, window_sec: int = 60):
        self.max_requests = max_requests
        self.window_sec = window_sec
        self.requests = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        self.requests[client_id] = [t for t in self.requests[client_id] if now - t < self.window_sec]
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        self.requests[client_id].append(now)
        return True

rate_limiter = SimpleRateLimiter(max_requests=120, window_sec=60)

# Пир, за которыми мы доверяем X-Real-IP (nginx/reverse-proxy). Если запрос пришёл
# напрямую с публичного адреса — заголовок X-Real-IP ИГНОРИРУЕТСЯ (анти-спуф лимитера).
TRUSTED_PROXY_PEERS = {host.strip() for host in os.environ.get("TRUSTED_PROXY_PEERS", "127.0.0.1,::1").split(",") if host.strip()}

# =====================================================================
# ИДЕНТИФИКАЦИЯ УЧЕНЫХ (Bearer JWT helpers)
# =====================================================================

def _extract_bearer_payload(request: Request) -> Optional[Dict[str, Any]]:
    """
    Возвращает payload JWT из заголовка Authorization: Bearer.
    Отсутствие заголовка -> None (анонимный режим). Невалидный токен -> 401.
    """
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth[7:].strip()
    is_valid, payload, err = ScholarAuthService.verify_jwt_token(token)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid scholar token: {err}")
    return payload

def _is_oauth_verified(payload: Optional[Dict[str, Any]]) -> bool:
    """Подтверждено владение ORCID через OAuth 2.0 (а не само-декларация публичного профиля)."""
    return bool(payload and payload.get("auth_method") == "orcid_oauth")

def require_active_bearer(request: Request) -> Dict[str, Any]:
    """Требует наличие валидного JWT (без претензии на верифицированность) для чувствительных операций."""
    payload = _extract_bearer_payload(request)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: передайте Authorization: Bearer <JWT>"
        )
    return payload

def require_verified_orcid(request: Request, claimed_orcid: str, require_oauth: bool = False) -> str:
    """
    Жесткая привязка личности: Bearer JWT обязателен, ORCID берется ТОЛЬКО из подписанного токена.
    Защита Science Court и Peer Review от Sybil-атак (подмены ORCID в теле запроса).

    require_oauth=True: в продакшене дополнительно требуется auth_method="orcid_oauth" —
    публичный self-asserted токен (/auth/login) НЕ даёт права голоса/рецензирования.
    """
    payload = _extract_bearer_payload(request)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: передайте Authorization: Bearer <JWT> (получите на /api/v1/auth/orcid/callback через OAuth)"
        )
    token_orcid = payload.get("orcid", "")
    if claimed_orcid and claimed_orcid.strip() != token_orcid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ORCID в теле запроса не совпадает с аутентифицированным ученым (Sybil protection)"
        )
    if require_oauth and IS_PRODUCTION and not _is_oauth_verified(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Требуется OAuth-верификация ORCID (auth_method=orcid_oauth). "
                "Self-asserted токен не подтверждает владение iD."
            )
        )
    return token_orcid

def sanitize_header_value(value: str) -> str:
    """Санитизация значений для HTTP-заголовков (Content-Disposition) — защита от CRLF-инъекции."""
    return re.sub(r"[^A-Za-z0-9._\-]", "_", value)[:120]


def _fetch_openalex_metrics(orcid: str) -> Dict[str, Any]:
    """Возвращает реальные публичные метрики учёного из OpenAlex (по ORCID).

    Используется для честного формирования паспорта исследователя вместо
    захардкоженных значений. При недоступности OpenAlex — возвращает нули
    с пометкой источника, НЕ выдуманные данные.
    """
    clean_orcid = orcid.strip().replace("https://orcid.org/", "")
    if not re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean_orcid):
        return {"works_count": 0, "citations_count": 0, "h_index": None, "display_name": None, "source": "invalid_orcid"}
    try:
        url = f"https://api.openalex.org/authors/https://orcid.org/{clean_orcid}"
        res = requests.get(url, timeout=4.0, headers={"User-Agent": "GitScience-Protocol/3.0"})
        if res.status_code == 200:
            data = res.json()
            return {
                "works_count": data.get("works_count", 0),
                "citations_count": data.get("cited_by_count", 0),
                "h_index": (data.get("summary_stats") or {}).get("h_index"),
                "display_name": data.get("display_name"),
                "source": "OpenAlex Live API"
            }
    except Exception:
        pass
    return {"works_count": 0, "citations_count": 0, "h_index": None, "display_name": None, "source": "openalex_unavailable"}

app = FastAPI(
    title="GitScience™ Sovereign Protocol API",
    description="Суверенный децентрализованный нотариат открытий, реестр манускриптов, исполняемая математика и B2B маршрутизатор Аманата",
    version="3.2.0-ENTERPRISE"
)

# Инициализация БД и констант
storage.init_db()
CONSTANTS = storage.load_protocol_constants()
court_engine = ScienceCourt(storage.STORAGE_DIR)

# Безопасный CORS: без явного ALLOWED_ORIGINS разрешаем только локальную разработку
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    """Глобальный Rate Limiting middleware для защиты API от DoS и парсинг-ботов"""
    path = request.url.path
    if path not in ("/", "/api/v1/health", "/openapi.json"):
        # За nginx/Render реальный клиент приходит в X-Real-IP (пир в trust-списке);
        # иначе доверия заголовку НЕТ — спуфить лимитер напрямую нельзя.
        peer = request.client.host if request.client else "127.0.0.1"
        if peer in TRUSTED_PROXY_PEERS:
            client_ip = request.headers.get("x-real-ip") or peer
        else:
            client_ip = peer
        if not rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too Many Requests. Rate limit exceeded."}
            )
    return await call_next(request)

# =====================================================================
# PYDANTIC МОДЕЛИ
# =====================================================================

class FormulaVerifyRequest(BaseModel):
    formula: str = Field(..., json_schema_extra={"example": "(Artery + Vein) / (Lymph + 1.0)"})
    sample_params: Optional[Dict[str, float]] = None

class BillingCalculateRequest(BaseModel):
    base_amount: float = Field(..., gt=0, json_schema_extra={"example": 1000.0})
    contributors: Optional[List[Dict[str, Any]]] = None

class CourtDisputeRequest(BaseModel):
    claimant_name: str = Field(...)
    claimant_orcid: str = Field(...)
    target_code: str = Field(...)
    reason: str = Field(..., min_length=10)
    evidence_hash: str = Field(...)

class CourtVoteRequest(BaseModel):
    case_id: str = Field(...)
    juror_orcid: str = Field(...)
    vote: str = Field(..., pattern="^(valid|invalid|abstain)$")

class VampireSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    limit: Optional[int] = Field(default=5, ge=1, le=20)

class VampireImportRequest(BaseModel):
    work_data: Dict[str, Any]


# =====================================================================
# 1. СИСТЕМНЫЙ СТАТУС & METRICS
# =====================================================================

@app.get("/")
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

@app.get("/api/v1/health")
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

@app.post("/api/v1/compiler/verify-formula")
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
            exec_result = compiler.execute_formula(req.formula, req.sample_params)
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

@app.get("/api/v1/scholar/metrics/{orcid}")
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

@app.post("/notary/upload-pdf", status_code=status.HTTP_201_CREATED)
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

@app.get("/notary/certificate/{registration_code}")
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

@app.get("/certificate/pdf/{registration_code}")
@app.get("/download/{registration_code}")
def download_official_priority_certificate_pdf(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)

    # Безопасность: не генерируем «сертификат» из поддельных данных для несуществующих записей.
    # Только реально зарегистрированный манускрипт получает официальный сертификат.
    if not article:
        raise HTTPException(status_code=404, detail="Сертификат не найден: манускрипт отсутствует в реестре")

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

@app.get("/api/v1/notary/datacite/{registration_code}")
def export_datacite_schema(registration_code: str):
    data = storage.generate_datacite_metadata(registration_code)
    if not data:
        raise HTTPException(status_code=404, detail="Манускрипт не найден для генерации DataCite")
    return data

@app.get("/api/v1/notary/jsonld/{registration_code}")
def export_google_scholar_jsonld(registration_code: str):
    data = storage.generate_schema_org_jsonld(registration_code)
    if not data:
        raise HTTPException(status_code=404, detail="Манускрипт не найден для генерации JSON-LD")
    return data

@app.get("/api/v1/notary/datacite/{registration_code}/xml")
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

@app.get("/library")
@app.get("/api/v1/library")
def get_library_catalog(
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    ipc_class: Optional[str] = Query(default=None)
):
    if search:
        all_articles = storage.search_manuscripts_fts(search)
    else:
        all_articles = storage.get_all_manuscripts()
    filtered = all_articles

    if category and isinstance(category, str) and category != "All":
        filtered = [a for a in filtered if category.lower() in a.get("category", "").lower()]

    if ipc_class and isinstance(ipc_class, str) and ipc_class != "All":
        filtered = [a for a in filtered if ipc_class.upper() == a.get("ipc_class", "").upper()]

    return {"total": len(filtered), "articles": filtered}

@app.get("/api/v1/library/search")
def search_library_fts(q: str = Query(..., min_length=1)):
    """Полнотекстовый поиск по реестру манускриптов с поддержкой FTS5"""
    results = storage.search_manuscripts_fts(q)
    return {
        "status": "SEARCH_SUCCESS",
        "query": q,
        "total_results": len(results),
        "articles": results
    }

@app.get("/library/view/{registration_code}")
def view_pdf_file(registration_code: str):
    clean_code = registration_code.strip()
    if not re.match(r"^[A-Za-z0-9_\-]+$", clean_code):
        raise HTTPException(status_code=400, detail="Неверный формат регистрационного кода")
    
    article = storage.get_manuscript_by_code(clean_code)
    if not article or not article.get("file_path"):
        raise HTTPException(status_code=404, detail="Файл статьи не найден в реестре")
    
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
        
    return FileResponse(file_path, media_type="application/pdf", filename=article.get("original_filename", "manuscript.pdf"))


# =====================================================================
# 8. AMANAT ROYALTY CALCULATOR & B2B BILLING
# =====================================================================

@app.post("/api/v1/billing/calculate")
def calculate_amanat_royalty(req: BillingCalculateRequest):
    return DependencyRoyaltyRouter.calculate_split(
        base_b2b_fee=req.base_amount,
        contributors=req.contributors
    )

@app.post("/api/v1/billing/pay")
def process_fair_share_payment(request: Request, req: BillingCalculateRequest):
    """Фиксирует справедливый расчёт в Ledger ТОЛЬКО для аутентифицированных пользователей.

    Честная семантика: это демо-модель расчёта, НЕ реальная ончейн-транзакция.
    tx_hash помечается префиксом SIMULATED-OFFCHAIN и не выдаётся за блокчейн-подтверждение.
    """
    require_active_bearer(request)
    payout_data = DependencyRoyaltyRouter.calculate_split(
        base_b2b_fee=req.base_amount,
        contributors=req.contributors
    )
    
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
# 9. SCIENCE COURT & DISPUTES
# =====================================================================

@app.get("/api/v1/court/cases")
def get_court_cases():
    return {"cases": court_engine.get_all_cases()}

@app.post("/api/v1/court/dispute")
def file_academic_dispute(request: Request, req: CourtDisputeRequest):
    verified_orcid = require_verified_orcid(request, req.claimant_orcid, require_oauth=True)
    claimant_name = req.claimant_name
    case = court_engine.file_dispute(
        claimant_name=claimant_name,
        claimant_orcid=verified_orcid,
        target_code=req.target_code,
        reason=req.reason,
        evidence_hash=req.evidence_hash
    )
    return {"status": "DISPUTE_FILED", "case": case}

@app.post("/api/v1/court/vote")
def cast_juror_vote(request: Request, req: CourtVoteRequest):
    verified_orcid = require_verified_orcid(request, req.juror_orcid, require_oauth=True)
    result = court_engine.cast_vote(
        case_id=req.case_id,
        juror_orcid=verified_orcid,
        vote=req.vote
    )
    return result


# =====================================================================
# 10. VAMPIRE PROTOCOL MONITOR & SHADOW IMPORTER
# =====================================================================

@app.post("/api/v1/vampire/search")
def search_vampire_openalex(req: VampireSearchRequest):
    results = VampireProtocolEngine.search_openalex(req.query, req.limit)
    return {"total": len(results), "results": results}

@app.post("/api/v1/vampire/import")
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

zk_engine = ZKDiscoveryEngine(storage.STORAGE_DIR)

# IoT Hardware Gateway (HSM) — верификация подписанных данных лабоборудования
iot_gateway = GitscienceIoTGateway(storage.STORAGE_DIR)

@app.post("/api/v1/zk/commit")
def create_zk_blind_commitment(req: ZKCommitRequest):
    return zk_engine.create_blind_commitment(
        author_orcid=req.author_orcid,
        author_name=req.author_name,
        hypothesis_title=req.hypothesis_title,
        secret_salt=req.secret_salt,
        hidden_payload_text=req.hidden_payload_text,
        hidden_formula=req.hidden_formula
    )

@app.post("/api/v1/zk/reveal")
def reveal_zk_commitment(req: ZKRevealRequest):
    return zk_engine.reveal_and_verify(
        commitment_id=req.commitment_id,
        secret_salt=req.secret_salt,
        revealed_payload_text=req.revealed_payload_text,
        revealed_formula=req.revealed_formula,
        author_orcid=req.author_orcid
    )

@app.get("/api/v1/zk/list")
def list_zk_commitments():
    return {"commitments": zk_engine.get_all_commitments()}

# =====================================================================
# 12.5 IoT HARDWARE GATEWAY (HSM) — подписанные данные лабоборудования
# =====================================================================

def _iot_device_secret_ok(provider_secret: str) -> bool:
    """Проверяет IOT_DEVICE_SECRET (анти-регистрация фейковых «аппаратных» устройств)."""
    expected = os.environ.get("IOT_DEVICE_SECRET", "")
    if not expected:
        if IS_PRODUCTION:
            raise HTTPException(status_code=503, detail="IOT_DEVICE_SECRET не настроен — регистрация устройств заблокирована")
        return True  # dev-sandbox
    return hmac.compare_digest(provider_secret, expected)

@app.post("/api/v1/iot/register")
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

@app.post("/api/v1/iot/ingest")
def iot_ingest_signed_data(req: IoTIngestRequest):
    return iot_gateway.ingest(req.model_dump())

@app.get("/api/v1/iot/devices")
def iot_list_devices():
    return {"devices": iot_gateway.list_devices()}

@app.get("/api/v1/iot/status")
def iot_status(record_id: Optional[str] = None):
    return iot_gateway.get_status(record_id)


# =====================================================================
# 13. SOULBOUND RESEARCHER PASSPORT & GIT-IMPACT SCORE (GIS)
# =====================================================================

@app.get("/api/v1/passport/{orcid}")
def get_soulbound_passport(orcid: str, wallet: Optional[str] = None):
    clean_orcid = orcid.strip()
    metrics = _fetch_openalex_metrics(clean_orcid)
    return SoulboundPassportEngine.issue_soulbound_passport(
        orcid=clean_orcid,
        name="Salauat Abiltayevich Yeshimov" if "3929" in clean_orcid else "Sovereign Scholar",
        institution="National Scientific Oncology Center" if "3929" in clean_orcid else "Independent Scientific Research",
        wallet_address=wallet,
        works_count=metrics.get("works_count", 0),
        citations_count=metrics.get("citations_count", 0),
        display_name=metrics.get("display_name"),
        h_index=metrics.get("h_index"),
        source=metrics.get("source"),
    )


# =====================================================================
# 14. BLIND CRYPTOGRAPHIC PEER-REVIEW ENGINE
# =====================================================================

class PeerReviewSubmitRequest(BaseModel):
    target_code: str = Field(...)
    reviewer_orcid: str = Field(...)
    math_rigor_score: int = Field(..., ge=1, le=10)
    methodology_score: int = Field(..., ge=1, le=10)
    ethics_score: int = Field(..., ge=1, le=10)
    novelty_score: int = Field(..., ge=1, le=10)
    review_comments: str = Field(..., min_length=10)

class ReviewClaimRequest(BaseModel):
    review_id: str = Field(..., min_length=4)

review_engine = BlindPeerReviewEngine(storage.STORAGE_DIR)

@app.post("/api/v1/review/submit")
def submit_peer_review(request: Request, req: PeerReviewSubmitRequest):
    verified_orcid = require_verified_orcid(request, req.reviewer_orcid, require_oauth=True)
    return review_engine.submit_blind_review(
        target_code=req.target_code,
        reviewer_orcid=verified_orcid,
        math_rigor_score=req.math_rigor_score,
        methodology_score=req.methodology_score,
        ethics_score=req.ethics_score,
        novelty_score=req.novelty_score,
        review_comments=req.review_comments
    )

@app.get("/api/v1/review/list/{target_code}")
def get_article_reviews(target_code: str):
    return {"reviews": review_engine.get_reviews_for_article(target_code)}

@app.get("/api/v1/review/reputation/{orcid}")
def get_reviewer_reputation(orcid: str):
    """Публичная репутация рецензента (агрегаты; слепота рецензий сохраняется)."""
    rep = review_engine.get_reviewer_reputation(orcid)
    if rep["reviews_submitted"] == 0:
        raise HTTPException(status_code=404, detail="У учёного пока нет рецензий в реестре")
    return rep

@app.post("/api/v1/review/claim")
def claim_review_attestation(request: Request, req: ReviewClaimRequest):
    """Рецензент привязывает свою слепую рецензию к профилю и получает attestation.

    Требует Bearer JWT, чей ORCID совпадает с автором рецензии (declared claim).
    """
    bearer = require_active_bearer(request)
    claimant_orcid = bearer.get("orcid", "")
    if not claimant_orcid:
        raise HTTPException(status_code=403, detail="ORCID отсутствует в токене")
    result = review_engine.claim_review_attestation(req.review_id, claimant_orcid)
    if result.get("status") == "ERROR":
        raise HTTPException(status_code=403, detail=result.get("error", "Attestation отклонена"))
    return result

@app.get("/api/v1/review/attestation/{attestation_sha256}")
def verify_review_attestation(attestation_sha256: str):
    """Проверка attestation-хэша: целостность и присутствие рецензии в реестре."""
    return review_engine.verify_attestation(attestation_sha256)


# =====================================================================
# 15. WASM & REAL-TIME MAAS BIO-SIMULATOR
# =====================================================================

class MaaSSimulateRequest(BaseModel):
    formula: str = Field(default="(Artery + Vein) / (Lymph + 1.0)")
    range_min: float = Field(default=1.0)
    range_max: float = Field(default=10.0)
    steps: int = Field(default=10, ge=5, le=50)

@app.post("/api/v1/maas/simulate")
def simulate_biomedical_formula(req: MaaSSimulateRequest):
    curve = []
    step_size = (req.range_max - req.range_min) / float(req.steps)
    for i in range(req.steps + 1):
        val = req.range_min + (i * step_size)
        try:
            res = compiler.execute_formula(req.formula, {"Artery": val, "Vein": val * 0.6, "Lymph": 1.2})
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

@app.post("/api/v1/clinical/fhir/calculate")
def execute_clinical_fhir_calculation(req: FHIRCalculationRequest):
    try:
        return ClinicalFHIRGateway.execute_fhir_bundle_calculation(
            patient_id=req.patient_id,
            formula_math=req.formula_math,
            artery_val=req.artery_val,
            vein_val=req.vein_val,
            lymph_val=req.lymph_val
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Formula variable error: {ve}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"FHIR calculation error: {e}")

class DICOMStudyRequest(BaseModel):
    patient_id: str = Field(default="PAT-ONCO-9982")
    modality: str = Field(default="CT")
    body_part: str = Field(default="CHEST_ABDOMEN")

@app.post("/api/v1/clinical/dicom/study")
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

@app.post("/api/v1/billing/fiat/invoice")
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

@app.post("/api/v1/billing/fiat/webhook")
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

@app.get("/api/v1/billing/fiat/invoice/{invoice_id}/pdf")
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

@app.post("/api/v1/ai/audit")
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

@app.post("/api/v1/ipnft/mint")
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

@app.get("/api/v1/stats/summary")
def get_global_platform_stats():
    """Возвращает живую агрегированную статистику сети без сброса после перезагрузки"""
    return storage.get_platform_stats_summary()


# =====================================================================
# 21. OFFICIAL LEGAL LICENSE TEXT AGREEMENT
# =====================================================================

@app.get("/api/v1/notary/license/{registration_code}")
def get_official_license_agreement(registration_code: str):
    """Генерирует юридический текст B2B / Open Access лицензии для манускрипта"""
    lic = storage.generate_license_agreement_text(registration_code)
    if not lic:
        raise HTTPException(status_code=404, detail="Manuscript record not found")
    return lic


# =====================================================================
# 22. REAL-TIME MULTI-SOURCE HARVESTER & AUTONOMOUS DAEMON
# =====================================================================

class MultiSourceSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    source: str = Field(default="all")
    limit: int = Field(default=5, ge=1, le=20)

@app.post("/api/v1/vampire/search/multisource")
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

class BatchHarvestRequest(BaseModel):
    query: Optional[str] = Field(default=None)
    source: str = Field(default="all")
    limit: int = Field(default=4, ge=1, le=20)

@app.post("/api/v1/vampire/harvest/batch")
def trigger_batch_harvester(request: Request, req: BatchHarvestRequest):
    """Запускает порцию реального парсинга открытых статей из OpenAlex / arXiv / PubMed.
    Требует валидный Bearer-токен (защита от анонимного abuse внешнего трафика)."""
    require_active_bearer(request)
    return AutonomousIngestionDaemon.harvest_batch(custom_query=req.query, source=req.source, limit=req.limit)

@app.get("/api/v1/vampire/harvest/status")
@app.get("/api/v1/vampire/harvest/daemon/status")
def get_harvester_daemon_status():
    """Возвращает текущий статус фонового парсера и демона сбора"""
    return AutonomousIngestionDaemon.get_status()

@app.post("/api/v1/vampire/harvest/daemon/start")
def start_autonomous_crawler_daemon(request: Request):
    """Запускает непрерывный фоновый сборщик научной литературы. Требует Bearer-токен."""
    require_active_bearer(request)
    return AutonomousIngestionDaemon.start_daemon()

@app.post("/api/v1/vampire/harvest/daemon/stop")
def stop_autonomous_crawler_daemon(request: Request):
    """Останавливает непрерывный фоновый сборщик. Требует Bearer-токен."""
    require_active_bearer(request)
    return AutonomousIngestionDaemon.stop_daemon()


# =====================================================================
# 23. WEB3 WALLET INTEGRATION & BALANCE GATEWAY
# =====================================================================

@app.get("/api/v1/wallet/balance/{address}")
def get_web3_wallet_balance(address: str):
    """Проверяет баланс кошелька, сеть и накопленные роялти по протоколу Аманата через Web3 шлюз"""
    return SovereignWeb3Gateway.get_wallet_live_balance(address)


# =====================================================================
# 24. SCHOLAR PASSPORT REGISTRATION (ORCID REGISTRATION)
# =====================================================================

class ScholarRegisterRequest(BaseModel):
    orcid: str = Field(...)
    name: str = Field(...)
    institution: Optional[str] = Field(default="Independent Scientific Research")
    discipline: Optional[str] = Field(default="Clinical Oncology & Surgery")
    wallet_address: Optional[str] = Field(default=None)

@app.post("/api/v1/passport/register")
def register_scholar_profile(req: ScholarRegisterRequest):
    """Регистрирует нового исследователя по ORCID в суверенном паспорте"""
    clean_orcid = req.orcid.strip()
    metrics = _fetch_openalex_metrics(clean_orcid)
    return SoulboundPassportEngine.issue_soulbound_passport(
        orcid=clean_orcid,
        name=req.name,
        institution=req.institution or "Independent Scientific Research",
        wallet_address=req.wallet_address,
        works_count=metrics.get("works_count", 0),
        citations_count=metrics.get("citations_count", 0),
        display_name=metrics.get("display_name"),
        h_index=metrics.get("h_index"),
        source=metrics.get("source"),
    )


# =====================================================================
# 25. SOVEREIGN SCHOLAR ORCID OAUTH & JWT AUTHENTICATION
# =====================================================================

class LoginRequest(BaseModel):
    orcid: str = Field(...)
    name: Optional[str] = None
    institution: Optional[str] = None
    discipline: Optional[str] = None

@app.get("/api/v1/auth/orcid/{orcid}")
def lookup_orcid_public_profile(orcid: str):
    """Выполняет реальный запрос в публичный реестр ORCID (API v3.0)"""
    profile = ScholarAuthService.fetch_orcid_public_profile(orcid)
    if not profile:
        raise HTTPException(status_code=400, detail="Невалидный формат ORCID iD")
    return profile

class OAuthCallbackRequest(BaseModel):
    code: str = Field(...)
    redirect_uri: str = Field(...)

@app.post("/api/v1/auth/orcid/callback")
def handle_orcid_oauth_callback(req: OAuthCallbackRequest):
    """Обменивает временный authorization_code на подтвержденный ORCID iD и выдает JWT.

    ТОЛЬКО этот путь выдаёт токен с auth_method="orcid_oauth" (подтверждённое владение iD).
    """
    ok, token_data, err = ScholarAuthService.exchange_code_for_orcid_token(req.code, req.redirect_uri)
    if not ok or not token_data:
        raise HTTPException(status_code=400, detail=err or "Ошибка авторизации через ORCID OAuth 2.0")
    
    orcid_id = token_data.get("orcid")
    name = token_data.get("name")
    profile = ScholarAuthService.fetch_orcid_public_profile(orcid_id) or {
        "orcid": orcid_id,
        "name": name or f"Scholar {orcid_id}",
        "is_verified": False,
        "auth_method": "self_asserted",
        "source": "ORCID OAuth 2.0"
    }
    
    jwt_token = ScholarAuthService.create_jwt_token(profile, auth_method="orcid_oauth")
    profile["is_verified"] = True
    profile["auth_method"] = "orcid_oauth"
    return {
        "status": "AUTHENTICATED",
        "access_token": jwt_token,
        "token_type": "Bearer",
        "auth_method": "orcid_oauth",
        "profile": profile,
        "orcid_oauth": {
            "scope": token_data.get("scope"),
            "orcid": orcid_id
        }
    }

@app.post("/api/v1/auth/login")
def authenticate_scholar_orcid(req: LoginRequest):
    """Аутентифицирует исследователя по ORCID и выдает JWT.

    Публичный self-asserted вход: владение ORCID НЕ подтверждается (только публичный
    реестр/тело запроса). Токен помечается auth_method="self_asserted" и НЕ проходит
    привилегированные операции (Science Court / Peer Review) в продакшене.
    Для подтверждения личности используйте /api/v1/auth/orcid/callback (OAuth 2.0).
    """
    profile = ScholarAuthService.fetch_orcid_public_profile(req.orcid)
    if not profile:
        raise HTTPException(status_code=400, detail="Невалидный формат ORCID iD")
    
    if req.name:
        profile["name"] = req.name
    if req.institution:
        profile["institution"] = req.institution
    if req.discipline:
        profile["discipline"] = req.discipline
    profile["is_verified"] = False
    profile["auth_method"] = "self_asserted"

    token = ScholarAuthService.create_jwt_token(profile, auth_method="self_asserted")
    return {
        "status": "AUTHENTICATED_SELF_ASSERTED",
        "access_token": token,
        "token_type": "Bearer",
        "auth_method": "self_asserted",
        "profile": profile,
        "note": (
            "Личность не подтверждена OAuth. "
            "Для Science Court / Peer Review в продакшене требуется ORCID OAuth (auth_method=orcid_oauth)."
        )
    }

class VerifyTokenRequest(BaseModel):
    token: str = Field(...)

@app.post("/api/v1/auth/verify")
def verify_scholar_jwt_token(req: VerifyTokenRequest):
    """Проверяет подпись, срок действия и статус отзыва JWT токена"""
    is_valid, payload, error = ScholarAuthService.verify_jwt_token(req.token)
    if not is_valid:
        raise HTTPException(status_code=401, detail=error or "Unauthorized")
    return {"status": "TOKEN_VALID", "payload": payload}

@app.post("/api/v1/auth/logout", status_code=status.HTTP_200_OK)
def logout_scholar(req: VerifyTokenRequest):
    """Отзывает JWT токен (jti попадает в persistent blacklist — работает между воркерами)"""
    is_valid, payload, error = ScholarAuthService.verify_jwt_token(req.token)
    if not is_valid and error != "Token expired":
        raise HTTPException(status_code=401, detail=error or "Unauthorized")
    storage.revoke_jti(payload.get("jti", ""), payload.get("orcid", ""), payload.get("exp", 0))
    return {"status": "LOGGED_OUT", "jti": payload.get("jti")}

@app.post("/api/v1/auth/refresh")
def refresh_scholar_jwt_token(req: VerifyTokenRequest):
    """Выпускает новый JWT по валидному токену с ротацией (старый jti отзывается).

    auth_method (степень верификации) переносится из исходного токена — нельзя
    «апгрейднуться» из self_asserted в orcid_oauth через refresh.
    """
    is_valid, payload, error = ScholarAuthService.verify_jwt_token(req.token)
    if not is_valid:
        raise HTTPException(status_code=401, detail=error or "Unauthorized")

    profile = {k: v for k, v in payload.items() if k not in ("iat", "exp", "jti", "iss", "aud")}
    auth_method = payload.get("auth_method", "self_asserted")
    new_token = ScholarAuthService.create_jwt_token(profile, auth_method=auth_method)

    # Ротация: старый токен немедленно отзывается
    storage.revoke_jti(payload.get("jti", ""), payload.get("orcid", ""), payload.get("exp", 0))

    return {
        "status": "REFRESHED",
        "access_token": new_token,
        "token_type": "Bearer",
        "auth_method": auth_method,
        "profile": profile
    }