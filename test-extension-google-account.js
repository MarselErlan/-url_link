// Test script to verify extension works with Google accounts
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

async function testGoogleAccountBehavior() {
  console.log('🧪 Testing Google Account behavior for extension...\n');
  
  try {
    // Test 1: Verify ericabram33@gmail.com can see their data
    console.log('1️⃣ Testing ericabram33@gmail.com (your Google account)...');
    const ericResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': 'ericabram33@gmail.com' }
    });
    const ericStats = await ericResponse.json();
    console.log('✅ Eric stats:', ericStats);
    
    if (ericStats.total_urls !== '0') {
      console.log('✅ Eric can see their data:', ericStats.total_urls, 'URLs');
    } else {
      console.log('❌ Eric cannot see their data - this is the problem!');
    }
    
    // Test 2: Test with a different Google account
    console.log('\n2️⃣ Testing with different Google account...');
    const differentGoogleAccount = 'differentuser@gmail.com';
    const differentResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': differentGoogleAccount }
    });
    const differentStats = await differentResponse.json();
    console.log('✅ Different Google account stats:', differentStats);
    
    // Test 3: Save a test URL for ericabram33@gmail.com
    console.log('\n3️⃣ Testing URL saving for ericabram33@gmail.com...');
    const testJob = {
      url: 'https://www.linkedin.com/jobs/view/google-account-test',
      title: 'Google Account Test Job',
      applied: true,
      notes: 'Testing Google account sync'
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
    console.log('✅ Save result for Eric:', saveResult);
    
    // Test 4: Verify Eric can see the new URL
    console.log('\n4️⃣ Verifying Eric can see the new URL...');
    const ericFinalResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': 'ericabram33@gmail.com' }
    });
    const ericFinalStats = await ericFinalResponse.json();
    console.log('✅ Eric final stats:', ericFinalStats);
    
    // Test 5: Verify different Google account cannot see Eric's data
    console.log('\n5️⃣ Verifying different Google account cannot see Eric\'s data...');
    const differentFinalResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': differentGoogleAccount }
    });
    const differentFinalStats = await differentFinalResponse.json();
    console.log('✅ Different Google account final stats:', differentFinalStats);
    
    // Summary
    console.log('\n📊 Google Account Test Summary:');
    console.log(`   Eric (ericabram33@gmail.com): ${ericFinalStats.total_urls} URLs`);
    console.log(`   Different Google Account (${differentGoogleAccount}): ${differentFinalStats.total_urls} URLs`);
    
    if (ericFinalStats.total_urls !== '0' && differentFinalStats.total_urls === '0') {
      console.log('\n🎉 Google Account behavior is working correctly!');
      console.log('✅ Eric can see their data');
      console.log('✅ Different Google accounts are isolated');
      console.log('✅ Data syncs properly for same Google account');
    } else {
      console.log('\n❌ Google Account behavior has issues');
      if (ericFinalStats.total_urls === '0') {
        console.log('❌ Eric cannot see their data - extension may not be using Google account email');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testGoogleAccountBehavior();
