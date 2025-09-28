#!/usr/bin/env node

const axios = require('axios');

const testPatientsAPI = async () => {
    try {
        console.log('Testing patients API endpoint...');

        // First, login to get session cookie
        console.log('1. Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'megagigdev@gmail.com',
            password: 'password123' // You'll need to replace with actual password
        }, {
            withCredentials: true,
            validateStatus: () => true
        });

        console.log('Login status:', loginResponse.status);
        console.log('Login response:', loginResponse.data);

        if (loginResponse.status !== 200) {
            console.log('❌ Login failed, cannot test patients API');
            return;
        }

        // Extract cookies from login response
        const cookies = loginResponse.headers['set-cookie'];
        console.log('Cookies received:', cookies);

        // Now test patients endpoint
        console.log('\n2. Testing patients endpoint...');
        const patientsResponse = await axios.get('http://localhost:5000/api/patients?page=1&limit=10&useCursor=false', {
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            validateStatus: () => true
        });

        console.log('Patients API status:', patientsResponse.status);
        console.log('Patients API response:', JSON.stringify(patientsResponse.data, null, 2));

        if (patientsResponse.status === 200) {
            console.log('✅ Patients API working correctly');
            console.log('Number of patients returned:', patientsResponse.data.data?.length || 0);
        } else {
            console.log('❌ Patients API failed');
        }

    } catch (error) {
        console.log('❌ Error testing patients API:', error.message);
        if (error.response) {
            console.log('Error response:', error.response.data);
        }
    }
};

testPatientsAPI();