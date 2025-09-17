"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
async function testDiagnosticEndpointDirect() {
    try {
        console.log('🧪 Testing diagnostic endpoint directly...');
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGI1Y2I4MWYxZjBmOTc1OGI4YWZhZGQiLCJpYXQiOjE3NTc5MDgzNDAsImV4cCI6MTc1NzkxMTk0MH0.wi85jvG_UZR4811wq-ZU4E2NDJ6lcMB_fgisH4aECM0';
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        console.log('Testing health endpoint...');
        const healthResponse = await axios_1.default.get('http://localhost:5000/api/health');
        console.log('✅ Health check:', healthResponse.data);
        console.log('Testing diagnostic endpoint...');
        const diagnosticPayload = {
            patientId: '68c19c01291fc305b976d6ff',
            inputSnapshot: {
                symptoms: {
                    subjective: ['Headache', 'Nausea'],
                    objective: ['Elevated blood pressure'],
                    duration: '2 days',
                    severity: 'moderate',
                    onset: 'acute'
                },
                vitals: {
                    bloodPressure: '150/90',
                    heartRate: 80,
                    temperature: 98.6,
                    respiratoryRate: 16
                },
                currentMedications: [],
                allergies: [],
                medicalHistory: [],
                labResults: []
            },
            priority: 'routine',
            consentObtained: true
        };
        try {
            const response = await axios_1.default.post('http://localhost:5000/api/diagnostics', diagnosticPayload, config);
            console.log('✅ Diagnostic endpoint success:', response.data);
        }
        catch (error) {
            console.log('❌ Diagnostic endpoint error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            if (error.response?.status === 401) {
                console.log('\n🔍 Debugging authentication issue...');
                try {
                    const userResponse = await axios_1.default.get('http://localhost:5000/api/patients', config);
                    console.log('✅ Basic auth works - patients endpoint accessible');
                }
                catch (authError) {
                    console.log('❌ Basic auth also fails:', authError.response?.data);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}
testDiagnosticEndpointDirect()
    .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=testDiagnosticEndpointDirect.js.map