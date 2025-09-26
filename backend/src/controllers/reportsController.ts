import { Response } from 'express';
import mongoose from 'mongoose';
import moment from 'moment';
import MedicationTherapyReview from '../models/MedicationTherapyReview';
import MTRIntervention from '../models/MTRIntervention';
import DrugTherapyProblem from '../models/DrugTherapyProblem';
import MedicationManagement from '../models/MedicationManagement';
import { sendSuccess, sendError } from '../utils/responseHelpers';
import { AuthRequest } from '../middlewares/auth';
import logger from '../utils/logger';
import ReportAggregationService from '../services/ReportAggregationService';
import {
  RedisCacheService,
  CacheKeyGenerator,
  CachedReportService,
} from '../services/RedisCacheService';
import BackgroundJobService from '../services/BackgroundJobService';
import ConnectionPoolService from '../services/ConnectionPoolService';

/**
 * Unified Reports Controller
 * Handles all report types for the Reports & Analytics module
 */

interface ReportFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  patientId?: string;
  pharmacistId?: string;
  therapyType?: string;
  priority?: string;
  location?: string;
  status?: string;
}

/**
 * Get unified report data based on report type with caching and optimization
 */
export const getUnifiedReportData = async (req: AuthRequest, res: Response) => {
  try {
    const { reportType } = req.params;
    const workplaceId = req.user?.workplaceId;

    // Parse filters from query parameters
    const filters = parseReportFilters(req.query);

    // Use cached report service for performance
    const cachedReportService = new CachedReportService();

    const reportData = await cachedReportService.getCachedReportData(
      reportType || '',
      workplaceId?.toString() || '',
      filters,
      async () => {
        // Generate report data using optimized aggregation
        switch (reportType) {
          case 'patient-outcomes':
            return await getPatientOutcomesDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'pharmacist-interventions':
            return await getPharmacistInterventionsDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'therapy-effectiveness':
            return await getTherapyEffectivenessDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'quality-improvement':
            return await getQualityImprovementDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'regulatory-compliance':
            return await getRegulatoryComplianceDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'cost-effectiveness':
            return await getCostEffectivenessDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'trend-forecasting':
            return await getTrendForecastingDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'operational-efficiency':
            return await getOperationalEfficiencyDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'medication-inventory':
            return await getMedicationInventoryDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'patient-demographics':
            return await getPatientDemographicsDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          case 'adverse-events':
            return await getAdverseEventsDataOptimized(
              workplaceId?.toString() || '',
              filters
            );
          default:
            throw new Error('Invalid report type specified');
        }
      },
      300 // 5 minutes cache TTL
    );

    sendSuccess(
      res,
      {
        reportType,
        data: reportData,
        filters,
        generatedAt: new Date(),
        currency: { code: 'NGN', symbol: '₦' },
        cached: true,
      },
      `${reportType} report generated successfully`
    );
  } catch (error) {
    logger.error(`Error generating ${req.params.reportType} report:`, error);
    sendError(res, 'SERVER_ERROR', 'Failed to generate report', 500);
  }
};

/**
 * Get available report types and their metadata
 */
