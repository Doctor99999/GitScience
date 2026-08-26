# -*- coding: utf-8 -*-
"""
test_compiler.py — Unit Tests for Safe AST Compiler
"""
import pytest
import math
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import gitscience_compiler as compiler

def test_validate_formula_valid():
    is_valid, error, merkle, vars = compiler.validate_formula("(Artery + Vein) / (Lymph + 1.0)")
    assert is_valid is True
    assert error is None
    assert len(merkle) == 64
    assert "Artery" in vars
    assert "Vein" in vars
    assert "Lymph" in vars

def test_validate_formula_disallowed_syntax():
    is_valid, error, merkle, vars = compiler.validate_formula("__import__('os').system('ls')")
    assert is_valid is False
    assert error is not None

def test_execute_formula():
    res = compiler.execute_formula("(Artery + Vein) / (Lymph + 1.0)", {"Artery": 120.0, "Vein": 80.0, "Lymph": 3.0})
    assert res == 50.0

def test_safe_exp_protection():
    with pytest.raises(OverflowError):
        compiler.safe_exp(800.0)

def test_safe_gamma_protection():
    with pytest.raises(ValueError):
        compiler.safe_gamma(-5.0)

# =====================================================================
# RED TEAM REGRESSION (Production Hardening)
# =====================================================================

def test_redteam_attribute_chain_blocked():
    is_valid, error, _, _ = compiler.validate_formula("(1).__class__")
    assert is_valid is False

def test_redteam_lambda_blocked():
    is_valid, _, _, _ = compiler.validate_formula("(lambda x: x)(1)")
    assert is_valid is False

def test_redteam_kwargs_blocked():
    is_valid, _, _, _ = compiler.validate_formula("round(x=5)")
    assert is_valid is False

def test_redteam_dos_length_limit():
    is_valid, error, _, _ = compiler.validate_formula("1+" * 2000 + "1")
    assert is_valid is False
    assert "лимит" in (error or "")

def test_redteam_complex_pow_blocked():
    with pytest.raises(ValueError):
        compiler.execute_formula("(-8.0)**0.5", {})

def test_redteam_nan_inf_result_blocked():
    with pytest.raises(ValueError):
        compiler.execute_formula("inf", {})

def test_bps_router_conservation_exact():
    from gitscience_fortress import DependencyRoyaltyRouter
    s = DependencyRoyaltyRouter.calculate_split(
        123.45,
        [{"name": "A", "weight": 60}, {"name": "B", "weight": 40}]
    )
    parts = (
        s["author_pool_total"]
        + s["platform_allocations"]["infrastructure_15pct"]
        + s["platform_allocations"]["founder_30pct"]
    )
    assert round(parts, 2) == 123.45
    pays = sum(a["payout_usdt"] for a in s["authors_breakdown"])
    assert round(pays, 2) == s["author_pool_total"]

def test_bps_web3_settlement_conservation():
    from gitscience_web3 import SovereignWeb3Gateway
    w = SovereignWeb3Gateway.calculate_amanat_settlement(999.99)
    d = w["distribution"]
    total = d["author_pool_55_pct"] + d["infra_review_pool_15_pct"] + d["founder_treasury_30_pct"]
    assert round(total, 2) == 999.99
    assert w["total_b2b_invoice_usd"] == round(w["base_fee_usd"] * 1.2, 2)
