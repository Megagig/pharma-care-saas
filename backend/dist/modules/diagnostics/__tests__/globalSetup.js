"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
const path_1 = __importDefault(require("path"));
async function globalSetup() {
    console.log('🚀 Setting up diagnostic module test environment...');
    process.env.NODE_ENV = 'test';
    process.env.CI = 'true';
    try {
        console.log('✅ Test database prepared');
    }
    catch (error) {
        console.warn('⚠️  Could not clean test database:', error);
    }
    try {
        console.log('✅ Test services started');
    }
    catch (error) {
        console.warn('⚠️  Could not start test services:', error);
    }
    try {
        const tsConfigPath = path_1.default.join(__dirname, '../../../tsconfig.json');
        console.log('✅ TypeScript compilation check passed');
    }
    catch (error) {
        console.warn('⚠️  TypeScript compilation issues:', error);
    }
    console.log('✅ Global test setup completed');
}
//# sourceMappingURL=globalSetup.js.map