export const getAvailableReports = async (req: AuthRequest, res: Response) => {
  try {
    const reportTypes = [
      {
        id: 'patient-outcomes',
        name: 'Patient Outcome Analytics',
        description:
          'Analyze therapy effectiveness and clinical parameter improvements',
        category: 'Clinical',
        icon: 'TrendingUp',
        permissions: ['view_patient_outcomes'],
      },
      {
        id: 'pharmacist-interventions',
        name: 'Pharmacist Intervention Tracking',
        description: 'Track intervention metrics and pharmacist performance',
        category: 'Performance',
        icon: 'Users',
        permissions: ['view_pharmacist_performance'],
      },
      {
        id: 'therapy-effectiveness',
        name: 'Therapy Effectiveness Metrics',
        description:
          'Monitor medication adherence and therapy completion rates',
        category: 'Clinical',
        icon: 'Activity',
        permissions: ['view_therapy_metrics'],
      },
      {
        id: 'quality-improvement',
        name: 'Quality Improvement Dashboard',
        description: 'Analyze completion times and documentation quality',
        category: 'Quality',
        icon: 'CheckCircle',
        permissions: ['view_quality_metrics'],
      },
      {
        id: 'regulatory-compliance',
        name: 'Regulatory Compliance Reports',
        description: 'Generate compliance metrics and audit trails',
        category: 'Compliance',
        icon: 'Shield',
        permissions: ['view_compliance_reports'],
      },
      {
        id: 'cost-effectiveness',
        name: 'Cost-Effectiveness Analysis',
        description: 'Analyze cost savings and ROI from interventions',
        category: 'Financial',
        icon: 'DollarSign',
        permissions: ['view_financial_reports'],
      },
      {
        id: 'trend-forecasting',
        name: 'Trend Identification & Forecasting',
        description: 'Identify trends and generate predictive insights',
        category: 'Analytics',
        icon: 'TrendingUp',
        permissions: ['view_trend_analysis'],
      },
      {
        id: 'operational-efficiency',
        name: 'Operational Efficiency',
        description: 'Monitor workflow metrics and resource utilization',
        category: 'Operations',
        icon: 'Zap',
        permissions: ['view_operational_metrics'],
      },
      {
        id: 'medication-inventory',
        name: 'Medication Usage & Inventory',
        description: 'Analyze usage patterns and inventory optimization',
        category: 'Inventory',
        icon: 'Package',
        permissions: ['view_inventory_reports'],
      },
      {
        id: 'patient-demographics',
        name: 'Patient Demographics & Segmentation',
        description: 'Analyze patient population and service utilization',
        category: 'Demographics',
        icon: 'Users',
        permissions: ['view_patient_demographics'],
      },
      {
        id: 'adverse-events',
        name: 'Adverse Event & Incident Reporting',
        description: 'Monitor safety patterns and incident frequencies',
        category: 'Safety',
        icon: 'AlertTriangle',
        permissions: ['view_safety_reports'],
      },
    ];

    sendSuccess(
      res,
      { reportTypes },
      'Available report types retrieved successfully'
    );
  } catch (error) {
    logger.error('Error getting available reports:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to retrieve available reports', 500);
  }
};

/**
 * Get report summary statistics
 */
export const getReportSummary = async (req: AuthRequest, res: Response) => {
  try {
    const workplaceId = req.user?.workplaceId;
    const { period = '30d' } = req.query;

    const startDate = moment()
      .subtract(parseInt(period.toString(), 10) || 30, 'days')
      .toDate();

    const matchStage = {
      workplaceId: new mongoose.Types.ObjectId(workplaceId),
      isDeleted: false,
      createdAt: { $gte: startDate },
    };

    // Get summary statistics
    const [mtrStats, interventionStats, problemStats] = await Promise.all([
      MedicationTherapyReview.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            completedReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
            avgCompletionTime: {
              $avg: {
                $cond: [
                  { $ne: ['$completedAt', null] },
                  {
                    $divide: [
                      { $subtract: ['$completedAt', '$startedAt'] },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
      ]),
      MTRIntervention.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalInterventions: { $sum: 1 },
            acceptedInterventions: {
              $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
            },
          },
        },
      ]),
      DrugTherapyProblem.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalProblems: { $sum: 1 },
            resolvedProblems: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const mtr = mtrStats[0] || {};
    const intervention = interventionStats[0] || {};
    const problem = problemStats[0] || {};

    const summary = {
      totalReviews: mtr.totalReviews || 0,
      completedReviews: mtr.completedReviews || 0,
      completionRate:
        mtr.totalReviews > 0
          ? (mtr.completedReviews / mtr.totalReviews) * 100
          : 0,
      totalInterventions: intervention.totalInterventions || 0,
      interventionAcceptanceRate:
        intervention.totalInterventions > 0
          ? (intervention.acceptedInterventions /
              intervention.totalInterventions) *
            100
          : 0,
      totalProblems: problem.totalProblems || 0,
      problemResolutionRate:
        problem.totalProblems > 0
          ? (problem.resolvedProblems / problem.totalProblems) * 100
          : 0,
      totalCostSavings: mtr.totalCostSavings || 0,
      avgCompletionTime: mtr.avgCompletionTime || 0,
      formattedCostSavings: new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
      }).format(mtr.totalCostSavings || 0),
    };

    sendSuccess(
      res,
      { summary, period },
      'Report summary generated successfully'
    );
  } catch (error) {
    logger.error('Error generating report summary:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to generate report summary', 500);
  }
};

