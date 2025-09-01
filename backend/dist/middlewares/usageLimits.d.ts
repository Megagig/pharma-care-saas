import { Response, NextFunction } from 'express';
import { AuthRequest, UsageLimitResult } from '../types/auth';
import { IWorkplace } from '../models/Workplace';
export declare const enforcePlanLimit: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const enforceMultipleLimits: (...resources: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const warnOnUsageLimit: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUsageAfterCreation: (resource: string, delta?: number) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateUsageAfterDeletion: (resource: string, delta?: number) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getWorkspaceUsageStats: (workspace: IWorkplace, limits: any) => Promise<{
    [key: string]: UsageLimitResult;
}>;
export declare const attachUsageStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    enforcePlanLimit: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    enforceMultipleLimits: (...resources: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    warnOnUsageLimit: (resource: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    attachUsageStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    updateUsageAfterCreation: (resource: string, delta?: number) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    updateUsageAfterDeletion: (resource: string, delta?: number) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    getWorkspaceUsageStats: (workspace: IWorkplace, limits: any) => Promise<{
        [key: string]: UsageLimitResult;
    }>;
};
export default _default;
//# sourceMappingURL=usageLimits.d.ts.map