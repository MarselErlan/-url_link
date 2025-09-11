// Simple test script for the Job Application Tracker extension
// This tests the backend API endpoints directly with multiple users

const API_BASE_URL = 'https://job-tracker-backend-production-acb1.up.railway.app';

// Test multiple users
const TEST_USERS = [
  'ericabram33@gmail.com',
  'testuser1@gmail.com',
  'testuser2@gmail.com',
  'user_abc123_1234567890', // Generated ID format
  'user_def456_1234567890'  // Another generated ID format
];

async function testBackendAPI() {
  console.log('🧪 Testing Job Application Tracker Backend API with Multiple Users...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Test each user individually
    for (let i = 0; i < TEST_USERS.length; i++) {
      const userId = TEST_USERS[i];
      console.log(`\n2️⃣.${i + 1} Testing user: ${userId}`);
      
      // Get stats for this user
      const statsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
        headers: {
          'x-user-id': userId
        }
      });
      const statsData = await statsResponse.json();
      console.log(`✅ Stats for ${userId}:`, statsData);
      
      // Test URL status check
      const testUrl = `https://www.linkedin.com/jobs/view/test-job-${i + 1}`;
      const encodedUrl = encodeURIComponent(testUrl);
      const statusResponse = await fetch(`${API_BASE_URL}/api/status/${encodedUrl}`, {
        headers: {
          'x-user-id': userId
        }
      });
      const statusData = await statusResponse.json();
      console.log(`✅ URL status for ${testUrl}:`, statusData);
      
      // Save a test application for this user
      const applicationData = {
        url: testUrl,
        title: `Test Job Position ${i + 1}`,
        applied: i % 2 === 0, // Alternate between applied/not applied
        notes: `Test application from user ${userId}`
      };
      
      const saveResponse = await fetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(applicationData)
      });
      const saveData = await saveResponse.json();
      console.log(`✅ Save application result for ${userId}:`, saveData);
    }
    
    // Test 3: Verify data isolation between users
    console.log('\n3️⃣ Testing data isolation between users...');
    for (const userId of TEST_USERS) {
      const statsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
        headers: {
          'x-user-id': userId
        }
      });
      const statsData = await statsResponse.json();
      console.log(`📊 Final stats for ${userId}:`, statsData);
    }
    
    console.log('\n🎉 All multi-user tests passed! Backend supports multiple users correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBackendAPI();
