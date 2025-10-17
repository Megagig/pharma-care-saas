import { IConversation } from "../models/Conversation";
import { IMessage } from "../models/Message";
export interface CreateConversationData {
    title?: string;
    type: "direct" | "group" | "patient_query" | "clinical_consultation";
    participants: string[];
    patientId?: string;
    caseId?: string;
    priority?: "low" | "normal" | "high" | "urgent";
    tags?: string[];
    createdBy: string;
    workplaceId: string;
    skipWorkplaceValidation?: boolean;
}
export interface SendMessageData {
    conversationId: string;
    senderId: string;
    content: {
        text?: string;
        type: "text" | "file" | "image" | "clinical_note" | "system" | "voice_note";
        attachments?: any[];
        metadata?: any;
    };
    threadId?: string;
    parentMessageId?: string;
    mentions?: string[];
    priority?: "normal" | "high" | "urgent";
    workplaceId: string;
}
export interface ConversationFilters {
    status?: "active" | "archived" | "resolved" | "closed";
    type?: "direct" | "group" | "patient_query" | "clinical_consultation";
    priority?: "low" | "normal" | "high" | "urgent";
    patientId?: string;
    tags?: string[];
    search?: string;
    limit?: number;
    offset?: number;
}
export interface MessageFilters {
    type?: "text" | "file" | "image" | "clinical_note" | "system" | "voice_note";
    senderId?: string;
    mentions?: string;
    priority?: "normal" | "high" | "urgent";
    before?: Date;
    after?: Date;
    limit?: number;
    offset?: number;
}
export interface SearchFilters {
    conversationId?: string;
    senderId?: string;
    type?: string;
    priority?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
}
export declare class CommunicationService {
    createConversation(data: CreateConversationData): Promise<IConversation>;
    addParticipant(conversationId: string, userId: string, role: string, addedBy: string, workplaceId: string): Promise<void>;
    removeParticipant(conversationId: string, userId: string, removedBy: string, workplaceId: string): Promise<void>;
    sendMessage(data: SendMessageData): Promise<IMessage>;
    getConversations(userId: string, workplaceId: string, filters?: ConversationFilters): Promise<IConversation[]>;
    getMessages(conversationId: string, userId: string, workplaceId: string, filters?: MessageFilters, skipParticipantCheck?: boolean): Promise<IMessage[]>;
    markMessageAsRead(messageId: string, userId: string, workplaceId: string): Promise<void>;
    searchMessages(workplaceId: string, query: string, userId: string, filters?: SearchFilters): Promise<IMessage[]>;
    createThread(messageId: string, userId: string, workplaceId: string): Promise<string>;
    getThreadMessages(threadId: string, userId: string, workplaceId: string, filters?: MessageFilters): Promise<{
        rootMessage: IMessage;
        replies: IMessage[];
    }>;
    getThreadSummary(threadId: string, userId: string, workplaceId: string): Promise<{
        threadId: string;
        rootMessage: IMessage;
        replyCount: number;
        participants: string[];
        lastReplyAt?: Date;
        unreadCount: number;
    }>;
    replyToThread(threadId: string, data: Omit<SendMessageData, "threadId" | "parentMessageId">): Promise<IMessage>;
    getConversationThreads(conversationId: string, userId: string, workplaceId: string): Promise<Array<{
        threadId: string;
        rootMessage: IMessage;
        replyCount: number;
        lastReplyAt?: Date;
        unreadCount: number;
    }>>;
    private createSystemMessage;
    private handleMentions;
    private handleUrgentMessageNotifications;
    deleteMessage(messageId: string, userId: string, workplaceId: string, reason?: string): Promise<void>;
    addMessageReaction(messageId: string, userId: string, emoji: string, workplaceId: string): Promise<void>;
    removeMessageReaction(messageId: string, userId: string, emoji: string, workplaceId: string): Promise<void>;
    editMessage(messageId: string, userId: string, newContent: string, reason: string, workplaceId: string): Promise<void>;
    getMessageStatuses(messageIds: string[], userId: string, workplaceId: string): Promise<Record<string, {
        status: string;
        readBy: any[];
        reactions: any[];
    }>>;
    private getDefaultPermissions;
}
export declare const communicationService: CommunicationService;
export default communicationService;
//# sourceMappingURL=communicationService.d.ts.map