"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoServer;
beforeAll(async () => {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose_1.default.connect(mongoUri);
});
afterEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        if (collection) {
            await collection.deleteMany({});
        }
    }
});
afterAll(async () => {
    await mongoose_1.default.connection.dropDatabase();
    await mongoose_1.default.connection.close();
    await mongoServer.stop();
});
global.testUtils = {
    createObjectId: () => new mongoose_1.default.Types.ObjectId(),
    createMockUser: () => ({
        _id: new mongoose_1.default.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'pharmacist'
    }),
    createMockWorkplace: () => ({
        _id: new mongoose_1.default.Types.ObjectId(),
        name: 'Test Pharmacy',
        type: 'pharmacy'
    }),
    createMockPatient: () => ({
        _id: new mongoose_1.default.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        mrn: 'MRN123456',
        dob: new Date('1980-01-01'),
        phone: '+2348012345678'
    })
};
expect.extend({
    toBeValidObjectId(received) {
        const pass = mongoose_1.default.Types.ObjectId.isValid(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid ObjectId`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be a valid ObjectId`,
                pass: false,
            };
        }
    },
});
//# sourceMappingURL=setup.js.map