/**
 * Queue large export job for background processing
 */
export const queueReportExport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportType, format, fileName } = req.body;
    const workplaceId = req.user?.workplaceId;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // Parse filters from request body
    const filters = parseReportFilters(req.body.filters || {});

    // Queue the export job
    const job = await (BackgroundJobService as any)
      .getInstance()
      .queueExportJob({
        reportType,
        workplaceId,
        userId,
        userEmail,
        filters,
        format,
        fileName:
          fileName ||
          `${reportType}-${new Date().toISOString().split('T')[0]}.${format}`,
        options: req.body.options || {},
      });

    sendSuccess(
      res,
      {
        jobId: job.id,
        status: 'queued',
        estimatedTime: '2-5 minutes',
      },
      'Export job queued successfully'
    );
  } catch (error) {
    logger.error('Error queuing export job:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to queue export job', 500);
  }
};

/**
 * Get export job status
 */
export const getExportJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const status = await BackgroundJobService.getInstance().getJobStatus(
      jobId,
      'export'
    );

    sendSuccess(res, status, 'Job status retrieved successfully');
  } catch (error) {
    logger.error('Error getting job status:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to get job status', 500);
  }
};

/**
 * Get performance statistics
 */
export const getPerformanceStats = async (req: AuthRequest, res: Response) => {
  try {
    const aggregationStats =
      ReportAggregationService.getInstance().getPerformanceStats();
    const cacheStats = RedisCacheService.getInstance().getStats();
    const connectionStats = ConnectionPoolService.getInstance().getStats();
    const queueStats = await BackgroundJobService.getInstance().getQueueStats();

    sendSuccess(
      res,
      {
        aggregation: aggregationStats,
        cache: cacheStats,
        connections: connectionStats,
        queues: queueStats,
      },
      'Performance statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error getting performance stats:', error);
    sendError(res, 'SERVER_ERROR', 'Failed to get performance stats', 500);
  }
};

// Helper functions for individual report types (optimized versions)

async function getPatientOutcomesDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  const aggregationService = ReportAggregationService.getInstance();

  // Build faceted aggregation for multiple metrics in one query
  const facets = {
    therapyEffectiveness: [
      aggregationService.buildOptimizedGroupStage('reviewType', [
        'count',
        'completionRate',
        'totalCostSavings',
      ]),
    ],
    clinicalImprovements: [
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          bloodPressureImproved: {
            $sum: { $cond: ['$clinicalOutcomes.bloodPressureImproved', 1, 0] },
          },
          bloodSugarImproved: {
            $sum: { $cond: ['$clinicalOutcomes.bloodSugarImproved', 1, 0] },
          },
          cholesterolImproved: {
            $sum: { $cond: ['$clinicalOutcomes.cholesterolImproved', 1, 0] },
          },
          painReduced: {
            $sum: { $cond: ['$clinicalOutcomes.painReduced', 1, 0] },
          },
          totalReviews: { $sum: 1 },
        },
      },
    ],
    adverseEventReduction: [
      { $match: { status: 'completed' } },
      aggregationService.buildOptimizedGroupStage('reviewType', ['count']),
      {
        $addFields: {
          adverseEventsReduced: {
            $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] },
          },
        },
      },
    ],
  };

  const pipeline = aggregationService.buildFacetedAggregation(
    workplaceId,
    filters,
    facets
  );

  const result = await aggregationService.executeAggregation(
    MedicationTherapyReview,
    pipeline,
    { allowDiskUse: true }
  );

  return result.data[0] || {};
}

