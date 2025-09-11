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

// Google OAuth Login Functions
async function loginWithGoogle() {
  try {
    updateDebugInfo('Starting Google login...');
    console.log('Starting Google OAuth login...');
    
    // For now, use a simple approach - just use the Chrome identity API
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

// Load application status for current URL
async function loadApplicationStatus() {
  try {
    const jobId = extractLinkedInJobId(currentUrl);
    const encodedUrl = encodeURIComponent(currentUrl);
    let apiUrl = `${API_BASE_URL}/api/status/${encodedUrl}`;
    let headers = { 'x-user-id': currentUserId };
    if (jobId) headers['x-job-id'] = jobId;
    const response = await fetch(apiUrl, { headers });
    const data = await response.json();
    
    if (data.success) {
      currentApplication = data.application;
      updateStatusDisplay(data.application);
    } else {
      updateStatusDisplay(null);
    }
  } catch (error) {
    console.error('Error loading application status:', error);
    updateStatusDisplay(null);
  }
}

// Update status display
function updateStatusDisplay(application) {
  if (!application) {
    statusDotEl.className = 'status-dot unknown';
    statusTextEl.textContent = 'Not tracked';
    urlInfoEl.textContent = currentUrl;
    lastUpdatedEl.textContent = '';
    markAppliedBtn.disabled = false;
    markNotAppliedBtn.disabled = false;
    return;
  }
  
  statusDotEl.className = `status-dot ${application.applied ? 'applied' : 'not-applied'}`;
  statusTextEl.textContent = application.applied ? 'Applied' : 'Not Applied';
  urlInfoEl.textContent = application.title || currentUrl;
  
  if (application.applied_date) {
    const date = new Date(application.applied_date);
    lastUpdatedEl.textContent = `Applied: ${date.toLocaleDateString()}`;
  } else {
    lastUpdatedEl.textContent = `Updated: ${new Date(application.updated_at).toLocaleDateString()}`;
  }
  
  if (application.notes) {
    notesInput.value = application.notes;
  }
  
  markAppliedBtn.disabled = false;
  markNotAppliedBtn.disabled = false;
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': currentUserId }
    });
    const stats = await response.json();
    
    totalUrlsEl.textContent = stats.total_urls || '0';
    appliedCountEl.textContent = stats.applied_count || '0';
    notAppliedCountEl.textContent = stats.not_applied_count || '0';
  } catch (error) {
    console.error('Error loading stats:', error);
    updateDebugInfo(`Stats error: ${error.message}`);
  }
}

// Mark application as applied/not applied
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
      job_id: jobId
    };
    
    const response = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      currentApplication = result.application;
      updateStatusDisplay(result.application);
      await loadStats(); // Refresh stats
      updateDebugInfo(`Marked as ${applied ? 'Applied' : 'Not Applied'}`);
    } else {
      throw new Error(result.error || 'Failed to save application');
    }
  } catch (error) {
    console.error('Error marking application:', error);
    showError('Failed to save: ' + error.message);
  } finally {
    markAppliedBtn.disabled = false;
    markNotAppliedBtn.disabled = false;
  }
}

// Refresh links
async function refreshLinks() {
  try {
    const refreshBtn = document.getElementById('refreshLinks');
    if (refreshBtn) refreshBtn.disabled = true;
    
    await loadApplicationStatus();
    await loadStats();
    
    updateDebugInfo('Links refreshed');
  } catch (error) {
    console.error('Error refreshing links:', error);
    showError('Failed to refresh: ' + error.message);
  } finally {
    const refreshBtn = document.getElementById('refreshLinks');
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

// Helper functions
function extractDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (error) {
    return url;
  }
}

function showContent() {
  if (contentEl) contentEl.style.display = 'block';
  if (loadingEl) loadingEl.style.display = 'none';
  if (errorEl) errorEl.style.display = 'none';
}

function showError(message) {
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  if (contentEl) contentEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'none';
}

function setupEventListeners() {
  if (markAppliedBtn) {
    markAppliedBtn.addEventListener('click', () => markApplication(true));
  }
  if (markNotAppliedBtn) {
    markNotAppliedBtn.addEventListener('click', () => markApplication(false));
  }
  
  const refreshBtn = document.getElementById('refreshLinks');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshLinks);
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
    
    // Load application status
    updateDebugInfo('Loading application status...');
    console.log('2️⃣ Loading application status...');
    await loadApplicationStatus();
    
    // Load stats
    updateDebugInfo('Loading stats...');
    console.log('3️⃣ Loading stats...');
    await loadStats();
    
    // Set up event listeners
    updateDebugInfo('Setting up event listeners...');
    console.log('4️⃣ Setting up event listeners...');
    setupEventListeners();
    
    // Show content
    updateDebugInfo('Showing content...');
    console.log('5️⃣ Showing content...');
    showContent();
    
    updateDebugInfo('Initialized successfully!');
    console.log('✅ Extension popup initialized successfully!');
    
  } catch (error) {
    console.error('❌ Extension initialization failed:', error);
    updateDebugInfo(`Error: ${error.message}`);
    showError('Failed to initialize extension: ' + error.message);
  }
}
