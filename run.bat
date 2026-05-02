@echo off
echo Starting GridWatch...
echo.

echo [1/2] Starting Backend (FastAPI)...
start "GridWatch Backend" cmd /k "cd /d C:\Users\HP\Desktop\GridWatch\backend && venv\Scripts\activate && uvicorn app:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend (React)...
start "GridWatch Frontend" cmd /k "cd /d C:\Users\HP\Desktop\GridWatch\frontend && npm run dev"

echo.
echo Both servers starting...
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo API Docs: http://127.0.0.1:8000/docs
echo.
pause
