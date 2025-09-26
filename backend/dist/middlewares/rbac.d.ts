import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
declare module '../types/auth' {
    interface AuthRequest {
        permissionContext?: {
            action: string;
            source: string;
            roleId?: any;
            roleName?: string;
            inheritedFrom?: string;
        };
    }
}
export declare const requireDynamicPermission: (action: string, options?: {
    enableLegacyFallback?: boolean;
    enableSuggestions?: boolean;
    enableRealTimeValidation?: boolean;
}) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requirePermission: (action: string, options?: {
    useDynamicRBAC?: boolean;
    enableLegacyFallback?: boolean;
}) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireWorkplaceRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireFeature: (...features: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePlanTier: (...tiers: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireWorkspaceOwner: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAllPermissions: (...actions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAnyPermission: (...actions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireActiveSubscription: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireSubscriptionOrTrial: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateSessionPermissions: (options?: {
    maxSessionAge?: number;
    criticalActions?: string[];
    enableSessionInvalidation?: boolean;
}) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const notifyPermissionChanges: () => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const gracefulPermissionHandling: () => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    requirePermission: (action: string, options?: {
        useDynamicRBAC?: boolean;
        enableLegacyFallback?: boolean;
    }) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDynamicPermission: (action: string, options?: {
        enableLegacyFallback?: boolean;
        enableSuggestions?: boolean;
        enableRealTimeValidation?: boolean;
    }) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireWorkplaceRole: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireFeature: (...features: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    requirePlanTier: (...tiers: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireWorkspaceOwner: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireAllPermissions: (...actions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireAnyPermission: (...actions: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireActiveSubscription: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireSubscriptionOrTrial: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateSessionPermissions: (options?: {
        maxSessionAge?: number;
        criticalActions?: string[];
        enableSessionInvalidation?: boolean;
    }) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    notifyPermissionChanges: () => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    gracefulPermissionHandling: () => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=rbac.d.ts.map