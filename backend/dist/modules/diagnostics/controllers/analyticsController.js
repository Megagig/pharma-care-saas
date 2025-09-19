"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = exports.generateAnalyticsReport = exports.getComparisonAnalysis = exports.getTrendAnalysis = exports.getUsageAnalytics = exports.getPatientOutcomeMetrics = exports.getAIPerformanceMetrics = exports.getDiagnosticMetrics = void 0;
const diagnosticAnalyticsService_1 = __importDefault(require("../services/diagnosticAnalyticsService"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const getDiagnosticMetrics = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const metrics = await diagnosticAnalyticsService_1.default.getDiagnosticMetrics(workplaceId.toString(), start, end);
        return res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        logger_1.default.error('Error getting diagnostic metrics:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'ANALYTICS_ERROR',
                message: 'Failed to retrieve diagnostic metrics',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getDiagnosticMetrics = getDiagnosticMetrics;
const getAIPerformanceMetrics = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const metrics = await diagnosticAnalyticsService_1.default.getAIPerformanceMetrics(workplaceId.toString(), start, end);
        return res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        logger_1.default.error('Error getting AI performance metrics:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'AI_ANALYTICS_ERROR',
                message: 'Failed to retrieve AI performance metrics',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getAIPerformanceMetrics = getAIPerformanceMetrics;
const getPatientOutcomeMetrics = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const metrics = await diagnosticAnalyticsService_1.default.getPatientOutcomeMetrics(workplaceId.toString(), start, end);
        return res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        logger_1.default.error('Error getting patient outcome metrics:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'OUTCOME_ANALYTICS_ERROR',
                message: 'Failed to retrieve patient outcome metrics',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getPatientOutcomeMetrics = getPatientOutcomeMetrics;
const getUsageAnalytics = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const analytics = await diagnosticAnalyticsService_1.default.getUsageAnalytics(workplaceId.toString(), start, end);
        return res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        logger_1.default.error('Error getting usage analytics:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_ANALYTICS_ERROR',
                message: 'Failed to retrieve usage analytics',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getUsageAnalytics = getUsageAnalytics;
const getTrendAnalysis = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const trends = await diagnosticAnalyticsService_1.default.getTrendAnalysis(workplaceId.toString(), start, end);
        return res.json({
            success: true,
            data: trends
        });
    }
    catch (error) {
        logger_1.default.error('Error getting trend analysis:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'TREND_ANALYTICS_ERROR',
                message: 'Failed to retrieve trend analysis',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getTrendAnalysis = getTrendAnalysis;
const getComparisonAnalysis = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const comparison = await diagnosticAnalyticsService_1.default.getComparisonAnalysis(workplaceId.toString(), start, end);
        return res.json({
            success: true,
            data: comparison
        });
    }
    catch (error) {
        logger_1.default.error('Error getting comparison analysis:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'COMPARISON_ANALYTICS_ERROR',
                message: 'Failed to retrieve comparison analysis',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getComparisonAnalysis = getComparisonAnalysis;
const generateAnalyticsReport = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { startDate, endDate, format } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const report = await diagnosticAnalyticsService_1.default.generateAnalyticsReport(workplaceId.toString(), start, end);
        if (format === 'pdf') {
            res.status(501).json({
                success: false,
                error: {
                    code: 'PDF_NOT_IMPLEMENTED',
                    message: 'PDF report generation not yet implemented'
                }
            });
            return;
        }
        return res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        logger_1.default.error('Error generating analytics report:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'REPORT_GENERATION_ERROR',
                message: 'Failed to generate analytics report',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.generateAnalyticsReport = generateAnalyticsReport;
const getDashboardSummary = async (req, res) => {
    try {
        if (!req.user || !req.user.workplaceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Workplace ID is required'
                }
            });
        }
        const { workplaceId } = req.user;
        const { period = '30d' } = req.query;
        const now = new Date();
        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        const [diagnosticMetrics, aiPerformance, patientOutcomes, usageAnalytics] = await Promise.all([
            diagnosticAnalyticsService_1.default.getDiagnosticMetrics(workplaceId.toString(), startDate, now),
            diagnosticAnalyticsService_1.default.getAIPerformanceMetrics(workplaceId.toString(), startDate, now),
            diagnosticAnalyticsService_1.default.getPatientOutcomeMetrics(workplaceId.toString(), startDate, now),
            diagnosticAnalyticsService_1.default.getUsageAnalytics(workplaceId.toString(), startDate, now)
        ]);
        const summary = {
            period: period,
            dateRange: {
                start: startDate,
                end: now
            },
            keyMetrics: {
                totalCases: diagnosticMetrics.totalCases,
                successRate: diagnosticMetrics.successRate,
                averageProcessingTime: diagnosticMetrics.averageProcessingTime,
                aiConfidence: aiPerformance.averageConfidenceScore,
                overrideRate: aiPerformance.pharmacistOverrideRate,
                activeUsers: usageAnalytics.monthlyActiveUsers,
                patientOutcomes: {
                    followUpCompliance: patientOutcomes.followUpCompliance,
                    adherenceRate: patientOutcomes.adherenceRate,
                    referralRate: patientOutcomes.referralRate
                }
            },
            alerts: []
        };
        if (diagnosticMetrics.successRate < 90) {
            summary.alerts.push({
                type: 'warning',
                message: 'Diagnostic success rate is below 90%',
                metric: 'successRate',
                value: diagnosticMetrics.successRate
            });
        }
        if (aiPerformance.pharmacistOverrideRate > 20) {
            summary.alerts.push({
                type: 'warning',
                message: 'AI override rate is above 20%',
                metric: 'overrideRate',
                value: aiPerformance.pharmacistOverrideRate
            });
        }
        if (patientOutcomes.followUpCompliance < 80) {
            summary.alerts.push({
                type: 'error',
                message: 'Follow-up compliance is below 80%',
                metric: 'followUpCompliance',
                value: patientOutcomes.followUpCompliance
            });
        }
        return res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger_1.default.error('Error getting dashboard summary:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'DASHBOARD_ERROR',
                message: 'Failed to retrieve dashboard summary',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getDashboardSummary = getDashboardSummary;
exports.default = {
    getDiagnosticMetrics: exports.getDiagnosticMetrics,
    getAIPerformanceMetrics: exports.getAIPerformanceMetrics,
    getPatientOutcomeMetrics: exports.getPatientOutcomeMetrics,
    getUsageAnalytics: exports.getUsageAnalytics,
    getTrendAnalysis: exports.getTrendAnalysis,
    getComparisonAnalysis: exports.getComparisonAnalysis,
    generateAnalyticsReport: exports.generateAnalyticsReport,
    getDashboardSummary: exports.getDashboardSummary
};
//# sourceMappingURL=analyticsController.js.map