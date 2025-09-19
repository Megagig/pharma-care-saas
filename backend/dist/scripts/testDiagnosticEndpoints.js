"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || '';
const axiosConfig = {
    headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
    }
};
async function testDiagnosticEndpoints() {
    try {
        logger_1.default.info('🧪 Testing diagnostic endpoints...');
        if (!TEST_TOKEN) {
            logger_1.default.warn('⚠️  No TEST_JWT_TOKEN provided. Please set TEST_JWT_TOKEN environment variable with a valid JWT token.');
            logger_1.default.info('You can get a token by logging into the application and copying it from the browser cookies or localStorage.');
            return;
        }
        try {
            logger_1.default.info('Testing AI connection test endpoint...');
            const response = await axios_1.default.get(`${API_URL}/diagnostics/ai/test`, axiosConfig);
            logger_1.default.info('✅ AI Connection Test:', response.data);
        }
        catch (error) {
            if (error.response?.status === 403) {
                logger_1.default.info('ℹ️  AI Connection Test requires super admin role (expected for non-super-admin users)');
            }
            else {
                logger_1.default.error('❌ AI Connection Test failed:', error.response?.data || error.message);
            }
        }
        try {
            logger_1.default.info('Testing drug interactions endpoint...');
            const testMedications = [
                { name: 'Aspirin', dosage: '100mg' },
                { name: 'Warfarin', dosage: '5mg' }
            ];
            const response = await axios_1.default.post(`${API_URL}/diagnostics/interactions`, {
                medications: testMedications
            }, axiosConfig);
            logger_1.default.info('✅ Drug Interactions Check:', response.data);
        }
        catch (error) {
            logger_1.default.error('❌ Drug Interactions Check failed:', error.response?.data || error.message);
        }
        try {
            logger_1.default.info('Testing AI diagnostic analysis endpoint...');
            const diagnosticRequest = {
                patientId: '507f1f77bcf86cd799439011',
                symptoms: {
                    subjective: ['Headache', 'Nausea'],
                    objective: ['Elevated blood pressure: 150/90 mmHg']
                },
                labResults: [],
                currentMedications: [
                    { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily' }
                ],
                vitalSigns: {
                    bloodPressure: '150/90',
                    heartRate: 80,
                    temperature: 98.6,
                    respiratoryRate: 16
                },
                patientConsent: {
                    provided: true,
                    method: 'electronic'
                }
            };
            const response = await axios_1.default.post(`${API_URL}/diagnostics/ai`, diagnosticRequest, axiosConfig);
            logger_1.default.info('✅ AI Diagnostic Analysis:', response.data);
        }
        catch (error) {
            if (error.response?.status === 404 && error.response?.data?.message?.includes('Patient not found')) {
                logger_1.default.info('ℹ️  AI Diagnostic Analysis requires a valid patient ID (expected with sample patient ID)');
            }
            else {
                logger_1.default.error('❌ AI Diagnostic Analysis failed:', error.response?.data || error.message);
            }
        }
        logger_1.default.info('\n🎉 Diagnostic endpoints test completed!');
        logger_1.default.info('\nIf you see authentication errors, make sure to:');
        logger_1.default.info('1. Set TEST_JWT_TOKEN environment variable with a valid token');
        logger_1.default.info('2. Ensure your user has the required permissions');
        logger_1.default.info('3. Verify the backend server is running');
    }
    catch (error) {
        logger_1.default.error('❌ Failed to test diagnostic endpoints:', error);
    }
}
if (require.main === module) {
    testDiagnosticEndpoints()
        .then(() => {
        logger_1.default.info('Test script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Test script failed:', error);
        process.exit(1);
    });
}
exports.default = testDiagnosticEndpoints;
//# sourceMappingURL=testDiagnosticEndpoints.js.map