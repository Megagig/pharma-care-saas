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
const logger_1 = __importDefault(require("./utils/logger"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
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
const communicationRoutes_1 = __importDefault(require("./routes/communicationRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
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
const saasRoutes_1 = __importDefault(require("./routes/saasRoutes"));
const systemIntegrationService_1 = __importDefault(require("./services/systemIntegrationService"));
const app = (0, express_1.default)();
const systemIntegration = systemIntegrationService_1.default.getInstance();
if (process.env.MEMORY_MONITORING_ENABLED === 'true') {
    MemoryManagementService_1.default.startMonitoring();
    logger_1.default.info('Memory management service started');
}
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'https:'],
            connectSrc: ["'self'", 'http://localhost:5000', 'http://127.0.0.1:5000'],
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
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://192.168.8.167:5173',
        process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
const securityMonitoring_1 = require("./middlewares/securityMonitoring");
app.use(securityMonitoring_1.blockSuspiciousIPs);
app.use(securityMonitoring_1.detectAnomalies);
app.use(systemIntegration.backwardCompatibilityMiddleware());
app.use(systemIntegration.gradualRolloutMiddleware());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) => {
        if (process.env.NODE_ENV === 'development' &&
            (req.path.includes('/health') || req.path.includes('/mtr/summary'))) {
            return true;
        }
        return false;
    },
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
app.use((0, xss_clean_1.default)());
app.use((0, hpp_1.default)());
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
const latencyMeasurement_1 = require("./middlewares/latencyMeasurement");
app.use('/api/', latencyMeasurement_1.latencyMeasurementMiddleware);
const compressionMiddleware_1 = require("./middlewares/compressionMiddleware");
app.use('/api/', (0, compressionMiddleware_1.adaptiveCompressionMiddleware)());
app.use('/api/', (0, compressionMiddleware_1.intelligentCompressionMiddleware)({
    threshold: 1024,
    level: 6,
}));
app.use('/api/', (0, compressionMiddleware_1.responseSizeMonitoringMiddleware)());
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
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
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/reports', reportsRoutes_1.default);
app.use('/api/lighthouse', lighthouseRoutes_1.default);
app.use('/api/performance-budgets', performanceBudgetRoutes_1.default);
app.use('/api/performance-monitoring', performanceMonitoringRoutes_1.default);
app.use('/api/deployment', deploymentRoutes_1.default);
app.use('/api/production-validation', productionValidationRoutes_1.default);
app.use('/api/continuous-monitoring', continuousMonitoringRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
app.use('/api/pricing', pricingManagementRoutes_1.default);
app.use('/api/patients', patientRoutes_1.default);
app.use('/api/patients', allergyRoutes_1.default);
app.use('/api/patients', conditionRoutes_1.default);
app.use('/api/patients', medicationRoutes_1.default);
app.use('/api/patients', assessmentRoutes_1.default);
app.use('/api/patients', dtpRoutes_1.default);
app.use('/api/patients', carePlanRoutes_1.default);
app.use('/api/patients', visitRoutes_1.default);
app.use('/api/patients', patientMTRIntegrationRoutes_1.default);
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
app.use('/api/diagnostics', diagnosticRoutes_1.default);
app.use('/api/communication', communicationRoutes_1.default);
const communicationAuditRoutes_1 = __importDefault(require("./routes/communicationAuditRoutes"));
app.use('/api/communication/audit', communicationAuditRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/communication/notifications', notificationRoutes_1.default);
app.use('/api/mentions', mentionRoutes_1.default);
app.use((req, res, next) => {
    if (req.path.startsWith('/api/notes')) {
        console.log(`[App Route Debug] Clinical Notes request: ${req.method} ${req.originalUrl}`);
    }
    next();
});
app.use('/api/notes', noteRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/mtr', mtrRoutes_1.default);
app.use('/api/mtr/notifications', mtrNotificationRoutes_1.default);
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
app.use('/api/clinical-interventions', clinicalInterventionRoutes_1.default);
app.use('/api/medication-management', medicationManagementRoutes_1.default);
app.use('/api/medication-analytics', medicationAnalyticsRoutes_1.default);
app.use('/api/audit', auditRoutes_1.default);
app.use('/api/security', securityRoutes_1.default);
app.use('/api/usage', usageMonitoringRoutes_1.default);
app.use('/api/locations', locationRoutes_1.default);
app.use('/api/location-data', locationDataRoutes_1.default);
app.use('/api/legacy', legacyApiRoutes_1.default);
app.use('/api/migration', migrationDashboardRoutes_1.default);
app.use('/api/email', emailWebhookRoutes_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/admin/dashboard', adminDashboardRoutes_1.default);
app.use('/api/admin/saas', saasRoutes_1.default);
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
app.use('/uploads', express_1.default.static('uploads', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        if (path.endsWith('.pdf')) {
            res.setHeader('Content-Disposition', 'inline');
        }
    },
}));
app.use(express_1.default.static(path_1.default.join(__dirname, "../../frontend/build")));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
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