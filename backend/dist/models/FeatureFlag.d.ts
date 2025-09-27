import mongoose, { Document } from 'mongoose';
export interface IFeatureFlag extends Document {
    featureName: string;
    userId?: string;
    workspaceId?: string;
    enabled: boolean;
    reason?: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FeatureFlag: mongoose.Model<IFeatureFlag, {}, {}, {}, mongoose.Document<unknown, {}, IFeatureFlag> & IFeatureFlag & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=FeatureFlag.d.ts.map