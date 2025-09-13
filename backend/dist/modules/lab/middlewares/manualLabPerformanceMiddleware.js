"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackCacheOperation = exports.trackDatabaseQuery = exports.finalizePerformanceTracking = exports.initializePerformanceTracking = void 0;
exports.MonitorPerformance = MonitorPerformance;
const manualLabPerformanceService_1 = __importDefault(require("../services/manualLabPerformanceService"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const initializePerformanceTracking = (operation) => {
    return (req, res, next) => {
        req.performanceContext = {
            startTime: Date.now(),
            operation,
            workplaceId: req.user?.workplaceId?.toString(),
            userId: req.user?._id?.toString(),
            orderId: req.params?.orderId,
            metadata: {}
        };
        const originalJson = res.json;
        res.json = function (body) {
            if (req.performanceContext) {
                req.performanceContext.metadata.responseBody = body;
                req.performanceContext.metadata.statusCode = res.statusCode;
            }
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.initializePerformanceTracking = initializePerformanceTracking;
const finalizePerformanceTracking = () => {
    return async (req, res, next) => {
        if (!req.performanceContext) {
            return next();
        }
        const context = req.performanceContext;
        const endTime = Date.now();
        const totalTime = endTime - context.startTime;
        try {
            switch (context.operation) {
                case 'createOrder':
                    await recordOrderCreationMetrics(req, context, totalTime);
                    break;
                case 'servePDF':
                    await recordPDFServingMetrics(req, context, totalTime);
                    break;
                case 'addResults':
                    await recordResultEntryMetrics(req, context, totalTime);
                    break;
                case 'getOrder':
                case 'getOrders':
                case 'getResults':
                    await recordDataRetrievalMetrics(req, context, totalTime);
                    break;
                default:
                    await recordGenericOperationMetrics(req, context, totalTime);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to record performance metrics', {
                operation: context.operation,
                orderId: context.orderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                service: 'manual-lab-performance-middleware'
            });
        }
        next();
    };
};
exports.finalizePerformanceTracking = finalizePerformanceTracking;
const trackDatabaseQuery = (operation, collection) => {
    return async (target, propertyName, descriptor) => {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const startTime = Date.now();
            let success = true;
            let errorType;
            let documentsAffected = 0;
            try {
                const result = await method.apply(this, args);
                if (result && typeof result === 'object') {
                    if (Array.isArray(result)) {
                        documentsAffected = result.length;
                    }
                    else if (result.length !== undefined) {
                        documentsAffected = result.length;
                    }
                    else if (result.modifiedCount !== undefined) {
                        documentsAffected = result.modifiedCount;
                    }
                    else if (result.deletedCount !== undefined) {
                        documentsAffected = result.deletedCount;
                    }
                    else {
                        documentsAffected = 1;
                    }
                }
                return result;
            }
            catch (error) {
                success = false;
                errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
                throw error;
            }
            finally {
                const queryTime = Date.now() - startTime;
                const metrics = {
                    operation,
                    collection,
                    queryTime,
                    documentsAffected,
                    indexesUsed: [],
                    success,
                    errorType,
                    timestamp: new Date(),
                    workplaceId: args[0]?.workplaceId?.toString(),
                    userId: args[0]?.userId?.toString()
                };
                manualLabPerformanceService_1.default.recordDatabaseQueryMetrics(metrics).catch(err => {
                    logger_1.default.error('Failed to record database query metrics', {
                        operation,
                        collection,
                        error: err instanceof Error ? err.message : 'Unknown error'
                    });
                });
            }
        };
        return descriptor;
    };
};
exports.trackDatabaseQuery = trackDatabaseQuery;
const trackCacheOperation = (operation) => {
    return (cacheKey, workplaceId) => {
        return async (target, propertyName, descriptor) => {
            const method = descriptor.value;
            descriptor.value = async function (...args) {
                const startTime = Date.now();
                let success = true;
                let errorType;
                let hit = false;
                let dataSize;
                try {
                    const result = await method.apply(this, args);
                    if (operation === 'get') {
                        hit = result !== null && result !== undefined;
                        if (hit && typeof result === 'string') {
                            dataSize = Buffer.byteLength(result, 'utf8');
                        }
                        else if (hit && result) {
                            dataSize = Buffer.byteLength(JSON.stringify(result), 'utf8');
                        }
                    }
                    return result;
                }
                catch (error) {
                    success = false;
                    errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
                    throw error;
                }
                finally {
                    const operationTime = Date.now() - startTime;
                    const metrics = {
                        operation,
                        cacheKey,
                        operationTime,
                        hit,
                        dataSize,
                        success,
                        errorType,
                        timestamp: new Date(),
                        workplaceId
                    };
                    manualLabPerformanceService_1.default.recordCacheMetrics(metrics).catch(err => {
                        logger_1.default.error('Failed to record cache metrics', {
                            operation,
                            cacheKey,
                            error: err instanceof Error ? err.message : 'Unknown error'
                        });
                    });
                }
            };
            return descriptor;
        };
    };
};
exports.trackCacheOperation = trackCacheOperation;
async function recordOrderCreationMetrics(req, context, totalTime) {
    const responseBody = context.metadata?.responseBody;
    const success = context.metadata?.statusCode < 400;
    if (!context.workplaceId || !context.userId) {
        return;
    }
    const metrics = {
        orderId: context.orderId || responseBody?.data?.orderId || 'unknown',
        workplaceId: context.workplaceId,
        patientId: req.body?.patientId || responseBody?.data?.patientId || 'unknown',
        orderCreationTime: totalTime,
        pdfGenerationTime: 0,
        totalProcessingTime: totalTime,
        testCount: req.body?.tests?.length || responseBody?.data?.testCount || 0,
        pdfSize: responseBody?.data?.pdfSize || 0,
        success,
        errorType: success ? undefined : getErrorType(responseBody),
        timestamp: new Date(),
        userId: context.userId,
        priority: req.body?.priority || 'routine'
    };
    await manualLabPerformanceService_1.default.recordOrderProcessingMetrics(metrics);
}
async function recordPDFServingMetrics(req, context, totalTime) {
    const success = context.metadata?.statusCode < 400;
    if (!context.workplaceId || !context.orderId) {
        return;
    }
    const metrics = {
        orderId: context.orderId,
        templateRenderTime: 0,
        qrCodeGenerationTime: 0,
        barcodeGenerationTime: 0,
        puppeteerProcessingTime: 0,
        totalGenerationTime: totalTime,
        pdfSize: parseInt(req.get('Content-Length') || '0'),
        pageCount: 1,
        testCount: 0,
        success,
        errorType: success ? undefined : getErrorType(context.metadata?.responseBody),
        fromCache: req.get('X-From-Cache') === 'true',
        timestamp: new Date(),
        workplaceId: context.workplaceId
    };
    await manualLabPerformanceService_1.default.recordPDFGenerationMetrics(metrics);
}
async function recordResultEntryMetrics(req, context, totalTime) {
    const responseBody = context.metadata?.responseBody;
    const success = context.metadata?.statusCode < 400;
    if (!context.workplaceId || !context.userId || !context.orderId) {
        return;
    }
    const metrics = {
        orderId: context.orderId,
        workplaceId: context.workplaceId,
        patientId: responseBody?.data?.patientId || 'unknown',
        orderCreationTime: 0,
        pdfGenerationTime: 0,
        totalProcessingTime: totalTime,
        testCount: req.body?.values?.length || responseBody?.data?.testCount || 0,
        pdfSize: 0,
        success,
        errorType: success ? undefined : getErrorType(responseBody),
        timestamp: new Date(),
        userId: context.userId,
        priority: 'routine'
    };
    await manualLabPerformanceService_1.default.recordOrderProcessingMetrics(metrics);
}
async function recordDataRetrievalMetrics(req, context, totalTime) {
    const responseBody = context.metadata?.responseBody;
    const success = context.metadata?.statusCode < 400;
    if (!context.workplaceId || !context.userId) {
        return;
    }
    const metrics = {
        orderId: context.orderId || 'bulk_operation',
        workplaceId: context.workplaceId,
        patientId: req.params?.patientId || req.query?.patientId || 'unknown',
        orderCreationTime: 0,
        pdfGenerationTime: 0,
        totalProcessingTime: totalTime,
        testCount: 0,
        pdfSize: 0,
        success,
        errorType: success ? undefined : getErrorType(responseBody),
        timestamp: new Date(),
        userId: context.userId,
        priority: 'routine'
    };
    await manualLabPerformanceService_1.default.recordOrderProcessingMetrics(metrics);
}
async function recordGenericOperationMetrics(req, context, totalTime) {
    const responseBody = context.metadata?.responseBody;
    const success = context.metadata?.statusCode < 400;
    if (!context.workplaceId || !context.userId) {
        return;
    }
    const metrics = {
        orderId: context.orderId || 'generic_operation',
        workplaceId: context.workplaceId,
        patientId: 'unknown',
        orderCreationTime: 0,
        pdfGenerationTime: 0,
        totalProcessingTime: totalTime,
        testCount: 0,
        pdfSize: 0,
        success,
        errorType: success ? undefined : getErrorType(responseBody),
        timestamp: new Date(),
        userId: context.userId,
        priority: 'routine'
    };
    await manualLabPerformanceService_1.default.recordOrderProcessingMetrics(metrics);
}
function getErrorType(responseBody) {
    if (!responseBody || !responseBody.error) {
        return 'UnknownError';
    }
    return responseBody.error.code || responseBody.error.type || 'UnknownError';
}
function MonitorPerformance(operation) {
    return function (target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = async function (...args) {
            const startTime = Date.now();
            let success = true;
            let errorType;
            try {
                const result = await method.apply(this, args);
                return result;
            }
            catch (error) {
                success = false;
                errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
                throw error;
            }
            finally {
                const totalTime = Date.now() - startTime;
                logger_1.default.info(`${operation} completed`, {
                    operation,
                    duration: totalTime,
                    success,
                    errorType,
                    service: 'manual-lab-performance'
                });
                if (args[0] && typeof args[0] === 'object' && args[0].workplaceId) {
                    const metrics = {
                        orderId: args[0].orderId || 'service_operation',
                        workplaceId: args[0].workplaceId.toString(),
                        patientId: args[0].patientId?.toString() || 'unknown',
                        orderCreationTime: 0,
                        pdfGenerationTime: 0,
                        totalProcessingTime: totalTime,
                        testCount: 0,
                        pdfSize: 0,
                        success,
                        errorType,
                        timestamp: new Date(),
                        userId: args[0].userId?.toString() || 'system',
                        priority: 'routine'
                    };
                    manualLabPerformanceService_1.default.recordOrderProcessingMetrics(metrics).catch(err => {
                        logger_1.default.error('Failed to record service performance metrics', {
                            operation,
                            error: err instanceof Error ? err.message : 'Unknown error'
                        });
                    });
                }
            }
        };
        return descriptor;
    };
}
exports.default = {
    initializePerformanceTracking: exports.initializePerformanceTracking,
    finalizePerformanceTracking: exports.finalizePerformanceTracking,
    trackDatabaseQuery: exports.trackDatabaseQuery,
    trackCacheOperation: exports.trackCacheOperation,
    MonitorPerformance
};
//# sourceMappingURL=manualLabPerformanceMiddleware.js.map