"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageAlertService = void 0;
const Workplace_1 = __importDefault(require("../models/Workplace"));
const User_1 = __importDefault(require("../models/User"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const usageLimits_1 = require("../middlewares/usageLimits");
const emailService_1 = __importDefault(require("../utils/emailService"));
const logger_1 = __importDefault(require("../utils/logger"));
class UsageAlertService {
    async checkAndSendUsageAlerts() {
        try {
            logger_1.default.info('Starting usage alert check for all workspaces');
            const workspaces = await Workplace_1.default.find({
                subscriptionStatus: { $in: ['trial', 'active'] }
            }).populate('ownerId currentPlanId currentSubscriptionId');
            let totalAlerts = 0;
            let notificationsSent = 0;
            for (const workspace of workspaces) {
                try {
                    const alerts = await this.checkWorkspaceUsageAlerts(workspace);
                    if (alerts.length > 0) {
                        totalAlerts += alerts.length;
                        const notificationSent = await this.sendUsageAlertNotification(workspace, alerts);
                        if (notificationSent) {
                            notificationsSent++;
                        }
                    }
                }
                catch (error) {
                    logger_1.default.error(`Error checking alerts for workspace ${workspace._id}:`, error);
                }
            }
            logger_1.default.info(`Usage alert check completed: ${totalAlerts} alerts found, ${notificationsSent} notifications sent`);
        }
        catch (error) {
            logger_1.default.error('Error in usage alert check:', error);
            throw error;
        }
    }
    async checkWorkspaceUsageAlerts(workspace) {
        try {
            const subscription = await Subscription_1.default.findById(workspace.currentSubscriptionId);
            const plan = await SubscriptionPlan_1.default.findById(workspace.currentPlanId);
            if (!subscription || !plan) {
                logger_1.default.warn(`Missing subscription or plan for workspace ${workspace._id}`);
                return [];
            }
            const planLimits = {
                patients: plan.features.patientLimit,
                users: plan.features.teamSize,
                storage: null,
                apiCalls: null
            };
            const usageStats = await (0, usageLimits_1.getWorkspaceUsageStats)(workspace, planLimits);
            const alerts = [];
            Object.entries(usageStats).forEach(([resource, stats]) => {
                if (stats.isAtLimit) {
                    alerts.push({
                        workspaceId: workspace._id.toString(),
                        workspaceName: workspace.name,
                        resource,
                        currentUsage: stats.currentUsage,
                        limit: stats.limit,
                        percentage: Math.round((stats.currentUsage / stats.limit) * 100),
                        severity: 'critical',
                        alertType: 'limit_exceeded'
                    });
                }
                else if (stats.isAtWarning) {
                    alerts.push({
                        workspaceId: workspace._id.toString(),
                        workspaceName: workspace.name,
                        resource,
                        currentUsage: stats.currentUsage,
                        limit: stats.limit,
                        percentage: Math.round((stats.currentUsage / stats.limit) * 100),
                        severity: 'warning',
                        alertType: 'approaching_limit'
                    });
                }
            });
            return alerts;
        }
        catch (error) {
            logger_1.default.error(`Error checking usage alerts for workspace ${workspace._id}:`, error);
            return [];
        }
    }
    async sendUsageAlertNotification(workspace, alerts) {
        try {
            const owner = await User_1.default.findById(workspace.ownerId);
            if (!owner) {
                logger_1.default.warn(`Owner not found for workspace ${workspace._id}`);
                return false;
            }
            const plan = await SubscriptionPlan_1.default.findById(workspace.currentPlanId);
            const planName = plan?.name || 'Unknown Plan';
            const notificationData = {
                workspace,
                alerts,
                ownerEmail: owner.email,
                ownerName: `${owner.firstName} ${owner.lastName}`,
                planName
            };
            const hasCriticalAlerts = alerts.some(alert => alert.severity === 'critical');
            const templateType = hasCriticalAlerts ? 'usage_limit_exceeded' : 'usage_warning';
            await this.sendUsageAlertEmail(notificationData, templateType);
            logger_1.default.info(`Usage alert notification sent to ${owner.email} for workspace ${workspace.name}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Error sending usage alert notification for workspace ${workspace._id}:`, error);
            return false;
        }
    }
    async sendUsageAlertEmail(data, templateType) {
        const { workspace, alerts, ownerEmail, ownerName, planName } = data;
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
        const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
        const subject = templateType === 'usage_limit_exceeded'
            ? `🚨 Usage Limits Exceeded - ${workspace.name}`
            : `⚠️ Usage Warning - ${workspace.name}`;
        const alertSummary = alerts.map(alert => {
            const icon = alert.severity === 'critical' ? '🚨' : '⚠️';
            return `${icon} ${alert.resource}: ${alert.currentUsage}/${alert.limit} (${alert.percentage}%)`;
        }).join('\n');
        const recommendations = this.generateAlertRecommendations(alerts);
        const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${templateType === 'usage_limit_exceeded' ? '#dc3545' : '#ffc107'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">${templateType === 'usage_limit_exceeded' ? '🚨 Usage Limits Exceeded' : '⚠️ Usage Warning'}</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <p>Hello ${ownerName},</p>
          
          <p>We're writing to inform you about usage alerts for your workspace <strong>${workspace.name}</strong>.</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Current Plan: ${planName}</h3>
            
            <h4>Usage Alerts:</h4>
            <div style="font-family: monospace; background: #f1f3f4; padding: 10px; border-radius: 3px;">
              ${alertSummary.replace(/\n/g, '<br>')}
            </div>
          </div>

          ${criticalAlerts.length > 0 ? `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #721c24; margin-top: 0;">⚠️ Immediate Action Required</h4>
              <p style="color: #721c24;">Some of your usage limits have been exceeded. This may affect your ability to create new resources.</p>
            </div>
          ` : ''}

          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4>Recommendations:</h4>
            <ul>
              ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/subscriptions" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Upgrade Your Plan
            </a>
          </div>

          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The PharmacyCopilot Team</p>
        </div>
        
        <div style="background: #6c757d; color: white; padding: 10px; text-align: center; font-size: 12px;">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    `;
        await emailService_1.default.sendEmail({
            to: ownerEmail,
            subject,
            text: `Usage Alert for ${workspace.name}`,
            html: emailContent
        });
    }
    generateAlertRecommendations(alerts) {
        const recommendations = [];
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
        const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
        if (criticalAlerts.length > 0) {
            recommendations.push('Upgrade your plan immediately to restore full functionality');
            recommendations.push('Consider archiving or removing unused data to free up space');
        }
        if (warningAlerts.length > 0) {
            recommendations.push('Plan an upgrade before reaching your limits');
            recommendations.push('Review your usage patterns to optimize resource consumption');
        }
        const patientAlerts = alerts.filter(alert => alert.resource === 'patients');
        const userAlerts = alerts.filter(alert => alert.resource === 'users');
        const storageAlerts = alerts.filter(alert => alert.resource === 'storage');
        if (patientAlerts.length > 0) {
            recommendations.push('Consider archiving inactive patient records');
        }
        if (userAlerts.length > 0) {
            recommendations.push('Review team member access and remove inactive users');
        }
        if (storageAlerts.length > 0) {
            recommendations.push('Clean up old files and documents to free up storage space');
        }
        return recommendations;
    }
    async getWorkspaceAlertSummary(workspaceId) {
        try {
            const workspace = await Workplace_1.default.findById(workspaceId);
            if (!workspace) {
                throw new Error('Workspace not found');
            }
            const alerts = await this.checkWorkspaceUsageAlerts(workspace);
            return {
                totalAlerts: alerts.length,
                criticalAlerts: alerts.filter(alert => alert.severity === 'critical').length,
                warningAlerts: alerts.filter(alert => alert.severity === 'warning').length,
                alerts
            };
        }
        catch (error) {
            logger_1.default.error(`Error getting alert summary for workspace ${workspaceId}:`, error);
            throw error;
        }
    }
    shouldSendAlert(workspace, alerts) {
        const hasCriticalAlerts = alerts.some(alert => alert.severity === 'critical');
        if (hasCriticalAlerts) {
            return true;
        }
        return true;
    }
}
exports.UsageAlertService = UsageAlertService;
exports.default = new UsageAlertService();
//# sourceMappingURL=UsageAlertService.js.map