async function getPatientOutcomesData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const [therapyEffectiveness, clinicalImprovements, adverseEventReduction] =
    await Promise.all([
      MedicationTherapyReview.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$reviewType',
            totalReviews: { $sum: 1 },
            completedReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            avgCompletionTime: {
              $avg: {
                $cond: [
                  { $ne: ['$completedAt', null] },
                  {
                    $divide: [
                      { $subtract: ['$completedAt', '$startedAt'] },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                  null,
                ],
              },
            },
            totalProblemsResolved: {
              $sum: '$clinicalOutcomes.problemsResolved',
            },
            totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
          },
        },
      ]),
      MedicationTherapyReview.aggregate([
        { $match: { ...matchStage, status: 'completed' } },
        {
          $group: {
            _id: null,
            bloodPressureImproved: {
              $sum: {
                $cond: ['$clinicalOutcomes.bloodPressureImproved', 1, 0],
              },
            },
            bloodSugarImproved: {
              $sum: { $cond: ['$clinicalOutcomes.bloodSugarImproved', 1, 0] },
            },
            cholesterolImproved: {
              $sum: { $cond: ['$clinicalOutcomes.cholesterolImproved', 1, 0] },
            },
            painReduced: {
              $sum: { $cond: ['$clinicalOutcomes.painReduced', 1, 0] },
            },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      MedicationTherapyReview.aggregate([
        { $match: { ...matchStage, status: 'completed' } },
        {
          $group: {
            _id: '$reviewType',
            totalReviews: { $sum: 1 },
            adverseEventsReduced: {
              $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] },
            },
          },
        },
      ]),
    ]);

  return {
    therapyEffectiveness,
    clinicalImprovements: clinicalImprovements[0] || {},
    adverseEventReduction,
  };
}

async function getPharmacistInterventionsDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  const aggregationService = ReportAggregationService.getInstance();

  const facets = {
    interventionMetrics: [
      aggregationService.buildOptimizedGroupStage('type', [
        'count',
        'acceptanceRate',
      ]),
    ],
    pharmacistPerformance: [
      aggregationService.buildOptimizedLookup(
        'users',
        'pharmacistId',
        '_id',
        'pharmacist'
      ),
      { $unwind: '$pharmacist' },
      {
        $group: {
          _id: '$pharmacistId',
          pharmacistName: { $first: '$pharmacist.name' },
          totalInterventions: { $sum: 1 },
          acceptedInterventions: {
            $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
          },
        },
      },
    ],
  };

  const pipeline = aggregationService.buildFacetedAggregation(
    workplaceId,
    filters,
    facets
  );

  const result = await aggregationService.executeAggregation(
    MTRIntervention,
    pipeline,
    { allowDiskUse: true }
  );

  return result.data[0] || {};
}

async function getPharmacistInterventionsData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const [interventionMetrics, pharmacistPerformance] = await Promise.all([
    MTRIntervention.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          totalInterventions: { $sum: 1 },
          acceptedInterventions: {
            $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
          },
          avgAcceptanceRate: { $avg: '$acceptanceRate' },
        },
      },
    ]),
    MTRIntervention.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'pharmacistId',
          foreignField: '_id',
          as: 'pharmacist',
        },
      },
      { $unwind: '$pharmacist' },
      {
        $group: {
          _id: '$pharmacistId',
          pharmacistName: {
            $first: '$pharmacist.name',
          },
          totalInterventions: { $sum: 1 },
          acceptedInterventions: {
            $sum: { $cond: [{ $eq: ['$outcome', 'accepted'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);
}

async function getTherapyEffectivenessData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const adherenceMetrics = await MedicationTherapyReview.aggregate([
    { $match: { ...matchStage, status: 'completed' } },
    {
      $group: {
        _id: '$reviewType',
        totalReviews: { $sum: 1 },
        adherenceImproved: {
          $sum: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] },
        },
        avgAdherenceScore: { $avg: '$clinicalOutcomes.adherenceScore' },
      },
    },
  ]);

  return { adherenceMetrics };
}

async function getQualityImprovementData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const completionTimeAnalysis = await MedicationTherapyReview.aggregate([
    { $match: { ...matchStage, status: 'completed' } },
    {
      $group: {
        _id: '$priority',
        avgCompletionTime: {
          $avg: {
            $divide: [
              { $subtract: ['$completedAt', '$startedAt'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return { completionTimeAnalysis };
}

async function getRegulatoryComplianceData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const complianceMetrics = await MedicationTherapyReview.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        compliantReviews: { $sum: { $cond: ['$isCompliant', 1, 0] } },
        avgComplianceScore: { $avg: '$complianceScore' },
      },
    },
  ]);

  return { complianceMetrics: complianceMetrics[0] || {} };
}

async function getCostEffectivenessData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const costSavings = await MTRIntervention.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalCostSavings: { $sum: '$costSavings' },
        totalImplementationCost: { $sum: '$implementationCost' },
        count: { $sum: 1 },
      },
    },
  ]);

  return { costSavings };
}

