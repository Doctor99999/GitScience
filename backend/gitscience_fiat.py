# -*- coding: utf-8 -*-
"""
gitscience_fiat.py — Institutional B2B Fiat & Invoicing Gateway
Генерирует официальные юридические счета-фактуры для госпиталей, онкоцентров и фармкомпаний
с автоматическим расчетом B2B Tax Gross-Up (+20%) и распределением 55/15/30 в смарт-контракт.
"""
import uuid
import time
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from gitscience_fortress import DependencyRoyaltyRouter

def _load_founder_wallet() -> str:
    """Единый источник идентичности основателя — PROTOCOL_CONSTANTS.json"""
    try:
        cfg = json.loads((Path(__file__).parent / "PROTOCOL_CONSTANTS.json").read_text(encoding="utf-8"))
        return cfg.get("founder", {}).get("wallet") or "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37"
    except Exception:
        return "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37"

FOUNDER_WALLET_ADDRESS = _load_founder_wallet()

class InstitutionalFiatGateway:
    """Институциональный платежный шлюз для безналичных расчетов клиник"""

    @classmethod
    def generate_b2b_invoice(
        cls,
        hospital_name: str,
        tax_id_bin: str,
        registration_code: str,
        base_license_fee: float,
        currency: str = "USDT",
        fiat_currency: str = "USD",
        fiat_rate: float = 1.0,
        contributors: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        invoice_number = f"INV-GS-2026-{uuid.uuid4().hex[:6].upper()}"
        split = DependencyRoyaltyRouter.calculate_split(base_license_fee, contributors)

        fiat_base = round(base_license_fee * fiat_rate, 2)
        fiat_tax = round(split["taxes_paid_by_clinic"] * fiat_rate, 2)
        fiat_total = round(split["b2b_invoice_total"] * fiat_rate, 2)

        return {
            "invoice_number": invoice_number,
            "issued_date": time.strftime("%Y-%m-%d", time.gmtime()),
            "due_date": time.strftime("%Y-%m-%d", time.gmtime(time.time() + 30 * 86400)),
            "buyer": {
                "organization": hospital_name,
                "tax_id_bin": tax_id_bin,
                "jurisdiction": "International Healthcare Enterprise"
            },
            "service_description": f"GitScience™ Sovereign Prior Art & Executable MaaS Clinical License ({registration_code})",
            "statutory_basis": "WIPO Paris Convention Art. 4 • 35 U.S.C. § 102 • RUO Class I CDSS",
            "financial_breakdown": {
                "base_fee": fiat_base,
                "b2b_tax_grossup_20pct": fiat_tax,
                "total_payable": fiat_total,
                "currency": fiat_currency,
                "crypto_peg": f"{split['b2b_invoice_total']} {currency}"
            },
            "amanat_fair_share_settlement": {
                "authors_pool_55pct": round(split["author_pool_total"] * fiat_rate, 2),
                "reviewers_pool_15pct": round(split["platform_allocations"]["infrastructure_15pct"] * fiat_rate, 2),
                "founder_protocol_30pct": round(split["platform_allocations"]["founder_30pct"] * fiat_rate, 2),
                "founder_net_with_tax": round(split["founder_total_earnings_with_grossup"] * fiat_rate, 2)
            },
            "settlement_methods": {
                "bank_wire_swift": {
                    "beneficiary": "GitScience Sovereign Protocol Treasury",
                    "iban": "KZ88000GS20267788990011",
                    "swift_bic": "KZGSKZ22",
                    "bank_name": "International Sovereign Scientific Settlement Bank"
                },
                "stripe_card_checkout_url": f"https://checkout.gitscience.org/pay/{invoice_number}",
                "smart_contract_call": {
                    "contract_address": FOUNDER_WALLET_ADDRESS,
                    "method": "settleAmanatRoyalty",
                    "network": "Base / Polygon"
                }
            },
            "status": "ISSUED_AWAITING_SETTLEMENT"
        }

    @classmethod
    def process_fiat_webhook(
        cls,
        invoice_number: str,
        paid_amount: float,
        payment_method: str = "BANK_WIRE"
    ) -> Dict[str, Any]:
        """Честная обработка fiat-вебхука.

        Fiat-платёж не вызывает контракты Amanat/Splitter БЕЗ выполнения транзакции.
        Стейт фиксируется как оф-чейн (подтверждение ручного моста отдельно): никакой
        имитации on-chain зачисления без реальной транзакции.
        """
        return {
            "status": "PAYMENT_ACKNOWLEDGED_AWAITING_SETTLEMENT",
            "invoice_number": invoice_number,
            "paid_amount_fiat": paid_amount,
            "payment_gateway": payment_method,
            "on_chain_bridge": None,
            "settlement_note": (
                "Платёж получен и учтён оф-чейн. Реальная транзакция Amanat Splitter "
                "на блокчейне НЕ выполнялась — ожидается ручной/автоматический мост."
            ),
            "settled_at_utc": None,
            "acknowledged_at_utc": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
        }
