// Background service worker for Chrome extension
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app'; // Production Railway URL

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when the page is completely loaded
  if (changeInfo.status === 'complete' && tab.url) {
    await checkAndUpdateBadge(tab.url, tabId);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await checkAndUpdateBadge(tab.url, activeInfo.tabId);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Check application status and update badge
async function checkAndUpdateBadge(url, tabId) {
  try {
    // Skip non-http URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
      return;
    }
    
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(`${API_BASE_URL}/api/status/${encodedUrl}`);
    
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
        checkAndUpdateBadge(tabs[0].url, tabs[0].id);
      }
    });
  }
  
  sendResponse({ success: true });
});

// Periodic badge refresh (every 5 minutes)
setInterval(async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true });
    for (const tab of tabs) {
      if (tab.url) {
        await checkAndUpdateBadge(tab.url, tab.id);
      }
    }
  } catch (error) {
    console.error('Error in periodic badge refresh:', error);
  }
}, 5 * 60 * 1000); // 5 minutes 