async function getTrendForecastingData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const trends = await MedicationTherapyReview.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalReviews: { $sum: 1 },
        completedReviews: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return { trends };
}

async function getOperationalEfficiencyData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const workflowMetrics = await MedicationTherapyReview.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: {
          $avg: {
            $cond: [
              { $ne: ['$completedAt', null] },
              {
                $divide: [
                  { $subtract: ['$completedAt', '$createdAt'] },
                  1000 * 60 * 60,
                ],
              },
              null,
            ],
          },
        },
      },
    },
  ]);

  return { workflowMetrics };
}

async function getMedicationInventoryData(
  workplaceId: string,
  filters: ReportFilters
) {
  // This would typically query inventory-specific models
  // For now, return sample data structure
  return {
    usagePatterns: [],
    inventoryTurnover: [],
    expirationTracking: [],
  };
}

async function getPatientDemographicsData(
  workplaceId: string,
  filters: ReportFilters
) {
  // This would typically query patient demographic data
  // For now, return sample data structure
  return {
    ageDistribution: [],
    geographicPatterns: [],
    conditionSegmentation: [],
  };
}

async function getAdverseEventsData(
  workplaceId: string,
  filters: ReportFilters
) {
  const matchStage = buildMatchStage(workplaceId, filters);

  const adverseEvents = await DrugTherapyProblem.aggregate([
    { $match: { ...matchStage, category: 'adverse_event' } },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 },
        resolvedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
        },
      },
    },
  ]);

  return { adverseEvents };
}

// Helper functions

function parseReportFilters(query: any): ReportFilters {
  const filters: ReportFilters = {};

  if (query.startDate || query.endDate) {
    filters.dateRange = {
      startDate: query.startDate
        ? new Date(query.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: query.endDate ? new Date(query.endDate) : new Date(),
    };
  }

  if (query.patientId) filters.patientId = query.patientId;
  if (query.pharmacistId) filters.pharmacistId = query.pharmacistId;
  if (query.therapyType) filters.therapyType = query.therapyType;
  if (query.priority) filters.priority = query.priority;
  if (query.location) filters.location = query.location;
  if (query.status) filters.status = query.status;

  return filters;
}

function buildMatchStage(workplaceId: string, filters: ReportFilters) {
  const matchStage: any = {
    workplaceId: new mongoose.Types.ObjectId(workplaceId),
    isDeleted: false,
  };

  if (filters.dateRange) {
    matchStage.createdAt = {
      $gte: filters.dateRange.startDate,
      $lte: filters.dateRange.endDate,
    };
  }

  if (filters.patientId) {
    matchStage.patientId = new mongoose.Types.ObjectId(filters.patientId);
  }

  if (filters.pharmacistId) {
    matchStage.pharmacistId = new mongoose.Types.ObjectId(filters.pharmacistId);
  }

  if (filters.therapyType) {
    matchStage.reviewType = filters.therapyType;
  }

  if (filters.priority) {
    matchStage.priority = filters.priority;
  }

  if (filters.status) {
    matchStage.status = filters.status;
  }

  return matchStage;
}

// Missing optimized functions
async function getTherapyEffectivenessDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getTherapyEffectivenessData(workplaceId, filters);
}

async function getQualityImprovementDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getQualityImprovementData(workplaceId, filters);
}

async function getRegulatoryComplianceDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getRegulatoryComplianceData(workplaceId, filters);
}

async function getCostEffectivenessDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getCostEffectivenessData(workplaceId, filters);
}

async function getTrendForecastingDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getTrendForecastingData(workplaceId, filters);
}

async function getOperationalEfficiencyDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getOperationalEfficiencyData(workplaceId, filters);
}

async function getMedicationInventoryDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getMedicationInventoryData(workplaceId, filters);
}

async function getPatientDemographicsDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getPatientDemographicsData(workplaceId, filters);
}

async function getAdverseEventsDataOptimized(
  workplaceId: string,
  filters: ReportFilters
) {
  // Placeholder implementation
  return await getAdverseEventsData(workplaceId, filters);
}
