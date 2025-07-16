@echo off
echo =================================================
echo    Job Application Tracker - Local Development
echo =================================================
echo.

echo Changing to backend directory...
cd /d "%~dp0backend"

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Starting backend server on http://localhost:3000...
echo Press Ctrl+C to stop the server
echo.

npm start 