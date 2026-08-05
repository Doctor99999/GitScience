@echo off
title GitScience Launcher
chcp 65001 > nul

echo ============================================================
echo 🚀 Запуск комплекса GitScience™ (Backend + Frontend)
echo ============================================================

:: 1. Запуск Backend (FastAPI :8000) в отдельном окне
echo [1/2] Запуск FastAPI Бэкенда...
start "🏛️ GitScience Backend (FastAPI)" cmd /k ".\venv\Scripts\python.exe server.py"

:: 2. Запуск Frontend (Next.js :3000) в отдельном окне
echo [2/2] Запуск Next.js Фронтенда...
start "🎨 GitScience Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo ------------------------------------------------------------
echo ✅ Оба сервера успешно инициализированы!
echo.
echo 👉 Веб-интерфейс:   http://localhost:3000
echo 👉 Swagger API:     http://127.0.0.1:8000/docs
echo ============================================================
pause