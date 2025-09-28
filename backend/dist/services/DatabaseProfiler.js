"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
class DatabaseProfiler {
    constructor() {
        this.slowQueries = [];
        this.maxSlowQueries = 1000;
        this.profilingEnabled = false;
    }
    async enableProfiling(slowMs = 100) {
        try {
            const db = mongoose_1.default.connection.db;
            await db.command({
                profile: 1,
                slowms: slowMs,
                sampleRate: 1.0
            });
            this.profilingEnabled = true;
            console.log(`Database profiling enabled for operations slower than ${slowMs}ms`);
            this.startProfilingCollection();
        }
        catch (error) {
            console.error('Failed to enable database profiling:', error);
            throw error;
        }
    }
    async disableProfiling() {
        try {
            const db = mongoose_1.default.connection.db;
            await db.command({ profile: 0 });
            this.profilingEnabled = false;
            console.log('Database profiling disabled');
        }
        catch (error) {
            console.error('Failed to disable database profiling:', error);
            throw error;
        }
    }
    async startProfilingCollection() {
        if (!this.profilingEnabled)
            return;
        try {
            const db = mongoose_1.default.connection.db;
            setInterval(async () => {
                try {
                    const profilingData = await db.collection('system.profile')
                        .find({})
                        .sort({ ts: -1 })
                        .limit(100)
                        .toArray();
                    profilingData.forEach((entry) => {
                        const slowQuery = {
                            command: entry.command?.find ? 'find' :
                                entry.command?.aggregate ? 'aggregate' :
                                    entry.command?.update ? 'update' :
                                        entry.command?.insert ? 'insert' :
                                            entry.command?.delete ? 'delete' : 'unknown',
                            collection: entry.ns?.split('.')[1] || 'unknown',
                            duration: entry.millis || 0,
                            timestamp: entry.ts || new Date(),
                            query: entry.command,
                            planSummary: entry.planSummary,
                        };
                        this.addSlowQuery(slowQuery);
                    });
                }
                catch (error) {
                    console.error('Error collecting profiling data:', error);
                }
            }, 30000);
        }
        catch (error) {
            console.error('Failed to start profiling collection:', error);
        }
    }
    addSlowQuery(query) {
        this.slowQueries.push(query);
        if (this.slowQueries.length > this.maxSlowQueries) {
            this.slowQueries = this.slowQueries.slice(-this.maxSlowQueries);
        }
    }
    async getDatabaseStats() {
        try {
            const db = mongoose_1.default.connection.db;
            const admin = db.admin();
            const dbStats = await db.stats();
            const collections = await db.listCollections().toArray();
            const collectionStats = await Promise.all(collections.map(async (col) => {
                try {
                    const stats = await db.collection(col.name).stats();
                    return {
                        name: col.name,
                        count: stats.count || 0,
                        size: stats.size || 0,
                        avgObjSize: stats.avgObjSize || 0,
                        indexes: stats.nindexes || 0,
                    };
                }
                catch (error) {
                    return {
                        name: col.name,
                        count: 0,
                        size: 0,
                        avgObjSize: 0,
                        indexes: 0,
                    };
                }
            }));
            const indexStats = await this.getIndexUsageStats();
            const serverStatus = await admin.serverStatus();
            const connectionStats = {
                current: serverStatus.connections?.current || 0,
                available: serverStatus.connections?.available || 0,
                totalCreated: serverStatus.connections?.totalCreated || 0,
            };
            return {
                collections: collectionStats,
                indexes: indexStats,
                slowQueries: this.getSlowQueries(50),
                connectionStats,
            };
        }
        catch (error) {
            console.error('Failed to get database stats:', error);
            throw error;
        }
    }
    async getIndexUsageStats() {
        try {
            const db = mongoose_1.default.connection.db;
            const collections = await db.listCollections().toArray();
            const indexStats = [];
            for (const col of collections) {
                try {
                    const indexes = await db.collection(col.name).listIndexes().toArray();
                    for (const index of indexes) {
                        const stats = await db.collection(col.name).aggregate([
                            { $indexStats: {} },
                            { $match: { name: index.name } }
                        ]).toArray();
                        const usage = stats[0]?.accesses?.ops || 0;
                        indexStats.push({
                            collection: col.name,
                            name: index.name,
                            size: index.size || 0,
                            usage,
                        });
                    }
                }
                catch (error) {
                    continue;
                }
            }
            return indexStats;
        }
        catch (error) {
            console.error('Failed to get index usage stats:', error);
            return [];
        }
    }
    getSlowQueries(limit = 100) {
        return this.slowQueries
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    async createOptimalIndexes() {
        try {
            const db = mongoose_1.default.connection.db;
            const indexesToCreate = [
                { collection: 'patients', index: { workspaceId: 1, createdAt: -1 } },
                { collection: 'patients', index: { workspaceId: 1, 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 } },
                { collection: 'patients', index: { workspaceId: 1, isActive: 1 } },
                { collection: 'clinicalnotes', index: { patientId: 1, createdAt: -1 } },
                { collection: 'clinicalnotes', index: { workspaceId: 1, createdAt: -1 } },
                { collection: 'clinicalnotes', index: { workspaceId: 1, type: 1 } },
                { collection: 'medications', index: { patientId: 1, isActive: 1 } },
                { collection: 'medications', index: { rxcui: 1 } },
                { collection: 'medications', index: { workspaceId: 1, createdAt: -1 } },
                { collection: 'users', index: { email: 1 }, options: { unique: true } },
                { collection: 'users', index: { workspaceId: 1, role: 1 } },
                { collection: 'users', index: { workspaceId: 1, isActive: 1 } },
                { collection: 'auditlogs', index: { workspaceId: 1, createdAt: -1 } },
                { collection: 'auditlogs', index: { userId: 1, createdAt: -1 } },
                { collection: 'auditlogs', index: { action: 1, createdAt: -1 } },
                { collection: 'medicationtherapyreviews', index: { patientId: 1, createdAt: -1 } },
                { collection: 'medicationtherapyreviews', index: { workspaceId: 1, status: 1 } },
                { collection: 'conversations', index: { workspaceId: 1, participants: 1 } },
                { collection: 'messages', index: { conversationId: 1, createdAt: -1 } },
            ];
            for (const { collection, index, options } of indexesToCreate) {
                try {
                    await db.collection(collection).createIndex(index, options || {});
                    console.log(`Created index on ${collection}:`, index);
                }
                catch (error) {
                    console.log(`Index already exists on ${collection}:`, index);
                }
            }
            console.log('Optimal indexes creation completed');
        }
        catch (error) {
            console.error('Failed to create optimal indexes:', error);
            throw error;
        }
    }
    async analyzeSlowQueries() {
        const queryAnalysis = new Map();
        this.slowQueries.forEach(sq => {
            const key = `${sq.collection}:${JSON.stringify(sq.query)}`;
            if (!queryAnalysis.has(key)) {
                queryAnalysis.set(key, {
                    durations: [],
                    count: 0,
                    query: sq.query,
                    collection: sq.collection,
                });
            }
            const analysis = queryAnalysis.get(key);
            analysis.durations.push(sq.duration);
            analysis.count++;
        });
        const recommendations = Array.from(queryAnalysis.entries()).map(([key, analysis]) => {
            const avgDuration = analysis.durations.reduce((sum, d) => sum + d, 0) / analysis.durations.length;
            let recommendation = 'Consider adding appropriate indexes';
            if (analysis.query?.find && !analysis.query.find.$text) {
                recommendation = 'Add compound index for query fields';
            }
            else if (analysis.query?.aggregate) {
                recommendation = 'Optimize aggregation pipeline and add indexes for $match stages';
            }
            else if (avgDuration > 1000) {
                recommendation = 'Critical: Query taking over 1 second, immediate optimization needed';
            }
            return {
                collection: analysis.collection,
                query: JSON.stringify(analysis.query, null, 2),
                avgDuration,
                count: analysis.count,
                recommendation,
            };
        });
        return recommendations.sort((a, b) => b.avgDuration - a.avgDuration);
    }
    clearSlowQueries() {
        this.slowQueries = [];
    }
}
exports.default = new DatabaseProfiler();
//# sourceMappingURL=DatabaseProfiler.js.map