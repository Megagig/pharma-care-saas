import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import AuditService, { ExportOptions } from '../services/auditService';
import MTRAuditLog from '../models/MTRAuditLog';
import {
    sendSuccess,
    sendError,
    respondWithPaginatedResults,
    asyncHandler,
    getRequestContext,
} from '../utils/responseHelpers';

// Type guard for user roles
const isAdminOrSupervisor = (role: string | undefined): boolean => {
    return role === 'super_admin' || role === 'admin' || role === 'supervisor';
};

const isAdmin = (role: string | undefined): boolean => {
    return role === 'super_admin' || role === 'admin';
};

/**
 * Audit Controller
 * Handles audit trail viewing and compliance reporting for administrators
 */

/**
 * GET /api/audit/logs
 * Get audit logs with filtering and pagination
 */
export const getAuditLogs = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const {
            page = 1,
            limit = 50,
            userId,
            action,
            resourceType,
            complianceCategory,
            riskLevel,
            patientId,
            reviewId,
            startDate,
            endDate,
            ipAddress,
            sort = '-timestamp',
        } = req.query as any;

        // Only allow admins and supervisors to view audit logs
        if (!isAdminOrSupervisor(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Insufficient permissions to view audit logs',
                403
            );
        }

        // Parse pagination parameters
        const parsedPage = Math.max(1, parseInt(page) || 1);
        const parsedLimit = Math.min(1000, Math.max(1, parseInt(limit) || 50));

        // Parse date filters
        const filters: any = {};
        if (userId) filters.userId = new mongoose.Types.ObjectId(userId);
        if (action) filters.action = action;
        if (resourceType) filters.resourceType = resourceType;
        if (complianceCategory) filters.complianceCategory = complianceCategory;
        if (riskLevel) filters.riskLevel = riskLevel;
        if (patientId) filters.patientId = new mongoose.Types.ObjectId(patientId);
        if (reviewId) filters.reviewId = new mongoose.Types.ObjectId(reviewId);
        if (ipAddress) filters.ipAddress = ipAddress;
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        // Get audit logs
        const { logs, total } = await AuditService.getAuditLogs(
            new mongoose.Types.ObjectId(context.workplaceId),
            filters,
            {
                page: parsedPage,
                limit: parsedLimit,
                sort,
            }
        );

        respondWithPaginatedResults(
            res,
            logs,
            total,
            parsedPage,
            parsedLimit,
            `Found ${total} audit log entries`
        );
    }
);

/**
 * GET /api/audit/summary
 * Get audit summary and statistics
 */
export const getAuditSummary = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { startDate, endDate } = req.query as any;

        // Only allow admins and supervisors
        if (!isAdminOrSupervisor(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Insufficient permissions to view audit summary',
                403
            );
        }

        // Parse date range
        let dateRange: { start: Date; end: Date } | undefined;
        if (startDate && endDate) {
            dateRange = {
                start: new Date(startDate),
                end: new Date(endDate),
            };
        }

        const summary = await AuditService.getAuditSummary(
            new mongoose.Types.ObjectId(context.workplaceId),
            dateRange
        );

        sendSuccess(res, summary, 'Audit summary retrieved successfully');
    }
);

/**
 * GET /api/audit/compliance-report
 * Get comprehensive compliance report
 */
export const getComplianceReport = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { startDate, endDate } = req.query as any;

        // Only allow admins
        if (!isAdmin(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Only administrators can access compliance reports',
                403
            );
        }

        // Validate date range
        if (!startDate || !endDate) {
            return sendError(
                res,
                'BAD_REQUEST',
                'Start date and end date are required for compliance report',
                400
            );
        }

        const dateRange = {
            start: new Date(startDate),
            end: new Date(endDate),
        };

        // Validate date range is not too large (max 1 year)
        const daysDiff = Math.ceil(
            (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff > 365) {
            return sendError(
                res,
                'BAD_REQUEST',
                'Date range cannot exceed 365 days',
                400
            );
        }

        const report = await AuditService.getComplianceReport(
            new mongoose.Types.ObjectId(context.workplaceId),
            dateRange
        );

        // Log compliance report access
        await AuditService.logActivity(
            AuditService.createAuditContext(req),
            {
                action: 'ACCESS_COMPLIANCE_REPORT',
                resourceType: 'User',
                resourceId: context.userId,
                details: {
                    dateRange,
                    reportType: 'compliance',
                },
                complianceCategory: 'system_security',
                riskLevel: 'medium',
            }
        );

        sendSuccess(res, report, 'Compliance report generated successfully');
    }
);

