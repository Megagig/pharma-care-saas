import mongoose, { Document } from 'mongoose';
export interface ITargetingRules {
    pharmacies?: string[];
    userGroups?: string[];
    percentage?: number;
    conditions?: {
        dateRange?: {
            startDate: Date;
            endDate: Date;
        };
        userAttributes?: Record<string, any>;
        workspaceAttributes?: Record<string, any>;
    };
}
export interface IUsageMetrics {
    totalUsers: number;
    activeUsers: number;
    usagePercentage: number;
    lastUsed: Date;
    usageByPlan?: Array<{
        plan: string;
        userCount: number;
        percentage: number;
    }>;
    usageByWorkspace?: Array<{
        workspaceId: string;
        workspaceName: string;
        userCount: number;
    }>;
}
export interface IFeatureFlag extends Document {
    name: string;
    key: string;
    description?: string;
    isActive: boolean;
    allowedTiers: string[];
    allowedRoles: string[];
    customRules?: {
        requiredLicense?: boolean;
        maxUsers?: number;
        targeting?: ITargetingRules;
        [key: string]: any;
    };
    metadata?: {
        category: string;
        priority: string;
        tags: string[];
        displayOrder?: number;
        marketingDescription?: string;
        isMarketingFeature?: boolean;
        icon?: string;
        [key: string]: any;
    };
    targetingRules?: ITargetingRules;
    usageMetrics?: IUsageMetrics;
    createdBy?: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const FeatureFlag: mongoose.Model<IFeatureFlag, {}, {}, {}, mongoose.Document<unknown, {}, IFeatureFlag> & IFeatureFlag & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default FeatureFlag;
export { FeatureFlag };
//# sourceMappingURL=FeatureFlag.d.ts.map