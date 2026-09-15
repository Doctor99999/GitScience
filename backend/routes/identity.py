# -*- coding: utf-8 -*-
"""
routes/identity.py — Authentication, Passport, Court, and Peer Review routes.
Moved from main.py via mechanical extraction; logic unchanged.
"""
from typing import Optional, Dict, Any, List, Tuple

from fastapi import APIRouter, HTTPException, status, Query, Body, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import hashlib
import hmac
import uuid
import os
import re
import json
import base64
import urllib.request
import urllib.error
import secrets
from datetime import datetime, timezone

from routes.deps import (
    storage, court_engine, review_engine, editorial_engine,
    ScholarAuthService, _app_is_production,
    require_active_bearer, require_verified_orcid,
    _fetch_openalex_metrics,
    _is_oauth_verified, _extract_bearer_payload,
    sanitize_header_value,
    SoulboundPassportEngine,
)

try:
    import redis as _redis_mod
    _redis_url = os.environ.get("REDIS_URL", "")
    redis_client = _redis_mod.from_url(_redis_url, decode_responses=True) if _redis_url else None
except Exception:
    redis_client = None

router = APIRouter()


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

# =====================================================================
# 9. SCIENCE COURT & DISPUTES
# =====================================================================

@router.get("/api/v1/court/cases")
def get_court_cases():
    return {"cases": court_engine.get_all_cases()}

@router.post("/api/v1/court/dispute")
def file_academic_dispute(request: Request, req: CourtDisputeRequest):
    verified_orcid = require_verified_orcid(request, req.claimant_orcid, require_oauth=True)
    
    # 🛡️ Anti-Spam & Sybil Protection (Proof-of-Reputation) — только в продакшене,
    # чтобы не блокировать автономные/тестовые контуры без доступа к live OpenAlex.
    if _app_is_production():
        metrics = _fetch_openalex_metrics(verified_orcid)
        if (metrics.get("works_count") or 0) < 5:
            raise HTTPException(
                status_code=403, 
                detail="Sybil Protection: Для открытия диспута требуется минимум 5 опубликованных научных работ (Proof-of-Reputation)."
            )

    claimant_name = req.claimant_name
    case = court_engine.file_dispute(
        claimant_name=claimant_name,
        claimant_orcid=verified_orcid,
        target_code=req.target_code,
        reason=req.reason,
        evidence_hash=req.evidence_hash
    )
    return {"status": "DISPUTE_FILED", "case": case}

@router.post("/api/v1/court/vote")
def cast_juror_vote(request: Request, req: CourtVoteRequest):
    verified_orcid = require_verified_orcid(request, req.juror_orcid, require_oauth=True)
    
    # 🛡️ Anti-Sybil Protection (Proof-of-Reputation) — только в продакшене;
    # (metrics.get("h_index") or 0) защищает от None при недоступном OpenAlex.
    if _app_is_production():
        metrics = _fetch_openalex_metrics(verified_orcid)
        if (metrics.get("h_index") or 0) < 2 and (metrics.get("works_count") or 0) < 5:
            raise HTTPException(
                status_code=403, 
                detail="Sybil Protection: Для участия в суде присяжных требуется h-index >= 2 или минимум 5 работ."
            )

    result = court_engine.cast_vote(
        case_id=req.case_id,
        juror_orcid=verified_orcid,
        vote=req.vote
    )
    return result


# =====================================================================
# 13. SOULBOUND RESEARCHER PASSPORT & GIT-IMPACT SCORE (GIS)
# =====================================================================

@router.get("/api/v1/passport/{orcid}")
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

# [moved to routes/deps.py] review_engine = BlindPeerReviewEngine(storage.STORAGE_DIR)

@router.post("/api/v1/review/submit")
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

@router.get("/api/v1/review/list/{target_code}")
def get_article_reviews(target_code: str):
    return {"reviews": review_engine.get_reviews_for_article(target_code)}

@router.get("/api/v1/review/reputation/{orcid}")
def get_reviewer_reputation(orcid: str):
    """Публичная репутация рецензента (агрегаты; слепота рецензий сохраняется)."""
    rep = review_engine.get_reviewer_reputation(orcid)
    if rep["reviews_submitted"] == 0:
        raise HTTPException(status_code=404, detail="У учёного пока нет рецензий в реестре")
    return rep

@router.post("/api/v1/review/claim")
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

@router.get("/api/v1/review/attestation/{attestation_sha256}")
def verify_review_attestation(attestation_sha256: str):
    """Проверка attestation-хэша: целостность и присутствие рецензии в реестре."""
    return review_engine.verify_attestation(attestation_sha256)


# =====================================================================
# 24. SCHOLAR PASSPORT REGISTRATION (ORCID REGISTRATION)
# =====================================================================

