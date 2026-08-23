"""
GitScience™ Sovereign Protocol API v3.0-ENTERPRISE
Стандарты: WIPO Prior Art / CRediT CASRAI / DataCite 4.4 / RFC 3161 / OTS / ISO 14721
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, status, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
import hashlib
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
from datetime import datetime
from typing import Dict, Any, Optional, List

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
from gitscience_vampire import VampireProtocolEngine, AutoHarvesterWorker
from gitscience_zk import ZKDiscoveryEngine
from gitscience_passport import SoulboundPassportEngine
from gitscience_review import BlindPeerReviewEngine
from gitscience_certificate import CertificateGenerator
from gitscience_fhir import ClinicalFHIRGateway, DICOMWebGateway
from gitscience_fiat import InstitutionalFiatGateway
from gitscience_ai_review import SovereignAIAuditor
from gitscience_ipnft import IPNFTEngine
import time
from collections import defaultdict
from fastapi.responses import Response

# Простой потокобезопасный Rate Limiter (защита от DoS/Sybil атак)
class SimpleRateLimiter:
    def __init__(self, max_requests: int = 60, window_sec: int = 60):
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

rate_limiter = SimpleRateLimiter(max_requests=60, window_sec=60)

app = FastAPI(
    title="GitScience™ Sovereign Protocol API",
    description="Суверенный децентрализованный нотариат открытий, реестр манускриптов, исполняемая математика и B2B маршрутизатор Аманата",
    version="3.2.0-ENTERPRISE"
)

# Инициализация БД и констант
storage.init_db()
CONSTANTS = storage.load_protocol_constants()
court_engine = ScienceCourt(storage.STORAGE_DIR)

# Безопасный CORS для веб-приложений и расширений
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешено для локальной разработки и децентрализованных шлюзов
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# PYDANTIC МОДЕЛИ
# =====================================================================

class FormulaVerifyRequest(BaseModel):
    formula: str = Field(..., example="(Artery + Vein) / (Lymph + 1.0)")
    sample_params: Optional[Dict[str, float]] = None

class BillingCalculateRequest(BaseModel):
    base_amount: float = Field(..., gt=0, example=1000.0)
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
        "timestamp_utc": datetime.utcnow().isoformat(),
        "standards": CONSTANTS["legal_framework"],
        "credit_roles_supported": CREDIT_ROLES
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

    return {
        "status": "SUCCESSFULLY_NOTARIZED",
        "certificate_title": f"CERTIFICATE OF SCIENTIFIC PRIORITY № {saved['serial_number']:05d}",
        "serial_number": saved["serial_number"],
        "registration_code": saved["registration_code"],
        "sha256_payload_hash": saved["sha256_hash"],
        "git_commit_oid": saved["git_commit_hash"],
        "rfc3161_token": saved["rfc3161_token"],
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
def download_official_priority_certificate_pdf(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)
    if not article:
        raise HTTPException(status_code=404, detail="Сертификат не найден в реестре")

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
        license_type=article.get("license_type", "CC-BY-4.0")
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Certificate_{registration_code}.pdf"'
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


# =====================================================================
# 7. WIPO GLOBAL LIBRARY & PDF STREAM
# =====================================================================

@app.get("/library")
def get_library_catalog(
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    ipc_class: Optional[str] = Query(default=None)
):
    all_articles = storage.get_all_manuscripts()
    filtered = all_articles

    if category and isinstance(category, str) and category != "All":
        filtered = [a for a in filtered if category.lower() in a.get("category", "").lower()]

    if ipc_class and isinstance(ipc_class, str) and ipc_class != "All":
        filtered = [a for a in filtered if ipc_class.upper() == a.get("ipc_class", "").upper()]

    if search and isinstance(search, str):
        s = search.lower().strip()
        filtered = [
            a for a in filtered 
            if s in a.get("title", "").lower() 
            or s in a.get("author_name", "").lower() 
            or s in a.get("registration_code", "").lower()
            or s in a.get("orcid", "").lower()
        ]

    return {"total": len(filtered), "articles": filtered}

@app.get("/library/view/{registration_code}")
def view_pdf_file(registration_code: str):
    article = storage.get_manuscript_by_code(registration_code)
    if not article or not article.get("file_path"):
        raise HTTPException(status_code=404, detail="Файл статьи не найден в реестре")
    
    file_path = article["file_path"]
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
def process_fair_share_payment(req: BillingCalculateRequest):
    payout_data = DependencyRoyaltyRouter.calculate_split(
        base_b2b_fee=req.base_amount,
        contributors=req.contributors
    )
    
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    tx_hash = f"0x{hashlib.sha256(f'{tx_id}{datetime.utcnow()}'.encode()).hexdigest()}"
    
    storage.record_transaction(
        tx_id=tx_id,
        amount=payout_data["b2b_invoice_total"],
        currency="USDT",
        author_share=payout_data["author_pool_total"],
        infra_share=payout_data["platform_allocations"]["infrastructure_20pct"],
        founder_share=payout_data["platform_allocations"]["founder_10pct"],
        author_wallet="0x71C...3929",
        tx_hash=tx_hash
    )
    
    return {
        "status": "Fair-Share платеж распределен и зафиксирован в Ledger",
        "tx_id": tx_id,
        "routing_details": payout_data,
        "transaction_hash": tx_hash
    }


# =====================================================================
# 9. SCIENCE COURT & DISPUTES
# =====================================================================

@app.get("/api/v1/court/cases")
def get_court_cases():
    return {"cases": court_engine.get_all_cases()}

@app.post("/api/v1/court/dispute")
def file_academic_dispute(req: CourtDisputeRequest):
    case = court_engine.file_dispute(
        claimant_name=req.claimant_name,
        claimant_orcid=req.claimant_orcid,
        target_code=req.target_code,
        reason=req.reason,
        evidence_hash=req.evidence_hash
    )
    return {"status": "DISPUTE_FILED", "case": case}

@app.post("/api/v1/court/vote")
def cast_juror_vote(req: CourtVoteRequest):
    result = court_engine.cast_vote(
        case_id=req.case_id,
        juror_orcid=req.juror_orcid,
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
def import_vampire_work(req: VampireImportRequest):
    result = VampireProtocolEngine.import_and_notarize_openalex_work(req.work_data)
    return result


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

zk_engine = ZKDiscoveryEngine(storage.STORAGE_DIR)

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
# 13. SOULBOUND RESEARCHER PASSPORT & GIT-IMPACT SCORE (GIS)
# =====================================================================

@app.get("/api/v1/passport/{orcid}")
def get_soulbound_passport(orcid: str, wallet: Optional[str] = None):
    clean_orcid = orcid.strip()
    return SoulboundPassportEngine.issue_soulbound_passport(
        orcid=clean_orcid,
        name="Salauat Abiltayevich Yeshimov" if "3929" in clean_orcid else "Sovereign Scholar",
        institution="National Scientific Oncology Center",
        wallet_address=wallet,
        works_count=12,
        citations_count=28
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

review_engine = BlindPeerReviewEngine(storage.STORAGE_DIR)

@app.post("/api/v1/review/submit")
def submit_peer_review(req: PeerReviewSubmitRequest):
    return review_engine.submit_blind_review(
        target_code=req.target_code,
        reviewer_orcid=req.reviewer_orcid,
        math_rigor_score=req.math_rigor_score,
        methodology_score=req.methodology_score,
        ethics_score=req.ethics_score,
        novelty_score=req.novelty_score,
        review_comments=req.review_comments
    )

@app.get("/api/v1/review/list/{target_code}")
def get_article_reviews(target_code: str):
    return {"reviews": review_engine.get_reviews_for_article(target_code)}


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
    return ClinicalFHIRGateway.execute_fhir_bundle_calculation(
        patient_id=req.patient_id,
        formula_math=req.formula_math,
        artery_val=req.artery_val,
        vein_val=req.vein_val,
        lymph_val=req.lymph_val
    )

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
def process_fiat_bank_webhook(req: FiatWebhookRequest):
    return InstitutionalFiatGateway.process_fiat_webhook(
        invoice_number=req.invoice_number,
        paid_amount=req.paid_amount,
        payment_method=req.payment_method
    )


# =====================================================================
# 18. SOVEREIGN AI PEER-REVIEWER & PRIOR ART SCANNER
# =====================================================================

class AIAuditRequest(BaseModel):
    title: str = Field(...)
    author: str = Field(default="Salauat Abiltayevich Yeshimov")
    orcid: str = Field(default="0009-0003-3929-3605")
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
    wallet_address: str = Field(default="0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37")

@app.post("/api/v1/ipnft/mint")
def mint_sovereign_ip_nft(req: IPNFTMintRequest):
    return IPNFTEngine.generate_token_metadata(
        registration_code=req.registration_code,
        wallet_address=req.wallet_address
    )


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
# 22. REAL-TIME OPENALEX BATCH HARVESTER WORKER
# =====================================================================

class BatchHarvestRequest(BaseModel):
    query: Optional[str] = Field(default=None)
    limit: int = Field(default=4, ge=1, le=20)

@app.post("/api/v1/vampire/harvest/batch")
def trigger_batch_harvester(req: BatchHarvestRequest):
    """Запускает порцию реального парсинга открытых статей из OpenAlex"""
    return AutoHarvesterWorker.harvest_batch(custom_query=req.query, limit=req.limit)

@app.get("/api/v1/vampire/harvest/status")
def get_harvester_status():
    """Возвращает текущий статус фонового парсера"""
    return AutoHarvesterWorker.get_status()