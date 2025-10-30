const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test token - you'll need to replace this with a valid token
const TEST_TOKEN = 'your-test-token-here';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testAnalyticsEndpoints() {
  console.log('🔍 Testing Analytics Endpoints...\n');

  const endpoints = [
    {
      name: 'Appointment Analytics',
      url: '/appointments/analytics',
      params: {
        startDate: '2024-10-01',
        endDate: '2024-10-30'
      }
    },
    {
      name: 'Follow-up Analytics',
      url: '/follow-ups/analytics',
      params: {
        startDate: '2024-10-01',
        endDate: '2024-10-30'
      }
    },
    {
      name: 'Reminder Analytics',
      url: '/reminders/analytics',
      params: {
        startDate: '2024-10-01',
        endDate: '2024-10-30'
      }
    },
    {
      name: 'Capacity Analytics',
      url: '/schedules/capacity',
      params: {
        startDate: '2024-10-01',
        endDate: '2024-10-30'
      }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📊 Testing ${endpoint.name}...`);
      
      const queryString = new URLSearchParams(endpoint.params).toString();
      const fullUrl = `${endpoint.url}?${queryString}`;
      
      console.log(`   URL: ${fullUrl}`);
      
      const response = await apiClient.get(fullUrl);
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📦 Data structure:`, Object.keys(response.data));
      
      if (response.data.data) {
        console.log(`   📈 Analytics keys:`, Object.keys(response.data.data));
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || 'Network Error'}`);
      console.log(`   📝 Message: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 403) {
        console.log(`   🔐 Permission issue - check user role and permissions`);
      }
      
      if (error.response?.status === 404) {
        console.log(`   🚫 Endpoint not found - check route registration`);
      }
    }
    
    console.log('');
  }
}

async function testPermissions() {
  console.log('🔐 Testing Permission Matrix...\n');
  
  try {
    const response = await apiClient.get('/auth/me');
    console.log('👤 Current user:', response.data.data?.firstName, response.data.data?.lastName);
    console.log('🏢 Role:', response.data.data?.role);
    console.log('🏪 Workplace:', response.data.data?.workplaceId);
    
    // Test specific permissions
    const permissionsToTest = [
      'view_appointment_analytics',
      'view_analytics',
      'view_capacity_analytics',
      'view_reminder_analytics'
    ];
    
    console.log('\n🔍 Required permissions for analytics:');
    permissionsToTest.forEach(permission => {
      console.log(`   - ${permission}`);
    });
    
  } catch (error) {
    console.log('❌ Failed to get user info:', error.response?.data?.message || error.message);
  }
}

async function testBasicEndpoints() {
  console.log('🧪 Testing Basic Endpoints...\n');
  
  const basicEndpoints = [
    '/appointments',
    '/schedules',
    '/follow-ups'
  ];
  
  for (const endpoint of basicEndpoints) {
    try {
      console.log(`📡 Testing ${endpoint}...`);
      const response = await apiClient.get(`${endpoint}?limit=1`);
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Data count: ${response.data.data?.length || 'N/A'}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.status || 'Network Error'}`);
      console.log(`   📝 Message: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
  }
}

// Main execution
async function main() {
  console.log('🚀 Analytics Debug Script\n');
  console.log('=' .repeat(50));
  
  // First test basic connectivity and permissions
  await testPermissions();
  console.log('=' .repeat(50));
  
  // Test basic endpoints to ensure data exists
  await testBasicEndpoints();
  console.log('=' .repeat(50));
  
  // Test analytics endpoints
  await testAnalyticsEndpoints();
  console.log('=' .repeat(50));
  
  console.log('✨ Debug complete!');
  console.log('\n💡 Tips:');
  console.log('   - Make sure you have a valid token');
  console.log('   - Check that your user has analytics permissions');
  console.log('   - Verify that sample data exists in the database');
  console.log('   - Check server logs for detailed error messages');
}

// Handle token from command line
if (process.argv[2]) {
  apiClient.defaults.headers['Authorization'] = `Bearer ${process.argv[2]}`;
  console.log('🔑 Using token from command line argument');
}

main().catch(console.error);