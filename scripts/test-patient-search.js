// Test script to check what the backend patient search returns
const axios = require('axios');

async function testPatientSearch() {
  try {
    console.log('Testing patient search endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/patients/search?q=Yinka', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.data?.patients?.length > 0) {
      const firstPatient = response.data.data.patients[0];
      console.log('\nFirst patient object:');
      console.log('Keys:', Object.keys(firstPatient));
      console.log('_id:', firstPatient._id);
      console.log('id:', firstPatient.id);
      console.log('mrn:', firstPatient.mrn);
    }
    
  } catch (error) {
    console.error('Error testing patient search:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPatientSearch();