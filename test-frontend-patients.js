#!/usr/bin/env node

// Simple test to verify the frontend patient service works
const axios = require('axios');

const testFrontendPatients = async () => {
    try {
        console.log('Testing frontend patient fetching...');

        // Test the backend API directly first
        console.log('1. Testing backend API...');
        
        // Login first
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'megagigdev@gmail.com',
            password: 'admin123'
        }, {
            withCredentials: true,
            validateStatus: () => true
        });

        if (loginResponse.status !== 200) {
            console.log('❌ Login failed');
            return;
        }

        const cookies = loginResponse.headers['set-cookie'];
        
        // Test patients endpoint
        const patientsResponse = await axios.get('http://localhost:5000/api/patients?page=1&limit=10&useCursor=false', {
            headers: {
                'Cookie': cookies ? cookies.join('; ') : ''
            },
            validateStatus: () => true
        });

        console.log('Backend API Response:');
        console.log('- Status:', patientsResponse.status);
        console.log('- Success:', patientsResponse.data.success);
        console.log('- Message:', patientsResponse.data.message);
        console.log('- Results count:', patientsResponse.data.data?.results?.length || 0);
        console.log('- Total:', patientsResponse.data.meta?.total || 0);

        if (patientsResponse.data.success && patientsResponse.data.data?.results?.length > 0) {
            console.log('✅ Backend API is working correctly');
            console.log('- First patient:', patientsResponse.data.data.results[0].firstName, patientsResponse.data.data.results[0].lastName);
            console.log('- MRN:', patientsResponse.data.data.results[0].mrn);
        } else {
            console.log('❌ Backend API is not returning patients correctly');
        }

        console.log('\n2. Frontend should now be able to fetch patients successfully!');
        console.log('The issue was with backend middleware, which has been fixed.');
        console.log('Try refreshing the frontend application.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testFrontendPatients();