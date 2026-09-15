"""
GitScience™ Sovereign Protocol API v3.0-ENTERPRISE
Стандарты: WIPO Prior Art / CRediT CASRAI / DataCite 4.4 / RFC 3161 / OTS / ISO 14721
"""
# Загрузка .env ДО импортов модулей, читающих окружение на уровне модуля
# (gitscience_auth/gitscience_storage/gitscience_fortress). Путь привязан к файлу,
# override=False: реальные переменные окружения имеют приоритет.
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent / ".env")

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
import base64
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
import secrets

from gitscience_fortress import (
    DependencyRoyaltyRouter,
    CRediTContributorManager,
    DualTimestampingNotary,
    ScienceCourt,
    IRBClinicalVerifier,
    CREDIT_ROLES,
    SandboxedEvaluator
)

_sandbox = SandboxedEvaluator()
from gitscience_vampire import VampireProtocolEngine, AutoHarvesterWorker, AutonomousIngestionDaemon
import gitscience_indexer as world_index
from gitscience_ai_review import SovereignAIAuditor
from gitscience_zk import ZKDiscoveryEngine
from gitscience_iot import GitscienceIoTGateway
from gitscience_passport import SoulboundPassportEngine
from gitscience_review import BlindPeerReviewEngine
from gitscience_certificate import CertificateGenerator
from gitscience_fhir import ClinicalFHIRGateway, DICOMWebGateway
from gitscience_fiat import InstitutionalFiatGateway
from gitscience_editorial import (
    FinalEditorialEngine,
    EditorialUser,
    Submission,
    PeerReview,
    EditorialDecision,
    DOIMintingService,
    JATSXMLExporter,
)
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
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self._storage_file = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "gitscience_data", "editorial", "rate_limiter.json"
        )
        self._load()

    def _load(self):
        """Загрузка состояния rate limiter из файла"""
        try:
            if os.path.exists(self._storage_file):
                with open(self._storage_file, "r") as f:
                    data = json.load(f)
                now = time.time()
                for client_id, timestamps in data.items():
                    self.requests[client_id] = [t for t in timestamps if now - t < self.window_sec]
        except Exception:
            pass

    def _save(self):
        """Сохранение состояния rate limiter (с TTL expiry)"""
        try:
            os.makedirs(os.path.dirname(self._storage_file), exist_ok=True)
            now = time.time()
            data = {
                client_id: [t for t in timestamps if now - t < self.window_sec]
                for client_id, timestamps in self.requests.items()
                if any(now - t < self.window_sec for t in timestamps)
            }
            with open(self._storage_file, "w") as f:
                json.dump(data, f)
        except Exception:
            pass

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        self.requests[client_id] = [t for t in self.requests[client_id] if now - t < self.window_sec]
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        self.requests[client_id].append(now)
        if len(self.requests) % 50 == 0:
            self._save()
        return True

rate_limiter = SimpleRateLimiter(max_requests=120, window_sec=60)

# Пир, за которыми мы доверяем X-Real-IP (nginx/reverse-proxy). ЯВНЫЙ CIDR-allowlist —
# тот же, что у gunicorn --forwarded-allow-ips. Blanket-доверие к ЛЮБОМУ private-IP
# запрещено: приватная подсеть не обязана быть нашим прокси. Если запрос пришёл
# напрямую и peer вне allowlist — заголовок X-Real-IP ИГНОРИРУЕТСЯ (анти-спуф лимитера).
import ipaddress
DEFAULT_TRUSTED_PROXY_CIDRS = "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1,::1"
_TRUSTED_PROXY_CIDRS = [
    ipaddress.ip_network(cidr, strict=False)
    for cidr in os.environ.get("TRUSTED_PROXY_PEERS", DEFAULT_TRUSTED_PROXY_CIDRS).split(",")
    if cidr.strip()
]

def is_trusted_proxy(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in net for net in _TRUSTED_PROXY_CIDRS)

_HIDE_DOCS = IS_PRODUCTION
app = FastAPI(
    title="GitScience™ Sovereign Protocol API",
    description="Суверенный децентрализованный нотариат открытий, реестр манускриптов, исполняемая математика и B2B маршрутизатор Аманата",
    version="3.2.0-ENTERPRISE",
    docs_url=None if _HIDE_DOCS else "/docs",
    redoc_url=None if _HIDE_DOCS else "/redoc",
    openapi_url=None if _HIDE_DOCS else "/openapi.json",
)
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
        if is_trusted_proxy(peer):
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
# РОУТЕРЫ (извлечены из монолита в backend/routes/)
# =====================================================================
from routes.platform  import router as platform_router
from routes.identity  import router as identity_router
from routes.research  import router as research_router
from routes.editorial import router as editorial_router

app.include_router(platform_router)
app.include_router(identity_router)
app.include_router(research_router)
app.include_router(editorial_router)

# Реэкспорт для совместимости с тестами (import main as main_mod)
from routes.identity import _redis_client  # noqa: E402,F401
