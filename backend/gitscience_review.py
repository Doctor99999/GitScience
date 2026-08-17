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
        self._init_db()

    def _init_db(self):
        if not self.reviews_file.exists():
            with open(self.reviews_file, "w", encoding="utf-8") as f:
                json.dump({"reviews": []}, f, indent=2)

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
        return [r for r in db.get("reviews", []) if r.get("target_code") == target_code]

    def get_all_reviews(self) -> List[Dict[str, Any]]:
        with open(self.reviews_file, "r", encoding="utf-8") as f:
            db = json.load(f)
        return db.get("reviews", [])
