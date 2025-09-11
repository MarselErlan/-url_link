const { chromium } = require('playwright');

async function testChromeEmailDetection() {
  console.log('🧪 Testing Chrome Google Account Email Detection (Minimal)...\n');
  
  let context;
  try {
    // Use a temporary profile to avoid conflicts
    const tempProfilePath = '/tmp/chrome-test-profile-' + Date.now();
    
    console.log('1️⃣ Launching Chrome with temporary profile...');
    
    context = await chromium.launchPersistentContext(tempProfilePath, {
      headless: false, // Show browser window
      channel: 'chrome', // Use Chrome instead of Chromium
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-plugins'
      ]
    });

    const page = await context.newPage();

    console.log('2️⃣ Navigating to Google...');
    
    // Navigate to Google
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');

    console.log('3️⃣ Looking for sign-in option...');
    
    // Look for sign-in button
    try {
      const signInButton = await page.locator('text=Sign in').first();
      
      if (await signInButton.isVisible()) {
        console.log('✅ Found sign-in button');
        console.log('💡 You need to manually sign in to your Google account');
        console.log('💡 After signing in, the script will detect your email');
        
        // Wait for user to sign in manually
        console.log('⏳ Waiting for you to sign in... (Press Enter when done)');
        
        // Wait for user input
        await new Promise((resolve) => {
          process.stdin.once('data', () => resolve());
        });
        
        // Refresh page to check for signed-in state
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Now look for account indicator
        const accountSelectors = [
          '[data-ved]',
          '[aria-label*="Google Account"]',
          '.gb_D',
          '.gb_C'
        ];
        
        for (const selector of accountSelectors) {
          try {
            const element = await page.locator(selector).first();
            if (await element.isVisible()) {
              console.log(`✅ Found account indicator: ${selector}`);
              
              // Click on account
              await element.click();
              await page.waitForTimeout(2000);
              
              // Look for email
              const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
              
              if (await emailElement.isVisible()) {
                const email = await emailElement.textContent();
                console.log('✅ Found Google account email:', email);
                return email.trim();
              }
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        console.log('❌ Could not find email after sign-in');
        
      } else {
        console.log('❌ No sign-in button found');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('\n❌ Could not detect Google account email');
    console.log('💡 Make sure you are signed in to Google');
    
    return null;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
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
  }
  
  process.exit(0);
});
