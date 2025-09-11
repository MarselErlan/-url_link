// Test script to verify user isolation between different Chrome accounts
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

async function testUserIsolation() {
  console.log('🧪 Testing user isolation between different Chrome accounts...\n');
  
  try {
    // Test 1: Check ericabram33@gmail.com data
    console.log('1️⃣ Testing ericabram33@gmail.com data...');
    const ericResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': 'ericabram33@gmail.com' }
    });
    const ericStats = await ericResponse.json();
    console.log('✅ Eric stats:', ericStats);
    
    // Test 2: Test with a different user (simulating different Chrome account)
    console.log('\n2️⃣ Testing with different user (different Chrome account)...');
    const differentUser = 'differentuser@gmail.com';
    const differentResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': differentUser }
    });
    const differentStats = await differentResponse.json();
    console.log('✅ Different user stats:', differentStats);
    
    // Test 3: Verify isolation - different user should have 0 data
    if (differentStats.total_urls === '0') {
      console.log('✅ User isolation working: Different user has no data');
    } else {
      console.log('❌ User isolation broken: Different user can see Eric\'s data');
    }
    
    // Test 4: Test with generated profile ID
    console.log('\n3️⃣ Testing with generated profile ID...');
    const profileId = 'profile_abc123def456_1234567890';
    const profileResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': profileId }
    });
    const profileStats = await profileResponse.json();
    console.log('✅ Profile ID stats:', profileStats);
    
    if (profileStats.total_urls === '0') {
      console.log('✅ Profile isolation working: Generated profile has no data');
    } else {
      console.log('❌ Profile isolation broken: Generated profile can see other data');
    }
    
    // Test 5: Test with browser fingerprint ID
    console.log('\n4️⃣ Testing with browser fingerprint ID...');
    const browserId = 'browser_a1b2c3d4e5f6_1234567890';
    const browserResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': browserId }
    });
    const browserStats = await browserResponse.json();
    console.log('✅ Browser ID stats:', browserStats);
    
    if (browserStats.total_urls === '0') {
      console.log('✅ Browser isolation working: Browser fingerprint has no data');
    } else {
      console.log('❌ Browser isolation broken: Browser fingerprint can see other data');
    }
    
    // Test 6: Save data for different user to verify isolation
    console.log('\n5️⃣ Testing data saving for different user...');
    const testJob = {
      url: 'https://www.linkedin.com/jobs/view/isolation-test-job',
      title: 'Isolation Test Job',
      applied: true,
      notes: 'Testing user isolation'
    };
    
    const saveResponse = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': differentUser
      },
      body: JSON.stringify(testJob)
    });
    
    const saveResult = await saveResponse.json();
    console.log('✅ Save result for different user:', saveResult);
    
    // Test 7: Verify Eric can't see the different user's data
    console.log('\n6️⃣ Verifying Eric cannot see different user\'s data...');
    const ericFinalResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': 'ericabram33@gmail.com' }
    });
    const ericFinalStats = await ericFinalResponse.json();
    console.log('✅ Eric final stats:', ericFinalStats);
    
    // Test 8: Verify different user can see their own data
    console.log('\n7️⃣ Verifying different user can see their own data...');
    const differentFinalResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': differentUser }
    });
    const differentFinalStats = await differentFinalResponse.json();
    console.log('✅ Different user final stats:', differentFinalStats);
    
    // Summary
    console.log('\n📊 Isolation Test Summary:');
    console.log(`   Eric (ericabram33@gmail.com): ${ericFinalStats.total_urls} URLs`);
    console.log(`   Different User (${differentUser}): ${differentFinalStats.total_urls} URLs`);
    
    if (ericFinalStats.total_urls === ericStats.total_urls && 
        differentFinalStats.total_urls === '1') {
      console.log('\n🎉 User isolation is working perfectly!');
      console.log('✅ Each user only sees their own data');
      console.log('✅ Data is properly isolated between users');
      console.log('✅ No data leakage between different Chrome accounts');
    } else {
      console.log('\n❌ User isolation has issues');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserIsolation();
