@echo off
title GitScience Sovereign Backend API (Port 8000)
echo ===================================================
echo [GitScience] Starting Sovereign Backend on Port 8000...
echo ===================================================
cd /d "%~dp0"
if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe server.py
) else if exist ..\venv\Scripts\python.exe (
    ..\venv\Scripts\python.exe server.py
) else (
    python server.py
)
pause
