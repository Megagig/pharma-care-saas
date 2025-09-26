import mongoose, { Document } from 'mongoose';
export interface IMessageAttachment {
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    secureUrl: string;
    thumbnailUrl?: string;
    uploadedAt: Date;
}
export interface IMessageContent {
    text?: string;
    type: 'text' | 'file' | 'image' | 'clinical_note' | 'system' | 'voice_note';
    attachments?: IMessageAttachment[];
    metadata?: {
        originalText?: string;
        clinicalData?: {
            patientId?: mongoose.Types.ObjectId;
            interventionId?: mongoose.Types.ObjectId;
            medicationId?: mongoose.Types.ObjectId;
        };
        systemAction?: {
            action: string;
            performedBy: mongoose.Types.ObjectId;
            timestamp: Date;
        };
    };
}
export interface IMessageReaction {
    userId: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
}
export interface IMessageReadReceipt {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
}
export interface IMessageEditHistory {
    content: string;
    editedAt: Date;
    editedBy: mongoose.Types.ObjectId;
    reason?: string;
}
export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    content: IMessageContent;
    threadId?: mongoose.Types.ObjectId;
    parentMessageId?: mongoose.Types.ObjectId;
    mentions: mongoose.Types.ObjectId[];
    reactions: IMessageReaction[];
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    priority: 'normal' | 'high' | 'urgent';
    readBy: IMessageReadReceipt[];
    editHistory: IMessageEditHistory[];
    isEncrypted: boolean;
    encryptionKeyId?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    addReaction(userId: mongoose.Types.ObjectId, emoji: string): void;
    removeReaction(userId: mongoose.Types.ObjectId, emoji: string): void;
    markAsRead(userId: mongoose.Types.ObjectId): void;
    isReadBy(userId: mongoose.Types.ObjectId): boolean;
    addEdit(content: string, editedBy: mongoose.Types.ObjectId, reason?: string): void;
    getMentionedUsers(): mongoose.Types.ObjectId[];
    hasAttachments(): boolean;
    getAttachmentCount(): number;
}
declare const _default: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage> & IMessage & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=Message.d.ts.map