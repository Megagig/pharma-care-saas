"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const xss_clean_1 = __importDefault(require("xss-clean"));
const hpp_1 = __importDefault(require("hpp"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const MemoryManagementService_1 = __importDefault(require("./services/MemoryManagementService"));
const logger_1 = __importStar(require("./utils/logger"));
const performanceMonitoring_1 = require("./utils/performanceMonitoring");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const patientAuthRoutes_1 = __importDefault(require("./routes/patientAuthRoutes"));
const userSettingsRoutes_1 = __importDefault(require("./routes/userSettingsRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
const patientRoutes_1 = __importDefault(require("./routes/patientRoutes"));
const allergyRoutes_1 = __importDefault(require("./routes/allergyRoutes"));
const conditionRoutes_1 = __importDefault(require("./routes/conditionRoutes"));
const medicationRoutes_1 = __importDefault(require("./routes/medicationRoutes"));
const assessmentRoutes_1 = __importDefault(require("./routes/assessmentRoutes"));
const dtpRoutes_1 = __importDefault(require("./routes/dtpRoutes"));
const carePlanRoutes_1 = __importDefault(require("./routes/carePlanRoutes"));
const visitRoutes_1 = __importDefault(require("./routes/visitRoutes"));
const noteRoutes_1 = __importDefault(require("./routes/noteRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const billingRoutes_1 = __importDefault(require("./routes/billingRoutes"));
const admin_1 = __importDefault(require("./routes/admin"));
const adminDashboardRoutes_1 = __importDefault(require("./routes/adminDashboardRoutes"));
const license_1 = __importDefault(require("./routes/license"));
const subscription_1 = __importDefault(require("./routes/subscription"));
const subscriptionManagement_1 = __importDefault(require("./routes/subscriptionManagement"));
const subscriptionManagementRoutes_1 = __importDefault(require("./routes/subscriptionManagementRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const featureFlagRoutes_1 = __importDefault(require("./routes/featureFlagRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const mtrRoutes_1 = __importDefault(require("./routes/mtrRoutes"));
const mtrNotificationRoutes_1 = __importDefault(require("./routes/mtrNotificationRoutes"));
const patientMTRIntegrationRoutes_1 = __importDefault(require("./routes/patientMTRIntegrationRoutes"));
const clinicalInterventionRoutes_1 = __importDefault(require("./routes/clinicalInterventionRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const securityRoutes_1 = __importDefault(require("./routes/securityRoutes"));
const invitationRoutes_1 = __importDefault(require("./routes/invitationRoutes"));
const medicationManagementRoutes_1 = __importDefault(require("./routes/medicationManagementRoutes"));
const healthRoutes_2 = __importDefault(require("./routes/healthRoutes"));
const monitoringRoutes_1 = __importDefault(require("./routes/monitoringRoutes"));
const medicationAnalyticsRoutes_1 = __importDefault(require("./routes/medicationAnalyticsRoutes"));
const usageMonitoringRoutes_1 = __importDefault(require("./routes/usageMonitoringRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const locationDataRoutes_1 = __importDefault(require("./routes/locationDataRoutes"));
const legacyApiRoutes_1 = __importDefault(require("./routes/legacyApiRoutes"));
const migrationDashboardRoutes_1 = __importDefault(require("./routes/migrationDashboardRoutes"));
const deploymentRoutes_1 = __importDefault(require("./routes/deploymentRoutes"));
const productionValidationRoutes_1 = __importDefault(require("./routes/productionValidationRoutes"));
const continuousMonitoringRoutes_1 = __importDefault(require("./routes/continuousMonitoringRoutes"));
const emailWebhookRoutes_1 = __importDefault(require("./routes/emailWebhookRoutes"));
const drugRoutes_1 = __importDefault(require("./modules/drug-info/routes/drugRoutes"));
const mentionRoutes_1 = __importDefault(require("./routes/mentionRoutes"));
const manualLabRoutes_1 = __importDefault(require("./modules/lab/routes/manualLabRoutes"));
const publicApiRoutes_1 = __importDefault(require("./routes/publicApiRoutes"));
const publicDrugDetailsRoutes_1 = __importDefault(require("./routes/publicDrugDetailsRoutes"));
const diagnosticRoutes_1 = __importDefault(require("./routes/diagnosticRoutes"));
const diagnosticRoutes_2 = __importDefault(require("./modules/diagnostics/routes/diagnosticRoutes"));
const communicationRoutes_1 = __importDefault(require("./routes/communicationRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const notificationManagementRoutes_1 = __importDefault(require("./routes/notificationManagementRoutes"));
const engagementIntegrationRoutes_1 = __importDefault(require("./routes/engagementIntegrationRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const reportsRoutes_1 = __importDefault(require("./routes/reportsRoutes"));
const lighthouseRoutes_1 = __importDefault(require("./routes/lighthouseRoutes"));
const performanceBudgetRoutes_1 = __importDefault(require("./routes/performanceBudgetRoutes"));
const performanceMonitoringRoutes_1 = __importDefault(require("./routes/performanceMonitoringRoutes"));
const roleHierarchyRoutes_1 = __importDefault(require("./routes/roleHierarchyRoutes"));
const permissionRoutes_1 = __importDefault(require("./routes/permissionRoutes"));
const rbacAudit_1 = __importDefault(require("./routes/rbacAudit"));
const roleRoutes_1 = __importDefault(require("./routes/roleRoutes"));
const pricingManagementRoutes_1 = __importDefault(require("./routes/pricingManagementRoutes"));
const appointmentAnalyticsRoutes_1 = __importDefault(require("./routes/appointmentAnalyticsRoutes"));
const saasRoutes_1 = __importDefault(require("./routes/saasRoutes"));
const workspaceTeamRoutes_1 = __importDefault(require("./routes/workspaceTeamRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const superAdminDashboardRoutes_1 = __importDefault(require("./routes/superAdminDashboardRoutes"));
const superAdminAuditRoutes_1 = __importDefault(require("./routes/superAdminAuditRoutes"));
const patientNotificationPreferencesRoutes_1 = __importDefault(require("./routes/patientNotificationPreferencesRoutes"));
const healthBlog_routes_1 = __importDefault(require("./routes/healthBlog.routes"));
const healthBlogAdmin_routes_1 = __importDefault(require("./routes/healthBlogAdmin.routes"));
const patientPortalAdmin_routes_1 = __importDefault(require("./routes/patientPortalAdmin.routes"));
const superAdminPatientPortal_routes_1 = __importDefault(require("./routes/superAdminPatientPortal.routes"));
const systemIntegrationService_1 = __importDefault(require("./services/systemIntegrationService"));
const app = (0, express_1.default)();
const systemIntegration = systemIntegrationService_1.default.getInstance();
if (process.env.MEMORY_MONITORING_ENABLED === 'true') {
    MemoryManagementService_1.default.startMonitoring();
    logger_1.default.info('Memory management service started');
}
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
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
const corsOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.8.167:5173',
    'https://PharmaPilot-nttq.onrender.com',
    process.env.FRONTEND_URL || 'http://localhost:3000',
];
if (process.env.CORS_ORIGINS) {
    corsOrigins.push(...process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()));
}
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-csrf-token', 'X-CSRF-Token'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
}));
const securityMonitoring_1 = require("./middlewares/securityMonitoring");
app.use(securityMonitoring_1.blockSuspiciousIPs);
app.use(securityMonitoring_1.detectAnomalies);
app.use(systemIntegration.backwardCompatibilityMiddleware());
app.use(systemIntegration.gradualRolloutMiddleware());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000'),
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => {
        if (process.env.DISABLE_RATE_LIMITING === 'true') {
            return true;
        }
        if (req.path.includes('/health')) {
            return true;
        }
        return false;
    },
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(logger_1.addCorrelationId);
const performanceMonitoring_2 = require("./utils/performanceMonitoring");
app.use((0, performanceMonitoring_1.createPerformanceMiddleware)(performanceMonitoring_2.performanceCollector));
app.use((0, express_mongo_sanitize_1.default)());
app.use((0, xss_clean_1.default)());
app.use((0, hpp_1.default)());
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-csrf-token, X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
});
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
const latencyMeasurement_1 = require("./middlewares/latencyMeasurement");
app.use('/api/', latencyMeasurement_1.latencyMeasurementMiddleware);
const unifiedAuditMiddleware_1 = require("./middlewares/unifiedAuditMiddleware");
app.use('/api/', unifiedAuditMiddleware_1.unifiedAuditMiddleware);
const clinicalInterventionSync_1 = require("./middlewares/clinicalInterventionSync");
app.use('/api/', clinicalInterventionSync_1.clinicalInterventionSyncMiddleware);
app.use('/api/', clinicalInterventionSync_1.followUpCompletionSyncMiddleware);
const compressionMiddleware_1 = require("./middlewares/compressionMiddleware");
app.use('/api/', (0, compressionMiddleware_1.responseSizeMonitoringMiddleware)());
app.use('/api/env-diagnostic', diagnosticRoutes_1.default);
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
const auth_1 = require("./middlewares/auth");
app.get('/api/debug/user-info', auth_1.auth, async (req, res) => {
    try {
        const user = req.user;
        const workspaceContext = req.workspaceContext;
        const FeatureFlagService = (await Promise.resolve().then(() => __importStar(require('./services/FeatureFlagService')))).default;
        const patientEngagementModule = await FeatureFlagService.isFeatureEnabled('patient_engagement_module', user._id.toString(), user.workplaceId?.toString() || 'no-workspace');
        const appointmentScheduling = await FeatureFlagService.isFeatureEnabled('appointment_scheduling', user._id.toString(), user.workplaceId?.toString() || 'no-workspace');
        res.json({
            status: 'OK',
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                workplaceRole: user.workplaceRole,
                status: user.status,
                workplaceId: user.workplaceId,
            },
            workspaceContext: workspaceContext ? {
                workspaceId: workspaceContext.workspace?._id,
                planName: workspaceContext.plan?.name,
                subscriptionStatus: workspaceContext.workspace?.subscriptionStatus,
            } : null,
            featureFlags: {
                patient_engagement_module: patientEngagementModule,
                appointment_scheduling: appointmentScheduling,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
app.get('/api/health/integration', async (req, res) => {
    try {
        const health = await systemIntegration.getIntegrationHealth();
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            integration: health,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Failed to get integration health',
        });
    }
});
app.use('/api/health/feature-flags', healthRoutes_1.default);
app.use('/api/health', healthRoutes_2.default);
app.use('/api/monitoring', monitoringRoutes_1.default);
app.get('/api/health/memory', (req, res) => {
    try {
        const memoryReport = MemoryManagementService_1.default.getMemoryReport();
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            memory: memoryReport
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Failed to get memory health'
        });
    }
});
app.get('/api/health/cache', async (req, res) => {
    try {
        const CacheManager = (await Promise.resolve().then(() => __importStar(require('./services/CacheManager')))).default;
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
    }
    catch (error) {
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
app.use('/api/public', publicApiRoutes_1.default);
app.use('/api/public/drugs', publicDrugDetailsRoutes_1.default);
app.use('/api/public/blog', healthBlog_routes_1.default);
const publicAppointmentRoutes_1 = __importDefault(require("./routes/publicAppointmentRoutes"));
app.use('/api/public/appointments', publicAppointmentRoutes_1.default);
const publicWorkspaceRoutes_1 = __importDefault(require("./routes/publicWorkspaceRoutes"));
app.use('/api/public/workspaces', publicWorkspaceRoutes_1.default);
const patientPortalAuthRoutes_1 = __importDefault(require("./routes/patientPortalAuthRoutes"));
app.use('/api/patient-portal/auth', patientPortalAuthRoutes_1.default);
app.use('/api/patient-portal/patients', patientPortalAuthRoutes_1.default);
const publicHelpRoutes_1 = __importDefault(require("./routes/publicHelpRoutes"));
app.use('/api/help', publicHelpRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/reports', reportsRoutes_1.default);
app.use('/api/lighthouse', lighthouseRoutes_1.default);
app.use('/api/performance-budgets', performanceBudgetRoutes_1.default);
app.use('/api/performance-monitoring', performanceMonitoringRoutes_1.default);
app.use('/api/deployment', deploymentRoutes_1.default);
app.use('/api/production-validation', productionValidationRoutes_1.default);
app.use('/api/continuous-monitoring', continuousMonitoringRoutes_1.default);
const patientPortalRoutes_1 = __importDefault(require("./routes/patientPortalRoutes"));
app.use('/api/patient-portal', patientPortalRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/patient-auth', patientAuthRoutes_1.default);
app.use('/api/user/settings', userSettingsRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
app.use('/api/pricing', pricingManagementRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/super-admin/dashboard', superAdminDashboardRoutes_1.default);
app.use('/api/super-admin/audit-trail', superAdminAuditRoutes_1.default);
app.use('/api/super-admin/blog', healthBlogAdmin_routes_1.default);
app.use('/api/super-admin/patient-portal', superAdminPatientPortal_routes_1.default);
app.use('/api/patients', patientRoutes_1.default);
app.use('/api/patients', allergyRoutes_1.default);
app.use('/api/patients', conditionRoutes_1.default);
app.use('/api/patients', medicationRoutes_1.default);
app.use('/api/patients', assessmentRoutes_1.default);
app.use('/api/patients', dtpRoutes_1.default);
app.use('/api/patients', carePlanRoutes_1.default);
app.use('/api/patients', visitRoutes_1.default);
app.use('/api/patients', patientMTRIntegrationRoutes_1.default);
app.use('/api/patients', patientNotificationPreferencesRoutes_1.default);
app.use('/api', invitationRoutes_1.default);
app.use('/api', allergyRoutes_1.default);
app.use('/api', conditionRoutes_1.default);
app.use('/api', medicationRoutes_1.default);
app.use('/api', assessmentRoutes_1.default);
app.use('/api', dtpRoutes_1.default);
app.use('/api', carePlanRoutes_1.default);
app.use('/api', visitRoutes_1.default);
app.use('/api/drugs', drugRoutes_1.default);
app.use('/api/manual-lab', manualLabRoutes_1.default);
app.use('/api/diagnostics', diagnosticRoutes_2.default);
app.use('/api/communication', communicationRoutes_1.default);
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const auditLogRoutes_1 = __importDefault(require("./routes/auditLogRoutes"));
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/chat/audit', auditLogRoutes_1.default);
const templateRoutes_1 = __importDefault(require("./routes/templateRoutes"));
app.use('/api/chat/templates', templateRoutes_1.default);
const prescriptionDiscussionRoutes_1 = __importDefault(require("./routes/prescriptionDiscussionRoutes"));
app.use('/api/chat/prescription-discussions', prescriptionDiscussionRoutes_1.default);
const reminderRoutes_1 = __importDefault(require("./routes/reminderRoutes"));
app.use('/api/chat/reminders', reminderRoutes_1.default);
const chatbotRoutes_1 = __importDefault(require("./routes/chatbotRoutes"));
app.use('/api/chatbot', chatbotRoutes_1.default);
const broadcastRoutes_1 = __importDefault(require("./routes/broadcastRoutes"));
app.use('/api/chat/broadcasts', broadcastRoutes_1.default);
const communicationAuditRoutes_1 = __importDefault(require("./routes/communicationAuditRoutes"));
app.use('/api/communication/audit', communicationAuditRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/communication/notifications', notificationRoutes_1.default);
app.use('/api/notification-management', notificationManagementRoutes_1.default);
app.use('/api/mentions', mentionRoutes_1.default);
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/notes')) {
        console.log(`[App Route Debug] Clinical Notes request: ${req.method} ${req.originalUrl}`);
    }
    next();
});
app.use('/api/notes', noteRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/billing', billingRoutes_1.default);
app.use('/api/mtr', mtrRoutes_1.default);
app.use('/api/mtr/notifications', mtrNotificationRoutes_1.default);
app.use('/api/engagement-integration', engagementIntegrationRoutes_1.default);
const appointmentRoutes_1 = __importDefault(require("./routes/appointmentRoutes"));
const followUpRoutes_1 = __importDefault(require("./routes/followUpRoutes"));
const scheduleRoutes_1 = __importDefault(require("./routes/scheduleRoutes"));
const queueMonitoringRoutes_1 = __importDefault(require("./routes/queueMonitoringRoutes"));
const alertRoutes_1 = __importDefault(require("./routes/alertRoutes"));
app.use('/api', appointmentAnalyticsRoutes_1.default);
app.use('/api/appointments', appointmentRoutes_1.default);
app.use('/api/follow-ups', followUpRoutes_1.default);
app.use('/api/schedules', scheduleRoutes_1.default);
app.use('/api/queue-monitoring', queueMonitoringRoutes_1.default);
app.use('/api/alerts', alertRoutes_1.default);
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
app.get('/api/test-clinical-health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Test clinical health endpoint works',
        timestamp: new Date().toISOString()
    });
});
app.use('/api/clinical-interventions', clinicalInterventionRoutes_1.default);
app.use('/api/medication-management', medicationManagementRoutes_1.default);
app.use('/api/medication-analytics', medicationAnalyticsRoutes_1.default);
app.use('/api/audit', auditRoutes_1.default);
app.use('/api/security', securityRoutes_1.default);
app.use('/api/usage', usageMonitoringRoutes_1.default);
app.use('/api/locations', locationRoutes_1.default);
app.use('/api/location-data', locationDataRoutes_1.default);
app.use('/api/workspace/team', workspaceTeamRoutes_1.default);
app.use('/api/workspace-admin/patient-portal', patientPortalAdmin_routes_1.default);
app.use('/api/legacy', legacyApiRoutes_1.default);
app.use('/api/migration', migrationDashboardRoutes_1.default);
app.use('/api/email', emailWebhookRoutes_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/admin/dashboard', adminDashboardRoutes_1.default);
app.use('/api/admin/saas', saasRoutes_1.default);
const rolloutRoutes_1 = __importDefault(require("./routes/rolloutRoutes"));
app.use('/api/admin/rollout', rolloutRoutes_1.default);
app.use('/api/roles', roleRoutes_1.default);
app.use('/api/role-hierarchy', roleHierarchyRoutes_1.default);
app.use('/api/permissions', permissionRoutes_1.default);
app.use('/api/rbac-audit', rbacAudit_1.default);
app.use('/api/license', license_1.default);
app.use('/api/subscription-management', subscriptionManagement_1.default);
app.use('/api/subscription', subscription_1.default);
app.use('/api/workspace-subscription', subscriptionManagementRoutes_1.default);
app.use('/api/feature-flags', featureFlagRoutes_1.default);
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' }), webhookRoutes_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('X-Frame-Options', 'DENY');
        }
    },
}));
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend/build"), {
    setHeaders: (res, filePath) => {
        if (filePath.match(/\.(js|css)$/) && filePath.match(/-[a-f0-9]{8}\./)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        else if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
        else {
            res.setHeader('Cache-Control', 'public, max-age=604800');
        }
    },
}));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path_1.default.join(__dirname, "../../frontend/build/index.html"));
    }
    else {
        res.status(404).json({ message: `Route ${req.originalUrl} not found` });
    }
});
app.all('/api/*', (req, res) => {
    res.status(404).json({ message: `API Route ${req.originalUrl} not found` });
});
app.use(errorHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map