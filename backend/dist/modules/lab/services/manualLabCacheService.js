"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualLabCacheService = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
const performanceOptimization_1 = require("../../../utils/performanceOptimization");
const TestCatalog_1 = __importDefault(require("../models/TestCatalog"));
const CACHE_KEYS = {
    TEST_CATALOG: {
        ALL_ACTIVE: (workplaceId) => `manual_lab:test_catalog:active:${workplaceId}`,
        BY_CATEGORY: (workplaceId, category) => `manual_lab:test_catalog:category:${workplaceId}:${category}`,
        BY_SPECIMEN: (workplaceId, specimen) => `manual_lab:test_catalog:specimen:${workplaceId}:${specimen}`,
        CATEGORIES: (workplaceId) => `manual_lab:test_catalog:categories:${workplaceId}`,
        SPECIMEN_TYPES: (workplaceId) => `manual_lab:test_catalog:specimen_types:${workplaceId}`,
        SEARCH: (workplaceId, query, options) => `manual_lab:test_catalog:search:${workplaceId}:${query}:${options}`,
        BY_CODE: (workplaceId, code) => `manual_lab:test_catalog:code:${workplaceId}:${code}`
    },
    PDF: {
        REQUISITION: (orderId) => `manual_lab:pdf:requisition:${orderId}`,
        METADATA: (orderId) => `manual_lab:pdf:metadata:${orderId}`
    },
    ORDER: {
        BY_ID: (workplaceId, orderId) => `manual_lab:order:${workplaceId}:${orderId}`,
        BY_PATIENT: (workplaceId, patientId, page, limit) => `manual_lab:orders:patient:${workplaceId}:${patientId}:${page}:${limit}`,
        ACTIVE: (workplaceId) => `manual_lab:orders:active:${workplaceId}`,
        BY_STATUS: (workplaceId, status) => `manual_lab:orders:status:${workplaceId}:${status}`
    },
    RESULT: {
        BY_ORDER: (orderId) => `manual_lab:result:order:${orderId}`
    },
    STATS: {
        WORKPLACE: (workplaceId) => `manual_lab:stats:workplace:${workplaceId}`,
        PERFORMANCE: (workplaceId) => `manual_lab:performance:workplace:${workplaceId}`
    }
};
const CACHE_TTL = {
    TEST_CATALOG: 3600,
    PDF: 86400,
    ORDER: 300,
    RESULT: 1800,
    STATS: 600,
    SEARCH: 900
};
class ManualLabCacheService {
    static async cacheActiveTestCatalog(workplaceId) {
        const cacheKey = CACHE_KEYS.TEST_CATALOG.ALL_ACTIVE(workplaceId.toString());
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                logger_1.default.debug('Test catalog retrieved from cache', {
                    workplaceId: workplaceId.toString(),
                    count: cached.length,
                    service: 'manual-lab-cache'
                });
                return cached;
            }
            const tests = await TestCatalog_1.default.findActiveTests(workplaceId);
            await performanceOptimization_1.CacheManager.set(cacheKey, tests, { ttl: CACHE_TTL.TEST_CATALOG });
            logger_1.default.info('Test catalog cached successfully', {
                workplaceId: workplaceId.toString(),
                count: tests.length,
                service: 'manual-lab-cache'
            });
            return tests;
        }
        catch (error) {
            logger_1.default.error('Failed to cache test catalog', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return await TestCatalog_1.default.findActiveTests(workplaceId);
        }
    }
    static async cacheTestsByCategory(workplaceId, category) {
        const cacheKey = CACHE_KEYS.TEST_CATALOG.BY_CATEGORY(workplaceId.toString(), category);
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
            const tests = await TestCatalog_1.default.findByCategory(workplaceId, category);
            await performanceOptimization_1.CacheManager.set(cacheKey, tests, { ttl: CACHE_TTL.TEST_CATALOG });
            return tests;
        }
        catch (error) {
            logger_1.default.error('Failed to cache tests by category', {
                workplaceId: workplaceId.toString(),
                category,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return await TestCatalog_1.default.findByCategory(workplaceId, category);
        }
    }
    static async cacheTestsBySpecimen(workplaceId, specimenType) {
        const cacheKey = CACHE_KEYS.TEST_CATALOG.BY_SPECIMEN(workplaceId.toString(), specimenType);
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
            const tests = await TestCatalog_1.default.findBySpecimenType(workplaceId, specimenType);
            await performanceOptimization_1.CacheManager.set(cacheKey, tests, { ttl: CACHE_TTL.TEST_CATALOG });
            return tests;
        }
        catch (error) {
            logger_1.default.error('Failed to cache tests by specimen type', {
                workplaceId: workplaceId.toString(),
                specimenType,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return await TestCatalog_1.default.findBySpecimenType(workplaceId, specimenType);
        }
    }
    static async cacheTestCategories(workplaceId) {
        const cacheKey = CACHE_KEYS.TEST_CATALOG.CATEGORIES(workplaceId.toString());
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
            const categories = await TestCatalog_1.default.getCategories(workplaceId);
            await performanceOptimization_1.CacheManager.set(cacheKey, categories, { ttl: CACHE_TTL.TEST_CATALOG });
            return categories;
        }
        catch (error) {
            logger_1.default.error('Failed to cache test categories', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return await TestCatalog_1.default.getCategories(workplaceId);
        }
    }
    static async cacheSpecimenTypes(workplaceId) {
        const cacheKey = CACHE_KEYS.TEST_CATALOG.SPECIMEN_TYPES(workplaceId.toString());
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
            const specimenTypes = await TestCatalog_1.default.getSpecimenTypes(workplaceId);
            await performanceOptimization_1.CacheManager.set(cacheKey, specimenTypes, { ttl: CACHE_TTL.TEST_CATALOG });
            return specimenTypes;
        }
        catch (error) {
            logger_1.default.error('Failed to cache specimen types', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return await TestCatalog_1.default.getSpecimenTypes(workplaceId);
        }
    }
    static async cacheTestSearch(workplaceId, query, options = {}) {
        const optionsKey = JSON.stringify(options);
        const cacheKey = CACHE_KEYS.TEST_CATALOG.SEARCH(workplaceId.toString(), query, optionsKey);
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                return cached;
            }
            const tests = await TestCatalog_1.default.searchTests(workplaceId, query, options);
            await performanceOptimization_1.CacheManager.set(cacheKey, tests, { ttl: CACHE_TTL.SEARCH });
            return tests;
        }
        catch (error) {
            logger_1.default.error('Failed to cache test search', {
                workplaceId: workplaceId.toString(),
                query,
                options,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return await TestCatalog_1.default.searchTests(workplaceId, query, options);
        }
    }
    static async cacheTestByCode(workplaceId, code) {
        const cacheKey = CACHE_KEYS.TEST_CATALOG.BY_CODE(workplaceId.toString(), code);
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached !== undefined) {
                return cached;
            }
            const test = await TestCatalog_1.default.findByCode(workplaceId, code);
            await performanceOptimization_1.CacheManager.set(cacheKey, test, { ttl: CACHE_TTL.TEST_CATALOG });
            return test;
        }
        catch (error) {
            logger_1.default.error('Failed to cache test by code', {
                workplaceId: workplaceId.toString(),
                code,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return await TestCatalog_1.default.findByCode(workplaceId, code);
        }
    }
    static async cachePDFRequisition(orderId, pdfData) {
        const pdfCacheKey = CACHE_KEYS.PDF.REQUISITION(orderId);
        const metadataCacheKey = CACHE_KEYS.PDF.METADATA(orderId);
        try {
            await performanceOptimization_1.CacheManager.set(pdfCacheKey, pdfData.pdfBuffer, {
                ttl: CACHE_TTL.PDF,
                compress: true
            });
            await performanceOptimization_1.CacheManager.set(metadataCacheKey, {
                fileName: pdfData.fileName,
                url: pdfData.url,
                metadata: pdfData.metadata,
                cachedAt: new Date()
            }, { ttl: CACHE_TTL.PDF });
            logger_1.default.info('PDF requisition cached successfully', {
                orderId,
                fileName: pdfData.fileName,
                bufferSize: pdfData.pdfBuffer.length,
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to cache PDF requisition', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async getCachedPDFRequisition(orderId) {
        const pdfCacheKey = CACHE_KEYS.PDF.REQUISITION(orderId);
        const metadataCacheKey = CACHE_KEYS.PDF.METADATA(orderId);
        try {
            const [pdfBuffer, metadata] = await Promise.all([
                performanceOptimization_1.CacheManager.get(pdfCacheKey),
                performanceOptimization_1.CacheManager.get(metadataCacheKey)
            ]);
            if (pdfBuffer && metadata) {
                logger_1.default.debug('PDF requisition retrieved from cache', {
                    orderId,
                    fileName: metadata.fileName,
                    bufferSize: pdfBuffer.length,
                    service: 'manual-lab-cache'
                });
                return {
                    pdfBuffer,
                    fileName: metadata.fileName,
                    url: metadata.url,
                    metadata: metadata.metadata
                };
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve cached PDF requisition', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return null;
        }
    }
    static async cacheOrder(order) {
        const cacheKey = CACHE_KEYS.ORDER.BY_ID(order.workplaceId.toString(), order.orderId);
        try {
            await performanceOptimization_1.CacheManager.set(cacheKey, order, { ttl: CACHE_TTL.ORDER });
            logger_1.default.debug('Manual lab order cached', {
                orderId: order.orderId,
                workplaceId: order.workplaceId.toString(),
                status: order.status,
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to cache manual lab order', {
                orderId: order.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async getCachedOrder(workplaceId, orderId) {
        const cacheKey = CACHE_KEYS.ORDER.BY_ID(workplaceId.toString(), orderId);
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                logger_1.default.debug('Manual lab order retrieved from cache', {
                    orderId,
                    workplaceId: workplaceId.toString(),
                    service: 'manual-lab-cache'
                });
            }
            return cached;
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve cached order', {
                orderId,
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return null;
        }
    }
    static async cachePatientOrders(workplaceId, patientId, orders, page, limit) {
        const cacheKey = CACHE_KEYS.ORDER.BY_PATIENT(workplaceId.toString(), patientId.toString(), page, limit);
        try {
            await performanceOptimization_1.CacheManager.set(cacheKey, orders, { ttl: CACHE_TTL.ORDER });
            logger_1.default.debug('Patient orders cached', {
                patientId: patientId.toString(),
                workplaceId: workplaceId.toString(),
                count: orders.length,
                page,
                limit,
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to cache patient orders', {
                patientId: patientId.toString(),
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async getCachedPatientOrders(workplaceId, patientId, page, limit) {
        const cacheKey = CACHE_KEYS.ORDER.BY_PATIENT(workplaceId.toString(), patientId.toString(), page, limit);
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                logger_1.default.debug('Patient orders retrieved from cache', {
                    patientId: patientId.toString(),
                    workplaceId: workplaceId.toString(),
                    count: cached.length,
                    page,
                    limit,
                    service: 'manual-lab-cache'
                });
            }
            return cached;
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve cached patient orders', {
                patientId: patientId.toString(),
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return null;
        }
    }
    static async cacheResult(result) {
        const cacheKey = CACHE_KEYS.RESULT.BY_ORDER(result.orderId);
        try {
            await performanceOptimization_1.CacheManager.set(cacheKey, result, { ttl: CACHE_TTL.RESULT });
            logger_1.default.debug('Manual lab result cached', {
                orderId: result.orderId,
                testCount: result.values.length,
                aiProcessed: result.aiProcessed,
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to cache manual lab result', {
                orderId: result.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async getCachedResult(orderId) {
        const cacheKey = CACHE_KEYS.RESULT.BY_ORDER(orderId);
        try {
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached) {
                logger_1.default.debug('Manual lab result retrieved from cache', {
                    orderId,
                    testCount: cached.values.length,
                    aiProcessed: cached.aiProcessed,
                    service: 'manual-lab-cache'
                });
            }
            return cached;
        }
        catch (error) {
            logger_1.default.error('Failed to retrieve cached result', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return null;
        }
    }
    static async invalidateTestCatalogCache(workplaceId) {
        try {
            const patterns = [
                CACHE_KEYS.TEST_CATALOG.ALL_ACTIVE(workplaceId.toString()),
                `${CACHE_KEYS.TEST_CATALOG.BY_CATEGORY(workplaceId.toString(), '*')}`,
                `${CACHE_KEYS.TEST_CATALOG.BY_SPECIMEN(workplaceId.toString(), '*')}`,
                CACHE_KEYS.TEST_CATALOG.CATEGORIES(workplaceId.toString()),
                CACHE_KEYS.TEST_CATALOG.SPECIMEN_TYPES(workplaceId.toString()),
                `${CACHE_KEYS.TEST_CATALOG.SEARCH(workplaceId.toString(), '*', '*')}`,
                `${CACHE_KEYS.TEST_CATALOG.BY_CODE(workplaceId.toString(), '*')}`
            ];
            await Promise.all(patterns.map(pattern => performanceOptimization_1.CacheManager.delete(pattern)));
            logger_1.default.info('Test catalog cache invalidated', {
                workplaceId: workplaceId.toString(),
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to invalidate test catalog cache', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async invalidateOrderCache(workplaceId, orderId, patientId) {
        try {
            const patterns = [];
            if (orderId) {
                patterns.push(CACHE_KEYS.ORDER.BY_ID(workplaceId.toString(), orderId));
            }
            if (patientId) {
                patterns.push(`${CACHE_KEYS.ORDER.BY_PATIENT(workplaceId.toString(), patientId.toString(), 0, 0).split(':').slice(0, -2).join(':')}:*`);
            }
            patterns.push(CACHE_KEYS.ORDER.ACTIVE(workplaceId.toString()));
            patterns.push(`${CACHE_KEYS.ORDER.BY_STATUS(workplaceId.toString(), '*')}`);
            await Promise.all(patterns.map(pattern => performanceOptimization_1.CacheManager.delete(pattern)));
            logger_1.default.info('Order cache invalidated', {
                workplaceId: workplaceId.toString(),
                orderId,
                patientId: patientId?.toString(),
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to invalidate order cache', {
                workplaceId: workplaceId.toString(),
                orderId,
                patientId: patientId?.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async invalidateResultCache(orderId) {
        try {
            await performanceOptimization_1.CacheManager.delete(CACHE_KEYS.RESULT.BY_ORDER(orderId));
            logger_1.default.info('Result cache invalidated', {
                orderId,
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to invalidate result cache', {
                orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async clearWorkplaceCache(workplaceId) {
        try {
            const patterns = [
                `manual_lab:*:${workplaceId.toString()}:*`,
                `manual_lab:*:${workplaceId.toString()}`
            ];
            await Promise.all(patterns.map(pattern => performanceOptimization_1.CacheManager.delete(pattern)));
            logger_1.default.info('All manual lab caches cleared for workplace', {
                workplaceId: workplaceId.toString(),
                service: 'manual-lab-cache'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to clear workplace cache', {
                workplaceId: workplaceId.toString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
        }
    }
    static async getCacheStats() {
        try {
            const redisClient = (0, performanceOptimization_1.getRedisClient)();
            if (!redisClient) {
                return {
                    redisConnected: false,
                    totalKeys: 0,
                    manualLabKeys: 0
                };
            }
            const [totalKeys, manualLabKeys, memoryInfoArray] = await Promise.all([
                redisClient.dbsize(),
                redisClient.keys('manual_lab:*').then(keys => keys.length),
                redisClient.memory('STATS').catch(() => null)
            ]);
            let memoryUsageBytes;
            if (memoryInfoArray) {
                const usedMemoryIndex = memoryInfoArray.indexOf('used_memory');
                if (usedMemoryIndex !== -1 && usedMemoryIndex + 1 < memoryInfoArray.length) {
                    memoryUsageBytes = parseInt(memoryInfoArray[usedMemoryIndex + 1]);
                }
            }
            return {
                redisConnected: true,
                totalKeys,
                manualLabKeys,
                memoryUsage: memoryUsageBytes ? `${Math.round(memoryUsageBytes / 1024 / 1024 * 100) / 100} MB` : undefined
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get cache statistics', {
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-cache'
            });
            return {
                redisConnected: false,
                totalKeys: 0,
                manualLabKeys: 0
            };
        }
    }
}
exports.ManualLabCacheService = ManualLabCacheService;
exports.default = ManualLabCacheService;
//# sourceMappingURL=manualLabCacheService.js.map