#!/usr/bin/env node

// Simple test to check if login works without crashing
const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Testing login endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    }, {
      timeout: 5000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log('Login response status:', response.status);
    console.log('Login response data:', response.data);
    
    if (response.status === 401) {
      console.log('✅ Login correctly returned 401 for invalid credentials');
    } else {
      console.log('⚠️ Unexpected status code:', response.status);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running on port 5000');
    } else {
      console.log('❌ Error testing login:', error.message);
    }
  }
};

// Wait a bit for server to start, then test
setTimeout(testLogin, 2000);