"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const metrics_1 = require("../utils/metrics");
const router = express_1.default.Router();
const healthCheckDuration = new metrics_1.promClient.Histogram({
    name: 'PharmacyCopilot_health_check_duration_seconds',
    help: 'Duration of health checks in seconds',
    labelNames: ['check_type'],
});
const healthCheckStatus = new metrics_1.promClient.Gauge({
    name: 'PharmacyCopilot_health_check_status',
    help: 'Status of health checks (1 = healthy, 0 = unhealthy)',
    labelNames: ['check_type'],
});
router.get('/', async (req, res) => {
    const startTime = Date.now();
    const checks = [];
    try {
        const dbCheckStart = Date.now();
        try {
            await mongoose_1.default.connection.db.admin().ping();
            const dbDuration = Date.now() - dbCheckStart;
            checks.push({
                name: 'database',
                status: 'healthy',
                message: 'MongoDB connection is healthy',
                duration: dbDuration,
                details: {
                    readyState: mongoose_1.default.connection.readyState,
                    host: mongoose_1.default.connection.host,
                    port: mongoose_1.default.connection.port,
                },
            });
            healthCheckStatus.set({ check_type: 'database' }, 1);
            healthCheckDuration.observe({ check_type: 'database' }, dbDuration / 1000);
        }
        catch (error) {
            checks.push({
                name: 'database',
                status: 'unhealthy',
                message: 'MongoDB connection failed',
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
            healthCheckStatus.set({ check_type: 'database' }, 0);
        }
        const memoryUsage = process.memoryUsage();
        const memoryCheckStart = Date.now();
        const memoryThreshold = 1024 * 1024 * 1024;
        const isMemoryHealthy = memoryUsage.heapUsed < memoryThreshold;
        checks.push({
            name: 'memory',
            status: isMemoryHealthy ? 'healthy' : 'unhealthy',
            message: isMemoryHealthy ? 'Memory usage is within limits' : 'Memory usage is high',
            duration: Date.now() - memoryCheckStart,
            details: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024),
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
            },
        });
        healthCheckStatus.set({ check_type: 'memory' }, isMemoryHealthy ? 1 : 0);
        const eventLoopStart = Date.now();
        await new Promise(resolve => setImmediate(resolve));
        const eventLoopLag = Date.now() - eventLoopStart;
        const isEventLoopHealthy = eventLoopLag < 100;
        checks.push({
            name: 'event_loop',
            status: isEventLoopHealthy ? 'healthy' : 'unhealthy',
            message: isEventLoopHealthy ? 'Event loop is responsive' : 'Event loop lag detected',
            duration: eventLoopLag,
            details: {
                lag: eventLoopLag,
                threshold: 100,
            },
        });
        healthCheckStatus.set({ check_type: 'event_loop' }, isEventLoopHealthy ? 1 : 0);
        const envCheckStart = Date.now();
        const requiredEnvVars = [
            'NODE_ENV',
            'MONGODB_URI',
            'JWT_SECRET',
            'RESEND_API_KEY',
        ];
        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
        const isEnvHealthy = missingEnvVars.length === 0;
        checks.push({
            name: 'environment',
            status: isEnvHealthy ? 'healthy' : 'unhealthy',
            message: isEnvHealthy ? 'All required environment variables are set' : 'Missing required environment variables',
            duration: Date.now() - envCheckStart,
            details: {
                missing: missingEnvVars,
                nodeEnv: process.env.NODE_ENV,
            },
        });
        healthCheckStatus.set({ check_type: 'environment' }, isEnvHealthy ? 1 : 0);
        const healthyChecks = checks.filter(check => check.status === 'healthy').length;
        const unhealthyChecks = checks.filter(check => check.status === 'unhealthy').length;
        const overallStatus = unhealthyChecks === 0 ? 'healthy' : 'unhealthy';
        const response = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks,
            summary: {
                total: checks.length,
                healthy: healthyChecks,
                unhealthy: unhealthyChecks,
            },
        };
        healthCheckStatus.set({ check_type: 'overall' }, overallStatus === 'healthy' ? 1 : 0);
        healthCheckDuration.observe({ check_type: 'overall' }, (Date.now() - startTime) / 1000);
        const statusCode = overallStatus === 'healthy' ? 200 : 503;
        res.status(statusCode).json(response);
    }
    catch (error) {
        const response = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: [{
                    name: 'health_check',
                    status: 'unhealthy',
                    message: 'Health check failed',
                    details: { error: error instanceof Error ? error.message : 'Unknown error' },
                }],
            summary: {
                total: 1,
                healthy: 0,
                unhealthy: 1,
            },
        };
        healthCheckStatus.set({ check_type: 'overall' }, 0);
        res.status(503).json(response);
    }
});
router.get('/detailed', async (req, res) => {
    const startTime = Date.now();
    const checks = [];
    try {
        const collectionsCheckStart = Date.now();
        try {
            const collections = await mongoose_1.default.connection.db.listCollections().toArray();
            const requiredCollections = ['users', 'workplaces', 'subscriptions', 'invitations'];
            const existingCollections = collections.map(c => c.name);
            const missingCollections = requiredCollections.filter(c => !existingCollections.includes(c));
            checks.push({
                name: 'database_collections',
                status: missingCollections.length === 0 ? 'healthy' : 'unhealthy',
                message: missingCollections.length === 0 ? 'All required collections exist' : 'Missing required collections',
                duration: Date.now() - collectionsCheckStart,
                details: {
                    existing: existingCollections,
                    missing: missingCollections,
                    total: collections.length,
                },
            });
        }
        catch (error) {
            checks.push({
                name: 'database_collections',
                status: 'unhealthy',
                message: 'Failed to check database collections',
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
        }
        const emailCheckStart = Date.now();
        try {
            const hasEmailConfig = !!(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);
            checks.push({
                name: 'email_service',
                status: hasEmailConfig ? 'healthy' : 'unhealthy',
                message: hasEmailConfig ? 'Email service configuration is present' : 'Email service not configured',
                duration: Date.now() - emailCheckStart,
                details: {
                    hasApiKey: !!process.env.RESEND_API_KEY,
                    hasFromEmail: !!process.env.FROM_EMAIL,
                },
            });
        }
        catch (error) {
            checks.push({
                name: 'email_service',
                status: 'unhealthy',
                message: 'Email service check failed',
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
        }
        const fsCheckStart = Date.now();
        try {
            const fs = require('fs').promises;
            const tempFile = '/tmp/PharmacyCopilot_health_check';
            await fs.writeFile(tempFile, 'health check');
            await fs.unlink(tempFile);
            checks.push({
                name: 'file_system',
                status: 'healthy',
                message: 'File system is writable',
                duration: Date.now() - fsCheckStart,
            });
        }
        catch (error) {
            checks.push({
                name: 'file_system',
                status: 'unhealthy',
                message: 'File system check failed',
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
        }
        const healthyChecks = checks.filter(check => check.status === 'healthy').length;
        const unhealthyChecks = checks.filter(check => check.status === 'unhealthy').length;
        const overallStatus = unhealthyChecks === 0 ? 'healthy' : 'unhealthy';
        const response = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks,
            summary: {
                total: checks.length,
                healthy: healthyChecks,
                unhealthy: unhealthyChecks,
            },
        };
        const statusCode = overallStatus === 'healthy' ? 200 : 503;
        res.status(statusCode).json(response);
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            checks: [{
                    name: 'detailed_health_check',
                    status: 'unhealthy',
                    message: 'Detailed health check failed',
                    details: { error: error instanceof Error ? error.message : 'Unknown error' },
                }],
            summary: {
                total: 1,
                healthy: 0,
                unhealthy: 1,
            },
        });
    }
});
router.get('/ready', async (req, res) => {
    try {
        await mongoose_1.default.connection.db.admin().ping();
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            message: 'Application is ready to serve requests',
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            message: 'Application is not ready to serve requests',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
        message: 'Application is alive',
    });
});
exports.default = router;
//# sourceMappingURL=healthRoutes.js.map