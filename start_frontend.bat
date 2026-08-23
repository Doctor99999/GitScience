@echo off
title GitScience Sovereign Frontend (Port 3000)
echo ===================================================
echo [GitScience] Starting Next.js UI on Port 3000...
echo ===================================================
cd /d "%~dp0frontend"
npm run dev
pause
