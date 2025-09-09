"use strict";
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
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
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
const emailWebhookRoutes_1 = __importDefault(require("./routes/emailWebhookRoutes"));
const drugRoutes_1 = __importDefault(require("./modules/drug-info/routes/drugRoutes"));
const publicApiRoutes_1 = __importDefault(require("./routes/publicApiRoutes"));
const publicDrugDetailsRoutes_1 = __importDefault(require("./routes/publicDrugDetailsRoutes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
const securityMonitoring_1 = require("./middlewares/securityMonitoring");
app.use(securityMonitoring_1.blockSuspiciousIPs);
app.use(securityMonitoring_1.detectAnomalies);
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
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
app.use('/api/health/feature-flags', healthRoutes_1.default);
app.use('/api/public', publicApiRoutes_1.default);
app.use('/api/public/drugs', publicDrugDetailsRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api/subscriptions', subscriptionRoutes_1.default);
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
app.all('*', (req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map