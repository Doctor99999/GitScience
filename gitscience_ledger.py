#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_ledger.py — Биллинг Fair-Share 55/15/30 """
import json
from pathlib import Path
from typing import Dict, Any

class GitScienceLedger:
    def __init__(self, ledger_path: Path):
        self.ledger_path = Path(ledger_path)
        if not self.ledger_path.exists():
            self._save({"author_balance": 0.0, "infra_balance": 0.0, "founder_balance": 0.0})

    def _load(self) -> Dict[str, float]:
        return json.loads(self.ledger_path.read_text(encoding="utf-8"))

    def _save(self, data: Dict[str, float]):
        self.ledger_path.write_text(json.dumps(data, indent=4), encoding="utf-8")

    def process_payment(self, amount: float) -> Dict[str, float]:
        data = self._load()
        # Миграция старых реестров (70/30) на консенсус Аманата 55/15/30
        data.setdefault("author_balance", 0.0)
        data.setdefault("infra_balance", 0.0)
        data.setdefault("founder_balance", 0.0)

        # Целочисленная bps-математика в центах (5500/1500/3000) — исключает float precision loss
        amount_cents = int(round(amount * 100))
        author_cents = (amount_cents * 5500) // 10000
        infra_cents = (amount_cents * 1500) // 10000
        founder_cents = amount_cents - author_cents - infra_cents
        c = lambda x: x / 100.0
        author_share = c(author_cents)
        infra_share = c(infra_cents)
        founder_share = c(founder_cents)

        data["author_balance"] += author_share
        data["infra_balance"] += infra_share
        data["founder_balance"] += founder_share
        self._save(data)

        return {
            "paid": amount,
            "author_received_55pct": author_share,
            "infra_fee_15pct": infra_share,
            "founder_share_30pct": founder_share,
            "total_author_balance": data["author_balance"]
        }