/**
 * GET /api/audit/high-risk-activities
 * Get recent high-risk activities
 */
export const getHighRiskActivities = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { hours = 24 } = req.query as any;

        // Only allow admins and supervisors
        if (!isAdminOrSupervisor(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Insufficient permissions to view high-risk activities',
                403
            );
        }

        const parsedHours = Math.min(168, Math.max(1, parseInt(hours) || 24)); // Max 1 week

        // Use direct query instead of static method for now
        const activities = await MTRAuditLog.find({
            workplaceId: new mongoose.Types.ObjectId(context.workplaceId),
            riskLevel: { $in: ['high', 'critical'] },
            timestamp: { $gte: new Date(Date.now() - parsedHours * 60 * 60 * 1000) },
        })
            .populate('userId', 'firstName lastName email')
            .populate('patientId', 'firstName lastName mrn')
            .sort({ timestamp: -1 });

        sendSuccess(
            res,
            { activities, timeframe: `${parsedHours} hours` },
            `Found ${activities.length} high-risk activities`
        );
    }
);

/**
 * GET /api/audit/suspicious-activities
 * Get suspicious activity patterns
 */
export const getSuspiciousActivities = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { hours = 24 } = req.query as any;

        // Only allow admins
        if (!isAdmin(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Only administrators can view suspicious activities',
                403
            );
        }

        const parsedHours = Math.min(168, Math.max(1, parseInt(hours) || 24)); // Max 1 week

        // Use direct aggregation instead of static method for now
        const activities = await MTRAuditLog.aggregate([
            {
                $match: {
                    workplaceId: new mongoose.Types.ObjectId(context.workplaceId),
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
                        { actionCount: { $gt: 100 } }, // High activity volume
                        { errorCount: { $gt: 10 } }, // High error rate
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

        sendSuccess(
            res,
            { activities, timeframe: `${parsedHours} hours` },
            `Found ${activities.length} suspicious activity patterns`
        );
    }
);

/**
 * POST /api/audit/export
 * Export audit data for compliance
 */
export const exportAuditData = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const {
            format = 'json',
            startDate,
            endDate,
            filters = {},
            includeDetails = false,
            includeSensitiveData = false,
        } = req.body;

        // Only allow admins to export audit data
        if (!isAdmin(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Only administrators can export audit data',
                403
            );
        }

        // Validate format
        if (!['json', 'csv', 'pdf'].includes(format)) {
            return sendError(
                res,
                'BAD_REQUEST',
                'Invalid export format. Supported formats: json, csv, pdf',
                400
            );
        }

        // Prepare export options
        const exportOptions: ExportOptions = {
            format,
            includeDetails,
            includeSensitiveData,
            filters: {},
        };

        // Parse date range
        if (startDate && endDate) {
            exportOptions.dateRange = {
                start: new Date(startDate),
                end: new Date(endDate),
            };
        }

        // Parse filters
        if (filters.userId) {
            exportOptions.filters!.userId = new mongoose.Types.ObjectId(filters.userId);
        }
        if (filters.action) exportOptions.filters!.action = filters.action;
        if (filters.resourceType) exportOptions.filters!.resourceType = filters.resourceType;
        if (filters.complianceCategory) exportOptions.filters!.complianceCategory = filters.complianceCategory;
        if (filters.riskLevel) exportOptions.filters!.riskLevel = filters.riskLevel;
        if (filters.patientId) {
            exportOptions.filters!.patientId = new mongoose.Types.ObjectId(filters.patientId);
        }
        if (filters.reviewId) {
            exportOptions.filters!.reviewId = new mongoose.Types.ObjectId(filters.reviewId);
        }

        try {
            const exportResult = await AuditService.exportAuditData(
                new mongoose.Types.ObjectId(context.workplaceId),
                exportOptions
            );

            // Log export activity
            await AuditService.logActivity(
                AuditService.createAuditContext(req),
                {
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
                }
            );

            // Set appropriate headers for file download
            res.setHeader('Content-Type', exportResult.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

            if (format === 'pdf') {
                // For PDF, return structured data that frontend can process
                sendSuccess(res, exportResult.data, 'Audit data prepared for PDF export');
            } else {
                // For JSON and CSV, send the raw data
                res.send(exportResult.data);
            }
        } catch (error: any) {
            sendError(
                res,
                'BAD_REQUEST',
                `Failed to export audit data: ${error?.message || 'Unknown error'}`,
                500
            );
        }
    }
);

/**
 * GET /api/audit/user-activity/:userId
 * Get specific user's audit trail
 */
export const getUserActivity = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { userId } = req.params;
        const { page = 1, limit = 50, startDate, endDate } = req.query as any;

        // Only allow admins and supervisors, or users viewing their own activity
        if (!isAdminOrSupervisor(context.userRole) &&
            context.userId.toString() !== userId) {
            return sendError(
                res,
                'FORBIDDEN',
                'Insufficient permissions to view user activity',
                403
            );
        }

        // Parse pagination
        const parsedPage = Math.max(1, parseInt(page) || 1);
        const parsedLimit = Math.min(500, Math.max(1, parseInt(limit) || 50));

        // Prepare filters
        const filters: any = {
            userId: new mongoose.Types.ObjectId(userId),
        };

        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const { logs, total } = await AuditService.getAuditLogs(
            new mongoose.Types.ObjectId(context.workplaceId),
            filters,
            {
                page: parsedPage,
                limit: parsedLimit,
                sort: '-timestamp',
            }
        );

        respondWithPaginatedResults(
            res,
            logs,
            total,
            parsedPage,
            parsedLimit,
            `Found ${total} activity records for user`
        );
    }
);

