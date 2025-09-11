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
const debugInfoEl = document.getElementById('debugInfo');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginSection = document.getElementById('loginSection');
const userSection = document.getElementById('userSection');
const userEmailEl = document.getElementById('userEmail');

let currentUrl = '';
let currentTitle = '';
let currentApplication = null;
let currentUserId = null;
let isLoggedIn = false;

// Debug function
function updateDebugInfo(message) {
  if (debugInfoEl) {
    debugInfoEl.textContent = `Debug: ${message}`;
  }
  console.log('Debug:', message);
}

// Get Chrome user ID - simplified to use only Chrome identity email
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
    
    // Get Chrome identity email
    const identityResult = await new Promise((resolve) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
        console.log('Chrome identity result:', userInfo);
        resolve(userInfo);
      });
    });
    
    console.log('Identity result details:', {
      email: identityResult.email,
      id: identityResult.id,
      hasEmail: !!identityResult.email,
      fullResult: identityResult
    });
    
    // Update debug info with identity result
    updateDebugInfo(`Chrome Identity: ${identityResult.email || 'NO EMAIL'}`);
    
    if (identityResult.email) {
      console.log('Using Chrome identity email:', identityResult.email);
      // Store in sync storage for future use
      chrome.storage.sync.set({ userId: identityResult.email });
      return identityResult.email;
    }
    
    // If Chrome identity fails, use your email directly
    console.log('Chrome identity failed, using ericabram33@gmail.com directly...');
    updateDebugInfo('Chrome Identity Failed - Using ericabram33@gmail.com');
    
    const directEmail = 'ericabram33@gmail.com';
    console.log('Using direct email:', directEmail);
    updateDebugInfo(`Using Direct Email: ${directEmail}`);
    
    // Store in sync storage for future use
    chrome.storage.sync.set({ userId: directEmail });
    return directEmail;
    
    
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw new Error('Unable to get user identity. Please ensure you are signed in to Chrome.');
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

// Google OAuth Login Functions
async function loginWithGoogle() {
  try {
    updateDebugInfo('Starting Google login...');
    console.log('Starting Google OAuth login...');
    
    // For now, use a simple approach - just use the Chrome identity API
    // In production, you'd want to implement proper OAuth flow
    const userInfo = await new Promise((resolve) => {
      chrome.identity.getProfileUserInfo((userInfo) => {
        resolve(userInfo);
      });
    });
    
    console.log('Chrome identity result:', userInfo);
    
    if (userInfo.email) {
      currentUserId = userInfo.email;
      isLoggedIn = true;
      
      // Store login state
      await chrome.storage.sync.set({ 
        userId: userInfo.email,
        isLoggedIn: true,
        userInfo: userInfo
      });
      
      updateUIForLoggedInUser(userInfo.email);
      updateDebugInfo(`Logged in as: ${userInfo.email}`);
      
      console.log('Login successful:', userInfo.email);
      return userInfo.email;
    } else {
      // Fallback to manual email entry for testing
      const email = prompt('Enter your Google email address:');
      if (email && email.includes('@')) {
        currentUserId = email;
        isLoggedIn = true;
        
        await chrome.storage.sync.set({ 
          userId: email,
          isLoggedIn: true
        });
        
        updateUIForLoggedInUser(email);
        updateDebugInfo(`Logged in as: ${email}`);
        
        console.log('Manual login successful:', email);
        return email;
      } else {
        throw new Error('No email provided');
      }
    }
    
  } catch (error) {
    console.error('Login failed:', error);
    updateDebugInfo(`Login failed: ${error.message}`);
    throw error;
  }
}

async function logout() {
  try {
    updateDebugInfo('Logging out...');
    console.log('Logging out...');
    
    // Clear stored data
    await chrome.storage.sync.remove(['userId', 'isLoggedIn', 'userInfo']);
    
    // Reset state
    currentUserId = null;
    isLoggedIn = false;
    
    // Update UI
    updateUIForLoggedOutUser();
    updateDebugInfo('Logged out successfully');
    
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error);
    updateDebugInfo(`Logout failed: ${error.message}`);
  }
}

function updateUIForLoggedInUser(email) {
  if (loginSection) loginSection.style.display = 'none';
  if (userSection) userSection.style.display = 'flex';
  if (userEmailEl) userEmailEl.textContent = email;
}

function updateUIForLoggedOutUser() {
  if (loginSection) loginSection.style.display = 'block';
  if (userSection) userSection.style.display = 'none';
  if (userEmailEl) userEmailEl.textContent = '';
}

async function checkLoginStatus() {
  try {
    const result = await chrome.storage.sync.get(['userId', 'isLoggedIn', 'userInfo']);
    
    if (result.isLoggedIn && result.userId) {
      currentUserId = result.userId;
      isLoggedIn = true;
      updateUIForLoggedInUser(result.userId);
      updateDebugInfo(`Already logged in as: ${result.userId}`);
      console.log('Already logged in as:', result.userId);
      return result.userId;
    } else {
      updateUIForLoggedOutUser();
      updateDebugInfo('Not logged in');
      console.log('Not logged in');
      return null;
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    updateUIForLoggedOutUser();
    return null;
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    updateDebugInfo('Initializing...');
    console.log('🚀 Initializing extension popup...');
    
    // Add event listeners for login/logout buttons
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        try {
          await loginWithGoogle();
          // After login, initialize the rest of the popup
          await initializeAfterLogin();
        } catch (error) {
          console.error('Login failed:', error);
        }
      });
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await logout();
          // Hide content after logout
          if (contentEl) contentEl.style.display = 'none';
          if (loadingEl) loadingEl.style.display = 'block';
        } catch (error) {
          console.error('Logout failed:', error);
        }
      });
    }
    
    // Check if user is already logged in
    const userId = await checkLoginStatus();
    
    if (userId) {
      // User is logged in, initialize the rest
      await initializeAfterLogin();
    } else {
      // User is not logged in, show login screen
      if (contentEl) contentEl.style.display = 'none';
      if (loadingEl) loadingEl.style.display = 'none';
      updateDebugInfo('Please sign in to continue');
    }
    
  } catch (error) {
    console.error('Initialization failed:', error);
    updateDebugInfo(`Initialization failed: ${error.message}`);
  }
});

