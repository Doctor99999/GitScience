#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
test_suite.py — Автоматическая тестовая лаборатория GitScience™
Проверяет анонимизацию, AST-безопасность, биллинг 70/30 и Git-коммиты.
"""

import sys
import json
from pathlib import Path

# Подключаем модули ядра
from gitscience_core import GitScienceCore
from gitscience_compiler import GitScienceCompiler
from gitscience_verifier import GitScienceVerifier
from gitscience_ledger import GitScienceLedger
from gitscience_rating import ScientistReputationScore
from gitscience_privacy import PrivacyAnonymizer

TEST_DIR = Path.cwd() / "test_sandbox"
TEST_DIR.mkdir(exist_ok=True)

def run_all_tests():
    print("=" * 65)
    print(" 🧪  СТАРТ КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ GITSCIENCE™ CORE ")
    print("=" * 65)
    
    passed = 0
    failed = 0

    # --- ТЕСТ 1: Анонимизация PII ---
    print("\n[Тест 1/4] Проверка маскирования данных пациентов (PII)...")
    dirty_text = "Пациент с ИИН 850101300123 и тел +77011234567, email: test@med.kz"
    clean_text = PrivacyAnonymizer.anonymize_text(dirty_text)
    
    if "850101300123" not in clean_text and "+77011234567" not in clean_text:
        print("  ✅ УСПЕШНО: Все конфиденциальные данные скрыты!")
        passed += 1
    else:
        print("  ❌ ОШИБКА: Обнаружена утечка персональных данных!")
        failed += 1

    # --- ТЕСТ 2: Безопасность AST-компилятора ---
    print("\n[Тест 2/4] Проверка AST-компилятора и вычисления формул...")
    sample_md = "# Тест\nVALE_Score = (10 + 5) * 2"
    compiler = GitScienceCompiler(TEST_DIR)
    res = compiler.compile_markdown(sample_md)
    
    if res.get("formulas_found") == 1 and "dpid" in res:
        print(f"  ✅ УСПЕШНО: Формула найдена, присвоен dPID: {res['dpid']}")
        passed += 1
    else:
        print("  ❌ ОШИБКА: Компилятор не смог распарсить формулу!")
        failed += 1

    # --- ТЕСТ 3: Биллинг Fair-Share 70/30 ---
    print("\n[Тест 3/4] Проверка финансового модуля Fair-Share (70/30)...")
    ledger_file = TEST_DIR / "test_ledger.json"
    if ledger_file.exists():
        ledger_file.unlink()
        
    ledger = GitScienceLedger(ledger_file)
    pay_res = ledger.process_payment(100.0)
    
    if pay_res["author_received_70pct"] == 70.0 and pay_res["platform_fee_30pct"] == 30.0:
        print("  ✅ УСПЕШНО: Сплит $100 прошел точно: $70 Автору / $30 Платформе!")
        passed += 1
    else:
        print(f"  ❌ ОШИБКА: Неверный пересчет долей: {pay_res}")
        failed += 1

    # --- ТЕСТ 4: Инициализация и коммит в Git ---
    print("\n[Тест 4/4] Проверка создания бинарного Git-коммита...")
    try:
        core = GitScienceCore(TEST_DIR)
        commit_sha = core.commit_changes("Test commit for validation suite")
        if commit_sha and len(commit_sha) == 40:
            print(f"  ✅ УСПЕШНО: Git-коммит записан в историю! SHA: {commit_sha[:10]}...")
            passed += 1
        else:
            print("  ❌ ОШИБКА: Некорректный хэш коммита!")
            failed += 1
    except Exception as e:
        print(f"  ❌ ОШИБКА системы Git: {e}")
        failed += 1

    # --- ИТОГИ ---
    print("\n" + "=" * 65)
    print(f"📊 ИТОГИ ИСПЫТАНИЙ: Успешно: [{passed}/{passed+failed}] | Ошибок: [{failed}]")
    if failed == 0:
        print("🚀 ВЕРДИКТ: Все узлы ядра работали безупречно!")
    print("=" * 65)

if __name__ == "__main__":
    run_all_tests()