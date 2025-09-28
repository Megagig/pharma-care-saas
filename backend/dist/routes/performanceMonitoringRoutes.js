"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const PerformanceMonitoringService_1 = require("../services/PerformanceMonitoringService");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
const monitoringRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: 'Too many performance monitoring requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(monitoringRateLimit);
router.use(auth_1.auth);
router.get('/overview', async (req, res) => {
    try {
        const workspaceId = req.user?.workspaceId;
        const overview = await PerformanceMonitoringService_1.performanceMonitoringService.getPerformanceOverview(workspaceId);
        res.json({
            success: true,
            overview,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting performance overview:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/trends', [
    (0, express_validator_1.query)('period').optional().isIn(['24h', '7d', '30d']).withMessage('Invalid period'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { period = '7d' } = req.query;
        const workspaceId = req.user?.workspaceId;
        const trends = await PerformanceMonitoringService_1.performanceMonitoringService.getPerformanceTrends(period, workspaceId);
        res.json({
            success: true,
            trends,
            period,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting performance trends:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/report', [
    (0, express_validator_1.query)('period').optional().isIn(['24h', '7d', '30d']).withMessage('Invalid period'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { period = '7d' } = req.query;
        const workspaceId = req.user?.workspaceId;
        const report = await PerformanceMonitoringService_1.performanceMonitoringService.generatePerformanceReport(period, workspaceId);
        res.json({
            success: true,
            report,
        });
    }
    catch (error) {
        console.error('Error generating performance report:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/alerts', [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
    (0, express_validator_1.query)('resolved').optional().isBoolean().withMessage('Invalid resolved filter'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { limit = 50 } = req.query;
        const workspaceId = req.user?.workspaceId;
        const alerts = await PerformanceMonitoringService_1.performanceMonitoringService.getPerformanceAlerts(workspaceId, parseInt(limit));
        res.json({
            success: true,
            alerts,
            count: alerts.length,
        });
    }
    catch (error) {
        console.error('Error getting performance alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.post('/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        const resolved = await PerformanceMonitoringService_1.performanceMonitoringService.resolveAlert(alertId);
        if (!resolved) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found',
            });
        }
        res.json({
            success: true,
            message: 'Alert resolved successfully',
        });
    }
    catch (error) {
        console.error('Error resolving performance alert:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/metrics/summary', [
    (0, express_validator_1.query)('period').optional().isIn(['1h', '24h', '7d']).withMessage('Invalid period'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { period = '24h' } = req.query;
        const workspaceId = req.user?.workspaceId;
        const [overview, trends] = await Promise.all([
            PerformanceMonitoringService_1.performanceMonitoringService.getPerformanceOverview(workspaceId),
            PerformanceMonitoringService_1.performanceMonitoringService.getPerformanceTrends(period, workspaceId),
        ]);
        const summary = {
            webVitals: {
                score: overview.webVitals.summary.budgetStatus ?
                    Object.values(overview.webVitals.summary.budgetStatus).filter(s => s === 'good').length /
                        Object.keys(overview.webVitals.summary.budgetStatus).length * 100 : 0,
                violations: overview.webVitals.recentViolations,
                trend: overview.webVitals.trendDirection,
            },
            lighthouse: {
                score: overview.lighthouse.latestScores.performance || 0,
                violations: overview.lighthouse.budgetViolations,
                trend: overview.lighthouse.trendDirection,
            },
            budgets: {
                compliance: 100 - overview.budgets.violationRate,
                violations: overview.budgets.recentViolations,
                activeBudgets: overview.budgets.activeBudgets,
            },
            api: {
                latency: overview.api.p95Latency,
                errorRate: overview.api.errorRate,
                trend: overview.api.trendDirection,
            },
            alerts: {
                active: overview.alerts.activeAlerts,
                critical: overview.alerts.criticalAlerts,
            },
        };
        res.json({
            success: true,
            summary,
            period,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting performance metrics summary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/recommendations', async (req, res) => {
    try {
        const workspaceId = req.user?.workspaceId;
        const overview = await PerformanceMonitoringService_1.performanceMonitoringService.getPerformanceOverview(workspaceId);
        res.json({
            success: true,
            recommendations: overview.recommendations,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting performance recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            webVitals: 'operational',
            lighthouse: 'operational',
            budgets: 'operational',
            alerts: 'operational',
        },
    });
});
exports.default = router;
//# sourceMappingURL=performanceMonitoringRoutes.js.map