// Test script to check authentication and clinical notes endpoint
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('Testing authentication...');

    // Test health endpoint first
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('Health check:', healthResponse.data);

    // Test auth endpoint without credentials
    try {
      const authTestResponse = await axios.get(`${API_BASE}/notes`, {
        withCredentials: true,
      });
      console.log('Auth test (should fail):', authTestResponse.data);
    } catch (error) {
      console.log(
        'Expected auth error:',
        error.response?.status,
        error.response?.data
      );
    }

    // Test with a sample patient ID
    const patientId = '68ae5aa'; // From the error logs
    try {
      const notesResponse = await axios.get(
        `${API_BASE}/notes/patient/${patientId}`,
        {
          withCredentials: true,
        }
      );
      console.log('Notes response:', notesResponse.data);
    } catch (error) {
      console.log('Notes error:', error.response?.status, error.response?.data);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();
