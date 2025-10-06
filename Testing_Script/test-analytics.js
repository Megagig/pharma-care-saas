// Simple test script to check analytics endpoint
const axios = require('axios');

async function testAnalytics() {
  try {
    console.log('Testing diagnostic analytics endpoint...');
    
    // You'll need to replace this with actual auth token and base URL
    const baseURL = 'http://localhost:5000/api';
    const token = 'your-auth-token-here';
    
    const response = await axios.get(`${baseURL}/diagnostics/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        dateFrom: '2024-09-01',
        dateTo: '2025-10-01'
      }
    });
    
    console.log('Analytics Response:', JSON.stringify(response.data, null, 2));
    
    // Test debug endpoint
    const debugResponse = await axios.get(`${baseURL}/diagnostics/debug/counts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Debug Response:', JSON.stringify(debugResponse.data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Uncomment to run the test
// testAnalytics();

console.log('Test script created. Update the token and baseURL, then uncomment the testAnalytics() call to run.');