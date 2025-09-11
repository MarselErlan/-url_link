const { chromium } = require('playwright');

async function testChromeEmailDetection() {
  console.log('🧪 Testing Chrome Google Account Email Detection...\n');
  
  let context;
  try {
    // Use your actual Chrome profile (you'll need to find the path)
    // On macOS, it's usually: ~/Library/Application Support/Google/Chrome
    const chromeProfilePath = '/Users/macbookpro/Library/Application Support/Google/Chrome';
    
    console.log('1️⃣ Launching Chrome with your profile...');
    
    context = await chromium.launchPersistentContext(chromeProfilePath, {
      headless: false, // Show browser window
      channel: 'chrome', // Use Chrome instead of Chromium
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-first-run',
        '--no-default-browser-check'
      ]
    });

    const page = await context.newPage();

    console.log('2️⃣ Navigating to Google to check signed-in account...');
    
    // Navigate to Google
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');

    console.log('3️⃣ Looking for Google account indicator...');
    
    // Look for Google account profile picture or indicator
    try {
      // Common selectors for Google account indicators
      const accountSelectors = [
        '[data-ved]',
        '[aria-label*="Google Account"]',
        '.gb_D',
        '.gb_C',
        '[data-test-id="profile-menu"]',
        '.profile-menu',
        '[aria-label*="Profile"]'
      ];
      
      let accountFound = false;
      
      for (const selector of accountSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Found account indicator with selector: ${selector}`);
            
            // Click on the account indicator
            await element.click();
            await page.waitForTimeout(2000);
            
            // Look for email in the dropdown/menu
            const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
            
            if (await emailElement.isVisible()) {
              const email = await emailElement.textContent();
              console.log('✅ Found Google account email:', email);
              return email.trim();
            }
            
            accountFound = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!accountFound) {
        console.log('❌ No Google account indicator found');
      }
      
    } catch (error) {
      console.log('❌ Error checking account indicator:', error.message);
    }

    console.log('4️⃣ Trying Google Account page...');
    
    // Navigate to Google Account page
    await page.goto('https://myaccount.google.com/');
    await page.waitForLoadState('networkidle');
    
    try {
      // Look for email on the account page
      const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
      
      if (await emailElement.isVisible()) {
        const email = await emailElement.textContent();
        console.log('✅ Found email on Google account page:', email);
        return email.trim();
      } else {
        console.log('❌ No email found on Google account page');
      }
    } catch (error) {
      console.log('❌ Error checking Google account page:', error.message);
    }

    console.log('5️⃣ Trying Chrome settings...');
    
    // Navigate to Chrome settings
    await page.goto('chrome://settings/');
    await page.waitForLoadState('networkidle');
    
    try {
      // Look for account info in Chrome settings
      const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
      
      if (await emailElement.isVisible()) {
        const email = await emailElement.textContent();
        console.log('✅ Found email in Chrome settings:', email);
        return email.trim();
      } else {
        console.log('❌ No email found in Chrome settings');
      }
    } catch (error) {
      console.log('❌ Error checking Chrome settings:', error.message);
    }

    console.log('\n❌ Could not detect Google account email');
    console.log('💡 This might mean:');
    console.log('   - User is not signed in to Chrome');
    console.log('   - Chrome profile path is incorrect');
    console.log('   - Need to manually sign in to Chrome first');
    
    return null;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Profile directory')) {
      console.log('💡 Try running Chrome manually first to ensure you\'re signed in');
    }
    
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
    
    if (email === 'ericabram33@gmail.com') {
      console.log('✅ This matches your expected email!');
      console.log('✅ Chrome can detect your Google account');
      console.log('✅ Extension should work with this email');
    } else {
      console.log('⚠️  This is a different email than expected');
    }
  } else {
    console.log('\n❌ Could not detect Google account email');
    console.log('💡 Make sure you are signed in to Chrome with your Google account');
  }
});
