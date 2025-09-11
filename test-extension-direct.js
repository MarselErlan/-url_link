// Test script to verify the extension will work with ericabram33@gmail.com
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

async function testExtensionWithEmail() {
  console.log('🧪 Testing extension with ericabram33@gmail.com...\n');
  
  try {
    // Test 1: Get stats for your email
    console.log('1️⃣ Getting stats for ericabram33@gmail.com...');
    const statsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: {
        'x-user-id': 'ericabram33@gmail.com'
      }
    });
    
    if (!statsResponse.ok) {
      throw new Error(`HTTP ${statsResponse.status}: ${statsResponse.statusText}`);
    }
    
    const stats = await statsResponse.json();
    console.log('✅ Stats:', stats);
    
    // Test 2: Test a sample URL
    console.log('\n2️⃣ Testing sample URL...');
    const testUrl = 'https://www.linkedin.com/jobs/view/1234567890';
    const encodedUrl = encodeURIComponent(testUrl);
    const statusResponse = await fetch(`${API_BASE_URL}/api/status/${encodedUrl}`, {
      headers: {
        'x-user-id': 'ericabram33@gmail.com'
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
    }
    
    const status = await statusResponse.json();
    console.log('✅ URL status:', status);
    
    // Test 3: Save a test application
    console.log('\n3️⃣ Saving test application...');
    const applicationData = {
      url: testUrl,
      title: 'Test Job from Extension',
      applied: true,
      notes: 'This is a test from the extension'
    };
    
    const saveResponse = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'ericabram33@gmail.com'
      },
      body: JSON.stringify(applicationData)
    });
    
    if (!saveResponse.ok) {
      throw new Error(`HTTP ${saveResponse.status}: ${saveResponse.statusText}`);
    }
    
    const saveResult = await saveResponse.json();
    console.log('✅ Save result:', saveResult);
    
    // Test 4: Get updated stats
    console.log('\n4️⃣ Getting updated stats...');
    const finalStatsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: {
        'x-user-id': 'ericabram33@gmail.com'
      }
    });
    
    const finalStats = await finalStatsResponse.json();
    console.log('✅ Final stats:', finalStats);
    
    console.log('\n🎉 Extension test completed successfully!');
    console.log('The extension should now work with your email and show all your data.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testExtensionWithEmail();
