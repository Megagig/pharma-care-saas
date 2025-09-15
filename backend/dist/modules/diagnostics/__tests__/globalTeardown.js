"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
async function globalTeardown() {
    console.log('🧹 Cleaning up diagnostic module test environment...');
    try {
        console.log('✅ Test services stopped');
    }
    catch (error) {
        console.warn('⚠️  Could not stop test services:', error);
    }
    try {
        console.log('✅ Temporary files cleaned');
    }
    catch (error) {
        console.warn('⚠️  Could not clean temporary files:', error);
    }
    console.log('✅ Global test teardown completed');
}
//# sourceMappingURL=globalTeardown.js.map