import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

import errorHandler from './middlewares/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
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
import auditRoutes from './routes/auditRoutes';
import securityRoutes from './routes/securityRoutes';
import invitationRoutes from './routes/invitationRoutes';
import usageMonitoringRoutes from './routes/usageMonitoringRoutes';
import locationRoutes from './routes/locationRoutes';
import locationDataRoutes from './routes/locationDataRoutes';
import legacyApiRoutes from './routes/legacyApiRoutes';
import migrationDashboardRoutes from './routes/migrationDashboardRoutes';
import emailWebhookRoutes from './routes/emailWebhookRoutes';
import drugRoutes from './modules/drug-info/routes/drugRoutes';
import publicApiRoutes from './routes/publicApiRoutes';
import publicDrugDetailsRoutes from './routes/publicDrugDetailsRoutes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Create React App dev server
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173', // Alternative Vite URL
      'http://192.168.8.167:5173', // Local network Vite URL
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Security monitoring middleware
import {
  blockSuspiciousIPs,
  detectAnomalies,
} from './middlewares/securityMonitoring';
app.use(blockSuspiciousIPs);
app.use(detectAnomalies);

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for health checks and certain endpoints in development
    if (
      process.env.NODE_ENV === 'development' &&
      (req.path.includes('/health') || req.path.includes('/mtr/summary'))
    ) {
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

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});
app.use('/api/health/feature-flags', healthRoutes);

// Public API routes (no authentication required)
app.use('/api/public', publicApiRoutes);
app.use('/api/public/drugs', publicDrugDetailsRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

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

// Other routes
app.use('/api/notes', noteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/mtr', mtrRoutes);
app.use('/api/mtr/notifications', mtrNotificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/usage', usageMonitoringRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/location-data', locationDataRoutes);

// Legacy API compatibility routes
app.use('/api/legacy', legacyApiRoutes);

// Migration dashboard routes (Super Admin only)
app.use('/api/migration', migrationDashboardRoutes);

// Email delivery and webhook routes
app.use('/api/email', emailWebhookRoutes);

// RBAC and enhanced features
app.use('/api/admin', adminRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/subscription-management', subAnalyticsRoutes); // Using correct subscriptionManagement routes
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
  express.static('uploads', {
    maxAge: '1d',
    setHeaders: (res, path) => {
      // Security headers for file downloads
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      if (path.endsWith('.pdf')) {
        res.setHeader('Content-Disposition', 'inline');
      }
    },
  })
);

// 404 handler
app.all('*', (req: Request, res: Response) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

export default app;
