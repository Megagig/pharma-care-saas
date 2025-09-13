"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testFHIRConnection = exports.syncLabResultsFromFHIR = exports.exportLabOrderToFHIR = exports.importFHIRResults = exports.getLabDashboard = exports.getLabResultTrends = exports.deleteLabResult = exports.updateLabResult = exports.getLabResult = exports.getLabResults = exports.addLabResult = exports.cancelLabOrder = exports.updateLabOrder = exports.getLabOrder = exports.getLabOrders = exports.createLabOrder = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const labService_1 = __importDefault(require("../services/labService"));
const LabOrder_1 = __importDefault(require("../models/LabOrder"));
const LabResult_1 = __importDefault(require("../models/LabResult"));
exports.createLabOrder = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { patientId, tests, indication, priority = 'routine', expectedDate, externalOrderId, } = req.body;
    try {
        const labOrder = await labService_1.default.createLabOrder({
            patientId,
            orderedBy: context.userId,
            workplaceId: context.workplaceId,
            locationId: context.locationId,
            tests,
            indication,
            priority,
            expectedDate: expectedDate ? new Date(expectedDate) : undefined,
            externalOrderId,
        });
        console.log('Lab order created:', (0, responseHelpers_1.createAuditLog)('CREATE_LAB_ORDER', 'LabOrder', labOrder._id.toString(), context, {
            patientId,
            testsCount: tests.length,
            priority,
            indication: indication?.substring(0, 100),
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            order: labOrder,
        }, 'Lab order created successfully', 201);
    }
    catch (error) {
        logger_1.default.error('Failed to create lab order:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to create lab order: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getLabOrders = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, patientId, status, priority, orderedBy, fromDate, toDate, } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
    try {
        const filters = {
            workplaceId: context.workplaceId,
        };
        if (patientId)
            filters.patientId = patientId;
        if (status)
            filters.status = status;
        if (priority)
            filters.priority = priority;
        if (orderedBy)
            filters.orderedBy = orderedBy;
        if (fromDate || toDate) {
            filters.orderDate = {};
            if (fromDate)
                filters.orderDate.$gte = new Date(fromDate);
            if (toDate)
                filters.orderDate.$lte = new Date(toDate);
        }
        const orders = await labService_1.default.getLabOrders(context.workplaceId, filters, parsedPage, parsedLimit);
        (0, responseHelpers_1.respondWithPaginatedResults)(res, orders.orders, orders.total, orders.page, parsedLimit, `Found ${orders.total} lab orders`);
    }
    catch (error) {
        logger_1.default.error('Failed to get lab orders:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get lab orders: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getLabOrder = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const order = await LabOrder_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        })
            .populate('patientId', 'firstName lastName dateOfBirth')
            .populate('orderedBy', 'firstName lastName')
            .lean();
        if (!order) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab order not found', 404);
        }
        const results = await LabResult_1.default.find({
            orderId: order._id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        }).lean();
        (0, responseHelpers_1.sendSuccess)(res, {
            order,
            results,
            resultsCount: results.length,
            completedTests: results.length,
            totalTests: order.tests.length,
            isComplete: results.length === order.tests.length,
        }, 'Lab order retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get lab order:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get lab order: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.updateLabOrder = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const updates = req.body;
    try {
        const order = await LabOrder_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        });
        if (!order) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab order not found', 404);
        }
        if (order.status === 'completed') {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Cannot update completed lab order', 400);
        }
        const updatedOrder = await labService_1.default.updateLabOrder(id, updates, context.userId);
        console.log('Lab order updated:', (0, responseHelpers_1.createAuditLog)('UPDATE_LAB_ORDER', 'LabOrder', id, context, {
            updates: Object.keys(updates),
            previousStatus: order.status,
            newStatus: updatedOrder.status,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            order: updatedOrder,
        }, 'Lab order updated successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to update lab order:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to update lab order: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.cancelLabOrder = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const order = await LabOrder_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        });
        if (!order) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab order not found', 404);
        }
        if (['completed', 'cancelled'].includes(order.status)) {
            return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', `Cannot cancel ${order.status} lab order`, 400);
        }
        await labService_1.default.cancelLabOrder(id, context.userId);
        console.log('Lab order cancelled:', (0, responseHelpers_1.createAuditLog)('CANCEL_LAB_ORDER', 'LabOrder', id, context, {
            previousStatus: order.status,
            testsCount: order.tests.length,
        }));
        (0, responseHelpers_1.sendSuccess)(res, null, 'Lab order cancelled successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to cancel lab order:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to cancel lab order: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.addLabResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { orderId, patientId, testCode, testName, value, unit, referenceRange, interpretation, flags, performedAt, externalResultId, loincCode, } = req.body;
    try {
        const labResult = await labService_1.default.addLabResult({
            orderId: orderId ? new mongoose_1.Types.ObjectId(orderId) : undefined,
            patientId: new mongoose_1.Types.ObjectId(patientId),
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            testCode,
            testName,
            value,
            unit,
            referenceRange,
            interpretation,
            flags,
            source: 'manual',
            performedAt: performedAt ? new Date(performedAt) : new Date(),
            recordedAt: new Date(),
            recordedBy: new mongoose_1.Types.ObjectId(context.userId),
            externalResultId,
            loincCode,
        });
        const validation = await labService_1.default.validateResult(labResult);
        console.log('Lab result added:', (0, responseHelpers_1.createAuditLog)('ADD_LAB_RESULT', 'LabResult', labResult._id.toString(), context, {
            patientId,
            testCode,
            testName,
            interpretation,
            isAbnormal: interpretation !== 'normal',
            orderId,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            result: labResult,
            validation,
        }, 'Lab result added successfully', 201);
    }
    catch (error) {
        logger_1.default.error('Failed to add lab result:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to add lab result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getLabResults = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, patientId, orderId, testCode, interpretation, fromDate, toDate, } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
    try {
        const filters = {
            workplaceId: context.workplaceId,
        };
        if (patientId)
            filters.patientId = patientId;
        if (orderId)
            filters.orderId = orderId;
        if (testCode)
            filters.testCode = testCode;
        if (interpretation)
            filters.interpretation = interpretation;
        if (fromDate || toDate) {
            filters.performedAt = {};
            if (fromDate)
                filters.performedAt.$gte = new Date(fromDate);
            if (toDate)
                filters.performedAt.$lte = new Date(toDate);
        }
        const results = await labService_1.default.getLabResults(context.workplaceId, filters, parsedPage, parsedLimit);
        (0, responseHelpers_1.respondWithPaginatedResults)(res, results.results, results.total, results.page, parsedLimit, `Found ${results.total} lab results`);
    }
    catch (error) {
        logger_1.default.error('Failed to get lab results:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get lab results: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getLabResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const result = await LabResult_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        })
            .populate('patientId', 'firstName lastName dateOfBirth')
            .populate('recordedBy', 'firstName lastName')
            .populate('orderId')
            .lean();
        if (!result) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab result not found', 404);
        }
        const validation = await labService_1.default.validateResult(result);
        let trends = null;
        if (result.patientId && result.testCode) {
            try {
                trends = await labService_1.default.getResultTrends(result.patientId.toString(), result.testCode, context.workplaceId);
            }
            catch (error) {
                logger_1.default.warn('Failed to get result trends:', error);
            }
        }
        (0, responseHelpers_1.sendSuccess)(res, {
            result,
            validation,
            trends,
        }, 'Lab result retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get lab result:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get lab result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.updateLabResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const updates = req.body;
    try {
        const result = await LabResult_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        });
        if (!result) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab result not found', 404);
        }
        const updatedResult = await labService_1.default.updateLabResult(id, updates, context.userId);
        const validation = await labService_1.default.validateResult(updatedResult);
        console.log('Lab result updated:', (0, responseHelpers_1.createAuditLog)('UPDATE_LAB_RESULT', 'LabResult', id, context, {
            updates: Object.keys(updates),
            testCode: result.testCode,
            testName: result.testName,
            previousValue: result.value,
            newValue: updatedResult.value,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            result: updatedResult,
            validation,
        }, 'Lab result updated successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to update lab result:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to update lab result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.deleteLabResult = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const result = await LabResult_1.default.findOne({
            _id: id,
            workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
            isDeleted: false,
        });
        if (!result) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab result not found', 404);
        }
        result.isDeleted = true;
        result.updatedBy = new mongoose_1.Types.ObjectId(context.userId);
        await result.save();
        console.log('Lab result deleted:', (0, responseHelpers_1.createAuditLog)('DELETE_LAB_RESULT', 'LabResult', id, context, {
            testCode: result.testCode,
            testName: result.testName,
            value: result.value,
            patientId: result.patientId.toString(),
        }));
        (0, responseHelpers_1.sendSuccess)(res, null, 'Lab result deleted successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to delete lab result:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to delete lab result: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getLabResultTrends = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { patientId, testCode } = req.params;
    const { months = 12 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const trends = await labService_1.default.getResultTrends(patientId, testCode, context.workplaceId, parseInt(months));
        (0, responseHelpers_1.sendSuccess)(res, {
            trends,
            patientId,
            testCode,
            monthsAnalyzed: parseInt(months),
        }, 'Lab result trends retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get lab result trends:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get lab result trends: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getLabDashboard = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const [totalOrders, pendingOrders, completedOrders, totalResults, abnormalResults, recentOrders, recentResults,] = await Promise.all([
            LabOrder_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                isDeleted: false,
            }),
            LabOrder_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                status: { $in: ['ordered', 'collected', 'processing'] },
                isDeleted: false,
            }),
            LabOrder_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                status: 'completed',
                isDeleted: false,
            }),
            LabResult_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                isDeleted: false,
            }),
            LabResult_1.default.countDocuments({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                interpretation: { $ne: 'normal' },
                isDeleted: false,
            }),
            LabOrder_1.default.find({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                isDeleted: false,
            })
                .populate('patientId', 'firstName lastName')
                .populate('orderedBy', 'firstName lastName')
                .sort({ orderDate: -1 })
                .limit(10)
                .lean(),
            LabResult_1.default.find({
                workplaceId: new mongoose_1.Types.ObjectId(context.workplaceId),
                isDeleted: false,
            })
                .populate('patientId', 'firstName lastName')
                .populate('recordedBy', 'firstName lastName')
                .sort({ performedAt: -1 })
                .limit(10)
                .lean(),
        ]);
        const dashboardData = {
            statistics: {
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    completed: completedOrders,
                    completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
                },
                results: {
                    total: totalResults,
                    abnormal: abnormalResults,
                    abnormalRate: totalResults > 0 ? (abnormalResults / totalResults) * 100 : 0,
                },
            },
            recentActivity: {
                orders: recentOrders,
                results: recentResults,
            },
            alerts: {
                hasPendingOrders: pendingOrders > 0,
                hasAbnormalResults: abnormalResults > 0,
                highAbnormalRate: totalResults > 0 && (abnormalResults / totalResults) > 0.3,
            },
        };
        (0, responseHelpers_1.sendSuccess)(res, dashboardData, 'Lab dashboard data retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get lab dashboard:', error);
        (0, responseHelpers_1.sendError)(res, 'INTERNAL_ERROR', `Failed to get lab dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.importFHIRResults = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { fhirBundle, patientMapping } = req.body;
    try {
        const importResult = await labService_1.default.importFHIRResults(fhirBundle, patientMapping, context.workplaceId, context.userId);
        console.log('FHIR lab results imported:', (0, responseHelpers_1.createAuditLog)('IMPORT_FHIR_LAB_RESULTS', 'LabResult', 'bulk_import', context, {
            importedCount: importResult.imported.length,
            failedCount: importResult.failed.length,
            bundleId: fhirBundle.id,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            imported: importResult.imported,
            failed: importResult.failed,
            summary: {
                totalProcessed: importResult.imported.length + importResult.failed.length,
                successCount: importResult.imported.length,
                failureCount: importResult.failed.length,
                successRate: importResult.imported.length / (importResult.imported.length + importResult.failed.length) * 100,
            },
        }, 'FHIR lab results imported successfully', 201);
    }
    catch (error) {
        logger_1.default.error('Failed to import FHIR lab results:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to import FHIR lab results: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.exportLabOrderToFHIR = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const fhirServiceRequest = await labService_1.default.exportLabOrderToFHIR(orderId, context.workplaceId);
        console.log('Lab order exported to FHIR:', (0, responseHelpers_1.createAuditLog)('EXPORT_LAB_ORDER_FHIR', 'LabOrder', orderId, context, {
            fhirId: fhirServiceRequest.id,
            resourceType: fhirServiceRequest.resourceType,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            fhirResource: fhirServiceRequest,
            resourceType: 'ServiceRequest',
            fhirVersion: 'R4',
        }, 'Lab order exported to FHIR format successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to export lab order to FHIR:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to export lab order to FHIR: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.syncLabResultsFromFHIR = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const { fromDate, toDate } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const syncResult = await labService_1.default.syncLabResultsFromFHIR(patientId, context.workplaceId, fromDate ? new Date(fromDate) : undefined, toDate ? new Date(toDate) : undefined);
        console.log('Lab results synced from FHIR:', (0, responseHelpers_1.createAuditLog)('SYNC_LAB_RESULTS_FHIR', 'LabResult', 'bulk_sync', context, {
            patientId,
            syncedCount: syncResult.synced,
            errorCount: syncResult.errors.length,
            fromDate,
            toDate,
        }));
        (0, responseHelpers_1.sendSuccess)(res, {
            synced: syncResult.synced,
            errors: syncResult.errors,
            patientId,
            dateRange: {
                from: fromDate,
                to: toDate,
            },
        }, `Successfully synced ${syncResult.synced} lab results from FHIR server`);
    }
    catch (error) {
        logger_1.default.error('Failed to sync lab results from FHIR:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to sync lab results from FHIR: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.testFHIRConnection = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const connectionResult = await labService_1.default.testFHIRConnection();
        console.log('FHIR connection tested:', (0, responseHelpers_1.createAuditLog)('TEST_FHIR_CONNECTION', 'System', 'fhir_connection', context, {
            connected: connectionResult.connected,
            error: connectionResult.error,
        }));
        if (connectionResult.connected) {
            (0, responseHelpers_1.sendSuccess)(res, {
                connected: true,
                message: 'FHIR server connection successful',
                timestamp: new Date().toISOString(),
            }, 'FHIR server connection test successful');
        }
        else {
            (0, responseHelpers_1.sendError)(res, 'SERVICE_UNAVAILABLE', connectionResult.error || 'FHIR server connection failed', 503, {
                connected: false,
                error: connectionResult.error,
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to test FHIR connection:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to test FHIR connection: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
//# sourceMappingURL=labController.js.map