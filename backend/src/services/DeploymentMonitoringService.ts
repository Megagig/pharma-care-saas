/**
 * Deployment Monitoring Service
 * 
 * Provides real-time monitoring during deployment with automated rollback triggers
 */

import { EventEmitter } from 'events';
import logger from '../utils/logger';
import { WebVitalsService } from './WebVitalsService';
import { performanceAlertService } from './PerformanceAlertService';
import FeatureFlagService from './FeatureFlagService';

export interface DeploymentMetrics {
  timestamp: Date;
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  webVitals: {
    FCP: number;
    LCP: number;
    CLS: number;
    TTFB: number;
    FID: number;
  };
  apiLatency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  throughput: number;
  activeUsers: number;
  featureFlagMetrics: any[];
}

export interface DeploymentThresholds {
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  webVitals: {
    FCP: number;
    LCP: number;
    CLS: number;
    TTFB: number;
    FID: number;
  };
  apiLatency: {
    p95: number;
    maxIncrease: number; // percentage
  };
  errorRate: number;
  throughputDecrease: number; // percentage
}

export interface RollbackTrigger {
  type: 'performance' | 'error_rate' | 'api_latency' | 'user_complaints';
  threshold: number;
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeploymentStatus {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'starting' | 'monitoring' | 'validating' | 'success' | 'failed' | 'rolled_back';
  rolloutPercentage: number;
  metrics: DeploymentMetrics[];
  alerts: any[];
  rollbackTriggers: RollbackTrigger[];
  rollbackExecuted: boolean;
}

class DeploymentMonitoringService extends EventEmitter {
  private activeDeployments = new Map<string, DeploymentStatus>();
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private rollbackTimeouts = new Map<string, NodeJS.Timeout>();

  private defaultThresholds: DeploymentThresholds = {
    lighthouse: {
      performance: 85,
      accessibility: 90,
      bestPractices: 90,
      seo: 90,
    },
    webVitals: {
      FCP: 2000,
      LCP: 3000,
      CLS: 0.15,
      TTFB: 1000,
      FID: 200,
    },
    apiLatency: {
      p95: 1000,
      maxIncrease: 50, // 50% increase threshold
    },
    errorRate: 5, // 5% error rate threshold
    throughputDecrease: 30, // 30% throughput decrease threshold
  };

  /**
   * Start deployment monitoring
   */
  async startDeploymentMonitoring(
    deploymentId: string,
    rolloutPercentage: number,
    thresholds?: Partial<DeploymentThresholds>
  ): Promise<void> {
    logger.info(`Starting deployment monitoring for ${deploymentId} with ${rolloutPercentage}% rollout`);

    const deployment: DeploymentStatus = {
      id: deploymentId,
      startTime: new Date(),
      status: 'starting',
      rolloutPercentage,
      metrics: [],
      alerts: [],
      rollbackTriggers: [],
      rollbackExecuted: false,
    };

    this.activeDeployments.set(deploymentId, deployment);

    // Merge thresholds with defaults
    const finalThresholds = {
      ...this.defaultThresholds,
      ...thresholds,
    };

    // Start monitoring interval
    const monitoringInterval = setInterval(async () => {
      await this.collectMetrics(deploymentId, finalThresholds);
    }, 30000); // Every 30 seconds

    this.monitoringIntervals.set(deploymentId, monitoringInterval);

    // Set rollback timeout (auto-rollback after 30 minutes if issues persist)
    const rollbackTimeout = setTimeout(async () => {
      await this.executeRollback(deploymentId, 'timeout', 'Deployment monitoring timeout reached');
    }, 30 * 60 * 1000); // 30 minutes

    this.rollbackTimeouts.set(deploymentId, rollbackTimeout);

    // Update status
    deployment.status = 'monitoring';
    this.emit('deploymentStarted', deployment);
  }

