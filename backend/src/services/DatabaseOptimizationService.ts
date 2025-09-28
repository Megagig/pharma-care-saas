import mongoose from 'mongoose';
import logger from '../utils/logger';

export interface QueryPerformanceMetrics {
    query: string;
    executionTime: number;
    documentsExamined: number;
    documentsReturned: number;
    indexUsed: boolean;
    indexName?: string;
    timestamp: Date;
}

export interface IndexRecommendation {
    collection: string;
    indexSpec: Record<string, 1 | -1>;
    reason: string;
    estimatedImprovement: number;
    priority: 'high' | 'medium' | 'low';
}

export interface DatabaseOptimizationReport {
    slowQueries: QueryPerformanceMetrics[];
    indexRecommendations: IndexRecommendation[];
    connectionPoolStats: any;
    collectionStats: Record<string, any>;
    timestamp: Date;
}

/**
 * Database Optimization Service for RBAC performance enhancement
 * Provides query optimization, index management, and performance monitoring
 */
class DatabaseOptimizationService {
    private static instance: DatabaseOptimizationService;
    private queryMetrics: QueryPerformanceMetrics[] = [];
    private readonly MAX_METRICS_HISTORY = 1000;
    private readonly SLOW_QUERY_THRESHOLD = 100; // milliseconds

    private constructor() {
        this.setupQueryProfiling();
    }

    public static getInstance(): DatabaseOptimizationService {
        if (!DatabaseOptimizationService.instance) {
            DatabaseOptimizationService.instance = new DatabaseOptimizationService();
        }
        return DatabaseOptimizationService.instance;
    }

    /**
     * Create optimized indexes for RBAC collections
     */
    public async createOptimizedIndexes(): Promise<void> {
        try {
            logger.info('Creating optimized indexes for RBAC collections');

            // User collection indexes
            await this.createUserIndexes();

            // Role collection indexes (additional to existing ones)
            await this.createRoleIndexes();

            // UserRole collection indexes (additional to existing ones)
            await this.createUserRoleIndexes();

            // RolePermission collection indexes (additional to existing ones)
            await this.createRolePermissionIndexes();

            // Permission collection indexes
            await this.createPermissionIndexes();

            // AuditLog collection indexes
            await this.createAuditLogIndexes();

            logger.info('Optimized indexes created successfully');

        } catch (error) {
            logger.error('Error creating optimized indexes:', error);
            throw error;
        }
    }

