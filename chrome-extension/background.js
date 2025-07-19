// Background service worker for Chrome extension
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

// Listen for tab updates (minimal - just for initial load)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when the page is completely loaded
  if (changeInfo.status === 'complete' && tab.url) {
    // Just update badge for current page, don't track navigation
    await updateBadgeForCurrentPage(tab.url, tabId);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await updateBadgeForCurrentPage(tab.url, activeInfo.tabId);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Get Chrome user ID (same as popup.js)
async function getChromeUserId() {
  try {
    return new Promise((resolve) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
        if (userInfo.email) {
          resolve(userInfo.email);
        } else {
          chrome.storage.local.get(['userId'], (result) => {
            if (result.userId) {
              resolve(result.userId);
            } else {
              const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              chrome.storage.local.set({ userId: userId });
              resolve(userId);
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('Error getting user ID:', error);
    return 'anonymous_' + Date.now();
  }
}

// Update badge for current page (not tracking navigation)
async function updateBadgeForCurrentPage(url, tabId) {
  try {
    // Skip non-http URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
      return;
    }
    
    // Get user ID
    const userId = await getChromeUserId();
    
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`${API_BASE_URL}/api/status/${encodedUrl}`, {
      headers: {
        'x-user-id': userId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.found) {
      if (data.application.applied) {
        // Green badge for applied
        chrome.action.setBadgeText({ text: '✓', tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tabId });
      } else {
        // Orange badge for not applied
        chrome.action.setBadgeText({ text: '!', tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#FF9800', tabId: tabId });
      }
    } else {
      // No badge for unknown URLs
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
    
  } catch (error) {
    console.error('Error checking application status:', error);
    // Clear badge on error
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Application Tracker extension installed');
});

// Message handler for communication with popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refreshBadge') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        updateBadgeForCurrentPage(tabs[0].url, tabs[0].id);
      }
    });
  } else if (request.action === 'pageInfo') {
    // Handle page info from content script
    console.log('Received page info:', request.data);
  } else if (request.action === 'urlChanged') {
    // Handle URL changes from content script (for SPAs)
    console.log('URL changed to:', request.url);
  }
  
  sendResponse({ success: true });
});

// Periodic badge refresh (every 10 minutes - less frequent since we're not tracking navigation)
setInterval(async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true });
    for (const tab of tabs) {
      if (tab.url) {
        await updateBadgeForCurrentPage(tab.url, tab.id);
      }
    }
  } catch (error) {
    console.error('Error in periodic badge refresh:', error);
  }
}, 10 * 60 * 1000); // 10 minutes 