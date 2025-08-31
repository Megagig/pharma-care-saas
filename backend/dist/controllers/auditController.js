"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditActions = exports.getPatientAccessLog = exports.getUserActivity = exports.exportAuditData = exports.getSuspiciousActivities = exports.getHighRiskActivities = exports.getComplianceReport = exports.getAuditSummary = exports.getAuditLogs = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auditService_1 = __importDefault(require("../services/auditService"));
const MTRAuditLog_1 = __importDefault(require("../models/MTRAuditLog"));
const responseHelpers_1 = require("../utils/responseHelpers");
const isAdminOrSupervisor = (role) => {
    return role === 'super_admin' || role === 'admin' || role === 'supervisor';
};
const isAdmin = (role) => {
    return role === 'super_admin' || role === 'admin';
};
exports.getAuditLogs = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { page = 1, limit = 50, userId, action, resourceType, complianceCategory, riskLevel, patientId, reviewId, startDate, endDate, ipAddress, sort = '-timestamp', } = req.query;
    if (!isAdminOrSupervisor(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to view audit logs', 403);
    }
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(1000, Math.max(1, parseInt(limit) || 50));
    const filters = {};
    if (userId)
        filters.userId = new mongoose_1.default.Types.ObjectId(userId);
    if (action)
        filters.action = action;
    if (resourceType)
        filters.resourceType = resourceType;
    if (complianceCategory)
        filters.complianceCategory = complianceCategory;
    if (riskLevel)
        filters.riskLevel = riskLevel;
    if (patientId)
        filters.patientId = new mongoose_1.default.Types.ObjectId(patientId);
    if (reviewId)
        filters.reviewId = new mongoose_1.default.Types.ObjectId(reviewId);
    if (ipAddress)
        filters.ipAddress = ipAddress;
    if (startDate)
        filters.startDate = new Date(startDate);
    if (endDate)
        filters.endDate = new Date(endDate);
    const { logs, total } = await auditService_1.default.getAuditLogs(new mongoose_1.default.Types.ObjectId(context.workplaceId), filters, {
        page: parsedPage,
        limit: parsedLimit,
        sort,
    });
    (0, responseHelpers_1.respondWithPaginatedResults)(res, logs, total, parsedPage, parsedLimit, `Found ${total} audit log entries`);
});
exports.getAuditSummary = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { startDate, endDate } = req.query;
    if (!isAdminOrSupervisor(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to view audit summary', 403);
    }
    let dateRange;
    if (startDate && endDate) {
        dateRange = {
            start: new Date(startDate),
            end: new Date(endDate),
        };
    }
    const summary = await auditService_1.default.getAuditSummary(new mongoose_1.default.Types.ObjectId(context.workplaceId), dateRange);
    (0, responseHelpers_1.sendSuccess)(res, summary, 'Audit summary retrieved successfully');
});
exports.getComplianceReport = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { startDate, endDate } = req.query;
    if (!isAdmin(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Only administrators can access compliance reports', 403);
    }
    if (!startDate || !endDate) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Start date and end date are required for compliance report', 400);
    }
    const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
    };
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Date range cannot exceed 365 days', 400);
    }
    const report = await auditService_1.default.getComplianceReport(new mongoose_1.default.Types.ObjectId(context.workplaceId), dateRange);
    await auditService_1.default.logActivity(auditService_1.default.createAuditContext(req), {
        action: 'ACCESS_COMPLIANCE_REPORT',
        resourceType: 'User',
        resourceId: context.userId,
        details: {
            dateRange,
            reportType: 'compliance',
        },
        complianceCategory: 'system_security',
        riskLevel: 'medium',
    });
    (0, responseHelpers_1.sendSuccess)(res, report, 'Compliance report generated successfully');
});
exports.getHighRiskActivities = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { hours = 24 } = req.query;
    if (!isAdminOrSupervisor(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to view high-risk activities', 403);
    }
    const parsedHours = Math.min(168, Math.max(1, parseInt(hours) || 24));
    const activities = await MTRAuditLog_1.default.find({
        workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
        riskLevel: { $in: ['high', 'critical'] },
        timestamp: { $gte: new Date(Date.now() - parsedHours * 60 * 60 * 1000) },
    })
        .populate('userId', 'firstName lastName email')
        .populate('patientId', 'firstName lastName mrn')
        .sort({ timestamp: -1 });
    (0, responseHelpers_1.sendSuccess)(res, { activities, timeframe: `${parsedHours} hours` }, `Found ${activities.length} high-risk activities`);
});
exports.getSuspiciousActivities = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { hours = 24 } = req.query;
    if (!isAdmin(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Only administrators can view suspicious activities', 403);
    }
    const parsedHours = Math.min(168, Math.max(1, parseInt(hours) || 24));
    const activities = await MTRAuditLog_1.default.aggregate([
        {
            $match: {
                workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
                timestamp: { $gte: new Date(Date.now() - parsedHours * 60 * 60 * 1000) },
            },
        },
        {
            $group: {
                _id: {
                    userId: '$userId',
                    ipAddress: '$ipAddress',
                },
                actionCount: { $sum: 1 },
                uniqueActions: { $addToSet: '$action' },
                errorCount: {
                    $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
                },
                firstActivity: { $min: '$timestamp' },
                lastActivity: { $max: '$timestamp' },
            },
        },
        {
            $match: {
                $or: [
                    { actionCount: { $gt: 100 } },
                    { errorCount: { $gt: 10 } },
                ],
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id.userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $project: {
                userId: '$_id.userId',
                ipAddress: '$_id.ipAddress',
                actionCount: 1,
                uniqueActionCount: { $size: '$uniqueActions' },
                errorCount: 1,
                errorRate: {
                    $multiply: [{ $divide: ['$errorCount', '$actionCount'] }, 100],
                },
                firstActivity: 1,
                lastActivity: 1,
                user: { $arrayElemAt: ['$user', 0] },
            },
        },
        { $sort: { actionCount: -1 } },
    ]);
    (0, responseHelpers_1.sendSuccess)(res, { activities, timeframe: `${parsedHours} hours` }, `Found ${activities.length} suspicious activity patterns`);
});
exports.exportAuditData = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { format = 'json', startDate, endDate, filters = {}, includeDetails = false, includeSensitiveData = false, } = req.body;
    if (!isAdmin(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Only administrators can export audit data', 403);
    }
    if (!['json', 'csv', 'pdf'].includes(format)) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid export format. Supported formats: json, csv, pdf', 400);
    }
    const exportOptions = {
        format,
        includeDetails,
        includeSensitiveData,
        filters: {},
    };
    if (startDate && endDate) {
        exportOptions.dateRange = {
            start: new Date(startDate),
            end: new Date(endDate),
        };
    }
    if (filters.userId) {
        exportOptions.filters.userId = new mongoose_1.default.Types.ObjectId(filters.userId);
    }
    if (filters.action)
        exportOptions.filters.action = filters.action;
    if (filters.resourceType)
        exportOptions.filters.resourceType = filters.resourceType;
    if (filters.complianceCategory)
        exportOptions.filters.complianceCategory = filters.complianceCategory;
    if (filters.riskLevel)
        exportOptions.filters.riskLevel = filters.riskLevel;
    if (filters.patientId) {
        exportOptions.filters.patientId = new mongoose_1.default.Types.ObjectId(filters.patientId);
    }
    if (filters.reviewId) {
        exportOptions.filters.reviewId = new mongoose_1.default.Types.ObjectId(filters.reviewId);
    }
    try {
        const exportResult = await auditService_1.default.exportAuditData(new mongoose_1.default.Types.ObjectId(context.workplaceId), exportOptions);
        await auditService_1.default.logActivity(auditService_1.default.createAuditContext(req), {
            action: 'EXPORT_AUDIT_DATA',
            resourceType: 'User',
            resourceId: context.userId,
            details: {
                format,
                dateRange: exportOptions.dateRange,
                filters: exportOptions.filters,
                includeDetails,
                includeSensitiveData,
                filename: exportResult.filename,
            },
            complianceCategory: 'data_access',
            riskLevel: 'high',
        });
        res.setHeader('Content-Type', exportResult.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        if (format === 'pdf') {
            (0, responseHelpers_1.sendSuccess)(res, exportResult.data, 'Audit data prepared for PDF export');
        }
        else {
            res.send(exportResult.data);
        }
    }
    catch (error) {
        (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', `Failed to export audit data: ${error?.message || 'Unknown error'}`, 500);
    }
});
exports.getUserActivity = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { userId } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    if (!isAdminOrSupervisor(context.userRole) &&
        context.userId.toString() !== userId) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to view user activity', 403);
    }
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(500, Math.max(1, parseInt(limit) || 50));
    const filters = {
        userId: new mongoose_1.default.Types.ObjectId(userId),
    };
    if (startDate)
        filters.startDate = new Date(startDate);
    if (endDate)
        filters.endDate = new Date(endDate);
    const { logs, total } = await auditService_1.default.getAuditLogs(new mongoose_1.default.Types.ObjectId(context.workplaceId), filters, {
        page: parsedPage,
        limit: parsedLimit,
        sort: '-timestamp',
    });
    (0, responseHelpers_1.respondWithPaginatedResults)(res, logs, total, parsedPage, parsedLimit, `Found ${total} activity records for user`);
});
exports.getPatientAccessLog = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { patientId } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    if (!isAdminOrSupervisor(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to view patient access logs', 403);
    }
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(500, Math.max(1, parseInt(limit) || 50));
    const filters = {
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
    };
    if (startDate)
        filters.startDate = new Date(startDate);
    if (endDate)
        filters.endDate = new Date(endDate);
    const { logs, total } = await auditService_1.default.getAuditLogs(new mongoose_1.default.Types.ObjectId(context.workplaceId), filters, {
        page: parsedPage,
        limit: parsedLimit,
        sort: '-timestamp',
    });
    (0, responseHelpers_1.respondWithPaginatedResults)(res, logs, total, parsedPage, parsedLimit, `Found ${total} access records for patient`);
});
exports.getAuditActions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!isAdminOrSupervisor(context.userRole)) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Insufficient permissions to view audit actions', 403);
    }
    const actions = await MTRAuditLog_1.default.distinct('action', {
        workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
    });
    const resourceTypes = await MTRAuditLog_1.default.distinct('resourceType', {
        workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
    });
    const complianceCategories = await MTRAuditLog_1.default.distinct('complianceCategory', {
        workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
    });
    (0, responseHelpers_1.sendSuccess)(res, {
        actions: actions.sort(),
        resourceTypes: resourceTypes.sort(),
        complianceCategories: complianceCategories.sort(),
        riskLevels: ['low', 'medium', 'high', 'critical'],
    }, 'Audit filter options retrieved successfully');
});
//# sourceMappingURL=auditController.js.map