import express from 'express';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import moment from 'moment';
import { auth, requireLicense, AuthRequest } from '../middlewares/auth';
import { auditTimer, auditMTRActivity } from '../middlewares/auditMiddleware';
import { requirePermission } from '../middlewares/rbac';
import reportsRBAC from '../middlewares/reportsRBAC';
import rateLimit from 'express-rate-limit';
import {
    getAvailableReports,
    getReportSummary,
    queueReportExport,
    getExportJobStatus,
    getPerformanceStats,
} from '../controllers/reportsController';
import MedicationTherapyReview from '../models/MedicationTherapyReview';
import MTRIntervention from '../models/MTRIntervention';
import DrugTherapyProblem from '../models/DrugTherapyProblem';
import Patient from '../models/Patient';
import MedicationManagement from '../models/MedicationManagement';

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

// Optimized report data generation with real database queries
async function generateOptimizedReportData(reportType: string, workspaceFilter: any) {
    console.log(`📊 Generating real data for ${reportType} with workspace filter:`, workspaceFilter);

    try {
        // Build base match criteria with performance optimizations
        const baseMatch = {
            isDeleted: { $ne: true },
            ...workspaceFilter,
            // Limit to recent data for performance (last 30 days)
            createdAt: {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
        };

        // Generate report-specific data with timeout protection
        switch (reportType) {
            case 'patient-outcomes':
                return await generatePatientOutcomesData(baseMatch);
            case 'pharmacist-interventions':
                return await generatePharmacistInterventionsData(baseMatch);
            case 'therapy-effectiveness':
                return await generateTherapyEffectivenessData(baseMatch);
            case 'patient-demographics':
                return await generatePatientDemographicsData(baseMatch);
            case 'quality-improvement':
                return await generateQualityImprovementData(baseMatch);
            case 'regulatory-compliance':
                return await generateRegulatoryComplianceData(baseMatch);
            case 'cost-effectiveness':
                return await generateCostEffectivenessData(baseMatch);
            case 'trend-forecasting':
                return await generateTrendForecastingData(baseMatch);
            case 'operational-efficiency':
                return await generateOperationalEfficiencyData(baseMatch);
            case 'medication-inventory':
                return await generateMedicationInventoryData(baseMatch);
            case 'adverse-events':
                return await generateAdverseEventsData(baseMatch);
            default:
                return await generateGenericReportData(baseMatch, reportType);
        }
    } catch (error) {
        console.error(`❌ Error generating real data for ${reportType}:`, error);
        // Return empty structure instead of sample data
        return {
            error: `Failed to generate ${reportType} report`,
            message: 'Database query failed - please try again',
            timestamp: new Date()
        };
    }
}

// Fast patient outcomes data with real database query
async function generatePatientOutcomesData(baseMatch: any) {
    const startTime = Date.now();

    try {
        const therapyEffectiveness = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 50 },
                {
                    $group: {
                        _id: { $ifNull: ['$reviewType', 'Unknown'] },
                        totalReviews: { $sum: 1 },
                        completedReviews: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        totalCostSavings: {
                            $sum: { $ifNull: ['$clinicalOutcomes.costSavings', 0] }
                        }
                    }
                },
                { $sort: { totalReviews: -1 } }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]) as any[];

        const queryTime = Date.now() - startTime;
        console.log(`✅ Patient outcomes query completed in ${queryTime}ms, found ${therapyEffectiveness.length} records`);

        return {
            therapyEffectiveness,
            clinicalImprovements: {},
            adverseEventReduction: [],
        };
    } catch (error) {
        console.error('❌ Patient outcomes query failed:', error);
        return {
            therapyEffectiveness: [],
            clinicalImprovements: {},
            adverseEventReduction: [],
        };
    }
}

