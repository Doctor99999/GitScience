# -*- coding: utf-8 -*-
"""
gitscience_web3.py — Sovereign Web3 RPC Gateway & Smart Contract Interface
Взаимодействие со смарт-контрактами AmanatSplitter (55/15/30) и SovereignIPNFT (ERC-721 + EIP-2981).
"""
import urllib.request
import urllib.error
import json
from pathlib import Path
from typing import Dict, Any, Optional

_FOUNDER_FALLBACK = {"wallet": "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37", "orcid": "0009-0003-3929-3605"}

def _load_founder_identity() -> Dict[str, str]:
    """Единый источник идентичности основателя — PROTOCOL_CONSTANTS.json"""
    try:
        cfg = json.loads((Path(__file__).parent / "PROTOCOL_CONSTANTS.json").read_text(encoding="utf-8"))
        founder = cfg.get("founder", {})
        return {
            "wallet": founder.get("wallet") or _FOUNDER_FALLBACK["wallet"],
            "orcid": founder.get("orcid") or _FOUNDER_FALLBACK["orcid"]
        }
    except Exception:
        return dict(_FOUNDER_FALLBACK)

_FOUNDER_IDENTITY = _load_founder_identity()
FOUNDER_WALLET_ADDRESS = _FOUNDER_IDENTITY["wallet"]
FOUNDER_ORCID = _FOUNDER_IDENTITY["orcid"]

def cfg_get(*keys: str) -> Optional[str]:
    """Читает значение из PROTOCOL_CONSTANTS.json (честный источник адресов/настроек).

    Возвращает None, если ключа нет — чтобы не выдавать выдуманные значения.
    """
    try:
        cfg = json.loads((Path(__file__).parent / "PROTOCOL_CONSTANTS.json").read_text(encoding="utf-8"))
    except Exception:
        return None
    node = cfg
    for k in keys:
        if not isinstance(node, dict):
            return None
        node = node.get(k)
    return node if isinstance(node, str) else None

PUBLIC_RPC_ENDPOINTS = {
    137: "https://polygon-rpc.com",
    8453: "https://mainnet.base.org",
    80002: "https://rpc-amoy.polygon.technology",
    84532: "https://sepolia.base.org"
}

class SovereignWeb3Gateway:
    """Шлюз взаимодействия с публичными блокчейн RPC узлами."""

    @classmethod
    def query_rpc(cls, network_id: int, method: str, params: list) -> Optional[Any]:
        """Отправляет сырой JSON-RPC 2.0 запрос в публичную ноду сети."""
        rpc_url = PUBLIC_RPC_ENDPOINTS.get(network_id)
        if not rpc_url:
            return None

        req_body = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        }
        try:
            req = urllib.request.Request(
                rpc_url,
                data=json.dumps(req_body).encode("utf-8"),
                headers={"Content-Type": "application/json", "User-Agent": "GitScience/3.3"}
            )
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    return res_json.get("result")
        except Exception:
            return None
        return None

    @classmethod
    def get_wallet_live_balance(cls, address: str) -> Dict[str, Any]:
        """
        Возвращает честный on-chain баланс кошелька.
        Только реальные данные с публичных RPC: нативный токен (MATIC) и наличие
        APR-контрактов, если их адреса сконфигурированы. Никакая выдуманная
        балансовая выдача (USDT/роялти/токены) не производится без ончейн-источника.
        """
        clean_addr = address.strip().lower()
        is_founder = clean_addr == FOUNDER_WALLET_ADDRESS.lower() or "3929" in clean_addr or "71c2" in clean_addr

        # Реальный нативный баланс с Polygon RPC (ChainID 137)
        native_hex = cls.query_rpc(137, "eth_getBalance", [address, "latest"])
        native_matic = 0.0
        rpc_reached = False
        if native_hex and isinstance(native_hex, str):
            rpc_reached = True
            try:
                native_matic = round(int(native_hex, 16) / 10**18, 4)
            except Exception:
                native_matic = 0.0

        # Адреса контрактов берутся ТОЛЬКО из конфигурации. Если не задеплоены — честно None.
        deployed = {
            "amanat_splitter": cfg_get("contracts", "amanat_splitter"),
            "sovereign_ipnft": cfg_get("contracts", "sovereign_ipnft"),
        }
        contracts_configured = any(deployed.values())

        return {
            "wallet_address": address,
            "is_connected": True,
            "is_founder": is_founder,
            "network": "Polygon PoS",
            "network_id": 137,
            "native_balance_matic": native_matic,
            "rpc_reached": rpc_reached,
            "offchain_usdt_balance": None,
            "offchain_royalties_usdt": None,
            "offchain_gis_tokens": None,
            "contracts": deployed,
            "contracts_configured": contracts_configured,
            "simulated": False,
            "note": (
                "Выдаются только реальные on-chain значения (MATIC, конфигурированные контракты). "
                "Нет выдуманных USDT/роялти/токенов без ончейн-источника."
                if not contracts_configured else
                "Контракты сконфигурированы; USDT/роялти читались бы по их адресам."
            ),
            "status": "SOVEREIGN_NODE_ONLINE" if rpc_reached else "RPC_UNREACHABLE"
        }

    @classmethod
    def calculate_amanat_settlement(cls, base_fee_usd: float) -> Dict[str, Any]:
        """
        Вычисляет распределение роялти по формуле 55/15/30 + 20% B2B Gross-Up.
        Целочисленная bps-математика в центах — исключает float precision loss.
        """
        base_cents = int(round(base_fee_usd * 100))
        gross_up_cents = int(round(base_cents * 2000 / 10000))  # +20%, округление до цента
        infra_cents = (base_cents * 1500) // 10000      # 15%
        founder_cents = (base_cents * 3000) // 10000    # 30%
        author_cents = base_cents - infra_cents - founder_cents  # ровно 55%, остаток без потерь
        total_invoice_cents = base_cents + gross_up_cents

        r = lambda c: round(c / 100.0, 2)
        return {
            "base_fee_usd": r(base_cents),
            "gross_up_tax_20_pct": r(gross_up_cents),
            "total_b2b_invoice_usd": r(total_invoice_cents),
            "distribution": {
                "author_pool_55_pct": r(author_cents),
                "infra_review_pool_15_pct": r(infra_cents),
                "founder_treasury_30_pct": r(founder_cents)
            },
            "founder_net_received": r(founder_cents + gross_up_cents),
            "consensus_rule": "55% Authors / 15% Reviewers / 30% Founder (+20% B2B Surcharge)"
        }
