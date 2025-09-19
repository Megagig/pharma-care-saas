import { PermissionMatrix, UserRole, WorkplaceRole, SubscriptionTier } from '../types/auth';
export declare const PERMISSION_MATRIX: PermissionMatrix;
export declare const ROLE_HIERARCHY: Record<UserRole, UserRole[]>;
export declare const WORKPLACE_ROLE_HIERARCHY: Record<WorkplaceRole, WorkplaceRole[]>;
export declare const PLAN_TIER_HIERARCHY: Record<SubscriptionTier, number>;
export declare const DEFAULT_FEATURES: string[];
export declare const TIER_FEATURES: Record<SubscriptionTier, string[]>;
//# sourceMappingURL=permissionMatrix.d.ts.map