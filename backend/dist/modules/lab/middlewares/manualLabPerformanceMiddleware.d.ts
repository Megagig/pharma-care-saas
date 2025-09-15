import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth';
interface PerformanceContext {
    startTime: number;
    operation: string;
    orderId?: string;
    workplaceId?: string;
    userId?: string;
    metadata?: any;
}
declare global {
    namespace Express {
        interface Request {
            performanceContext?: PerformanceContext;
        }
    }
}
export declare const initializePerformanceTracking: (operation: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const finalizePerformanceTracking: () => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const trackDatabaseQuery: (operation: "create" | "read" | "update" | "delete", collection: string) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => Promise<PropertyDescriptor>;
export declare const trackCacheOperation: (operation: "get" | "set" | "delete" | "invalidate") => (cacheKey: string, workplaceId?: string) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => Promise<PropertyDescriptor>;
export declare function MonitorPerformance(operation: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare const _default: {
    initializePerformanceTracking: (operation: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    finalizePerformanceTracking: () => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    trackDatabaseQuery: (operation: "create" | "read" | "update" | "delete", collection: string) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => Promise<PropertyDescriptor>;
    trackCacheOperation: (operation: "get" | "set" | "delete" | "invalidate") => (cacheKey: string, workplaceId?: string) => (target: any, propertyName: string, descriptor: PropertyDescriptor) => Promise<PropertyDescriptor>;
    MonitorPerformance: typeof MonitorPerformance;
};
export default _default;
//# sourceMappingURL=manualLabPerformanceMiddleware.d.ts.map