import mongoose from 'mongoose';
import CacheManager from './CacheManager';
import logger from '../utils/logger';
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

/**
 * Cache Invalidation Service for coordinated cache management
 * Handles automatic cache invalidation on permission changes with distributed support
 */
class CacheInvalidationService extends EventEmitter {
    private static instance: CacheInvalidationService;
    private cacheManager: CacheManager;
    private invalidationQueue: CacheInvalidationEvent[] = [];
    private isProcessingQueue = false;
    private readonly BATCH_SIZE = 50;
    private readonly QUEUE_PROCESS_INTERVAL = 1000; // 1 second

    private constructor() {
        super();
        this.cacheManager = CacheManager.getInstance();
        this.startQueueProcessor();
        this.setupEventHandlers();
    }

    public static getInstance(): CacheInvalidationService {
        if (!CacheInvalidationService.instance) {
            CacheInvalidationService.instance = new CacheInvalidationService();
        }
        return CacheInvalidationService.instance;
    }

    /**
     * Invalidate user permission cache with cascade options
     */
    public async invalidateUserPermissions(
        userId: mongoose.Types.ObjectId,
        options: {
            workspaceId?: mongoose.Types.ObjectId;
            reason: string;
            initiatedBy?: mongoose.Types.ObjectId;
            strategy?: Partial<CacheInvalidationStrategy>;
        }
    ): Promise<void> {
        const strategy: CacheInvalidationStrategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };

        const event: CacheInvalidationEvent = {
            type: 'user_permissions',
            targetId: userId,
            workspaceId: options.workspaceId,
            reason: options.reason,
            timestamp: new Date(),
            initiatedBy: options.initiatedBy
        };

        if (strategy.immediate) {
            await this.processUserPermissionInvalidation(event, strategy);
        } else {
            this.queueInvalidation(event);
        }

        // Emit event for distributed invalidation
        if (strategy.distributed) {
            this.emit('cache_invalidation', event);
        }

