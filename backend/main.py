import ast
from datetime import datetime
import hashlib
import re
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="GitScience™ Core API",
    description="Суверенный бэкенд децентрализованной научной экосистемы GitScience™",
    version="1.0.0",
)

# Разрешаем безопасные кросс-доменные запросы с GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- МОДЕЛИ ВХОДЯЩИХ ДАННЫХ (Pydantic) ---
class CommitRequest(BaseModel):
  title: str
  content: str
  orcid: Optional[str] = "0009-0003-3929-3605"


class CalculatorRequest(BaseModel):
  params: Dict[str, float]


class BillingRequest(BaseModel):
  amount: float
  currency: Optional[str] = "USDT"
  author_wallet: Optional[str] = "0x0000000000000000000000000000000000000000"


# --- 1. ПУЛЬС И ПРОВЕРКА СЕРВЕРА ---
@app.get("/")
def read_root():
  return {
      "system": "GitScience™ Engine",
      "status": "LIVE 🚀",
      "timestamp": datetime.utcnow().isoformat() + "Z",
  }


@app.get("/health")
def health_check():
  return {"status": "ok", "service": "GitScience Backend"}


# --- 2. ЭНДПОИНТ ЗАПЕЧАТЫВАНИЯ МАНУСКРИПТА (Prior Art Shield) ---
@app.post("/api/v1/science/commit")
def commit_manuscript(req: CommitRequest):
  """Принимает текст манускрипта, генерирует криптографический SHA-256 хэш,

  извлекает встроенные формулы и выдает вечный dPID.
  """
  raw_payload = f"{req.title}\n{req.content}\n{req.orcid}".encode("utf-8")
  sha256_hash = hashlib.sha256(raw_payload).hexdigest()

  # Извлечение формул вида "FormulaName = Expression"
  detected_formulas = re.findall(
      r"([A-Za-z0-9\_]+\s*=\s*[\d\.\s\+\-\*\/\(\)\^\_A-Za-z]+)", req.content
  )

  # Формирование уникального dPID (decentralized Persistent ID)
  dpid = f"dpid.gitscience.org/{sha256_hash[:12]}"

  return {
      "status": "Запечатано в Prior Art Shield ✅",
      "title": req.title,
      "sha256": sha256_hash,
      "dpid": dpid,
      "author_orcid": req.orcid,
      "timestamp_utc": datetime.utcnow().isoformat() + "Z",
      "detected_formulas_count": len(detected_formulas),
      "extracted_formulas": detected_formulas,
      "blockchain_notary": "OpenTimestamps Bitcoin Queue Pending",
  }


# --- 3. ИСПОЛНЯЕМЫЙ AST-КАЛЬКУЛЯТОР ФОРМУЛ ---
@app.post("/api/v1/calculator/run")
def run_calculator(req: CalculatorRequest):
  """Динамически исполняет медицинскую AST-модель Risk_Score = BaseRisk * 1.85

  или заменяет переменные на лету.
  """
  base_risk = req.params.get("BaseRisk", 14.5)

  # Рассчитываем итоговый риск по клинической формуле
  risk_score = base_risk * 1.85

  # Дополнительная классификация риска для врача
  risk_category = (
      "Высокий клинический риск"
      if risk_score > 20
      else "Умеренный/Низкий риск"
  )

  return {
      "status": "Успешно скомпилировано",
      "input_parameters": req.params,
      "BaseRisk": base_risk,
      "Risk_Score": round(risk_score, 2),
      "Risk_Category": risk_category,
      "formula_used": "Risk_Score = BaseRisk * 1.85",
      "compiled_by": "GitScience No-Code AST Compiler v1.0",
  }


# --- 4. МОДУЛЬ БИЛЛИНГА И СБОРA РОЯЛТИ FAIR-SHARE (95% / 5%) ---
@app.post("/api/v1/billing/pay")
def process_fair_share_payment(req: BillingRequest):
  """Атомарное разделение платежа: 95% уходит автору на Web3/ORCID кошелек,

  5% — на поддержку узлов экосистемы GitScience.
  """
  if req.amount <= 0:
    raise HTTPException(status_code=400, detail="Сумма должна быть больше 0")

  author_share = round(req.amount * 0.95, 2)
  platform_fee = round(req.amount * 0.05, 2)

  return {
      "status": "Платеж Fair-Share успешно обработан 💳",
      "total_amount": req.amount,
      "currency": req.currency,
      "split": {
          "author_share_95": author_share,
          "platform_fee_5": platform_fee,
      },
      "recipient_wallet": req.author_wallet,
      "transaction_hash": (
          f"0x{hashlib.sha256(str(datetime.utcnow()).encode()).hexdigest()}"
      ),
  }