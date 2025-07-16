# Windows Setup Guide for Job Application Tracker

This guide will help you set up the Job Application Tracker Chrome extension on Windows.

## Prerequisites

1. **Node.js** - Download from https://nodejs.org
2. **Chrome Browser** - Make sure you have Chrome installed
3. **Railway CLI** (optional) - For deployment

## Quick Setup (Windows)

### Step 1: Backend Deployment

#### Option A: Deploy to Railway (Recommended)
1. Double-click `deploy-backend.bat` 
2. Follow the prompts to deploy to Railway
3. Copy your Railway URL from the dashboard

#### Option B: Run Locally for Testing
1. Double-click `start-backend-local.bat`
2. Backend will run on http://localhost:3000

### Step 2: Configure Extension
1. Open `chrome-extension/config.js`
2. Replace the URL with your actual Railway URL:
   ```javascript
   API_BASE_URL: 'https://your-actual-railway-url.up.railway.app'
   ```

### Step 3: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder

## Troubleshooting

### "Failed to fetch" Error
- ✅ Make sure your Railway backend is deployed and running
- ✅ Check that the URL in `config.js` matches your Railway URL
- ✅ Verify the backend is accessible by visiting the URL in your browser

### Extension Won't Load
- ✅ Make sure Developer mode is enabled in Chrome
- ✅ Check that all files are in the `chrome-extension` folder
- ✅ Look for errors in the Chrome extension console

### Railway Deployment Issues
- ✅ Install Railway CLI: https://railway.app/cli
- ✅ Login to Railway: `railway login`
- ✅ Make sure you're in the correct directory

## How to Find Your Railway URL

1. Go to https://railway.app
2. Open your project dashboard
3. Click on your backend service
4. Look for the "Domains" section
5. Copy the generated URL (e.g., `https://web-production-abc123.up.railway.app`)

## File Structure

```
-url_link/
├── backend/                    # Backend API
├── chrome-extension/           # Chrome extension
│   ├── config.js              # ✅ Configuration file
│   ├── popup.js               # ✅ Fixed for production
│   ├── background.js          # ✅ Fixed for production
│   └── manifest.json          # ✅ Fixed icon issues
├── deploy-backend.bat         # ✅ Windows deployment script
├── start-backend-local.bat    # ✅ Windows local development
└── WINDOWS_SETUP.md           # ✅ This file
```

## Common Railway URLs

Your Railway URL might look like:
- `https://job-tracker-backend-production.up.railway.app`
- `https://web-production-1234567.up.railway.app`
- `https://backend-production-abcdef.up.railway.app`

## Support

If you're still having issues:
1. Check the Chrome extension console for errors
2. Verify your Railway deployment is working
3. Make sure the database connection is established
4. Test the API endpoints directly in your browser

## What's Fixed for Windows

- ✅ Removed icon dependencies that were causing load errors
- ✅ Updated URLs to use production Railway endpoints
- ✅ Created Windows-friendly batch files for deployment
- ✅ Added configuration file for easy URL updates
- ✅ Fixed Chrome extension manifest for Windows compatibility

## Next Steps

1. Deploy your backend using `deploy-backend.bat`
2. Update `config.js` with your Railway URL
3. Load the extension in Chrome
4. Test on job sites like LinkedIn, Indeed, etc.

Your extension should now work on Windows just like it does on Mac! 🎉 