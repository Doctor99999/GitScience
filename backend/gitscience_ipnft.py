# -*- coding: utf-8 -*-
"""
gitscience_ipnft.py — Sovereign IP-NFT Patent Tokenizer Engine
Формирует EIP-721/OpenSea совместимые метаданные для токенизации научных патентов и открытий
с жесткой привязкой CRediT матрицы и адреса AmanatSplitter (30% роялти).
"""
import uuid
import time
import hashlib
from typing import Dict, Any, List, Optional
import gitscience_storage as storage

class IPNFTEngine:
    """Движок генерации метаданных и токенизации IP-NFT"""

    @classmethod
    def generate_token_metadata(
        cls,
        registration_code: str,
        wallet_address: str = ""
    ) -> Dict[str, Any]:
        """
        Формирует EIP-721 совместимые метаданные для токенизации научной работы.

        Честная семантика: метаданные генерируются ТОЛЬКО для реально
        зарегистрированного манускрипта. Никакой фабрикации:
          * нет записи в реестре            -> RuntimeError (404)
          * контракт SovereignIPNFT не задеплоен -> RuntimeError (503)
          * поле mint_transaction_hash        -> НЕ заполняется без реальной
            ончейн-транзакции (None).
        Нажим/симуляция НЕ выдается за совершенный минт.
        """
        if not wallet_address:
            wallet_address = storage.get_founder_identity()["wallet"]
        article = storage.get_manuscript_by_code(registration_code)
        if not article:
            raise RuntimeError(f"Манускрипт {registration_code} не найден в реестре — минтить нечего")

        from .gitscience_web3 import cfg_get
        contract_address = cfg_get("contracts", "sovereign_ipnft")
        if not contract_address:
            raise RuntimeError(
                "Контракт SovereignIPNFT не задеплоен/не сконфигурирован — ончейн-минт невозможен. "
                "Укажите адрес в PROTOCOL_CONSTANTS.json `contracts.sovereign_ipnft` после деплоя."
            )

        metadata = {
            "name": f"GitScience™ IP-NFT: {article['title']}",
            "description": (
                f"Sovereign Intellectual Property NFT anchoring statutory Prior Art ({article['registration_code']}). "
                f"Governed by WIPO Paris Convention Art. 4 and Fair-Share Consensus (55/15/30)."
            ),
            "image": f"https://gitscience.org/assets/nft/{article['registration_code']}.png",
            "external_url": f"https://gitscience.org/verify/{article['registration_code']}",
            "attributes": [
                {"trait_type": "Registration Code", "value": article["registration_code"]},
                {"trait_type": "Lead Author", "value": article["author_name"]},
                {"trait_type": "ORCID iD", "value": article.get("orcid", "")},
                {"trait_type": "WIPO IPC Class", "value": article.get("ipc_class", "A61B")},
                {"trait_type": "Discipline", "value": article.get("category", "General Science")},
                {"trait_type": "SHA-256 Digest", "value": str(article.get("sha256_hash", ""))[:16] + "..."},
                {"trait_type": "AST Merkle Digest", "value": (article.get("ast_merkle_digest") or "N/A")[:16] + "..."},
                {"trait_type": "Regulatory Standard", "value": "RUO Class I CDSS"},
                {"trait_type": "Royalty Standard", "value": "EIP-2981 (30% Protocol Treasury)"},
                {"trait_type": "Consensus Model", "value": "55% Author / 15% Review / 30% Founder"}
            ],
            "properties": {
                "legal_statute": "35 U.S.C. § 102 & EPC Article 54(2)",
                "contract_splitter": wallet_address,
                "git_commit_oid": article.get("git_commit_hash", ""),
                "minted_by": wallet_address,
                "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        }

        token_id = int(hashlib.sha256(registration_code.encode()).hexdigest()[:8], 16)

        return {
            "status": "IP_NFT_MINT_READY",
            "token_id": token_id,
            "contract_address": contract_address,
            "network": "Base Mainnet / Polygon PoS",
            "mint_transaction_hash": None,
            "mint_status": "AWAITING_ONCHAIN_TRANSACTION",
            "owner_wallet": wallet_address,
            "metadata": metadata
        }