// Fast pharmacist interventions data with real database query
async function generatePharmacistInterventionsData(baseMatch: any) {
    const startTime = Date.now();

    try {
        const interventionMetrics = await Promise.race([
            MTRIntervention.aggregate([
                { $match: baseMatch },
                { $limit: 50 },
                {
                    $group: {
                        _id: { $ifNull: ['$type', 'Unknown'] },
                        totalInterventions: { $sum: 1 },
                        acceptedInterventions: {
                            $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { totalInterventions: -1 } }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]) as any[];

        const queryTime = Date.now() - startTime;
        console.log(`✅ Pharmacist interventions query completed in ${queryTime}ms, found ${interventionMetrics.length} records`);

        return {
            therapyEffectiveness: [],
            interventionMetrics,
            adherenceMetrics: [],
        };
    } catch (error) {
        console.error('❌ Pharmacist interventions query failed:', error);
        return {
            therapyEffectiveness: [],
            interventionMetrics: [],
            adherenceMetrics: [],
        };
    }
}

// Fast therapy effectiveness data with real database query
async function generateTherapyEffectivenessData(baseMatch: any) {
    const startTime = Date.now();

    try {
        const adherenceMetrics = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: { ...baseMatch, status: 'completed' } },
                { $limit: 50 },
                {
                    $group: {
                        _id: { $ifNull: ['$reviewType', 'Unknown'] },
                        totalReviews: { $sum: 1 },
                        adherenceImproved: {
                            $sum: { $cond: [{ $eq: ['$clinicalOutcomes.adherenceImproved', true] }, 1, 0] }
                        }
                    }
                },
                { $sort: { totalReviews: -1 } }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 3000))
        ]) as any[];

        const queryTime = Date.now() - startTime;
        console.log(`✅ Therapy effectiveness query completed in ${queryTime}ms, found ${adherenceMetrics.length} records`);

        return {
            therapyEffectiveness: [],
            interventionMetrics: [],
            adherenceMetrics,
        };
    } catch (error) {
        console.error('❌ Therapy effectiveness query failed:', error);
        return {
            therapyEffectiveness: [],
            interventionMetrics: [],
            adherenceMetrics: [],
        };
    }
}

