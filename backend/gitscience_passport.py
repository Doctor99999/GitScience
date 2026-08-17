"""
gitscience_passport.py — Sovereign Researcher Profile & Activity Metric (GIS)
Внутренний профиль исследователя в протоколе GitScience и расчет индекса активности платформы.
Строгое разграничение: внутренний профиль платформы, без фиктивных блокчейн-стандартов.
"""
import time
import hashlib
from typing import Dict, Any, List, Optional

class SoulboundPassportEngine:
    """
    Генератор суверенного профиля исследователя и внутреннего индекса активности (GIS).
    """

    @staticmethod
    def calculate_git_impact_score(
        works_count: int,
        citations_count: int,
        maas_executions_count: int = 140,
        credit_lead_roles_count: int = 4,
        court_victories: int = 1
    ) -> Dict[str, Any]:
        """
        Внутренняя экспериментальная формула активности GitScience Impact Score (GIS):
        Взвешенная сумма реальных цитирований, проверенных формул и участия в CRediT.
        """
        raw_score = (
            (citations_count * 1.5) +
            (works_count * 5.0) +
            (maas_executions_count * 0.25) +
            (credit_lead_roles_count * 8.0) +
            (court_victories * 15.0)
        )
        
        normalized_gis = round(min(max(raw_score, 10.0), 9999.0), 1)

        # Внутренний уровень активности в платформе GitScience
        if normalized_gis >= 500.0:
            rank = "Apex Protocol Contributor"
        elif normalized_gis >= 200.0:
            rank = "Distinguished Scientific Contributor"
        elif normalized_gis >= 75.0:
            rank = "Senior Verified Scholar"
        else:
            rank = "Registered Sovereign Researcher"

        return {
            "git_impact_score": normalized_gis,
            "rank": rank,
            "methodology_note": "Экспериментальный внутренний скоринг платформы (не заменяет глобальный h-index)",
            "breakdown": {
                "citations_pts": round(citations_count * 1.5, 1),
                "works_pts": round(works_count * 5.0, 1),
                "maas_executions_pts": round(maas_executions_count * 0.25, 1),
                "credit_leadership_pts": round(credit_lead_roles_count * 8.0, 1),
                "court_vindication_pts": round(court_victories * 15.0, 1)
            }
        }

    @classmethod
    def issue_soulbound_passport(
        cls,
        orcid: str,
        name: str,
        institution: str,
        wallet_address: Optional[str] = None,
        works_count: int = 12,
        citations_count: int = 28
    ) -> Dict[str, Any]:
        """
        Формирует структуру суверенного профиля исследователя
        """
        gis_data = cls.calculate_git_impact_score(works_count, citations_count)
        profile_id = f"GS-PROFILE-{hashlib.sha256(f'{orcid}:{wallet_address}'.encode()).hexdigest()[:12].upper()}"
        
        # Честный дайджест целостности структуры профиля
        integrity_hash = hashlib.sha256(f"GITSCIENCE_NODE_ATTESTATION:{profile_id}:{gis_data['git_impact_score']}".encode()).hexdigest()

        return {
            "profile_id": profile_id,
            "orcid": orcid,
            "scholar_name": name,
            "institution": institution,
            "associated_wallet": wallet_address or "0x71C...3929",
            "git_impact_score": gis_data["git_impact_score"],
            "platform_tier": gis_data["rank"],
            "gis_breakdown": gis_data["breakdown"],
            "issued_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "profile_integrity_hash": integrity_hash,
            "status": "LOCAL_PROFILE_ACTIVE",
            "rights": [
                "Участие в голосованиях Академического суда",
                "Депонирование манускриптов и формул Safe AST",
                "Получение авторских выплат через Amanat Royalty Router"
            ]
        }
