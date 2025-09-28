import { Request, Response, NextFunction } from 'express';
export interface CacheMiddlewareOptions {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request) => boolean;
    tags?: string[] | ((req: Request) => string[]);
    varyBy?: string[];
    skipCache?: (req: Request) => boolean;
}
export declare const cacheMiddleware: (options?: CacheMiddlewareOptions) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const dashboardCacheMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const patientListCacheMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const userProfileCacheMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const clinicalNotesCacheMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const medicationCacheMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const searchCacheMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const reportsCacheMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const invalidateCache: (tags: string[]) => Promise<void>;
export declare const invalidateUserCache: (userId: string) => Promise<void>;
export declare const invalidatePatientCache: (patientId: string) => Promise<void>;
//# sourceMappingURL=cacheMiddleware.d.ts.map