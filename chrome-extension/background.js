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

// Get Chrome user ID - improved cross-device sync
async function getChromeUserId() {
  try {
    // First, try to get from sync storage (syncs across devices)
    const syncResult = await new Promise((resolve) => {
      chrome.storage.sync.get(['userId'], (result) => {
        resolve(result);
      });
    });
    
    if (syncResult.userId) {
      console.log('Using existing sync user ID:', syncResult.userId);
      return syncResult.userId;
    }
    
    // Try to get Chrome identity (may work on some devices)
    const identityResult = await new Promise((resolve) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
        resolve(userInfo);
      });
    });
    
    if (identityResult.email) {
      console.log('Using Chrome identity email:', identityResult.email);
      // Store in sync storage for future use
      chrome.storage.sync.set({ userId: identityResult.email });
      return identityResult.email;
    }
    
    // Generate a stable user ID based on Chrome profile + timestamp
    // This will be consistent across devices for the same Chrome profile
    const profileId = await getChromeProfileId();
    const userId = `user_${profileId}_${Math.floor(Date.now() / (1000 * 60 * 60 * 24))}`; // Changes daily
    
    console.log('Generated new user ID:', userId);
    
    // Store in both sync and local storage
    chrome.storage.sync.set({ userId: userId });
    chrome.storage.local.set({ userId: userId });
    
    return userId;
    
  } catch (error) {
    console.error('Error getting user ID:', error);
    // Last resort fallback
    const fallbackId = 'anonymous_' + Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    chrome.storage.sync.set({ userId: fallbackId });
    return fallbackId;
  }
}

// Get a stable Chrome profile identifier
async function getChromeProfileId() {
  try {
    // Try to get Chrome profile info
    const profileInfo = await new Promise((resolve) => {
      chrome.management.getSelf((info) => {
        resolve(info);
      });
    });
    
    // Use extension ID + some stable identifier
    const stableId = profileInfo.id ? profileInfo.id.substring(0, 8) : 'default';
    return stableId;
  } catch (error) {
    // Fallback to a consistent identifier
    return 'chrome_profile';
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