/**
 * GET /api/audit/patient-access/:patientId
 * Get patient data access audit trail
 */
export const getPatientAccessLog = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);
        const { patientId } = req.params;
        const { page = 1, limit = 50, startDate, endDate } = req.query as any;

        // Only allow admins and supervisors
        if (!isAdminOrSupervisor(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Insufficient permissions to view patient access logs',
                403
            );
        }

        // Parse pagination
        const parsedPage = Math.max(1, parseInt(page) || 1);
        const parsedLimit = Math.min(500, Math.max(1, parseInt(limit) || 50));

        // Prepare filters
        const filters: any = {
            patientId: new mongoose.Types.ObjectId(patientId),
        };

        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);

        const { logs, total } = await AuditService.getAuditLogs(
            new mongoose.Types.ObjectId(context.workplaceId),
            filters,
            {
                page: parsedPage,
                limit: parsedLimit,
                sort: '-timestamp',
            }
        );

        respondWithPaginatedResults(
            res,
            logs,
            total,
            parsedPage,
            parsedLimit,
            `Found ${total} access records for patient`
        );
    }
);

/**
 * GET /api/audit/actions
 * Get list of available audit actions for filtering
 */
export const getAuditActions = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const context = getRequestContext(req);

        // Only allow admins and supervisors
        if (!isAdminOrSupervisor(context.userRole)) {
            return sendError(
                res,
                'FORBIDDEN',
                'Insufficient permissions to view audit actions',
                403
            );
        }

        // Get distinct actions from audit logs
        const actions = await MTRAuditLog.distinct('action', {
            workplaceId: new mongoose.Types.ObjectId(context.workplaceId),
        });

        // Get distinct resource types
        const resourceTypes = await MTRAuditLog.distinct('resourceType', {
            workplaceId: new mongoose.Types.ObjectId(context.workplaceId),
        });

        // Get distinct compliance categories
        const complianceCategories = await MTRAuditLog.distinct('complianceCategory', {
            workplaceId: new mongoose.Types.ObjectId(context.workplaceId),
        });

        sendSuccess(
            res,
            {
                actions: actions.sort(),
                resourceTypes: resourceTypes.sort(),
                complianceCategories: complianceCategories.sort(),
                riskLevels: ['low', 'medium', 'high', 'critical'],
            },
            'Audit filter options retrieved successfully'
        );
    }
);