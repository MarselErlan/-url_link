const { chromium } = require('playwright');

async function testChromeEmailDetection() {
  console.log('🧪 Testing Chrome Google Account Email Detection with Playwright...\n');
  
  let context;
  try {
    // Launch Chrome with persistent context to access signed-in account
    context = await chromium.launchPersistentContext('/tmp/chrome-test-profile', {
      headless: false, // Show browser window
      channel: 'chrome', // Use Chrome instead of Chromium
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await context.newPage();

    console.log('1️⃣ Opening Chrome and navigating to Google...');
    
    // Navigate to Google to check if user is signed in
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');

    console.log('2️⃣ Checking for signed-in Google account...');
    
    // Look for Google account indicator
    try {
      // Check if there's a profile picture or account indicator
      const accountIndicator = await page.locator('[data-ved], [aria-label*="Google Account"], .gb_D, .gb_C').first();
      
      if (await accountIndicator.isVisible()) {
        console.log('✅ Found Google account indicator');
        
        // Click on account to see email
        await accountIndicator.click();
        await page.waitForTimeout(2000);
        
        // Look for email in the account menu
        const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
        
        if (await emailElement.isVisible()) {
          const email = await emailElement.textContent();
          console.log('✅ Found Google account email:', email);
          return email;
        } else {
          console.log('❌ Could not find email in account menu');
        }
      } else {
        console.log('❌ No Google account indicator found');
      }
    } catch (error) {
      console.log('❌ Error checking account indicator:', error.message);
    }

    console.log('3️⃣ Trying alternative method - checking Chrome identity...');
    
    // Navigate to a page that might show account info
    await page.goto('https://myaccount.google.com/');
    await page.waitForLoadState('networkidle');
    
    try {
      // Look for email on Google account page
      const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
      
      if (await emailElement.isVisible()) {
        const email = await emailElement.textContent();
        console.log('✅ Found email on Google account page:', email);
        return email;
      } else {
        console.log('❌ No email found on Google account page');
      }
    } catch (error) {
      console.log('❌ Error checking Google account page:', error.message);
    }

    console.log('4️⃣ Trying Chrome extensions page...');
    
    // Navigate to Chrome extensions page
    await page.goto('chrome://extensions/');
    await page.waitForLoadState('networkidle');
    
    try {
      // Look for profile info in Chrome extensions page
      const profileElement = await page.locator('[data-test-id="profile-menu"], .profile-menu, [aria-label*="Profile"]').first();
      
      if (await profileElement.isVisible()) {
        console.log('✅ Found profile element on extensions page');
        await profileElement.click();
        await page.waitForTimeout(1000);
        
        // Look for email in profile dropdown
        const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
        
        if (await emailElement.isVisible()) {
          const email = await emailElement.textContent();
          console.log('✅ Found email in profile dropdown:', email);
          return email;
        }
      } else {
        console.log('❌ No profile element found on extensions page');
      }
    } catch (error) {
      console.log('❌ Error checking extensions page:', error.message);
    }

    console.log('5️⃣ Trying Chrome settings page...');
    
    // Navigate to Chrome settings
    await page.goto('chrome://settings/');
    await page.waitForLoadState('networkidle');
    
    try {
      // Look for account info in settings
      const accountElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
      
      if (await accountElement.isVisible()) {
        const email = await accountElement.textContent();
        console.log('✅ Found email in Chrome settings:', email);
        return email;
      } else {
        console.log('❌ No email found in Chrome settings');
      }
    } catch (error) {
      console.log('❌ Error checking Chrome settings:', error.message);
    }

    console.log('\n❌ Could not detect Google account email');
    console.log('💡 This might mean:');
    console.log('   - User is not signed in to Chrome');
    console.log('   - Chrome identity API is not accessible from Playwright');
    console.log('   - Need to use actual Chrome extension context');
    
    return null;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  } finally {
    if (context) {
      await context.close();
    }
  }
}

// Run the test
testChromeEmailDetection().then((email) => {
  if (email) {
    console.log(`\n🎉 Success! Detected Google account: ${email}`);
  } else {
    console.log('\n❌ Could not detect Google account email');
  }
});
