# -*- coding: utf-8 -*-
"""
build_gitscience_core.py — GitScience™ Core Auto-Builder  (ТЗ §5.2)

Автоматический сборщик эталонного ядра протокола. НЕ собирает систему вручную:
при запуске скрипт
  1. обнаруживает все изолированные модули ядра (backend/gitscience_*.py),
  2. валидирует каждый модуль на синтаксические ошибки через py_compile,
  3. проверяет согласованность консенсуса Fair-Share 55/15/30,
  4. пакует эталонное ядро в архив gitscience_core.zip вместе с манифестом,
     содержащим версию и SHA-256-фингерпринт каждого файла.

Команда обязана вызывать этот сборщик при добавлении/изменении функций ядра,
чтобы архив gitscience_core.zip всегда отражал актуальное состояние протокола.

Расположение артефакта:  <root>/gitscience_core.zip  (в .gitignore).
"""
import hashlib
import json
import py_compile
import shutil
import sys
import time
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
OUTPUT_ZIP = ROOT / "gitscience_core.zip"

# Canonical Fair-Share consensus (bps) — должно совпадать с PROTOCOL_CONSTANTS.json /
# contracts/AmanatSplitter.sol / genesis_protocol.c
EXPECTED_CONSENSUS = {
    "author_share_bps": 5500,
    "infra_fund_bps": 1500,
    "founder_share_bps": 3000,
    "total_bps": 10000,
    "b2b_tax_grossup_pct": 20,
}


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def discover_core_modules() -> list:
    """Ядро протокола = backend/gitscience_*.py (без роутера main.py и тестов)."""
    return sorted(BACKEND.glob("gitscience_*.py"))


def validate_syntax(modules: list) -> list:
    """py_compile-проверка каждого модуля; возвращает список (имя, ошибка)."""
    errors = []
    for m in modules:
        try:
            py_compile.compile(str(m), doraise=True)
        except py_compile.PyCompileError as e:
            errors.append((m.name, str(e)))
    return errors


def validate_consensus() -> list:
    """Сверка 55/15/30 + B2B Gross-Up между PROTOCOL_CONSTANTS.json и эталоном."""
    errors = []
    cfg_path = BACKEND / "PROTOCOL_CONSTANTS.json"
    if not cfg_path.exists():
        return [("PROTOCOL_CONSTANTS.json", "missing")]
    try:
        cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
        ff = cfg.get("fair_share_bps", {})
    except Exception as e:
        return [("PROTOCOL_CONSTANTS.json", str(e))]
    for key, expected in {
        "author_share_bps": 5500,
        "infra_fund_bps": 1500,
        "founder_share_bps": 3000,
        "total_bps": 10000,
    }.items():
        if int(ff.get(key, -1)) != expected:
            errors.append((f"fair_share_bps.{key}", f"{ff.get(key)} != {expected}"))
    # B2B Tax Gross-Up (+20%) — верхнеуровневый канонический параметр
    grossup = cfg.get("b2b_tax_grossup_pct", 20)
    if int(grossup) != EXPECTED_CONSENSUS["b2b_tax_grossup_pct"]:
        errors.append(("b2b_tax_grossup_pct", f"{grossup} != {EXPECTED_CONSENSUS['b2b_tax_grossup_pct']}"))
    return errors


def collect_aux_files() -> list:
    """Служебные файлы ядра вне backend/: константы, спецификация, контракты."""
    candidates = [
        BACKEND / "PROTOCOL_CONSTANTS.json",
        BACKEND / "requirements.txt",
        BACKEND / "Dockerfile",
        ROOT / "genesis_protocol.c",
        ROOT / "docker-compose.yml",
        ROOT / "render.yaml",
        ROOT / "Procfile",
        ROOT / "server.py",
    ]
    return [p for p in candidates if p.exists()]


def collect_contracts() -> list:
    return sorted((ROOT / "contracts" / "contracts").glob("*.sol"))


def build() -> dict:
    t0 = time.time()
    modules = discover_core_modules()
    aux = collect_aux_files()
    sols = collect_contracts()

    errors = validate_syntax(modules) + validate_consensus()
    if errors:
        print("[FAIL] Ядро НЕ собрано — ошибки:")
        for name, err in errors:
            print(f"  ✗ {name}: {err}")
        sys.exit(1)

    # Манифест
    manifest = {
        "protocol": "GitScience Sovereign Protocol",
        "build_timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "consensus": EXPECTED_CONSENSUS,
        "module_count": len(modules),
        "files": {},
    }
    if (BACKEND / "PROTOCOL_CONSTANTS.json").exists():
        try:
            manifest["protocol_version"] = json.loads(
                (BACKEND / "PROTOCOL_CONSTANTS.json").read_text(encoding="utf-8")
            ).get("version", "unknown")
        except Exception:
            manifest["protocol_version"] = "unknown"

    # Сборка архива
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in modules + aux + sols:
            arcname = p.relative_to(ROOT).as_posix()
            zf.write(p, arcname)
            manifest["files"][arcname] = _sha256(p)
        zf.writestr("CORE_MANIFEST.json", json.dumps(manifest, indent=2, ensure_ascii=False))

    size_kb = OUTPUT_ZIP.stat().st_size / 1024
    print("[OK] Ядро GitScience™ собрано:")
    print(f"  • модулей:            {len(modules)}")
    print(f"  • контрактов:         {len(sols)}")
    print(f"  • версия протокола:   {manifest.get('protocol_version')}")
    print(f"  • консенсус:          55/15/30 (+20% B2B Gross-Up) — проверен")
    print(f"  • манифест:           SHA-256 фингерпринты {len(manifest['files'])} файлов")
    print(f"  • архив:              {OUTPUT_ZIP.name} ({size_kb:.1f} KB)")
    print(f"  • время сборки:       {time.time() - t0:.2f} s")
    return manifest


if __name__ == "__main__":
    build()
