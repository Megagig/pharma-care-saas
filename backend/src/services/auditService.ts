import mongoose from 'mongoose';
import { Request } from 'express';
import MTRAuditLog, { IMTRAuditLog } from '../models/MTRAuditLog';
import logger from '../utils/logger';

/**
 * Enhanced Audit Service for MTR Compliance
 * Provides comprehensive audit logging and compliance tracking
 */

export interface AuditContext {
  userId: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId;
  userRole: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
}

export interface AuditLogData {
  action: string;
  resourceType:
    | 'MedicationTherapyReview'
    | 'DrugTherapyProblem'
    | 'MTRIntervention'
    | 'MTRFollowUp'
    | 'Patient'
    | 'User'
    | 'ClinicalIntervention'
    | 'ClinicalNote'
    | 'System';
  resourceId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  reviewId?: mongoose.Types.ObjectId;
  oldValues?: any;
  newValues?: any;
  changedFields?: string[];
  details: any;
  errorMessage?: string;
  duration?: number;
  complianceCategory?:
    | 'clinical_documentation'
    | 'patient_safety'
    | 'data_access'
    | 'system_security'
    | 'workflow_compliance';
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  dateRange?: { start: Date; end: Date };
  filters?: {
    userId?: mongoose.Types.ObjectId;
    action?: string;
    resourceType?: string;
    complianceCategory?: string;
    riskLevel?: string;
    patientId?: mongoose.Types.ObjectId;
    reviewId?: mongoose.Types.ObjectId;
  };
  includeDetails?: boolean;
  includeSensitiveData?: boolean;
}

class AuditService {
  /**
   * Create audit log entry
   */
  static async logActivity(
    context: AuditContext,
    auditData: AuditLogData
  ): Promise<IMTRAuditLog> {
    try {
      // Determine compliance category if not provided
      const complianceCategory =
        auditData.complianceCategory ||
        this.determineComplianceCategory(auditData.action);

      // Determine risk level if not provided
      const riskLevel =
        auditData.riskLevel ||
        this.determineRiskLevel(auditData.action, auditData.resourceType);

      const auditLog = new MTRAuditLog({
        workplaceId: context.workplaceId,
        action: auditData.action,
        resourceType: auditData.resourceType,
        resourceId: auditData.resourceId,
        userId: context.userId,
        userRole: context.userRole,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        requestMethod: context.requestMethod,
        requestUrl: context.requestUrl,
        oldValues: auditData.oldValues,
        newValues: auditData.newValues,
        changedFields: auditData.changedFields,
        patientId: auditData.patientId,
        reviewId: auditData.reviewId,
        complianceCategory,
        riskLevel,
        details: auditData.details,
        errorMessage: auditData.errorMessage,
        duration: auditData.duration,
        timestamp: new Date(),
        createdBy: context.userId,
      });

      await auditLog.save();

      // Log to winston for file storage
      logger.info('MTR Audit Log Created', {
        auditId: auditLog._id,
        action: auditData.action,
        resourceType: auditData.resourceType,
        resourceId: auditData.resourceId,
        userId: context.userId,
        workplaceId: context.workplaceId,
        riskLevel,
        complianceCategory,
        service: 'mtr-audit',
      });

      // Trigger alerts for high-risk activities
      if (riskLevel === 'critical' || riskLevel === 'high') {
        await this.triggerSecurityAlert(auditLog);
      }

      return auditLog;
    } catch (error: any) {
      logger.error('Failed to create audit log', {
        error: error?.message || 'Unknown error',
        context,
        auditData,
        service: 'mtr-audit',
      });
      throw error;
    }
  }

  /**
   * Log MTR session activities
   */
  static async logMTRActivity(
    context: AuditContext,
    action: string,
    session: any,
    oldValues?: any,
    newValues?: any
  ): Promise<IMTRAuditLog> {
    const changedFields =
      oldValues && newValues
        ? this.getChangedFields(oldValues, newValues)
        : undefined;

    return this.logActivity(context, {
      action,
      resourceType: 'MedicationTherapyReview',
      resourceId: session._id,
      patientId: session.patientId,
      reviewId: session._id,
      oldValues,
      newValues,
      changedFields,
      details: {
        reviewNumber: session.reviewNumber,
        status: session.status,
        priority: session.priority,
        reviewType: session.reviewType,
        completionPercentage: session.getCompletionPercentage?.() || 0,
      },
      complianceCategory: 'clinical_documentation',
    });
  }