        logger.debug('User permission cache invalidation initiated', {
            userId,
            workspaceId: options.workspaceId,
            reason: options.reason,
            strategy
        });
    }

    /**
     * Invalidate role permission cache with affected user cascade
     */
    public async invalidateRolePermissions(
        roleId: mongoose.Types.ObjectId,
        options: {
            reason: string;
            initiatedBy?: mongoose.Types.ObjectId;
            strategy?: Partial<CacheInvalidationStrategy>;
        }
    ): Promise<void> {
        const strategy: CacheInvalidationStrategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };

        // Get affected users and child roles
        const [affectedUsers, childRoles] = await Promise.all([
            this.getAffectedUsersByRole(roleId),
            this.getChildRoles(roleId)
        ]);

        const event: CacheInvalidationEvent = {
            type: 'role_permissions',
            targetId: roleId,
            affectedUsers,
            affectedRoles: childRoles,
            reason: options.reason,
            timestamp: new Date(),
            initiatedBy: options.initiatedBy
        };

        if (strategy.immediate) {
            await this.processRolePermissionInvalidation(event, strategy);
        } else {
            this.queueInvalidation(event);
        }

        // Emit event for distributed invalidation
        if (strategy.distributed) {
            this.emit('cache_invalidation', event);
        }

        logger.debug('Role permission cache invalidation initiated', {
            roleId,
            affectedUsersCount: affectedUsers.length,
            childRolesCount: childRoles.length,
            reason: options.reason,
            strategy
        });
    }

    /**
     * Invalidate role hierarchy cache
     */
    public async invalidateRoleHierarchy(
        roleId: mongoose.Types.ObjectId,
        options: {
            reason: string;
            initiatedBy?: mongoose.Types.ObjectId;
            strategy?: Partial<CacheInvalidationStrategy>;
        }
    ): Promise<void> {
        const strategy: CacheInvalidationStrategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };

        // Get all roles in the hierarchy (parents and children)
        const [parentRoles, childRoles] = await Promise.all([
            this.getParentRoles(roleId),
            this.getAllChildRoles(roleId)
        ]);

        const affectedRoles = [roleId, ...parentRoles, ...childRoles];
        const affectedUsers = await this.getAffectedUsersByRoles(affectedRoles);

        const event: CacheInvalidationEvent = {
            type: 'role_hierarchy',
            targetId: roleId,
            affectedUsers,
            affectedRoles,
            reason: options.reason,
            timestamp: new Date(),
            initiatedBy: options.initiatedBy
        };

        if (strategy.immediate) {
            await this.processRoleHierarchyInvalidation(event, strategy);
        } else {
            this.queueInvalidation(event);
        }

        // Emit event for distributed invalidation
        if (strategy.distributed) {
            this.emit('cache_invalidation', event);
        }

        logger.debug('Role hierarchy cache invalidation initiated', {
            roleId,
            affectedRolesCount: affectedRoles.length,
            affectedUsersCount: affectedUsers.length,
            reason: options.reason,
            strategy
        });
    }

    /**
     * Bulk invalidate multiple cache entries
     */
    public async bulkInvalidate(
        invalidations: Array<{
            type: 'user' | 'role' | 'hierarchy';
            targetId: mongoose.Types.ObjectId;
            workspaceId?: mongoose.Types.ObjectId;
            reason: string;
        }>,
        options: {
            initiatedBy?: mongoose.Types.ObjectId;
            strategy?: Partial<CacheInvalidationStrategy>;
        } = {}
    ): Promise<void> {
        const strategy: CacheInvalidationStrategy = {
            immediate: false, // Use queue for bulk operations
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };

        const events: CacheInvalidationEvent[] = [];

        for (const invalidation of invalidations) {
            let event: CacheInvalidationEvent;

            switch (invalidation.type) {
                case 'user':
                    event = {
                        type: 'user_permissions',
                        targetId: invalidation.targetId,
                        workspaceId: invalidation.workspaceId,
                        reason: invalidation.reason,
                        timestamp: new Date(),
                        initiatedBy: options.initiatedBy
                    };
                    break;

                case 'role':
                    const affectedUsers = await this.getAffectedUsersByRole(invalidation.targetId);
                    event = {
                        type: 'role_permissions',
                        targetId: invalidation.targetId,
                        affectedUsers,
                        reason: invalidation.reason,
                        timestamp: new Date(),
                        initiatedBy: options.initiatedBy
                    };
                    break;

                case 'hierarchy':
                    const [parentRoles, childRoles] = await Promise.all([
                        this.getParentRoles(invalidation.targetId),
                        this.getAllChildRoles(invalidation.targetId)
                    ]);
                    const allAffectedRoles = [invalidation.targetId, ...parentRoles, ...childRoles];
                    const allAffectedUsers = await this.getAffectedUsersByRoles(allAffectedRoles);

                    event = {
                        type: 'role_hierarchy',
                        targetId: invalidation.targetId,
                        affectedUsers: allAffectedUsers,
                        affectedRoles: allAffectedRoles,
                        reason: invalidation.reason,
                        timestamp: new Date(),
                        initiatedBy: options.initiatedBy
                    };
                    break;

                default:
                    continue;
            }

            events.push(event);
        }

        // Add to queue for batch processing
        this.invalidationQueue.push(...events);

        // Emit events for distributed invalidation
        if (strategy.distributed) {
            events.forEach(event => this.emit('cache_invalidation', event));
        }

        logger.info('Bulk cache invalidation queued', {
            count: events.length,
            initiatedBy: options.initiatedBy,
            strategy
        });
    }

    /**
     * Process user permission invalidation
     */
    private async processUserPermissionInvalidation(
        event: CacheInvalidationEvent,
        strategy: CacheInvalidationStrategy
    ): Promise<void> {
        try {
            // Invalidate user permission cache
            await this.cacheManager.invalidateUserCache(event.targetId, event.workspaceId);

            // Log the invalidation
            logger.debug('User permission cache invalidated', {
                userId: event.targetId,
                workspaceId: event.workspaceId,
                reason: event.reason
            });

        } catch (error) {
            logger.error('Error processing user permission invalidation:', error);
        }
    }

    /**
     * Process role permission invalidation
     */
    private async processRolePermissionInvalidation(
        event: CacheInvalidationEvent,
        strategy: CacheInvalidationStrategy
    ): Promise<void> {
        try {
            // Invalidate role cache
            await this.cacheManager.invalidateRoleCache(event.targetId);

            // Cascade to affected users if enabled
            if (strategy.cascade && event.affectedUsers && event.affectedUsers.length > 0) {
                for (const userId of event.affectedUsers) {
                    await this.cacheManager.invalidateUserCache(userId, event.workspaceId);
                }
            }

            // Cascade to child roles if enabled
            if (strategy.cascade && event.affectedRoles && event.affectedRoles.length > 0) {
                for (const roleId of event.affectedRoles) {
                    await this.cacheManager.invalidateRoleCache(roleId);
                }
            }

            logger.debug('Role permission cache invalidated', {
                roleId: event.targetId,
                affectedUsersCount: event.affectedUsers?.length || 0,
                affectedRolesCount: event.affectedRoles?.length || 0,
                reason: event.reason
            });

        } catch (error) {
            logger.error('Error processing role permission invalidation:', error);
        }
    }

    /**
     * Process role hierarchy invalidation
     */
    private async processRoleHierarchyInvalidation(
        event: CacheInvalidationEvent,
        strategy: CacheInvalidationStrategy
    ): Promise<void> {
        try {
            // Invalidate all affected role caches
            if (event.affectedRoles && event.affectedRoles.length > 0) {
                for (const roleId of event.affectedRoles) {
                    await this.cacheManager.invalidateRoleCache(roleId);
                }
            }

            // Invalidate all affected user caches
            if (strategy.cascade && event.affectedUsers && event.affectedUsers.length > 0) {
                for (const userId of event.affectedUsers) {
                    await this.cacheManager.invalidateUserCache(userId, event.workspaceId);
                }
            }

            // Invalidate hierarchy-specific cache patterns
            await this.cacheManager.invalidatePattern(`role_hier:*${event.targetId}*`);
            await this.cacheManager.invalidatePattern(`role_hier:${event.targetId}:*`);

            logger.debug('Role hierarchy cache invalidated', {
                roleId: event.targetId,
                affectedRolesCount: event.affectedRoles?.length || 0,
                affectedUsersCount: event.affectedUsers?.length || 0,
                reason: event.reason
            });

        } catch (error) {
            logger.error('Error processing role hierarchy invalidation:', error);
        }
    }

    /**
     * Queue invalidation for batch processing
     */
    private queueInvalidation(event: CacheInvalidationEvent): void {
        this.invalidationQueue.push(event);
    }

    /**
     * Start the queue processor
     */
    private startQueueProcessor(): void {
        setInterval(async () => {
            if (!this.isProcessingQueue && this.invalidationQueue.length > 0) {
                await this.processInvalidationQueue();
            }
        }, this.QUEUE_PROCESS_INTERVAL);
    }

    /**
     * Process the invalidation queue in batches
     */
    private async processInvalidationQueue(): Promise<void> {
        if (this.isProcessingQueue || this.invalidationQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            const batch = this.invalidationQueue.splice(0, this.BATCH_SIZE);

            logger.debug(`Processing cache invalidation batch of ${batch.length} items`);

            // Group events by type for efficient processing
            const userEvents = batch.filter(e => e.type === 'user_permissions');
            const roleEvents = batch.filter(e => e.type === 'role_permissions');
            const hierarchyEvents = batch.filter(e => e.type === 'role_hierarchy');

            // Process each type in parallel
            await Promise.all([
                this.processBatchUserInvalidations(userEvents),
                this.processBatchRoleInvalidations(roleEvents),
                this.processBatchHierarchyInvalidations(hierarchyEvents)
            ]);

            logger.debug(`Completed cache invalidation batch processing`);

        } catch (error) {
            logger.error('Error processing invalidation queue:', error);
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Process batch user invalidations
     */
    private async processBatchUserInvalidations(events: CacheInvalidationEvent[]): Promise<void> {
        const strategy: CacheInvalidationStrategy = {
            immediate: true,
            cascade: false,
            selective: true,
            distributed: false
        };

        for (const event of events) {
            await this.processUserPermissionInvalidation(event, strategy);
        }
    }

    /**
     * Process batch role invalidations
     */
    private async processBatchRoleInvalidations(events: CacheInvalidationEvent[]): Promise<void> {
        const strategy: CacheInvalidationStrategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: false
        };

        for (const event of events) {
            await this.processRolePermissionInvalidation(event, strategy);
        }
    }

    /**
     * Process batch hierarchy invalidations
     */
    private async processBatchHierarchyInvalidations(events: CacheInvalidationEvent[]): Promise<void> {
        const strategy: CacheInvalidationStrategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: false
        };

        for (const event of events) {
            await this.processRoleHierarchyInvalidation(event, strategy);
        }
    }

    /**
     * Setup event handlers for distributed invalidation
     */
    private setupEventHandlers(): void {
        this.on('cache_invalidation', (event: CacheInvalidationEvent) => {
            // This would be extended to handle distributed cache invalidation
            // For example, publishing to Redis pub/sub or message queue
            logger.debug('Cache invalidation event emitted', {
                type: event.type,
                targetId: event.targetId,
                reason: event.reason
            });
        });
    }

    /**
     * Get users affected by role changes
     */
    private async getAffectedUsersByRole(roleId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
        try {
            const UserRole = (await import('../models/UserRole')).default;
            const userRoles = await UserRole.find({ roleId, isActive: true }).select('userId');
            return userRoles.map(ur => ur.userId);
        } catch (error) {
            logger.error('Error getting affected users by role:', error);
            return [];
        }
    }

    /**
     * Get users affected by multiple roles
     */
    private async getAffectedUsersByRoles(roleIds: mongoose.Types.ObjectId[]): Promise<mongoose.Types.ObjectId[]> {
        try {
            const UserRole = (await import('../models/UserRole')).default;
            const userRoles = await UserRole.find({
                roleId: { $in: roleIds },
                isActive: true
            }).select('userId');

            // Remove duplicates
            const uniqueUserIds = [...new Set(userRoles.map(ur => ur.userId.toString()))]
                .map(id => new mongoose.Types.ObjectId(id));

            return uniqueUserIds;
        } catch (error) {
            logger.error('Error getting affected users by roles:', error);
            return [];
        }
    }

    /**
     * Get child roles of a role
     */
    private async getChildRoles(roleId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
        try {
            const Role = (await import('../models/Role')).default;
            const role = await Role.findById(roleId).select('childRoles');
            return role?.childRoles || [];
        } catch (error) {
            logger.error('Error getting child roles:', error);
            return [];
        }
    }

    /**
     * Get all child roles recursively
     */
    private async getAllChildRoles(roleId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
        try {
            const Role = (await import('../models/Role')).default;
            const allChildren: mongoose.Types.ObjectId[] = [];
            const visited = new Set<string>();

            const getChildren = async (currentRoleId: mongoose.Types.ObjectId): Promise<void> => {
                if (visited.has(currentRoleId.toString())) {
                    return;
                }
                visited.add(currentRoleId.toString());

                const role = await Role.findById(currentRoleId).select('childRoles');
                if (role && role.childRoles && role.childRoles.length > 0) {
                    allChildren.push(...role.childRoles);

                    for (const childId of role.childRoles) {
                        await getChildren(childId);
                    }
                }
            };

            await getChildren(roleId);
            return allChildren;
        } catch (error) {
            logger.error('Error getting all child roles:', error);
            return [];
        }
    }

    /**
     * Get parent roles of a role
     */
    private async getParentRoles(roleId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
        try {
            const Role = (await import('../models/Role')).default;
            const parents: mongoose.Types.ObjectId[] = [];
            const visited = new Set<string>();

            const getParents = async (currentRoleId: mongoose.Types.ObjectId): Promise<void> => {
                if (visited.has(currentRoleId.toString())) {
                    return;
                }
                visited.add(currentRoleId.toString());

                const role = await Role.findById(currentRoleId).select('parentRole');
                if (role && role.parentRole) {
                    parents.push(role.parentRole);
                    await getParents(role.parentRole);
                }
            };

            await getParents(roleId);
            return parents;
        } catch (error) {
            logger.error('Error getting parent roles:', error);
            return [];
        }
    }

    /**
     * Get cache invalidation statistics
     */
    public getInvalidationStats(): {
        queueSize: number;
        isProcessing: boolean;
        batchSize: number;
        processInterval: number;
    } {
        return {
            queueSize: this.invalidationQueue.length,
            isProcessing: this.isProcessingQueue,
            batchSize: this.BATCH_SIZE,
            processInterval: this.QUEUE_PROCESS_INTERVAL
        };
    }

    /**
     * Clear the invalidation queue
     */
    public clearQueue(): void {
        this.invalidationQueue = [];
        logger.info('Cache invalidation queue cleared');
    }
}

export default CacheInvalidationService;