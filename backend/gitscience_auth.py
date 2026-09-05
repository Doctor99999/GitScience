# -*- coding: utf-8 -*-
"""
gitscience_auth.py — Sovereign Scholar Authentication & ORCID Integration v3.4-HARDENED
Поддержка ORCID Public API v3.0, OAuth 2.0 Authorization Code Exchange, верификация личности ученых и выпуск JWT-токенов.
"""
import hmac
import hashlib
import base64
import json
import time
import re
import os
import secrets as _secrets
import uuid
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any, Optional, Tuple

try:
    import gitscience_storage as _storage
except ImportError:
    _storage = None

_JWT_SECRET_PLACEHOLDER_MARKERS = ("CHANGE_ME", "change_me")

def _load_jwt_secret() -> str:
    """Загружает JWT_SECRET, отвергая известный плейсхолдер из .env.example.

    Production: fail-fast — без реального секрета старт невозможен (иначе при
    нескольких gunicorn-воркерах каждый сгенерирует свой ключ и токены «разъедутся»).
    Dev: эфемерный случайный ключ — сессии сбрасываются при перезапуске.
    """
    raw = (os.environ.get("JWT_SECRET") or "").strip()
    if raw and not any(m in raw for m in _JWT_SECRET_PLACEHOLDER_MARKERS):
        return raw
    is_prod = os.environ.get("ENVIRONMENT", "development").lower() == "production"
    if is_prod:
        raise RuntimeError(
            "[AUTH] JWT_SECRET обязателен в продакшене. Сгенерируйте: "
            "python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    print(
        "⚠️  [AUTH] JWT_SECRET не задан (или содержит плейсхолдер CHANGE_ME) — "
        "сгенерирован эфемерный ключ. Задайте JWT_SECRET в .env для продакшена!",
        flush=True,
    )
    return _secrets.token_hex(32)

JWT_SECRET = _load_jwt_secret()
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 86400 * 7  # 7 days
JWT_ISSUER = "gitscience-sovereign-auth"
JWT_AUDIENCE = "gitscience-sovereign-api"

ORCID_CLIENT_ID = os.environ.get("ORCID_CLIENT_ID", "")
ORCID_CLIENT_SECRET = os.environ.get("ORCID_CLIENT_SECRET", "")
ORCID_TOKEN_URL = "https://orcid.org/oauth/token"
IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development").lower() == "production"

