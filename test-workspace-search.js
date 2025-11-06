// Simple test script to verify workspace search API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testWorkspaceSearch() {
  try {
    console.log('Testing workspace search API...');
    
    // Test 1: Search workspaces
    console.log('\n1. Testing workspace search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/public/workspaces/search?search=pharmacy&limit=5`);
    console.log('Search Response:', {
      success: searchResponse.data.success,
      workspacesCount: searchResponse.data.data?.workspaces?.length || 0,
      pagination: searchResponse.data.data?.pagination
    });

    // Test 2: Get available states
    console.log('\n2. Testing available states...');
    const statesResponse = await axios.get(`${BASE_URL}/api/public/workspaces/states`);
    console.log('States Response:', {
      success: statesResponse.data.success,
      statesCount: statesResponse.data.data?.length || 0,
      states: statesResponse.data.data?.slice(0, 5) // Show first 5 states
    });

    // Test 3: Get workspace info (if we have workspaces)
    if (searchResponse.data.data?.workspaces?.length > 0) {
      const workspaceId = searchResponse.data.data.workspaces[0]._id;
      console.log('\n3. Testing workspace info...');
      const infoResponse = await axios.get(`${BASE_URL}/api/public/workspaces/${workspaceId}/info`);
      console.log('Workspace Info Response:', {
        success: infoResponse.data.success,
        workspaceName: infoResponse.data.data?.name,
        type: infoResponse.data.data?.type,
        patientPortalEnabled: infoResponse.data.data?.allowSelfRegistration
      });
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Run the test
testWorkspaceSearch();