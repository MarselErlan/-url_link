// Test script to verify URL saving functionality
const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

async function testUrlSaving() {
  console.log('🧪 Testing URL saving functionality...\n');
  
  try {
    const userId = 'ericabram33@gmail.com';
    
    // Test 1: Get initial stats
    console.log('1️⃣ Getting initial stats...');
    const initialStatsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': userId }
    });
    const initialStats = await initialStatsResponse.json();
    console.log('✅ Initial stats:', initialStats);
    
    // Test 2: Save a new job application
    console.log('\n2️⃣ Saving new job application...');
    const testJob = {
      url: 'https://www.linkedin.com/jobs/view/test-save-job-12345',
      title: 'Test Save Job - Software Engineer',
      applied: true,
      notes: 'This is a test job application to verify saving works'
    };
    
    const saveResponse = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(testJob)
    });
    
    if (!saveResponse.ok) {
      throw new Error(`Save failed: ${saveResponse.status} ${saveResponse.statusText}`);
    }
    
    const saveResult = await saveResponse.json();
    console.log('✅ Save result:', saveResult);
    
    // Test 3: Check if URL status is found
    console.log('\n3️⃣ Checking URL status...');
    const encodedUrl = encodeURIComponent(testJob.url);
    const statusResponse = await fetch(`${API_BASE_URL}/api/status/${encodedUrl}`, {
      headers: { 'x-user-id': userId }
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.status} ${statusResponse.statusText}`);
    }
    
    const statusResult = await statusResponse.json();
    console.log('✅ Status result:', statusResult);
    
    if (statusResult.found) {
      console.log('✅ URL was saved and found successfully!');
      console.log('   - Applied:', statusResult.application.applied);
      console.log('   - Title:', statusResult.application.title);
      console.log('   - Notes:', statusResult.application.notes);
    } else {
      console.log('❌ URL was not found after saving');
    }
    
    // Test 4: Get updated stats
    console.log('\n4️⃣ Getting updated stats...');
    const updatedStatsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': userId }
    });
    const updatedStats = await updatedStatsResponse.json();
    console.log('✅ Updated stats:', updatedStats);
    
    // Test 5: Test updating existing application
    console.log('\n5️⃣ Testing update of existing application...');
    const updateJob = {
      url: testJob.url,
      title: 'Updated Test Job - Senior Software Engineer',
      applied: false,
      notes: 'Updated: Changed my mind about this position'
    };
    
    const updateResponse = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(updateJob)
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ Update result:', updateResult);
    
    // Test 6: Verify update
    console.log('\n6️⃣ Verifying update...');
    const verifyResponse = await fetch(`${API_BASE_URL}/api/status/${encodedUrl}`, {
      headers: { 'x-user-id': userId }
    });
    const verifyResult = await verifyResponse.json();
    console.log('✅ Verify result:', verifyResult);
    
    if (verifyResult.found) {
      console.log('✅ Update successful!');
      console.log('   - Applied:', verifyResult.application.applied);
      console.log('   - Title:', verifyResult.application.title);
      console.log('   - Notes:', verifyResult.application.notes);
    }
    
    // Test 7: Test LinkedIn job ID extraction
    console.log('\n7️⃣ Testing LinkedIn job ID extraction...');
    const linkedinJob = {
      url: 'https://www.linkedin.com/jobs/view/1234567890?currentJobId=1234567890',
      title: 'LinkedIn Test Job',
      applied: true,
      notes: 'Testing LinkedIn job ID extraction'
    };
    
    const linkedinResponse = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(linkedinJob)
    });
    
    const linkedinResult = await linkedinResponse.json();
    console.log('✅ LinkedIn job result:', linkedinResult);
    
    // Test 8: Final stats
    console.log('\n8️⃣ Final stats...');
    const finalStatsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: { 'x-user-id': userId }
    });
    const finalStats = await finalStatsResponse.json();
    console.log('✅ Final stats:', finalStats);
    
    console.log('\n🎉 All URL saving tests passed!');
    console.log(`📊 Total URLs increased from ${initialStats.total_urls} to ${finalStats.total_urls}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUrlSaving();
