@echo off
echo Starting Voice Recording Web App...

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate.bat && py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && \"C:\Program Files\nodejs\npm.cmd\" start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul

