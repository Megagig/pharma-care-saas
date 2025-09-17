#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const FeatureFlag_1 = __importDefault(require("../models/FeatureFlag"));
const logger_1 = __importDefault(require("../utils/logger"));
(0, dotenv_1.config)();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
class DiagnosticEndToEndTest {
    constructor() {
        this.results = [];
        this.authToken = '';
        this.testPatientId = '';
    }
    async runAllTests() {
        try {
            logger_1.default.info('🚀 Starting End-to-End Diagnostic Tests');
            await this.connectToDatabase();
            await this.setupTestData();
            await this.testFeatureFlags();
            await this.testAIConnection();
            await this.testDiagnosticSubmission();
            await this.testDrugInteractions();
            await this.testCaseRetrieval();
            this.printResults();
        }
        catch (error) {
            logger_1.default.error('Test suite failed:', error);
            process.exit(1);
        }
        finally {
            await mongoose_1.default.connection.close();
        }
    }
    async connectToDatabase() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            if (!mongoUri) {
                throw new Error('MONGODB_URI not found in environment variables');
            }
            await mongoose_1.default.connect(mongoUri);
            logger_1.default.info('✅ Connected to database');
        }
        catch (error) {
            logger_1.default.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    async setupTestData() {
        try {
            const superAdmin = await User_1.default.findOne({ role: 'super_admin' });
            if (!superAdmin) {
                throw new Error('Super admin user not found');
            }
            this.authToken = jsonwebtoken_1.default.sign({ userId: superAdmin._id }, JWT_SECRET, { expiresIn: '1h' });
            let testPatient = await Patient_1.default.findOne({
                firstName: 'Test',
                lastName: 'Patient'
            });
            if (!testPatient) {
                testPatient = new Patient_1.default({
                    firstName: 'Test',
                    lastName: 'Patient',
                    dateOfBirth: new Date('1980-01-01'),
                    gender: 'male',
                    mrn: 'TEST-' + Date.now(),
                    contactInfo: {
                        phone: '+1234567890',
                        email: 'test.patient@example.com'
                    },
                    createdBy: superAdmin._id,
                    workplaceId: superAdmin.workplaceId
                });
                await testPatient.save();
            }
            this.testPatientId = testPatient._id.toString();
            logger_1.default.info('✅ Test data setup completed');
            this.addResult('Setup', 'PASS', 'Test data initialized successfully');
        }
        catch (error) {
            logger_1.default.error('❌ Test data setup failed:', error);
            this.addResult('Setup', 'FAIL', `Setup failed: ${error}`);
            throw error;
        }
    }
    async testFeatureFlags() {
        try {
            const requiredFlags = ['ai_diagnostics', 'clinical_decision_support', 'drug_information'];
            for (const flagName of requiredFlags) {
                const flag = await FeatureFlag_1.default.findOne({ name: flagName });
                if (!flag || !flag.isActive) {
                    throw new Error(`Feature flag ${flagName} not found or inactive`);
                }
            }
            this.addResult('Feature Flags', 'PASS', 'All required feature flags are active');
            logger_1.default.info('✅ Feature flags test passed');
        }
        catch (error) {
            this.addResult('Feature Flags', 'FAIL', `Feature flags test failed: ${error}`);
            logger_1.default.error('❌ Feature flags test failed:', error);
        }
    }
    async testAIConnection() {
        try {
            const response = await axios_1.default.get(`${API_BASE_URL}/api/diagnostics/ai/test`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data.connected) {
                this.addResult('AI Connection', 'PASS', 'AI service connection successful');
                logger_1.default.info('✅ AI connection test passed');
            }
            else {
                throw new Error('AI service not connected');
            }
        }
        catch (error) {
            this.addResult('AI Connection', 'FAIL', `AI connection failed: ${error.message}`);
            logger_1.default.error('❌ AI connection test failed:', error);
        }
    }
    async testDiagnosticSubmission() {
        try {
            const diagnosticPayload = {
                patientId: this.testPatientId,
                symptoms: {
                    subjective: ['Headache', 'Nausea', 'Fatigue'],
                    objective: ['Elevated blood pressure', 'Mild dehydration'],
                    duration: '3 days',
                    severity: 'moderate',
                    onset: 'acute'
                },
                labResults: [],
                currentMedications: [],
                vitalSigns: {
                    bloodPressure: '150/90',
                    heartRate: 85,
                    temperature: 37.2,
                    respiratoryRate: 18
                },
                patientConsent: {
                    provided: true,
                    method: 'electronic'
                }
            };
            const response = await axios_1.default.post(`${API_BASE_URL}/api/diagnostics/ai`, diagnosticPayload, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data.caseId) {
                this.addResult('Diagnostic Submission', 'PASS', 'Diagnostic case submitted successfully', {
                    caseId: response.data.data.caseId,
                    analysisGenerated: !!response.data.data.analysis
                });
                logger_1.default.info('✅ Diagnostic submission test passed');
            }
            else {
                throw new Error('Diagnostic submission failed');
            }
        }
        catch (error) {
            this.addResult('Diagnostic Submission', 'FAIL', `Diagnostic submission failed: ${error.message}`);
            logger_1.default.error('❌ Diagnostic submission test failed:', error);
        }
    }
    async testDrugInteractions() {
        try {
            const interactionPayload = {
                medications: [
                    { name: 'Warfarin', dosage: '5mg', frequency: 'daily' },
                    { name: 'Aspirin', dosage: '81mg', frequency: 'daily' },
                    { name: 'Ibuprofen', dosage: '400mg', frequency: 'as needed' }
                ]
            };
            const response = await axios_1.default.post(`${API_BASE_URL}/api/diagnostics/interactions`, interactionPayload, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                this.addResult('Drug Interactions', 'PASS', 'Drug interaction check completed', {
                    medicationsChecked: response.data.data.medicationsChecked,
                    interactionsFound: response.data.data.interactionsFound
                });
                logger_1.default.info('✅ Drug interactions test passed');
            }
            else {
                throw new Error('Drug interaction check failed');
            }
        }
        catch (error) {
            this.addResult('Drug Interactions', 'FAIL', `Drug interactions test failed: ${error.message}`);
            logger_1.default.error('❌ Drug interactions test failed:', error);
        }
    }
    async testCaseRetrieval() {
        try {
            const response = await axios_1.default.get(`${API_BASE_URL}/api/diagnostics/patients/${this.testPatientId}/history`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success) {
                this.addResult('Case Retrieval', 'PASS', 'Patient diagnostic history retrieved', {
                    casesFound: response.data.data.cases?.length || 0
                });
                logger_1.default.info('✅ Case retrieval test passed');
            }
            else {
                throw new Error('Case retrieval failed');
            }
        }
        catch (error) {
            this.addResult('Case Retrieval', 'FAIL', `Case retrieval failed: ${error.message}`);
            logger_1.default.error('❌ Case retrieval test failed:', error);
        }
    }
    addResult(test, status, message, data) {
        this.results.push({ test, status, message, data });
    }
    printResults() {
        console.log('\n' + '='.repeat(80));
        console.log('🧪 DIAGNOSTIC FEATURE END-TO-END TEST RESULTS');
        console.log('='.repeat(80));
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.message}`);
            if (result.data) {
                console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
            }
        });
        console.log('\n' + '-'.repeat(80));
        console.log(`📊 SUMMARY: ${passed} passed, ${failed} failed`);
        if (failed === 0) {
            console.log('🎉 ALL TESTS PASSED! The AI Diagnostics feature is fully functional.');
        }
        else {
            console.log('⚠️  Some tests failed. Please review the issues above.');
        }
        console.log('='.repeat(80) + '\n');
    }
}
if (require.main === module) {
    const testSuite = new DiagnosticEndToEndTest();
    testSuite.runAllTests().catch(error => {
        logger_1.default.error('Test suite execution failed:', error);
        process.exit(1);
    });
}
exports.default = DiagnosticEndToEndTest;
//# sourceMappingURL=testDiagnosticEndToEnd.js.map