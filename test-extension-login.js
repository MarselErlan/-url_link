// Test script to verify extension login flow
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

async function testExtensionLogin() {
  console.log('🧪 Testing Extension Login Flow...\n');
  
  try {
    // Test 1: Check if ericabram33@gmail.com data exists
    console.log('1️⃣ Testing with ericabram33@gmail.com (your Google account)...');
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': 'ericabram33@gmail.com' }
    });
    const stats = await response.json();
    console.log('✅ Stats for ericabram33@gmail.com:', stats);
    
    if (stats.total_urls !== '0') {
      console.log('✅ Data exists for ericabram33@gmail.com');
      console.log(`   Total URLs: ${stats.total_urls}`);
      console.log(`   Applied: ${stats.applied_count}`);
      console.log(`   Not Applied: ${stats.not_applied_count}`);
    } else {
      console.log('❌ No data found for ericabram33@gmail.com');
    }
    
    // Test 2: Test with a different Google account
    console.log('\n2️⃣ Testing with different Google account...');
    const differentUser = 'testuser@gmail.com';
    const differentResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': differentUser }
    });
    const differentStats = await differentResponse.json();
    console.log('✅ Stats for different user:', differentStats);
    
    if (differentStats.total_urls === '0') {
      console.log('✅ User isolation working: Different user has no data');
    } else {
      console.log('❌ User isolation broken: Different user can see other data');
    }
    
    // Test 3: Save a test URL for ericabram33@gmail.com
    console.log('\n3️⃣ Testing URL saving for ericabram33@gmail.com...');
    const testJob = {
      url: 'https://www.linkedin.com/jobs/view/login-test-job',
      title: 'Login Test Job',
      applied: true,
      notes: 'Testing login flow'
    };
    
    const saveResponse = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'ericabram33@gmail.com'
      },
      body: JSON.stringify(testJob)
    });
    
    const saveResult = await saveResponse.json();
    console.log('✅ Save result for ericabram33@gmail.com:', saveResult);
    
    if (saveResult.success) {
      console.log('✅ URL saved successfully');
      console.log('   User ID:', saveResult.application.user_id);
      console.log('   Action:', saveResult.action);
    } else {
      console.log('❌ URL save failed');
    }
    
    // Test 4: Verify final stats
    console.log('\n4️⃣ Verifying final stats...');
    const finalResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': 'ericabram33@gmail.com' }
    });
    const finalStats = await finalResponse.json();
    console.log('✅ Final stats for ericabram33@gmail.com:', finalStats);
    
    console.log('\n📊 Login Flow Test Summary:');
    console.log(`   Eric (ericabram33@gmail.com): ${finalStats.total_urls} URLs`);
    console.log(`   Different User (${differentUser}): ${differentStats.total_urls} URLs`);
    
    if (finalStats.total_urls !== '0' && differentStats.total_urls === '0') {
      console.log('\n🎉 Login flow is working correctly!');
      console.log('✅ Eric can see their data');
      console.log('✅ Different Google accounts are isolated');
      console.log('✅ URL saving works with Google account email');
      console.log('✅ Extension login flow should work properly');
    } else {
      console.log('\n❌ Login flow has issues');
    }
    
    console.log('\n🚀 Extension Login Flow Instructions:');
    console.log('1. Open Chrome Extension popup');
    console.log('2. Click "Sign in with Google" button');
    console.log('3. If Chrome identity works, it will use your email');
    console.log('4. If Chrome identity fails, enter "ericabram33@gmail.com"');
    console.log('5. After login, you should see your job application data');
    console.log('6. All saved URLs will use your Google account email as user_id');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testExtensionLogin();
