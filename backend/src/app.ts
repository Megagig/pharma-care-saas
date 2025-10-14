import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import path from 'path';


// Import custom types (automatically loaded from src/types/)
import errorHandler from './middlewares/errorHandler';
import memoryManagementService from './services/MemoryManagementService';
import logger from './utils/logger';

// Route imports
import authRoutes from './routes/authRoutes';
import userSettingsRoutes from './routes/userSettingsRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import patientRoutes from './routes/patientRoutes';
import allergyRoutes from './routes/allergyRoutes';
import conditionRoutes from './routes/conditionRoutes';
import medicationRoutes from './routes/medicationRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import dtpRoutes from './routes/dtpRoutes';
import carePlanRoutes from './routes/carePlanRoutes';
import visitRoutes from './routes/visitRoutes';
import noteRoutes from './routes/noteRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/admin';
import adminDashboardRoutes from './routes/adminDashboardRoutes';
import licenseRoutes from './routes/license';
import subscriptionManagementRoutes from './routes/subscription';
import subAnalyticsRoutes from './routes/subscriptionManagement';
import workspaceSubscriptionRoutes from './routes/subscriptionManagementRoutes';
import webhookRoutes from './routes/webhookRoutes';
import featureFlagRoutes from './routes/featureFlagRoutes';
import healthRoutes from './routes/healthRoutes';
import mtrRoutes from './routes/mtrRoutes';
import mtrNotificationRoutes from './routes/mtrNotificationRoutes';
import patientMTRIntegrationRoutes from './routes/patientMTRIntegrationRoutes';
import clinicalInterventionRoutes from './routes/clinicalInterventionRoutes';
import auditRoutes from './routes/auditRoutes';
import securityRoutes from './routes/securityRoutes';
import invitationRoutes from './routes/invitationRoutes';
import medicationManagementRoutes from './routes/medicationManagementRoutes';
import medicationAnalyticsRoutes from './routes/medicationAnalyticsRoutes';
import usageMonitoringRoutes from './routes/usageMonitoringRoutes';
import locationRoutes from './routes/locationRoutes';
import locationDataRoutes from './routes/locationDataRoutes';
import legacyApiRoutes from './routes/legacyApiRoutes';
import migrationDashboardRoutes from './routes/migrationDashboardRoutes';
import deploymentRoutes from './routes/deploymentRoutes';
import productionValidationRoutes from './routes/productionValidationRoutes';
import continuousMonitoringRoutes from './routes/continuousMonitoringRoutes';
import emailWebhookRoutes from './routes/emailWebhookRoutes';
import drugRoutes from './modules/drug-info/routes/drugRoutes';
import mentionRoutes from './routes/mentionRoutes';
import manualLabRoutes from './modules/lab/routes/manualLabRoutes';
import publicApiRoutes from './routes/publicApiRoutes';
import publicDrugDetailsRoutes from './routes/publicDrugDetailsRoutes';
import diagnosticRoutes from './routes/diagnosticRoutes';
import communicationRoutes from './routes/communicationRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import lighthouseRoutes from './routes/lighthouseRoutes';
import performanceBudgetRoutes from './routes/performanceBudgetRoutes';
import performanceMonitoringRoutes from './routes/performanceMonitoringRoutes';
import roleHierarchyRoutes from './routes/roleHierarchyRoutes';
import permissionRoutes from './routes/permissionRoutes';
import rbacAuditRoutes from './routes/rbacAudit';
import roleRoutes from './routes/roleRoutes';
import pricingManagementRoutes from './routes/pricingManagementRoutes';
import saasRoutes from './routes/saasRoutes';
import workspaceTeamRoutes from './routes/workspaceTeamRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import superAdminDashboardRoutes from './routes/superAdminDashboardRoutes';
import superAdminAuditRoutes from './routes/superAdminAuditRoutes';
import SystemIntegrationService from './services/systemIntegrationService';

const app: Application = express();

// Initialize system integration service
const systemIntegration = SystemIntegrationService.getInstance();

// Initialize memory management service
// Start memory monitoring if enabled
if (process.env.MEMORY_MONITORING_ENABLED === 'true') {
  memoryManagementService.startMonitoring();
  logger.info('Memory management service started');
}

