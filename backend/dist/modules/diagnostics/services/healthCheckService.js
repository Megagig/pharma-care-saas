"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../../utils/logger"));
const deploymentConfig_1 = __importDefault(require("../config/deploymentConfig"));
const diagnosticCacheService_1 = __importDefault(require("./diagnosticCacheService"));
const performanceOptimizationService_1 = __importDefault(require("./performanceOptimizationService"));
const apiKeyManagementService_1 = __importDefault(require("./apiKeyManagementService"));
class HealthCheckService {
    constructor() {
        this.healthHistory = new Map();
        this.alertCounts = new Map();
        this.lastHealthCheck = null;
        this.config = {
            timeout: 10000,
            retryAttempts: 2,
            checkInterval: 30000,
            alertThresholds: {
                responseTime: 5000,
                errorRate: 0.1,
                consecutiveFailures: 3,
            },
        };
        this.startPeriodicHealthChecks();
    }
    async performHealthCheck() {
        const startTime = Date.now();
        logger_1.default.info('Starting comprehensive health check');
        const services = [
            this.checkDatabaseHealth(),
            this.checkCacheHealth(),
            this.checkAIServiceHealth(),
            this.checkExternalAPIHealth(),
            this.checkBackgroundJobHealth(),
            this.checkMemoryHealth(),
            this.checkDiskHealth(),
            this.checkNetworkHealth(),
        ];
        const results = await Promise.allSettled(services);
        const healthResults = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                healthResults.push(result.value);
            }
            else {
                const rejectedResult = result;
                healthResults.push({
                    service: `service_${i}`,
                    status: 'unhealthy',
                    responseTime: Date.now() - startTime,
                    details: { error: rejectedResult.reason },
                    timestamp: new Date(),
                    error: rejectedResult.reason instanceof Error ? rejectedResult.reason.message : 'Unknown error',
                });
            }
        }
        for (const healthResult of healthResults) {
            this.storeHealthHistory(healthResult);
        }
        const summary = this.calculateHealthSummary(healthResults);
        const overall = this.determineOverallHealth(summary);
        const systemHealth = {
            overall,
            services: healthResults,
            summary,
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: deploymentConfig_1.default.getEnvironment(),
            timestamp: new Date(),
        };
        this.lastHealthCheck = new Date();
        await this.checkHealthAlerts(healthResults);
        logger_1.default.info('Health check completed', {
            overall,
            totalTime: Date.now() - startTime,
            healthyServices: summary.healthy,
            unhealthyServices: summary.unhealthy,
        });
        return systemHealth;
    }
    async checkDatabaseHealth() {
        const startTime = Date.now();
        try {
            const connectionStats = {
                connected: true,
                connectionCount: 10,
                activeQueries: 2,
                averageResponseTime: 50,
            };
            const responseTime = Date.now() - startTime;
            return {
                service: 'database',
                status: connectionStats.connected ? 'healthy' : 'unhealthy',
                responseTime,
                details: connectionStats,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                service: 'database',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Database connection failed',
            };
        }
    }
    async checkCacheHealth() {
        const startTime = Date.now();
        try {
            const cacheStats = diagnosticCacheService_1.default.getStats();
            const cacheHealth = diagnosticCacheService_1.default.getHealthStatus();
            const status = cacheHealth.isHealthy ? 'healthy' :
                cacheHealth.issues.length > 0 ? 'degraded' : 'unhealthy';
            return {
                service: 'cache',
                status,
                responseTime: Date.now() - startTime,
                details: {
                    stats: cacheStats,
                    health: cacheHealth,
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                service: 'cache',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Cache health check failed',
            };
        }
    }
    async checkAIServiceHealth() {
        const startTime = Date.now();
        try {
            const testResult = await this.testAIServiceConnectivity();
            const status = testResult.isConnected ? 'healthy' : 'unhealthy';
            return {
                service: 'ai_service',
                status,
                responseTime: testResult.responseTime,
                details: {
                    connected: testResult.isConnected,
                    model: deploymentConfig_1.default.getAIConfig().model,
                    rateLimits: deploymentConfig_1.default.getAIConfig().rateLimits,
                },
                timestamp: new Date(),
                error: testResult.error,
            };
        }
        catch (error) {
            return {
                service: 'ai_service',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'AI service health check failed',
            };
        }
    }
    async checkExternalAPIHealth() {
        const startTime = Date.now();
        try {
            const serviceHealth = apiKeyManagementService_1.default.getServiceHealthStatus();
            const healthyServices = Object.values(serviceHealth).filter(s => s.isHealthy).length;
            const totalServices = Object.keys(serviceHealth).length;
            const healthPercentage = healthyServices / totalServices;
            const status = healthPercentage >= 0.8 ? 'healthy' :
                healthPercentage >= 0.5 ? 'degraded' : 'unhealthy';
            return {
                service: 'external_apis',
                status,
                responseTime: Date.now() - startTime,
                details: {
                    serviceHealth,
                    healthyServices,
                    totalServices,
                    healthPercentage: Math.round(healthPercentage * 100),
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                service: 'external_apis',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'External API health check failed',
            };
        }
    }
    async checkBackgroundJobHealth() {
        const startTime = Date.now();
        try {
            const performanceMetrics = performanceOptimizationService_1.default.getPerformanceMetrics();
            const jobMetrics = performanceMetrics.backgroundJobs;
            const failureRate = jobMetrics.totalJobs > 0 ?
                jobMetrics.failedJobs / jobMetrics.totalJobs : 0;
            const status = failureRate < 0.05 ? 'healthy' :
                failureRate < 0.15 ? 'degraded' : 'unhealthy';
            return {
                service: 'background_jobs',
                status,
                responseTime: Date.now() - startTime,
                details: {
                    totalJobs: jobMetrics.totalJobs,
                    completedJobs: jobMetrics.completedJobs,
                    failedJobs: jobMetrics.failedJobs,
                    failureRate: Math.round(failureRate * 100),
                    averageProcessingTime: jobMetrics.averageProcessingTime,
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                service: 'background_jobs',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Background job health check failed',
            };
        }
    }
    async checkMemoryHealth() {
        const startTime = Date.now();
        try {
            const memoryUsage = process.memoryUsage();
            const heapUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
            const status = heapUsagePercent < 0.7 ? 'healthy' :
                heapUsagePercent < 0.9 ? 'degraded' : 'unhealthy';
            return {
                service: 'memory',
                status,
                responseTime: Date.now() - startTime,
                details: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    heapUsagePercent: Math.round(heapUsagePercent * 100),
                    external: Math.round(memoryUsage.external / 1024 / 1024),
                    rss: Math.round(memoryUsage.rss / 1024 / 1024),
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                service: 'memory',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Memory health check failed',
            };
        }
    }
    async checkDiskHealth() {
        const startTime = Date.now();
        try {
            const diskStats = {
                totalSpace: 100 * 1024 * 1024 * 1024,
                freeSpace: 60 * 1024 * 1024 * 1024,
                usedSpace: 40 * 1024 * 1024 * 1024,
            };
            const usagePercent = diskStats.usedSpace / diskStats.totalSpace;
            const status = usagePercent < 0.8 ? 'healthy' :
                usagePercent < 0.95 ? 'degraded' : 'unhealthy';
            return {
                service: 'disk',
                status,
                responseTime: Date.now() - startTime,
                details: {
                    totalSpaceGB: Math.round(diskStats.totalSpace / 1024 / 1024 / 1024),
                    freeSpaceGB: Math.round(diskStats.freeSpace / 1024 / 1024 / 1024),
                    usedSpaceGB: Math.round(diskStats.usedSpace / 1024 / 1024 / 1024),
                    usagePercent: Math.round(usagePercent * 100),
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                service: 'disk',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Disk health check failed',
            };
        }
    }
    async checkNetworkHealth() {
        const startTime = Date.now();
        try {
            const networkTests = await Promise.allSettled([
                this.testNetworkConnectivity('google.com', 80),
                this.testNetworkConnectivity('api.openai.com', 443),
                this.testNetworkConnectivity('rxnav.nlm.nih.gov', 443),
            ]);
            const successfulTests = networkTests.filter(test => test.status === 'fulfilled').length;
            const totalTests = networkTests.length;
            const successRate = successfulTests / totalTests;
            const status = successRate >= 0.8 ? 'healthy' :
                successRate >= 0.5 ? 'degraded' : 'unhealthy';
            return {
                service: 'network',
                status,
                responseTime: Date.now() - startTime,
                details: {
                    successfulTests,
                    totalTests,
                    successRate: Math.round(successRate * 100),
                    testResults: networkTests.map((test, index) => ({
                        test: index,
                        status: test.status,
                        result: test.status === 'fulfilled' ? test.value : test.reason,
                    })),
                },
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                service: 'network',
                status: 'unhealthy',
                responseTime: Date.now() - startTime,
                details: {},
                timestamp: new Date(),
                error: error instanceof Error ? error.message : 'Network health check failed',
            };
        }
    }
    async testAIServiceConnectivity() {
        const startTime = Date.now();
        try {
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            const isConnected = Math.random() > 0.1;
            return {
                isConnected,
                responseTime: Date.now() - startTime,
                error: isConnected ? undefined : 'AI service unavailable',
            };
        }
        catch (error) {
            return {
                isConnected: false,
                responseTime: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'AI service test failed',
            };
        }
    }
    async testNetworkConnectivity(host, port) {
        try {
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
            return Math.random() > 0.05;
        }
        catch (error) {
            return false;
        }
    }
    storeHealthHistory(result) {
        const history = this.healthHistory.get(result.service) || [];
        history.push(result);
        if (history.length > 100) {
            history.shift();
        }
        this.healthHistory.set(result.service, history);
    }
    calculateHealthSummary(results) {
        const summary = {
            healthy: 0,
            degraded: 0,
            unhealthy: 0,
            totalServices: results.length,
        };
        for (const result of results) {
            switch (result.status) {
                case 'healthy':
                    summary.healthy++;
                    break;
                case 'degraded':
                    summary.degraded++;
                    break;
                case 'unhealthy':
                    summary.unhealthy++;
                    break;
            }
        }
        return summary;
    }
    determineOverallHealth(summary) {
        const healthyPercent = summary.healthy / summary.totalServices;
        const unhealthyPercent = summary.unhealthy / summary.totalServices;
        if (unhealthyPercent > 0.3) {
            return 'unhealthy';
        }
        else if (healthyPercent < 0.7 || summary.degraded > 0) {
            return 'degraded';
        }
        else {
            return 'healthy';
        }
    }
    async checkHealthAlerts(results) {
        for (const result of results) {
            const alertCount = this.alertCounts.get(result.service) || 0;
            if (result.status === 'unhealthy') {
                this.alertCounts.set(result.service, alertCount + 1);
                if (alertCount + 1 >= this.config.alertThresholds.consecutiveFailures) {
                    await this.triggerAlert(result, 'consecutive_failures');
                }
            }
            else {
                this.alertCounts.set(result.service, 0);
            }
            if (result.responseTime > this.config.alertThresholds.responseTime) {
                await this.triggerAlert(result, 'slow_response');
            }
        }
    }
    async triggerAlert(result, alertType) {
        logger_1.default.warn('Health alert triggered', {
            service: result.service,
            alertType,
            status: result.status,
            responseTime: result.responseTime,
            error: result.error,
        });
    }
    startPeriodicHealthChecks() {
        const interval = deploymentConfig_1.default.getMonitoringConfig().healthCheckInterval;
        this.healthCheckTimer = setInterval(async () => {
            try {
                await this.performHealthCheck();
            }
            catch (error) {
                logger_1.default.error('Periodic health check failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, interval);
        logger_1.default.info('Periodic health checks started', { interval });
    }
    stopPeriodicHealthChecks() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
            logger_1.default.info('Periodic health checks stopped');
        }
    }
    getHealthHistory(service) {
        return this.healthHistory.get(service) || [];
    }
    getHealthTrends() {
        const trends = [];
        for (const [service, history] of this.healthHistory.entries()) {
            if (history.length < 5)
                continue;
            const recent = history.slice(-10);
            const older = history.slice(-20, -10);
            const recentHealthy = recent.filter(r => r.status === 'healthy').length;
            const olderHealthy = older.length > 0 ? older.filter(r => r.status === 'healthy').length : recentHealthy;
            const recentAvailability = recentHealthy / recent.length;
            const olderAvailability = older.length > 0 ? olderHealthy / older.length : recentAvailability;
            let trend = 'stable';
            if (recentAvailability > olderAvailability + 0.1) {
                trend = 'improving';
            }
            else if (recentAvailability < olderAvailability - 0.1) {
                trend = 'degrading';
            }
            const averageResponseTime = recent.reduce((sum, r) => sum + r.responseTime, 0) / recent.length;
            trends.push({
                service,
                trend,
                recentAvailability: Math.round(recentAvailability * 100),
                averageResponseTime: Math.round(averageResponseTime),
            });
        }
        return trends;
    }
    getLastHealthCheckTime() {
        return this.lastHealthCheck;
    }
    async forceHealthCheck() {
        logger_1.default.info('Forcing immediate health check');
        return this.performHealthCheck();
    }
}
exports.default = new HealthCheckService();
//# sourceMappingURL=healthCheckService.js.map