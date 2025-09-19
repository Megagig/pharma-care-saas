"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const MTRAuditLog_1 = __importDefault(require("../../../models/MTRAuditLog"));
class AuditVisualizationService {
    async generateVisualizationData(workplaceId, startDate, endDate) {
        try {
            logger_1.default.info('Generating audit visualization data', {
                workplaceId,
                period: { startDate, endDate }
            });
            const [timeline, userActivity, entityFlow, riskHeatmap, complianceMetrics] = await Promise.all([
                this.generateTimeline(workplaceId, startDate, endDate),
                this.generateUserActivity(workplaceId, startDate, endDate),
                this.generateEntityFlow(workplaceId, startDate, endDate),
                this.generateRiskHeatmap(workplaceId, startDate, endDate),
                this.calculateComplianceMetrics(workplaceId, startDate, endDate)
            ]);
            return {
                timeline,
                userActivity,
                entityFlow,
                riskHeatmap,
                complianceMetrics
            };
        }
        catch (error) {
            logger_1.default.error('Error generating audit visualization data:', error);
            throw new Error('Failed to generate audit visualization data');
        }
    }
    async searchAuditEvents(filters, page = 1, limit = 50) {
        try {
            const query = {
                workplaceId: new mongoose_1.Types.ObjectId(filters.workplaceId)
            };
            if (filters.startDate || filters.endDate) {
                query.timestamp = {};
                if (filters.startDate)
                    query.timestamp.$gte = filters.startDate;
                if (filters.endDate)
                    query.timestamp.$lte = filters.endDate;
            }
            if (filters.userIds?.length) {
                query.userId = { $in: filters.userIds.map(id => new mongoose_1.Types.ObjectId(id)) };
            }
            if (filters.eventTypes?.length) {
                query.action = { $in: filters.eventTypes };
            }
            if (filters.entityTypes?.length) {
                query.resourceType = { $in: filters.entityTypes };
            }
            if (filters.entityIds?.length) {
                query.resourceId = { $in: filters.entityIds.map(id => new mongoose_1.Types.ObjectId(id)) };
            }
            if (filters.riskLevels?.length) {
                query.riskLevel = { $in: filters.riskLevels };
            }
            if (filters.ipAddresses?.length) {
                query.ipAddress = { $in: filters.ipAddresses };
            }
            if (filters.sessionIds?.length) {
                query.sessionId = { $in: filters.sessionIds };
            }
            if (filters.hasErrors !== undefined) {
                if (filters.hasErrors) {
                    query.errorMessage = { $ne: null };
                }
                else {
                    query.errorMessage = null;
                }
            }
            if (filters.complianceCategories?.length) {
                query.complianceCategory = { $in: filters.complianceCategories };
            }
            if (filters.searchText) {
                query.$or = [
                    { action: { $regex: filters.searchText, $options: 'i' } },
                    { 'details.description': { $regex: filters.searchText, $options: 'i' } },
                    { errorMessage: { $regex: filters.searchText, $options: 'i' } }
                ];
            }
            const total = await MTRAuditLog_1.default.countDocuments(query);
            const events = await MTRAuditLog_1.default.find(query)
                .populate('userId', 'firstName lastName email')
                .populate('patientId', 'firstName lastName mrn')
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();
            const aggregations = await this.generateAggregations(query);
            const transformedEvents = events.map(event => ({
                id: event._id.toString(),
                timestamp: event.timestamp,
                action: event.action,
                entityType: event.resourceType,
                entityId: event.resourceId.toString(),
                userId: event.userId.toString(),
                userName: event.userId ? `${event.userId.firstName} ${event.userId.lastName}` : undefined,
                riskLevel: event.riskLevel,
                complianceCategory: event.complianceCategory,
                details: event.details,
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
                duration: event.duration,
                errorMessage: event.errorMessage,
                changedFields: event.changedFields,
                relatedEvents: []
            }));
            return {
                events: transformedEvents,
                aggregations,
                pagination: {
                    page,
                    limit,
                    total,
                    hasMore: (page * limit) < total
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error searching audit events:', error);
            throw new Error('Failed to search audit events');
        }
    }
    async generateTimeline(workplaceId, startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },
                    events: { $sum: 1 },
                    criticalEvents: {
                        $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] }
                    },
                    eventTypes: { $push: '$action' }
                }
            },
            {
                $sort: { '_id.date': 1 }
            }
        ];
        const results = await MTRAuditLog_1.default.aggregate(pipeline);
        return results.map(result => {
            const eventTypeCounts = {};
            result.eventTypes.forEach((type) => {
                eventTypeCounts[type] = (eventTypeCounts[type] || 0) + 1;
            });
            return {
                date: result._id.date,
                events: result.events,
                criticalEvents: result.criticalEvents,
                eventTypes: eventTypeCounts
            };
        });
    }
    async generateUserActivity(workplaceId, startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$userId',
                    totalEvents: { $sum: 1 },
                    lastActivity: { $max: '$timestamp' },
                    riskEvents: {
                        $sum: { $cond: [{ $in: ['$riskLevel', ['high', 'critical']] }, 1, 0] }
                    },
                    eventTypes: { $push: '$action' },
                    errorCount: {
                        $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $sort: { totalEvents: -1 }
            }
        ];
        const results = await MTRAuditLog_1.default.aggregate(pipeline);
        return results.map(result => {
            const eventBreakdown = {};
            result.eventTypes.forEach((type) => {
                eventBreakdown[type] = (eventBreakdown[type] || 0) + 1;
            });
            const riskScore = Math.min(100, (result.riskEvents / result.totalEvents) * 50 +
                (result.errorCount / result.totalEvents) * 30 +
                (result.totalEvents > 100 ? 20 : 0));
            const user = result.user[0];
            return {
                userId: result._id.toString(),
                userName: user ? `${user.firstName} ${user.lastName}` : undefined,
                totalEvents: result.totalEvents,
                riskScore: Math.round(riskScore),
                lastActivity: result.lastActivity,
                eventBreakdown
            };
        });
    }
    async generateEntityFlow(workplaceId, startDate, endDate) {
        const topEntities = await MTRAuditLog_1.default.aggregate([
            {
                $match: {
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        entityId: '$resourceId',
                        entityType: '$resourceType'
                    },
                    eventCount: { $sum: 1 }
                }
            },
            {
                $sort: { eventCount: -1 }
            },
            {
                $limit: 20
            }
        ]);
        const entityFlows = await Promise.all(topEntities.map(async (entity) => {
            const events = await MTRAuditLog_1.default.find({
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                resourceId: entity._id.entityId,
                resourceType: entity._id.entityType,
                timestamp: { $gte: startDate, $lte: endDate }
            })
                .populate('userId', 'firstName lastName')
                .sort({ timestamp: 1 })
                .limit(50);
            return {
                entityId: entity._id.entityId.toString(),
                entityType: entity._id.entityType,
                events: events.map(event => ({
                    timestamp: event.timestamp,
                    action: event.action,
                    userId: event.userId.toString(),
                    details: event.details
                }))
            };
        }));
        return entityFlows;
    }
    async generateRiskHeatmap(workplaceId, startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        category: '$complianceCategory',
                        riskLevel: '$riskLevel'
                    },
                    count: { $sum: 1 }
                }
            }
        ];
        const results = await MTRAuditLog_1.default.aggregate(pipeline);
        const totalEvents = results.reduce((sum, r) => sum + r.count, 0);
        const categoryMap = new Map();
        results.forEach(result => {
            const category = result._id.category;
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category,
                    riskLevels: { low: 0, medium: 0, high: 0, critical: 0 },
                    total: 0
                });
            }
            const categoryData = categoryMap.get(category);
            categoryData.riskLevels[result._id.riskLevel] = result.count;
            categoryData.total += result.count;
        });
        return Array.from(categoryMap.values()).map(data => {
            const { critical, high, medium, low } = data.riskLevels;
            let overallRisk;
            if (critical > 0)
                overallRisk = 'critical';
            else if (high > data.total * 0.1)
                overallRisk = 'high';
            else if (medium > data.total * 0.3)
                overallRisk = 'medium';
            else
                overallRisk = 'low';
            return {
                category: data.category,
                riskLevel: overallRisk,
                count: data.total,
                percentage: totalEvents > 0 ? (data.total / totalEvents) * 100 : 0,
                trend: 'stable'
            };
        });
    }
    async calculateComplianceMetrics(workplaceId, startDate, endDate) {
        const auditLogs = await MTRAuditLog_1.default.find({
            workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
            timestamp: { $gte: startDate, $lte: endDate }
        });
        const totalLogs = auditLogs.length;
        const completeLogsCount = auditLogs.filter(log => log.action && log.resourceType && log.userId && log.timestamp).length;
        const accessViolations = auditLogs.filter(log => log.action === 'security_violation' || log.riskLevel === 'critical').length;
        return {
            auditCoverage: totalLogs > 0 ? (completeLogsCount / totalLogs) * 100 : 100,
            dataIntegrity: 95,
            accessCompliance: Math.max(0, 100 - (accessViolations / totalLogs) * 100),
            retentionCompliance: 90
        };
    }
    async generateAggregations(query) {
        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    uniqueEntities: { $addToSet: '$resourceId' },
                    eventsByType: { $push: '$action' },
                    eventsByRisk: { $push: '$riskLevel' },
                    eventsByCompliance: { $push: '$complianceCategory' },
                    timeDistribution: { $push: { $hour: '$timestamp' } }
                }
            }
        ];
        const result = await MTRAuditLog_1.default.aggregate(pipeline);
        const data = result[0] || {
            totalEvents: 0,
            uniqueUsers: [],
            uniqueEntities: [],
            eventsByType: [],
            eventsByRisk: [],
            eventsByCompliance: [],
            timeDistribution: []
        };
        const countOccurrences = (arr) => {
            return arr.reduce((acc, item) => {
                acc[item] = (acc[item] || 0) + 1;
                return acc;
            }, {});
        };
        return {
            totalEvents: data.totalEvents,
            uniqueUsers: data.uniqueUsers.length,
            uniqueEntities: data.uniqueEntities.length,
            eventsByType: countOccurrences(data.eventsByType),
            eventsByRisk: countOccurrences(data.eventsByRisk),
            eventsByCompliance: countOccurrences(data.eventsByCompliance),
            timeDistribution: countOccurrences(data.timeDistribution)
        };
    }
    async exportVisualizationData(workplaceId, startDate, endDate, format = 'json') {
        const visualizationData = await this.generateVisualizationData(workplaceId, startDate, endDate);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `audit_visualization_${timestamp}.${format}`;
        switch (format) {
            case 'json':
                return {
                    data: JSON.stringify(visualizationData, null, 2),
                    filename,
                    contentType: 'application/json'
                };
            case 'csv':
                const csvHeaders = ['Date', 'Total Events', 'Critical Events', 'Top Event Type'];
                const csvRows = visualizationData.timeline.map(item => [
                    item.date,
                    item.events.toString(),
                    item.criticalEvents.toString(),
                    Object.keys(item.eventTypes)[0] || 'N/A'
                ]);
                const csvContent = [
                    csvHeaders.join(','),
                    ...csvRows.map(row => row.join(','))
                ].join('\n');
                return {
                    data: csvContent,
                    filename,
                    contentType: 'text/csv'
                };
            case 'pdf':
                return {
                    data: {
                        title: 'Audit Trail Visualization Report',
                        generatedAt: new Date(),
                        period: { startDate, endDate },
                        workplaceId,
                        visualizationData
                    },
                    filename,
                    contentType: 'application/pdf'
                };
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
}
exports.default = new AuditVisualizationService();
//# sourceMappingURL=auditVisualizationService.js.map