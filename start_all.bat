@echo off
title GitScience Sovereign Launcher
echo ===================================================
echo [GitScience] Launching Full Ecosystem (Backend + Frontend)...
echo ===================================================
start "GitScience Backend (8000)" cmd /k "call start_backend.bat"
start "GitScience Frontend (3000)" cmd /k "call start_frontend.bat"
echo.
echo Both servers are launching!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:3000
echo Certificate: http://127.0.0.1:8000/certificate/pdf/GS-2026-00001
echo ===================================================
