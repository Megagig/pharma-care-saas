import mongoose, { Document } from 'mongoose';
export interface IFeatureFlag extends Document {
    name: string;
    key: string;
    description: string;
    isActive: boolean;
    allowedTiers: string[];
    allowedRoles: string[];
    customRules?: {
        maxUsers?: number;
        requiredLicense?: boolean;
        customLogic?: string;
    };
    metadata: {
        category: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        tags: string[];
    };
    createdBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IFeatureFlag, {}, {}, {}, mongoose.Document<unknown, {}, IFeatureFlag> & IFeatureFlag & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=FeatureFlag.d.ts.map