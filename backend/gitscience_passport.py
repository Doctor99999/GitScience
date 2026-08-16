"""
gitscience_passport.py — Soulbound Researcher Passport & Git-Impact Score (GIS)
Суверенный научный паспорт исследователя и децентрализованный индекс репутации.
"""
import time
import hashlib
from typing import Dict, Any, List, Optional

class SoulboundPassportEngine:
    """
    Генератор суверенного криптографического паспорта исследователя и индекса GIS.
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
        Формула Git-Impact Score (GIS):
        GIS = (Citations * 1.5) + (Works * 5.0) + (MaaS_Runs * 0.25) + (CRediT_Lead * 8.0) + (Court_Wins * 15.0)
        """
        raw_score = (
            (citations_count * 1.5) +
            (works_count * 5.0) +
            (maas_executions_count * 0.25) +
            (credit_lead_roles_count * 8.0) +
            (court_victories * 15.0)
        )
        
        normalized_gis = round(min(max(raw_score, 10.0), 9999.0), 1)

        # Академический ранг в протоколе GitScience
        if normalized_gis >= 500.0:
            rank = "Sovereign Apex Fellow (Grandmaster)"
        elif normalized_gis >= 200.0:
            rank = "Distinguished Protocol Architect"
        elif normalized_gis >= 75.0:
            rank = "Senior Sovereign Scholar"
        else:
            rank = "Registered Sovereign Researcher"

        return {
            "git_impact_score": normalized_gis,
            "rank": rank,
            "breakdown": {
                "citations_pts": round(citations_count * 1.5, 1),
                "works_pts": round(works_count * 5.0, 1),
                "maas_executions_pts": round(maas_executions_count * 0.25, 1),
                "credit_leadership_pts": round(credit_lead_roles_count * 8.0, 1),
                "court_vindication_pts": round(court_victories * 15.0, 1)
            },
            "standard": "GitScience GIS Consensus v3.0"
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
        Выпускает неотчуждаемый Soulbound Research Passport (EIP-5114 compatible)
        """
        gis_data = cls.calculate_git_impact_score(works_count, citations_count)
        passport_id = f"SB-PASSPORT-{hashlib.sha256(f'{orcid}:{wallet_address}'.encode()).hexdigest()[:12].upper()}"
        
        signature = hashlib.sha256(f"GITSCIENCE_ROOT_AUTHORITY:{passport_id}:{gis_data['git_impact_score']}".encode()).hexdigest()

        return {
            "passport_id": passport_id,
            "orcid": orcid,
            "scholar_name": name,
            "institution": institution,
            "bound_wallet": wallet_address or "0x71C...3929",
            "git_impact_score": gis_data["git_impact_score"],
            "academic_rank": gis_data["rank"],
            "gis_breakdown": gis_data["breakdown"],
            "issued_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "cryptographic_seal": signature,
            "status": "SOULBOUND_IMMUTABLE_ACTIVE",
            "rights": [
                "Право голоса в Большом Академическом суде",
                "Право валидации AST математических формул",
                "Прямое получение 70% роялти Аманата",
                "Децентрализованный приоритет WIPO Prior Art"
            ]
        }
