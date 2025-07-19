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

// Get Chrome user ID
async function getChromeUserId() {
  try {
    // Try to get user profile info from Chrome
    return new Promise((resolve) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
        if (userInfo.email) {
          resolve(userInfo.email);
        } else {
          // Fallback to a unique identifier based on Chrome profile
          chrome.storage.local.get(['userId'], (result) => {
            if (result.userId) {
              resolve(result.userId);
            } else {
              // Generate a unique ID for this Chrome profile
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

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get user ID first
    currentUserId = await getChromeUserId();
    
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
    const encodedUrl = encodeURIComponent(currentUrl);
    const response = await fetch(`${API_BASE_URL}/api/status/${encodedUrl}`, {
      headers: {
        'x-user-id': currentUserId
      }
    });
    
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
    
    const requestData = {
      url: currentUrl,
      title: currentTitle,
      applied: applied,
      notes: notesInput.value.trim()
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