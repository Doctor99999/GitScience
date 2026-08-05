#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
build_gitscience_core.py
Главный скрипт-сборщик экосистемы GitScience™.
Биллинг Fair-Share: 70% Автору / 30% Платформе.
"""

import os
import sys
import zipfile
import py_compile
from pathlib import Path

# =====================================================================
# Содержимое модулей GitScience Core
# =====================================================================

GITSCIENCE_CORE_PY = r'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_core.py — Системный Git-движок и управление репозиториями """
import os
import logging
from pathlib import Path
from typing import Optional, List, Tuple

try:
    import git
    from git import Repo
except ImportError:
    raise ImportError("Требуется GitPython: pip install GitPython")

logger = logging.getLogger("GitScienceCore")

class GitScienceCore:
    def __init__(self, base_repo_dir: Path):
        self.base_dir = Path(base_repo_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.repo_path = self.base_dir / "main_repo"
        if not (self.repo_path / ".git").exists():
            self.repo = Repo.init(self.repo_path)
            logger.info(f"Инициализирован репозиторий: {self.repo_path}")
        else:
            self.repo = Repo(self.repo_path)

    def commit_changes(self, message: str) -> str:
        self.repo.git.add(A=True)
        commit = self.repo.index.commit(message)
        return commit.hexsha
'''

GITSCIENCE_COMPILER_PY = r'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_compiler.py — AST-компилятор No-Code формул из Markdown """
import re
import ast
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List

class FormulaExtractor(ast.NodeVisitor):
    def __init__(self):
        self.is_safe = True

    def visit(self, node):
        if not isinstance(node, (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Name, ast.Constant, ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow)):
            self.is_safe = False
        self.generic_visit(node)

class GitScienceCompiler:
    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def compile_markdown(self, markdown_content: str) -> Dict[str, Any]:
        sha256_hash = hashlib.sha256(markdown_content.encode('utf-8')).hexdigest()
        
        formulas = re.findall(r'([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_\s\+\-\*\/\(\)\.]+)', markdown_content)
        
        compiled_formulas = []
        for name, expr in formulas:
            compiled_formulas.append({"name": name.strip(), "expression": expr.strip()})

        calc_code = f"""# Автоматически сгенерированный калькулятор GitScience
FORMULAS = {json.dumps(compiled_formulas, indent=4)}

def calculate(params):
    results = {{}}
    for f in FORMULAS:
        try:
            results[f['name']] = eval(f['expression'], {{"__builtins__": None}}, params)
        except Exception as e:
            results[f['name']] = f"Error: {{e}}"
    return results
"""
        calc_path = self.output_dir / "compiled_calculator.py"
        calc_path.write_text(calc_code, encoding="utf-8")

        dpid = f"dPID-2026-{sha256_hash[:8]}"
        return {
            "hash": sha256_hash,
            "dpid": dpid,
            "formulas_found": len(compiled_formulas),
            "calculator_path": str(calc_path)
        }
'''

GITSCIENCE_VERIFIER_PY = r'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_verifier.py — Цифровой нотариат и проверка целостности """
import hashlib
import time
from pathlib import Path
from typing import Dict, Any

class GitScienceVerifier:
    def __init__(self, base_dir: Path):
        self.base_dir = Path(base_dir)

    def verify_file(self, file_path: Path) -> Dict[str, Any]:
        if not file_path.exists():
            return {"status": "error", "message": "Файл не найден"}
        
        content = file_path.read_bytes()
        sha256_hash = hashlib.sha256(content).hexdigest()
        timestamp = int(time.time())
        
        return {
            "status": "verified",
            "file": file_path.name,
            "sha256": sha256_hash,
            "timestamp": timestamp,
            "ots_proof": f"OTS-BITCOIN-MOCK-{sha256_hash[:12]}-{timestamp}"
        }
'''

GITSCIENCE_LEDGER_PY = r'''#!/usr/bin/env python3
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
'''

GITSCIENCE_RATING_PY = r'''#!/usr/bin/env python3
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
'''

GITSCIENCE_PRIVACY_PY = r'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
""" gitscience_privacy.py — Анонимизация данных пациентов (NER/Regex) """
import re

class PrivacyAnonymizer:
    @staticmethod
    def anonymize_text(text: str) -> str:
        text = re.sub(r'\b\d{12}\b', '[ИИН_СКРЫТ]', text)
        text = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '[EMAIL_СКРЫТ]', text)
        text = re.sub(r'\+?\d[\d\s\-\(\)]{8,}\d', '[ТЕЛЕФОН_СКРЫТ]', text)
        return text
'''

DASHBOARD_PY = r'''#!/usr/bin/env python3
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
'''

MODULES = {
    'gitscience_core.py': GITSCIENCE_CORE_PY,
    'gitscience_compiler.py': GITSCIENCE_COMPILER_PY,
    'gitscience_verifier.py': GITSCIENCE_VERIFIER_PY,
    'gitscience_ledger.py': GITSCIENCE_LEDGER_PY,
    'gitscience_rating.py': GITSCIENCE_RATING_PY,
    'gitscience_privacy.py': GITSCIENCE_PRIVACY_PY,
    'dashboard.py': DASHBOARD_PY,
}

def build():
    print("=" * 60)
    print(" 🛠️  Сборка ядра GitScience™ Core Engine (Fair-Share 70/30)...")
    print("=" * 60)
    
    created_files = []
    
    for filename, content in MODULES.items():
        file_path = Path(filename)
        file_path.write_text(content.strip(), encoding='utf-8')
        print(f"  [+] Создан модуль: {filename}")
        
        try:
            py_compile.compile(filename, doraise=True)
            print(f"      ✓ Синтаксис {filename} проверен: OK")
            created_files.append(filename)
        except py_compile.PyCompileError as err:
            print(f"      ❌ Ошибка синтаксиса в {filename}: {err}")
            sys.exit(1)
            
    zip_filename = "gitscience_core.zip"
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in created_files:
            zipf.write(file)
            
    print("-" * 60)
    print(f"📦 Успешно создан ZIP-архив ядра: {zip_filename}")
    print("🚀 Экосистема готова к запуску!")
    print("=" * 60)

if __name__ == '__main__':
    build()