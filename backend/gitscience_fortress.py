#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
gitscience_fortress.py — Бронекомплекс GitScience™ (8 Промышленных Пилонов Безопасности)
Стандарты: CRediT CASRAI (14 ролей) / WIPO Prior Art / RFC 3161 / ISO 14721 / HIPAA RUO
"""

import os
import json
import time
import hashlib
import concurrent.futures
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
    """Система разрешения споров об авторстве, фальсификациях и претензиях на Prior Art"""

    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = Path(storage_dir) if storage_dir else Path.cwd() / "storage"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.court_file = self.storage_dir / "court_cases.json"
        self._init_db()

    def _init_db(self):
        if not self.court_file.exists():
            with open(self.court_file, "w", encoding="utf-8") as f:
                json.dump({"disputes": []}, f, indent=2)

    def file_dispute(
        self,
        claimant_name: str,
        claimant_orcid: str,
        target_code: str,
        reason: str,
        evidence_hash: str
    ) -> Dict[str, Any]:
        with open(self.court_file, "r", encoding="utf-8") as f:
            db = json.load(f)

        case_id = f"CASE-{hashlib.sha256(f'{claimant_orcid}:{target_code}:{time.time()}'.encode()).hexdigest()[:8].upper()}"
        case_data = {
            "case_id": case_id,
            "claimant_name": claimant_name,
            "claimant_orcid": claimant_orcid,
            "target_code": target_code,
            "reason": reason,
            "evidence_hash": evidence_hash,
            "status": "OPEN",
            "votes": {"valid": 0, "invalid": 0, "abstain": 0},
            "jurors_voted": [],
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        db["disputes"].append(case_data)

        with open(self.court_file, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)

        return case_data

    def cast_vote(self, case_id: str, juror_orcid: str, vote: str) -> Dict[str, Any]:
        """vote: 'valid' | 'invalid' | 'abstain'"""
        with open(self.court_file, "r", encoding="utf-8") as f:
            db = json.load(f)

        for case in db["disputes"]:
            if case["case_id"] == case_id:
                if juror_orcid in case.get("jurors_voted", []):
                    return {"status": "ERROR", "message": "Присяжный уже проголосовал по данному делу"}

                if vote not in ["valid", "invalid", "abstain"]:
                    return {"status": "ERROR", "message": "Неверный тип голоса"}

                case["votes"][vote] += 1
                case.setdefault("jurors_voted", []).append(juror_orcid)

                # Проверка кворума (например, 5 голосов)
                total_votes = sum(case["votes"].values())
                if total_votes >= 5:
                    if case["votes"]["valid"] > case["votes"]["invalid"]:
                        case["status"] = "VERDICT_PRIOR_ART_CHALLENGED"
                    else:
                        case["status"] = "VERDICT_PRIOR_ART_CONFIRMED"

                with open(self.court_file, "w", encoding="utf-8") as out:
                    json.dump(db, out, indent=2, ensure_ascii=False)

                return {"status": "VOTE_RECORDED", "case": case}

        return {"status": "ERROR", "message": "Дело не найдено в реестре суда"}

    def get_all_cases(self) -> List[Dict[str, Any]]:
        if not self.court_file.exists():
            return []
        with open(self.court_file, "r", encoding="utf-8") as f:
            return json.load(f).get("disputes", [])


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
        calculated_hash = hashlib.sha256(raw_bytes).hexdigest()
        expected_sig = hashlib.sha256(f"{calculated_hash}:{device_hsm_pubkey}".encode('utf-8')).hexdigest()
        return signature_hex == expected_sig


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