"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManagementService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class MemoryManagementService {
    constructor() {
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.MONITORING_INTERVAL_MS = 30000;
    }
    static getInstance() {
        if (!MemoryManagementService.instance) {
            MemoryManagementService.instance = new MemoryManagementService();
        }
        return MemoryManagementService.instance;
    }
    startMonitoring() {
        if (this.isMonitoring) {
            logger_1.default.warn('Memory monitoring is already active');
            return;
        }
        const memoryThreshold = parseInt(process.env.MEMORY_THRESHOLD || '90');
        const cleanupEnabled = process.env.MEMORY_CLEANUP_ENABLED === 'true';
        if (!cleanupEnabled) {
            logger_1.default.info('Memory cleanup is disabled, skipping monitoring setup');
            return;
        }
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.checkMemoryUsage(memoryThreshold);
        }, this.MONITORING_INTERVAL_MS);
        logger_1.default.info(`Memory monitoring started with threshold: ${memoryThreshold}%`);
    }
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        logger_1.default.info('Memory monitoring stopped');
    }
    getMemoryStats() {
        const memUsage = process.memoryUsage();
        const totalMem = require('os').totalmem();
        const usedMem = memUsage.rss;
        const percentage = Math.round((usedMem / totalMem) * 100);
        return {
            used: usedMem,
            total: totalMem,
            percentage,
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external
        };
    }
    checkMemoryUsage(threshold) {
        const stats = this.getMemoryStats();
        logger_1.default.debug('Memory usage check', {
            percentage: stats.percentage,
            used: Math.round(stats.used / 1024 / 1024) + 'MB',
            threshold: threshold + '%'
        });
        if (stats.percentage >= threshold) {
            logger_1.default.warn(`Memory usage threshold exceeded: ${stats.percentage}% (threshold: ${threshold}%)`);
            this.performMemoryCleanup();
        }
    }
    performMemoryCleanup() {
        logger_1.default.info('Starting memory cleanup operations');
        try {
            if (global.gc) {
                logger_1.default.debug('Forcing garbage collection');
                global.gc();
            }
            this.clearApplicationCaches();
            setTimeout(() => {
                const stats = this.getMemoryStats();
                logger_1.default.info('Memory cleanup completed', {
                    percentage: stats.percentage,
                    used: Math.round(stats.used / 1024 / 1024) + 'MB'
                });
            }, 1000);
        }
        catch (error) {
            logger_1.default.error('Error during memory cleanup:', error);
        }
    }
    clearApplicationCaches() {
        try {
            const clearedModules = this.clearModuleCache();
            this.clearCustomCaches();
            logger_1.default.debug(`Cleared ${clearedModules} modules from cache`);
        }
        catch (error) {
            logger_1.default.error('Error clearing application caches:', error);
        }
    }
    clearModuleCache() {
        let clearedCount = 0;
        try {
            const modules = Object.keys(require.cache);
            const safeToClear = modules.filter(modulePath => {
                return !modulePath.includes('node_modules') &&
                    !modulePath.includes('app.ts') &&
                    !modulePath.includes('server.ts') &&
                    !modulePath.includes('database') &&
                    !modulePath.includes('redis') &&
                    !modulePath.includes('mongoose');
            });
            safeToClear.forEach(modulePath => {
                delete require.cache[modulePath];
                clearedCount++;
            });
        }
        catch (error) {
            logger_1.default.error('Error clearing module cache:', error);
        }
        return clearedCount;
    }
    clearCustomCaches() {
        try {
            if (global.gc) {
            }
        }
        catch (error) {
            logger_1.default.error('Error clearing custom caches:', error);
        }
    }
    getMemoryReport() {
        const stats = this.getMemoryStats();
        const threshold = parseInt(process.env.MEMORY_THRESHOLD || '90');
        const recommendations = [];
        if (stats.percentage > 80) {
            recommendations.push('High memory usage detected. Consider optimizing memory usage.');
        }
        if (stats.heapUsed / stats.heapTotal > 0.9) {
            recommendations.push('Heap memory is nearly full. Consider optimizing object allocations.');
        }
        return {
            current: stats,
            monitoring: {
                active: this.isMonitoring,
                interval: this.MONITORING_INTERVAL_MS,
                threshold
            },
            recommendations
        };
    }
    isMonitoringActive() {
        return this.isMonitoring;
    }
}
exports.MemoryManagementService = MemoryManagementService;
exports.default = MemoryManagementService.getInstance();
//# sourceMappingURL=MemoryManagementService.js.map