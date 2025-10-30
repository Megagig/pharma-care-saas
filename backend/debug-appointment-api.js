const axios = require('axios');

async function testAppointmentAPI() {
  try {
    console.log('=== TESTING APPOINTMENT API ===');
    
    // Test basic appointments endpoint
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OGI1Y2Q4NWYxZjBmOTc1OGI4YWZiYmQiLCJlbWFpbCI6Im1lZ2FnaWdzb2x1dGlvbkBnbWFpbC5jb20iLCJyb2xlIjoicGhhcm1hY3lfb3V0bGV0Iiwid29ya3BsYWNlSWQiOiI2OGI1Y2Q4NWYxZjBmOTc1OGI4YWZiYmYiLCJpYXQiOjE3MzAyNzk5NzIsImV4cCI6MTczMDM2NjM3Mn0.Qs8Ej_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Testing basic appointments endpoint...');
    try {
      const response = await axios.get('http://localhost:5000/api/appointments?limit=100', { headers });
      console.log('✅ Basic appointments API works');
      console.log('Response status:', response.status);
      console.log('Data structure:', {
        success: response.data.success,
        dataType: typeof response.data.data,
        resultsCount: response.data.data?.results?.length || 0,
        metaTotal: response.data.meta?.total || 0
      });
      
      if (response.data.data?.results?.length > 0) {
        console.log('Sample appointment:', {
          id: response.data.data.results[0]._id,
          type: response.data.data.results[0].type,
          status: response.data.data.results[0].status,
          scheduledDate: response.data.data.results[0].scheduledDate,
          scheduledTime: response.data.data.results[0].scheduledTime
        });
      }
    } catch (error) {
      console.log('❌ Basic appointments API failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    console.log('\nTesting calendar appointments endpoint...');
    try {
      const calendarResponse = await axios.get('http://localhost:5000/api/appointments/calendar?view=month&date=2025-10-30', { headers });
      console.log('✅ Calendar appointments API works');
      console.log('Calendar response status:', calendarResponse.status);
      console.log('Calendar data:', {
        success: calendarResponse.data.success,
        appointmentsCount: calendarResponse.data.data?.appointments?.length || 0
      });
    } catch (error) {
      console.log('❌ Calendar appointments API failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    console.log('\nTesting analytics endpoint...');
    try {
      const analyticsResponse = await axios.get('http://localhost:5000/api/appointments/analytics', { headers });
      console.log('✅ Analytics API works');
      console.log('Analytics response status:', analyticsResponse.status);
      console.log('Analytics data structure:', Object.keys(analyticsResponse.data.data || {}));
    } catch (error) {
      console.log('❌ Analytics API failed:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.status === 403) {
        console.log('This is likely a permissions issue - user may not have view_appointment_analytics permission');
      }
    }
    
    console.log('\nTesting capacity analytics endpoint...');
    try {
      const capacityResponse = await axios.get('http://localhost:5000/api/capacity/analytics', { headers });
      console.log('✅ Capacity analytics API works');
      console.log('Capacity response status:', capacityResponse.status);
    } catch (error) {
      console.log('❌ Capacity analytics API failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    console.log('\nTesting reminder analytics endpoint...');
    try {
      const reminderResponse = await axios.get('http://localhost:5000/api/reminders/analytics', { headers });
      console.log('✅ Reminder analytics API works');
      console.log('Reminder response status:', reminderResponse.status);
    } catch (error) {
      console.log('❌ Reminder analytics API failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAppointmentAPI();