#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_rating.py — Репутационный движок SRS """
import json
from pathlib import Path

class ScientistReputationScore:
    def __init__(self, rating_path: Path):
        self.rating_path = Path(rating_path)
        if not self.rating_path.exists():
            self._save({"srs": 100, "replications": 0, "api_calls": 0})

    def _load(self):
        return json.loads(self.rating_path.read_text(encoding="utf-8"))

    def _save(self, data):
        self.rating_path.write_text(json.dumps(data, indent=4), encoding="utf-8")

    def add_replication(self):
        data = self._load()
        data["replications"] += 1
        data["srs"] += 50
        self._save(data)
        return data

    def add_api_call(self):
        data = self._load()
        data["api_calls"] += 1
        data["srs"] += 5
        self._save(data)
        return data