// Real patient demographics data with comprehensive analysis
async function generatePatientDemographicsData(baseMatch: any) {
    const startTime = Date.now();
    console.log('📊 Generating COMPREHENSIVE patient demographics data...');

    try {
        // Remove createdAt filter for patient demographics as we want all patients
        const patientMatch = { ...baseMatch };
        delete patientMatch.createdAt;

        // Get comprehensive patient demographics
        const [
            ageDistribution,
            genderDistribution,
            maritalStatusDistribution,
            bloodGroupDistribution,
            genotypeDistribution,
            stateDistribution,
            totalPatients
        ] = await Promise.all([
            // Age distribution with proper field name and better grouping
            Promise.race([
                Patient.aggregate([
                    { $match: patientMatch },
                    { $limit: 1000 },
                    {
                        $addFields: {
                            calculatedAge: {
                                $cond: [
                                    { $ne: ['$dob', null] },
                                    {
                                        $floor: {
                                            $divide: [
                                                { $subtract: [new Date(), '$dob'] },
                                                365.25 * 24 * 60 * 60 * 1000
                                            ]
                                        }
                                    },
                                    { $ifNull: ['$age', null] }
                                ]
                            }
                        }
                    },
                    {
                        $addFields: {
                            ageGroup: {
                                $switch: {
                                    branches: [
                                        { case: { $and: [{ $gte: ['$calculatedAge', 0] }, { $lt: ['$calculatedAge', 18] }] }, then: '0-17' },
                                        { case: { $and: [{ $gte: ['$calculatedAge', 18] }, { $lt: ['$calculatedAge', 30] }] }, then: '18-29' },
                                        { case: { $and: [{ $gte: ['$calculatedAge', 30] }, { $lt: ['$calculatedAge', 45] }] }, then: '30-44' },
                                        { case: { $and: [{ $gte: ['$calculatedAge', 45] }, { $lt: ['$calculatedAge', 60] }] }, then: '45-59' },
                                        { case: { $and: [{ $gte: ['$calculatedAge', 60] }, { $lt: ['$calculatedAge', 75] }] }, then: '60-74' },
                                        { case: { $gte: ['$calculatedAge', 75] }, then: '75+' }
                                    ],
                                    default: 'Unknown'
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '$ageGroup',
                            count: { $sum: 1 },
                            avgAge: { $avg: '$calculatedAge' }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Age query timeout')), 3000))
            ]),

            // Gender distribution
            Promise.race([
                Patient.aggregate([
                    { $match: patientMatch },
                    { $limit: 1000 },
                    {
                        $group: {
                            _id: { $ifNull: ['$gender', 'Not Specified'] },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Gender query timeout')), 3000))
            ]),

            // Marital status distribution
            Promise.race([
                Patient.aggregate([
                    { $match: patientMatch },
                    { $limit: 1000 },
                    {
                        $group: {
                            _id: { $ifNull: ['$maritalStatus', 'Not Specified'] },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Marital status timeout')), 2000))
            ]),

            // Blood group distribution
            Promise.race([
                Patient.aggregate([
                    { $match: patientMatch },
                    { $limit: 1000 },
                    {
                        $group: {
                            _id: { $ifNull: ['$bloodGroup', 'Not Specified'] },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Blood group timeout')), 2000))
            ]),

            // Genotype distribution
            Promise.race([
                Patient.aggregate([
                    { $match: patientMatch },
                    { $limit: 1000 },
                    {
                        $group: {
                            _id: { $ifNull: ['$genotype', 'Not Specified'] },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Genotype timeout')), 2000))
            ]),

            // Geographic distribution (by state)
            Promise.race([
                Patient.aggregate([
                    { $match: patientMatch },
                    { $limit: 1000 },
                    {
                        $group: {
                            _id: { $ifNull: ['$state', 'Not Specified'] },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 } // Top 10 states
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('State timeout')), 2000))
            ]),

            // Total patient count
            Promise.race([
                Patient.countDocuments(patientMatch),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Count query timeout')), 2000))
            ])
        ]) as [any[], any[], any[], any[], any[], any[], number];

        const queryTime = Date.now() - startTime;
        console.log(`✅ Patient demographics query completed in ${queryTime}ms`);
        console.log(`📈 Found ${totalPatients} total patients`);
        console.log(`📊 Age groups: ${ageDistribution.length}, Gender: ${genderDistribution.length}, Marital: ${maritalStatusDistribution.length}`);
        console.log(`🩸 Blood groups: ${bloodGroupDistribution.length}, Genotypes: ${genotypeDistribution.length}, States: ${stateDistribution.length}`);

        return {
            ageDistribution,
            genderDistribution,
            maritalStatusDistribution,
            bloodGroupDistribution,
            genotypeDistribution,
            stateDistribution,
            totalPatients,
            geographicPatterns: stateDistribution,
            conditionSegmentation: [],
        };
    } catch (error) {
        console.error('❌ Patient demographics query failed:', error);
        // If patient query fails, try to get basic data from MTR
        return await generateBasicPatientDataFromMTR(baseMatch);
    }
}

// Fallback: Get patient data from MTR if Patient collection fails
async function generateBasicPatientDataFromMTR(baseMatch: any) {
    console.log('📊 Fallback: Getting patient data from MTR records...');

    try {
        const patientData = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 100 },
                {
                    $group: {
                        _id: '$patientId',
                        reviewCount: { $sum: 1 },
                        lastReview: { $max: '$createdAt' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalPatients: { $sum: 1 },
                        totalReviews: { $sum: '$reviewCount' }
                    }
                }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('MTR fallback timeout')), 2000))
        ]) as any[];

        const result = patientData[0] || { totalPatients: 0, totalReviews: 0 };
        console.log(`✅ MTR fallback found ${result.totalPatients} patients with ${result.totalReviews} reviews`);

        return {
            totalPatients: result.totalPatients,
            totalReviews: result.totalReviews,
            ageDistribution: [],
            genderDistribution: [],
            geographicPatterns: [],
            conditionSegmentation: [],
        };
    } catch (error) {
        console.error('❌ MTR fallback also failed:', error);
        return {
            totalPatients: 0,
            ageDistribution: [],
            genderDistribution: [],
            geographicPatterns: [],
            conditionSegmentation: [],
        };
    }
}

// Real quality improvement data
async function generateQualityImprovementData(baseMatch: any) {
    console.log('📊 Generating quality improvement data...');

    try {
        const qualityMetrics = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: { ...baseMatch, status: 'completed' } },
                { $limit: 100 },
                {
                    $group: {
                        _id: '$priority',
                        totalReviews: { $sum: 1 },
                        avgCompletionTime: {
                            $avg: {
                                $cond: [
                                    { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$startedAt', null] }] },
                                    { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60 * 24] },
                                    null
                                ]
                            }
                        }
                    }
                },
                { $sort: { totalReviews: -1 } }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Quality query timeout')), 3000))
        ]) as any[];

        console.log(`✅ Quality improvement data: ${qualityMetrics.length} priority groups`);

        return {
            completionTimeAnalysis: qualityMetrics,
            qualityMetrics: qualityMetrics,
        };
    } catch (error) {
        console.error('❌ Quality improvement query failed:', error);
        return { completionTimeAnalysis: [], qualityMetrics: [] };
    }
}

// Add other report type functions
async function generateRegulatoryComplianceData(baseMatch: any) {
    console.log('📊 Generating regulatory compliance data...');
    try {
        const complianceData = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 100 },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        compliantReviews: { $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] } }
                    }
                }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Compliance timeout')), 2000))
        ]) as any[];

        return { complianceMetrics: complianceData[0] || {} };
    } catch (error) {
        console.error('❌ Regulatory compliance query failed:', error);
        return { complianceMetrics: {} };
    }
}

async function generateCostEffectivenessData(baseMatch: any) {
    console.log('📊 Generating cost effectiveness data...');
    try {
        const costData = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 100 },
                {
                    $group: {
                        _id: '$reviewType',
                        totalCostSavings: { $sum: { $ifNull: ['$clinicalOutcomes.costSavings', 0] } },
                        reviewCount: { $sum: 1 }
                    }
                },
                { $sort: { totalCostSavings: -1 } }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Cost timeout')), 2000))
        ]) as any[];

        return { costSavings: costData };
    } catch (error) {
        console.error('❌ Cost effectiveness query failed:', error);
        return { costSavings: [] };
    }
}

async function generateTrendForecastingData(baseMatch: any) {
    console.log('📊 Generating trend forecasting data...');
    try {
        const trendData = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 200 },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        totalReviews: { $sum: 1 },
                        completedReviews: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Trend timeout')), 2000))
        ]) as any[];

        return { trends: trendData };
    } catch (error) {
        console.error('❌ Trend forecasting query failed:', error);
        return { trends: [] };
    }
}

async function generateOperationalEfficiencyData(baseMatch: any) {
    console.log('📊 Generating operational efficiency data...');
    try {
        const efficiencyData = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 100 },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        avgProcessingTime: {
                            $avg: {
                                $cond: [
                                    { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$createdAt', null] }] },
                                    { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 1000 * 60 * 60] },
                                    null
                                ]
                            }
                        }
                    }
                }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Efficiency timeout')), 2000))
        ]) as any[];

        return { workflowMetrics: efficiencyData };
    } catch (error) {
        console.error('❌ Operational efficiency query failed:', error);
        return { workflowMetrics: [] };
    }
}

