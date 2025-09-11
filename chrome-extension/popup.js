// Configuration
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

// DOM Elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const contentEl = document.getElementById('content');
const statusDotEl = document.getElementById('statusDot');
const statusTextEl = document.getElementById('statusText');
const urlInfoEl = document.getElementById('urlInfo');
const lastUpdatedEl = document.getElementById('lastUpdated');
const totalUrlsEl = document.getElementById('totalUrls');
const appliedCountEl = document.getElementById('appliedCount');
const notAppliedCountEl = document.getElementById('notAppliedCount');
const markAppliedBtn = document.getElementById('markApplied');
const markNotAppliedBtn = document.getElementById('markNotApplied');
const notesInput = document.getElementById('notesInput');

let currentUrl = '';
let currentTitle = '';
let currentApplication = null;
let currentUserId = null;

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

// Helper to extract LinkedIn job ID
function extractLinkedInJobId(url) {
  try {
    const parsedUrl = new URL(url);
    const jobId = parsedUrl.searchParams.get('currentJobId');
    if (jobId) return jobId;
    const match = parsedUrl.pathname.match(/\/jobs\/view\/(\d+)/);
    if (match) return match[1];
    return null;
  } catch (e) {
    return null;
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get user ID first
    currentUserId = await getChromeUserId();
    
    // Check if we need to migrate from old user ID system
    await checkAndMigrateUserData();
    
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = tab.url;
    currentTitle = tab.title;
    
    // Load data
    await Promise.all([
      loadApplicationStatus(),
      loadStats()
    ]);
    
    // Set up event listeners
    markAppliedBtn.addEventListener('click', () => markApplication(true));
    markNotAppliedBtn.addEventListener('click', () => markApplication(false));
    
    // Add refresh links button if it exists
    const refreshLinksBtn = document.getElementById('refreshLinks');
    if (refreshLinksBtn) {
      refreshLinksBtn.addEventListener('click', refreshPageLinks);
    }
    
    // Show content
    showContent();
    
  } catch (error) {
    showError('Failed to initialize extension: ' + error.message);
  }
});

// Check and migrate user data from old system
async function checkAndMigrateUserData() {
  try {
    // Check if we have old local storage data but no sync data
    const localResult = await new Promise((resolve) => {
      chrome.storage.local.get(['userId'], (result) => {
        resolve(result);
      });
    });
    
    const syncResult = await new Promise((resolve) => {
      chrome.storage.sync.get(['userId'], (result) => {
        resolve(result);
      });
    });
    
    // If we have local data but no sync data, migrate it
    if (localResult.userId && !syncResult.userId) {
      console.log('Migrating user ID to sync storage:', localResult.userId);
      chrome.storage.sync.set({ userId: localResult.userId });
      
      // Show a brief notification
      const statusText = document.getElementById('statusText');
      if (statusText) {
        const originalText = statusText.textContent;
        statusText.textContent = 'Syncing data across devices...';
        setTimeout(() => {
          statusText.textContent = originalText;
        }, 2000);
      }
    }
  } catch (error) {
    console.error('Error migrating user data:', error);
  }
}

// Show loading state
function showLoading() {
  loadingEl.style.display = 'block';
  contentEl.style.display = 'none';
  errorEl.style.display = 'none';
}

// Show error state
function showError(message) {
  loadingEl.style.display = 'none';
  contentEl.style.display = 'none';
  errorEl.style.display = 'block';
  errorEl.textContent = message;
}

// Show content
function showContent() {
  loadingEl.style.display = 'none';
  errorEl.style.display = 'none';
  contentEl.style.display = 'block';
}