class ScholarRegisterRequest(BaseModel):
    orcid: str = Field(...)
    name: str = Field(...)
    institution: Optional[str] = Field(default="Independent Scientific Research")
    discipline: Optional[str] = Field(default="Clinical Oncology & Surgery")
    wallet_address: Optional[str] = Field(default=None)

@router.post("/api/v1/passport/register")
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

@router.get("/api/v1/auth/orcid/{orcid}")
def lookup_orcid_public_profile(orcid: str):
    """Выполняет реальный запрос в публичный реестр ORCID (API v3.0)"""
    profile = ScholarAuthService.fetch_orcid_public_profile(orcid)
    if not profile:
        raise HTTPException(status_code=400, detail="Невалидный формат ORCID iD")
    return profile

try:
    import redis
    _redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    _redis_client = redis.from_url(_redis_url, decode_responses=True)
    _redis_client.ping()
except Exception:
    _redis_client = None

class _OAuthStateStore:
    """Хранилище OAuth CSRF-state: Redis, если доступен; иначе — персистентная БД
    (SQLite/Postgres). В отличие от памяти процесса, переживает рестарты и
    распределяется между gunicorn-воркерами (Procfile: -w 2)."""
    TTL_SECONDS = 600

    @classmethod
    def setex(cls, key: str, ttl_seconds: int, value: str) -> None:
        if _redis_client is not None:
            _redis_client.setex(key, ttl_seconds, value)
        else:
            storage.oauth_state_set(key, ttl_seconds)

    @classmethod
    def get(cls, key: str) -> Optional[str]:
        if _redis_client is not None:
            return _redis_client.get(key)
        return storage.oauth_state_get(key)

    @classmethod
    def delete(cls, key: str) -> None:
        if _redis_client is not None:
            _redis_client.delete(key)
        else:
            storage.oauth_state_delete(key)

redis_client = _OAuthStateStore

@router.get("/api/v1/auth/orcid/state")
def generate_oauth_state():
    state = secrets.token_urlsafe(32)
    redis_client.setex(f"oauth_state:{state}", 600, "1")
    from gitscience_auth import ORCID_CLIENT_ID
    return {"state": state, "client_id": ORCID_CLIENT_ID}

class OAuthCallbackRequest(BaseModel):
    code: str = Field(...)
    redirect_uri: str = Field(...)
    state: str = Field(..., description="OAuth 2.0 CSRF state")

@router.post("/api/v1/auth/orcid/callback")
def handle_orcid_oauth_callback(req: OAuthCallbackRequest):
    """Обменивает временный authorization_code на подтвержденный ORCID iD и выдает JWT.

    ТОЛЬКО этот путь выдаёт токен с auth_method="orcid_oauth" (подтверждённое владение iD).
    """
    stored = redis_client.get(f"oauth_state:{req.state}")
    if not stored:
        raise HTTPException(status_code=403, detail="Invalid or expired OAuth state")
    redis_client.delete(f"oauth_state:{req.state}")

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

@router.post("/api/v1/auth/login")
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

@router.post("/api/v1/auth/verify")
def verify_scholar_jwt_token(req: VerifyTokenRequest):
    """Проверяет подпись, срок действия и статус отзыва JWT токена"""
    is_valid, payload, error = ScholarAuthService.verify_jwt_token(req.token)
    if not is_valid:
        raise HTTPException(status_code=401, detail=error or "Unauthorized")
    return {"status": "TOKEN_VALID", "payload": payload}

def _decode_jwt_token_unverified(token: str) -> Optional[Dict[str, Any]]:
    """Декодирует claims JWT без проверки подписи — ТОЛЬКО для отзыва истёкшего токена."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        p_b64 = parts[1]
        rem = len(p_b64) % 4
        padded_p_b64 = p_b64 + ("=" * (4 - rem) if rem else "")
        return json.loads(base64.urlsafe_b64decode(padded_p_b64).decode())
    except Exception:
        return None

@router.post("/api/v1/auth/logout", status_code=status.HTTP_200_OK)
def logout_scholar(req: VerifyTokenRequest):
    """Отзывает JWT токен (jti попадает в persistent blacklist — работает между воркерами)"""
    is_valid, payload, error = ScholarAuthService.verify_jwt_token(req.token)
    if not is_valid and error != "Token expired":
        raise HTTPException(status_code=401, detail=error or "Unauthorized")

    # Истёкший токен подтверждён по подписи, но payload не возвращается (gitscience_auth).
    # Декодируем claims БЕЗ верификации только для извлечения jti на отзыв: содержимое
    # не используется как данные сессии, подпись уже проверена вызывающим кодом.
    if payload is None:
        payload = _decode_jwt_token_unverified(req.token) or {}

    storage.revoke_jti(payload.get("jti", ""), payload.get("orcid", ""), payload.get("exp", 0))
    return {"status": "LOGGED_OUT", "jti": payload.get("jti")}

@router.post("/api/v1/auth/refresh")
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