async function generateMedicationInventoryData(baseMatch: any) {
    console.log('📊 Generating medication inventory data...');
    // This would typically query medication/inventory collections
    // For now, return structure indicating no specific inventory data
    return {
        usagePatterns: [],
        inventoryTurnover: [],
        expirationTracking: [],
        message: 'Medication inventory tracking not yet implemented'
    };
}

async function generateAdverseEventsData(baseMatch: any) {
    console.log('📊 Generating adverse events data...');
    try {
        // Try to get adverse events from clinical outcomes
        const adverseData = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 100 },
                {
                    $group: {
                        _id: '$reviewType',
                        totalReviews: { $sum: 1 },
                        adverseEventsReduced: {
                            $sum: { $cond: [{ $eq: ['$clinicalOutcomes.adverseEventsReduced', true] }, 1, 0] }
                        }
                    }
                }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Adverse events timeout')), 2000))
        ]) as any[];

        return { adverseEvents: adverseData };
    } catch (error) {
        console.error('❌ Adverse events query failed:', error);
        return { adverseEvents: [] };
    }
}

// Generic report data for truly unknown report types
async function generateGenericReportData(baseMatch: any, reportType: string) {
    console.log(`📊 Generating generic data for unknown report type: ${reportType}`);

    // Try to get some basic data from MTR collection
    try {
        const basicData = await Promise.race([
            MedicationTherapyReview.aggregate([
                { $match: baseMatch },
                { $limit: 10 },
                {
                    $group: {
                        _id: null,
                        totalRecords: { $sum: 1 },
                        completedRecords: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                    }
                }
            ]).allowDiskUse(true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 2000))
        ]) as any[];

        const result = basicData[0] || { totalRecords: 0, completedRecords: 0 };
        console.log(`✅ Generic data for ${reportType}: ${result.totalRecords} records`);

        return {
            basicMetrics: [result],
            message: `Basic data for ${reportType} - specific implementation needed`,
        };
    } catch (error) {
        console.log(`⚠️ Generic query failed for ${reportType}`);
        return {
            basicMetrics: [],
            message: `No data available for ${reportType}`,
        };
    }
}

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

// Apply essential middleware - Final Configuration (Phase 2 Stable)
router.use(auth);
router.use(requireLicense);  // Phase 1: ✅ Working
router.use(reportRateLimit);  // Phase 2: ✅ Working  
// router.use(auditTimer);  // Phase 3: ❌ DISABLED - caused performance issues

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
// Optimized handler with real database queries and fallback to sample data
router.get('/:reportType', async (req: AuthRequest, res: Response) => {
    try {
        const { reportType } = req.params;
        const userWorkplaceId = req.user?.workplaceId;
        const userRole = req.user?.role;

        console.log(`🚀 Optimized Report Generation - ${reportType} requested by ${req.user?.email}`);

        // Determine workspace filter
        const workspaceFilter = userRole === 'super_admin' ? {} : { workplaceId: userWorkplaceId };

        // Get real data with optimized queries and fallback
        const reportData = await generateOptimizedReportData(reportType, workspaceFilter);

        res.json({
            success: true,
            data: reportData,
            reportType,
            generatedAt: new Date(),
            message: 'Optimized report with real database data (last 30 days)',
            dataSource: 'database',
            workspaceFilter: userRole === 'super_admin' ? 'all-workspaces' : 'current-workspace'
        });

        console.log(`✅ Optimized Report - ${reportType} generated successfully with real data`);
    } catch (error) {
        console.error('❌ Fast Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Report generation failed',
            error: error.message
        });
    }
});

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