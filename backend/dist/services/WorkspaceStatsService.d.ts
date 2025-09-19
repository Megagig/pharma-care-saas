import mongoose from 'mongoose';
import { IWorkplace, WorkspaceStats } from '../models/Workplace';
export interface UsageUpdateData {
    workspaceId: mongoose.Types.ObjectId;
    resource: 'patients' | 'users' | 'storage' | 'apiCalls';
    delta: number;
    operation?: 'increment' | 'decrement' | 'set';
}
export interface UsageStats {
    patientsCount: number;
    usersCount: number;
    storageUsed: number;
    apiCallsThisMonth: number;
    lastUpdated: Date;
}
export interface RecalculationResult {
    workspaceId: mongoose.Types.ObjectId;
    previousStats: WorkspaceStats;
    newStats: WorkspaceStats;
    differences: Partial<WorkspaceStats>;
}
export declare class WorkspaceStatsService {
    updateUsageStats(data: UsageUpdateData): Promise<WorkspaceStats>;
    getUsageStats(workspaceId: mongoose.Types.ObjectId): Promise<WorkspaceStats>;
    recalculateUsageStats(workspaceId: mongoose.Types.ObjectId): Promise<RecalculationResult>;
    batchRecalculateStats(workspaceIds?: mongoose.Types.ObjectId[]): Promise<RecalculationResult[]>;
    resetMonthlyApiCalls(workspaceId: mongoose.Types.ObjectId): Promise<void>;
    batchResetMonthlyApiCalls(): Promise<void>;
    getWorkspacesWithStaleStats(): Promise<IWorkplace[]>;
    updateStorageUsage(workspaceId: mongoose.Types.ObjectId, sizeInMB: number, operation?: 'add' | 'remove'): Promise<WorkspaceStats>;
    incrementApiCalls(workspaceId: mongoose.Types.ObjectId, count?: number): Promise<WorkspaceStats>;
    getUsageWithLimits(workspaceId: mongoose.Types.ObjectId, limits: {
        patients?: number | null;
        users?: number | null;
        storage?: number | null;
        apiCalls?: number | null;
    }): Promise<{
        stats: WorkspaceStats;
        usage: {
            patients: {
                current: number;
                limit: number | null;
                percentage: number | null;
            };
            users: {
                current: number;
                limit: number | null;
                percentage: number | null;
            };
            storage: {
                current: number;
                limit: number | null;
                percentage: number | null;
            };
            apiCalls: {
                current: number;
                limit: number | null;
                percentage: number | null;
            };
        };
    }>;
}
declare const _default: WorkspaceStatsService;
export default _default;
//# sourceMappingURL=WorkspaceStatsService.d.ts.map