#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" dashboard.py — CLI-пульт управления GitScience™ """
import sys
import os
from pathlib import Path

sys.path.insert(0, os.getcwd())

from gitscience_core import GitScienceCore
from gitscience_compiler import GitScienceCompiler
from gitscience_verifier import GitScienceVerifier
from gitscience_ledger import GitScienceLedger
from gitscience_rating import ScientistReputationScore
from gitscience_privacy import PrivacyAnonymizer

def main():
    print("=" * 60)
    print(" 🏛️  GitScience™ CLI Command Center ")
    print("=" * 60)
    
    base_dir = Path.cwd() / "gitscience_data"
    base_dir.mkdir(exist_ok=True)
    
    core = GitScienceCore(base_dir)
    compiler = GitScienceCompiler(base_dir)
    verifier = GitScienceVerifier(base_dir)
    ledger = GitScienceLedger(base_dir / "ledger.json")
    rating = ScientistReputationScore(base_dir / "rating.json")
    
    print("[1] Создать манускрипт и скомпилировать формулу")
    print("[2] Запустить проверку целостности (Prior Art Shield)")
    print("[3] Симулировать коммерческий вызов API (Биллинг 70/30)")
    print("[4] Проверить репутационный балл SRS")
    print("[0] Выход")
    
    choice = input("\nВыберите действие (0-4): ").strip()
    
    if choice == "1":
        sample_md = "# Исправление риска\nRisk_Score = BaseRisk + 12.5"
        anon_md = PrivacyAnonymizer.anonymize_text(sample_md)
        res = compiler.compile_markdown(anon_md)
        commit_sha = core.commit_changes("Initial commit with compiled formula")
        print(f"\n✅ Скомпилировано! dPID: {res['dpid']}, Hash: {res['hash'][:10]}")
        print(f"✅ Коммит создан: {commit_sha[:10]}")
    elif choice == "3":
        pay_res = ledger.process_payment(100.0)
        rating.add_api_call()
        print(f"\n💳 Оплата обработана: Автору зачислено ${pay_res['author_received_70pct']} (70%), Платформе: ${pay_res['platform_fee_30pct']} (30%)")
    else:
        print("\nСистема готова к работе.")

if __name__ == "__main__":
    main()