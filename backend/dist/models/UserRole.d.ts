import mongoose, { Document } from 'mongoose';
export interface IUserRole extends Document {
    userId: mongoose.Types.ObjectId;
    roleId: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    isTemporary: boolean;
    expiresAt?: Date;
    assignmentReason?: string;
    assignmentContext?: Record<string, any>;
    isActive: boolean;
    assignedBy: mongoose.Types.ObjectId;
    assignedAt: Date;
    lastModifiedBy: mongoose.Types.ObjectId;
    revokedBy?: mongoose.Types.ObjectId;
    revokedAt?: Date;
    revocationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IUserRole, {}, {}, {}, mongoose.Document<unknown, {}, IUserRole> & IUserRole & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=UserRole.d.ts.map