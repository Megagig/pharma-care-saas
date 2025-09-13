"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.servePDFRequisition = exports.resolveOrderToken = exports.getLabResults = exports.addLabResults = exports.getManualLabOrders = exports.updateOrderStatus = exports.getPatientLabOrders = exports.getManualLabOrder = exports.createManualLabOrder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const manualLabService_1 = __importDefault(require("../services/manualLabService"));
const pdfGenerationService_1 = require("../services/pdfGenerationService");
const manualLabCacheService_1 = __importDefault(require("../services/manualLabCacheService"));
const ManualLabOrder_1 = __importDefault(require("../models/ManualLabOrder"));
const Patient_1 = __importDefault(require("../../../models/Patient"));
const Workplace_1 = __importDefault(require("../../../models/Workplace"));
const User_1 = __importDefault(require("../../../models/User"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const manualLabAuditService_1 = __importDefault(require("../services/manualLabAuditService"));
const manualLabSecurityMiddleware_1 = require("../middlewares/manualLabSecurityMiddleware");
const logger_1 = __importDefault(require("../../../utils/logger"));
exports.createManualLabOrder = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const orderData = req.body;
    try {
        const createRequest = {
            patientId: new mongoose_1.default.Types.ObjectId(orderData.patientId),
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            locationId: orderData.locationId,
            orderedBy: context.userId,
            tests: orderData.tests,
            indication: orderData.indication,
            priority: orderData.priority || 'routine',
            notes: orderData.notes,
            consentObtained: orderData.consentObtained,
            consentObtainedBy: new mongoose_1.default.Types.ObjectId(orderData.consentObtainedBy),
        };
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        const order = await manualLabService_1.default.createOrder(createRequest, auditContext);
        const pdfToken = (0, manualLabSecurityMiddleware_1.generateSecurePDFToken)(order.orderId, context.userId.toString(), 24 * 60 * 60);
        (0, responseHelpers_1.sendSuccess)(res, {
            order: {
                ...order.toObject(),
                testCount: order.tests.length,
                pdfAccessToken: pdfToken,
                pdfUrl: `/api/manual-lab-orders/${order.orderId}/pdf?token=${pdfToken}`
            },
        }, 'Manual lab order created successfully', 201);
        logger_1.default.info('Manual lab order created via API', {
            orderId: order.orderId,
            patientId: orderData.patientId,
            workplaceId: context.workplaceId,
            testCount: order.tests.length,
            userId: context.userId,
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to create manual lab order via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            patientId: orderData.patientId,
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', error.message, 404);
            }
            if (error.message.includes('consent') || error.message.includes('validation')) {
                return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', error.message, 400);
            }
            if (error.message.includes('permission')) {
                return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', error.message, 403);
            }
        }
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to create manual lab order', 500);
    }
});
exports.getManualLabOrder = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!orderId) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Order ID is required', 400);
    }
    try {
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        const order = await manualLabService_1.default.getOrderById(orderId, new mongoose_1.default.Types.ObjectId(context.workplaceId), auditContext);
        if (!order) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab order not found', 404);
        }
        (0, responseHelpers_1.sendSuccess)(res, {
            order: {
                ...order.toObject(),
                testCount: order.tests.length,
                isActive: order.isActive(),
                canBeModified: order.canBeModified(),
            },
        }, 'Lab order retrieved successfully');
        logger_1.default.info('Manual lab order retrieved via API', {
            orderId: order.orderId,
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve manual lab order via API', {
            orderId,
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve lab order', 500);
    }
});
exports.getPatientLabOrders = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const { page, limit, status, sort } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const result = await manualLabService_1.default.getOrdersByPatient(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(context.workplaceId), {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            status,
            sortBy: sort?.replace('-', '') || 'createdAt',
            sortOrder: sort?.startsWith('-') ? 'desc' : 'asc',
        });
        const enhancedOrders = result.data.map(order => ({
            ...order.toObject(),
            testCount: order.tests.length,
            isActive: order.isActive(),
            canBeModified: order.canBeModified(),
        }));
        res.json({
            success: true,
            message: `Found ${result.pagination.total} lab orders for patient`,
            data: {
                orders: enhancedOrders,
                pagination: result.pagination,
            },
        });
        logger_1.default.info('Patient lab orders retrieved via API', {
            patientId,
            workplaceId: context.workplaceId,
            userId: context.userId,
            resultCount: result.data.length,
            totalCount: result.pagination.total,
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve patient lab orders via API', {
            patientId,
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve patient lab orders', 500);
    }
});
exports.updateOrderStatus = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!orderId) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Order ID is required', 400);
    }
    try {
        const statusUpdate = {
            status,
            updatedBy: context.userId,
            notes,
        };
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        const updatedOrder = await manualLabService_1.default.updateOrderStatus(orderId, statusUpdate, auditContext);
        (0, responseHelpers_1.sendSuccess)(res, {
            order: {
                ...updatedOrder.toObject(),
                testCount: updatedOrder.tests.length,
                isActive: updatedOrder.isActive(),
                canBeModified: updatedOrder.canBeModified(),
            },
        }, 'Order status updated successfully');
        logger_1.default.info('Manual lab order status updated via API', {
            orderId: updatedOrder.orderId,
            newStatus: status,
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to update manual lab order status via API', {
            orderId,
            status,
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', error.message, 404);
            }
            if (error.message.includes('Invalid status transition')) {
                return (0, responseHelpers_1.sendError)(res, 'BUSINESS_RULE_VIOLATION', error.message, 409);
            }
        }
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to update order status', 500);
    }
});
exports.getManualLabOrders = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { page, limit, status, priority, orderedBy, locationId, dateFrom, dateTo, search, sort, } = req.query;
    try {
        const filters = {
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            sortBy: sort?.replace('-', '') || 'createdAt',
            sortOrder: sort?.startsWith('-') ? 'desc' : 'asc',
        };
        if (status)
            filters.status = status;
        if (priority)
            filters.priority = priority;
        if (orderedBy)
            filters.orderedBy = new mongoose_1.default.Types.ObjectId(orderedBy);
        if (locationId)
            filters.locationId = locationId;
        if (dateFrom)
            filters.dateFrom = new Date(dateFrom);
        if (dateTo)
            filters.dateTo = new Date(dateTo);
        if (search)
            filters.search = search;
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        const result = await manualLabService_1.default.getOrders(filters, auditContext);
        const enhancedOrders = result.data.map(order => ({
            ...order.toObject(),
            testCount: order.tests.length,
            isActive: order.isActive(),
            canBeModified: order.canBeModified(),
        }));
        res.json({
            success: true,
            message: `Found ${result.pagination.total} lab orders`,
            data: {
                orders: enhancedOrders,
                pagination: result.pagination,
                filters: filters,
            },
        });
        logger_1.default.info('Manual lab orders list retrieved via API', {
            workplaceId: context.workplaceId,
            userId: context.userId,
            resultCount: result.data.length,
            totalCount: result.pagination.total,
            filters,
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve manual lab orders list via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve lab orders', 500);
    }
});
exports.addLabResults = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const { values, reviewNotes } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!orderId) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Order ID is required', 400);
    }
    try {
        const resultsRequest = {
            enteredBy: context.userId,
            values,
            reviewNotes,
        };
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        const result = await manualLabService_1.default.addResults(orderId, resultsRequest, auditContext);
        (0, responseHelpers_1.sendSuccess)(res, {
            result: {
                ...result.toObject(),
                valueCount: result.values.length,
                hasAbnormalResults: result.hasAbnormalResults(),
                criticalResults: result.getCriticalResults(),
            },
        }, 'Lab results added successfully', 201);
        logger_1.default.info('Manual lab results added via API', {
            orderId: result.orderId,
            workplaceId: context.workplaceId,
            userId: context.userId,
            valueCount: result.values.length,
            hasAbnormalResults: result.hasAbnormalResults(),
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to add manual lab results via API', {
            orderId,
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', error.message, 404);
            }
            if (error.message.includes('already exist')) {
                return (0, responseHelpers_1.sendError)(res, 'DUPLICATE_RESOURCE', error.message, 409);
            }
            if (error.message.includes('Invalid test codes')) {
                return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', error.message, 400);
            }
            if (error.message.includes('status')) {
                return (0, responseHelpers_1.sendError)(res, 'BUSINESS_RULE_VIOLATION', error.message, 409);
            }
        }
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to add lab results', 500);
    }
});
exports.getLabResults = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!orderId) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Order ID is required', 400);
    }
    try {
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        const result = await manualLabService_1.default.getResultsByOrder(orderId, new mongoose_1.default.Types.ObjectId(context.workplaceId), auditContext);
        if (!result) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab results not found', 404);
        }
        (0, responseHelpers_1.sendSuccess)(res, {
            result: {
                ...result.toObject(),
                valueCount: result.values.length,
                hasAbnormalResults: result.hasAbnormalResults(),
                criticalResults: result.getCriticalResults(),
                processingStatus: result.get('processingStatus'),
                isReviewed: result.get('isReviewed'),
            },
        }, 'Lab results retrieved successfully');
        logger_1.default.info('Manual lab results retrieved via API', {
            orderId: result.orderId,
            workplaceId: context.workplaceId,
            userId: context.userId,
            valueCount: result.values.length,
            hasAbnormalResults: result.hasAbnormalResults(),
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve manual lab results via API', {
            orderId,
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        if (error instanceof Error && error.message.includes('not found')) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', error.message, 404);
        }
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve lab results', 500);
    }
});
exports.resolveOrderToken = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { token } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!token) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Token is required', 400);
    }
    try {
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        const order = await manualLabService_1.default.resolveToken(token, auditContext);
        if (!order) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Invalid or expired token', 404);
        }
        (0, responseHelpers_1.sendSuccess)(res, {
            order: {
                ...order.toObject(),
                testCount: order.tests.length,
                isActive: order.isActive(),
                canBeModified: order.canBeModified(),
            },
        }, 'Token resolved successfully');
        logger_1.default.info('Manual lab order token resolved via API', {
            orderId: order.orderId,
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to resolve manual lab order token via API', {
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        if (error instanceof Error) {
            if (error.message.includes('Invalid token')) {
                return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', error.message, 400);
            }
            if (error.message.includes('not found') || error.message.includes('expired')) {
                return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', error.message, 404);
            }
        }
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to resolve token', 500);
    }
});
exports.servePDFRequisition = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { orderId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!orderId) {
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Order ID is required', 400);
    }
    try {
        const order = await ManualLabOrder_1.default.findOne({
            orderId: orderId.toUpperCase(),
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            isDeleted: { $ne: true }
        })
            .populate('patientId')
            .populate('orderedBy')
            .populate('workplaceId');
        if (!order) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Lab order not found', 404);
        }
        const [patient, workplace, pharmacist] = await Promise.all([
            Patient_1.default.findById(order.patientId),
            Workplace_1.default.findById(order.workplaceId),
            User_1.default.findById(order.orderedBy)
        ]);
        if (!patient || !workplace || !pharmacist) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'Required data not found for PDF generation', 404);
        }
        let pdfResult = await manualLabCacheService_1.default.getCachedPDFRequisition(orderId.toUpperCase());
        if (!pdfResult) {
            pdfGenerationService_1.pdfGenerationService.validateGenerationRequirements(order, patient, workplace, pharmacist);
            pdfResult = await pdfGenerationService_1.pdfGenerationService.generateRequisitionPDF(order, patient, workplace, pharmacist);
        }
        const auditContext = {
            userId: context.userId,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            userRole: context.userRole || 'unknown',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
        };
        await manualLabAuditService_1.default.logPDFAccess(auditContext, {
            orderId: order.orderId,
            patientId: order.patientId,
            fileName: pdfResult.fileName,
            fileSize: pdfResult.metadata.fileSize,
            downloadMethod: 'direct_link',
            userAgent: req.get('User-Agent'),
            referrer: req.get('Referer')
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdfResult.fileName}"`);
        res.setHeader('Content-Length', pdfResult.pdfBuffer.length);
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Download-Options', 'noopen');
        res.send(pdfResult.pdfBuffer);
        logger_1.default.info('Manual lab PDF served via API', {
            orderId: order.orderId,
            workplaceId: context.workplaceId,
            userId: context.userId,
            fileName: pdfResult.fileName,
            fileSize: pdfResult.metadata.fileSize,
            service: 'manual-lab-api',
        });
    }
    catch (error) {
        logger_1.default.error('Failed to serve manual lab PDF via API', {
            orderId,
            error: error instanceof Error ? error.message : 'Unknown error',
            workplaceId: context.workplaceId,
            userId: context.userId,
            service: 'manual-lab-api',
        });
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', error.message, 404);
            }
            if (error.message.includes('validation failed')) {
                return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', error.message, 400);
            }
            if (error.message.includes('PDF generation failed')) {
                return (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', error.message, 500);
            }
        }
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to generate or serve PDF', 500);
    }
});
//# sourceMappingURL=manualLabController.js.map