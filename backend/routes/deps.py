# -*- coding: utf-8 -*-
"""
routes/deps.py — общие движки, константы и auth-хелперы для API-роутеров.

Вынесено из монолитного main.py: singleton-движки (создаются один раз),
хелперы извлечения Bearer JWT и обязательные проверки ролей/ORCID.
main.py импортирует отсюда те же имена — поведение приложения не меняется.
"""
import base64
import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, Request, status

# =====================================================================
# ДВИЖКИ И ЯДРО
# =====================================================================

import gitscience_storage as storage
import gitscience_compiler as compiler
import gitscience_review as blind_review
import gitscience_certificate as cert_lib
import gitscience_fhir as fhir_lib
import gitscience_fiat as fiat_lib
import gitscience_ipnft as ipnft_lib
import gitscience_web3 as web3_lib
import gitscience_vampire as vampire_lib
import gitscience_editorial as editorial_lib
import gitscience_invoice_pdf as invoice_pdf_lib
import gitscience_watermark as watermark_lib

from gitscience_fortress import (
    DependencyRoyaltyRouter,
    CRediTContributorManager,
    DualTimestampingNotary,
    ScienceCourt,
    IRBClinicalVerifier,
    CREDIT_ROLES,
    SandboxedEvaluator,
)
from gitscience_ai_review import SovereignAIAuditor
from gitscience_zk import ZKDiscoveryEngine
from gitscience_iot import GitscienceIoTGateway
from gitscience_review import BlindPeerReviewEngine
from gitscience_passport import SoulboundPassportEngine
from gitscience_editorial import (
    FinalEditorialEngine,
    EditorialUser,
    Submission,
    PeerReview,
    EditorialDecision,
    DOIMintingService,
    JATSXMLExporter,
)
from gitscience_auth import ScholarAuthService, IS_PRODUCTION as _GITSIENCE_AUTH_PROD_FLAG
from gitscience_certificate import CertificateGenerator
from gitscience_fhir import ClinicalFHIRGateway, DICOMWebGateway
from gitscience_fiat import InstitutionalFiatGateway
from gitscience_ipnft import IPNFTEngine
from gitscience_web3 import SovereignWeb3Gateway
from gitscience_invoice_pdf import InstitutionalInvoicePDFGenerator
from gitscience_vampire import (
    VampireProtocolEngine,
    AutoHarvesterWorker,
    AutonomousIngestionDaemon,
)


def _ensure_runtime() -> None:
    """Инициализация БД и констант протокола (импортируется один раз)."""
    storage.init_db()


storage.init_db()
CONSTANTS = storage.load_protocol_constants()
_sandbox = SandboxedEvaluator()
court_engine = ScienceCourt(storage.STORAGE_DIR)
review_engine = BlindPeerReviewEngine(storage.STORAGE_DIR)
zk_engine = ZKDiscoveryEngine(storage.STORAGE_DIR)
iot_gateway = GitscienceIoTGateway(storage.STORAGE_DIR)
editorial_engine = FinalEditorialEngine()
doi_service = DOIMintingService()
jats_exporter = JATSXMLExporter()


# =====================================================================
# IS_PRODUCTION: динамический геттер для совместимости с тестами
# =====================================================================
import sys as _sys
def _app_is_production() -> bool:
    """Читает IS_PRODUCTION из главного модуля (main), чтобы monkeypatch в тестах работал."""
    _m = _sys.modules.get("main")
    if _m is not None:
        return bool(getattr(_m, "IS_PRODUCTION", False))
    return bool(_GITSIENCE_AUTH_PROD_FLAG)

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
    if require_oauth and _app_is_production() and not _is_oauth_verified(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Требуется OAuth-верификация ORCID (auth_method=orcid_oauth). "
                "Self-asserted токен не подтверждает владение iD."
            )
        )
    return token_orcid


def require_editor_role(request: Request, *any_roles: str) -> str:
    """
    Требует валидный JWT + наличие хотя бы одной из указанных editorial-ролей
    в реестре редакторов (editorial_engine.users), привязанном к ORCID из токена.
    Возвращает ORCID из токена.
    """
    token_orcid = require_active_bearer(request).get("orcid", "").strip()
    editor = None
    for u in editorial_engine.users.values():
        if u.orcid == token_orcid:
            editor = u
            break
    if not editor or not editor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Для этой операции нужен Editorial-аккаунт (зарегистрируйтесь через /api/v1/editorial/register-user)"
        )
    if any_roles and not any(editor.has_role(r) for r in any_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Недостаточно прав редактора (требуются роли: {', '.join(any_roles)})"
        )
    return token_orcid


def sanitize_header_value(value: str) -> str:
    """Санитизация значений для HTTP-заголовков (Content-Disposition) — защита от CRLF-инъекции."""
    return re.sub(r"[^A-Za-z0-9._\-]", "_", value)[:120]


# =====================================================================
# OPENALEX МЕТРИКИ (честные данные паспорта, без захардкоженных значений)
# =====================================================================

def _fetch_openalex_metrics(orcid: str) -> Dict[str, Any]:
    """Возвращает реальные публичные метрики учёного из OpenAlex (по ORCID)."""
    clean_orcid = orcid.strip().replace("https://orcid.org/", "")
    if not re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean_orcid):
        return {"works_count": 0, "citations_count": 0, "h_index": None, "display_name": None, "source": "invalid_orcid"}
    try:
        import requests
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