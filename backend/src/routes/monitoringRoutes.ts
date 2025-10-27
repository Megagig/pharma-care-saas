/**
 * Monitoring Dashboard Routes
 * Provides comprehensive monitoring data for patient engagement operations
 * Requirements: 9.1, 9.2, 9.3
 */

import express from 'express';
import { patientEngagementMonitoring } from '../services/PatientEngagementMonitoringService';
import { performanceCollector } from '../utils/performanceMonitoring';
import { authenticateToken } from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/rbacMiddleware';
import logger from '../utils/logger';

const router = express.Router();

// Apply authentication to all monitoring routes
router.use(authenticateToken);

/**
 * Get monitoring dashboard data
 * GET /api/monitoring/dashboard
 */
router.get('/dashboard', checkPermission('view_analytics'), async (req, res) => {
  try {
    const startTime = req.query.startTime 
      ? new Date(req.query.startTime as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    const endTime = req.query.endTime 
      ? new Date(req.query.endTime as string)
      : new Date();
    const workplaceId = req.user?.workplaceId?.toString();

    const dashboardData = await patientEngagementMonitoring.getDashboardData(
      startTime,
      endTime,
      workplaceId
    );

    res.json({
      success: true,
      data: dashboardData,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Dashboard data retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get operation-specific metrics
 * GET /api/monitoring/operations/:module/:operation
 */
router.get('/operations/:module/:operation', checkPermission('view_analytics'), async (req, res) => {
  try {
    const { module, operation } = req.params;
    const startTime = req.query.startTime 
      ? new Date(req.query.startTime as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = req.query.endTime 
      ? new Date(req.query.endTime as string)
      : new Date();
    const workplaceId = req.user?.workplaceId?.toString();

    // Validate module
    const validModules = ['appointment', 'followup', 'reminder', 'schedule', 'integration'];
    if (!validModules.includes(module)) {
      return res.status(400).json({
        success: false,
        error: `Invalid module. Must be one of: ${validModules.join(', ')}`,
      });
    }

    const metrics = patientEngagementMonitoring.getOperationMetrics(
      operation,
      module as any,
      startTime,
      endTime,
      workplaceId
    );

    res.json({
      success: true,
      data: {
        module,
        operation,
        metrics,
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Operation metrics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get performance trends
 * GET /api/monitoring/trends
 */
router.get('/trends', checkPermission('view_analytics'), async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const workplaceId = req.user?.workplaceId?.toString();
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

    // Get daily metrics for the time period
    const dailyMetrics = [];
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startTime.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayData = await patientEngagementMonitoring.getDashboardData(
        dayStart,
        dayEnd,
        workplaceId
      );

      dailyMetrics.push({
        date: dayStart.toISOString().split('T')[0],
        ...dayData.summary,
        operationMetrics: dayData.operationMetrics,
      });
    }

    res.json({
      success: true,
      data: {
        trends: dailyMetrics,
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          days,
        },
      },
    });
  } catch (error) {
    logger.error('Trends retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get real-time metrics
 * GET /api/monitoring/realtime
 */
router.get('/realtime', checkPermission('view_analytics'), async (req, res) => {
  try {
    const workplaceId = req.user?.workplaceId?.toString();
    
    // Get metrics for the last hour
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);

    const realtimeData = await patientEngagementMonitoring.getDashboardData(
      startTime,
      endTime,
      workplaceId
    );

    // Get system metrics
    const memUsage = process.memoryUsage();
    const systemMetrics = {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        ...realtimeData,
        systemMetrics,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Real-time metrics retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get error analysis with detailed breakdown
 * GET /api/monitoring/errors/analysis
 */
router.get('/errors/analysis', checkPermission('view_analytics'), async (req, res) => {
  try {
    const startTime = req.query.startTime 
      ? new Date(req.query.startTime as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = req.query.endTime 
      ? new Date(req.query.endTime as string)
      : new Date();
    const workplaceId = req.user?.workplaceId?.toString();

    const errorAnalysis = patientEngagementMonitoring.getErrorAnalysis(
      startTime,
      endTime,
      workplaceId
    );

    // Get error trends (hourly breakdown)
    const hourlyErrors = [];
    const hours = Math.ceil((endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000));
    
    for (let i = 0; i < Math.min(hours, 24); i++) {
      const hourStart = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourErrors = patientEngagementMonitoring.getErrorAnalysis(
        hourStart,
        hourEnd,
        workplaceId
      );

      hourlyErrors.push({
        hour: hourStart.toISOString(),
        totalErrors: hourErrors.totalErrors,
        errorsByType: hourErrors.errorsByType,
      });
    }

    res.json({
      success: true,
      data: {
        ...errorAnalysis,
        hourlyTrends: hourlyErrors,
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        },
      },
    });
  } catch (error) {
    logger.error('Error analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get performance benchmarks
 * GET /api/monitoring/benchmarks
 */
router.get('/benchmarks', checkPermission('view_analytics'), async (req, res) => {
  try {
    const workplaceId = req.user?.workplaceId?.toString();
    
    // Define performance benchmarks
    const benchmarks = {
      appointment: {
        create: { target: 2000, warning: 3000, critical: 5000 }, // ms
        update: { target: 1500, warning: 2500, critical: 4000 },
        get: { target: 500, warning: 1000, critical: 2000 },
        list: { target: 1000, warning: 2000, critical: 3000 },
      },
      followup: {
        create: { target: 1500, warning: 2500, critical: 4000 },
        complete: { target: 1000, warning: 2000, critical: 3000 },
        get: { target: 500, warning: 1000, critical: 2000 },
        list: { target: 1000, warning: 2000, critical: 3000 },
      },
      reminder: {
        send: { target: 3000, warning: 5000, critical: 8000 },
        schedule: { target: 1000, warning: 2000, critical: 3000 },
      },
    };

    // Get current performance for comparison
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
    
    const currentMetrics = await patientEngagementMonitoring.getDashboardData(
      startTime,
      endTime,
      workplaceId
    );

    // Compare against benchmarks
    const comparison = {
      appointments: {
        averageResponseTime: currentMetrics.operationMetrics.appointments.averageResponseTime,
        p95ResponseTime: currentMetrics.operationMetrics.appointments.p95ResponseTime,
        status: getBenchmarkStatus(
          currentMetrics.operationMetrics.appointments.averageResponseTime,
          benchmarks.appointment.create
        ),
      },
      followUps: {
        averageResponseTime: currentMetrics.operationMetrics.followUps.averageResponseTime,
        p95ResponseTime: currentMetrics.operationMetrics.followUps.p95ResponseTime,
        status: getBenchmarkStatus(
          currentMetrics.operationMetrics.followUps.averageResponseTime,
          benchmarks.followup.create
        ),
      },
      reminders: {
        averageResponseTime: currentMetrics.operationMetrics.reminders.averageResponseTime,
        p95ResponseTime: currentMetrics.operationMetrics.reminders.p95ResponseTime,
        status: getBenchmarkStatus(
          currentMetrics.operationMetrics.reminders.averageResponseTime,
          benchmarks.reminder.send
        ),
      },
    };

    res.json({
      success: true,
      data: {
        benchmarks,
        currentPerformance: comparison,
        recommendations: generatePerformanceRecommendations(comparison, benchmarks),
      },
    });
  } catch (error) {
    logger.error('Benchmarks retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Export monitoring data
 * GET /api/monitoring/export
 */
router.get('/export', checkPermission('view_analytics'), async (req, res) => {
  try {
    const format = req.query.format as string || 'json';
    const startTime = req.query.startTime 
      ? new Date(req.query.startTime as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const endTime = req.query.endTime 
      ? new Date(req.query.endTime as string)
      : new Date();
    const workplaceId = req.user?.workplaceId?.toString();

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        },
        workplaceId,
        format,
      },
      dashboard: await patientEngagementMonitoring.getDashboardData(startTime, endTime, workplaceId),
      errorAnalysis: patientEngagementMonitoring.getErrorAnalysis(startTime, endTime, workplaceId),
      performanceReport: performanceCollector.generatePerformanceReport(startTime, endTime),
    };

    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=monitoring-export.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=monitoring-export.json');
      res.json(exportData);
    }
  } catch (error) {
    logger.error('Export failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Helper functions
 */
function getBenchmarkStatus(
  value: number,
  benchmark: { target: number; warning: number; critical: number }
): 'good' | 'warning' | 'critical' {
  if (value <= benchmark.target) return 'good';
  if (value <= benchmark.warning) return 'warning';
  return 'critical';
}

function generatePerformanceRecommendations(
  performance: any,
  benchmarks: any
): string[] {
  const recommendations: string[] = [];

  Object.entries(performance).forEach(([module, metrics]: [string, any]) => {
    if (metrics.status === 'critical') {
      recommendations.push(
        `Critical: ${module} performance is severely degraded (${metrics.averageResponseTime}ms). Immediate investigation required.`
      );
    } else if (metrics.status === 'warning') {
      recommendations.push(
        `Warning: ${module} performance is below target (${metrics.averageResponseTime}ms). Consider optimization.`
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('All services are performing within acceptable limits.');
  }

  return recommendations;
}

function convertToCSV(data: any): string {
  // Simplified CSV conversion - in production, use a proper CSV library
  const rows = [
    ['Metric', 'Value', 'Timestamp'],
    ['Total Operations', data.dashboard.summary.totalOperations, data.metadata.exportedAt],
    ['Success Rate', data.dashboard.summary.successRate + '%', data.metadata.exportedAt],
    ['Average Response Time', data.dashboard.summary.averageResponseTime + 'ms', data.metadata.exportedAt],
    ['Active Alerts', data.dashboard.summary.activeAlerts, data.metadata.exportedAt],
    ['Health Status', data.dashboard.summary.healthStatus, data.metadata.exportedAt],
  ];

  return rows.map(row => row.join(',')).join('\n');
}

export default router;