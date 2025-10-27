"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const PatientEngagementMonitoringService_1 = require("../services/PatientEngagementMonitoringService");
const performanceMonitoring_1 = require("../utils/performanceMonitoring");
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const startTime = Date.now();
        const checks = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
            environment: process.env.NODE_ENV || 'development',
        };
        const responseTime = Date.now() - startTime;
        res.status(200).json({
            status: 'healthy',
            responseTime,
            checks,
        });
    }
    catch (error) {
        logger_1.default.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/patient-engagement', async (req, res) => {
    try {
        const startTime = Date.now();
        const services = [
            'appointment_service',
            'followup_service',
            'reminder_service',
            'database',
            'queue_service',
        ];
        const healthChecks = await Promise.all(services.map(async (service) => {
            try {
                return await PatientEngagementMonitoringService_1.patientEngagementMonitoring.performHealthCheck(service);
            }
            catch (error) {
                return {
                    service,
                    status: 'unhealthy',
                    responseTime: 0,
                    details: { error: error instanceof Error ? error.message : 'Unknown error' },
                    timestamp: new Date(),
                };
            }
        }));
        const unhealthyServices = healthChecks.filter(h => h.status === 'unhealthy');
        const degradedServices = healthChecks.filter(h => h.status === 'degraded');
        let overallStatus = 'healthy';
        if (unhealthyServices.length > 0) {
            overallStatus = 'unhealthy';
        }
        else if (degradedServices.length > 0) {
            overallStatus = 'degraded';
        }
        const responseTime = Date.now() - startTime;
        const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
        res.status(statusCode).json({
            status: overallStatus,
            responseTime,
            services: healthChecks,
            summary: {
                total: services.length,
                healthy: healthChecks.filter(h => h.status === 'healthy').length,
                degraded: degradedServices.length,
                unhealthy: unhealthyServices.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Patient engagement health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/ready', async (req, res) => {
    try {
        const checks = {
            database: mongoose_1.default.connection.readyState === 1,
            memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024,
        };
        const isReady = Object.values(checks).every(Boolean);
        if (isReady) {
            res.status(200).json({
                status: 'ready',
                checks,
            });
        }
        else {
            res.status(503).json({
                status: 'not_ready',
                checks,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not_ready',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
router.get('/metrics', async (req, res) => {
    try {
        const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endTime = new Date();
        const workplaceId = req.query.workplaceId;
        const dashboardData = await PatientEngagementMonitoringService_1.patientEngagementMonitoring.getDashboardData(startTime, endTime, workplaceId);
        const performanceReport = performanceMonitoring_1.performanceCollector.generatePerformanceReport(startTime, endTime);
        res.json({
            patientEngagement: dashboardData,
            systemPerformance: performanceReport,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger_1.default.error('Metrics endpoint failed:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/errors', async (req, res) => {
    try {
        const startTime = req.query.startTime
            ? new Date(req.query.startTime)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const endTime = req.query.endTime
            ? new Date(req.query.endTime)
            : new Date();
        const workplaceId = req.query.workplaceId;
        const errorAnalysis = PatientEngagementMonitoringService_1.patientEngagementMonitoring.getErrorAnalysis(startTime, endTime, workplaceId);
        res.json({
            ...errorAnalysis,
            timeRange: {
                start: startTime.toISOString(),
                end: endTime.toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error analysis endpoint failed:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const dashboardData = await PatientEngagementMonitoringService_1.patientEngagementMonitoring.getDashboardData();
        res.json({
            activeAlerts: dashboardData.alerts,
            summary: {
                total: dashboardData.alerts.length,
                critical: dashboardData.alerts.filter(a => a.severity === 'critical').length,
                high: dashboardData.alerts.filter(a => a.severity === 'high').length,
                medium: dashboardData.alerts.filter(a => a.severity === 'medium').length,
                low: dashboardData.alerts.filter(a => a.severity === 'low').length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Alerts endpoint failed:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.post('/alerts/:alertId/resolve', (req, res) => {
    try {
        const { alertId } = req.params;
        const resolved = PatientEngagementMonitoringService_1.patientEngagementMonitoring.resolveAlert(alertId);
        if (resolved) {
            res.json({
                success: true,
                message: 'Alert resolved successfully',
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Alert not found or already resolved',
            });
        }
    }
    catch (error) {
        logger_1.default.error('Alert resolution failed:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/system', (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        res.json({
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
            memory: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
            },
            cpu: {
                user: Math.round(cpuUsage.user / 1000),
                system: Math.round(cpuUsage.system / 1000),
            },
            environment: {
                nodeEnv: process.env.NODE_ENV || 'development',
                port: process.env.PORT || '5000',
                mongoUri: process.env.MONGO_URI ? 'configured' : 'not_configured',
                redisHost: process.env.REDIS_HOST || 'localhost',
            },
        });
    }
    catch (error) {
        logger_1.default.error('System info endpoint failed:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=healthRoutes.js.map