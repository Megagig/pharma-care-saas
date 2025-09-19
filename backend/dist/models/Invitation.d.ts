import mongoose, { Document } from 'mongoose';
export interface InvitationMetadata {
    inviterName: string;
    workspaceName: string;
    customMessage?: string;
    canceledBy?: string;
    canceledReason?: string;
    canceledAt?: Date;
}
export interface IInvitation extends Document {
    email: string;
    code: string;
    workspaceId: mongoose.Types.ObjectId;
    invitedBy: mongoose.Types.ObjectId;
    role: 'Owner' | 'Pharmacist' | 'Technician' | 'Intern';
    status: 'active' | 'expired' | 'used' | 'canceled';
    expiresAt: Date;
    usedAt?: Date;
    usedBy?: mongoose.Types.ObjectId;
    metadata: InvitationMetadata;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IInvitation, {}, {}, {}, mongoose.Document<unknown, {}, IInvitation> & IInvitation & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Invitation.d.ts.map