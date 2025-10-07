"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rbac_1 = __importDefault(require("../middlewares/rbac"));
const ContinuousMonitoringService_1 = __importDefault(require("../services/ContinuousMonitoringService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.post('/start', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { config } = req.body;
        await ContinuousMonitoringService_1.default.start(config);
        const status = ContinuousMonitoringService_1.default.getStatus();
        logger_1.default.info(`Continuous monitoring started by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Continuous monitoring started',
            data: status,
        });
    }
    catch (error) {
        logger_1.default.error('Error starting continuous monitoring:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start continuous monitoring',
            error: error.message,
        });
    }
});
router.post('/stop', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        await ContinuousMonitoringService_1.default.stop();
        logger_1.default.info(`Continuous monitoring stopped by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Continuous monitoring stopped',
        });
    }
    catch (error) {
        logger_1.default.error('Error stopping continuous monitoring:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to stop continuous monitoring',
            error: error.message,
        });
    }
});
router.get('/status', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager', 'viewer'), async (req, res) => {
    try {
        const status = ContinuousMonitoringService_1.default.getStatus();
        res.json({
            success: true,
            data: status,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting monitoring status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get monitoring status',
            error: error.message,
        });
    }
});
router.put('/config', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager'), async (req, res) => {
    try {
        const { config } = req.body;
        if (!config) {
            return res.status(400).json({
                success: false,
                message: 'Configuration is required',
            });
        }
        await ContinuousMonitoringService_1.default.updateConfig(config);
        const status = ContinuousMonitoringService_1.default.getStatus();
        logger_1.default.info(`Monitoring configuration updated by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Monitoring configuration updated',
            data: status,
        });
    }
    catch (error) {
        logger_1.default.error('Error updating monitoring configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update monitoring configuration',
            error: error.message,
        });
    }
});
router.get('/default-config', auth_1.auth, rbac_1.default.requireRole('admin', 'deployment_manager', 'viewer'), async (req, res) => {
    try {
        const defaultConfig = {
            webVitals: {
                enabled: true,
                collectionInterval: 5,
                alertThresholds: {
                    LCP: 2500,
                    FID: 100,
                    CLS: 0.1,
                    TTFB: 800,
                },
            },
            lighthouse: {
                enabled: true,
                schedule: '0 */6 * * *',
                urls: [
                    process.env.PRODUCTION_URL || 'https://app.PharmacyCopilot.com',
                ],
                alertThresholds: {
                    performance: 85,
                    accessibility: 90,
                    bestPractices: 90,
                    seo: 90,
                },
            },
            apiLatency: {
                enabled: true,
                monitoringInterval: 10,
                endpoints: [
                    '/api/patients',
                    '/api/notes',
                    '/api/medications',
                    '/api/dashboard/overview',
                ],
                alertThresholds: {
                    p95: 1000,
                    errorRate: 5,
                },
            },
            regressionDetection: {
                enabled: true,
                analysisInterval: 30,
                lookbackPeriod: 24,
                regressionThreshold: 10,
            },
            reporting: {
                dailyReport: true,
                weeklyReport: true,
                monthlyReport: true,
                recipients: process.env.PERFORMANCE_REPORT_RECIPIENTS?.split(',') || [],
            },
        };
        res.json({
            success: true,
            data: defaultConfig,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting default configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get default configuration',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=continuousMonitoringRoutes.js.map