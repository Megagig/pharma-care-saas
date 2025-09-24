import { Server as SocketIOServer } from 'socket.io';
interface SocketUserData {
    userId: string;
    workplaceId: string;
    role: string;
    email: string;
    firstName: string;
    lastName: string;
}
export declare class CommunicationSocketService {
    private io;
    private connectedUsers;
    private socketUsers;
    private conversationRooms;
    private typingUsers;
    private typingTimeouts;
    constructor(io: SocketIOServer);
    private setupSocketHandlers;
    private handleConnection;
    private handleDisconnection;
    private setupConversationHandlers;
    private setupMessageHandlers;
    private setupTypingHandlers;
    private setupPresenceHandlers;
    private setupFileHandlers;
    private startTyping;
    private stopTyping;
    private cleanupTypingForSocket;
    private sendInitialData;
    private handleMentionNotifications;
    private broadcastUserPresence;
    private getDefaultPermissions;
    private sendErrorToSocket;
    sendMessageNotification(conversationId: string, message: any, excludeUserId?: string): void;
    sendConversationUpdate(conversationId: string, updateData: any): void;
    getConnectedUsersCount(): number;
    isUserConnected(userId: string): boolean;
    getWorkplaceConnectedUsers(workplaceId: string): SocketUserData[];
    sendConversationAnnouncement(conversationId: string, announcement: any): void;
    sendConversationEmergencyAlert(conversationId: string, alert: any): void;
}
export default CommunicationSocketService;
//# sourceMappingURL=communicationSocketService.d.ts.map