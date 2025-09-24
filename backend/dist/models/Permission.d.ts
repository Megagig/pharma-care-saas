import mongoose, { Document } from 'mongoose';
export interface IPermission extends Document {
    action: string;
    displayName: string;
    description: string;
    category: string;
    requiredSubscriptionTier?: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
    requiredPlanFeatures?: string[];
    dependencies: string[];
    conflicts: string[];
    isActive: boolean;
    isSystemPermission: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPermission, {}, {}, {}, mongoose.Document<unknown, {}, IPermission> & IPermission & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Permission.d.ts.map