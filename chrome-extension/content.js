// Content script for Job Application Tracker
// This runs on every page to provide additional functionality

const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageInfo') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname
    });
  } else if (request.action === 'refreshLinks') {
    // Handle refresh links request from popup
    preCheckVisibleLinks().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error refreshing links:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});

// Get Chrome user ID
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

// Check URL status in database
async function checkUrlStatus(url) {
  try {
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
    return data;
  } catch (error) {
    console.error('Error checking URL status:', error);
    return null;
  }
}

// Show status indicator for a link
function showLinkStatusIndicator(linkElement, status) {
  // Remove existing indicator
  const existingIndicator = linkElement.querySelector('.job-tracker-link-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Create indicator
  const indicator = document.createElement('span');
  indicator.className = 'job-tracker-link-indicator';
  indicator.style.cssText = `
    display: inline-block;
    margin-left: 8px;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    color: white;
    text-decoration: none;
    pointer-events: none;
    vertical-align: middle;
    line-height: 1;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    animation: job-tracker-fade-in 0.3s ease;
    z-index: 1000;
    position: relative;
  `;
  
  if (status === 'applied') {
    indicator.textContent = '✓ Applied';
    indicator.style.backgroundColor = '#4CAF50';
    indicator.style.border = '1px solid #45a049';
  } else if (status === 'not-applied') {
    indicator.textContent = '! Not Applied';
    indicator.style.backgroundColor = '#FF9800';
    indicator.style.border = '1px solid #f57c00';
  } else {
    return; // Don't show indicator for unknown status
  }
  
  // Insert indicator after the link text
  linkElement.appendChild(indicator);
  
  // Add CSS animation
  if (!document.getElementById('job-tracker-styles')) {
    const style = document.createElement('style');
    style.id = 'job-tracker-styles';
    style.textContent = `
      @keyframes job-tracker-fade-in {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
      
      .job-tracker-link-indicator {
        transition: opacity 0.3s ease, transform 0.2s ease;
      }
      
      .job-tracker-link-indicator:hover {
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Auto-hide after 8 seconds (increased from 5)
  setTimeout(() => {
    if (indicator && indicator.parentNode) {
      indicator.style.opacity = '0';
      indicator.style.transform = 'scale(0.8)';
      setTimeout(() => {
        if (indicator && indicator.parentNode) {
          indicator.remove();
        }
      }, 300);
    }
  }, 8000);
}

// Handle link click
async function handleLinkClick(event) {
  // Find the closest link element (could be the clicked element or a parent)
  let linkElement = event.target.closest('a');
  
  // If no direct link found, look for nearby links or job-related elements
  if (!linkElement) {
    // Check if we clicked on a job-related element (like buttons, cards, etc.)
    const clickedElement = event.target;
    const jobRelatedSelectors = [
      '[data-testid*="job"]',
      '[data-testid*="position"]',
      '[data-testid*="application"]',
      '[class*="job"]',
      '[class*="position"]',
      '[class*="application"]',
      '[role="button"]',
      'button',
      '.job-card',
      '.position-card',
      '.application-card'
    ];
    
    // Check if clicked element matches job-related selectors
    const isJobRelated = jobRelatedSelectors.some(selector => {
      try {
        return clickedElement.matches(selector);
      } catch (e) {
        return false;
      }
    });
    
    if (isJobRelated) {
      // Look for a link within this element or its parent
      linkElement = clickedElement.querySelector('a') || 
                   clickedElement.closest('[data-testid*="job"] a') ||
                   clickedElement.closest('[class*="job"] a') ||
                   clickedElement.closest('.job-card a') ||
                   clickedElement.closest('.position-card a');
    }
    
    // If still no link, check if the clicked element has a data attribute with a URL
    if (!linkElement && clickedElement.dataset) {
      const urlFromData = clickedElement.dataset.url || 
                         clickedElement.dataset.href || 
                         clickedElement.dataset.jobUrl;
      if (urlFromData) {
        // Create a temporary link element for processing
        const tempLink = document.createElement('a');
        tempLink.href = urlFromData;
        linkElement = tempLink;
      }
    }
  }
  
  if (!linkElement) return;
  
  const href = linkElement.href;
  if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return;
  }
  
  // Check if it's a job-related URL
  const url = new URL(href);
  const hostname = url.hostname.toLowerCase();
  
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
  
  const isJobSite = jobSites.some(site => hostname.includes(site));
  
  if (isJobSite) {
    // Check URL status
    const statusData = await checkUrlStatus(href);
    
    if (statusData && statusData.found) {
      const status = statusData.application.applied ? 'applied' : 'not-applied';
      
      // If we found a real link element, show indicator on it
      if (linkElement.tagName === 'A') {
        showLinkStatusIndicator(linkElement, status);
      } else {
        // If it's a temporary link or other element, show indicator on the clicked element
        showLinkStatusIndicator(event.target, status);
      }
    }
  }
}

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

// Pre-check links when they become visible
async function preCheckVisibleLinks() {
  const links = document.querySelectorAll('a[href]');
  const jobLinks = [];
  
  // Also look for job-related elements that might contain links
  const jobElements = document.querySelectorAll([
    '[data-testid*="job"]',
    '[data-testid*="position"]',
    '[data-testid*="application"]',
    '[class*="job"]',
    '[class*="position"]',
    '[class*="application"]',
    '.job-card',
    '.position-card',
    '.application-card'
  ].join(','));
  
  // Process regular links
  links.forEach(link => {
    const href = link.href;
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    
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
    
    const isJobSite = jobSites.some(site => hostname.includes(site));
    
    if (isJobSite) {
      jobLinks.push({ link, href, element: link });
    }
  });
  
  // Process job-related elements
  jobElements.forEach(element => {
    // Look for links within the element
    const elementLinks = element.querySelectorAll('a[href]');
    elementLinks.forEach(link => {
      const href = link.href;
      if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      
      const url = new URL(href);
      const hostname = url.hostname.toLowerCase();
      
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
      
      const isJobSite = jobSites.some(site => hostname.includes(site));
      
      if (isJobSite) {
        jobLinks.push({ link, href, element: link });
      }
    });
    
    // Check for URLs in data attributes
    if (element.dataset) {
      const urlFromData = element.dataset.url || 
                         element.dataset.href || 
                         element.dataset.jobUrl;
      if (urlFromData) {
        try {
          const url = new URL(urlFromData);
          const hostname = url.hostname.toLowerCase();
          
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
          
          const isJobSite = jobSites.some(site => hostname.includes(site));
          
          if (isJobSite) {
            jobLinks.push({ link: null, href: urlFromData, element: element });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    }
  });
  
  if (jobLinks.length > 0) {
    // Use batch API if available, otherwise check individually
    try {
      const userId = await getChromeUserId();
      const urls = jobLinks.map(item => item.href);
      
      const response = await fetch(`${API_BASE_URL}/api/status/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ urls })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        data.results.forEach((result, index) => {
          if (result.found) {
            const status = result.application.applied ? 'applied' : 'not-applied';
            const targetElement = jobLinks[index].link || jobLinks[index].element;
            if (targetElement) {
              showLinkStatusIndicator(targetElement, status);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error in batch link check:', error);
      // Fallback to individual checks
      for (const { link, href, element } of jobLinks) {
        const statusData = await checkUrlStatus(href);
        if (statusData && statusData.found) {
          const status = statusData.application.applied ? 'applied' : 'not-applied';
          const targetElement = link || element;
          if (targetElement) {
            showLinkStatusIndicator(targetElement, status);
          }
        }
      }
    }
  }
}

// Initialize content script
function initializeContentScript() {
  if (detectJobSite()) {
    console.log('Job Application Tracker: Detected job site');
    
    // Send page info to background script for enhanced tracking
    const jobInfo = extractJobInfo();
    chrome.runtime.sendMessage({
      action: 'pageInfo',
      data: jobInfo
    });
    
    // Add click event listener for links
    document.addEventListener('click', handleLinkClick, true);
    
    // Pre-check visible links after a short delay
    setTimeout(preCheckVisibleLinks, 1000);
    
    // Also listen for dynamically added links
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a link or contains links
            const links = node.querySelectorAll ? node.querySelectorAll('a') : [];
            if (node.tagName === 'A') {
              links.push(node);
            }
            
            // Add click listeners to new links
            links.forEach(link => {
              link.addEventListener('click', handleLinkClick);
            });
          }
        });
      });
      
      // Re-check visible links when DOM changes
      setTimeout(preCheckVisibleLinks, 500);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
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
    
    // Re-initialize for new page content
    setTimeout(initializeContentScript, 1000);
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

// Export functions for use by popup
window.jobTracker = {
  extractJobInfo,
  detectJobSite,
  addVisualIndicator,
  checkUrlStatus,
  showLinkStatusIndicator
}; 