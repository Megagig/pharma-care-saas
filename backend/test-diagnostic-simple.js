// Test the diagnostic endpoint with proper environment loading
require('dotenv').config();

const axios = require('axios');

async function testDiagnostic() {
    try {
        console.log('🧪 Testing AI Diagnostic Endpoint');
        console.log('================================');
        
        // Check if environment variables are loaded
        console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
        console.log('API Key length:', process.env.OPENROUTER_API_KEY?.length || 0);
        
        // Test the actual diagnostic endpoint
        const testPayload = {
            patientId: "68ee8f3f78edb485fc1bbcd3",
            symptoms: {
                subjective: ["fever", "headache", "body weakness"],
                objective: ["BP is normal 125/88"],
                duration: "3 days",
                severity: "mild",
                onset: "acute"
            },
            vitalSigns: {
                bloodPressure: "125/88",
                heartRate: 76,
                temperature: 38,
                respiratoryRate: 16,
                bloodGlucose: 90
            },
            currentMedications: [],
            labResults: [],
            patientConsent: {
                provided: true,
                method: "electronic"
            }
        };

        console.log('\n🔍 Making request to diagnostic endpoint...');
        
        // You'll need to replace this with a valid JWT token
        const token = 'YOUR_JWT_TOKEN_HERE';
        
        const response = await axios.post('http://localhost:5000/api/diagnostics/ai', testPayload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        console.log('✅ Diagnostic request successful!');
        console.log('Response:', response.data);

    } catch (error) {
        console.log('❌ Diagnostic request failed');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

console.log('To test the diagnostic endpoint:');
console.log('1. Make sure the backend server is running');
console.log('2. Get a valid JWT token from your login');
console.log('3. Replace YOUR_JWT_TOKEN_HERE in this script');
console.log('4. Run: node test-diagnostic-simple.js');
console.log('');

// Uncomment to run the test
// testDiagnostic();