async function initializeAfterLogin() {
  try {
    updateDebugInfo('Initializing after login...');
    console.log('🚀 Initializing after login...');
    
    // Show content and hide loading
    if (contentEl) contentEl.style.display = 'block';
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Get current tab info
    updateDebugInfo('Getting current tab...');
    console.log('1️⃣ Getting current tab...');
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      currentUrl = tabs[0].url;
      currentTitle = tabs[0].title;
      console.log('✅ Current URL:', currentUrl);
      console.log('✅ Current title:', currentTitle);
    }
    
    // Check if we need to migrate from old user ID system
    updateDebugInfo('Checking migration...');
    console.log('2️⃣ Checking migration...');
    await checkAndMigrateUserData();
    
    // Load application status
    updateDebugInfo('Loading application status...');
    console.log('3️⃣ Loading application status...');
    await loadApplicationStatus();
    
    // Load stats
    updateDebugInfo('Loading stats...');
    console.log('4️⃣ Loading stats...');
    await loadStats();
    
    // Set up event listeners
    updateDebugInfo('Setting up event listeners...');
    console.log('5️⃣ Setting up event listeners...');
    setupEventListeners();
    
    // Show content
    updateDebugInfo('Showing content...');
    console.log('6️⃣ Showing content...');
    showContent();
    
    updateDebugInfo('Initialized successfully!');
    console.log('✅ Extension popup initialized successfully!');
    console.log('✅ User ID obtained:', currentUserId);
    updateDebugInfo(`User: ${currentUserId}`);
    
    // Check if we need to migrate from old user ID system
    updateDebugInfo('Checking migration...');
    console.log('2️⃣ Checking migration...');
    await checkAndMigrateUserData();
    
    // Get current tab info
    updateDebugInfo('Getting tab info...');
    console.log('3️⃣ Getting tab info...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = tab.url;
    currentTitle = tab.title;
    console.log('✅ Tab info:', { url: currentUrl, title: currentTitle });
    
    // Load data
    updateDebugInfo('Loading data...');
    console.log('4️⃣ Loading data...');
    await Promise.all([
      loadApplicationStatus(),
      loadStats()
    ]);
    
    // Set up event listeners
    updateDebugInfo('Setting up listeners...');
    console.log('5️⃣ Setting up event listeners...');
    markAppliedBtn.addEventListener('click', () => markApplication(true));
    markNotAppliedBtn.addEventListener('click', () => markApplication(false));
    
    // Add refresh links button if it exists
    const refreshLinksBtn = document.getElementById('refreshLinks');
    if (refreshLinksBtn) {
      refreshLinksBtn.addEventListener('click', refreshPageLinks);
    }
    
    // Show content
    updateDebugInfo('Showing content...');
    console.log('6️⃣ Showing content...');
    showContent();
    
    updateDebugInfo('Initialized successfully!');
    console.log('✅ Extension popup initialized successfully!');
    
  } catch (error) {
    console.error('❌ Extension initialization failed:', error);
    updateDebugInfo(`Error: ${error.message}`);
    if (error.message.includes('Chrome identity') || error.message.includes('sign in to Chrome')) {
      showError('Please sign in to Chrome to use this extension. Go to chrome://settings/people to sign in.');
    } else {
      showError('Failed to initialize extension: ' + error.message);
    }
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
    updateDebugInfo('Loading stats...');
    console.log('Loading stats for user:', currentUserId);
    console.log('API URL:', `${API_BASE_URL}/api/stats`);
    
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: {
        'x-user-id': currentUserId
      }
    });
    
    console.log('Stats response status:', response.status);
    console.log('Stats response ok:', response.ok);
    updateDebugInfo(`Stats response: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const stats = await response.json();
    console.log('Stats data received:', stats);
    updateDebugInfo(`Stats: ${stats.total_urls} total, ${stats.applied_count} applied`);
    
    totalUrlsEl.textContent = stats.total_urls || 0;
    appliedCountEl.textContent = stats.applied_count || 0;
    notAppliedCountEl.textContent = stats.not_applied_count || 0;
    
    console.log('Stats updated in UI:', {
      total: totalUrlsEl.textContent,
      applied: appliedCountEl.textContent,
      notApplied: notAppliedCountEl.textContent
    });
    
  } catch (error) {
    console.error('Error loading stats:', error);
    updateDebugInfo(`Stats error: ${error.message}`);
    // Show error in UI for debugging
    totalUrlsEl.textContent = 'Error';
    appliedCountEl.textContent = 'Error';
    notAppliedCountEl.textContent = 'Error';
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