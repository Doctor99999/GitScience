#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
gitscience_compiler.py — Производственный 100% безопасный AST-компилятор формул GitScience™
Полностью исключает eval() / exec(). Использует прямое математическое обхождение AST-дерева.
"""

import ast
import re
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Union


class UnsafeFormulaError(ValueError):
    """Исключение при обнаружении потенциально вредоносного кода в формуле"""
    pass


class SafeASTEvaluator:
    """
    Вычислитель математических выражений напрямую по узлам AST-дерева.
    НЕ использует eval() или exec(). Допускает только ограниченные безопасные математические узлы.
    """
    
    # Белый список разрешенных бинарных операторов
    ALLOWED_OPERATORS = {
        ast.Add: lambda a, b: a + b,
        ast.Sub: lambda a, b: a - b,
        ast.Mult: lambda a, b: a * b,
        ast.Div: lambda a, b: a / b if b != 0 else float('nan'),
        ast.Pow: lambda a, b: a ** b if abs(b) <= 100 else float('inf'),  # Защита от переполнения 999**999
        ast.Mod: lambda a, b: a % b if b != 0 else float('nan'),
    }

    # Белый список разрешенных унарных операторов (+x, -x)
    ALLOWED_UNARY = {
        ast.UAdd: lambda x: +x,
        ast.USub: lambda x: -x,
    }

    # Белый список безопасных встроенных функций
    ALLOWED_FUNCTIONS = {
        'abs': abs,
        'min': min,
        'max': max,
        'round': round,
        'int': int,
        'float': float,
    }

    @classmethod
    def evaluate(cls, node: ast.AST, variables: Dict[str, Union[int, float]]) -> Union[int, float]:
        """Рекурсивно вычисляет узел AST-дерева"""
        
        # 1. Выражение верхнего уровня
        if isinstance(node, ast.Expression):
            return cls.evaluate(node.body, variables)

        # 2. Константы и числа (Python 3.8+)
        elif isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise UnsafeFormulaError(f"Запрещенный тип константы: {type(node.value)}")

        # 3. Для совместимости со старыми версиями Python (ast.Num)
        elif hasattr(ast, 'Num') and isinstance(node, ast.Num):
            return node.n

        # 4. Переменные (Имена параметров, например BaseRisk, Age, BMI)
        elif isinstance(node, ast.Name):
            if node.id in variables:
                val = variables[node.id]
                if isinstance(val, (int, float)):
                    return val
                raise UnsafeFormulaError(f"Значение переменной '{node.id}' должно быть числом!")
            raise UnsafeFormulaError(f"Неизвестная переменная в формуле: '{node.id}'")

        # 5. Бинарные операции (A + B, A * B, A / B)
        elif isinstance(node, ast.BinOp):
            op_type = type(node.op)
            if op_type in cls.ALLOWED_OPERATORS:
                left = cls.evaluate(node.left, variables)
                right = cls.evaluate(node.right, variables)
                return cls.ALLOWED_OPERATORS[op_type](left, right)
            raise UnsafeFormulaError(f"Запрещенная математическая операция: {op_type.__name__}")

        # 6. Унарные операции (-X, +X)
        elif isinstance(node, ast.UnaryOp):
            op_type = type(node.op)
            if op_type in cls.ALLOWED_UNARY:
                operand = cls.evaluate(node.operand, variables)
                return cls.ALLOWED_UNARY[op_type](operand)
            raise UnsafeFormulaError(f"Запрещенная унарная операция: {op_type.__name__}")

        # 7. Разрешенные вызовы математических функций (abs(x), min(a, b))
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in cls.ALLOWED_FUNCTIONS:
                func = cls.ALLOWED_FUNCTIONS[node.func.id]
                args = [cls.evaluate(arg, variables) for arg in node.args]
                return func(*args)
            raise UnsafeFormulaError(f"Запрещенный вызов функции: '{getattr(node.func, 'id', 'unknown')}'")

        # Всё остальное (вызовы os.system, __import__, обращения к .__class__, списки, циклы) — БЛОКИРУЕТСЯ
        else:
            raise UnsafeFormulaError(f"Обнаружена заблокированная AST-конструкция: {type(node).__name__}")


class GitScienceCompiler:
    """No-Code компилятор формул из Markdown для платформы GitScience™"""

    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def validate_and_parse_expression(self, expr_str: str) -> ast.Expression:
        """
        Парсит строку формулы в AST и проверяет на безопасность.
        Возвращает скомпилированное AST-дерево.
        """
        try:
            parsed_ast = ast.parse(expr_str.strip(), mode='eval')
        except SyntaxError as e:
            raise UnsafeFormulaError(f"Синтаксическая ошибка в формуле '{expr_str}': {e}")

        # Предварительная проверка AST на запрещенные узлы
        for node in ast.walk(parsed_ast):
            if isinstance(node, (ast.Import, ast.ImportFrom, ast.Attribute, ast.Subscript, 
                                 ast.List, ast.Dict, ast.Tuple, ast.Lambda, ast.ClassDef, ast.FunctionDef)):
                raise UnsafeFormulaError(f"Обнаружен несанкционированный конструктор '{type(node).__name__}'!")

        return parsed_ast

    def compile_markdown(self, markdown_content: str) -> Dict[str, Any]:
        """
        Анализирует текст статьи Markdown, производит хэширование SHA-256,
        извлекает формулы вида: Название_Формулы = Математическое_Выражение
        и генерирует чистый, безопасный модуль калькулятора.
        """
        sha256_hash = hashlib.sha256(markdown_content.encode('utf-8')).hexdigest()
        
        # Поиск формул вида: Variable_Name = Math_Expression
        raw_formulas = re.findall(r'([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_\s\+\-\*\/\(\)\.\,]+)', markdown_content)
        
        valid_formulas = []
        for name, expr_str in raw_formulas:
            clean_name = name.strip()
            clean_expr = expr_str.strip()
            
            try:
                # Проверяем на безопасность через AST
                self.validate_and_parse_expression(clean_expr)
                valid_formulas.append({
                    "name": clean_name,
                    "expression": clean_expr
                })
            except UnsafeFormulaError as err:
                print(f"⚠️  [Compiler Security Warning] Формула '{clean_name}' отвергнута: {err}")

        # Генерируем код скомпилированного калькулятора (без eval!)
        calc_code = f'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
compiled_calculator.py — Автоматически сгенерированный БЕЗОПАСНЫЙ калькулятор GitScience™
НЕ использует eval(). Вычисления производятся через изолированный SafeASTEvaluator.
"""

