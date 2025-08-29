@echo off
echo Setting up Voice Recording Web App...

echo.
echo 1. Setting up Frontend...
cd frontend
echo Installing frontend dependencies...
"C:\Program Files\nodejs\npm.cmd" install
if exist env.example (
    copy env.example .env
    echo Created frontend .env file
)
cd ..

echo.
echo 2. Setting up Backend...
cd backend
echo Creating Python virtual environment...
python -m venv venv
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Installing backend dependencies...
pip install -r requirements.txt
if exist env.example (
    copy env.example .env
    echo Created backend .env file
)
mkdir uploads 2>nul
cd ..

echo.
echo Setup completed!
echo.
echo Next steps:
echo 1. Install Python from https://python.org/downloads/
echo 2. Set up Supabase (see docs/supabase-setup.md)
echo 3. Update .env files with your Supabase credentials
echo 4. Run the application:
echo    - Backend: cd backend ^& venv\Scripts\activate ^& uvicorn main:app --reload
echo    - Frontend: cd frontend ^& "C:\Program Files\nodejs\npm.cmd" start
pause


