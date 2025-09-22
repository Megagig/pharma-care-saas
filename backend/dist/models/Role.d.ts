import mongoose, { Document } from 'mongoose';
export interface IRole extends Document {
    name: string;
    displayName: string;
    description: string;
    category: 'system' | 'workplace' | 'custom';
    parentRole?: mongoose.Types.ObjectId;
    childRoles: mongoose.Types.ObjectId[];
    hierarchyLevel: number;
    permissions: string[];
    isActive: boolean;
    isSystemRole: boolean;
    isDefault: boolean;
    workspaceId?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IRole, {}, {}, {}, mongoose.Document<unknown, {}, IRole> & IRole & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Role.d.ts.map