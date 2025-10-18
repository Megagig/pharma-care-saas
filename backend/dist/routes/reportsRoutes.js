"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const moment_1 = __importDefault(require("moment"));
const auth_1 = require("../middlewares/auth");
const auditMiddleware_1 = require("../middlewares/auditMiddleware");
const rbac_1 = require("../middlewares/rbac");
const reportsRBAC_1 = __importDefault(require("../middlewares/reportsRBAC"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const reportsController_1 = require("../controllers/reportsController");
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
const MTRIntervention_1 = __importDefault(require("../models/MTRIntervention"));
const Patient_1 = __importDefault(require("../models/Patient"));
const router = express_1.default.Router();
const reportRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many report requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
async function generateOptimizedReportData(reportType, combinedFilter) {
    console.log(`📊 Generating real data for ${reportType} with enhanced filters:`, combinedFilter);
    try {
        const baseMatch = {
            isDeleted: { $ne: true },
            ...combinedFilter
        };
        console.log(`🔍 Final database query filter:`, baseMatch);
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
    }
    catch (error) {
        console.error(`❌ Error generating real data for ${reportType}:`, error);
        return {
            error: `Failed to generate ${reportType} report`,
            message: 'Database query failed - please try again',
            timestamp: new Date()
        };
    }
}
async function generatePatientOutcomesData(baseMatch) {
    const startTime = Date.now();
    console.log('📊 Generating COMPREHENSIVE patient outcomes data...');
    try {
        const [therapyEffectiveness, clinicalImprovements, adverseEventReduction, outcomesByPriority, completionTimeAnalysis, costEffectivenessAnalysis] = await Promise.all([
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: { $ifNull: ['$reviewType', 'Unknown'] },
                            totalReviews: { $sum: 1 },
                            completedReviews: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                            inProgressReviews: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                            pendingReviews: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                            totalCostSavings: { $sum: { $ifNull: ['$clinicalOutcomes.costSavings', 0] } },
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
                new Promise((_, reject) => setTimeout(() => reject(new Error('Therapy effectiveness timeout')), 3000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: { ...baseMatch, status: 'completed' } },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: null,
                            totalCompleted: { $sum: 1 },
                            adherenceImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.adherenceImproved', true] }, 1, 0] } },
                            symptomsImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.symptomsImproved', true] }, 1, 0] } },
                            qualityOfLifeImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.qualityOfLifeImproved', true] }, 1, 0] } },
                            medicationOptimized: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.medicationOptimized', true] }, 1, 0] } },
                            avgPatientSatisfaction: { $avg: { $ifNull: ['$clinicalOutcomes.patientSatisfactionScore', 0] } }
                        }
                    }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Clinical improvements timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: '$reviewType',
                            totalReviews: { $sum: 1 },
                            adverseEventsReduced: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.adverseEventsReduced', true] }, 1, 0] } },
                            drugInteractionsResolved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.drugInteractionsResolved', true] }, 1, 0] } },
                            contraIndicationsAddressed: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.contraIndicationsAddressed', true] }, 1, 0] } }
                        }
                    },
                    { $sort: { adverseEventsReduced: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Adverse events timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: { $ifNull: ['$priority', 'Unknown'] },
                            totalReviews: { $sum: 1 },
                            completedReviews: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                            avgCostSavings: { $avg: { $ifNull: ['$clinicalOutcomes.costSavings', 0] } },
                            totalCostSavings: { $sum: { $ifNull: ['$clinicalOutcomes.costSavings', 0] } }
                        }
                    },
                    { $sort: { totalReviews: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Priority outcomes timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: { ...baseMatch, status: 'completed' } },
                    { $limit: 100 },
                    {
                        $addFields: {
                            completionDays: {
                                $cond: [
                                    { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$startedAt', null] }] },
                                    { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60 * 24] },
                                    null
                                ]
                            }
                        }
                    },
                    {
                        $bucket: {
                            groupBy: '$completionDays',
                            boundaries: [0, 1, 3, 7, 14, 30, 100],
                            default: 'Over 100 days',
                            output: {
                                count: { $sum: 1 },
                                avgDays: { $avg: '$completionDays' }
                            }
                        }
                    }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Completion time timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            totalReviews: { $sum: 1 },
                            totalCostSavings: { $sum: { $ifNull: ['$clinicalOutcomes.costSavings', 0] } },
                            avgCostSavings: { $avg: { $ifNull: ['$clinicalOutcomes.costSavings', 0] } }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Cost effectiveness timeout')), 2000))
            ])
        ]);
        const queryTime = Date.now() - startTime;
        console.log(`✅ Patient outcomes comprehensive analysis completed in ${queryTime}ms`);
        console.log(`📊 Found: ${therapyEffectiveness.length} therapy types, ${adverseEventReduction.length} adverse event categories`);
        return {
            therapyEffectiveness,
            clinicalImprovements: clinicalImprovements[0] || {},
            adverseEventReduction,
            outcomesByPriority,
            completionTimeAnalysis,
            costEffectivenessAnalysis,
        };
    }
    catch (error) {
        console.error('❌ Patient outcomes comprehensive query failed:', error);
        return {
            therapyEffectiveness: [],
            clinicalImprovements: {},
            adverseEventReduction: [],
            outcomesByPriority: [],
            completionTimeAnalysis: [],
            costEffectivenessAnalysis: [],
        };
    }
}
async function generatePharmacistInterventionsData(baseMatch) {
    const startTime = Date.now();
    console.log('📊 Generating COMPREHENSIVE pharmacist interventions data...');
    try {
        const [interventionMetrics, interventionsByPharmacist, interventionOutcomes, interventionTrends, interventionPriority, interventionEffectiveness] = await Promise.all([
            Promise.race([
                MTRIntervention_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: { $ifNull: ['$type', 'Unknown'] },
                            totalInterventions: { $sum: 1 },
                            acceptedInterventions: { $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] } },
                            rejectedInterventions: { $sum: { $cond: [{ $eq: ['$outcome', 'rejected'] }, 1, 0] } },
                            pendingInterventions: { $sum: { $cond: [{ $eq: ['$outcome', 'pending'] }, 1, 0] } },
                            avgResponseTime: {
                                $avg: {
                                    $cond: [
                                        { $and: [{ $ne: ['$resolvedAt', null] }, { $ne: ['$createdAt', null] }] },
                                        { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
                                        null
                                    ]
                                }
                            }
                        }
                    },
                    { $sort: { totalInterventions: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Intervention metrics timeout')), 3000))
            ]),
            Promise.race([
                MTRIntervention_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    { $lookup: { from: 'users', localField: 'pharmacistId', foreignField: '_id', as: 'pharmacist' } },
                    { $unwind: { path: '$pharmacist', preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: '$pharmacistId',
                            pharmacistName: { $first: { $concat: ['$pharmacist.firstName', ' ', '$pharmacist.lastName'] } },
                            totalInterventions: { $sum: 1 },
                            acceptedInterventions: { $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] } },
                            avgResponseTime: {
                                $avg: {
                                    $cond: [
                                        { $and: [{ $ne: ['$resolvedAt', null] }, { $ne: ['$createdAt', null] }] },
                                        { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
                                        null
                                    ]
                                }
                            }
                        }
                    },
                    { $sort: { totalInterventions: -1 } },
                    { $limit: 10 }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Pharmacist performance timeout')), 2000))
            ]),
            Promise.race([
                MTRIntervention_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: { $ifNull: ['$outcome', 'Unknown'] },
                            count: { $sum: 1 },
                            avgSeverity: { $avg: { $ifNull: ['$severity', 0] } },
                            avgImpact: { $avg: { $ifNull: ['$clinicalImpact', 0] } }
                        }
                    },
                    { $sort: { count: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Outcomes timeout')), 2000))
            ]),
            Promise.race([
                MTRIntervention_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 200 },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            totalInterventions: { $sum: 1 },
                            acceptedInterventions: { $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] } },
                            avgResponseTime: {
                                $avg: {
                                    $cond: [
                                        { $and: [{ $ne: ['$resolvedAt', null] }, { $ne: ['$createdAt', null] }] },
                                        { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
                                        null
                                    ]
                                }
                            }
                        }
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Trends timeout')), 2000))
            ]),
            Promise.race([
                MTRIntervention_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: { $ifNull: ['$priority', 'Unknown'] },
                            totalInterventions: { $sum: 1 },
                            acceptedInterventions: { $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] } },
                            avgSeverity: { $avg: { $ifNull: ['$severity', 0] } }
                        }
                    },
                    { $sort: { totalInterventions: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Priority timeout')), 2000))
            ]),
            Promise.race([
                MTRIntervention_1.default.aggregate([
                    { $match: { ...baseMatch, outcome: 'accepted' } },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: '$type',
                            totalAccepted: { $sum: 1 },
                            avgClinicalImpact: { $avg: { $ifNull: ['$clinicalImpact', 0] } },
                            avgPatientSatisfaction: { $avg: { $ifNull: ['$patientSatisfaction', 0] } },
                            costSavingsGenerated: { $sum: { $ifNull: ['$costSavings', 0] } }
                        }
                    },
                    { $sort: { avgClinicalImpact: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Effectiveness timeout')), 2000))
            ])
        ]);
        const queryTime = Date.now() - startTime;
        console.log(`✅ Pharmacist interventions comprehensive analysis completed in ${queryTime}ms`);
        console.log(`📊 Found: ${interventionMetrics.length} intervention types, ${interventionsByPharmacist.length} pharmacists`);
        return {
            interventionMetrics,
            interventionsByPharmacist,
            interventionOutcomes,
            interventionTrends,
            interventionPriority,
            interventionEffectiveness,
        };
    }
    catch (error) {
        console.error('❌ Pharmacist interventions comprehensive query failed:', error);
        return {
            interventionMetrics: [],
            interventionsByPharmacist: [],
            interventionOutcomes: [],
            interventionTrends: [],
            interventionPriority: [],
            interventionEffectiveness: [],
        };
    }
}
async function generateTherapyEffectivenessData(baseMatch) {
    const startTime = Date.now();
    console.log('📊 Generating COMPREHENSIVE therapy effectiveness data...');
    try {
        const [adherenceMetrics, therapyOutcomes, medicationOptimization, patientSatisfaction, clinicalIndicators, therapyDuration] = await Promise.all([
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: { ...baseMatch, status: 'completed' } },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: { $ifNull: ['$reviewType', 'Unknown'] },
                            totalReviews: { $sum: 1 },
                            adherenceImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.adherenceImproved', true] }, 1, 0] } },
                            avgAdherenceScore: { $avg: { $ifNull: ['$clinicalOutcomes.adherenceScore', 0] } },
                            baselineAdherence: { $avg: { $ifNull: ['$clinicalOutcomes.baselineAdherence', 0] } },
                            followUpAdherence: { $avg: { $ifNull: ['$clinicalOutcomes.followUpAdherence', 0] } }
                        }
                    },
                    { $sort: { totalReviews: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Adherence timeout')), 3000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: { ...baseMatch, status: 'completed' } },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: null,
                            totalCompleted: { $sum: 1 },
                            symptomsImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.symptomsImproved', true] }, 1, 0] } },
                            qualityOfLifeImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.qualityOfLifeImproved', true] }, 1, 0] } },
                            adverseEventsReduced: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.adverseEventsReduced', true] }, 1, 0] } },
                            drugInteractionsResolved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.drugInteractionsResolved', true] }, 1, 0] } },
                            avgClinicalImprovement: { $avg: { $ifNull: ['$clinicalOutcomes.clinicalImprovementScore', 0] } }
                        }
                    }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Outcomes timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: baseMatch },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: '$reviewType',
                            totalReviews: { $sum: 1 },
                            medicationOptimized: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.medicationOptimized', true] }, 1, 0] } },
                            dosageAdjusted: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.dosageAdjusted', true] }, 1, 0] } },
                            medicationSwitched: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.medicationSwitched', true] }, 1, 0] } },
                            medicationDiscontinued: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.medicationDiscontinued', true] }, 1, 0] } },
                            avgCostSavings: { $avg: { $ifNull: ['$clinicalOutcomes.costSavings', 0] } }
                        }
                    },
                    { $sort: { medicationOptimized: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Optimization timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: { ...baseMatch, status: 'completed' } },
                    { $limit: 100 },
                    {
                        $bucket: {
                            groupBy: { $ifNull: ['$clinicalOutcomes.patientSatisfactionScore', 0] },
                            boundaries: [0, 2, 4, 6, 8, 10],
                            default: 'No Rating',
                            output: {
                                count: { $sum: 1 },
                                avgScore: { $avg: '$clinicalOutcomes.patientSatisfactionScore' },
                                reviewTypes: { $addToSet: '$reviewType' }
                            }
                        }
                    }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Satisfaction timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: { ...baseMatch, status: 'completed' } },
                    { $limit: 100 },
                    {
                        $group: {
                            _id: '$priority',
                            totalReviews: { $sum: 1 },
                            vitalSignsImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.vitalSignsImproved', true] }, 1, 0] } },
                            labValuesImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.labValuesImproved', true] }, 1, 0] } },
                            functionalStatusImproved: { $sum: { $cond: [{ $eq: ['$clinicalOutcomes.functionalStatusImproved', true] }, 1, 0] } },
                            avgImprovementScore: { $avg: { $ifNull: ['$clinicalOutcomes.overallImprovementScore', 0] } }
                        }
                    },
                    { $sort: { totalReviews: -1 } }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Clinical indicators timeout')), 2000))
            ]),
            Promise.race([
                MedicationTherapyReview_1.default.aggregate([
                    { $match: { ...baseMatch, status: 'completed' } },
                    { $limit: 100 },
                    {
                        $addFields: {
                            therapyDurationDays: {
                                $cond: [
                                    { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$startedAt', null] }] },
                                    { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000 * 60 * 60 * 24] },
                                    null
                                ]
                            }
                        }
                    },
                    {
                        $bucket: {
                            groupBy: '$therapyDurationDays',
                            boundaries: [0, 7, 14, 30, 60, 90, 365],
                            default: 'Over 1 year',
                            output: {
                                count: { $sum: 1 },
                                avgDuration: { $avg: '$therapyDurationDays' },
                                successRate: { $avg: { $cond: [{ $eq: ['$clinicalOutcomes.treatmentSuccessful', true] }, 1, 0] } }
                            }
                        }
                    }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Duration timeout')), 2000))
            ])
        ]);
        const queryTime = Date.now() - startTime;
        console.log(`✅ Therapy effectiveness comprehensive analysis completed in ${queryTime}ms`);
        console.log(`📊 Found: ${adherenceMetrics.length} therapy types, ${medicationOptimization.length} optimization categories`);
        return {
            adherenceMetrics,
            therapyOutcomes: therapyOutcomes[0] || {},
            medicationOptimization,
            patientSatisfaction,
            clinicalIndicators,
            therapyDuration,
        };
    }
    catch (error) {
        console.error('❌ Therapy effectiveness comprehensive query failed:', error);
        return {
            adherenceMetrics: [],
            therapyOutcomes: {},
            medicationOptimization: [],
            patientSatisfaction: [],
            clinicalIndicators: [],
            therapyDuration: [],
        };
    }
}
async function generatePatientDemographicsData(baseMatch) {
    const startTime = Date.now();
    console.log('📊 Generating COMPREHENSIVE patient demographics data...');
    try {
        const patientMatch = { ...baseMatch };
        delete patientMatch.createdAt;
        const [ageDistribution, genderDistribution, maritalStatusDistribution, bloodGroupDistribution, genotypeDistribution, stateDistribution, totalPatients] = await Promise.all([
            Promise.race([
                Patient_1.default.aggregate([
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
            Promise.race([
                Patient_1.default.aggregate([
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
            Promise.race([
                Patient_1.default.aggregate([
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
            Promise.race([
                Patient_1.default.aggregate([
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
            Promise.race([
                Patient_1.default.aggregate([
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
            Promise.race([
                Patient_1.default.aggregate([
                    { $match: patientMatch },
                    { $limit: 1000 },
                    {
                        $group: {
                            _id: { $ifNull: ['$state', 'Not Specified'] },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { count: -1 } },
                    { $limit: 10 }
                ]).allowDiskUse(true),
                new Promise((_, reject) => setTimeout(() => reject(new Error('State timeout')), 2000))
            ]),
            Promise.race([
                Patient_1.default.countDocuments(patientMatch),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Count query timeout')), 2000))
            ])
        ]);
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
    }
    catch (error) {
        console.error('❌ Patient demographics query failed:', error);
        return await generateBasicPatientDataFromMTR(baseMatch);
    }
}
async function generateBasicPatientDataFromMTR(baseMatch) {
    console.log('📊 Fallback: Getting patient data from MTR records...');
    try {
        const patientData = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
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
    }
    catch (error) {
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
async function generateQualityImprovementData(baseMatch) {
    console.log('📊 Generating quality improvement data...');
    try {
        const qualityMetrics = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
        console.log(`✅ Quality improvement data: ${qualityMetrics.length} priority groups`);
        return {
            completionTimeAnalysis: qualityMetrics,
            qualityMetrics: qualityMetrics,
        };
    }
    catch (error) {
        console.error('❌ Quality improvement query failed:', error);
        return { completionTimeAnalysis: [], qualityMetrics: [] };
    }
}
async function generateRegulatoryComplianceData(baseMatch) {
    console.log('📊 Generating regulatory compliance data...');
    try {
        const complianceData = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
        return { complianceMetrics: complianceData[0] || {} };
    }
    catch (error) {
        console.error('❌ Regulatory compliance query failed:', error);
        return { complianceMetrics: {} };
    }
}
async function generateCostEffectivenessData(baseMatch) {
    console.log('📊 Generating cost effectiveness data...');
    try {
        const costData = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
        return { costSavings: costData };
    }
    catch (error) {
        console.error('❌ Cost effectiveness query failed:', error);
        return { costSavings: [] };
    }
}
async function generateTrendForecastingData(baseMatch) {
    console.log('📊 Generating trend forecasting data...');
    try {
        const trendData = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
        return { trends: trendData };
    }
    catch (error) {
        console.error('❌ Trend forecasting query failed:', error);
        return { trends: [] };
    }
}
async function generateOperationalEfficiencyData(baseMatch) {
    console.log('📊 Generating operational efficiency data...');
    try {
        const efficiencyData = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
        return { workflowMetrics: efficiencyData };
    }
    catch (error) {
        console.error('❌ Operational efficiency query failed:', error);
        return { workflowMetrics: [] };
    }
}
async function generateMedicationInventoryData(baseMatch) {
    console.log('📊 Generating medication inventory data...');
    return {
        usagePatterns: [],
        inventoryTurnover: [],
        expirationTracking: [],
        message: 'Medication inventory tracking not yet implemented'
    };
}
async function generateAdverseEventsData(baseMatch) {
    console.log('📊 Generating adverse events data...');
    try {
        const adverseData = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
        return { adverseEvents: adverseData };
    }
    catch (error) {
        console.error('❌ Adverse events query failed:', error);
        return { adverseEvents: [] };
    }
}
async function generateGenericReportData(baseMatch, reportType) {
    console.log(`📊 Generating generic data for unknown report type: ${reportType}`);
    try {
        const basicData = await Promise.race([
            MedicationTherapyReview_1.default.aggregate([
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
        ]);
        const result = basicData[0] || { totalRecords: 0, completedRecords: 0 };
        console.log(`✅ Generic data for ${reportType}: ${result.totalRecords} records`);
        return {
            basicMetrics: [result],
            message: `Basic data for ${reportType} - specific implementation needed`,
        };
    }
    catch (error) {
        console.log(`⚠️ Generic query failed for ${reportType}`);
        return {
            basicMetrics: [],
            message: `No data available for ${reportType}`,
        };
    }
}
const validateDateRange = (req, res, next) => {
    const { startDate, endDate, preset, dateRange } = req.query;
    if (preset) {
        const validPresets = ['7d', '30d', '90d', '1y', 'ytd', 'mtd', 'wtd', 'custom'];
        if (!validPresets.includes(preset)) {
            return res.status(400).json({
                success: false,
                message: `Invalid preset. Valid options: ${validPresets.join(', ')}`
            });
        }
        const now = new Date();
        let calculatedStartDate;
        let calculatedEndDate = now;
        switch (preset) {
            case '7d':
                calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                calculatedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                calculatedStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                calculatedStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'ytd':
                calculatedStartDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'mtd':
                calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'wtd':
                const dayOfWeek = now.getDay();
                calculatedStartDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
                break;
            default:
                calculatedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        req.calculatedDateRange = {
            startDate: calculatedStartDate,
            endDate: calculatedEndDate,
            preset: preset
        };
    }
    if (startDate && !(0, moment_1.default)(startDate).isValid()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid start date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) or YYYY-MM-DD.'
        });
    }
    if (endDate && !(0, moment_1.default)(endDate).isValid()) {
        return res.status(400).json({
            success: false,
            message: 'Invalid end date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ) or YYYY-MM-DD.'
        });
    }
    if (startDate && endDate && (0, moment_1.default)(startDate).isAfter((0, moment_1.default)(endDate))) {
        return res.status(400).json({
            success: false,
            message: 'Start date cannot be after end date.'
        });
    }
    if (startDate && endDate) {
        const start = (0, moment_1.default)(startDate);
        const end = (0, moment_1.default)(endDate);
        const daysDiff = end.diff(start, 'days');
        if (daysDiff > 1095) {
            return res.status(400).json({
                success: false,
                message: 'Date range cannot exceed 3 years for performance reasons.'
            });
        }
    }
    if (dateRange) {
        try {
            const parsedRange = typeof dateRange === 'string' ? JSON.parse(dateRange) : dateRange;
            if (parsedRange.startDate && parsedRange.endDate) {
                if (!(0, moment_1.default)(parsedRange.startDate).isValid() || !(0, moment_1.default)(parsedRange.endDate).isValid()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid date range format in dateRange object.'
                    });
                }
                req.parsedDateRange = parsedRange;
            }
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON format for dateRange parameter.'
            });
        }
    }
    next();
};
router.use(auth_1.auth);
router.use(auth_1.requireLicense);
router.use(reportRateLimit);
router.get('/types', (0, rbac_1.requirePermission)('view_reports', { useDynamicRBAC: true }), (0, auditMiddleware_1.auditMTRActivity)('VIEW_AVAILABLE_REPORTS'), reportsController_1.getAvailableReports);
router.get('/summary', (0, rbac_1.requirePermission)('view_reports', { useDynamicRBAC: true }), validateDateRange, reportsRBAC_1.default.enforceWorkspaceIsolation, (0, auditMiddleware_1.auditMTRActivity)('VIEW_REPORT_SUMMARY'), reportsController_1.getReportSummary);
router.get('/:reportType', validateDateRange, async (req, res) => {
    try {
        const { reportType } = req.params;
        const { startDate, endDate, preset } = req.query;
        const userWorkplaceId = req.user?.workplaceId;
        const userRole = req.user?.role;
        console.log(`🚀 Enhanced Report Generation - ${reportType} requested by ${req.user?.email}`);
        console.log(`📅 Date filters - startDate: ${startDate}, endDate: ${endDate}, preset: ${preset}`);
        const workspaceFilter = userRole === 'super_admin' ? {} : { workplaceId: userWorkplaceId };
        let dateRangeFilter = {};
        let actualStartDate = null;
        let actualEndDate = null;
        if (req.calculatedDateRange) {
            const { startDate: calcStart, endDate: calcEnd } = req.calculatedDateRange;
            actualStartDate = calcStart;
            actualEndDate = calcEnd;
            dateRangeFilter = {
                createdAt: {
                    $gte: calcStart,
                    $lte: calcEnd
                }
            };
            console.log(`📅 Using preset date range: ${calcStart.toISOString()} to ${calcEnd.toISOString()}`);
        }
        else if (startDate && endDate) {
            actualStartDate = new Date(startDate);
            actualEndDate = new Date(endDate);
            dateRangeFilter = {
                createdAt: {
                    $gte: actualStartDate,
                    $lte: actualEndDate
                }
            };
            console.log(`📅 Using custom date range: ${startDate} to ${endDate}`);
        }
        else {
            actualEndDate = new Date();
            actualStartDate = new Date(actualEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateRangeFilter = {
                createdAt: {
                    $gte: actualStartDate,
                    $lte: actualEndDate
                }
            };
            console.log(`📅 Using default 30-day range: ${actualStartDate.toISOString()} to ${actualEndDate.toISOString()}`);
        }
        const combinedFilter = {
            ...workspaceFilter,
            ...dateRangeFilter
        };
        const reportData = await generateOptimizedReportData(reportType, combinedFilter);
        const responseMetadata = {
            dateRange: {
                startDate: actualStartDate,
                endDate: actualEndDate,
                preset: preset || 'custom',
                appliedFilter: dateRangeFilter
            },
            workspaceFilter: userRole === 'super_admin' ? 'all-workspaces' : 'current-workspace',
            generatedAt: new Date(),
            reportType,
            dataSource: 'database'
        };
        res.json({
            success: true,
            data: reportData,
            metadata: responseMetadata,
            message: `Enhanced report with date filtering (${preset || 'custom range'})`,
        });
        console.log(`✅ Enhanced Report - ${reportType} generated successfully with date filtering`);
    }
    catch (error) {
        console.error('❌ Enhanced Report Error:', error);
        res.status(500).json({
            success: false,
            message: 'Report generation failed',
            error: error.message,
            timestamp: new Date()
        });
    }
});
router.post('/export', (0, rbac_1.requirePermission)('export_reports', { useDynamicRBAC: true }), reportsRBAC_1.default.enforceWorkspaceIsolation, (0, auditMiddleware_1.auditMTRActivity)('QUEUE_REPORT_EXPORT'), reportsController_1.queueReportExport);
router.get('/export/:jobId/status', (0, rbac_1.requirePermission)('export_reports', { useDynamicRBAC: true }), reportsController_1.getExportJobStatus);
router.get('/performance/stats', (0, rbac_1.requirePermission)('view_system_stats', { useDynamicRBAC: true }), reportsController_1.getPerformanceStats);
router.use((error, req, res, next) => {
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
exports.default = router;
//# sourceMappingURL=reportsRoutes.js.map