// Trust proxy - CRITICAL for Render deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:'],
      connectSrc: [
        "'self'",
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:3000',
        'http://localhost:5173',
        'https://PharmaPilot-nttq.onrender.com'
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      workerSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"]
    }
  }
}));
// Configure CORS origins
const corsOrigins = [
  'http://localhost:3000', // Create React App dev server
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:5173', // Alternative Vite URL
  'http://192.168.8.167:5173', // Local network Vite URL
  'https://PharmaPilot-nttq.onrender.com', // Production frontend
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

// Add additional origins from environment variable
if (process.env.CORS_ORIGINS) {
  corsOrigins.push(...process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()));
}

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

// Security monitoring middleware
import {
  blockSuspiciousIPs,
  detectAnomalies,
} from './middlewares/securityMonitoring';
app.use(blockSuspiciousIPs);
app.use(detectAnomalies as any);

// System integration middleware for backward compatibility
app.use(systemIntegration.backwardCompatibilityMiddleware());
app.use(systemIntegration.gradualRolloutMiddleware() as any);

// Rate limiting - more lenient for development and production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000'), // 5000 requests default
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting if disabled via env var
    if (process.env.DISABLE_RATE_LIMITING === 'true') {
      return true;
    }
    // Skip rate limiting for health checks
    if (req.path.includes('/health')) {
      return true;
    }
    return false;
  },
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize()); // Against NoSQL query injection
app.use(xss()); // Against XSS attacks
app.use(hpp()); // Against HTTP Parameter Pollution

// Handle preflight requests explicitly
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Performance monitoring middleware
import { latencyMeasurementMiddleware } from './middlewares/latencyMeasurement';
app.use('/api/', latencyMeasurementMiddleware);

// Unified Audit Logging Middleware (logs all important activities)
import { unifiedAuditMiddleware } from './middlewares/unifiedAuditMiddleware';
app.use('/api/', unifiedAuditMiddleware);

// Compression middleware for API responses
import {
  intelligentCompressionMiddleware,
  responseSizeMonitoringMiddleware,
  adaptiveCompressionMiddleware
} from './middlewares/compressionMiddleware';

// TEMPORARILY DISABLED - Testing MTR response issue
// app.use('/api/', adaptiveCompressionMiddleware());
// app.use('/api/', intelligentCompressionMiddleware({
//   threshold: 1024, // 1KB minimum
//   level: 6, // Balanced compression,
// }));

app.use('/api/', responseSizeMonitoringMiddleware());

// Health check routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// System integration health endpoint
app.get('/api/health/integration', async (req: Request, res: Response) => {
  try {
    const health = await systemIntegration.getIntegrationHealth();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      integration: health,
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Failed to get integration health',
    });
  }
});

app.use('/api/health/feature-flags', healthRoutes);

// Memory health endpoint
app.get('/api/health/memory', (req: Request, res: Response) => {
  try {
    const memoryReport = memoryManagementService.getMemoryReport();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      memory: memoryReport
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Failed to get memory health'
    });
  }
});

// Cache health endpoint
app.get('/api/health/cache', async (req: Request, res: Response) => {
  try {
    const CacheManager = (await import('./services/CacheManager')).default;
    const cacheManager = CacheManager.getInstance();
    const cacheMetrics = await cacheManager.getMetrics();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      cache: {
        metrics: cacheMetrics,
        connected: true
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Failed to get cache health',
      cache: {
        connected: false
      }
    });
  }
});

// Public API routes (no authentication required)
app.use('/api/public', publicApiRoutes);
app.use('/api/public/drugs', publicDrugDetailsRoutes);

// Analytics routes (no authentication required for Web Vitals collection)
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/lighthouse', lighthouseRoutes);
app.use('/api/performance-budgets', performanceBudgetRoutes);
app.use('/api/performance-monitoring', performanceMonitoringRoutes);

// Deployment monitoring routes (admin only)
app.use('/api/deployment', deploymentRoutes);

// Production validation routes (admin only)
app.use('/api/production-validation', productionValidationRoutes);

// Continuous monitoring routes (admin only)
app.use('/api/continuous-monitoring', continuousMonitoringRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user/settings', userSettingsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/pricing', pricingManagementRoutes);

// Dashboard routes (optimized for performance)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/super-admin/dashboard', superAdminDashboardRoutes);

// Super Admin Audit Trail routes (Super Admin only)
app.use('/api/super-admin/audit-trail', superAdminAuditRoutes);

// Patient Management routes
app.use('/api/patients', patientRoutes);
app.use('/api/patients', allergyRoutes);
app.use('/api/patients', conditionRoutes);
app.use('/api/patients', medicationRoutes);
app.use('/api/patients', assessmentRoutes);
app.use('/api/patients', dtpRoutes);
app.use('/api/patients', carePlanRoutes);
app.use('/api/patients', visitRoutes);
app.use('/api/patients', patientMTRIntegrationRoutes);

