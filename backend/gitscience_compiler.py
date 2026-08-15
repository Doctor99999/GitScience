"""
GitScience Safe AST Compiler Engine
Изолированный разбор и исполнение биомедицинских формул без eval().
Стандарт: RUO / Math-as-a-Service (MaaS).
"""
import ast
import math
from typing import Dict, Any

ALLOWED_NAMES = {
    "exp": math.exp,
    "log": math.log,
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "abs": abs,
    "min": min,
    "max": max,
    "e": math.e,
    "pi": math.pi
}

class SafeASTEvaluator(ast.NodeVisitor):
    def __init__(self, variables: Dict[str, float]):
        self.variables = variables

    def visit(self, node):
        if isinstance(node, ast.Expression):
            return self.visit(node.body)
        elif isinstance(node, ast.Constant):
            return node.value
        elif isinstance(node, ast.Name):
            if node.id in self.variables:
                return float(self.variables[node.id])
            if node.id in ALLOWED_NAMES:
                return ALLOWED_NAMES[node.id]
            raise ValueError(f"Неизвестная переменная или функция: '{node.id}'")
        elif isinstance(node, ast.BinOp):
            left = self.visit(node.left)
            right = self.visit(node.right)
            if isinstance(node.op, ast.Add): return left + right
            elif isinstance(node.op, ast.Sub): return left - right
            elif isinstance(node.op, ast.Mult): return left * right
            elif isinstance(node.op, ast.Div):
                if right == 0: raise ZeroDivisionError("Деление на ноль в уравнении гомеостаза")
                return left / right
            elif isinstance(node.op, ast.Pow): return left ** right
            raise TypeError(f"Неподдерживаемая операция: {type(node.op)}")
        elif isinstance(node, ast.UnaryOp):
            operand = self.visit(node.operand)
            if isinstance(node.op, ast.USub): return -operand
            elif isinstance(node.op, ast.UAdd): return +operand
            raise TypeError(f"Неподдерживаемая унарная операция: {type(node.op)}")
        elif isinstance(node, ast.Call):
            func = self.visit(node.func)
            args = [self.visit(arg) for arg in node.args]
            return func(*args)
        raise TypeError(f"Запрещенная синтаксическая конструкция: {type(node)}")

def execute_formula(formula_str: str, params: Dict[str, float]) -> float:
    tree = ast.parse(formula_str.strip(), mode='eval')
    evaluator = SafeASTEvaluator(params)
    return evaluator.visit(tree)

def calculate_clinical_metrics(params: Dict[str, float], doctor_attestation: bool = True) -> Dict[str, Any]:
    # Параметры сосудистого тонуса и онкологии
    artery = params.get("Artery", 5.0)
    vein = params.get("Vein", 3.0)
    lymph = params.get("Lymph", 1.2)
    base_risk = params.get("BaseRisk", 14.5)
    
    # 1. Расчет Tk Ratio: (Artery + Vein) / (Lymph + 1.0)
    tk_ratio = execute_formula("(Artery + Vein) / (Lymph + 1.0)", {"Artery": artery, "Vein": vein, "Lymph": lymph})
    
    # 2. Клинический скоринг риска
    risk_score = base_risk * (1.0 + (tk_ratio / 10.0))
    
    return {
        "status": "CALCULATED_VIA_SAFE_AST",
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
            "note": "Математическая воспроизводимость подтверждена AST-деревом автора. Клиническое решение принимает лечащий врач."
        }
    }