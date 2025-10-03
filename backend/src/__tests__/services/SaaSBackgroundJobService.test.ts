import { SaaSBackgroundJobService } from '../../services/SaaSBackgroundJobService';
import { BackgroundJobService } from '../../services/BackgroundJobService';
import { RedisCacheService } from '../../services/RedisCacheService';

// Mock dependencies
jest.mock('../../services/BackgroundJobService');
jest.mock('../../services/RedisCacheService');
jest.mock('../../utils/logger');

describe('SaaSBackgroundJobService', () => {
  let service: SaaSBackgroundJobService;
  let mockBaseJobService: jest.Mocked<BackgroundJobService>;
  let mockCacheService: jest.Mocked<RedisCacheService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBaseJobService = {
      addJob: jest.fn(),
      getJobStatus: jest.fn(),
      cancelJob: jest.fn(),
      getQueueStats: jest.fn(),
      processJob: jest.fn(),
    } as any;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    } as any;

    (BackgroundJobService.getInstance as jest.Mock).mockReturnValue(mockBaseJobService);
    (RedisCacheService.getInstance as jest.Mock).mockReturnValue(mockCacheService);

    service = SaaSBackgroundJobService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SaaSBackgroundJobService.getInstance();
      const instance2 = SaaSBackgroundJobService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('scheduleTenantAnalyticsJob', () => {
    it('should schedule tenant analytics job successfully', async () => {
      const tenantId = 'tenant123';
      const jobId = 'job123';

      mockBaseJobService.addJob.mockResolvedValue(jobId);

      const result = await service.scheduleTenantAnalyticsJob(tenantId);

      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'tenant-analytics',
        { tenantId, type: 'analytics-generation' },
        {
          priority: 5,
          delay: 0,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        }
      );
      expect(result).toBe(jobId);
    });

    it('should handle job scheduling errors', async () => {
      const tenantId = 'tenant123';
      mockBaseJobService.addJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.scheduleTenantAnalyticsJob(tenantId)).rejects.toThrow('Failed to schedule tenant analytics job');
    });
  });

  describe('scheduleSystemMetricsJob', () => {
    it('should schedule system metrics job successfully', async () => {
      const jobId = 'job123';
      mockBaseJobService.addJob.mockResolvedValue(jobId);

      const result = await service.scheduleSystemMetricsJob();

      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'system-metrics',
        { type: 'system-metrics-collection' },
        {
          priority: 3,
          repeat: { cron: '*/5 * * * *' },
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 }
        }
      );
      expect(result).toBe(jobId);
    });

    it('should handle job scheduling errors', async () => {
      mockBaseJobService.addJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.scheduleSystemMetricsJob()).rejects.toThrow('Failed to schedule system metrics job');
    });
  });

  describe('scheduleNotificationJob', () => {
    it('should schedule notification job successfully', async () => {
      const notificationData = {
        userId: 'user123',
        tenantId: 'tenant123',
        type: 'email',
        template: 'welcome',
        data: { name: 'John Doe' }
      };
      const jobId = 'job123';

      mockBaseJobService.addJob.mockResolvedValue(jobId);

      const result = await service.scheduleNotificationJob(notificationData);

      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'notification',
        notificationData,
        {
          priority: 7,
          delay: 0,
          attempts: 3,
          backoff: { type: 'fixed', delay: 5000 }
        }
      );
      expect(result).toBe(jobId);
    });

    it('should schedule delayed notification', async () => {
      const notificationData = {
        userId: 'user123',
        tenantId: 'tenant123',
        type: 'email',
        template: 'reminder',
        data: {}
      };
      const delay = 60000; // 1 minute
      const jobId = 'job123';

      mockBaseJobService.addJob.mockResolvedValue(jobId);

      const result = await service.scheduleNotificationJob(notificationData, delay);

      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'notification',
        notificationData,
        {
          priority: 7,
          delay: 60000,
          attempts: 3,
          backoff: { type: 'fixed', delay: 5000 }
        }
      );
      expect(result).toBe(jobId);
    });

    it('should handle notification job scheduling errors', async () => {
      const notificationData = {
        userId: 'user123',
        tenantId: 'tenant123',
        type: 'email',
        template: 'test',
        data: {}
      };

      mockBaseJobService.addJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.scheduleNotificationJob(notificationData)).rejects.toThrow('Failed to schedule notification job');
    });
  });

  describe('scheduleBillingJob', () => {
    it('should schedule billing job successfully', async () => {
      const billingData = {
        tenantId: 'tenant123',
        subscriptionId: 'sub123',
        action: 'invoice_generation',
        amount: 99.99
      };
      const jobId = 'job123';

      mockBaseJobService.addJob.mockResolvedValue(jobId);

      const result = await service.scheduleBillingJob(billingData);

      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'billing',
        billingData,
        {
          priority: 8,
          delay: 0,
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 }
        }
      );
      expect(result).toBe(jobId);
    });

    it('should handle billing job scheduling errors', async () => {
      const billingData = {
        tenantId: 'tenant123',
        subscriptionId: 'sub123',
        action: 'payment_processing',
        amount: 99.99
      };

      mockBaseJobService.addJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.scheduleBillingJob(billingData)).rejects.toThrow('Failed to schedule billing job');
    });
  });

  describe('scheduleDataExportJob', () => {
    it('should schedule data export job successfully', async () => {
      const exportData = {
        tenantId: 'tenant123',
        userId: 'user123',
        exportType: 'user_data',
        format: 'json',
        filters: {}
      };
      const jobId = 'job123';

      mockBaseJobService.addJob.mockResolvedValue(jobId);

      const result = await service.scheduleDataExportJob(exportData);

      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'data-export',
        exportData,
        {
          priority: 4,
          delay: 0,
          attempts: 3,
          backoff: { type: 'fixed', delay: 10000 },
          timeout: 30 * 60 * 1000 // 30 minutes
        }
      );
      expect(result).toBe(jobId);
    });

    it('should handle data export job scheduling errors', async () => {
      const exportData = {
        tenantId: 'tenant123',
        userId: 'user123',
        exportType: 'analytics',
        format: 'csv',
        filters: {}
      };

      mockBaseJobService.addJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.scheduleDataExportJob(exportData)).rejects.toThrow('Failed to schedule data export job');
    });
  });

  describe('scheduleMaintenanceJob', () => {
    it('should schedule maintenance job successfully', async () => {
      const maintenanceData = {
        type: 'database_cleanup',
        targetDate: new Date('2024-12-31'),
        parameters: { retentionDays: 90 }
      };
      const jobId = 'job123';

      mockBaseJobService.addJob.mockResolvedValue(jobId);

      const result = await service.scheduleMaintenanceJob(maintenanceData);

      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'maintenance',
        maintenanceData,
        {
          priority: 2,
          delay: expect.any(Number),
          attempts: 2,
          backoff: { type: 'fixed', delay: 60000 }
        }
      );
      expect(result).toBe(jobId);
    });

    it('should handle maintenance job scheduling errors', async () => {
      const maintenanceData = {
        type: 'cache_cleanup',
        targetDate: new Date(),
        parameters: {}
      };

      mockBaseJobService.addJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.scheduleMaintenanceJob(maintenanceData)).rejects.toThrow('Failed to schedule maintenance job');
    });
  });

  describe('getJobStatus', () => {
    it('should return job status successfully', async () => {
      const jobId = 'job123';
      const jobStatus = {
        id: jobId,
        status: 'completed',
        progress: 100,
        result: { success: true }
      };

      mockBaseJobService.getJobStatus.mockResolvedValue(jobStatus);

      const result = await service.getJobStatus(jobId);

      expect(mockBaseJobService.getJobStatus).toHaveBeenCalledWith(jobId);
      expect(result).toEqual(jobStatus);
    });

    it('should handle job status retrieval errors', async () => {
      const jobId = 'job123';
      mockBaseJobService.getJobStatus.mockRejectedValue(new Error('Job not found'));

      await expect(service.getJobStatus(jobId)).rejects.toThrow('Failed to get job status');
    });
  });

  describe('cancelJob', () => {
    it('should cancel job successfully', async () => {
      const jobId = 'job123';
      mockBaseJobService.cancelJob.mockResolvedValue(true);

      const result = await service.cancelJob(jobId);

      expect(mockBaseJobService.cancelJob).toHaveBeenCalledWith(jobId);
      expect(result).toBe(true);
    });

    it('should handle job cancellation errors', async () => {
      const jobId = 'job123';
      mockBaseJobService.cancelJob.mockRejectedValue(new Error('Job not found'));

      await expect(service.cancelJob(jobId)).rejects.toThrow('Failed to cancel job');
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics successfully', async () => {
      const queueStats = {
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1
      };

      mockBaseJobService.getQueueStats.mockResolvedValue(queueStats);

      const result = await service.getQueueStats();

      expect(mockBaseJobService.getQueueStats).toHaveBeenCalled();
      expect(result).toEqual(queueStats);
    });

    it('should handle queue stats retrieval errors', async () => {
      mockBaseJobService.getQueueStats.mockRejectedValue(new Error('Queue error'));

      await expect(service.getQueueStats()).rejects.toThrow('Failed to get queue statistics');
    });
  });

  describe('getTenantJobHistory', () => {
    it('should return cached job history if available', async () => {
      const tenantId = 'tenant123';
      const cachedHistory = [
        {
          id: 'job1',
          type: 'analytics',
          status: 'completed',
          createdAt: new Date()
        }
      ];

      mockCacheService.get.mockResolvedValue(cachedHistory);

      const result = await service.getTenantJobHistory(tenantId);

      expect(mockCacheService.get).toHaveBeenCalledWith(`tenant:jobs:${tenantId}`);
      expect(result).toEqual(cachedHistory);
    });

    it('should return empty array if no cached history', async () => {
      const tenantId = 'tenant123';
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.getTenantJobHistory(tenantId);

      expect(result).toEqual([]);
    });

    it('should handle job history retrieval errors', async () => {
      const tenantId = 'tenant123';
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));

      await expect(service.getTenantJobHistory(tenantId)).rejects.toThrow('Failed to get tenant job history');
    });
  });

  describe('scheduleRecurringJobs', () => {
    it('should schedule all recurring jobs successfully', async () => {
      mockBaseJobService.addJob.mockResolvedValue('job123');

      await service.scheduleRecurringJobs();

      expect(mockBaseJobService.addJob).toHaveBeenCalledTimes(3);
      
      // Check system metrics job
      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'system-metrics',
        { type: 'system-metrics-collection' },
        expect.objectContaining({
          repeat: { cron: '*/5 * * * *' }
        })
      );

      // Check cleanup job
      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'cleanup',
        { type: 'data-cleanup' },
        expect.objectContaining({
          repeat: { cron: '0 2 * * *' }
        })
      );

      // Check analytics job
      expect(mockBaseJobService.addJob).toHaveBeenCalledWith(
        'analytics-aggregation',
        { type: 'daily-analytics' },
        expect.objectContaining({
          repeat: { cron: '0 1 * * *' }
        })
      );
    });

    it('should handle recurring job scheduling errors', async () => {
      mockBaseJobService.addJob.mockRejectedValue(new Error('Queue error'));

      await expect(service.scheduleRecurringJobs()).rejects.toThrow('Failed to schedule recurring jobs');
    });
  });

  describe('processJobResult', () => {
    it('should process job result and update cache', async () => {
      const jobId = 'job123';
      const result = {
        success: true,
        data: { processed: 100 },
        tenantId: 'tenant123'
      };

      await service.processJobResult(jobId, result);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `job:result:${jobId}`,
        result,
        24 * 60 * 60 * 1000 // 24 hours
      );
    });

    it('should handle job result processing errors', async () => {
      const jobId = 'job123';
      const result = { success: false, error: 'Processing failed' };

      mockCacheService.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.processJobResult(jobId, result)).rejects.toThrow('Failed to process job result');
    });
  });
});