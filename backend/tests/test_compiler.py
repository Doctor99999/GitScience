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
