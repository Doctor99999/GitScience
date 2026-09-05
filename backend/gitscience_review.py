"""
gitscience_review.py — Blind Peer-Review Engine v3.1
Система слепого криптографического рецензирования со строгой защитой:
1. Запрет саморецензирования (reviewer_orcid != author_orcid).
2. Проверка реального баланса фонда инфраструктуры перед выплатой.
3. Проверка валидности ORCID и существования статьи в реестре.
"""
import time
import json
import re
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional

import gitscience_storage as storage

class BlindPeerReviewEngine:
    """
    Система слепого рецензирования и фиксации консенсуса с защитой от фрода.
    """
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = Path(storage_dir) if storage_dir else Path.cwd() / "storage"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.reviews_file = self.storage_dir / "peer_reviews.json"
        self.attestations_file = self.storage_dir / "review_attestations.json"
        self._init_db()

    def _init_db(self):
        for f, seed in ((self.reviews_file, {"reviews": []}),
                        (self.attestations_file, {"attestations": [], "orcid_index": {}})):
            if not f.exists():
                with open(f, "w", encoding="utf-8") as fh:
                    json.dump(seed, fh, indent=2)

    def submit_blind_review(
        self,
        target_code: str,
        reviewer_orcid: str,
        math_rigor_score: int,      # 1 to 10
        methodology_score: int,     # 1 to 10
        ethics_score: int,          # 1 to 10
        novelty_score: int,         # 1 to 10
        review_comments: str
    ) -> Dict[str, Any]:
        """
        Регистрирует рецензию со строгой проверкой авторства и фонда.
        """
        clean_reviewer_orcid = reviewer_orcid.strip().replace("https://orcid.org/", "")
        if not re.match(r"^\d{4}-\d{4}-\d{4}-[\dXx]{4}$", clean_reviewer_orcid):
            return {"status": "ERROR", "error": "Неверный формат ORCID рецензента"}

        # 1. Проверка существования манускрипта
        article = storage.get_manuscript_by_code(target_code)
        if not article:
            return {"status": "ERROR", "error": f"Манускрипт {target_code} не найден в реестре"}

        # 2. Защита от саморецензирования (Self-Review Prohibition)
        author_orcid = article.get("orcid", "").strip().replace("https://orcid.org/", "")
        if clean_reviewer_orcid == author_orcid:
            return {
                "status": "ERROR",
                "error": "[Conflict of Interest] Author cannot peer-review their own manuscript."
            }

        # 3. Проверка наличия соавторства в CRediT
        credit_json = article.get("credit_roles_json", "")
        if credit_json:
            try:
                co_authors = json.loads(credit_json)
                co_orcids = [c.get("orcid", "").strip() for c in co_authors if isinstance(c, dict)]
                if clean_reviewer_orcid in co_orcids:
                    return {
                        "status": "ERROR",
                        "error": "[Conflict of Interest] Co-authors cannot serve as blind peer reviewers."
                    }
            except Exception:
                pass

        # 4. Проверка баланса фонда инфраструктуры
        current_infra_balance = storage.get_infra_fund_balance()
        reward_payout_usdt = 150.0
        is_paid = False

        if current_infra_balance >= reward_payout_usdt:
            is_paid = True
        else:
            reward_payout_usdt = 0.0  # Баланс недостаточен — рецензия принимается pro-bono

        total_score = (math_rigor_score + methodology_score + ethics_score + novelty_score) / 4.0
        passed = total_score >= 6.5

        review_id = f"REV-{hashlib.sha256(f'{target_code}:{clean_reviewer_orcid}:{time.time()}'.encode()).hexdigest()[:8].upper()}"

        record = {
            "review_id": review_id,
            "target_code": target_code,
            # Приватное поле авторства (НЕ возвращается в публичных списках рецензий —
            # слепое рецензирование сохраняется). Используется только для репутации
            # и самодекларируемых attestation рецензента.
            "reviewer_orcid": clean_reviewer_orcid,
            "reviewer_blind_hash": hashlib.sha256(clean_reviewer_orcid.encode()).hexdigest()[:16],
            "scores": {
                "math_rigor": math_rigor_score,
                "methodology": methodology_score,
                "ethics_compliance": ethics_score,
                "novelty_impact": novelty_score,
                "composite_grade": round(total_score, 2)
            },
            "recommendation": "ACCEPT_SOVEREIGN_CONSENSUS" if passed else "REVISE_METHODOLOGY",
            "review_comments": review_comments,
            "reward_disbursed_usdt": reward_payout_usdt if is_paid else 0.0,
            "payment_status": "PAID_FROM_INFRA_POOL" if is_paid else "PRO_BONO_INSUFFICIENT_POOL",
            "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        with open(self.reviews_file, "r", encoding="utf-8") as f:
            db = json.load(f)

        db["reviews"].append(record)

        with open(self.reviews_file, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)

        return {
            "status": "REVIEW_RECORDED",
            "review_id": review_id,
            "composite_score": round(total_score, 2),
            "reviewer_payout": f"${reward_payout_usdt} USDT" if is_paid else "$0.00 USDT (Фонд инфраструктуры пуст)",
            "consensus_status": "SOVEREIGN_CONSENSUS_VERIFIED" if passed else "PEER_REVIEW_IN_PROGRESS"
        }

    def get_reviews_for_article(self, target_code: str) -> List[Dict[str, Any]]:
        with open(self.reviews_file, "r", encoding="utf-8") as f:
            db = json.load(f)
        # Слепое рецензирование: публичный список НЕ раскрывает reviewer_orcid.
        return [
            {k: v for k, v in r.items() if k != "reviewer_orcid"}
            for r in db.get("reviews", []) if r.get("target_code") == target_code
        ]

    def get_all_reviews(self) -> List[Dict[str, Any]]:
        with open(self.reviews_file, "r", encoding="utf-8") as f:
            db = json.load(f)
        return [
            {k: v for k, v in r.items() if k != "reviewer_orcid"}
            for r in db.get("reviews", [])
        ]

    # ------------------------------------------------------------------
    # Reputation & Attestations (ResearchHub-style «verifiable meritocracy»)
    # ------------------------------------------------------------------

    @staticmethod
    def _clean_orcid(orcid: str) -> str:
        return orcid.strip().replace("https://orcid.org/", "")

    def _load_all_records(self) -> List[Dict[str, Any]]:
        with open(self.reviews_file, "r", encoding="utf-8") as f:
            return json.load(f).get("reviews", [])

    def get_reviewer_reputation(self, orcid: str) -> Dict[str, Any]:
        """Публичная агрегированная репутация рецензента (без раскрытия слепых рецензий)."""
        clean = self._clean_orcid(orcid)
        mine = [r for r in self._load_all_records() if r.get("reviewer_orcid") == clean]
        if not mine:
            return {
                "orcid": clean,
                "reviews_submitted": 0,
                "mean_composite_score": None,
                "accepted_recommendations": 0,
                "total_reward_disbursed_usdt": 0.0,
                "claimed_attestations_count": 0,
                "reviewer_verified": False,
            }

        composites = [float(r["scores"]["composite_grade"]) for r in mine if r.get("scores")]
        accepted = sum(1 for r in mine if r.get("recommendation") == "ACCEPT_SOVEREIGN_CONSENSUS")
        total_reward = sum(float(r.get("reward_disbursed_usdt", 0.0)) for r in mine)

        claimed = self.get_review_attestations(clean)
        return {
            "orcid": clean,
            "reviews_submitted": len(mine),
            "mean_composite_score": round(sum(composites) / len(composites), 2) if composites else None,
            "accepted_recommendations": accepted,
            "accentance_rate_pct": round(accepted / len(mine) * 100.0, 1),
            "total_reward_disbursed_usdt": round(total_reward, 2),
            "claimed_attestations_count": len(claimed),
            "reviewer_verified": len(claimed) > 0,
        }

    def claim_review_attestation(self, review_id: str, orcid: str) -> Dict[str, Any]:
        """Рецензент привязывает свою (ранее слепую) рецензию к публичному профилю.

        Требуется совпадение reviewer_orcid (проверяется на уровне API по JWT).
        Выдаёт криптографическую attestation — verifiable-запись рецензионного вклада.
        """
        clean = self._clean_orcid(orcid)
        record = next((r for r in self._load_all_records() if r.get("review_id") == review_id), None)
        if not record:
            return {"status": "ERROR", "error": f"Рецензия {review_id} не найдена"}
        if record.get("reviewer_orcid") != clean:
            return {"status": "ERROR", "error": "Attestation может выпустить только автор рецензии"}

        with open(self.attestations_file, "r", encoding="utf-8") as f:
            db = json.load(f)
        existing = [a for a in db.get("attestations", []) if a.get("review_id") == review_id]
        if existing:
            return {"status": "ATTESTATION_ALREADY_CLAIMED", "attestation": existing[0]}

        composite = record["scores"]["composite_grade"]
        attestation = {
            "orcid": clean,
            "review_id": review_id,
            "target_code": record["target_code"],
            "composite_score": composite,
            "recommendation": record["recommendation"],
            "reviewed_at_utc": record["timestamp_utc"],
            "claimed_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "attestation_sha256": hashlib.sha256(
                f"{clean}:{review_id}:{record['target_code']}:{composite}:{record['timestamp_utc']}".encode()
            ).hexdigest(),
            "verifier": "GitScience Sovereign Review Registry v1",
        }

        db.setdefault("attestations", []).append(attestation)
        db.setdefault("orcid_index", {}).setdefault(clean, []).append(review_id)
        with open(self.attestations_file, "w", encoding="utf-8") as f:
            json.dump(db, f, indent=2, ensure_ascii=False)

        return {"status": "ATTESTATION_ISSUED", "attestation": attestation}

    def get_review_attestations(self, orcid: str) -> List[Dict[str, Any]]:
        clean = self._clean_orcid(orcid)
        with open(self.attestations_file, "r", encoding="utf-8") as f:
            db = json.load(f)
        return [a for a in db.get("attestations", []) if a.get("orcid") == clean]

    def verify_attestation(self, attestation_sha256: str) -> Dict[str, Any]:
        """Проверка attestation: целостность и реальность рецензии в реестре."""
        with open(self.attestations_file, "r", encoding="utf-8") as f:
            db = json.load(f)
        att = next((a for a in db.get("attestations", []) if a.get("attestation_sha256") == attestation_sha256), None)
        if not att:
            return {"status": "ERROR", "error": "Attestation не найдена"}
        recompute = hashlib.sha256(
            f"{att['orcid']}:{att['review_id']}:{att['target_code']}:{att['composite_score']}:{att['reviewed_at_utc']}".encode()
        ).hexdigest()
        return {
            "status": "ATTESTATION_VALID" if recompute == attestation_sha256 else "HASH_MISMATCH",
            "attestation": att,
            "matches_registry": any(r.get("review_id") == att["review_id"] for r in self._load_all_records()),
        }
