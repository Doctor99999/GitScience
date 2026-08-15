@echo off
echo ========================================================
echo   GITSCIENCE(TM) SOVEREIGN NODE - DISK F: ACTIVE
echo ========================================================
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause