# -*- coding: utf-8 -*-
"""
gitscience_iot.py — IoT Hardware Gateway (HSM)  (ТЗ §3.4)
Проверка криптографических подписей сырых данных, поступающих напрямую
с лабораторного оборудования, исключающая фальсификацию результатов человеком.

Реестр устройств хранит Ed25519-публичные ключи, зарегистрированные в составе
медицинской инфраструктуры. Каждая запись данных (raw payload) должна быть
подписана аппаратным ключом устройства; шлюз проверяет подпись, свежесть
(timestamp) и уникальность nonce (анти-replay), после чего фиксирует SHA-256
дайджест канонизированного payload — готовый для якорения в нотариат (OTS).
"""
import base64
import hashlib
import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives.serialization import load_pem_public_key

REPLAY_WINDOW_SECONDS = int(5 * 60)  # окно допуска по времени, 300 s


def _canonical_bytes(payload: Dict[str, Any]) -> bytes:
    """Каноническое представление payload: JSON с сортированными ключами."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


class GitscienceIoTGateway:
    """Шлюз верификации аппаратных данных лабораторного оборудования (HSM)."""

    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = Path(storage_dir) if storage_dir else Path.cwd() / "storage"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.devices_file = self.storage_dir / "iot_devices.json"
        self.ingested_file = self.storage_dir / "iot_ingested.json"
        self._init_db()

    # ------------------------------------------------------------------ DB
    def _init_db(self):
        for f, seed in ((self.devices_file, {"devices": {}}),
                        (self.ingested_file, {"records": [], "nonces": {}})):
            if not f.exists():
                f.write_text(json.dumps(seed, ensure_ascii=False, indent=2), encoding="utf-8")

    def _load(self, path: Path) -> dict:
        return json.loads(path.read_text(encoding="utf-8"))

    def _save(self, path: Path, data: dict):
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    # ------------------------------------------------ device key management
    def generate_keypair(self) -> Dict[str, str]:
        """Генерация Ed25519 пары клиента (для лабоборудования). Возвращает PEM."""
        private = ed25519.Ed25519PrivateKey.generate()
        private_pem = private.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        public_pem = private.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        return {
            "private_key_pem": private_pem.decode("utf-8"),
            "public_key_pem": public_pem.decode("utf-8"),
        }

    def register_device(
        self,
        device_id: str,
        label: str,
        public_key_pem: str,
        issuer: str = "GitScience Lab Infrastructure",
    ) -> Dict[str, Any]:
        if not device_id or not public_key_pem:
            raise ValueError("device_id и public_key_pem обязательны")
        db = self._load(self.devices_file)
        db["devices"][device_id] = {
            "label": label,
            "public_key_pem": public_key_pem,
            "issuer": issuer,
            "registered_at_utc": datetime.now(timezone.utc).isoformat(),
            "active": True,
        }
        self._save(self.devices_file, db)
        return {"status": "DEVICE_REGISTERED", "device_id": device_id, "label": label}

    def list_devices(self) -> List[Dict[str, Any]]:
        db = self._load(self.devices_file)
        return [
            {"device_id": did, **meta}
            for did, meta in db["devices"].items()
        ]

    def get_public_key(self, device_id: str) -> Optional[Any]:
        db = self._load(self.devices_file)
        meta = db["devices"].get(device_id)
        if not meta or not meta.get("active"):
            return None
        try:
            return load_pem_public_key(meta["public_key_pem"].encode("utf-8"))
        except Exception:
            return None

    # ------------------------------------------------ signature verification
    @staticmethod
    def sign_payload(payload: Dict[str, Any], private_key_pem: str) -> str:
        """Подпись payload частным ключом устройства (для клиента/тестов)."""
        private = serialization.load_pem_private_key(
            private_key_pem.encode("utf-8"), password=None
        )
        sig = private.sign(_canonical_bytes(payload))  # type: ignore[attr-defined]
        return base64.b64encode(sig).decode("utf-8")

    def verify_signature(self, device_id: str, payload: Dict[str, Any],
                         signature_b64: str) -> tuple:
        """Возвращает (ok: bool, reason: str)."""
        pub = self.get_public_key(device_id)
        if pub is None:
            return False, "DEVICE_UNREGISTERED_OR_INACTIVE"
        try:
            sig = base64.b64decode(signature_b64)
            pub.verify(sig, _canonical_bytes(payload))  # type: ignore[attr-defined]
            return True, "SIGNATURE_VALID"
        except Exception:
            return False, "INVALID_SIGNATURE"

    # ------------------------------------------------ ingest / anti-replay
    def ingest(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Принимает подписанную запись устройства; валидирует и архивирует."""
        try:
            device_id = record["device_id"]
            ts = int(record["timestamp"])
            nonce = str(record["nonce"])
            payload = record["payload"]
            signature = record["signature"]
        except KeyError as e:
            raise ValueError(f"Отсутствует поле: {e}")

        now = int(time.time())
        if abs(now - ts) > REPLAY_WINDOW_SECONDS:
            return {
                "status": "REJECTED", "reason": f"TIMESTAMP_OUT_OF_WINDOW (±{REPLAY_WINDOW_SECONDS}s)",
            }

        ok, reason = self.verify_signature(device_id, payload, signature)
        if not ok:
            return {"status": "REJECTED", "reason": reason, "device_id": device_id}

        db = self._load(self.ingested_file)
        seen_nonce_key = f"{device_id}:{nonce}"
        if seen_nonce_key in db["nonces"]:
            return {"status": "REJECTED", "reason": "REPLAY_NONCE_ALREADY_SEEN"}
        db["nonces"][seen_nonce_key] = now

        content_hash = hashlib.sha256(_canonical_bytes(payload)).hexdigest()
        record_id = f"IOT-{uuid.uuid4().hex[:12].upper()}"
        entry = {
            "record_id": record_id,
            "device_id": device_id,
            "received_at_unix": now,
            "received_at_utc": datetime.now(timezone.utc).isoformat(),
            "content_sha256": content_hash,
            "signature_valid": True,
            "ots_status": "PENDING_BITCOIN_CALENDAR_SUBMISSION",
        }
        db["records"].insert(0, entry)
        # ограничиваем рост лога (храним последние 10 000)
        if len(db["records"]) > 10000:
            db["records"] = db["records"][:10000]
        self._save(self.ingested_file, db)

        return {
            "status": "VERIFIED",
            "record_id": record_id,
            "device_id": device_id,
            "content_sha256": content_hash,
            "ots_status": entry["ots_status"],
        }

    def get_status(self, record_id: Optional[str] = None) -> Dict[str, Any]:
        db = self._load(self.ingested_file)
        records = db["records"]
        if record_id is not None:
            records = [r for r in records if r["record_id"] == record_id]
        return {"verified_records_count": len(db["records"]), "records": records}
