import { Server as SocketIOServer } from "socket.io";
interface SocketUserData {
    userId: string;
    workplaceId: string;
    role: string;
    email: string;
    firstName: string;
    lastName: string;
}
export declare class SocketNotificationService {
    private io;
    private connectedUsers;
    private socketUsers;
    constructor(io: SocketIOServer);
    private setupSocketHandlers;
    private handleConnection;
    private handleDisconnection;
    private setupNotificationHandlers;
    private setupConversationHandlers;
    private setupPresenceHandlers;
    private sendInitialNotifications;
    private broadcastUserPresence;
    sendNotificationToUser(userId: string, notification: any): Promise<void>;
    sendMessageNotification(conversationId: string, message: any, excludeUserId?: string): void;
    sendConversationUpdate(conversationId: string, updateData: any): void;
    getConnectedUsersCount(): number;
    isUserConnected(userId: string): boolean;
    getWorkplaceConnectedUsers(workplaceId: string): SocketUserData[];
    sendWorkplaceAnnouncement(workplaceId: string, announcement: any): void;
    sendEmergencyAlert(alert: any): void;
}
export default SocketNotificationService;
//# sourceMappingURL=socketNotificationService.d.ts.map