  /**
   * Collect performance metrics during deployment
   */
  private async collectMetrics(
    deploymentId: string,
    thresholds: DeploymentThresholds
  ): Promise<void> {
    try {
      const deployment = this.activeDeployments.get(deploymentId);
      if (!deployment || deployment.rollbackExecuted) {
        return;
      }

      // Collect current metrics
      const metrics = await this.getCurrentMetrics();
      deployment.metrics.push(metrics);

      // Keep only last 100 metrics to prevent memory issues
      if (deployment.metrics.length > 100) {
        deployment.metrics = deployment.metrics.slice(-100);
      }

      // Check thresholds and trigger rollback if needed
      await this.checkThresholds(deploymentId, metrics, thresholds);

      this.emit('metricsCollected', { deploymentId, metrics });

    } catch (error) {
      logger.error(`Error collecting metrics for deployment ${deploymentId}:`, error);
    }
  }

  /**
   * Get current performance metrics
   */
  private async getCurrentMetrics(): Promise<DeploymentMetrics> {
    // This would integrate with your actual monitoring systems
    // For now, we'll simulate the data structure

    return {
      timestamp: new Date(),
      lighthouse: {
        performance: await this.getLighthouseScore(),
        accessibility: 95,
        bestPractices: 92,
        seo: 98,
      },
      webVitals: await this.getWebVitalsMetrics(),
      apiLatency: await this.getAPILatencyMetrics(),
      errorRate: await this.getErrorRate(),
      throughput: await this.getThroughput(),
      activeUsers: await this.getActiveUsers(),
      featureFlagMetrics: FeatureFlagService.getMetrics(),
    };
  }

  /**
   * Get Lighthouse performance score
   */
  private async getLighthouseScore(): Promise<number> {
    try {
      // This would run Lighthouse programmatically
      // For now, return a simulated score
      return 88 + Math.random() * 10; // 88-98 range
    } catch (error) {
      logger.error('Error getting Lighthouse score:', error);
      return 0;
    }
  }

  /**
   * Get Web Vitals metrics
   */
  private async getWebVitalsMetrics(): Promise<DeploymentMetrics['webVitals']> {
    try {
      // TODO: Implement WebVitalsService.getRecentMetrics method
      // const recentMetrics = await WebVitalsService.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes

      // Return default values for now
      return {
        FCP: 0,
        LCP: 0,
        CLS: 0,
        TTFB: 0,
        FID: 0,
      };
    } catch (error) {
      logger.error('Error getting Web Vitals metrics:', error);
      return {
        FCP: 0,
        LCP: 0,
        CLS: 0,
        TTFB: 0,
        FID: 0,
      };
    }
  }

