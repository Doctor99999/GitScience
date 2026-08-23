# -*- coding: utf-8 -*-
"""
GitScience Safe AST Compiler Engine v3.2-HARDENED
Изолированный синтаксический анализ и исполнение биомедицинских формул.
Стандарты: RUO (Research Use Only) / Math-as-a-Service (MaaS) / Deterministic Merkle AST.
Защита от DoS: лимиты глубины дерева (max 32), безопасные границы степеней и функций (exp, gamma).
"""
import ast
import math
import hashlib
from typing import Dict, Any, List, Tuple, Optional, Set

def safe_gamma(x: float) -> float:
    """Безопасное вычисление гамма-функции с защитой от переполнения float."""
    if x <= 0 or x > 171.0:
        raise ValueError(f"Аргумент gamma({x}) выходит за безопасный предел (0, 171].")
    return math.gamma(x)

def safe_exp(x: float) -> float:
    """Безопасное вычисление экспоненты с защитой от переполнения float."""
    if x > 700.0:
        raise OverflowError(f"Превышен безопасный предел exp({x}) > 700.0.")
    if x < -700.0:
        return 0.0
    return math.exp(x)

# Доверенный белый список математических функций и констант
ALLOWED_NAMES: Dict[str, Any] = {
    "exp": safe_exp,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "sinh": math.sinh,
    "cosh": math.cosh,
    "tanh": math.tanh,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "abs": abs,
    "min": min,
    "max": max,
    "round": round,
    "floor": math.floor,
    "ceil": math.ceil,
    "gamma": safe_gamma,
    "sigmoid": lambda x: 1.0 / (1.0 + safe_exp(-min(max(x, -500.0), 500.0))),
    "e": math.e,
    "pi": math.pi,
    "tau": math.tau,
    "inf": float("inf")
}

MAX_AST_DEPTH = 32

class SafeASTEvaluator(ast.NodeVisitor):
    """
    Безопасный интерпретатор абстрактного синтаксического дерева (AST).
    Полностью изолирован от встроенных функций Python (__builtins__ = None).
    """
    def __init__(self, variables: Optional[Dict[str, float]] = None):
        self.variables = variables or {}
        self.current_depth = 0

    def visit(self, node: ast.AST) -> Any:
        self.current_depth += 1
        if self.current_depth > MAX_AST_DEPTH:
            raise RecursionError(f"Превышена максимальная глубина синтаксического дерева (max {MAX_AST_DEPTH}).")
        try:
            method = 'visit_' + node.__class__.__name__
            visitor = getattr(self, method, self.generic_visit)
            return visitor(node)
        finally:
            self.current_depth -= 1

    def generic_visit(self, node: ast.AST) -> Any:
        raise TypeError(f"Запрещенная синтаксическая конструкция: '{node.__class__.__name__}'")

    def visit_Expression(self, node: ast.Expression) -> Any:
        return self.visit(node.body)

    def visit_Constant(self, node: ast.Constant) -> Any:
        if isinstance(node.value, (int, float)):
            return float(node.value)
        elif isinstance(node.value, bool):
            return float(1.0 if node.value else 0.0)
        raise TypeError(f"Запрещенный тип константы: '{type(node.value).__name__}'")

    def visit_Name(self, node: ast.Name) -> Any:
        if node.id in self.variables:
            return float(self.variables[node.id])
        if node.id in ALLOWED_NAMES:
            return ALLOWED_NAMES[node.id]
        raise ValueError(f"Неизвестная переменная или функция: '{node.id}'")

    def visit_BinOp(self, node: ast.BinOp) -> Any:
        left = self.visit(node.left)
        right = self.visit(node.right)
        
        if isinstance(node.op, ast.Add): return left + right
        elif isinstance(node.op, ast.Sub): return left - right
        elif isinstance(node.op, ast.Mult): return left * right
        elif isinstance(node.op, ast.Div):
            if abs(right) < 1e-15:
                raise ZeroDivisionError("Деление на ноль в биомедицинском уравнении")
            return left / right
        elif isinstance(node.op, ast.FloorDiv):
            if abs(right) < 1e-15:
                raise ZeroDivisionError("Целочисленное деление на ноль")
            return left // right
        elif isinstance(node.op, ast.Mod):
            if abs(right) < 1e-15:
                raise ZeroDivisionError("Остаток от деления на ноль")
            return left % right
        elif isinstance(node.op, ast.Pow):
            if abs(left) > 1e6 or abs(right) > 50.0:
                raise OverflowError(f"Превышен безопасный диапазон степени: {left} ** {right}")
            return left ** right
        raise TypeError(f"Неподдерживаемая бинарная операция: '{node.op.__class__.__name__}'")

    def visit_UnaryOp(self, node: ast.UnaryOp) -> Any:
        operand = self.visit(node.operand)
        if isinstance(node.op, ast.USub): return -operand
        elif isinstance(node.op, ast.UAdd): return +operand
        elif isinstance(node.op, ast.Not): return 0.0 if operand else 1.0
        raise TypeError(f"Неподдерживаемая унарная операция: '{node.op.__class__.__name__}'")

    def visit_Call(self, node: ast.Call) -> Any:
        func = self.visit(node.func)
        if not callable(func):
            raise TypeError(f"Объект не является вызываемой функцией: {func}")
        args = [self.visit(arg) for arg in node.args]
        return func(*args)


