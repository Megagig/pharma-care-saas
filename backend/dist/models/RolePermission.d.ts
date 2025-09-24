import mongoose, { Document } from 'mongoose';
export interface IRolePermission extends Document {
    roleId: mongoose.Types.ObjectId;
    permissionAction: string;
    granted: boolean;
    conditions?: {
        timeRestrictions?: {
            allowedHours?: {
                start: number;
                end: number;
            }[];
            allowedDays?: number[];
            timezone?: string;
        };
        ipRestrictions?: {
            allowedIPs?: string[];
            blockedIPs?: string[];
            allowedNetworks?: string[];
        };
        contextRestrictions?: {
            workspaceOnly?: boolean;
            departmentIds?: mongoose.Types.ObjectId[];
            resourceIds?: mongoose.Types.ObjectId[];
        };
    };
    isActive: boolean;
    priority: number;
    grantedBy: mongoose.Types.ObjectId;
    grantedAt: Date;
    lastModifiedBy: mongoose.Types.ObjectId;
    revokedBy?: mongoose.Types.ObjectId;
    revokedAt?: Date;
    revocationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IRolePermission, {}, {}, {}, mongoose.Document<unknown, {}, IRolePermission> & IRolePermission & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=RolePermission.d.ts.map