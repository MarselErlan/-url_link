// Configuration file for Job Application Tracker Chrome Extension
// Update this file with your actual Railway production URL

// IMPORTANT: Replace this URL with your actual Railway deployment URL
// You can find this in your Railway dashboard under your backend service
const CONFIG = {
  // Production Railway URL (update this with your actual URL)
  API_BASE_URL: 'https://job-tracker-backend-production-acb1.up.railway.app',
  
  // Alternative URLs for different environments
  DEVELOPMENT_URL: 'http://localhost:3000',
  
  // How to find your Railway URL:
  // 1. Go to railway.app
  // 2. Open your backend project
  // 3. Look for the domain in your service settings
  // 4. Copy the URL and replace the one above
  
  // Common Railway URL formats:
  // https://[service-name].up.railway.app
  // https://[project-name]-[service-name].up.railway.app
  // https://web-production-[hash].up.railway.app
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} 