  /**
   * Log patient data access
   */
  static async logPatientAccess(
    context: AuditContext,
    patientId: mongoose.Types.ObjectId,
    accessType: 'view' | 'edit' | 'create' | 'delete',
    details: any = {}
  ): Promise<IMTRAuditLog> {
    return this.logActivity(context, {
      action: `ACCESS_PATIENT_${accessType.toUpperCase()}`,
      resourceType: 'Patient',
      resourceId: patientId,
      patientId,
      details: {
        accessType,
        ...details,
      },
      complianceCategory: 'data_access',
      riskLevel: accessType === 'delete' ? 'high' : 'medium',
    });
  }

  /**
   * Log general events - simplified interface for backward compatibility
   */
  static async logEvent(
    context: AuditContext,
    eventData: {
      action: string;
      resourceType?: any;
      resourceId?: mongoose.Types.ObjectId;
      patientId?: mongoose.Types.ObjectId;
      details?: any;
      complianceCategory?: string;
      riskLevel?: string;
    }
  ): Promise<IMTRAuditLog> {
    return this.logActivity(context, {
      action: eventData.action,
      resourceType: eventData.resourceType || 'System',
      resourceId: eventData.resourceId || context.userId,
      patientId: eventData.patientId,
      details: eventData.details || {},
      complianceCategory: eventData.complianceCategory as any || 'system_security',
      riskLevel: eventData.riskLevel as any || 'low',
    });
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    context: Partial<AuditContext>,
    action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN',
    details: any = {}
  ): Promise<IMTRAuditLog | null> {
    if (!context.userId || !context.workplaceId) {
      // For failed logins, we might not have complete context
      logger.warn('Incomplete context for auth event', { action, context });
      return null;
    }

    return this.logActivity(context as AuditContext, {
      action,
      resourceType: 'User',
      resourceId: context.userId,
      details: {
        ...details,
        timestamp: new Date(),
      },
      complianceCategory: 'system_security',
      riskLevel: action === 'FAILED_LOGIN' ? 'medium' : 'low',
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    workplaceId: mongoose.Types.ObjectId,
    filters: {
      userId?: mongoose.Types.ObjectId;
      action?: string;
      resourceType?: string;
      complianceCategory?: string;
      riskLevel?: string;
      patientId?: mongoose.Types.ObjectId;
      reviewId?: mongoose.Types.ObjectId;
      startDate?: Date;
      endDate?: Date;
      ipAddress?: string;
    } = {},
    options: {
      page?: number;
      limit?: number;
      sort?: string;
    } = {}
  ): Promise<{ logs: IMTRAuditLog[]; total: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 1000); // Max 1000 records per request

    // Build query
    const query: any = { workplaceId };

    // Apply filters
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.complianceCategory)
      query.complianceCategory = filters.complianceCategory;
    if (filters.riskLevel) query.riskLevel = filters.riskLevel;
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.reviewId) query.reviewId = filters.reviewId;
    if (filters.ipAddress) query.ipAddress = filters.ipAddress;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    // Get total count
    const total = await MTRAuditLog.countDocuments(query);

    // Get paginated results
    const baseQuery = MTRAuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .populate('patientId', 'firstName lastName mrn')
      .populate('reviewId', 'reviewNumber status');

    // Apply sorting
    const sortBy = options.sort || '-timestamp';
    baseQuery.sort(sortBy);

    // Apply pagination
    if (page && limit) {
      const skip = (page - 1) * limit;
      baseQuery.skip(skip).limit(limit);
    }

    const logs = await baseQuery;

