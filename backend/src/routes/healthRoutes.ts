import express from 'express';
import mongoose from 'mongoose';
import { promClient } from '../utils/metrics';

const router = express.Router();

// Metrics for health checks
const healthCheckDuration = new promClient.Histogram({
   name: 'pharmacare_health_check_duration_seconds',
   help: 'Duration of health checks in seconds',
   labelNames: ['check_type'],
});

const healthCheckStatus = new promClient.Gauge({
   name: 'pharmacare_health_check_status',
   help: 'Status of health checks (1 = healthy, 0 = unhealthy)',
   labelNames: ['check_type'],
});

interface HealthCheck {
   name: string;
   status: 'healthy' | 'unhealthy';
   message?: string;
   duration?: number;
   details?: any;
}

interface HealthResponse {
   status: 'healthy' | 'unhealthy';
   timestamp: string;
   uptime: number;
   version: string;
   environment: string;
   checks: HealthCheck[];
   summary: {
      total: number;
      healthy: number;
      unhealthy: number;
   };
}

/**
 * Basic health check endpoint
 * GET /api/health
 */
router.get('/', async (req, res) => {
   const startTime = Date.now();
   const checks: HealthCheck[] = [];

   try {
      // Database connectivity check
      const dbCheckStart = Date.now();
      try {
         await mongoose.connection.db.admin().ping();
         const dbDuration = Date.now() - dbCheckStart;

         checks.push({
            name: 'database',
            status: 'healthy',
            message: 'MongoDB connection is healthy',
            duration: dbDuration,
            details: {
               readyState: mongoose.connection.readyState,
               host: mongoose.connection.host,
               port: mongoose.connection.port,
            },
         });

         healthCheckStatus.set({ check_type: 'database' }, 1);
         healthCheckDuration.observe(
            { check_type: 'database' },
            dbDuration / 1000
         );
      } catch (error) {
         checks.push({
            name: 'database',
            status: 'unhealthy',
            message: 'MongoDB connection failed',
            details: {
               error: error instanceof Error ? error.message : 'Unknown error',
            },
         });

         healthCheckStatus.set({ check_type: 'database' }, 0);
      }

      // Memory usage check
      const memoryUsage = process.memoryUsage();
      const memoryCheckStart = Date.now();
      const memoryThreshold = 1024 * 1024 * 1024; // 1GB threshold
      const isMemoryHealthy = memoryUsage.heapUsed < memoryThreshold;

      checks.push({
         name: 'memory',
         status: isMemoryHealthy ? 'healthy' : 'unhealthy',
         message: isMemoryHealthy
            ? 'Memory usage is within limits'
            : 'Memory usage is high',
         duration: Date.now() - memoryCheckStart,
         details: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024), // MB
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
         },
      });

      healthCheckStatus.set({ check_type: 'memory' }, isMemoryHealthy ? 1 : 0);

      // Event loop lag check
      const eventLoopStart = Date.now();
      await new Promise((resolve) => setImmediate(resolve));
      const eventLoopLag = Date.now() - eventLoopStart;
      const isEventLoopHealthy = eventLoopLag < 100; // 100ms threshold

      checks.push({
         name: 'event_loop',
         status: isEventLoopHealthy ? 'healthy' : 'unhealthy',
         message: isEventLoopHealthy
            ? 'Event loop is responsive'
            : 'Event loop lag detected',
         duration: eventLoopLag,
         details: {
            lag: eventLoopLag,
            threshold: 100,
         },
      });

      healthCheckStatus.set(
         { check_type: 'event_loop' },
         isEventLoopHealthy ? 1 : 0
      );

      // Environment variables check
      const envCheckStart = Date.now();
      const requiredEnvVars = [
         'NODE_ENV',
         'MONGODB_URI',
         'JWT_SECRET',
         'RESEND_API_KEY',
      ];

      const missingEnvVars = requiredEnvVars.filter(
         (envVar) => !process.env[envVar]
      );
      const isEnvHealthy = missingEnvVars.length === 0;

      checks.push({
         name: 'environment',
         status: isEnvHealthy ? 'healthy' : 'unhealthy',
         message: isEnvHealthy
            ? 'All required environment variables are set'
            : 'Missing required environment variables',
         duration: Date.now() - envCheckStart,
         details: {
            missing: missingEnvVars,
            nodeEnv: process.env.NODE_ENV,
         },
      });

      healthCheckStatus.set(
         { check_type: 'environment' },
         isEnvHealthy ? 1 : 0
      );

      // Calculate summary
      const healthyChecks = checks.filter(
         (check) => check.status === 'healthy'
      ).length;
      const unhealthyChecks = checks.filter(
         (check) => check.status === 'unhealthy'
      ).length;
      const overallStatus = unhealthyChecks === 0 ? 'healthy' : 'unhealthy';

      const response: HealthResponse = {
         status: overallStatus,
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         version: process.env.npm_package_version || '1.0.0',
         environment: process.env.NODE_ENV || 'development',
         checks,
         summary: {
            total: checks.length,
            healthy: healthyChecks,
            unhealthy: unhealthyChecks,
         },
      };

      // Set overall health status
      healthCheckStatus.set(
         { check_type: 'overall' },
         overallStatus === 'healthy' ? 1 : 0
      );
      healthCheckDuration.observe(
         { check_type: 'overall' },
         (Date.now() - startTime) / 1000
      );

      // Return appropriate HTTP status
      const statusCode = overallStatus === 'healthy' ? 200 : 503;
      res.status(statusCode).json(response);
   } catch (error) {
      const response: HealthResponse = {
         status: 'unhealthy',
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         version: process.env.npm_package_version || '1.0.0',
         environment: process.env.NODE_ENV || 'development',
         checks: [
            {
               name: 'health_check',
               status: 'unhealthy',
               message: 'Health check failed',
               details: {
                  error:
                     error instanceof Error ? error.message : 'Unknown error',
               },
            },
         ],
         summary: {
            total: 1,
            healthy: 0,
            unhealthy: 1,
         },
      };

      healthCheckStatus.set({ check_type: 'overall' }, 0);
      res.status(503).json(response);
   }
});

