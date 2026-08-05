#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_ledger.py — Биллинг Fair-Share 70/30 """
import json
from pathlib import Path
from typing import Dict, Any

class GitScienceLedger:
    def __init__(self, ledger_path: Path):
        self.ledger_path = Path(ledger_path)
        if not self.ledger_path.exists():
            self._save({"author_balance": 0.0, "platform_balance": 0.0})

    def _load(self) -> Dict[str, float]:
        return json.loads(self.ledger_path.read_text(encoding="utf-8"))

    def _save(self, data: Dict[str, float]):
        self.ledger_path.write_text(json.dumps(data, indent=4), encoding="utf-8")

    def process_payment(self, amount: float) -> Dict[str, float]:
        data = self._load()
        author_share = amount * 0.70
        platform_share = amount * 0.30
        
        data["author_balance"] += author_share
        data["platform_balance"] += platform_share
        self._save(data)
        
        return {
            "paid": amount,
            "author_received_70pct": author_share,
            "platform_fee_30pct": platform_share,
            "total_author_balance": data["author_balance"]
        }