    return { logs, total };
  }

  /**
   * Export audit data for compliance
   */
  static async exportAuditData(
    workplaceId: mongoose.Types.ObjectId,
    options: ExportOptions
  ): Promise<{ data: any; filename: string; contentType: string }> {
    // Get audit logs based on filters
    const { logs } = await this.getAuditLogs(
      workplaceId,
      options.filters || {},
      {
        limit: 10000, // Large limit for export
        sort: '-timestamp',
      }
    );

    // Prepare data for export
    const exportData = logs.map((log) => {
      const baseData = {
        timestamp: log.timestamp,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        userId: log.userId,
        userRole: log.userRole,
        complianceCategory: log.complianceCategory,
        riskLevel: log.riskLevel,
        ipAddress: log.ipAddress,
        patientId: log.patientId,
        reviewId: log.reviewId,
      };

      if (options.includeDetails) {
        return {
          ...baseData,
          details: log.details,
          changedFields: log.changedFields,
          errorMessage: log.errorMessage,
          duration: log.duration,
        };
      }

      return baseData;
    });

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `mtr_audit_export_${dateStr}.${options.format}`;

    // Format data based on requested format
    switch (options.format) {
      case 'json':
        return {
          data: JSON.stringify(exportData, null, 2),
          filename,
          contentType: 'application/json',
        };

      case 'csv':
        const csvData = this.convertToCSV(exportData);
        return {
          data: csvData,
          filename,
          contentType: 'text/csv',
        };

      case 'pdf':
        // For PDF, return structured data that can be processed by a PDF generator
        return {
          data: {
            title: 'MTR Audit Trail Report',
            generatedAt: new Date(),
            dateRange: options.dateRange,
            filters: options.filters,
            logs: exportData,
            summary: await this.getAuditSummary(workplaceId, options.dateRange),
          },
          filename,
          contentType: 'application/pdf',
        };

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Get audit statistics and summary
   */
  static async getAuditSummary(
    workplaceId: mongoose.Types.ObjectId,
    dateRange?: { start: Date; end: Date }
  ): Promise<any> {
    // Get basic statistics
    const matchStage: any = { workplaceId };
    if (dateRange) {
      matchStage.timestamp = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const stats = await MTRAuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          errorCount: {
            $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalLogs: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          errorCount: 1,
          errorRate: {
            $cond: [
              { $gt: ['$totalLogs', 0] },
              { $multiply: [{ $divide: ['$errorCount', '$totalLogs'] }, 100] },
              0,
            ],
          },
        },
      },
    ]);

    const summary = stats[0] || {
      totalLogs: 0,
      uniqueUserCount: 0,
      errorCount: 0,
      errorRate: 0,
    };

    // Get high-risk activities count
    const highRiskCount = await MTRAuditLog.countDocuments({
      workplaceId,
      riskLevel: { $in: ['high', 'critical'] },
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // Get suspicious activities count (simplified)
    const suspiciousCount = await MTRAuditLog.countDocuments({
      workplaceId,
      errorMessage: { $ne: null },
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    return {
      ...summary,
      highRiskActivitiesCount: highRiskCount,
      suspiciousActivitiesCount: suspiciousCount,
      complianceScore: this.calculateComplianceScore(summary),
    };
  }

  /**
   * Get compliance report
   */
  static async getComplianceReport(
    workplaceId: mongoose.Types.ObjectId,
    dateRange: { start: Date; end: Date }
  ): Promise<any> {
    const summary = await this.getAuditSummary(workplaceId, dateRange);

    // Get high-risk activities (last 7 days)
    const highRiskActivities = await MTRAuditLog.find({
      workplaceId,
      riskLevel: { $in: ['high', 'critical'] },
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(10);

    // Get suspicious activities (simplified - high error rate users)
    const suspiciousActivities = await MTRAuditLog.aggregate([
      {
        $match: {
          workplaceId,
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: '$userId',
          actionCount: { $sum: 1 },
          errorCount: {
            $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
          },
        },
      },
      {
        $match: {
          $or: [{ actionCount: { $gt: 50 } }, { errorCount: { $gt: 5 } }],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $project: {
          userId: '$_id',
          actionCount: 1,
          errorCount: 1,
          errorRate: {
            $multiply: [{ $divide: ['$errorCount', '$actionCount'] }, 100],
          },
          user: { $arrayElemAt: ['$user', 0] },
        },
      },
      { $sort: { errorRate: -1 } },
      { $limit: 10 },
    ]);

    // Get compliance metrics by category
    const complianceMetrics = await MTRAuditLog.aggregate([
      {
        $match: {
          workplaceId,
          timestamp: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: '$complianceCategory',
          count: { $sum: 1 },
          riskDistribution: { $push: '$riskLevel' },
          errorCount: {
            $sum: { $cond: [{ $ne: ['$errorMessage', null] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      summary,
      complianceMetrics,
      highRiskActivities: highRiskActivities.slice(0, 10), // Top 10
      suspiciousActivities: suspiciousActivities.slice(0, 10), // Top 10
      recommendations: this.generateComplianceRecommendations(
        summary,
        complianceMetrics
      ),
    };
  }

  /**
   * Helper methods
   */
  private static determineComplianceCategory(
    action: string
  ):
    | 'clinical_documentation'
    | 'patient_safety'
    | 'data_access'
    | 'system_security'
    | 'workflow_compliance' {
    if (
      action.includes('MTR') ||
      action.includes('PROBLEM') ||
      action.includes('INTERVENTION')
    ) {
      return 'clinical_documentation';
    }
    if (action.includes('PATIENT') || action.includes('ACCESS')) {
      return 'data_access';
    }
    if (
      action.includes('LOGIN') ||
      action.includes('LOGOUT') ||
      action.includes('FAILED')
    ) {
      return 'system_security';
    }
    if (action.includes('WORKFLOW') || action.includes('STEP')) {
      return 'workflow_compliance';
    }
    return 'clinical_documentation';
  }

  private static determineRiskLevel(
    action: string,
    resourceType: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical risk actions
    if (action.includes('DELETE') || action.includes('FAILED_LOGIN')) {
      return 'critical';
    }

    // High risk actions
    if (
      action.includes('EXPORT') ||
      action.includes('BULK') ||
      resourceType === 'Patient'
    ) {
      return 'high';
    }

    // Medium risk actions
    if (action.includes('UPDATE') || action.includes('CREATE')) {
      return 'medium';
    }

    // Low risk actions (READ operations)
    return 'low';
  }

  private static getChangedFields(oldValues: any, newValues: any): string[] {
    const changedFields: string[] = [];

    if (!oldValues || !newValues) return changedFields;

    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues),
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  private static convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  private static calculateComplianceScore(stats: any): number {
    // Simple compliance score calculation
    // In production, this would be more sophisticated
    const baseScore = 100;
    const errorPenalty = Math.min(stats.errorRate * 2, 50); // Max 50 point penalty
    const riskPenalty =
      stats.riskDistribution?.filter((r: string) => r === 'critical').length *
      5;

    return Math.max(0, baseScore - errorPenalty - riskPenalty);
  }

  private static generateComplianceRecommendations(
    summary: any,
    metrics: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (summary.errorRate > 5) {
      recommendations.push(
        'High error rate detected. Review system processes and user training.'
      );
    }

    if (summary.highRiskActivitiesCount > 10) {
      recommendations.push(
        'Elevated high-risk activities. Consider implementing additional security measures.'
      );
    }

    if (summary.suspiciousActivitiesCount > 0) {
      recommendations.push(
        'Suspicious activities detected. Investigate user access patterns.'
      );
    }

    const clinicalMetric = metrics.find(
      (m) => m._id === 'clinical_documentation'
    );
    if (
      clinicalMetric &&
      clinicalMetric.errorCount > clinicalMetric.count * 0.1
    ) {
      recommendations.push(
        'High error rate in clinical documentation. Review MTR workflow training.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Compliance metrics are within acceptable ranges. Continue monitoring.'
      );
    }

    return recommendations;
  }

  private static async triggerSecurityAlert(
    auditLog: IMTRAuditLog
  ): Promise<void> {
    // Log security alert
    logger.warn('High-risk activity detected', {
      auditId: auditLog._id,
      action: auditLog.action,
      userId: auditLog.userId,
      workplaceId: auditLog.workplaceId,
      riskLevel: auditLog.riskLevel,
      service: 'mtr-security',
    });

    // In production, you might:
    // 1. Send email/SMS alerts to administrators
    // 2. Create security incident tickets
    // 3. Trigger automated security responses
    // 4. Update user risk scores
  }

  /**
   * Create audit context from Express request
   */
  static createAuditContext(req: any): AuditContext {
    return {
      userId: req.user?.id || req.user?._id,
      workplaceId: req.user?.workplaceId || req.workplace?.id,
      userRole: req.user?.role || 'unknown',
      sessionId: req.sessionID,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
    };
  }
}

export default AuditService;