class ASTMerkleInspector(ast.NodeVisitor):
    """
    Канонический инспектор для извлечения переменных и построения детерминированного AST Merkle Tree.
    """
    def __init__(self):
        self.variables: Set[str] = set()
        self.functions: Set[str] = set()
        self.tokens: List[str] = []

    def visit_Name(self, node: ast.Name):
        if node.id in ALLOWED_NAMES:
            self.functions.add(node.id)
            self.tokens.append(f"F:{node.id}")
        else:
            self.variables.add(node.id)
            self.tokens.append(f"V:{node.id}")

    def visit_Constant(self, node: ast.Constant):
        self.tokens.append(f"C:{node.value}")

    def visit_BinOp(self, node: ast.BinOp):
        self.tokens.append(f"Op:{node.op.__class__.__name__}(")
        self.visit(node.left)
        self.visit(node.right)
        self.tokens.append(")")

    def visit_UnaryOp(self, node: ast.UnaryOp):
        self.tokens.append(f"UOp:{node.op.__class__.__name__}(")
        self.visit(node.operand)
        self.tokens.append(")")

    def visit_Call(self, node: ast.Call):
        self.tokens.append("Call(")
        self.visit(node.func)
        for arg in node.args:
            self.visit(arg)
        self.tokens.append(")")


def compute_ast_merkle_digest(formula_str: str) -> str:
    """
    Строит детерминированный криптографический Merkle-отпечаток структуры уравнения.
    Идентичные по структуре формулы (независимо от пробелов) дают идентичный дайджест.
    """
    try:
        clean_code = formula_str.strip()
        parsed_tree = ast.parse(clean_code, mode='eval')
        inspector = ASTMerkleInspector()
        inspector.visit(parsed_tree)
        canonical_representation = "|".join(inspector.tokens)
        return hashlib.sha256(canonical_representation.encode('utf-8')).hexdigest()
    except Exception as e:
        return hashlib.sha256(formula_str.strip().encode('utf-8')).hexdigest()

def extract_variables(formula_str: str) -> List[str]:
    """Извлекает список свободных биомедицинских переменных из формулы."""
    try:
        parsed_tree = ast.parse(formula_str.strip(), mode='eval')
        inspector = ASTMerkleInspector()
        inspector.visit(parsed_tree)
        return sorted(list(inspector.variables))
    except Exception:
        return []

def validate_formula(formula_str: str) -> Tuple[bool, Optional[str], Optional[str], List[str]]:
    """Полная валидация формулы: синтаксис, переменные и вычисление Merkle-дайджеста."""
    if not formula_str or not formula_str.strip():
        return False, "Формула не может быть пустой строкой", None, []

    try:
        parsed = ast.parse(formula_str.strip(), mode='eval')
        inspector = ASTMerkleInspector()
        inspector.visit(parsed)
        merkle = compute_ast_merkle_digest(formula_str)
        return True, None, merkle, sorted(list(inspector.variables))
    except SyntaxError as e:
        return False, f"Синтаксическая ошибка: {str(e)}", None, []
    except Exception as e:
        return False, f"Ошибка парсинга модели: {str(e)}", None, []

def execute_formula(formula_str: str, variables: Dict[str, float]) -> float:
    """Исполняет формулу в безопасном изолированном окружении с защитой от DoS."""
    parsed = ast.parse(formula_str.strip(), mode='eval')
    evaluator = SafeASTEvaluator(variables)
    result = evaluator.visit(parsed)
    return float(result)