  /**
   * Get API latency metrics
   */
  private async getAPILatencyMetrics(): Promise<DeploymentMetrics['apiLatency']> {
    try {
      // This would query your API monitoring system
      // For now, simulate realistic values
      const baseLatency = 200 + Math.random() * 300; // 200-500ms base

      return {
        p50: baseLatency,
        p95: baseLatency * 2.5,
        p99: baseLatency * 4,
      };
    } catch (error) {
      logger.error('Error getting API latency metrics:', error);
      return {
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }
  }

  /**
   * Get error rate
   */
  private async getErrorRate(): Promise<number> {
    try {
      // This would query your error tracking system
      // For now, simulate a low error rate
      return Math.random() * 2; // 0-2% error rate
    } catch (error) {
      logger.error('Error getting error rate:', error);
      return 0;
    }
  }

  /**
   * Get throughput (requests per second)
   */
  private async getThroughput(): Promise<number> {
    try {
      // This would query your monitoring system
      // For now, simulate realistic throughput
      return 50 + Math.random() * 100; // 50-150 RPS
    } catch (error) {
      logger.error('Error getting throughput:', error);
      return 0;
    }
  }

  /**
   * Get active users count
   */
  private async getActiveUsers(): Promise<number> {
    try {
      // This would query your analytics system
      // For now, simulate active users
      return Math.floor(100 + Math.random() * 500); // 100-600 active users
    } catch (error) {
      logger.error('Error getting active users:', error);
      return 0;
    }
  }

  /**
   * Check performance thresholds and trigger rollback if needed
   */
  private async checkThresholds(
    deploymentId: string,
    metrics: DeploymentMetrics,
    thresholds: DeploymentThresholds
  ): Promise<void> {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) return;

    const violations: RollbackTrigger[] = [];

    // Check Lighthouse performance
    if (metrics.lighthouse.performance < thresholds.lighthouse.performance) {
      violations.push({
        type: 'performance',
        threshold: thresholds.lighthouse.performance,
        duration: 0,
        severity: 'high',
      });
    }

    // Check Web Vitals
    if (metrics.webVitals.LCP > thresholds.webVitals.LCP) {
      violations.push({
        type: 'performance',
        threshold: thresholds.webVitals.LCP,
        duration: 0,
        severity: 'medium',
      });
    }

    if (metrics.webVitals.CLS > thresholds.webVitals.CLS) {
      violations.push({
        type: 'performance',
        threshold: thresholds.webVitals.CLS,
        duration: 0,
        severity: 'medium',
      });
    }

    // Check API latency
    if (metrics.apiLatency.p95 > thresholds.apiLatency.p95) {
      violations.push({
        type: 'api_latency',
        threshold: thresholds.apiLatency.p95,
        duration: 0,
        severity: 'high',
      });
    }

    // Check error rate
    if (metrics.errorRate > thresholds.errorRate) {
      violations.push({
        type: 'error_rate',
        threshold: thresholds.errorRate,
        duration: 0,
        severity: 'critical',
      });
    }

    // Add violations to deployment
    deployment.rollbackTriggers.push(...violations);

    // Check if we should trigger rollback
    const criticalViolations = violations.filter(v => v.severity === 'critical');
    const highViolations = violations.filter(v => v.severity === 'high');

    if (criticalViolations.length > 0) {
      await this.executeRollback(
        deploymentId,
        'critical_threshold',
        `Critical performance violations detected: ${criticalViolations.map(v => v.type).join(', ')}`
      );
    } else if (highViolations.length >= 2) {
      await this.executeRollback(
        deploymentId,
        'multiple_high_violations',
        `Multiple high-severity violations detected: ${highViolations.map(v => v.type).join(', ')}`
      );
    }

    // Send alerts for violations
    if (violations.length > 0) {
      await performanceAlertService.sendAlert({
        type: 'regression_detected',
        severity: violations.some(v => v.severity === 'critical') ? 'critical' : 'high',
        metric: 'deployment_threshold_violation',
        value: violations.length,
        url: `deployment/${deploymentId}`,
        timestamp: new Date(),
        additionalData: {
          deploymentId,
          violations,
          metrics,
        },
      });
    }
  }

  /**
   * Execute rollback
   */
  private async executeRollback(
    deploymentId: string,
    reason: string,
    message: string
  ): Promise<void> {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment || deployment.rollbackExecuted) {
      return;
    }

    logger.error(`Executing rollback for deployment ${deploymentId}: ${reason} - ${message}`);

    deployment.rollbackExecuted = true;
    deployment.status = 'rolled_back';
    deployment.endTime = new Date();

    try {
      // Stop monitoring
      this.stopMonitoring(deploymentId);

      // Disable all performance features
      const performanceFeatures = [
        'themeOptimization',
        'bundleOptimization',
        'apiCaching',
        'databaseOptimization',
        'cursorPagination',
        'backgroundJobs',
        'serviceWorker',
        'virtualization',
        'reactQueryOptimization',
      ];

      for (const feature of performanceFeatures) {
        // Set global rollout to 0%
        process.env[`FEATURE_${feature.toUpperCase()}`] = 'false';
        process.env.FEATURE_ROLLOUT_PERCENTAGE = '0';
      }

      // Clear feature flag cache
      FeatureFlagService.clearCache();

      // Send rollback notification
      await performanceAlertService.sendAlert({
        type: 'regression_detected',
        severity: 'critical',
        metric: 'deployment_rollback',
        value: 1,
        url: `deployment/${deploymentId}`,
        timestamp: new Date(),
        additionalData: {
          deploymentId,
          reason,
          message,
          rollbackTime: new Date(),
        },
      });

      this.emit('deploymentRolledBack', { deploymentId, reason, message });

      logger.info(`Rollback completed for deployment ${deploymentId}`);

    } catch (error) {
      logger.error(`Error during rollback for deployment ${deploymentId}:`, error);

      await performanceAlertService.sendAlert({
        type: 'regression_detected',
        severity: 'critical',
        metric: 'rollback_failed',
        value: 1,
        url: `deployment/${deploymentId}`,
        timestamp: new Date(),
        additionalData: {
          deploymentId,
          error: error.message,
        },
      });
    }
  }

