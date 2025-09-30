"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
class DatabaseOptimizationService {
    constructor() {
        this.queryMetrics = [];
        this.MAX_METRICS_HISTORY = 1000;
        this.SLOW_QUERY_THRESHOLD = 100;
        this.setupQueryProfiling();
    }
    static getInstance() {
        if (!DatabaseOptimizationService.instance) {
            DatabaseOptimizationService.instance = new DatabaseOptimizationService();
        }
        return DatabaseOptimizationService.instance;
    }
    async createOptimizedIndexes() {
        try {
            logger_1.default.info('Creating optimized indexes for RBAC collections');
            await this.createUserIndexes();
            await this.createRoleIndexes();
            await this.createUserRoleIndexes();
            await this.createRolePermissionIndexes();
            await this.createPermissionIndexes();
            await this.createAuditLogIndexes();
            logger_1.default.info('Optimized indexes created successfully');
        }
        catch (error) {
            logger_1.default.error('Error creating optimized indexes:', error);
            throw error;
        }
    }
    async createUserIndexes() {
        try {
            const User = mongoose_1.default.model('User');
            const indexes = [
                { role: 1, status: 1, licenseStatus: 1 },
                { directPermissions: 1, status: 1 },
                { deniedPermissions: 1, status: 1 },
                { assignedRoles: 1, status: 1 },
                { roleLastModifiedAt: -1, status: 1 },
                { licenseStatus: 1, role: 1 },
            ];
            for (const indexSpec of indexes) {
                try {
                    await User.collection.createIndex(indexSpec, { background: true });
                    logger_1.default.debug(`Created User index: ${JSON.stringify(indexSpec)}`);
                }
                catch (error) {
                    if (error.code !== 85) {
                        logger_1.default.warn(`Failed to create User index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('User model not available, skipping user indexes');
        }
    }
    async createRoleIndexes() {
        try {
            const Role = mongoose_1.default.model('Role');
            const indexes = [
                { hierarchyLevel: 1, parentRole: 1, isActive: 1 },
                { parentRole: 1, hierarchyLevel: 1, isActive: 1 },
                { category: 1, isActive: 1, isSystemRole: 1 },
                { workspaceId: 1, category: 1, isActive: 1 },
                { hierarchyLevel: 1, isActive: 1 },
            ];
            for (const indexSpec of indexes) {
                try {
                    await Role.collection.createIndex(indexSpec, { background: true });
                    logger_1.default.debug(`Created Role index: ${JSON.stringify(indexSpec)}`);
                }
                catch (error) {
                    if (error.code !== 85) {
                        logger_1.default.warn(`Failed to create Role index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('Role model not available, skipping role indexes');
        }
    }
    async createUserRoleIndexes() {
        try {
            const UserRole = mongoose_1.default.model('UserRole');
            const indexes = [
                { userId: 1, isActive: 1, isTemporary: 1, expiresAt: 1 },
                { roleId: 1, workspaceId: 1, isActive: 1 },
                { isTemporary: 1, expiresAt: 1, isActive: 1 },
                { assignedBy: 1, assignedAt: -1, isActive: 1 },
                { revokedBy: 1, revokedAt: -1 },
                { workspaceId: 1, userId: 1, isActive: 1 },
            ];
            for (const indexSpec of indexes) {
                try {
                    await UserRole.collection.createIndex(indexSpec, { background: true });
                    logger_1.default.debug(`Created UserRole index: ${JSON.stringify(indexSpec)}`);
                }
                catch (error) {
                    if (error.code !== 85) {
                        logger_1.default.warn(`Failed to create UserRole index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('UserRole model not available, skipping user role indexes');
        }
    }
    async createRolePermissionIndexes() {
        try {
            const RolePermission = mongoose_1.default.model('RolePermission');
            const indexes = [
                { roleId: 1, granted: 1, priority: -1, isActive: 1 },
                { permissionAction: 1, granted: 1, priority: -1, isActive: 1 },
                { permissionAction: 1, priority: -1, granted: 1, isActive: 1 },
                { grantedBy: 1, grantedAt: -1, isActive: 1 },
                { lastModifiedBy: 1, updatedAt: -1 },
            ];
            for (const indexSpec of indexes) {
                try {
                    await RolePermission.collection.createIndex(indexSpec, { background: true });
                    logger_1.default.debug(`Created RolePermission index: ${JSON.stringify(indexSpec)}`);
                }
                catch (error) {
                    if (error.code !== 85) {
                        logger_1.default.warn(`Failed to create RolePermission index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('RolePermission model not available, skipping role permission indexes');
        }
    }
    async createPermissionIndexes() {
        try {
            const Permission = mongoose_1.default.model('Permission');
            const indexes = [
                { action: 1, isActive: 1 },
                { resource: 1, isActive: 1 },
                { category: 1, resource: 1, isActive: 1 },
                { isSystemPermission: 1, isActive: 1 },
            ];
            for (const indexSpec of indexes) {
                try {
                    await Permission.collection.createIndex(indexSpec, { background: true });
                    logger_1.default.debug(`Created Permission index: ${JSON.stringify(indexSpec)}`);
                }
                catch (error) {
                    if (error.code !== 85) {
                        logger_1.default.warn(`Failed to create Permission index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('Permission model not available, skipping permission indexes');
        }
    }
    async createAuditLogIndexes() {
        try {
            const AuditLog = mongoose_1.default.model('AuditLog');
            const indexes = [
                { userId: 1, timestamp: -1, action: 1 },
                { 'details.permission': 1, timestamp: -1 },
                { 'details.roleId': 1, timestamp: -1 },
                { workspaceId: 1, timestamp: -1, action: 1 },
                { action: 1, result: 1, timestamp: -1 },
            ];
            for (const indexSpec of indexes) {
                try {
                    const options = { background: true };
                    await AuditLog.collection.createIndex(indexSpec, options);
                    logger_1.default.debug(`Created AuditLog index: ${JSON.stringify(indexSpec)}`);
                }
                catch (error) {
                    if (error.code !== 85) {
                        logger_1.default.warn(`Failed to create AuditLog index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('AuditLog model not available, skipping audit log indexes');
        }
    }
    setupQueryProfiling() {
        mongoose_1.default.connection.on('connected', async () => {
            try {
                if (process.env.MONGODB_URI?.includes('mongodb.net') || process.env.DISABLE_PROFILING === 'true') {
                    logger_1.default.info('Database profiling skipped (Atlas or disabled)');
                    return;
                }
                const db = mongoose_1.default.connection.db;
                await db.command({ profile: 2, slowms: this.SLOW_QUERY_THRESHOLD });
                logger_1.default.info('Database profiling enabled for slow queries');
            }
            catch (error) {
                logger_1.default.warn('Failed to enable database profiling (likely Atlas):', error);
            }
        });
    }
    async analyzeQueryPerformance() {
        try {
            const slowQueries = await this.getSlowQueries();
            const indexRecommendations = await this.generateIndexRecommendations(slowQueries);
            const connectionPoolStats = await this.getConnectionPoolStats();
            const collectionStats = await this.getCollectionStats();
            const report = {
                slowQueries,
                indexRecommendations,
                connectionPoolStats,
                collectionStats,
                timestamp: new Date()
            };
            logger_1.default.info('Database optimization analysis completed', {
                slowQueriesCount: slowQueries.length,
                recommendationsCount: indexRecommendations.length
            });
            return report;
        }
        catch (error) {
            logger_1.default.error('Error analyzing query performance:', error);
            throw error;
        }
    }
    async getSlowQueries() {
        try {
            const db = mongoose_1.default.connection.db;
            const profilerCollection = db.collection('system.profile');
            const slowQueries = await profilerCollection
                .find({
                ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                millis: { $gte: this.SLOW_QUERY_THRESHOLD }
            })
                .sort({ ts: -1 })
                .limit(100)
                .toArray();
            return slowQueries.map(query => ({
                query: JSON.stringify(query.command),
                executionTime: query.millis,
                documentsExamined: query.docsExamined || 0,
                documentsReturned: query.docsReturned || 0,
                indexUsed: !!query.planSummary && !query.planSummary.includes('COLLSCAN'),
                indexName: query.planSummary,
                timestamp: query.ts
            }));
        }
        catch (error) {
            logger_1.default.warn('Failed to get slow queries from profiler:', error);
            return [];
        }
    }
    async generateIndexRecommendations(slowQueries) {
        const recommendations = [];
        recommendations.push(...this.getRBACSpecificRecommendations());
        return recommendations;
    }
    getRBACSpecificRecommendations() {
        return [
            {
                collection: 'users',
                indexSpec: { assignedRoles: 1, status: 1, licenseStatus: 1 },
                reason: 'Optimize user permission resolution queries',
                estimatedImprovement: 70,
                priority: 'high'
            },
            {
                collection: 'user_roles',
                indexSpec: { userId: 1, isActive: 1, expiresAt: 1 },
                reason: 'Optimize active role lookup with expiration check',
                estimatedImprovement: 60,
                priority: 'high'
            },
            {
                collection: 'role_permissions',
                indexSpec: { roleId: 1, permissionAction: 1, priority: -1 },
                reason: 'Optimize permission resolution with priority ordering',
                estimatedImprovement: 80,
                priority: 'high'
            },
            {
                collection: 'roles',
                indexSpec: { parentRole: 1, hierarchyLevel: 1, isActive: 1 },
                reason: 'Optimize role hierarchy traversal',
                estimatedImprovement: 65,
                priority: 'medium'
            }
        ];
    }
    async getConnectionPoolStats() {
        try {
            const db = mongoose_1.default.connection.db;
            const serverStatus = await db.admin().serverStatus();
            return {
                connections: serverStatus.connections,
                network: serverStatus.network,
                opcounters: serverStatus.opcounters
            };
        }
        catch (error) {
            logger_1.default.warn('Failed to get connection pool stats:', error);
            return {};
        }
    }
    async getCollectionStats() {
        try {
            const db = mongoose_1.default.connection.db;
            const collections = ['users', 'roles', 'user_roles', 'role_permissions', 'permissions', 'audit_logs'];
            const stats = {};
            for (const collectionName of collections) {
                try {
                    const collStats = await db.collection(collectionName).stats();
                    stats[collectionName] = {
                        count: collStats.count,
                        size: collStats.size,
                        avgObjSize: collStats.avgObjSize,
                        indexCount: collStats.nindexes,
                        totalIndexSize: collStats.totalIndexSize
                    };
                }
                catch (error) {
                    stats[collectionName] = { error: 'Collection not found' };
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.default.warn('Failed to get collection stats:', error);
            return {};
        }
    }
    async optimizeConnectionPool() {
        try {
            const stats = await this.getConnectionPoolStats();
            logger_1.default.info('Current connection pool configuration', {
                currentConnections: stats.connections?.current || 0,
                availableConnections: stats.connections?.available || 0
            });
        }
        catch (error) {
            logger_1.default.error('Error optimizing connection pool:', error);
        }
    }
    recordQueryMetrics(metrics) {
        this.queryMetrics.push(metrics);
        if (this.queryMetrics.length > this.MAX_METRICS_HISTORY) {
            this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_HISTORY);
        }
        if (metrics.executionTime > this.SLOW_QUERY_THRESHOLD) {
            logger_1.default.warn('Slow query detected', {
                query: metrics.query,
                executionTime: metrics.executionTime,
                documentsExamined: metrics.documentsExamined,
                indexUsed: metrics.indexUsed
            });
        }
    }
    getQueryStats() {
        if (this.queryMetrics.length === 0) {
            return {
                totalQueries: 0,
                slowQueries: 0,
                averageExecutionTime: 0,
                indexUsageRate: 0
            };
        }
        const slowQueries = this.queryMetrics.filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD);
        const totalExecutionTime = this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0);
        const indexedQueries = this.queryMetrics.filter(m => m.indexUsed);
        return {
            totalQueries: this.queryMetrics.length,
            slowQueries: slowQueries.length,
            averageExecutionTime: totalExecutionTime / this.queryMetrics.length,
            indexUsageRate: (indexedQueries.length / this.queryMetrics.length) * 100
        };
    }
}
exports.default = DatabaseOptimizationService;
//# sourceMappingURL=DatabaseOptimizationService.js.map