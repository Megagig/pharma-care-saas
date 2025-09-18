const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAssessmentEndpoint() {
  try {
    // First, let's test if we can get a patient
    console.log('Testing assessment endpoints...');

    // Test patient ID - you'll need to replace this with a real patient ID
    const patientId = 'PHM-GEN-00004'; // Austin Nkasi from the screenshot

    console.log(`\n1. Testing GET /patients/${patientId}/assessments`);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/patients/${patientId}/assessments`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ GET assessments successful:', {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.log('❌ GET assessments failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });
    }

    console.log(`\n2. Testing POST /patients/${patientId}/assessments`);

    const testAssessmentData = {
      vitals: {
        bpSys: 120,
        bpDia: 80,
        rr: 18,
        tempC: 36.5,
        heartSounds: 'Normal S1, S2',
        pallor: 'none',
        dehydration: 'none',
      },
      labs: {
        pcv: 35,
        fbs: 95,
        hba1c: 5.8,
      },
      recordedAt: new Date().toISOString(),
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/patients/${patientId}/assessments`,
        testAssessmentData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ POST assessment successful:', {
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.log('❌ POST assessment failed:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        url: error.config?.url,
      });
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAssessmentEndpoint();
