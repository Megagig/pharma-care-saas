"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCatalogService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const TestCatalog_1 = __importDefault(require("../models/TestCatalog"));
const manualLabCacheService_1 = __importDefault(require("./manualLabCacheService"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
class TestCatalogService {
    static async getActiveTests(workplaceId) {
        try {
            return await manualLabCacheService_1.default.cacheActiveTestCatalog(workplaceId);
        }
        catch (error) {
            logger_1.default.error('Failed to get active tests', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async getTestsByCategory(workplaceId, category) {
        try {
            return await manualLabCacheService_1.default.cacheTestsByCategory(workplaceId, category);
        }
        catch (error) {
            logger_1.default.error('Failed to get tests by category', {
                workplaceId: workplaceId.toString(),
                category,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async getTestsBySpecimen(workplaceId, specimenType) {
        try {
            return await manualLabCacheService_1.default.cacheTestsBySpecimen(workplaceId, specimenType);
        }
        catch (error) {
            logger_1.default.error('Failed to get tests by specimen type', {
                workplaceId: workplaceId.toString(),
                specimenType,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async getCategories(workplaceId) {
        try {
            return await manualLabCacheService_1.default.cacheTestCategories(workplaceId);
        }
        catch (error) {
            logger_1.default.error('Failed to get test categories', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async getSpecimenTypes(workplaceId) {
        try {
            return await manualLabCacheService_1.default.cacheSpecimenTypes(workplaceId);
        }
        catch (error) {
            logger_1.default.error('Failed to get specimen types', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async searchTests(workplaceId, query, options = {}) {
        try {
            return await manualLabCacheService_1.default.cacheTestSearch(workplaceId, query, options);
        }
        catch (error) {
            logger_1.default.error('Failed to search tests', {
                workplaceId: workplaceId.toString(),
                query,
                options,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async getTestByCode(workplaceId, code) {
        try {
            return await manualLabCacheService_1.default.cacheTestByCode(workplaceId, code);
        }
        catch (error) {
            logger_1.default.error('Failed to get test by code', {
                workplaceId: workplaceId.toString(),
                code,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async createTest(testData) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const existingTest = await TestCatalog_1.default.findByCode(testData.workplaceId, testData.code);
            if (existingTest) {
                throw (0, responseHelpers_1.createBusinessRuleError)(`Test with code ${testData.code} already exists`);
            }
            const test = new TestCatalog_1.default({
                ...testData,
                code: testData.code.toUpperCase(),
                isCustom: testData.isCustom !== false,
                createdBy: testData.createdBy
            });
            await test.save({ session });
            await session.commitTransaction();
            await manualLabCacheService_1.default.invalidateTestCatalogCache(testData.workplaceId);
            logger_1.default.info('Test catalog entry created', {
                testId: test._id,
                code: test.code,
                name: test.name,
                workplaceId: testData.workplaceId.toString(),
                service: 'test-catalog'
            });
            return test;
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Failed to create test catalog entry', {
                testData,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async updateTest(workplaceId, testId, updateData) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const test = await TestCatalog_1.default.findOne({
                _id: testId,
                workplaceId,
                isDeleted: { $ne: true }
            }).session(session);
            if (!test) {
                throw (0, responseHelpers_1.createNotFoundError)('Test not found');
            }
            Object.assign(test, updateData);
            test.updatedBy = updateData.updatedBy;
            await test.save({ session });
            await session.commitTransaction();
            await manualLabCacheService_1.default.invalidateTestCatalogCache(workplaceId);
            logger_1.default.info('Test catalog entry updated', {
                testId: test._id,
                code: test.code,
                workplaceId: workplaceId.toString(),
                service: 'test-catalog'
            });
            return test;
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Failed to update test catalog entry', {
                testId,
                workplaceId: workplaceId.toString(),
                updateData,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async deleteTest(workplaceId, testId, deletedBy) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const test = await TestCatalog_1.default.findOne({
                _id: testId,
                workplaceId,
                isDeleted: { $ne: true }
            }).session(session);
            if (!test) {
                throw (0, responseHelpers_1.createNotFoundError)('Test not found');
            }
            test.isDeleted = true;
            test.updatedBy = deletedBy;
            await test.save({ session });
            await session.commitTransaction();
            await manualLabCacheService_1.default.invalidateTestCatalogCache(workplaceId);
            logger_1.default.info('Test catalog entry deleted', {
                testId: test._id,
                code: test.code,
                workplaceId: workplaceId.toString(),
                service: 'test-catalog'
            });
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Failed to delete test catalog entry', {
                testId,
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async activateTest(workplaceId, testId, updatedBy) {
        try {
            const test = await TestCatalog_1.default.findOne({
                _id: testId,
                workplaceId,
                isDeleted: { $ne: true }
            });
            if (!test) {
                throw (0, responseHelpers_1.createNotFoundError)('Test not found');
            }
            await test.activate();
            test.updatedBy = updatedBy;
            await test.save();
            await manualLabCacheService_1.default.invalidateTestCatalogCache(workplaceId);
            logger_1.default.info('Test catalog entry activated', {
                testId: test._id,
                code: test.code,
                workplaceId: workplaceId.toString(),
                service: 'test-catalog'
            });
            return test;
        }
        catch (error) {
            logger_1.default.error('Failed to activate test catalog entry', {
                testId,
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async deactivateTest(workplaceId, testId, updatedBy) {
        try {
            const test = await TestCatalog_1.default.findOne({
                _id: testId,
                workplaceId,
                isDeleted: { $ne: true }
            });
            if (!test) {
                throw (0, responseHelpers_1.createNotFoundError)('Test not found');
            }
            await test.deactivate();
            test.updatedBy = updatedBy;
            await test.save();
            await manualLabCacheService_1.default.invalidateTestCatalogCache(workplaceId);
            logger_1.default.info('Test catalog entry deactivated', {
                testId: test._id,
                code: test.code,
                workplaceId: workplaceId.toString(),
                service: 'test-catalog'
            });
            return test;
        }
        catch (error) {
            logger_1.default.error('Failed to deactivate test catalog entry', {
                testId,
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async updateTestCost(workplaceId, testId, cost, updatedBy) {
        try {
            const test = await TestCatalog_1.default.findOne({
                _id: testId,
                workplaceId,
                isDeleted: { $ne: true }
            });
            if (!test) {
                throw (0, responseHelpers_1.createNotFoundError)('Test not found');
            }
            await test.updateCost(cost, updatedBy);
            await manualLabCacheService_1.default.invalidateTestCatalogCache(workplaceId);
            logger_1.default.info('Test catalog cost updated', {
                testId: test._id,
                code: test.code,
                newCost: cost,
                workplaceId: workplaceId.toString(),
                service: 'test-catalog'
            });
            return test;
        }
        catch (error) {
            logger_1.default.error('Failed to update test cost', {
                testId,
                workplaceId: workplaceId.toString(),
                cost,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
    }
    static async bulkImportTests(workplaceId, tests, createdBy) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            let imported = 0;
            let skipped = 0;
            const errors = [];
            for (const testData of tests) {
                try {
                    const existingTest = await TestCatalog_1.default.findByCode(workplaceId, testData.code);
                    if (existingTest) {
                        skipped++;
                        continue;
                    }
                    const test = new TestCatalog_1.default({
                        ...testData,
                        workplaceId,
                        code: testData.code.toUpperCase(),
                        isCustom: false,
                        createdBy
                    });
                    await test.save({ session });
                    imported++;
                }
                catch (error) {
                    errors.push(`${testData.code}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            await session.commitTransaction();
            await manualLabCacheService_1.default.invalidateTestCatalogCache(workplaceId);
            logger_1.default.info('Bulk test import completed', {
                workplaceId: workplaceId.toString(),
                totalTests: tests.length,
                imported,
                skipped,
                errors: errors.length,
                service: 'test-catalog'
            });
            return { imported, skipped, errors };
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.default.error('Failed to bulk import tests', {
                workplaceId: workplaceId.toString(),
                testCount: tests.length,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'test-catalog'
            });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getCacheStats() {
        return await manualLabCacheService_1.default.getCacheStats();
    }
}
exports.TestCatalogService = TestCatalogService;
exports.default = TestCatalogService;
//# sourceMappingURL=testCatalogService.js.map