class ScholarAuthService:
    """Сервис суверенной аутентификации исследователей по ORCID."""

    @staticmethod
    def is_valid_orcid(orcid: str) -> bool:
        """Проверяет соответствие стандарту ISO 27729 (ORCID iD)."""
        clean = orcid.strip()
        return bool(re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean))

    @classmethod
    def exchange_code_for_orcid_token(cls, code: str, redirect_uri: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Обменивает временный OAuth-код на подтвержденный ORCID iD через защищенный бэк-канал ORCID.
        """
        if not (ORCID_CLIENT_ID and ORCID_CLIENT_SECRET):
            if IS_PRODUCTION:
                return False, None, "ORCID OAuth credentials (ORCID_CLIENT_ID/SECRET) не настроены на сервере."
            # В dev-режиме эмулируем успешный обмен
            mock_orcid = "0009-0003-3929-3605"
            return True, {
                "orcid": mock_orcid,
                "name": "Dev Verified Scholar",
                "access_token": "mock_token_dev",
                "token_type": "bearer",
                "scope": "/authenticate"
            }, None

        form_data = {
            "client_id": ORCID_CLIENT_ID,
            "client_secret": ORCID_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code.strip(),
            "redirect_uri": redirect_uri.strip()
        }
        encoded_data = urllib.parse.urlencode(form_data).encode("utf-8")
        req = urllib.request.Request(
            ORCID_TOKEN_URL,
            data=encoded_data,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "GitScience-Sovereign-Protocol/3.4"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    return True, data, None
                return False, None, f"ORCID auth error: HTTP {resp.status}"
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            return False, None, f"ORCID OAuth failed: {err_body}"
        except Exception as e:
            return False, None, f"ORCID connection error: {e}"

    @classmethod
    def fetch_orcid_public_profile(cls, orcid: str) -> Optional[Dict[str, Any]]:
        """
        Запрашивает публичный профиль исследователя из официального ORCID REST API v3.0.
        """
        clean = orcid.strip()
        if not cls.is_valid_orcid(clean):
            return None

        # Предустановленный профиль Создателя протокола
        if clean == "0009-0003-3929-3605":
            return {
                "orcid": "0009-0003-3929-3605",
                "name": "Salauat Abiltayevich Yeshimov",
                "given_names": "Salauat",
                "family_name": "Yeshimov",
                "credit_name": "Salauat Abiltayevich Yeshimov",
                "institution": "National Scientific Oncology Center",
                "discipline": "Clinical Oncology & Surgery",
                "is_verified": False,
                "auth_method": "self_asserted",
                "source": "Local Founder Preset (not proof of ownership)"
            }

        url = f"https://pub.orcid.org/v3.0/{clean}/record"
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "GitScience-Sovereign-Protocol/3.4 (+https://gitscience.org)"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    person = data.get("person", {})
                    name_obj = person.get("name", {})
                    given = name_obj.get("given-names", {}).get("value", "")
                    family = name_obj.get("family-name", {}).get("value", "")
                    credit_name = name_obj.get("credit-name", {}).get("value", "")
                    full_name = credit_name or f"{given} {family}".strip() or f"Scholar {clean}"
                    
                    return {
                        "orcid": clean,
                        "name": full_name,
                        "given_names": given,
                        "family_name": family,
                        "credit_name": credit_name,
                        "institution": "Independent Scientific Research",
                        "discipline": "General Science & Mathematics",
                        "is_verified": False,
                        "auth_method": "self_asserted",
                        "source": "ORCID Public Registry (record exists; ownership NOT verified)"
                    }
        except Exception:
            pass

        # Fallback profile for offline/sandbox mode — НЕ претендует на верификацию владения
        return {
            "orcid": clean,
            "name": f"Scholar ({clean[-4:]})",
            "institution": "Independent Scientific Research",
            "discipline": "General Science & Mathematics",
            "is_verified": False,
            "auth_method": "self_asserted",
            "source": "Sovereign Cache (Offline/Sandbox)"
        }

    @staticmethod
    def create_jwt_token(payload: Dict[str, Any], auth_method: str = "self_asserted") -> str:
        """Генерирует криптографический JWT токен доступа (HS256) с уникальным jti для revocation.

        auth_method маркирует степень верификации личности:
          * "orcid_oauth"   — ORCID OAuth 2.0 Authorization Code: владение iD подтверждено.
          * "self_asserted" — любой другой путь (привязка ORCID из профиля/тела), НЕ верификация.
        Привилегированные операции (Science Court / Peer Review в проде) принимают только orcid_oauth.
        """
        header = {"alg": "HS256", "typ": "JWT"}
        data = payload.copy()
        data["jti"] = uuid.uuid4().hex
        data["iat"] = int(time.time())
        data["exp"] = int(time.time()) + JWT_EXPIRATION_SECONDS
        data["iss"] = JWT_ISSUER
        data["aud"] = JWT_AUDIENCE
        data["auth_method"] = auth_method
        data["is_verified"] = (auth_method == "orcid_oauth")

        h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
        p_b64 = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")
        
        signing_input = f"{h_b64}.{p_b64}".encode()
        sig = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
        sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
        
        return f"{h_b64}.{p_b64}.{sig_b64}"

    @staticmethod
    def verify_jwt_token(token: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """Проверяет подпись и срок действия JWT токена."""
        parts = token.split(".")
        if len(parts) != 3:
            return False, None, "Invalid token format"

        h_b64, p_b64, sig_b64 = parts
        signing_input = f"{h_b64}.{p_b64}".encode()
        expected_sig = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip("=")

        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return False, None, "Invalid cryptographic signature"

        # Padding for base64
        rem = len(p_b64) % 4
        padded_p_b64 = p_b64 + ("=" * (4 - rem) if rem else "")
        try:
            payload = json.loads(base64.urlsafe_b64decode(padded_p_b64).decode())
            if payload.get("exp", 0) < time.time():
                return False, None, "Token expired"
            # Должные iss/aud: токены старого формата (без этих claim) отклоняются.
            if payload.get("iss") != JWT_ISSUER or payload.get("aud") != JWT_AUDIENCE:
                return False, None, "Token issued by unknown issuer/audience — re-login required"
            if _storage is not None and _storage.is_jti_revoked(payload.get("jti", "")):
                return False, None, "Token revoked"
            return True, payload, None
        except Exception as e:
            return False, None, f"Payload decode error: {e}"
