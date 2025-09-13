import mongoose from 'mongoose';
import { ITestCatalog } from '../models/TestCatalog';
import { IManualLabOrder } from '../models/ManualLabOrder';
import { IManualLabResult } from '../models/ManualLabResult';
export declare class ManualLabCacheService {
    static cacheActiveTestCatalog(workplaceId: mongoose.Types.ObjectId): Promise<ITestCatalog[]>;
    static cacheTestsByCategory(workplaceId: mongoose.Types.ObjectId, category: string): Promise<ITestCatalog[]>;
    static cacheTestsBySpecimen(workplaceId: mongoose.Types.ObjectId, specimenType: string): Promise<ITestCatalog[]>;
    static cacheTestCategories(workplaceId: mongoose.Types.ObjectId): Promise<string[]>;
    static cacheSpecimenTypes(workplaceId: mongoose.Types.ObjectId): Promise<string[]>;
    static cacheTestSearch(workplaceId: mongoose.Types.ObjectId, query: string, options?: {
        category?: string;
        specimenType?: string;
        limit?: number;
        offset?: number;
    }): Promise<ITestCatalog[]>;
    static cacheTestByCode(workplaceId: mongoose.Types.ObjectId, code: string): Promise<ITestCatalog | null>;
    static cachePDFRequisition(orderId: string, pdfData: {
        buffer: Buffer;
        fileName: string;
        url: string;
        metadata?: any;
    }): Promise<void>;
    static getCachedPDFRequisition(orderId: string): Promise<{
        buffer: Buffer;
        fileName: string;
        url: string;
        metadata?: any;
    } | null>;
    static cacheOrder(order: IManualLabOrder): Promise<void>;
    static getCachedOrder(workplaceId: mongoose.Types.ObjectId, orderId: string): Promise<IManualLabOrder | null>;
    static cachePatientOrders(workplaceId: mongoose.Types.ObjectId, patientId: mongoose.Types.ObjectId, orders: IManualLabOrder[], page: number, limit: number): Promise<void>;
    static getCachedPatientOrders(workplaceId: mongoose.Types.ObjectId, patientId: mongoose.Types.ObjectId, page: number, limit: number): Promise<IManualLabOrder[] | null>;
    static cacheResult(result: IManualLabResult): Promise<void>;
    static getCachedResult(orderId: string): Promise<IManualLabResult | null>;
    static invalidateTestCatalogCache(workplaceId: mongoose.Types.ObjectId): Promise<void>;
    static invalidateOrderCache(workplaceId: mongoose.Types.ObjectId, orderId?: string, patientId?: mongoose.Types.ObjectId): Promise<void>;
    static invalidateResultCache(orderId: string): Promise<void>;
    static clearWorkplaceCache(workplaceId: mongoose.Types.ObjectId): Promise<void>;
    static getCacheStats(): Promise<{
        redisConnected: boolean;
        totalKeys: number;
        manualLabKeys: number;
        memoryUsage?: string;
    }>;
}
export default ManualLabCacheService;
//# sourceMappingURL=manualLabCacheService.d.ts.map