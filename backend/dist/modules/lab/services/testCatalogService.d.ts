import mongoose from 'mongoose';
import { ITestCatalog } from '../models/TestCatalog';
export interface CreateTestRequest {
    workplaceId: mongoose.Types.ObjectId;
    code: string;
    name: string;
    loincCode?: string;
    category: string;
    specimenType: string;
    unit?: string;
    refRange?: string;
    description?: string;
    estimatedCost?: number;
    turnaroundTime?: string;
    isCustom?: boolean;
    createdBy: mongoose.Types.ObjectId;
}
export interface UpdateTestRequest {
    name?: string;
    loincCode?: string;
    category?: string;
    specimenType?: string;
    unit?: string;
    refRange?: string;
    description?: string;
    estimatedCost?: number;
    turnaroundTime?: string;
    isActive?: boolean;
    updatedBy: mongoose.Types.ObjectId;
}
export interface TestSearchOptions {
    category?: string;
    specimenType?: string;
    limit?: number;
    offset?: number;
}
export declare class TestCatalogService {
    static getActiveTests(workplaceId: mongoose.Types.ObjectId): Promise<ITestCatalog[]>;
    static getTestsByCategory(workplaceId: mongoose.Types.ObjectId, category: string): Promise<ITestCatalog[]>;
    static getTestsBySpecimen(workplaceId: mongoose.Types.ObjectId, specimenType: string): Promise<ITestCatalog[]>;
    static getCategories(workplaceId: mongoose.Types.ObjectId): Promise<string[]>;
    static getSpecimenTypes(workplaceId: mongoose.Types.ObjectId): Promise<string[]>;
    static searchTests(workplaceId: mongoose.Types.ObjectId, query: string, options?: TestSearchOptions): Promise<ITestCatalog[]>;
    static getTestByCode(workplaceId: mongoose.Types.ObjectId, code: string): Promise<ITestCatalog | null>;
    static createTest(testData: CreateTestRequest): Promise<ITestCatalog>;
    static updateTest(workplaceId: mongoose.Types.ObjectId, testId: mongoose.Types.ObjectId, updateData: UpdateTestRequest): Promise<ITestCatalog>;
    static deleteTest(workplaceId: mongoose.Types.ObjectId, testId: mongoose.Types.ObjectId, deletedBy: mongoose.Types.ObjectId): Promise<void>;
    static activateTest(workplaceId: mongoose.Types.ObjectId, testId: mongoose.Types.ObjectId, updatedBy: mongoose.Types.ObjectId): Promise<ITestCatalog>;
    static deactivateTest(workplaceId: mongoose.Types.ObjectId, testId: mongoose.Types.ObjectId, updatedBy: mongoose.Types.ObjectId): Promise<ITestCatalog>;
    static updateTestCost(workplaceId: mongoose.Types.ObjectId, testId: mongoose.Types.ObjectId, cost: number, updatedBy: mongoose.Types.ObjectId): Promise<ITestCatalog>;
    static bulkImportTests(workplaceId: mongoose.Types.ObjectId, tests: Omit<CreateTestRequest, 'workplaceId' | 'createdBy'>[], createdBy: mongoose.Types.ObjectId): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
    static getCacheStats(): Promise<{
        redisConnected: boolean;
        totalKeys: number;
        manualLabKeys: number;
        memoryUsage?: string;
    }>;
}
export default TestCatalogService;
//# sourceMappingURL=testCatalogService.d.ts.map