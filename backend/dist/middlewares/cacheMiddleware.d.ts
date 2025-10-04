import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export interface CacheMiddlewareOptions {
    ttl?: number;
    keyGenerator?: (req: AuthRequest) => string;
    condition?: (req: AuthRequest) => boolean;
    tags?: string[] | ((req: AuthRequest) => string[]);
    varyBy?: string[];
    skipCache?: (req: AuthRequest) => boolean;
}
export declare const cacheMiddleware: (options?: CacheMiddlewareOptions) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const dashboardCacheMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const patientListCacheMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const userProfileCacheMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const clinicalNotesCacheMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const medicationCacheMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const searchCacheMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const reportsCacheMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const invalidateCache: (tags: string[]) => Promise<void>;
export declare const invalidateUserCache: (userId: string) => Promise<void>;
export declare const invalidatePatientCache: (patientId: string) => Promise<void>;
//# sourceMappingURL=cacheMiddleware.d.ts.map