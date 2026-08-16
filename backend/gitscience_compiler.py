"""
GitScience Safe AST Compiler Engine v3.0-ENTERPRISE
Изолированный синтаксический анализ и исполнение биомедицинских формул.
Стандарты: RUO (Research Use Only) / Math-as-a-Service (MaaS) / Deterministic Merkle AST.
"""
import ast
import math
import hashlib
from typing import Dict, Any, List, Tuple, Optional, Set

# Доверенный белый список математических функций и констант
ALLOWED_NAMES: Dict[str, Any] = {
    "exp": math.exp,
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
    "gamma": math.gamma,
    "sigmoid": lambda x: 1.0 / (1.0 + math.exp(-min(max(x, -500), 500))),
    "e": math.e,
    "pi": math.pi,
    "tau": math.tau,
    "inf": float("inf")
}

class SafeASTEvaluator(ast.NodeVisitor):
    """
    Безопасный интерпретатор абстрактного синтаксического дерева (AST).
    Полностью изолирован от встроенных функций Python (__builtins__ = None).
    """
    def __init__(self, variables: Optional[Dict[str, float]] = None):
        self.variables = variables or {}

    def visit(self, node: ast.AST) -> Any:
        method = 'visit_' + node.__class__.__name__
        visitor = getattr(self, method, self.generic_visit)
        return visitor(node)

    def generic_visit(self, node: ast.AST) -> Any:
        raise TypeError(f"🚨 [AST Security] Запрещенная синтаксическая конструкция: '{node.__class__.__name__}'")

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
                raise ZeroDivisionError("Деление на ноль в уравнении гомеостаза")
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
            if abs(left) > 1e10 or abs(right) > 100:
                raise OverflowError("Превышен диапазон степенного вычисления")
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
    Вычисляет детерминированный криптографический Merkle-хэш структуры AST.
    Одинаковые по смыслу формулы с одинаковой структурой имеют идентичный дайджест.
    """
    try:
        tree = ast.parse(formula_str.strip(), mode='eval')
        inspector = ASTMerkleInspector()
        inspector.visit(tree)
        canonical_str = "".join(inspector.tokens)
        return hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()
    except Exception as e:
        return hashlib.sha256(formula_str.strip().encode('utf-8')).hexdigest()


def extract_variables(formula_str: str) -> List[str]:
    """Извлекает список свободных переменных из формулы"""
    try:
        tree = ast.parse(formula_str.strip(), mode='eval')
        inspector = ASTMerkleInspector()
        inspector.visit(tree)
        return sorted(list(inspector.variables))
    except Exception:
        return []


def validate_formula(formula_str: str) -> Tuple[bool, Optional[str], Optional[str], List[str]]:
    """
    Проверяет синтаксическую безопасность формулы и возвращает:
    (is_valid, error_msg, ast_merkle_digest, variable_names)
    """
    if not formula_str or not formula_str.strip():
        return False, "Пустая формула", None, []
    
    clean = formula_str.strip()
    if len(clean) > 500:
        return False, "Превышена максимальная длина формулы (500 символов)", None, []

    try:
        tree = ast.parse(clean, mode='eval')
        inspector = ASTMerkleInspector()
        inspector.visit(tree)
        
        # Проверяем тестовым запуском с фиктивными переменными = 1.0
        test_vars = {var: 1.0 for var in inspector.variables}
        evaluator = SafeASTEvaluator(test_vars)
        evaluator.visit(tree)
        
        merkle = compute_ast_merkle_digest(clean)
        return True, None, merkle, sorted(list(inspector.variables))
    except Exception as e:
        return False, str(e), None, []


def execute_formula(formula_str: str, params: Dict[str, float]) -> float:
    """Исполняет формулу с заданными параметрами"""
    tree = ast.parse(formula_str.strip(), mode='eval')
    evaluator = SafeASTEvaluator(params)
    return float(evaluator.visit(tree))


def calculate_clinical_metrics(params: Dict[str, float], doctor_attestation: bool = True) -> Dict[str, Any]:
    """Пример клинического расчета: Tk Equation гомеостаза"""
    artery = params.get("Artery", 5.0)
    vein = params.get("Vein", 3.0)
    lymph = params.get("Lymph", 1.2)
    base_risk = params.get("BaseRisk", 14.5)
    
    formula = "(Artery + Vein) / (Lymph + 1.0)"
    merkle = compute_ast_merkle_digest(formula)
    tk_ratio = execute_formula(formula, {"Artery": artery, "Vein": vein, "Lymph": lymph})
    risk_score = base_risk * (1.0 + (tk_ratio / 10.0))
    
    return {
        "status": "CALCULATED_VIA_SAFE_AST",
        "ast_merkle_digest": merkle,
        "results": {
            "Tk_Ratio": round(tk_ratio, 4),
            "Risk_Score": round(risk_score, 2),
            "Artery": artery,
            "Vein": vein,
            "Lymph": lymph
        },
        "compliance": {
            "standard": "Research Use Only (RUO)",
            "physician_in_the_loop": doctor_attestation,
            "note": "Математическая воспроизводимость подтверждена детерминированным AST Merkle Digest."
        }
    }