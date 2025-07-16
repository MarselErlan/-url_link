@echo off
echo =================================================
echo    Job Application Tracker - Chrome Extension Setup
echo =================================================
echo.

echo This script will help you set up the Chrome extension on Windows.
echo.

echo Step 1: Checking Chrome installation...
where chrome >nul 2>&1
if %errorlevel% neq 0 (
    echo Chrome not found in PATH. Please make sure Chrome is installed.
    echo You can download it from: https://www.google.com/chrome/
    pause
    exit /b 1
)
echo ✅ Chrome found!

echo.
echo Step 2: Opening Chrome Extensions page...
start chrome "chrome://extensions/"

echo.
echo Step 3: Manual steps to complete:
echo 1. In the Chrome tab that just opened, enable "Developer mode" (top right toggle)
echo 2. Click "Load unpacked"
echo 3. Navigate to and select this folder: %~dp0
echo 4. The extension should now be loaded and ready to use!
echo.

echo Step 4: Configuration reminder...
echo IMPORTANT: Make sure to update the config.js file with your actual Railway URL
echo The file is located at: %~dp0config.js
echo.

echo ✅ Setup complete! Check the Chrome extensions page to verify the extension loaded successfully.
echo.

pause 