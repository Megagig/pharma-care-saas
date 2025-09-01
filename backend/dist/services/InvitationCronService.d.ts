interface InvitationAnalytics {
    totalInvitations: number;
    activeInvitations: number;
    expiredInvitations: number;
    usedInvitations: number;
    canceledInvitations: number;
    acceptanceRate: number;
    averageAcceptanceTime: number;
    invitationsByRole: Record<string, number>;
    invitationsByMonth: Array<{
        month: string;
        count: number;
        accepted: number;
    }>;
}
interface InvitationLimits {
    maxPendingInvites: number;
    currentPendingInvites: number;
    remainingInvites: number;
    canSendMore: boolean;
    upgradeRequired: boolean;
    nextUpgradeLevel?: string;
}
interface InvitationStats {
    workspace?: {
        id: string;
        name: string;
        totalInvitations: number;
        pendingInvitations: number;
        acceptedInvitations: number;
        expiredInvitations: number;
    };
    global?: {
        totalWorkspaces: number;
        totalInvitations: number;
        averageInvitationsPerWorkspace: number;
        globalAcceptanceRate: number;
    };
}
declare class InvitationCronService {
    private cronJobs;
    start(): void;
    stop(): void;
    markExpiredInvitations(): Promise<{
        success: boolean;
        expiredCount: number;
        notificationsSent: number;
        errors: string[];
    }>;
    validateInvitationLimits(workspaceId: string): Promise<InvitationLimits>;
    getInvitationAnalytics(workspaceId: string): Promise<InvitationAnalytics>;
    getInvitationStats(workspaceId?: string): Promise<InvitationStats>;
    cleanupOldInvitations(): Promise<{
        success: boolean;
        deletedCount: number;
        error?: string;
    }>;
    sendExpiryReminders(): Promise<{
        success: boolean;
        remindersSent: number;
        errors: string[];
    }>;
}
export declare const invitationCronService: InvitationCronService;
export default invitationCronService;
//# sourceMappingURL=InvitationCronService.d.ts.map