import mongoose from 'mongoose';
import { EventEmitter } from 'events';
export interface CacheInvalidationEvent {
    type: 'user_permissions' | 'role_permissions' | 'permission_check' | 'role_hierarchy';
    targetId: mongoose.Types.ObjectId;
    workspaceId?: mongoose.Types.ObjectId;
    affectedUsers?: mongoose.Types.ObjectId[];
    affectedRoles?: mongoose.Types.ObjectId[];
    reason: string;
    timestamp: Date;
    initiatedBy?: mongoose.Types.ObjectId;
}
export interface CacheInvalidationStrategy {
    immediate: boolean;
    cascade: boolean;
    selective: boolean;
    distributed: boolean;
}
declare class CacheInvalidationService extends EventEmitter {
    private static instance;
    private cacheManager;
    private invalidationQueue;
    private isProcessingQueue;
    private readonly BATCH_SIZE;
    private readonly QUEUE_PROCESS_INTERVAL;
    private constructor();
    static getInstance(): CacheInvalidationService;
    invalidateUserPermissions(userId: mongoose.Types.ObjectId, options: {
        workspaceId?: mongoose.Types.ObjectId;
        reason: string;
        initiatedBy?: mongoose.Types.ObjectId;
        strategy?: Partial<CacheInvalidationStrategy>;
    }): Promise<void>;
    invalidateRolePermissions(roleId: mongoose.Types.ObjectId, options: {
        reason: string;
        initiatedBy?: mongoose.Types.ObjectId;
        strategy?: Partial<CacheInvalidationStrategy>;
    }): Promise<void>;
    invalidateRoleHierarchy(roleId: mongoose.Types.ObjectId, options: {
        reason: string;
        initiatedBy?: mongoose.Types.ObjectId;
        strategy?: Partial<CacheInvalidationStrategy>;
    }): Promise<void>;
    bulkInvalidate(invalidations: Array<{
        type: 'user' | 'role' | 'hierarchy';
        targetId: mongoose.Types.ObjectId;
        workspaceId?: mongoose.Types.ObjectId;
        reason: string;
    }>, options?: {
        initiatedBy?: mongoose.Types.ObjectId;
        strategy?: Partial<CacheInvalidationStrategy>;
    }): Promise<void>;
    private processUserPermissionInvalidation;
    private processRolePermissionInvalidation;
    private processRoleHierarchyInvalidation;
    private queueInvalidation;
    private startQueueProcessor;
    private processInvalidationQueue;
    private processBatchUserInvalidations;
    private processBatchRoleInvalidations;
    private processBatchHierarchyInvalidations;
    private setupEventHandlers;
    private getAffectedUsersByRole;
    private getAffectedUsersByRoles;
    private getChildRoles;
    private getAllChildRoles;
    private getParentRoles;
    getInvalidationStats(): {
        queueSize: number;
        isProcessing: boolean;
        batchSize: number;
        processInterval: number;
    };
    clearQueue(): void;
}
export default CacheInvalidationService;
//# sourceMappingURL=CacheInvalidationService.d.ts.map