import ast
from typing import Dict, Any, Union

FORMULAS = {json.dumps(valid_formulas, indent=4, ensure_ascii=False)}

class UnsafeFormulaError(ValueError):
    pass

class SafeASTEvaluator:
    ALLOWED_OPERATORS = {{
        ast.Add: lambda a, b: a + b,
        ast.Sub: lambda a, b: a - b,
        ast.Mult: lambda a, b: a * b,
        ast.Div: lambda a, b: a / b if b != 0 else float('nan'),
        ast.Pow: lambda a, b: a ** b if abs(b) <= 100 else float('inf'),
        ast.Mod: lambda a, b: a % b if b != 0 else float('nan'),
    }}
    ALLOWED_UNARY = {{
        ast.UAdd: lambda x: +x,
        ast.USub: lambda x: -x,
    }}
    ALLOWED_FUNCTIONS = {{
        'abs': abs, 'min': min, 'max': max, 'round': round, 'int': int, 'float': float
    }}

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
            raise UnsafeFormulaError(f"Неизвестная переменная: '{{node.id}}'")
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
    results = {{}}
    for f in FORMULAS:
        name = f["name"]
        expr = f["expression"]
        try:
            parsed_ast = ast.parse(expr, mode='eval')
            results[name] = SafeASTEvaluator.evaluate(parsed_ast, params)
        except Exception as err:
            results[name] = f"Error: {{err}}"
    return results
'''

        calc_path = self.output_dir / "compiled_calculator.py"
        calc_path.write_text(calc_code, encoding="utf-8")

        dpid = f"dPID-2026-{sha256_hash[:8]}"
        return {
            "hash": sha256_hash,
            "dpid": dpid,
            "formulas_found": len(valid_formulas),
            "calculator_path": str(calc_path)
        }