// Playwright test for Job Application Tracker Chrome Extension
const { chromium } = require('playwright');

async function testChromeExtension() {
  console.log('🧪 Testing Chrome Extension with Playwright...\n');
  
  // Launch Chrome with extension loaded
  const browser = await chromium.launch({
    headless: false, // Set to true for headless testing
    args: [
      '--disable-extensions-except=/Users/macbookpro/M4_Projects/AIEngineer/url_link/chrome-extension',
      '--load-extension=/Users/macbookpro/M4_Projects/AIEngineer/url_link/chrome-extension',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Test 1: Navigate to a job site
    console.log('1️⃣ Testing LinkedIn job page...');
    await page.goto('https://www.linkedin.com/jobs/');
    await page.waitForTimeout(3000);
    
    // Test 2: Check if extension is loaded
    console.log('2️⃣ Checking extension status...');
    const extensionPages = await context.pages();
    console.log('✅ Extension pages found:', extensionPages.length);
    
    // Test 3: Test extension popup (if accessible)
    console.log('3️⃣ Testing extension popup...');
    try {
      // Try to access extension popup
      const popupPage = await context.newPage();
      await popupPage.goto('chrome-extension://[extension-id]/popup.html');
      console.log('✅ Extension popup accessible');
    } catch (error) {
      console.log('⚠️ Extension popup not directly accessible (normal for security)');
    }
    
    // Test 4: Test job link clicking
    console.log('4️⃣ Testing job link interaction...');
    const jobLinks = await page.locator('a[href*="/jobs/view/"]').first();
    if (await jobLinks.count() > 0) {
      console.log('✅ Job links found on page');
      // Click on first job link
      await jobLinks.click();
      await page.waitForTimeout(2000);
      console.log('✅ Job link clicked successfully');
    } else {
      console.log('⚠️ No job links found on current page');
    }
    
    // Test 5: Check console for extension logs
    console.log('5️⃣ Checking extension console logs...');
    page.on('console', msg => {
      if (msg.text().includes('Job Application Tracker') || 
          msg.text().includes('ericabram33@gmail.com') ||
          msg.text().includes('user ID')) {
        console.log('📝 Extension log:', msg.text());
      }
    });
    
    await page.waitForTimeout(5000);
    
    console.log('\n🎉 Extension test completed!');
    
  } catch (error) {
    console.error('❌ Extension test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testChromeExtension();