// Load application status for current URL
async function loadApplicationStatus() {
  try {
    const jobId = extractLinkedInJobId(currentUrl);
    const encodedUrl = encodeURIComponent(currentUrl);
    let apiUrl = `${API_BASE_URL}/api/status/${encodedUrl}`;
    let headers = { 'x-user-id': currentUserId };
    if (jobId) headers['x-job-id'] = jobId;
    const response = await fetch(apiUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.found) {
      currentApplication = data.application;
      updateStatusDisplay(data.application);
      notesInput.value = data.application.notes || '';
    } else {
      updateStatusDisplay(null);
      notesInput.value = '';
    }
    
  } catch (error) {
    console.error('Error loading application status:', error);
    updateStatusDisplay(null);
    // Don't show error for status check, just assume not applied
  }
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: {
        'x-user-id': currentUserId
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const stats = await response.json();
    
    totalUrlsEl.textContent = stats.total_urls || 0;
    appliedCountEl.textContent = stats.applied_count || 0;
    notAppliedCountEl.textContent = stats.not_applied_count || 0;
    
  } catch (error) {
    console.error('Error loading stats:', error);
    // Don't show error for stats, just keep zeros
  }
}

// Update status display
function updateStatusDisplay(application) {
  if (!application) {
    statusDotEl.className = 'status-dot unknown';
    statusTextEl.textContent = 'Not tracked';
    lastUpdatedEl.textContent = '';
  } else if (application.applied) {
    statusDotEl.className = 'status-dot applied';
    statusTextEl.textContent = 'Applied';
    lastUpdatedEl.textContent = application.applied_date ? 
      `Applied: ${new Date(application.applied_date).toLocaleDateString()}` : '';
  } else {
    statusDotEl.className = 'status-dot not-applied';
    statusTextEl.textContent = 'Not Applied';
    lastUpdatedEl.textContent = application.updated_at ? 
      `Updated: ${new Date(application.updated_at).toLocaleDateString()}` : '';
  }
  
  // Update URL info
  urlInfoEl.textContent = currentUrl.length > 60 ? 
    currentUrl.substring(0, 60) + '...' : currentUrl;
}

// Mark application status
async function markApplication(applied) {
  try {
    // Disable buttons during request
    markAppliedBtn.disabled = true;
    markNotAppliedBtn.disabled = true;
    
    const jobId = extractLinkedInJobId(currentUrl);
    const requestData = {
      url: currentUrl,
      title: currentTitle,
      applied: applied,
      notes: notesInput.value.trim(),
      job_id: jobId || undefined
    };
    
    const response = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      currentApplication = data.application;
      updateStatusDisplay(data.application);
      
      // Reload stats
      await loadStats();
      
      // Show success feedback
      const originalText = applied ? markAppliedBtn.textContent : markNotAppliedBtn.textContent;
      const targetBtn = applied ? markAppliedBtn : markNotAppliedBtn;
      
      targetBtn.textContent = 'Saved!';
      setTimeout(() => {
        targetBtn.textContent = originalText;
      }, 1000);
      
    } else {
      throw new Error('Failed to save application');
    }
    
  } catch (error) {
    console.error('Error marking application:', error);
    showError('Failed to save: ' + error.message);
    setTimeout(() => {
      showContent();
    }, 3000);
  } finally {
    // Re-enable buttons
    markAppliedBtn.disabled = false;
    markNotAppliedBtn.disabled = false;
  }
}

// Refresh link statuses on the current page
async function refreshPageLinks() {
  try {
    const refreshBtn = document.getElementById('refreshLinks');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
    }
    
    // Send message to content script to refresh links
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.tabs.sendMessage(tab.id, {
      action: 'refreshLinks'
    });
    
    // Show success feedback
    if (refreshBtn) {
      refreshBtn.textContent = 'Refreshed!';
      setTimeout(() => {
        refreshBtn.textContent = 'Refresh Links';
        refreshBtn.disabled = false;
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error refreshing links:', error);
    const refreshBtn = document.getElementById('refreshLinks');
    if (refreshBtn) {
      refreshBtn.textContent = 'Error';
      setTimeout(() => {
        refreshBtn.textContent = 'Refresh Links';
        refreshBtn.disabled = false;
      }, 2000);
    }
  }
}

// Utility function to format domain
function formatDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (error) {
    return url;
  }
}

// Auto-refresh data every 30 seconds
setInterval(async () => {
  if (document.visibilityState === 'visible') {
    await Promise.all([
      loadApplicationStatus(),
      loadStats()
    ]);
  }
}, 30000); 