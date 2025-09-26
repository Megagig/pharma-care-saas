import express from 'express';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import moment from 'moment';
import { auth, requireLicense } from '../middlewares/auth';
import { auditTimer, auditMTRActivity } from '../middlewares/auditMiddleware';
import { requirePermission } from '../middlewares/rbac';
import reportsRBAC from '../middlewares/reportsRBAC';
import rateLimit from 'express-rate-limit';
import {
    getUnifiedReportData,
    getAvailableReports,
    getReportSummary,
    queueReportExport,
    getExportJobStatus,
    getPerformanceStats,
} from '../controllers/reportsController';

const router = express.Router();

// Rate limiting for report endpoints
const reportRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many report requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Validation middleware for report parameters
const validateReportType = (req: Request, res: Response, next: NextFunction) => {
    const { reportType } = req.params;

    const validReportTypes = [
        'patient-outcomes',
        'pharmacist-interventions',
        'therapy-effectiveness',
        'quality-improvement',
        'regulatory-compliance',
        'cost-effectiveness',
        'trend-forecasting',
        'operational-efficiency',
        'medication-inventory',
        'patient-demographics',
        'adverse-events'
    ];

    if (!reportType || !validReportTypes.includes(reportType)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid report type specified',
            validTypes: validReportTypes
        });
    }

    next();
};

// Validation middleware for date parameters
const validateDateRange = (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate } = req.query;

    if (startDate && !moment(startDate as string).isValid()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid start date format. Use YYYY-MM-DD format.'
        });
    }

    if (endDate && !moment(endDate as string).isValid()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid end date format. Use YYYY-MM-DD format.'
        });
    }

    if (startDate && endDate && moment(startDate as string).isAfter(moment(endDate as string))) {
        return res.status(400).json({
            success: false,
            message: 'Start date cannot be after end date.'
        });
    }

    next();
};

// Validation middleware for MongoDB ObjectIds
const validateObjectIds = (req: Request, res: Response, next: NextFunction) => {
    const { patientId, pharmacistId } = req.query;

    if (patientId && !mongoose.Types.ObjectId.isValid(patientId as string)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid patient ID format.'
        });
    }

    if (pharmacistId && !mongoose.Types.ObjectId.isValid(pharmacistId as string)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid pharmacist ID format.'
        });
    }

    next();
};

// Apply middleware to all routes
router.use(auth);
router.use(requireLicense);
router.use(reportRateLimit);
router.use(auditTimer);

// ===============================
// UNIFIED REPORTS ENDPOINTS
// ===============================

// GET /api/reports/types - Get available report types
router.get('/types',
    requirePermission('view_reports', { useDynamicRBAC: true }),
    auditMTRActivity('VIEW_AVAILABLE_REPORTS'),
    getAvailableReports
);

// GET /api/reports/summary - Get report summary statistics
router.get('/summary',
    requirePermission('view_reports', { useDynamicRBAC: true }),
    validateDateRange,
    reportsRBAC.enforceWorkspaceIsolation,
    auditMTRActivity('VIEW_REPORT_SUMMARY'),
    getReportSummary
);

// GET /api/reports/:reportType - Get specific report data
router.get('/:reportType',
    validateReportType,
    validateDateRange,
    validateObjectIds,
    reportsRBAC.requireReportAccess(),
    reportsRBAC.validateDataAccess,
    reportsRBAC.enforceWorkspaceIsolation,
    auditMTRActivity('GENERATE_REPORT'),
    getUnifiedReportData
);

// ===============================
// CACHING MIDDLEWARE
// ===============================

// Simple in-memory cache for frequently accessed reports
const reportCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const cacheMiddleware = (ttlMinutes: number = 15) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const cacheKey = `${req.originalUrl}-${JSON.stringify(req.query)}`;
        const cached = reportCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return res.json({
                ...cached.data,
                cached: true,
                cacheTimestamp: new Date(cached.timestamp)
            });
        }

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function (data: any) {
            if (res.statusCode === 200) {
                reportCache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                    ttl: ttlMinutes * 60 * 1000
                });

                // Clean up old cache entries
                if (reportCache.size > 100) {
                    const oldestKey = reportCache.keys().next().value;
                    reportCache.delete(oldestKey);
                }
            }
            return originalJson.call(this, data);
        };

        next();
    };
};

// ===============================
// PERFORMANCE & EXPORT ENDPOINTS
// ===============================

// POST /api/reports/export - Queue large export job
router.post('/export',
    requirePermission('export_reports', { useDynamicRBAC: true }),
    reportsRBAC.enforceWorkspaceIsolation,
    auditMTRActivity('QUEUE_REPORT_EXPORT'),
    queueReportExport
);

// GET /api/reports/export/:jobId/status - Get export job status
router.get('/export/:jobId/status',
    requirePermission('export_reports', { useDynamicRBAC: true }),
    getExportJobStatus
);

// GET /api/reports/performance/stats - Get performance statistics
router.get('/performance/stats',
    requirePermission('view_system_stats', { useDynamicRBAC: true }),
    getPerformanceStats
);

// Apply caching to summary endpoint (cache for 15 minutes)
router.get('/summary', cacheMiddleware(15));

// Apply caching to report data endpoints (cache for 10 minutes)
router.get('/:reportType', cacheMiddleware(10));

// ===============================
// ERROR HANDLING MIDDLEWARE
// ===============================

router.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Reports API Error:', error);

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.message
        });
    }

    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            details: error.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

export default router;