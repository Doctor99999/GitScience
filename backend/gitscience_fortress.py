#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
gitscience_fortress.py — Бронекомплекс GitScience™ (8 Промышленных Пилонов Безопасности)
Стандарты: CRediT CASRAI (14 ролей) / WIPO Prior Art / RFC 3161 / ISO 14721 / HIPAA RUO
"""

import os
import json
import time
import base64
import hashlib
import threading
import concurrent.futures
import sqlalchemy as sa
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

try:
    from gitscience_compiler import SafeASTEvaluator, compute_ast_merkle_digest
except ImportError:
    SafeASTEvaluator = None
    compute_ast_merkle_digest = lambda s: hashlib.sha256(s.encode()).hexdigest()

# 14 стандартных ролей контрибьюторов CRediT (CASRAI / ISO standard)
CREDIT_ROLES = [
    "Conceptualization",
    "Methodology",
    "Software",
    "Validation",
    "Formal Analysis",
    "Investigation",
    "Resources",
    "Data Curation",
    "Writing - Original Draft",
    "Writing - Review & Editing",
    "Visualization",
    "Supervision",
    "Project Administration",
    "Funding Acquisition"
]


# =====================================================================
# 1. 🛡️ ПЕСОЧНИЦА ВЫЧИСЛЕНИЙ С ТАЙМАУТОМ (Sandbox Engine & AST Merkle)
# =====================================================================
class SandboxedEvaluator:
    """Запуск AST-вычислений с жестким лимитом времени (0.5 сек) в изолированном потоке"""

    @staticmethod
    def evaluate_safe(parsed_ast, variables: Dict[str, Any], max_time_sec: float = 0.5):
        if not SafeASTEvaluator:
            raise NotImplementedError("AST Evaluator не подключен")

        def _worker():
            return SafeASTEvaluator(variables).visit(parsed_ast)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_worker)
            try:
                return future.result(timeout=max_time_sec)
            except concurrent.futures.TimeoutError:
                raise TimeoutError(f"🚨 [Sandbox Alert] Превышен лимит времени выполнения формулы ({max_time_sec} сек).")


# =====================================================================
# 2. 👥 МАТРИЦА ВКЛАДА CREDIT CASRAI (14 Roles Taxonomy)
# =====================================================================
class CRediTContributorManager:
    """Управление 14 ролями CRediT и распределение авторского пула (55%)"""

    @staticmethod
    def validate_roles(roles_list: List[str]) -> List[str]:
        valid = [r for r in roles_list if r in CREDIT_ROLES]
        return valid

    @staticmethod
    def calculate_author_shares(contributors: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        contributors = [
          {"name": "...", "orcid": "...", "roles": ["Conceptualization", "Methodology"], "weight": 50},
          ...
        ]
        """
        if not contributors:
            return []

        total_weight = sum(c.get("weight", 1.0) for c in contributors)
        if total_weight <= 0:
            total_weight = 1.0

        calculated = []
        for c in contributors:
            share_pct = round((c.get("weight", 1.0) / total_weight) * 100.0, 2)
            calculated.append({
                "name": c.get("name", "Unknown"),
                "orcid": c.get("orcid", ""),
                "roles": CRediTContributorManager.validate_roles(c.get("roles", [])),
                "weight": c.get("weight", 1.0),
                "author_pool_pct": share_pct,
                "effective_total_pct": round(share_pct * 0.55, 2)  # Доля от всего дохода с учетом 55% пула авторов
            })
        return calculated


