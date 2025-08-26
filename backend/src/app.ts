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
import noteRoutes from './routes/noteRoutes';
import medicationRoutes from './routes/medicationRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/admin';
import licenseRoutes from './routes/license';
import subscriptionManagementRoutes from './routes/subscription';
import subAnalyticsRoutes from './routes/subscriptionManagement';
import webhookRoutes from './routes/webhookRoutes';
import featureFlagRoutes from './routes/featureFlagRoutes';
import healthRoutes from './routes/healthRoutes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Create React App dev server
      'http://localhost:5173', // Vite dev server
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/payments', paymentRoutes);

// RBAC and enhanced features
app.use('/api/admin', adminRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/subscription-management', subAnalyticsRoutes); // Using correct subscriptionManagement routes
app.use('/api/subscription', subscriptionManagementRoutes); // Old routes at /api/subscription
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
