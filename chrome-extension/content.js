// Content script for Job Application Tracker
// This runs on every page to provide additional functionality

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname
    });
  }
});

// Function to extract job-related information from the page
function extractJobInfo() {
  const jobInfo = {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    companyName: null,
    jobTitle: null,
    jobDescription: null
  };
  
  // Try to extract company name from common selectors
  const companySelectors = [
    '[data-testid="company-name"]',
    '.company-name',
    '.employer-name',
    '.job-company',
    'h1 + div',
    '[class*="company"]'
  ];
  
  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      jobInfo.companyName = element.textContent.trim();
      break;
    }
  }
  
  // Try to extract job title from common selectors
  const jobTitleSelectors = [
    '[data-testid="job-title"]',
    '.job-title',
    '.position-title',
    'h1',
    '[class*="title"]'
  ];
  
  for (const selector of jobTitleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      jobInfo.jobTitle = element.textContent.trim();
      break;
    }
  }
  
  // Try to extract job description
  const descriptionSelectors = [
    '[data-testid="job-description"]',
    '.job-description',
    '.description',
    '[class*="description"]'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      jobInfo.jobDescription = element.textContent.trim().substring(0, 500); // Limit to 500 chars
      break;
    }
  }
  
  return jobInfo;
}

// Auto-detect job sites and enhance functionality
function detectJobSite() {
  const hostname = window.location.hostname.toLowerCase();
  
  const jobSites = [
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'careerbuilder.com',
    'ziprecruiter.com',
    'dice.com',
    'stackoverflow.com',
    'angel.co',
    'wellfound.com',
    'lever.co',
    'greenhouse.io',
    'workday.com',
    'smartrecruiters.com',
    'bamboohr.com',
    'jobvite.com',
    'taleo.net',
    'icims.com',
    'successfactors.com',
    'recruitee.com',
    'breezy.hr',
    'personio.com',
    'teamtailor.com',
    'workable.com',
    'careers.google.com',
    'jobs.apple.com',
    'amazon.jobs',
    'careers.microsoft.com',
    'jobs.netflix.com',
    'careers.uber.com',
    'careers.airbnb.com'
  ];
  
  return jobSites.some(site => hostname.includes(site));
}

// Initialize content script
if (detectJobSite()) {
  console.log('Job Application Tracker: Detected job site');
  
  // Send page info to background script for enhanced tracking
  const jobInfo = extractJobInfo();
  chrome.runtime.sendMessage({
    action: 'pageInfo',
    data: jobInfo
  });
}

// Listen for URL changes (for SPAs)
let currentUrl = window.location.href;
new MutationObserver(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    
    // Notify background script about URL change
    chrome.runtime.sendMessage({
      action: 'urlChanged',
      url: currentUrl
    });
  }
}).observe(document, {
  subtree: true,
  childList: true
});

// Add keyboard shortcut for quick actions (Ctrl+Shift+J)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    e.preventDefault();
    chrome.runtime.sendMessage({
      action: 'openPopup'
    });
  }
});

// Visual indicator for tracked pages (optional)
function addVisualIndicator(status) {
  // Remove existing indicator
  const existingIndicator = document.getElementById('job-tracker-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Create new indicator
  const indicator = document.createElement('div');
  indicator.id = 'job-tracker-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 10000;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    color: white;
    pointer-events: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;
  
  if (status === 'applied') {
    indicator.textContent = '✓ Applied';
    indicator.style.backgroundColor = '#4CAF50';
  } else if (status === 'not-applied') {
    indicator.textContent = '! Not Applied';
    indicator.style.backgroundColor = '#FF9800';
  } else {
    return; // Don't show indicator for unknown status
  }
  
  document.body.appendChild(indicator);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (indicator && indicator.parentNode) {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator && indicator.parentNode) {
          indicator.remove();
        }
      }, 300);
    }
  }, 3000);
}

// Export functions for use by popup
window.jobTracker = {
  extractJobInfo,
  detectJobSite,
  addVisualIndicator
}; 