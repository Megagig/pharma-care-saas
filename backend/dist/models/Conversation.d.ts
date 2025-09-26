import mongoose, { Document } from 'mongoose';
export interface IConversationParticipant {
    userId: mongoose.Types.ObjectId;
    role: 'pharmacist' | 'doctor' | 'patient' | 'pharmacy_team' | 'intern_pharmacist';
    joinedAt: Date;
    leftAt?: Date;
    permissions: string[];
    lastReadAt?: Date;
}
export interface IConversationMetadata {
    isEncrypted: boolean;
    encryptionKeyId?: string;
    clinicalContext?: {
        diagnosis?: string;
        medications?: mongoose.Types.ObjectId[];
        conditions?: string[];
        interventionIds?: mongoose.Types.ObjectId[];
    };
    priority: 'low' | 'normal' | 'high' | 'urgent';
    tags: string[];
}
export interface IConversation extends Document {
    _id: mongoose.Types.ObjectId;
    title?: string;
    type: 'direct' | 'group' | 'patient_query' | 'clinical_consultation';
    participants: IConversationParticipant[];
    patientId?: mongoose.Types.ObjectId;
    caseId?: string;
    status: 'active' | 'archived' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    tags: string[];
    lastMessageAt: Date;
    lastMessageId?: mongoose.Types.ObjectId;
    unreadCount: Map<string, number>;
    createdBy: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    metadata: IConversationMetadata;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    addParticipant(userId: mongoose.Types.ObjectId, role: string, permissions?: string[]): void;
    removeParticipant(userId: mongoose.Types.ObjectId): void;
    updateLastMessage(messageId: mongoose.Types.ObjectId): void;
    incrementUnreadCount(excludeUserId?: mongoose.Types.ObjectId): void;
    markAsRead(userId: mongoose.Types.ObjectId): void;
    hasParticipant(userId: mongoose.Types.ObjectId): boolean;
    getParticipantRole(userId: mongoose.Types.ObjectId): string | null;
}
declare const _default: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation> & IConversation & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Conversation.d.ts.map