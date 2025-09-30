import mongoose, { Document } from 'mongoose';
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
        [key: string]: any;
    };
    metadata?: {
        category: string;
        priority: string;
        tags: string[];
        [key: string]: any;
    };
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