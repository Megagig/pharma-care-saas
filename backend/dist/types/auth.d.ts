import { Request } from 'express';
import { IUser } from '../models/User';
import { IWorkplace } from '../models/Workplace';
import { ISubscription } from '../models/Subscription';
import { ISubscriptionPlan } from '../models/SubscriptionPlan';
import { Types } from 'mongoose';
export type UserRole = 'pharmacist' | 'pharmacy_team' | 'pharmacy_outlet' | 'intern_pharmacist' | 'super_admin' | 'owner';
export type WorkplaceRole = 'Owner' | 'Staff' | 'Pharmacist' | 'Cashier' | 'Technician' | 'Assistant';
export type SubscriptionTier = 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
export interface PermissionMatrix {
    [action: string]: {
        systemRoles?: UserRole[];
        workplaceRoles?: WorkplaceRole[];
        features?: string[];
        planTiers?: SubscriptionTier[];
        requiresActiveSubscription?: boolean;
        allowTrialAccess?: boolean;
    };
}
export interface WorkspaceContext {
    workspace: IWorkplace | null;
    subscription: ISubscription | null;
    plan: ISubscriptionPlan | null;
    permissions: string[];
    limits: PlanLimits;
    isTrialExpired: boolean;
    isSubscriptionActive: boolean;
}
export interface PlanLimits {
    patients: number | null;
    users: number | null;
    locations: number | null;
    storage: number | null;
    apiCalls: number | null;
    interventions?: number | null;
}
interface BaseUser {
    id?: string;
    _id?: string;
    workplaceId?: string | Types.ObjectId;
    role?: UserRole;
    workplaceRole?: WorkplaceRole;
    status?: string;
    assignedRoles?: Types.ObjectId[];
    permissions?: string[];
    directPermissions?: string[];
    deniedPermissions?: string[];
    cachedPermissions?: {
        permissions: string[];
        lastUpdated: Date;
        expiresAt: Date;
        workspaceId?: Types.ObjectId;
    };
    lastPermissionCheck?: Date;
    subscriptionTier?: SubscriptionTier;
    features?: string[];
    email?: string;
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
}
interface ExtendedUser extends IUser {
    currentUsage?: number;
    usageLimit?: number;
    lastPermissionCheck?: Date;
}
export declare function isExtendedUser(user: BaseUser | ExtendedUser | undefined): user is ExtendedUser;
export declare function hasUserRole(user: BaseUser | ExtendedUser | undefined): user is BaseUser & {
    role: UserRole;
};
export declare function hasWorkplaceRole(user: BaseUser | ExtendedUser | undefined): user is BaseUser & {
    workplaceRole: WorkplaceRole;
};
export declare function hasUserStatus(user: BaseUser | ExtendedUser | undefined): user is BaseUser & {
    status: string;
};
export declare function hasAssignedRoles(user: BaseUser | ExtendedUser | undefined): user is BaseUser & {
    assignedRoles: Types.ObjectId[];
};
export declare function hasPermissions(user: BaseUser | ExtendedUser | undefined): user is BaseUser & {
    permissions: string[];
};
export declare function hasCachedPermissions(user: BaseUser | ExtendedUser | undefined): user is BaseUser & {
    cachedPermissions: {
        permissions: string[];
        lastUpdated: Date;
        expiresAt: Date;
        workspaceId?: Types.ObjectId;
    };
};
export declare function hasLastPermissionCheck(user: BaseUser | ExtendedUser | undefined): user is BaseUser & {
    lastPermissionCheck: Date;
};
export declare function getUserRole(user: BaseUser | ExtendedUser | undefined): UserRole | undefined;
export declare function getUserWorkplaceRole(user: BaseUser | ExtendedUser | undefined): WorkplaceRole | undefined;
export declare function getUserStatus(user: BaseUser | ExtendedUser | undefined): string | undefined;
export declare function getUserAssignedRoles(user: BaseUser | ExtendedUser | undefined): Types.ObjectId[] | undefined;
export declare function getUserPermissions(user: BaseUser | ExtendedUser | undefined): string[] | undefined;
export declare function getUserCachedPermissions(user: BaseUser | ExtendedUser | undefined): {
    permissions: string[];
    lastUpdated: Date;
    expiresAt: Date;
    workspaceId?: Types.ObjectId;
} | undefined;
export declare function getUserLastPermissionCheck(user: BaseUser | ExtendedUser | undefined): Date | undefined;
export declare function getUserId(user: BaseUser | ExtendedUser | undefined): string | undefined;
export declare function getWorkplaceId(user: BaseUser | ExtendedUser | undefined): Types.ObjectId | undefined;
export interface AuthRequest extends Request {
    user?: ExtendedUser | BaseUser;
    subscription?: ISubscription | null;
    workspace?: IWorkplace | null;
    workspaceContext?: WorkspaceContext;
    usageInfo?: UsageLimitResult | {
        [resource: string]: UsageLimitResult;
    };
    interventionData?: any;
    patient?: any;
    clinicalNotes?: any[];
    permissionContext?: {
        action: string;
        source: string;
        roleId?: any;
        roleName?: string;
        inheritedFrom?: string;
    };
    sessionId?: string;
}
export interface UsageLimitResult {
    allowed: boolean;
    currentUsage: number;
    limit: number | null;
    warningThreshold?: number;
    isAtWarning: boolean;
    isAtLimit: boolean;
    upgradeRequired?: boolean;
    suggestedPlan?: string;
}
export interface AcceptInvitationData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
}
export interface AcceptResult {
    success: boolean;
    user?: IUser;
    workspace?: IWorkplace;
    message: string;
}
export interface CreateInvitationData {
    email: string;
    workspaceId: string;
    role: string;
    customMessage?: string;
}
export interface PermissionResult {
    allowed: boolean;
    reason?: string;
    requiredPermissions?: string[];
    requiredRoles?: string[];
    requiredFeatures?: string[];
    upgradeRequired?: boolean;
}
export {};
//# sourceMappingURL=auth.d.ts.map