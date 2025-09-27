import { Request } from 'express';
import { IUser } from '../models/User';
import { IWorkplace } from '../models/Workplace';
import { ISubscription } from '../models/Subscription';
import { ISubscriptionPlan } from '../models/SubscriptionPlan';

// Define system roles
export type UserRole =
  | 'pharmacist'
  | 'pharmacy_team'
  | 'pharmacy_outlet'
  | 'intern_pharmacist'
  | 'super_admin'
  | 'owner';

// Define workplace roles
export type WorkplaceRole =
  | 'Owner'
  | 'Staff'
  | 'Pharmacist'
  | 'Cashier'
  | 'Technician'
  | 'Assistant';

// Define subscription tiers
export type SubscriptionTier =
  | 'free_trial'
  | 'basic'
  | 'pro'
  | 'pharmily'
  | 'network'
  | 'enterprise';

// Permission matrix interface
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

export interface AuthRequest extends Request {
  user?: IUser & {
    currentUsage?: number;
    usageLimit?: number;
    lastPermissionCheck?: Date; // For real-time permission validation
  };
  subscription?: ISubscription | null;
  workspace?: IWorkplace | null;
  workspaceContext?: WorkspaceContext;
  usageInfo?: UsageLimitResult | { [resource: string]: UsageLimitResult };
  interventionData?: any; // For storing intervention data in middleware
  patient?: any; // Patient data set by middleware
  clinicalNotes?: any[]; // Clinical notes set by middleware
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
