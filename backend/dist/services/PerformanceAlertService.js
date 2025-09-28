"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceAlertService = exports.PerformanceAlertService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const webhook_1 = require("@slack/webhook");
class PerformanceAlertService {
    constructor(config) {
        this.alertCooldowns = new Map();
        this.emailTransporter = null;
        this.slackWebhook = null;
        this.alertConfig = {
            channels: [
                {
                    type: 'email',
                    enabled: !!process.env.SMTP_HOST,
                    config: {
                        host: process.env.SMTP_HOST,
                        port: parseInt(process.env.SMTP_PORT || '587'),
                        secure: process.env.SMTP_SECURE === 'true',
                        auth: {
                            user: process.env.SMTP_USER,
                            pass: process.env.SMTP_PASS,
                        },
                        from: process.env.ALERT_FROM_EMAIL || 'alerts@pharmacare.com',
                        to: process.env.ALERT_TO_EMAIL?.split(',') || [],
                    },
                },
                {
                    type: 'slack',
                    enabled: !!process.env.SLACK_WEBHOOK_URL,
                    config: {
                        webhookUrl: process.env.SLACK_WEBHOOK_URL,
                        channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
                        username: 'Performance Monitor',
                        iconEmoji: ':warning:',
                    },
                },
            ],
            cooldownPeriod: 15,
            escalationRules: {
                low: { channels: ['slack'], delay: 0 },
                medium: { channels: ['slack', 'email'], delay: 0 },
                high: { channels: ['slack', 'email'], delay: 0 },
                critical: { channels: ['slack', 'email'], delay: 0 },
            },
            ...config,
        };
        this.initializeChannels();
    }
    initializeChannels() {
        const emailChannel = this.alertConfig.channels.find(c => c.type === 'email');
        if (emailChannel?.enabled) {
            try {
                this.emailTransporter = nodemailer_1.default.createTransport(emailChannel.config);
            }
            catch (error) {
                console.error('Failed to initialize email transporter:', error);
            }
        }
        const slackChannel = this.alertConfig.channels.find(c => c.type === 'slack');
        if (slackChannel?.enabled) {
            try {
                this.slackWebhook = new webhook_1.IncomingWebhook(slackChannel.config.webhookUrl);
            }
            catch (error) {
                console.error('Failed to initialize Slack webhook:', error);
            }
        }
    }
    async sendAlert(alert) {
        try {
            const cooldownKey = `${alert.type}:${alert.metric}:${alert.url}`;
            const lastAlert = this.alertCooldowns.get(cooldownKey);
            const now = new Date();
            if (lastAlert) {
                const timeSinceLastAlert = (now.getTime() - lastAlert.getTime()) / (1000 * 60);
                if (timeSinceLastAlert < this.alertConfig.cooldownPeriod) {
                    console.log(`Alert cooldown active for ${cooldownKey}, skipping`);
                    return;
                }
            }
            this.alertCooldowns.set(cooldownKey, now);
            const escalationRule = this.alertConfig.escalationRules[alert.severity];
            if (!escalationRule) {
                console.warn(`No escalation rule found for severity: ${alert.severity}`);
                return;
            }
            const promises = escalationRule.channels.map(async (channelType) => {
                const channel = this.alertConfig.channels.find(c => c.type === channelType && c.enabled);
                if (!channel)
                    return;
                try {
                    switch (channelType) {
                        case 'email':
                            await this.sendEmailAlert(alert, channel);
                            break;
                        case 'slack':
                            await this.sendSlackAlert(alert, channel);
                            break;
                        case 'webhook':
                            await this.sendWebhookAlert(alert, channel);
                            break;
                    }
                }
                catch (error) {
                    console.error(`Failed to send ${channelType} alert:`, error);
                }
            });
            await Promise.allSettled(promises);
            console.log(`Performance alert sent: ${alert.type} - ${alert.metric} - ${alert.severity}`);
        }
        catch (error) {
            console.error('Error sending performance alert:', error);
        }
    }
    async sendEmailAlert(alert, channel) {
        if (!this.emailTransporter) {
            throw new Error('Email transporter not initialized');
        }
        const subject = this.generateEmailSubject(alert);
        const html = this.generateEmailBody(alert);
        await this.emailTransporter.sendMail({
            from: channel.config.from,
            to: channel.config.to,
            subject,
            html,
        });
    }
    async sendSlackAlert(alert, channel) {
        if (!this.slackWebhook) {
            throw new Error('Slack webhook not initialized');
        }
        const color = this.getSeverityColor(alert.severity);
        const message = this.generateSlackMessage(alert);
        await this.slackWebhook.send({
            channel: channel.config.channel,
            username: channel.config.username,
            icon_emoji: channel.config.iconEmoji,
            attachments: [
                {
                    color,
                    title: `Performance Alert: ${alert.type}`,
                    text: message,
                    fields: [
                        {
                            title: 'Metric',
                            value: alert.metric,
                            short: true,
                        },
                        {
                            title: 'Value',
                            value: this.formatMetricValue(alert.metric, alert.value),
                            short: true,
                        },
                        {
                            title: 'Severity',
                            value: alert.severity.toUpperCase(),
                            short: true,
                        },
                        {
                            title: 'URL',
                            value: alert.url,
                            short: false,
                        },
                    ],
                    ts: Math.floor(alert.timestamp.getTime() / 1000).toString(),
                },
            ],
        });
    }
    async sendWebhookAlert(alert, channel) {
        const response = await fetch(channel.config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                alert,
                timestamp: alert.timestamp.toISOString(),
            }),
        });
        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
        }
    }
    generateEmailSubject(alert) {
        return `[${alert.severity.toUpperCase()}] Performance Alert: ${alert.metric} on ${new URL(alert.url).hostname}`;
    }
    generateEmailBody(alert) {
        const formattedValue = this.formatMetricValue(alert.metric, alert.value);
        const thresholdText = alert.threshold ? ` (threshold: ${this.formatMetricValue(alert.metric, alert.threshold)})` : '';
        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: ${this.getSeverityColor(alert.severity)};">
              Performance Alert: ${alert.type}
            </h2>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Alert Details</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Metric:</strong> ${alert.metric}</li>
                <li><strong>Value:</strong> ${formattedValue}${thresholdText}</li>
                <li><strong>Severity:</strong> ${alert.severity.toUpperCase()}</li>
                <li><strong>URL:</strong> <a href="${alert.url}">${alert.url}</a></li>
                <li><strong>Timestamp:</strong> ${alert.timestamp.toLocaleString()}</li>
                ${alert.deviceType ? `<li><strong>Device Type:</strong> ${alert.deviceType}</li>` : ''}
                ${alert.workspaceId ? `<li><strong>Workspace:</strong> ${alert.workspaceId}</li>` : ''}
              </ul>
            </div>

            <div style="margin: 20px 0;">
              <h3>Recommended Actions</h3>
              ${this.generateRecommendations(alert)}
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              This alert was generated by the PharmaCare Performance Monitoring System.
            </div>
          </div>
        </body>
      </html>
    `;
    }
    generateSlackMessage(alert) {
        const formattedValue = this.formatMetricValue(alert.metric, alert.value);
        const thresholdText = alert.threshold ? ` (threshold: ${this.formatMetricValue(alert.metric, alert.threshold)})` : '';
        return `Performance issue detected on ${new URL(alert.url).hostname}\n` +
            `${alert.metric}: ${formattedValue}${thresholdText}\n` +
            `Device: ${alert.deviceType || 'Unknown'} | Time: ${alert.timestamp.toLocaleString()}`;
    }
    generateRecommendations(alert) {
        const recommendations = {
            FCP: [
                'Optimize critical rendering path',
                'Reduce server response time',
                'Minimize render-blocking resources',
            ],
            LCP: [
                'Optimize largest contentful element',
                'Improve server response times',
                'Optimize and compress images',
                'Preload important resources',
            ],
            CLS: [
                'Add size attributes to images and videos',
                'Reserve space for dynamic content',
                'Avoid inserting content above existing content',
            ],
            FID: [
                'Reduce JavaScript execution time',
                'Break up long tasks',
                'Use web workers for heavy computations',
            ],
            TTFB: [
                'Optimize server performance',
                'Use CDN for static assets',
                'Implement caching strategies',
            ],
            INP: [
                'Optimize event handlers',
                'Reduce JavaScript execution time',
                'Use requestIdleCallback for non-critical tasks',
            ],
        };
        const metricRecommendations = recommendations[alert.metric] || ['Review performance optimization strategies'];
        return '<ul>' + metricRecommendations.map(rec => `<li>${rec}</li>`).join('') + '</ul>';
    }
    formatMetricValue(metric, value) {
        if (metric === 'CLS') {
            return value.toFixed(3);
        }
        return `${Math.round(value)}ms`;
    }
    getSeverityColor(severity) {
        switch (severity) {
            case 'critical':
                return '#dc2626';
            case 'high':
                return '#ea580c';
            case 'medium':
                return '#ca8a04';
            case 'low':
                return '#16a34a';
            default:
                return '#6b7280';
        }
    }
    async testAlerts() {
        const results = {};
        const testAlert = {
            type: 'performance_budget_exceeded',
            severity: 'low',
            metric: 'LCP',
            value: 3000,
            threshold: 2500,
            url: 'https://example.com/test',
            timestamp: new Date(),
            deviceType: 'desktop',
        };
        for (const channel of this.alertConfig.channels) {
            if (!channel.enabled) {
                results[channel.type] = false;
                continue;
            }
            try {
                switch (channel.type) {
                    case 'email':
                        await this.sendEmailAlert(testAlert, channel);
                        results[channel.type] = true;
                        break;
                    case 'slack':
                        await this.sendSlackAlert(testAlert, channel);
                        results[channel.type] = true;
                        break;
                    case 'webhook':
                        await this.sendWebhookAlert(testAlert, channel);
                        results[channel.type] = true;
                        break;
                }
            }
            catch (error) {
                console.error(`Test alert failed for ${channel.type}:`, error);
                results[channel.type] = false;
            }
        }
        return results;
    }
    updateConfiguration(config) {
        this.alertConfig = { ...this.alertConfig, ...config };
        this.initializeChannels();
    }
    getConfiguration() {
        return { ...this.alertConfig };
    }
}
exports.PerformanceAlertService = PerformanceAlertService;
exports.performanceAlertService = new PerformanceAlertService();
//# sourceMappingURL=PerformanceAlertService.js.map