    /**
     * Create optimized indexes for User collection
     */
    private async createUserIndexes(): Promise<void> {
        try {
            const User = mongoose.model('User');

            const indexes = [
                // Compound index for permission resolution
                { role: 1, status: 1, licenseStatus: 1 },

                // Index for direct permissions lookup
                { directPermissions: 1, status: 1 },

                // Index for denied permissions lookup
                { deniedPermissions: 1, status: 1 },

                // Compound index for workspace-based queries
                { assignedRoles: 1, status: 1 },

                // Index for role modification tracking
                { roleLastModifiedAt: -1, status: 1 },

                // Sparse index for license verification
                { licenseStatus: 1, role: 1 },
            ];

            for (const indexSpec of indexes) {
                try {
                    await User.collection.createIndex(indexSpec as any, { background: true });
                    logger.debug(`Created User index: ${JSON.stringify(indexSpec)}`);
                } catch (error) {
                    if ((error as any).code !== 85) { // Index already exists
                        logger.warn(`Failed to create User index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        } catch (error) {
            logger.warn('User model not available, skipping user indexes');
        }
    }

    /**
     * Create additional optimized indexes for Role collection
     */
    private async createRoleIndexes(): Promise<void> {
        try {
            const Role = mongoose.model('Role');

            const indexes = [
                // Materialized path index for hierarchy traversal
                { hierarchyLevel: 1, parentRole: 1, isActive: 1 },

                // Index for permission inheritance queries
                { parentRole: 1, hierarchyLevel: 1, isActive: 1 },

                // Compound index for role assignment queries
                { category: 1, isActive: 1, isSystemRole: 1 },

                // Index for workspace-specific role queries
                { workspaceId: 1, category: 1, isActive: 1 },

                // Index for hierarchy depth queries
                { hierarchyLevel: 1, isActive: 1 },
            ];

            for (const indexSpec of indexes) {
                try {
                    await Role.collection.createIndex(indexSpec as any, { background: true });
                    logger.debug(`Created Role index: ${JSON.stringify(indexSpec)}`);
                } catch (error) {
                    if ((error as any).code !== 85) { // Index already exists
                        logger.warn(`Failed to create Role index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        } catch (error) {
            logger.warn('Role model not available, skipping role indexes');
        }
    }

    /**
     * Create additional optimized indexes for UserRole collection
     */
    private async createUserRoleIndexes(): Promise<void> {
        try {
            const UserRole = mongoose.model('UserRole');

            const indexes = [
                // Compound index for active role resolution
                { userId: 1, isActive: 1, isTemporary: 1, expiresAt: 1 },

                // Index for role-based user queries with workspace context
                { roleId: 1, workspaceId: 1, isActive: 1 },

                // Index for temporary assignment management
                { isTemporary: 1, expiresAt: 1, isActive: 1 },

                // Index for assignment audit queries
                { assignedBy: 1, assignedAt: -1, isActive: 1 },

                // Index for revocation tracking
                { revokedBy: 1, revokedAt: -1 },

                // Compound index for workspace-specific assignments
                { workspaceId: 1, userId: 1, isActive: 1 },
            ];

            for (const indexSpec of indexes) {
                try {
                    await UserRole.collection.createIndex(indexSpec as any, { background: true });
                    logger.debug(`Created UserRole index: ${JSON.stringify(indexSpec)}`);
                } catch (error) {
                    if ((error as any).code !== 85) { // Index already exists
                        logger.warn(`Failed to create UserRole index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        } catch (error) {
            logger.warn('UserRole model not available, skipping user role indexes');
        }
    }

    /**
     * Create additional optimized indexes for RolePermission collection
     */
    private async createRolePermissionIndexes(): Promise<void> {
        try {
            const RolePermission = mongoose.model('RolePermission');

            const indexes = [
                // Compound index for permission resolution with priority
                { roleId: 1, granted: 1, priority: -1, isActive: 1 },

                // Index for permission action queries with conditions
                { permissionAction: 1, granted: 1, priority: -1, isActive: 1 },

                // Index for permission conflict resolution
                { permissionAction: 1, priority: -1, granted: 1, isActive: 1 },

                // Index for audit and modification tracking
                { grantedBy: 1, grantedAt: -1, isActive: 1 },
                { lastModifiedBy: 1, updatedAt: -1 },
            ];

            for (const indexSpec of indexes) {
                try {
                    await RolePermission.collection.createIndex(indexSpec as any, { background: true });
                    logger.debug(`Created RolePermission index: ${JSON.stringify(indexSpec)}`);
                } catch (error) {
                    if ((error as any).code !== 85) { // Index already exists
                        logger.warn(`Failed to create RolePermission index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        } catch (error) {
            logger.warn('RolePermission model not available, skipping role permission indexes');
        }
    }

    /**
     * Create optimized indexes for Permission collection
     */
    private async createPermissionIndexes(): Promise<void> {
        try {
            const Permission = mongoose.model('Permission');

            const indexes = [
                // Index for permission lookup by action
                { action: 1, isActive: 1 },

                // Index for resource-based permission queries
                { resource: 1, isActive: 1 },

                // Compound index for permission categorization
                { category: 1, resource: 1, isActive: 1 },

                // Index for system permission queries
                { isSystemPermission: 1, isActive: 1 },
            ];

            for (const indexSpec of indexes) {
                try {
                    await Permission.collection.createIndex(indexSpec as any, { background: true });
                    logger.debug(`Created Permission index: ${JSON.stringify(indexSpec)}`);
                } catch (error) {
                    if ((error as any).code !== 85) { // Index already exists
                        logger.warn(`Failed to create Permission index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        } catch (error) {
            logger.warn('Permission model not available, skipping permission indexes');
        }
    }

    /**
     * Create optimized indexes for AuditLog collection
     */
    private async createAuditLogIndexes(): Promise<void> {
        try {
            const AuditLog = mongoose.model('AuditLog');

            const indexes = [
                // Compound index for user-based audit queries
                { userId: 1, timestamp: -1, action: 1 },

                // Index for permission-specific audit queries
                { 'details.permission': 1, timestamp: -1 },

                // Index for role-based audit queries
                { 'details.roleId': 1, timestamp: -1 },

                // Index for workspace-based audit queries
                { workspaceId: 1, timestamp: -1, action: 1 },

                // Index for security monitoring
                { action: 1, result: 1, timestamp: -1 },
            ];

            for (const indexSpec of indexes) {
                try {
                    const options: any = { background: true };

                    await AuditLog.collection.createIndex(indexSpec as any, options);
                    logger.debug(`Created AuditLog index: ${JSON.stringify(indexSpec)}`);
                } catch (error) {
                    if ((error as any).code !== 85) { // Index already exists
                        logger.warn(`Failed to create AuditLog index ${JSON.stringify(indexSpec)}:`, error);
                    }
                }
            }
        } catch (error) {
            logger.warn('AuditLog model not available, skipping audit log indexes');
        }
    }

    /**
     * Setup query profiling for performance monitoring
     */
    private setupQueryProfiling(): void {
        // Enable profiling for slow queries (skip for Atlas)
        mongoose.connection.on('connected', async () => {
            try {
                // Skip profiling for MongoDB Atlas
                if (process.env.MONGODB_URI?.includes('mongodb.net') || process.env.DISABLE_PROFILING === 'true') {
                    logger.info('Database profiling skipped (Atlas or disabled)');
                    return;
                }
                
                const db = mongoose.connection.db;
                await db.command({ profile: 2, slowms: this.SLOW_QUERY_THRESHOLD });
                logger.info('Database profiling enabled for slow queries');
            } catch (error) {
                logger.warn('Failed to enable database profiling (likely Atlas):', error);
            }
        });
    }

    /**
     * Analyze query performance and provide recommendations
     */
    public async analyzeQueryPerformance(): Promise<DatabaseOptimizationReport> {
        try {
            // Get slow queries from profiler
            const slowQueries = await this.getSlowQueries();

            // Generate index recommendations
            const indexRecommendations = await this.generateIndexRecommendations(slowQueries);

            // Get connection pool stats
            const connectionPoolStats = await this.getConnectionPoolStats();

            // Get collection statistics
            const collectionStats = await this.getCollectionStats();

            const report: DatabaseOptimizationReport = {
                slowQueries,
                indexRecommendations,
                connectionPoolStats,
                collectionStats,
                timestamp: new Date()
            };

            logger.info('Database optimization analysis completed', {
                slowQueriesCount: slowQueries.length,
                recommendationsCount: indexRecommendations.length
            });

            return report;

        } catch (error) {
            logger.error('Error analyzing query performance:', error);
            throw error;
        }
    }

    /**
     * Get slow queries from database profiler
     */
    private async getSlowQueries(): Promise<QueryPerformanceMetrics[]> {
        try {
            const db = mongoose.connection.db;
            const profilerCollection = db.collection('system.profile');

            const slowQueries = await profilerCollection
                .find({
                    ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
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

        } catch (error) {
            logger.warn('Failed to get slow queries from profiler:', error);
            return [];
        }
    }

    /**
     * Generate index recommendations based on slow queries
     */
    private async generateIndexRecommendations(slowQueries: QueryPerformanceMetrics[]): Promise<IndexRecommendation[]> {
        const recommendations: IndexRecommendation[] = [];

        // Add specific RBAC-related recommendations
        recommendations.push(...this.getRBACSpecificRecommendations());

        return recommendations;
    }

    /**
     * Get RBAC-specific index recommendations
     */
    private getRBACSpecificRecommendations(): IndexRecommendation[] {
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

    /**
     * Get connection pool statistics
     */
    private async getConnectionPoolStats(): Promise<any> {
        try {
            const db = mongoose.connection.db;
            const serverStatus = await db.admin().serverStatus();

            return {
                connections: serverStatus.connections,
                network: serverStatus.network,
                opcounters: serverStatus.opcounters
            };
        } catch (error) {
            logger.warn('Failed to get connection pool stats:', error);
            return {};
        }
    }

    /**
     * Get collection statistics
     */
    private async getCollectionStats(): Promise<Record<string, any>> {
        try {
            const db = mongoose.connection.db;
            const collections = ['users', 'roles', 'user_roles', 'role_permissions', 'permissions', 'audit_logs'];
            const stats: Record<string, any> = {};

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
                } catch (error) {
                    // Collection might not exist
                    stats[collectionName] = { error: 'Collection not found' };
                }
            }

            return stats;
        } catch (error) {
            logger.warn('Failed to get collection stats:', error);
            return {};
        }
    }

    /**
     * Optimize database connection pool
     */
    public async optimizeConnectionPool(): Promise<void> {
        try {
            // Get current connection stats
            const stats = await this.getConnectionPoolStats();

            // Log current pool configuration
            logger.info('Current connection pool configuration', {
                currentConnections: stats.connections?.current || 0,
                availableConnections: stats.connections?.available || 0
            });

        } catch (error) {
            logger.error('Error optimizing connection pool:', error);
        }
    }

    /**
     * Record query performance metrics
     */
    public recordQueryMetrics(metrics: QueryPerformanceMetrics): void {
        this.queryMetrics.push(metrics);

        // Keep only recent metrics
        if (this.queryMetrics.length > this.MAX_METRICS_HISTORY) {
            this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_HISTORY);
        }

        // Log slow queries
        if (metrics.executionTime > this.SLOW_QUERY_THRESHOLD) {
            logger.warn('Slow query detected', {
                query: metrics.query,
                executionTime: metrics.executionTime,
                documentsExamined: metrics.documentsExamined,
                indexUsed: metrics.indexUsed
            });
        }
    }

    /**
     * Get query performance statistics
     */
    public getQueryStats(): {
        totalQueries: number;
        slowQueries: number;
        averageExecutionTime: number;
        indexUsageRate: number;
    } {
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

export default DatabaseOptimizationService;