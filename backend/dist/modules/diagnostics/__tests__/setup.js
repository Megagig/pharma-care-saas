"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const globals_1 = require("@jest/globals");
globals_1.jest.setTimeout(30000);
let mongoServer;
beforeAll(async () => {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create({
        instance: {
            dbName: 'diagnostic-test-db',
        },
    });
    const mongoUri = mongoServer.getUri();
    await mongoose_1.default.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-diagnostics';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.RXNORM_API_KEY = 'test-rxnorm-key';
    process.env.OPENFDA_API_KEY = 'test-openfda-key';
    process.env.REDIS_URL = 'redis://localhost:6379/1';
});
afterEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
    globals_1.jest.clearAllMocks();
});
afterAll(async () => {
    await mongoose_1.default.connection.dropDatabase();
    await mongoose_1.default.connection.close();
    await mongoServer.stop();
});
global.testUtils = {
    createObjectId: () => new mongoose_1.default.Types.ObjectId(),
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    mockExternalAPI: (service, response) => {
        switch (service) {
            case 'openrouter':
                globals_1.jest.doMock('../services/openRouterService', () => ({
                    generateDiagnosticAnalysis: globals_1.jest.fn().mockResolvedValue(response),
                }));
                break;
            case 'rxnorm':
                globals_1.jest.doMock('../services/rxnormService', () => ({
                    searchDrug: globals_1.jest.fn().mockResolvedValue(response),
                    getDrugInteractions: globals_1.jest.fn().mockResolvedValue(response),
                }));
                break;
            case 'openfda':
                globals_1.jest.doMock('../services/openfdaService', () => ({
                    getAdverseEvents: globals_1.jest.fn().mockResolvedValue(response),
                    getDrugLabeling: globals_1.jest.fn().mockResolvedValue(response),
                }));
                break;
        }
    },
    createTestWorkplace: () => ({
        name: 'Test Pharmacy',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@pharmacy.com',
        licenseNumber: 'TEST123',
        subscriptionPlan: 'professional',
        isActive: true,
    }),
    createTestUser: (workplaceId) => ({
        email: 'test.pharmacist@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Pharmacist',
        role: 'pharmacist',
        workplaceId,
        isActive: true,
        isEmailVerified: true,
    }),
    createTestPatient: (workplaceId, createdBy) => ({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        gender: 'male',
        phone: '555-0123',
        email: 'john.doe@test.com',
        workplaceId,
        createdBy,
    }),
    createTestDiagnosticRequest: (patientId, pharmacistId, workplaceId) => ({
        patientId,
        pharmacistId,
        workplaceId,
        inputSnapshot: {
            symptoms: {
                subjective: ['headache', 'nausea'],
                objective: ['elevated blood pressure'],
                duration: '2 days',
                severity: 'moderate',
                onset: 'acute',
            },
            vitals: {
                bloodPressure: '150/90',
                heartRate: 85,
                temperature: 98.6,
            },
            currentMedications: [
                {
                    name: 'Lisinopril',
                    dosage: '10mg',
                    frequency: 'daily',
                },
            ],
            allergies: ['penicillin'],
        },
        clinicalContext: {
            chiefComplaint: 'Headache and high blood pressure',
            presentingSymptoms: ['headache', 'nausea'],
            relevantHistory: 'History of hypertension',
        },
        consentObtained: true,
        consentTimestamp: new Date(),
        status: 'pending',
        priority: 'medium',
        createdBy: pharmacistId,
        updatedBy: pharmacistId,
    }),
};
const originalConsole = console;
global.console = {
    ...originalConsole,
    log: globals_1.jest.fn(),
    debug: globals_1.jest.fn(),
    info: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: originalConsole.error,
};
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
//# sourceMappingURL=setup.js.map