  /**
   * Complete deployment monitoring (success)
   */
  async completeDeployment(deploymentId: string): Promise<void> {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    deployment.status = 'success';
    deployment.endTime = new Date();

    this.stopMonitoring(deploymentId);

    logger.info(`Deployment ${deploymentId} completed successfully`);
    this.emit('deploymentCompleted', deployment);

    // Send success notification
    await performanceAlertService.sendAlert({
      type: 'performance_budget_exceeded',
      severity: 'low',
      metric: 'deployment_success',
      value: deployment.rolloutPercentage,
      url: `deployment/${deploymentId}`,
      timestamp: new Date(),
      additionalData: {
        deploymentId,
        rolloutPercentage: deployment.rolloutPercentage,
        duration: deployment.endTime.getTime() - deployment.startTime.getTime(),
        metricsCount: deployment.metrics.length,
      },
    });
  }

  /**
   * Stop monitoring for a deployment
   */
  private stopMonitoring(deploymentId: string): void {
    // Clear monitoring interval
    const interval = this.monitoringIntervals.get(deploymentId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(deploymentId);
    }

    // Clear rollback timeout
    const timeout = this.rollbackTimeouts.get(deploymentId);
    if (timeout) {
      clearTimeout(timeout);
      this.rollbackTimeouts.delete(deploymentId);
    }
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(deploymentId: string): DeploymentStatus | null {
    return this.activeDeployments.get(deploymentId) || null;
  }

  /**
   * Get all active deployments
   */
  getActiveDeployments(): DeploymentStatus[] {
    return Array.from(this.activeDeployments.values());
  }

  /**
   * Force rollback (manual trigger)
   */
  async forceRollback(deploymentId: string, reason: string): Promise<void> {
    await this.executeRollback(deploymentId, 'manual', reason);
  }

  /**
   * Update rollout percentage during deployment
   */
  async updateRolloutPercentage(deploymentId: string, newPercentage: number): Promise<void> {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (newPercentage < 0 || newPercentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    const oldPercentage = deployment.rolloutPercentage;
    deployment.rolloutPercentage = newPercentage;

    // Update environment variable
    process.env.FEATURE_ROLLOUT_PERCENTAGE = newPercentage.toString();

    // Clear feature flag cache to apply new percentage
    FeatureFlagService.clearCache();

    logger.info(`Updated rollout percentage for deployment ${deploymentId}: ${oldPercentage}% -> ${newPercentage}%`);
    this.emit('rolloutUpdated', { deploymentId, oldPercentage, newPercentage });

    // Send notification
    await performanceAlertService.sendAlert({
      type: 'performance_budget_exceeded',
      severity: 'low',
      metric: 'rollout_updated',
      value: newPercentage,
      url: `deployment/${deploymentId}`,
      timestamp: new Date(),
      additionalData: {
        deploymentId,
        oldPercentage,
        newPercentage,
      },
    });
  }

  /**
   * Cleanup completed deployments
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [deploymentId, deployment] of this.activeDeployments.entries()) {
      if (deployment.endTime && (now - deployment.endTime.getTime()) > maxAge) {
        this.activeDeployments.delete(deploymentId);
        this.stopMonitoring(deploymentId);
        logger.info(`Cleaned up old deployment: ${deploymentId}`);
      }
    }
  }
}

export default new DeploymentMonitoringService();