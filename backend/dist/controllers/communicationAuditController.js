"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const communicationAuditService_1 = __importDefault(require("../services/communicationAuditService"));
const logger_1 = __importDefault(require("../utils/logger"));
const express_validator_1 = require("express-validator");
const getWorkplaceId = (req) => {
    return req.user?.workplaceId?.toString() || '';
};
class CommunicationAuditController {
    async getAuditLogs(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array(),
                });
                return;
            }
            const workplaceId = getWorkplaceId(req);
            const filters = {
                userId: req.query.userId,
                action: req.query.action,
                targetType: req.query.targetType,
                conversationId: req.query.conversationId,
                patientId: req.query.patientId,
                riskLevel: req.query.riskLevel,
                complianceCategory: req.query.complianceCategory,
                success: req.query.success ? req.query.success === 'true' : undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
                offset: req.query.offset ? parseInt(req.query.offset) : 0,
            };
            const result = await communicationAuditService_1.default.getAuditLogs(workplaceId, filters);
            res.json({
                success: true,
                message: 'Audit logs retrieved successfully',
                data: result.logs,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: result.pages,
                    hasNext: result.page < result.pages,
                    hasPrev: result.page > 1,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error getting audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve audit logs',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    async getConversationAuditLogs(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array(),
                });
                return;
            }
            const { conversationId } = req.params;
            const workplaceId = getWorkplaceId(req);
            const options = {
                limit: req.query.limit ? parseInt(req.query.limit) : 100,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            };
            const logs = await communicationAuditService_1.default.getConversationAuditLogs(conversationId || '', workplaceId, options);
            res.json({
                success: true,
                message: 'Conversation audit logs retrieved successfully',
                data: logs,
                count: logs.length,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting conversation audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                conversationId: req.params.conversationId,
                userId: req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve conversation audit logs',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    async getHighRiskActivities(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array(),
                });
                return;
            }
            const workplaceId = getWorkplaceId(req);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            const activities = await communicationAuditService_1.default.getHighRiskActivities(workplaceId, { start: startDate, end: endDate });
            res.json({
                success: true,
                message: 'High-risk activities retrieved successfully',
                data: activities,
                count: activities.length,
                dateRange: { start: startDate, end: endDate },
            });
        }
        catch (error) {
            logger_1.default.error('Error getting high-risk activities', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve high-risk activities',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    async generateComplianceReport(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array(),
                });
                return;
            }
            const workplaceId = getWorkplaceId(req);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            const report = await communicationAuditService_1.default.generateComplianceReport(workplaceId, { start: startDate, end: endDate });
            res.json({
                success: true,
                message: 'Compliance report generated successfully',
                data: report,
                dateRange: { start: startDate, end: endDate },
                generatedAt: new Date(),
            });
        }
        catch (error) {
            logger_1.default.error('Error generating compliance report', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to generate compliance report',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    async exportAuditLogs(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array(),
                });
                return;
            }
            const workplaceId = getWorkplaceId(req);
            const format = req.query.format || 'csv';
            const filters = {
                userId: req.query.userId,
                action: req.query.action,
                targetType: req.query.targetType,
                conversationId: req.query.conversationId,
                patientId: req.query.patientId,
                riskLevel: req.query.riskLevel,
                complianceCategory: req.query.complianceCategory,
                success: req.query.success ? req.query.success === 'true' : undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            };
            const exportData = await communicationAuditService_1.default.exportAuditLogs(workplaceId, filters, format);
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `communication_audit_logs_${timestamp}.${format}`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
            res.send(exportData);
        }
        catch (error) {
            logger_1.default.error('Error exporting audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to export audit logs',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    async getUserActivitySummary(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array(),
                });
                return;
            }
            const userId = req.params.userId || req.user._id.toString();
            const workplaceId = getWorkplaceId(req);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            const summary = await communicationAuditService_1.default.getUserActivitySummary(userId, workplaceId, { start: startDate, end: endDate });
            res.json({
                success: true,
                message: 'User activity summary retrieved successfully',
                data: summary,
                userId,
                dateRange: { start: startDate, end: endDate },
            });
        }
        catch (error) {
            logger_1.default.error('Error getting user activity summary', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.params.userId || req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve user activity summary',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    async getAuditStatistics(req, res) {
        try {
            const workplaceId = getWorkplaceId(req);
            const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            const [totalLogs, highRiskActivities, complianceReport, recentActivity] = await Promise.all([
                communicationAuditService_1.default.getAuditLogs(workplaceId, {
                    startDate,
                    endDate,
                    limit: 1,
                }),
                communicationAuditService_1.default.getHighRiskActivities(workplaceId, {
                    start: startDate,
                    end: endDate,
                }),
                communicationAuditService_1.default.generateComplianceReport(workplaceId, {
                    start: startDate,
                    end: endDate,
                }),
                communicationAuditService_1.default.getAuditLogs(workplaceId, {
                    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    limit: 10,
                }),
            ]);
            const statistics = {
                totalActivities: totalLogs.total,
                highRiskActivities: highRiskActivities.length,
                recentActivities: recentActivity.logs.length,
                complianceSummary: complianceReport,
                dateRange: { start: startDate, end: endDate },
                generatedAt: new Date(),
            };
            res.json({
                success: true,
                message: 'Audit statistics retrieved successfully',
                data: statistics,
            });
        }
        catch (error) {
            logger_1.default.error('Error getting audit statistics', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve audit statistics',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
    async searchAuditLogs(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation errors',
                    errors: errors.array(),
                });
                return;
            }
            const workplaceId = getWorkplaceId(req);
            const searchQuery = req.query.q;
            if (!searchQuery || searchQuery.trim().length < 2) {
                res.status(400).json({
                    success: false,
                    message: 'Search query must be at least 2 characters long',
                });
                return;
            }
            const filters = {
                action: searchQuery.toLowerCase().includes('message') ? 'message_sent' : undefined,
                targetType: searchQuery.toLowerCase().includes('conversation') ? 'conversation' : undefined,
                riskLevel: searchQuery.toLowerCase().includes('high') ? 'high' :
                    searchQuery.toLowerCase().includes('critical') ? 'critical' : undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
                offset: req.query.offset ? parseInt(req.query.offset) : 0,
            };
            const result = await communicationAuditService_1.default.getAuditLogs(workplaceId, filters);
            res.json({
                success: true,
                message: 'Audit logs search completed',
                data: result.logs,
                searchQuery,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: result.pages,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error searching audit logs', {
                error: error instanceof Error ? error.message : 'Unknown error',
                searchQuery: req.query.q,
                userId: req.user?._id,
                service: 'communication-audit-controller',
            });
            res.status(500).json({
                success: false,
                message: 'Failed to search audit logs',
                error: process.env.NODE_ENV === 'development' ? error : undefined,
            });
        }
    }
}
exports.default = new CommunicationAuditController();
//# sourceMappingURL=communicationAuditController.js.map