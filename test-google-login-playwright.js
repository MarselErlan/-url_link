const { chromium } = require('playwright');

async function testGoogleLogin() {
  console.log('🧪 Testing Google Login with Playwright...\n');
  
  let context;
  try {
    // Use a temporary profile
    const tempProfilePath = '/tmp/chrome-test-profile-' + Date.now();
    
    console.log('1️⃣ Launching Chrome...');
    
    context = await chromium.launchPersistentContext(tempProfilePath, {
      headless: false, // Show browser window
      channel: 'chrome', // Use Chrome instead of Chromium
      args: [
        '--no-first-run',
        '--no-default-browser-check'
      ]
    });

    const page = await context.newPage();

    console.log('2️⃣ Navigating to Google...');
    
    // Navigate to Google
    await page.goto('https://www.google.com');
    await page.waitForLoadState('networkidle');

    console.log('3️⃣ Looking for Sign In button...');
    
    // Look for sign in button
    const signInButton = await page.locator('text=Sign in').first();
    
    if (await signInButton.isVisible()) {
      console.log('✅ Found Sign In button');
      console.log('🖱️ Clicking Sign In button...');
      
      await signInButton.click();
      await page.waitForLoadState('networkidle');
      
      console.log('📧 Please sign in with your Google account (ericabram33@gmail.com)');
      console.log('⏳ Waiting for you to complete the sign-in process...');
      console.log('💡 After signing in, press Enter to continue...');
      
      // Wait for user to complete sign-in
      await new Promise((resolve) => {
        process.stdin.once('data', () => resolve());
      });
      
      console.log('4️⃣ Checking for signed-in state...');
      
      // Go back to Google homepage
      await page.goto('https://www.google.com');
      await page.waitForLoadState('networkidle');
      
      // Look for account indicator
      const accountSelectors = [
        '[data-ved]',
        '[aria-label*="Google Account"]',
        '.gb_D',
        '.gb_C',
        '[data-test-id="profile-menu"]'
      ];
      
      let accountFound = false;
      
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
              console.log('🎉 SUCCESS! Found Google account email:', email);
              
              if (email.includes('ericabram33@gmail.com')) {
                console.log('✅ Perfect! This matches your expected email!');
                console.log('✅ Chrome can detect your Google account');
                console.log('✅ Your extension should work with this email');
              } else {
                console.log('⚠️ Different email than expected:', email);
              }
              
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
        console.log('❌ No account indicator found after sign-in');
        console.log('💡 You might not be fully signed in yet');
      }
      
    } else {
      console.log('❌ No Sign In button found');
      console.log('💡 You might already be signed in or on a different page');
    }

    console.log('5️⃣ Trying Google Account page...');
    
    // Navigate to Google Account page
    await page.goto('https://myaccount.google.com/');
    await page.waitForLoadState('networkidle');
    
    try {
      // Look for email on the account page
      const emailElement = await page.locator('text=/@gmail\\.com|@googlemail\\.com/').first();
      
      if (await emailElement.isVisible()) {
        const email = await emailElement.textContent();
        console.log('✅ Found email on Google account page:', email);
        
        if (email.includes('ericabram33@gmail.com')) {
          console.log('🎉 SUCCESS! This matches your expected email!');
        }
        
        return email.trim();
      } else {
        console.log('❌ No email found on Google account page');
      }
    } catch (error) {
      console.log('❌ Error checking Google account page:', error.message);
    }

    console.log('\n❌ Could not detect Google account email');
    console.log('💡 Make sure you completed the sign-in process');
    
    return null;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  } finally {
    if (context) {
      console.log('🔄 Closing browser...');
      await context.close();
    }
  }
}

// Run the test
testGoogleLogin().then((email) => {
  if (email) {
    console.log(`\n🎉 Final Result: Detected Google account: ${email}`);
    
    if (email.includes('ericabram33@gmail.com')) {
      console.log('✅ This confirms Chrome can detect your Google account!');
      console.log('✅ Your extension should work properly now');
    }
  } else {
    console.log('\n❌ Could not detect Google account email');
    console.log('💡 Try running the test again and make sure to complete the sign-in');
  }
  
  process.exit(0);
});
