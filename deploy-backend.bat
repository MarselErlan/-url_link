@echo off
echo =================================================
echo    Job Application Tracker - Backend Deployment
echo =================================================
echo.

echo Checking if Railway CLI is installed...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Railway CLI is not installed. Please install it first:
    echo 1. Go to https://railway.app/cli
    echo 2. Download and install Railway CLI
    echo 3. Run: railway login
    echo.
    pause
    exit /b 1
)

echo Railway CLI found!
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
echo Deploying to Railway...
railway up
if %errorlevel% neq 0 (
    echo Failed to deploy!
    pause
    exit /b 1
)

echo.
echo ✅ Backend deployed successfully!
echo.
echo Next steps:
echo 1. Get your Railway URL from the dashboard
echo 2. Update chrome-extension/config.js with your production URL
echo 3. Load the extension in Chrome
echo.
pause 