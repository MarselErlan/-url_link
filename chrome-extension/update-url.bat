@echo off
echo =================================================
echo    Update Railway URL for Chrome Extension
echo =================================================
echo.

echo Current configuration:
echo.
type config.js | findstr "API_BASE_URL"
echo.

echo.
echo INSTRUCTIONS:
echo 1. Go to https://railway.app
echo 2. Find your backend project
echo 3. Click on your backend service
echo 4. Copy the URL from the Domains section
echo 5. It should look like: https://web-production-xxxxx.up.railway.app
echo.

set /p RAILWAY_URL="Enter your Railway URL: "

if "%RAILWAY_URL%"=="" (
    echo No URL entered. Exiting...
    pause
    exit /b 1
)

echo.
echo Updating config.js with URL: %RAILWAY_URL%

powershell -Command "(Get-Content config.js) -replace 'API_BASE_URL: ''.*''', 'API_BASE_URL: ''%RAILWAY_URL%''' | Set-Content config.js"

powershell -Command "(Get-Content popup.js) -replace 'const API_BASE_URL = ''.*'';', 'const API_BASE_URL = ''%RAILWAY_URL%'';' | Set-Content popup.js"

powershell -Command "(Get-Content background.js) -replace 'const API_BASE_URL = ''.*'';', 'const API_BASE_URL = ''%RAILWAY_URL%'';' | Set-Content background.js"

echo.
echo ✅ URL updated successfully!
echo.
echo Updated files:
echo - config.js
echo - popup.js  
echo - background.js
echo.
echo Now reload your Chrome extension:
echo 1. Go to chrome://extensions/
echo 2. Find "Job Application Tracker"
echo 3. Click the refresh/reload button
echo 4. Test the extension on a job site
echo.
pause 