// Invitation routes (must come before individual resource routes to avoid auth conflicts)
app.use('/api', invitationRoutes);

// Individual resource routes
app.use('/api', allergyRoutes);
app.use('/api', conditionRoutes);
app.use('/api', medicationRoutes);
app.use('/api', assessmentRoutes);
app.use('/api', dtpRoutes);
app.use('/api', carePlanRoutes);
app.use('/api', visitRoutes);

// Drug Information Center routes
app.use('/api/drugs', drugRoutes);

// Manual Lab Order routes
app.use('/api/manual-lab', manualLabRoutes);

// AI Diagnostic routes
app.use('/api/diagnostics', diagnosticRoutes);

// Communication Hub routes
app.use('/api/communication', communicationRoutes);

// Communication Audit routes
import communicationAuditRoutes from './routes/communicationAuditRoutes';

app.use('/api/communication/audit', communicationAuditRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Communication-specific notifications
app.use('/api/communication/notifications', notificationRoutes);

// Mention routes (already imported above)
app.use('/api/mentions', mentionRoutes);

// Clinical Notes routes (debug logging disabled in production for performance)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/notes')) {
    console.log(
      `[App Route Debug] Clinical Notes request: ${req.method} ${req.originalUrl}`
    );
  }
  next();
});
app.use('/api/notes', noteRoutes);

// Other routes
app.use('/api/payments', paymentRoutes);
app.use('/api/mtr', mtrRoutes);
app.use('/api/mtr/notifications', mtrNotificationRoutes);
// Clinical interventions health check (no auth required)
app.get('/api/clinical-interventions/health', (req, res) => {
  res.json({
    status: 'OK',
    module: 'clinical-interventions',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      total: 30,
      crud: 5,
      workflow: 8,
      analytics: 4,
      reporting: 3,
      utility: 2,
      mtr: 5,
      notifications: 1,
      audit: 3
    }
  });
});

// Test endpoint to verify routing behavior
app.get('/api/test-clinical-health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Test clinical health endpoint works',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/clinical-interventions', clinicalInterventionRoutes);
app.use('/api/medication-management', medicationManagementRoutes);
app.use('/api/medication-analytics', medicationAnalyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/usage', usageMonitoringRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/location-data', locationDataRoutes);

// Workspace Team Management routes (Workspace owners only)
app.use('/api/workspace/team', workspaceTeamRoutes);

// Legacy API compatibility routes
app.use('/api/legacy', legacyApiRoutes);

// Migration dashboard routes (Super Admin only)
app.use('/api/migration', migrationDashboardRoutes);

// Email delivery and webhook routes
app.use('/api/email', emailWebhookRoutes);

// RBAC and enhanced features
app.use('/api/admin', adminRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/saas', saasRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/role-hierarchy', roleHierarchyRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/rbac-audit', rbacAuditRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/subscription-management', subAnalyticsRoutes); // Using correct subscription Management routes
app.use('/api/subscription', subscriptionManagementRoutes); // Old routes at /api/subscription
app.use('/api/workspace-subscription', workspaceSubscriptionRoutes); // New workspace subscription routes
app.use('/api/feature-flags', featureFlagRoutes);

// Webhooks - no rate limiting and body parsing is raw for signature verification
app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }), // Raw body parser for signature verification
  webhookRoutes
);

// Serve uploaded files (with proper security)
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // CRITICAL: Allow cross-origin access for images
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Security headers for file downloads
      res.setHeader('X-Content-Type-Options', 'nosniff');

      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Frame-Options', 'DENY');
      }
    },
  })
);

// Serve static files from React build with proper caching
app.use(
  express.static(path.join(__dirname, "../../frontend/build"), {
    setHeaders: (res, filePath) => {
      // Cache hashed assets (js, css with hash in filename) for 1 year
      if (filePath.match(/\.(js|css)$/) && filePath.match(/-[a-f0-9]{8}\./)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Don't cache index.html to ensure users get latest version
      else if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      // Cache other assets (images, fonts) for 1 week
      else {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }
    },
  })
);

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req: Request, res: Response) => {
  // Only serve index.html for non-API and non-uploads routes
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    // Set no-cache headers for index.html
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, "../../frontend/build/index.html"));
  } else {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
  }
});

// 404 handler for API routes only
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ message: `API Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

export default app;
