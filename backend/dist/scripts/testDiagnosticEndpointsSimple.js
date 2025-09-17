"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
const db_1 = __importDefault(require("../config/db"));
const logger_1 = __importDefault(require("../utils/logger"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
async function testDiagnosticEndpointsSimple() {
    try {
        await (0, db_1.default)();
        logger_1.default.info('Connected to database');
        const superAdmin = await User_1.default.findOne({ role: 'super_admin' });
        if (!superAdmin) {
            logger_1.default.error('No super admin user found');
            return;
        }
        logger_1.default.info(`Found super admin: ${superAdmin.firstName} ${superAdmin.lastName}`);
        const token = jsonwebtoken_1.default.sign({ userId: superAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        logger_1.default.info('Generated JWT token for testing');
        const patient = await Patient_1.default.findOne({
            workplaceId: superAdmin.workplaceId
        });
        if (!patient) {
            logger_1.default.warn('No patient found in super admin workplace');
            logger_1.default.info('Creating a test patient...');
            const testPatient = new Patient_1.default({
                firstName: 'Test',
                lastName: 'Patient',
                email: 'test.patient@example.com',
                phone: '+1234567890',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male',
                workplaceId: superAdmin.workplaceId,
                createdBy: superAdmin._id
            });
            await testPatient.save();
            logger_1.default.info(`Created test patient: ${testPatient._id}`);
            const diagnosticPayload = {
                patientId: testPatient._id.toString(),
                symptoms: {
                    subjective: ['Headache', 'Nausea'],
                    objective: ['Elevated blood pressure'],
                    duration: '2 days',
                    severity: 'moderate',
                    onset: 'acute'
                },
                labResults: [],
                currentMedications: [],
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
            logger_1.default.info('Test payload prepared:', {
                patientId: diagnosticPayload.patientId,
                symptomsCount: diagnosticPayload.symptoms.subjective.length + diagnosticPayload.symptoms.objective.length
            });
            logger_1.default.info('\n🧪 To test the diagnostic endpoint, use this curl command:');
            logger_1.default.info(`curl -X POST http://localhost:5000/api/diagnostics/ai \\`);
            logger_1.default.info(`  -H "Authorization: Bearer ${token}" \\`);
            logger_1.default.info(`  -H "Content-Type: application/json" \\`);
            logger_1.default.info(`  -d '${JSON.stringify(diagnosticPayload, null, 2)}'`);
            logger_1.default.info('\n📋 Or use this information in your frontend:');
            logger_1.default.info(`- Patient ID: ${testPatient._id}`);
            logger_1.default.info(`- JWT Token: ${token}`);
            logger_1.default.info(`- Endpoint: POST /api/diagnostics/ai`);
        }
        else {
            logger_1.default.info(`Found existing patient: ${patient.firstName} ${patient.lastName} (${patient._id})`);
            logger_1.default.info('\n🧪 To test the diagnostic endpoint with existing patient:');
            logger_1.default.info(`curl -X POST http://localhost:5000/api/diagnostics/ai \\`);
            logger_1.default.info(`  -H "Authorization: Bearer ${token}" \\`);
            logger_1.default.info(`  -H "Content-Type: application/json" \\`);
            logger_1.default.info(`  -d '{
        "patientId": "${patient._id}",
        "symptoms": {
          "subjective": ["Headache", "Nausea"],
          "objective": ["Elevated blood pressure"],
          "duration": "2 days",
          "severity": "moderate",
          "onset": "acute"
        },
        "labResults": [],
        "currentMedications": [],
        "vitalSigns": {
          "bloodPressure": "150/90",
          "heartRate": 80,
          "temperature": 98.6,
          "respiratoryRate": 16
        },
        "patientConsent": {
          "provided": true,
          "method": "electronic"
        }
      }'`);
        }
        logger_1.default.info('\n✅ Test setup completed successfully!');
        logger_1.default.info('\nNow you can:');
        logger_1.default.info('1. Use the curl command above to test the backend directly');
        logger_1.default.info('2. Use the JWT token in your frontend application');
        logger_1.default.info('3. Test the diagnostic case submission in the UI');
    }
    catch (error) {
        logger_1.default.error('❌ Failed to setup diagnostic test:', error);
    }
    finally {
        await mongoose_1.default.connection.close();
        logger_1.default.info('Database connection closed');
    }
}
if (require.main === module) {
    testDiagnosticEndpointsSimple()
        .then(() => {
        logger_1.default.info('Test setup script completed');
        process.exit(0);
    })
        .catch((error) => {
        logger_1.default.error('Test setup script failed:', error);
        process.exit(1);
    });
}
exports.default = testDiagnosticEndpointsSimple;
//# sourceMappingURL=testDiagnosticEndpointsSimple.js.map