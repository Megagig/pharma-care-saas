"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CacheManager_1 = __importDefault(require("./CacheManager"));
const logger_1 = __importDefault(require("../utils/logger"));
const events_1 = require("events");
class CacheInvalidationService extends events_1.EventEmitter {
    constructor() {
        super();
        this.invalidationQueue = [];
        this.isProcessingQueue = false;
        this.BATCH_SIZE = 50;
        this.QUEUE_PROCESS_INTERVAL = 1000;
        this.cacheManager = CacheManager_1.default.getInstance();
        this.startQueueProcessor();
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!CacheInvalidationService.instance) {
            CacheInvalidationService.instance = new CacheInvalidationService();
        }
        return CacheInvalidationService.instance;
    }
    async invalidateUserPermissions(userId, options) {
        const strategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };
        const event = {
            type: 'user_permissions',
            targetId: userId,
            workspaceId: options.workspaceId,
            reason: options.reason,
            timestamp: new Date(),
            initiatedBy: options.initiatedBy
        };
        if (strategy.immediate) {
            await this.processUserPermissionInvalidation(event, strategy);
        }
        else {
            this.queueInvalidation(event);
        }
        if (strategy.distributed) {
            this.emit('cache_invalidation', event);
        }
        logger_1.default.debug('User permission cache invalidation initiated', {
            userId,
            workspaceId: options.workspaceId,
            reason: options.reason,
            strategy
        });
    }
    async invalidateRolePermissions(roleId, options) {
        const strategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };
        const [affectedUsers, childRoles] = await Promise.all([
            this.getAffectedUsersByRole(roleId),
            this.getChildRoles(roleId)
        ]);
        const event = {
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
        }
        else {
            this.queueInvalidation(event);
        }
        if (strategy.distributed) {
            this.emit('cache_invalidation', event);
        }
        logger_1.default.debug('Role permission cache invalidation initiated', {
            roleId,
            affectedUsersCount: affectedUsers.length,
            childRolesCount: childRoles.length,
            reason: options.reason,
            strategy
        });
    }
    async invalidateRoleHierarchy(roleId, options) {
        const strategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };
        const [parentRoles, childRoles] = await Promise.all([
            this.getParentRoles(roleId),
            this.getAllChildRoles(roleId)
        ]);
        const affectedRoles = [roleId, ...parentRoles, ...childRoles];
        const affectedUsers = await this.getAffectedUsersByRoles(affectedRoles);
        const event = {
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
        }
        else {
            this.queueInvalidation(event);
        }
        if (strategy.distributed) {
            this.emit('cache_invalidation', event);
        }
        logger_1.default.debug('Role hierarchy cache invalidation initiated', {
            roleId,
            affectedRolesCount: affectedRoles.length,
            affectedUsersCount: affectedUsers.length,
            reason: options.reason,
            strategy
        });
    }
    async bulkInvalidate(invalidations, options = {}) {
        const strategy = {
            immediate: false,
            cascade: true,
            selective: true,
            distributed: true,
            ...options.strategy
        };
        const events = [];
        for (const invalidation of invalidations) {
            let event;
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
        this.invalidationQueue.push(...events);
        if (strategy.distributed) {
            events.forEach(event => this.emit('cache_invalidation', event));
        }
        logger_1.default.info('Bulk cache invalidation queued', {
            count: events.length,
            initiatedBy: options.initiatedBy,
            strategy
        });
    }
    async processUserPermissionInvalidation(event, strategy) {
        try {
            await this.cacheManager.invalidateUserCache(event.targetId, event.workspaceId);
            logger_1.default.debug('User permission cache invalidated', {
                userId: event.targetId,
                workspaceId: event.workspaceId,
                reason: event.reason
            });
        }
        catch (error) {
            logger_1.default.error('Error processing user permission invalidation:', error);
        }
    }
    async processRolePermissionInvalidation(event, strategy) {
        try {
            await this.cacheManager.invalidateRoleCache(event.targetId);
            if (strategy.cascade && event.affectedUsers && event.affectedUsers.length > 0) {
                for (const userId of event.affectedUsers) {
                    await this.cacheManager.invalidateUserCache(userId, event.workspaceId);
                }
            }
            if (strategy.cascade && event.affectedRoles && event.affectedRoles.length > 0) {
                for (const roleId of event.affectedRoles) {
                    await this.cacheManager.invalidateRoleCache(roleId);
                }
            }
            logger_1.default.debug('Role permission cache invalidated', {
                roleId: event.targetId,
                affectedUsersCount: event.affectedUsers?.length || 0,
                affectedRolesCount: event.affectedRoles?.length || 0,
                reason: event.reason
            });
        }
        catch (error) {
            logger_1.default.error('Error processing role permission invalidation:', error);
        }
    }
    async processRoleHierarchyInvalidation(event, strategy) {
        try {
            if (event.affectedRoles && event.affectedRoles.length > 0) {
                for (const roleId of event.affectedRoles) {
                    await this.cacheManager.invalidateRoleCache(roleId);
                }
            }
            if (strategy.cascade && event.affectedUsers && event.affectedUsers.length > 0) {
                for (const userId of event.affectedUsers) {
                    await this.cacheManager.invalidateUserCache(userId, event.workspaceId);
                }
            }
            await this.cacheManager.invalidatePattern(`role_hier:*${event.targetId}*`);
            await this.cacheManager.invalidatePattern(`role_hier:${event.targetId}:*`);
            logger_1.default.debug('Role hierarchy cache invalidated', {
                roleId: event.targetId,
                affectedRolesCount: event.affectedRoles?.length || 0,
                affectedUsersCount: event.affectedUsers?.length || 0,
                reason: event.reason
            });
        }
        catch (error) {
            logger_1.default.error('Error processing role hierarchy invalidation:', error);
        }
    }
    queueInvalidation(event) {
        this.invalidationQueue.push(event);
    }
    startQueueProcessor() {
        setInterval(async () => {
            if (!this.isProcessingQueue && this.invalidationQueue.length > 0) {
                await this.processInvalidationQueue();
            }
        }, this.QUEUE_PROCESS_INTERVAL);
    }
    async processInvalidationQueue() {
        if (this.isProcessingQueue || this.invalidationQueue.length === 0) {
            return;
        }
        this.isProcessingQueue = true;
        try {
            const batch = this.invalidationQueue.splice(0, this.BATCH_SIZE);
            logger_1.default.debug(`Processing cache invalidation batch of ${batch.length} items`);
            const userEvents = batch.filter(e => e.type === 'user_permissions');
            const roleEvents = batch.filter(e => e.type === 'role_permissions');
            const hierarchyEvents = batch.filter(e => e.type === 'role_hierarchy');
            await Promise.all([
                this.processBatchUserInvalidations(userEvents),
                this.processBatchRoleInvalidations(roleEvents),
                this.processBatchHierarchyInvalidations(hierarchyEvents)
            ]);
            logger_1.default.debug(`Completed cache invalidation batch processing`);
        }
        catch (error) {
            logger_1.default.error('Error processing invalidation queue:', error);
        }
        finally {
            this.isProcessingQueue = false;
        }
    }
    async processBatchUserInvalidations(events) {
        const strategy = {
            immediate: true,
            cascade: false,
            selective: true,
            distributed: false
        };
        for (const event of events) {
            await this.processUserPermissionInvalidation(event, strategy);
        }
    }
    async processBatchRoleInvalidations(events) {
        const strategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: false
        };
        for (const event of events) {
            await this.processRolePermissionInvalidation(event, strategy);
        }
    }
    async processBatchHierarchyInvalidations(events) {
        const strategy = {
            immediate: true,
            cascade: true,
            selective: true,
            distributed: false
        };
        for (const event of events) {
            await this.processRoleHierarchyInvalidation(event, strategy);
        }
    }
    setupEventHandlers() {
        this.on('cache_invalidation', (event) => {
            logger_1.default.debug('Cache invalidation event emitted', {
                type: event.type,
                targetId: event.targetId,
                reason: event.reason
            });
        });
    }
    async getAffectedUsersByRole(roleId) {
        try {
            const UserRole = (await Promise.resolve().then(() => __importStar(require('../models/UserRole')))).default;
            const userRoles = await UserRole.find({ roleId, isActive: true }).select('userId');
            return userRoles.map(ur => ur.userId);
        }
        catch (error) {
            logger_1.default.error('Error getting affected users by role:', error);
            return [];
        }
    }
    async getAffectedUsersByRoles(roleIds) {
        try {
            const UserRole = (await Promise.resolve().then(() => __importStar(require('../models/UserRole')))).default;
            const userRoles = await UserRole.find({
                roleId: { $in: roleIds },
                isActive: true
            }).select('userId');
            const uniqueUserIds = [...new Set(userRoles.map(ur => ur.userId.toString()))]
                .map(id => new mongoose_1.default.Types.ObjectId(id));
            return uniqueUserIds;
        }
        catch (error) {
            logger_1.default.error('Error getting affected users by roles:', error);
            return [];
        }
    }
    async getChildRoles(roleId) {
        try {
            const Role = (await Promise.resolve().then(() => __importStar(require('../models/Role')))).default;
            const role = await Role.findById(roleId).select('childRoles');
            return role?.childRoles || [];
        }
        catch (error) {
            logger_1.default.error('Error getting child roles:', error);
            return [];
        }
    }
    async getAllChildRoles(roleId) {
        try {
            const Role = (await Promise.resolve().then(() => __importStar(require('../models/Role')))).default;
            const allChildren = [];
            const visited = new Set();
            const getChildren = async (currentRoleId) => {
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
        }
        catch (error) {
            logger_1.default.error('Error getting all child roles:', error);
            return [];
        }
    }
    async getParentRoles(roleId) {
        try {
            const Role = (await Promise.resolve().then(() => __importStar(require('../models/Role')))).default;
            const parents = [];
            const visited = new Set();
            const getParents = async (currentRoleId) => {
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
        }
        catch (error) {
            logger_1.default.error('Error getting parent roles:', error);
            return [];
        }
    }
    getInvalidationStats() {
        return {
            queueSize: this.invalidationQueue.length,
            isProcessing: this.isProcessingQueue,
            batchSize: this.BATCH_SIZE,
            processInterval: this.QUEUE_PROCESS_INTERVAL
        };
    }
    clearQueue() {
        this.invalidationQueue = [];
        logger_1.default.info('Cache invalidation queue cleared');
    }
}
exports.default = CacheInvalidationService;
//# sourceMappingURL=CacheInvalidationService.js.map