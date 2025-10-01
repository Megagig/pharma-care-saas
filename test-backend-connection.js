// Simple test to check backend connectivity
const axios = require('axios');

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Test basic connectivity
    console.log('📡 Testing basic connectivity to:', baseURL);
    const response = await axios.get(`${baseURL}/health`, {
      timeout: 5000,
      withCredentials: true
    });
    console.log('✅ Backend is accessible:', response.status, response.statusText);
    
    // Test reports endpoint
    console.log('📊 Testing reports endpoint...');
    const reportsResponse = await axios.get(`${baseURL}/reports/types`, {
      timeout: 5000,
      withCredentials: true
    });
    console.log('✅ Reports endpoint accessible:', reportsResponse.status);
    
  } catch (error) {
    console.error('❌ Backend connection failed:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received - backend may not be running');
      console.error('Request details:', error.request.path);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testBackendConnection();