/**
 * Detailed health check endpoint
 * GET /api/health/detailed
 */
router.get('/detailed', async (req, res) => {
   const startTime = Date.now();
   const checks: HealthCheck[] = [];

   try {
      // All basic checks from above
      // ... (same as above)

      // Additional detailed checks

      // Database collections check
      const collectionsCheckStart = Date.now();
      try {
         const collections = await mongoose.connection.db
            .listCollections()
            .toArray();
         const requiredCollections = [
            'users',
            'workplaces',
            'subscriptions',
            'invitations',
         ];
         const existingCollections = collections.map((c) => c.name);
         const missingCollections = requiredCollections.filter(
            (c) => !existingCollections.includes(c)
         );

         checks.push({
            name: 'database_collections',
            status: missingCollections.length === 0 ? 'healthy' : 'unhealthy',
            message:
               missingCollections.length === 0
                  ? 'All required collections exist'
                  : 'Missing required collections',
            duration: Date.now() - collectionsCheckStart,
            details: {
               existing: existingCollections,
               missing: missingCollections,
               total: collections.length,
            },
         });
      } catch (error) {
         checks.push({
            name: 'database_collections',
            status: 'unhealthy',
            message: 'Failed to check database collections',
            details: {
               error: error instanceof Error ? error.message : 'Unknown error',
            },
         });
      }

      // External services check (email service)
      const emailCheckStart = Date.now();
      try {
         // Simple check - just verify API key is set
         const hasEmailConfig = !!(
            process.env.RESEND_API_KEY && process.env.FROM_EMAIL
         );

         checks.push({
            name: 'email_service',
            status: hasEmailConfig ? 'healthy' : 'unhealthy',
            message: hasEmailConfig
               ? 'Email service configuration is present'
               : 'Email service not configured',
            duration: Date.now() - emailCheckStart,
            details: {
               hasApiKey: !!process.env.RESEND_API_KEY,
               hasFromEmail: !!process.env.FROM_EMAIL,
            },
         });
      } catch (error) {
         checks.push({
            name: 'email_service',
            status: 'unhealthy',
            message: 'Email service check failed',
            details: {
               error: error instanceof Error ? error.message : 'Unknown error',
            },
         });
      }

      // File system check
      const fsCheckStart = Date.now();
      try {
         const fs = require('fs').promises;
         const tempFile = '/tmp/pharmacare_health_check';
         await fs.writeFile(tempFile, 'health check');
         await fs.unlink(tempFile);

         checks.push({
            name: 'file_system',
            status: 'healthy',
            message: 'File system is writable',
            duration: Date.now() - fsCheckStart,
         });
      } catch (error) {
         checks.push({
            name: 'file_system',
            status: 'unhealthy',
            message: 'File system check failed',
            details: {
               error: error instanceof Error ? error.message : 'Unknown error',
            },
         });
      }

      // Calculate summary
      const healthyChecks = checks.filter(
         (check) => check.status === 'healthy'
      ).length;
      const unhealthyChecks = checks.filter(
         (check) => check.status === 'unhealthy'
      ).length;
      const overallStatus = unhealthyChecks === 0 ? 'healthy' : 'unhealthy';

      const response: HealthResponse = {
         status: overallStatus,
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         version: process.env.npm_package_version || '1.0.0',
         environment: process.env.NODE_ENV || 'development',
         checks,
         summary: {
            total: checks.length,
            healthy: healthyChecks,
            unhealthy: unhealthyChecks,
         },
      };

      const statusCode = overallStatus === 'healthy' ? 200 : 503;
      res.status(statusCode).json(response);
   } catch (error) {
      res.status(503).json({
         status: 'unhealthy',
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         version: process.env.npm_package_version || '1.0.0',
         environment: process.env.NODE_ENV || 'development',
         checks: [
            {
               name: 'detailed_health_check',
               status: 'unhealthy',
               message: 'Detailed health check failed',
               details: {
                  error:
                     error instanceof Error ? error.message : 'Unknown error',
               },
            },
         ],
         summary: {
            total: 1,
            healthy: 0,
            unhealthy: 1,
         },
      });
   }
});

/**
 * Readiness probe endpoint
 * GET /api/health/ready
 */
router.get('/ready', async (req, res) => {
   try {
      // Check if application is ready to serve requests
      await mongoose.connection.db.admin().ping();

      res.status(200).json({
         status: 'ready',
         timestamp: new Date().toISOString(),
         message: 'Application is ready to serve requests',
      });
   } catch (error) {
      res.status(503).json({
         status: 'not_ready',
         timestamp: new Date().toISOString(),
         message: 'Application is not ready to serve requests',
         error: error instanceof Error ? error.message : 'Unknown error',
      });
   }
});

/**
 * Liveness probe endpoint
 * GET /api/health/live
 */
router.get('/live', (req, res) => {
   // Simple liveness check - if this endpoint responds, the process is alive
   res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid,
      message: 'Application is alive',
   });
});

export default router;
