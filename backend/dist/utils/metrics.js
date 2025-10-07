"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promClient = exports.register = exports.updateAllMetrics = exports.updateUsageMetrics = exports.updateInvitationMetrics = exports.updateWorkspaceMetrics = exports.updateSubscriptionMetrics = exports.metricsMiddleware = exports.usersTotal = exports.patientsTotal = exports.databaseConnectionsActive = exports.databaseOperationDuration = exports.rateLimitViolationsTotal = exports.authSuccessTotal = exports.authFailuresTotal = exports.emailQueueSize = exports.emailsFailedTotal = exports.emailsSentTotal = exports.usageStatsGauge = exports.usageLimitViolationsTotal = exports.invitationsPendingTotal = exports.invitationsFailedTotal = exports.invitationsAcceptedTotal = exports.invitationsSentTotal = exports.workspacesCreatedTotal = exports.workspacesActiveTotal = exports.paymentFailuresTotal = exports.trialsExpiredTotal = exports.trialConversionsTotal = exports.subscriptionsTotal = exports.httpRequestsTotal = exports.httpRequestDuration = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
exports.promClient = prom_client_1.default;
const register = new prom_client_1.default.Registry();
exports.register = register;
prom_client_1.default.collectDefaultMetrics({
    register,
    prefix: 'PharmacyCopilot_',
});
exports.httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'PharmacyCopilot_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});
exports.httpRequestsTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
exports.subscriptionsTotal = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_subscriptions_total',
    help: 'Total number of subscriptions by status',
    labelNames: ['status', 'tier'],
});
exports.trialConversionsTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_trial_conversions_total',
    help: 'Total number of trial conversions',
    labelNames: ['from_tier', 'to_tier'],
});
exports.trialsExpiredTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_trials_expired_total',
    help: 'Total number of expired trials',
});
exports.paymentFailuresTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_payment_failures_total',
    help: 'Total number of payment failures',
    labelNames: ['reason', 'tier'],
});
exports.workspacesActiveTotal = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_workspaces_active_total',
    help: 'Total number of active workspaces',
});
exports.workspacesCreatedTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_workspaces_created_total',
    help: 'Total number of workspaces created',
});
exports.invitationsSentTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_invitations_sent_total',
    help: 'Total number of invitations sent',
    labelNames: ['workspace_id', 'role'],
});
exports.invitationsAcceptedTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_invitations_accepted_total',
    help: 'Total number of invitations accepted',
    labelNames: ['workspace_id', 'role'],
});
exports.invitationsFailedTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_invitations_failed_total',
    help: 'Total number of failed invitations',
    labelNames: ['reason'],
});
exports.invitationsPendingTotal = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_invitations_pending_total',
    help: 'Total number of pending invitations',
});
exports.usageLimitViolationsTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_usage_limit_violations_total',
    help: 'Total number of usage limit violations',
    labelNames: ['resource', 'workspace_id', 'tier'],
});
exports.usageStatsGauge = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_usage_stats',
    help: 'Current usage statistics',
    labelNames: ['resource', 'workspace_id', 'tier'],
});
exports.emailsSentTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_emails_sent_total',
    help: 'Total number of emails sent',
    labelNames: ['type', 'status'],
});
exports.emailsFailedTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_emails_failed_total',
    help: 'Total number of failed emails',
    labelNames: ['type', 'reason'],
});
exports.emailQueueSize = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_email_queue_size',
    help: 'Current size of email queue',
});
exports.authFailuresTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_auth_failures_total',
    help: 'Total number of authentication failures',
    labelNames: ['reason', 'ip'],
});
exports.authSuccessTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_auth_success_total',
    help: 'Total number of successful authentications',
});
exports.rateLimitViolationsTotal = new prom_client_1.default.Counter({
    name: 'PharmacyCopilot_rate_limit_violations_total',
    help: 'Total number of rate limit violations',
    labelNames: ['endpoint', 'ip'],
});
exports.databaseOperationDuration = new prom_client_1.default.Histogram({
    name: 'PharmacyCopilot_database_operation_duration_seconds',
    help: 'Duration of database operations in seconds',
    labelNames: ['operation', 'collection'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});
exports.databaseConnectionsActive = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_database_connections_active',
    help: 'Number of active database connections',
});
exports.patientsTotal = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_patients_total',
    help: 'Total number of patients',
    labelNames: ['workspace_id'],
});
exports.usersTotal = new prom_client_1.default.Gauge({
    name: 'PharmacyCopilot_users_total',
    help: 'Total number of users',
    labelNames: ['role', 'status'],
});
register.registerMetric(exports.httpRequestDuration);
register.registerMetric(exports.httpRequestsTotal);
register.registerMetric(exports.subscriptionsTotal);
register.registerMetric(exports.trialConversionsTotal);
register.registerMetric(exports.trialsExpiredTotal);
register.registerMetric(exports.paymentFailuresTotal);
register.registerMetric(exports.workspacesActiveTotal);
register.registerMetric(exports.workspacesCreatedTotal);
register.registerMetric(exports.invitationsSentTotal);
register.registerMetric(exports.invitationsAcceptedTotal);
register.registerMetric(exports.invitationsFailedTotal);
register.registerMetric(exports.invitationsPendingTotal);
register.registerMetric(exports.usageLimitViolationsTotal);
register.registerMetric(exports.usageStatsGauge);
register.registerMetric(exports.emailsSentTotal);
register.registerMetric(exports.emailsFailedTotal);
register.registerMetric(exports.emailQueueSize);
register.registerMetric(exports.authFailuresTotal);
register.registerMetric(exports.authSuccessTotal);
register.registerMetric(exports.rateLimitViolationsTotal);
register.registerMetric(exports.databaseOperationDuration);
register.registerMetric(exports.databaseConnectionsActive);
register.registerMetric(exports.patientsTotal);
register.registerMetric(exports.usersTotal);
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path || 'unknown';
        const method = req.method;
        const statusCode = res.statusCode.toString();
        exports.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
        exports.httpRequestsTotal.inc({
            method,
            route,
            status_code: statusCode,
        });
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
const updateSubscriptionMetrics = async () => {
    try {
        const mongoose = require('mongoose');
        const Subscription = mongoose.model('Subscription');
        const subscriptionStats = await Subscription.aggregate([
            {
                $group: {
                    _id: { status: '$status', tier: '$tier' },
                    count: { $sum: 1 },
                },
            },
        ]);
        exports.subscriptionsTotal.reset();
        subscriptionStats.forEach((stat) => {
            exports.subscriptionsTotal.set({ status: stat._id.status, tier: stat._id.tier }, stat.count);
        });
    }
    catch (error) {
        console.error('Error updating subscription metrics:', error);
    }
};
exports.updateSubscriptionMetrics = updateSubscriptionMetrics;
const updateWorkspaceMetrics = async () => {
    try {
        const mongoose = require('mongoose');
        const Workplace = mongoose.model('Workplace');
        const activeCount = await Workplace.countDocuments({
            subscriptionStatus: { $in: ['trial', 'active'] },
        });
        exports.workspacesActiveTotal.set(activeCount);
    }
    catch (error) {
        console.error('Error updating workspace metrics:', error);
    }
};
exports.updateWorkspaceMetrics = updateWorkspaceMetrics;
const updateInvitationMetrics = async () => {
    try {
        const mongoose = require('mongoose');
        const Invitation = mongoose.model('Invitation');
        const pendingCount = await Invitation.countDocuments({
            status: 'active',
            expiresAt: { $gt: new Date() },
        });
        exports.invitationsPendingTotal.set(pendingCount);
    }
    catch (error) {
        console.error('Error updating invitation metrics:', error);
    }
};
exports.updateInvitationMetrics = updateInvitationMetrics;
const updateUsageMetrics = async () => {
    try {
        const mongoose = require('mongoose');
        const Workplace = mongoose.model('Workplace');
        const workspaces = await Workplace.find({
            subscriptionStatus: { $in: ['trial', 'active'] },
        }).populate('currentSubscriptionId');
        exports.usageStatsGauge.reset();
        workspaces.forEach((workspace) => {
            if (workspace.stats && workspace.currentSubscriptionId) {
                const tier = workspace.currentSubscriptionId.tier;
                exports.usageStatsGauge.set({ resource: 'patients', workspace_id: workspace._id.toString(), tier }, workspace.stats.patientsCount || 0);
                exports.usageStatsGauge.set({ resource: 'users', workspace_id: workspace._id.toString(), tier }, workspace.stats.usersCount || 0);
            }
        });
    }
    catch (error) {
        console.error('Error updating usage metrics:', error);
    }
};
exports.updateUsageMetrics = updateUsageMetrics;
const updateAllMetrics = async () => {
    await Promise.all([
        (0, exports.updateSubscriptionMetrics)(),
        (0, exports.updateWorkspaceMetrics)(),
        (0, exports.updateInvitationMetrics)(),
        (0, exports.updateUsageMetrics)(),
    ]);
};
exports.updateAllMetrics = updateAllMetrics;
//# sourceMappingURL=metrics.js.map