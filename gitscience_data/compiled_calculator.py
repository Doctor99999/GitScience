#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
compiled_calculator.py — Автоматически сгенерированный БЕЗОПАСНЫЙ калькулятор GitScience™
НЕ использует eval(). Вычисления производятся через изолированный SafeASTEvaluator.
"""

import ast
from typing import Dict, Any, Union

FORMULAS = []

class UnsafeFormulaError(ValueError):
    pass

class SafeASTEvaluator:
    ALLOWED_OPERATORS = {
        ast.Add: lambda a, b: a + b,
        ast.Sub: lambda a, b: a - b,
        ast.Mult: lambda a, b: a * b,
        ast.Div: lambda a, b: a / b if b != 0 else float('nan'),
        ast.Pow: lambda a, b: a ** b if abs(b) <= 100 else float('inf'),
        ast.Mod: lambda a, b: a % b if b != 0 else float('nan'),
    }
    ALLOWED_UNARY = {
        ast.UAdd: lambda x: +x,
        ast.USub: lambda x: -x,
    }
    ALLOWED_FUNCTIONS = {
        'abs': abs, 'min': min, 'max': max, 'round': round, 'int': int, 'float': float
    }

    @classmethod
    def evaluate(cls, node: ast.AST, variables: Dict[str, Union[int, float]]) -> Union[int, float]:
        if isinstance(node, ast.Expression):
            return cls.evaluate(node.body, variables)
        elif isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise UnsafeFormulaError("Запрещенный тип константы")
        elif hasattr(ast, 'Num') and isinstance(node, ast.Num):
            return node.n
        elif isinstance(node, ast.Name):
            if node.id in variables:
                return variables[node.id]
            raise UnsafeFormulaError(f"Неизвестная переменная: '{node.id}'")
        elif isinstance(node, ast.BinOp):
            op_type = type(node.op)
            if op_type in cls.ALLOWED_OPERATORS:
                return cls.ALLOWED_OPERATORS[op_type](cls.evaluate(node.left, variables), cls.evaluate(node.right, variables))
            raise UnsafeFormulaError("Запрещенный оператор")
        elif isinstance(node, ast.UnaryOp):
            op_type = type(node.op)
            if op_type in cls.ALLOWED_UNARY:
                return cls.ALLOWED_UNARY[op_type](cls.evaluate(node.operand, variables))
            raise UnsafeFormulaError("Запрещенная унарная операция")
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in cls.ALLOWED_FUNCTIONS:
                func = cls.ALLOWED_FUNCTIONS[node.func.id]
                args = [cls.evaluate(arg, variables) for arg in node.args]
                return func(*args)
            raise UnsafeFormulaError("Запрещенный вызов функции")
        else:
            raise UnsafeFormulaError("Запрещенная AST-конструкция")

def calculate(params: Dict[str, Union[int, float]]) -> Dict[str, Any]:
    results = {}
    for f in FORMULAS:
        name = f["name"]
        expr = f["expression"]
        try:
            parsed_ast = ast.parse(expr, mode='eval')
            results[name] = SafeASTEvaluator.evaluate(parsed_ast, params)
        except Exception as err:
            results[name] = f"Error: {err}"
    return results