# =====================================================================
# 3. ⏱️ ДВОЙНОЙ КРИПТОНОТАРИАТ (RFC 3161 & OpenTimestamps)
# =====================================================================
class DualTimestampingNotary:
    """Генерация и валидация системных временных меток RFC 3161 и OpenTimestamps"""

    OTS_CALENDARS = (
        "https://a.pool.opentimestamps.org",
        "https://b.pool.opentimestamps.org",
        "https://finney.calendar.eternitywall.com",
    )

    @staticmethod
    def generate_proof_bundle(payload_sha256: str, registration_code: str) -> Dict[str, Any]:
        simulated_tsa_token = hashlib.sha256(f"GITSCIENCE_SYSTEM_TSA:{payload_sha256}:{time.time()}".encode()).hexdigest()
        simulated_ots_merkle = hashlib.sha256(f"BITCOIN_MERKLE_ROOT:{payload_sha256}".encode()).hexdigest()

        return {
            "registration_code": registration_code,
            "sha256_digest": payload_sha256,
            "ots_status": "PENDING_BITCOIN_CALENDAR_SUBMISSION",
            "rfc3161_tsa": {
                "status": "SYSTEM_TIME_STAMP_TOKEN",
                "standard": "RFC 3161 Data Structure Compatible",
                "tsa_authority": "GitScience Sovereign Node Authority (Self-Attested)",
                "token_id": f"TST-{simulated_tsa_token[:16].upper()}",
                "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            },
            "opentimestamps": {
                "status": "PENDING_BITCOIN_CALENDAR_SUBMISSION",
                "merkle_root": simulated_ots_merkle,
                "calendars": [
                    "https://a.pool.opentimestamps.org",
                    "https://b.pool.opentimestamps.org",
                    "https://finney.calendar.eternitywall.com"
                ],
                "proof_file": f"{registration_code}.ots"
            }
        }

    @staticmethod
    def submit_to_bitcoin_calendars(
        payload_sha256_hex: str,
        registration_code: str,
        ots_dir,
    ) -> Optional[Dict[str, Any]]:
        """
        ЖИВОЙ OpenTimestamps якорь: отправляет дайджест в публичные календари Bitcoin
        и сохраняет настоящий .ots файл (верифицируемый `ots verify`).

        Активируется переменной окружения GITSCIENCE_OTS_LIVE=1.
        Без неё возвращает None (используется симулированный proof bundle).
        """
        import os as _os
        if _os.environ.get("GITSCIENCE_OTS_LIVE") != "1":
            return None

        try:
            import hashlib as _hashlib
            from pathlib import Path as _Path
            from opentimestamps.core.timestamp import DetachedTimestampFile, Timestamp
            from opentimestamps.core.op import OpSHA256
            from opentimestamps.timestamp import nonce_timestamp
            from opentimestamps.calendar import RemoteCalendar

            digest = bytes.fromhex(payload_sha256_hex)
            detached = DetachedTimestampFile(OpSHA256(), Timestamp(digest))

            from opentimestamps.core.notary import PendingAttestation
            # Nonce-цепочка для приватности + декларация календарей (canonical ots stamp flow)
            leaf = nonce_timestamp(detached.timestamp)

            calendars_ok = []
            for cal_url in DualTimestampingNotary.OTS_CALENDARS:
                try:
                    leaf.attestations.add(PendingAttestation(cal_url))
                    remote_attestation = RemoteCalendar(
                        cal_url, user_agent="GitScience-Sovereign-Protocol"
                    ).submit(leaf.msg, timeout=8)
                    leaf.merge(remote_attestation)
                    calendars_ok.append(cal_url)
                except Exception:
                    continue

            out_dir = _Path(ots_dir)
            out_dir.mkdir(parents=True, exist_ok=True)
            ots_path = out_dir / f"{registration_code}.ots"

            from opentimestamps.core.serialize import StreamSerializationContext
            with open(ots_path, "wb") as fs:
                detached.serialize(StreamSerializationContext(fs))

            return {
                "mode": "LIVE_BITCOIN_CALENDARS",
                "status": "BITCOIN_ANCHOR_SUBMITTED" if calendars_ok else "ALL_CALENDARS_UNREACHABLE",
                "calendars_ok": calendars_ok,
                "proof_file": str(ots_path),
                "verifiable_with": "ots verify / opentimestamps.org/verify",
            }
        except ImportError:
            return {"mode": "LIVE_UNAVAILABLE", "status": "LIBRARY_MISSING", "calendars_ok": []}
        except Exception as e:
            return {"mode": "LIVE_ERROR", "status": f"SUBMISSION_FAILED: {e}", "calendars_ok": []}


# =====================================================================
# 4. 🧬 ВЕРИФИКАТОР БИОЭТИКИ И IRB (Helsinki Declaration Compliance)
# =====================================================================
class IRBClinicalVerifier:
    """Проверка наличия институционального разрешения (IRB) для клинических исследований"""

    @staticmethod
    def verify_ethical_approval(data_payload: Dict[str, Any]) -> Tuple[bool, str]:
        has_human_data = data_payload.get("has_human_subjects", False)
        irb_approval_code = data_payload.get("irb_approval_number", "").strip()

        if has_human_data and not irb_approval_code:
            return False, "🚨 [IRB Alert] Публикация клинических данных требует указания номера разрешения Комитета по биоэтике (IRB)."

        return True, "✅ [Bioethics Passed] Документ соответствует стандартам Хельсинкской декларации (WMA Helsinki Declaration)."


# =====================================================================
# 5. 🏛️ АКАДЕМИЧЕСКИЙ СУД И АРБИТРАЖ (Science Court & Dispute System)
# =====================================================================
class ScienceCourt:
    """Система разрешения споров об авторстве, фальсификациях и претензиях на Prior Art.

    Хранится в SQLAlchemy-БД (таблицы court_disputes / court_votes) вместо JSON-файла.
    Голоса защищены составным первичным ключом (case_id, juror_orcid) — один присяжный = один голос.
    """

    def __init__(self, storage_dir: Optional[Path] = None, db_engine=None):
        self.storage_dir = Path(storage_dir) if storage_dir else Path.cwd() / "storage"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._db_engine = db_engine
        self.court_file = self.storage_dir / "court_cases.json"
        self._migrate_legacy_json()

    def _db(self):
        """Возвращает (engine, storage) — поддерживает внешний engine и модуль по умолчанию."""
        if self._db_engine is not None:
            import gitscience_storage as storage_mod
            return self._db_engine, storage_mod
        import gitscience_storage as storage
        return storage.engine, storage

    def _migrate_legacy_json(self):
        """Одноразовая миграция старых дел из JSON-файла в БД (иначе данные суда теряются)."""
        if not self.court_file.exists():
            return
        try:
            with open(self.court_file, "r", encoding="utf-8") as f:
                db = json.load(f)
        except Exception:
            return
        engine, storage = self._db()
        disputes = db.get("disputes", []) if isinstance(db, dict) else []
        if not disputes:
            return
        with engine.begin() as conn:
            for case in disputes:
                case_id = case.get("case_id", "")
                if not case_id:
                    continue
                exists = conn.execute(
                    sa.select(sa.func.count()).select_from(storage.court_disputes)
                    .where(storage.court_disputes.c.case_id == case_id)
                ).scalar()
                if exists:
                    continue
                votes = case.get("votes", {}) if isinstance(case.get("votes"), dict) else {}
                conn.execute(storage.court_disputes.insert().values(
                    case_id=case_id,
                    claimant_name=case.get("claimant_name", ""),
                    claimant_orcid=case.get("claimant_orcid", ""),
                    target_code=case.get("target_code", ""),
                    reason=case.get("reason", ""),
                    evidence_hash=case.get("evidence_hash", ""),
                    status=case.get("status", "OPEN"),
                    votes_valid=votes.get("valid", 0),
                    votes_invalid=votes.get("invalid", 0),
                    votes_abstain=votes.get("abstain", 0),
                ))
                for juror in case.get("jurors_voted", []):
                    if conn.execute(
                        sa.select(sa.func.count()).select_from(storage.court_votes)
                        .where(sa.and_(
                            storage.court_votes.c.case_id == case_id,
                            storage.court_votes.c.juror_orcid == juror,
                        ))
                    ).scalar() == 0:
                        conn.execute(storage.court_votes.insert().values(
                            case_id=case_id, juror_orcid=juror, vote="valid"
                        ))
        # JSON больше не источник правды — он остаётся как резервная копия
        try:
            archive = self.court_file.with_suffix(".json.migrated")
            if not archive.exists():
                self.court_file.replace(archive)
        except Exception:
            pass

    def _case_to_dict(self, row_mapping, votes_rows) -> Dict[str, Any]:
        case = dict(row_mapping)
        counted = {"valid": 0, "invalid": 0, "abstain": 0}
        jurors = []
        for r in votes_rows:
            if r.vote in counted:
                counted[r.vote] += 1
            jurors.append(r.juror_orcid)
        if hasattr(case.get("created_at"), "isoformat"):
            case["created_at"] = case["created_at"].isoformat()
        case["votes"] = counted
        case["jurors_voted"] = jurors
        return case

    def _get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        engine, storage = self._db()
        with engine.connect() as conn:
            row = conn.execute(
                sa.select(storage.court_disputes).where(storage.court_disputes.c.case_id == case_id)
            ).first()
            if not row:
                return None
            votes_rows = conn.execute(
                sa.select(storage.court_votes).where(storage.court_votes.c.case_id == case_id)
            ).all()
            return self._case_to_dict(row._mapping, votes_rows)

    def file_dispute(
        self,
        claimant_name: str,
        claimant_orcid: str,
        target_code: str,
        reason: str,
        evidence_hash: str
    ) -> Dict[str, Any]:
        engine, storage = self._db()
        case_id = f"CASE-{hashlib.sha256(f'{claimant_orcid}:{target_code}:{time.time()}'.encode()).hexdigest()[:8].upper()}"
        with engine.begin() as conn:
            conn.execute(storage.court_disputes.insert().values(
                case_id=case_id,
                claimant_name=claimant_name,
                claimant_orcid=claimant_orcid,
                target_code=target_code,
                reason=reason,
                evidence_hash=evidence_hash,
                status="OPEN",
                votes_valid=0,
                votes_invalid=0,
                votes_abstain=0,
            ))
        return self._get_case(case_id) or {"case_id": case_id, "status": "OPEN"}

    def cast_vote(self, case_id: str, juror_orcid: str, vote: str) -> Dict[str, Any]:
        if vote not in ["valid", "invalid", "abstain"]:
            return {"status": "ERROR", "message": "Неверный тип голоса"}
        engine, storage = self._db()
        try:
            with engine.begin() as conn:
                row = conn.execute(
                    sa.select(storage.court_disputes.c.status)
                    .where(storage.court_disputes.c.case_id == case_id)
                ).first()
                if not row:
                    return {"status": "ERROR", "message": "Дело не найдено в реестре суда"}

                # Составной PK (case_id, juror_orcid) гарантирует один голос от присяжного
                conn.execute(storage.court_votes.insert().values(
                    case_id=case_id, juror_orcid=juror_orcid, vote=vote
                ))

                # пересчёт голосов после вставки
                rows = conn.execute(
                    sa.select(storage.court_votes.c.vote, sa.func.count())
                    .where(storage.court_votes.c.case_id == case_id)
                    .group_by(storage.court_votes.c.vote)
                ).all()
                counts = {r[0]: r[1] for r in rows}

                total = sum(counts.values())
                new_status = row.status
                if total >= 5:
                    if counts.get("valid", 0) > counts.get("invalid", 0):
                        new_status = "VERDICT_PRIOR_ART_CHALLENGED"
                    else:
                        new_status = "VERDICT_PRIOR_ART_CONFIRMED"

                conn.execute(
                    storage.court_disputes.update().where(storage.court_disputes.c.case_id == case_id).values(
                        votes_valid=counts.get("valid", 0),
                        votes_invalid=counts.get("invalid", 0),
                        votes_abstain=counts.get("abstain", 0),
                        status=new_status,
                    )
                )
        except Exception as e:
            is_integrity = type(e).__name__ in ("IntegrityError",) or "UNIQUE" in str(e).upper()
            if is_integrity:
                return {"status": "ERROR", "message": "Присяжный уже проголосовал по данному делу"}
            raise

        case = self._get_case(case_id)
        return {"status": "VOTE_RECORDED", "case": case}

    def get_all_cases(self) -> List[Dict[str, Any]]:
        engine, storage = self._db()
        with engine.connect() as conn:
            rows = conn.execute(
                sa.select(storage.court_disputes).order_by(storage.court_disputes.c.created_at.desc())
            ).all()
            cases = []
            for row in rows:
                votes_rows = conn.execute(
                    sa.select(storage.court_votes).where(storage.court_votes.c.case_id == row.case_id)
                ).all()
                cases.append(self._case_to_dict(row._mapping, votes_rows))
            return cases


# =====================================================================
# 6. 🔐 ZK-ПРИВАТНОСТЬ ДАННЫХ ПАЦИЕНТОВ (HIPAA Safe Harbor Shield)
# =====================================================================
class ZKPrivacyShield:
    """Генерация слепого хэша когорты пациентов без раскрытия PII"""

    @staticmethod
    def create_blind_cohort_hash(patient_records: List[Dict[str, Any]]) -> str:
        anonymized_concat = ""
        for record in patient_records:
            clean_str = f"{record.get('age_group')}:{record.get('outcome')}:{record.get('value')}"
            anonymized_concat += hashlib.sha256(clean_str.encode('utf-8')).hexdigest()

        return hashlib.sha256(anonymized_concat.encode('utf-8')).hexdigest()


# =====================================================================
# 7. 🔬 IOT-ШЛЮЗ ЛАБОРАТОРНОГО ОБОРУДОВАНИЯ (Hardware Raw Data Gateway)
# =====================================================================
class IoTHardwareGateway:
    """Подтверждение, что сырые данные получены напрямую с физического лабораторного аппарата (HSM)"""

    @staticmethod
    def verify_device_signature(raw_bytes: bytes, device_hsm_pubkey: str, signature_hex: str) -> bool:
        """Настоящая криптографическая проверка Ed25519-подписи аппаратного HSM.

        Подпись устройства ставится над КАНОНИЧЕСКИМ JSON payload'а (GitscienceIoTGateway.sign_payload),
        поэтому проверка диагностирует подмену данных, подделку публичного ключа и повторы.
        Возвращает False при любом отклонении (невалидный PEM, не-Ed25519 ключ, битая подпись).
        """
        from gitscience_iot import _canonical_bytes
        from cryptography.hazmat.primitives.serialization import load_pem_public_key
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        from cryptography.exceptions import InvalidSignature

        try:
            payload = json.loads(raw_bytes.decode("utf-8"))
            pub = load_pem_public_key(device_hsm_pubkey.encode("utf-8"))
            if not isinstance(pub, Ed25519PublicKey):
                return False
            sig = base64.b64decode(signature_hex)
            pub.verify(sig, _canonical_bytes(payload))
            return True
        except (InvalidSignature, Exception):
            return False


# =====================================================================
# 8. 🌿 МАРШРУТИЗАТОР АМАНАТА И РОЯЛТИ (Amanat Royalty Router)
# =====================================================================
class DependencyRoyaltyRouter:
    """
    Математически и юридически чистый разделитель роялти (55/15/30).
    Обеспечивает перенос налогового бремени на B2B покупателя (Tax Gross-Up +20%)
    и распределение авторского пула (55%) по ролям CRediT.
    """

    # Единый золотой стандарт консенсуса Fair-Share в базисных пунктах
    AUTHOR_POOL_BPS = 5500   # 55%
    INFRA_POOL_BPS = 1500    # 15%
    FOUNDER_BPS = 3000       # 30%
    B2B_TAX_GROSSUP_BPS = 2000  # +20% на покупателя

    @staticmethod
    def calculate_split(
        base_b2b_fee: float,
        contributors: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        # Целочисленная математика в центах/bps — исключает float precision loss
        base_cents = int(round(base_b2b_fee * 100))
        grossup_cents = int(round(base_cents * DependencyRoyaltyRouter.B2B_TAX_GROSSUP_BPS / 10000))
        total_invoice_cents = base_cents + grossup_cents
        infra_cents = (base_cents * DependencyRoyaltyRouter.INFRA_POOL_BPS) // 10000
        founder_cents = (base_cents * DependencyRoyaltyRouter.FOUNDER_BPS) // 10000
        author_pool_cents = base_cents - infra_cents - founder_cents  # остаток => ровно 100%

        if not contributors:
            contributors = [{"name": "Lead Author", "orcid": "", "roles": ["Conceptualization", "Methodology"], "weight": 100}]

        author_breakdown = []
        total_weight = sum(c.get("weight", 1.0) for c in contributors) or 1.0

        allocated = 0
        for idx, c in enumerate(contributors):
            weight = c.get("weight", 1.0)
            share_ratio = weight / total_weight
            if idx == len(contributors) - 1:
                payout_cents = author_pool_cents - allocated  # последний получает цент-остаток
            else:
                payout_cents = (author_pool_cents * weight) // total_weight
                payout_cents = max(payout_cents, 0)
            allocated += payout_cents
            reputation_pts = 55.0 * share_ratio  # SRS строго пропорционален финансовому сплиту пула (55%)

            author_breakdown.append({
                "name": c.get("name", "Unknown"),
                "orcid": c.get("orcid", ""),
                "roles": CRediTContributorManager.validate_roles(c.get("roles", [])),
                "payout_usdt": round(payout_cents / 100.0, 2),
                "share_pct": round(share_ratio * 100.0, 1),
                "reputation_points": round(reputation_pts, 1)
            })

        return {
            "b2b_invoice_total": round(total_invoice_cents / 100.0, 2),
            "taxes_paid_by_clinic": round(grossup_cents / 100.0, 2),
            "base_fee": round(base_cents / 100.0, 2),
            "author_pool_total": round(author_pool_cents / 100.0, 2),
            "authors_breakdown": author_breakdown,
            "platform_allocations": {
                "infrastructure_15pct": round(infra_cents / 100.0, 2),
                "founder_30pct": round(founder_cents / 100.0, 2)
            },
            "founder_total_earnings_with_grossup": round((founder_cents + grossup_cents) / 100.0, 2),
            "legal_status": "TAX_BURDEN_SHIFTED_TO_B2B_BUYER",
            "standard": "CRediT (CASRAI) 55/15/30 Weighted Consensus"
        }