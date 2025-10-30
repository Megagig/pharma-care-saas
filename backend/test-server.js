const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testServerHealth() {
  console.log('🏥 Testing Server Health...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running');
    console.log('📊 Health status:', response.data);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🚫 Server is not running on port 5000');
      console.log('💡 Make sure to start the server with: npm run dev');
      return false;
    }
  }
  
  return true;
}

async function testEndpointExistence() {
  console.log('\n🔍 Testing Endpoint Existence...\n');
  
  const endpoints = [
    '/api/appointments',
    '/api/appointments/calendar',
    '/api/appointments/analytics',
    '/api/follow-ups/analytics',
    '/api/reminders/analytics',
    '/api/schedules/capacity'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          console.log(`🔐 ${endpoint} - Exists but requires authentication`);
        } else if (status === 403) {
          console.log(`🚫 ${endpoint} - Exists but access forbidden`);
        } else if (status === 404) {
          console.log(`❌ ${endpoint} - Not found`);
        } else {
          console.log(`⚠️  ${endpoint} - Status: ${status}`);
        }
      } else {
        console.log(`❌ ${endpoint} - Network error: ${error.message}`);
      }
    }
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing Database Connection...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health/db`);
    console.log('✅ Database connection is healthy');
    console.log('📊 DB status:', response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Database health endpoint not found');
    } else {
      console.log('❌ Database connection test failed:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Server Connectivity Test\n');
  console.log('=' .repeat(50));
  
  const serverRunning = await testServerHealth();
  
  if (serverRunning) {
    await testEndpointExistence();
    await testDatabaseConnection();
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ Test complete!');
  
  if (!serverRunning) {
    console.log('\n💡 Next steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Check if MongoDB is running');
    console.log('   3. Verify environment variables are set');
  }
}

main().catch(console.error);