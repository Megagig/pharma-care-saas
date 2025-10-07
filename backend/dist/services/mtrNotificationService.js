"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mtrNotificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const email_1 = require("../utils/email");
const sms_1 = require("../utils/sms");
const logger_1 = __importDefault(require("../utils/logger"));
const MTRFollowUp_1 = __importDefault(require("../models/MTRFollowUp"));
const User_1 = __importDefault(require("../models/User"));
const Patient_1 = __importDefault(require("../models/Patient"));
class MTRNotificationService {
    constructor() {
        this.scheduledNotifications = new Map();
    }
    async scheduleFollowUpReminder(followUpId, reminderType = 'email', scheduledFor) {
        try {
            const followUp = await MTRFollowUp_1.default.findById(followUpId)
                .populate('assignedTo', 'firstName lastName email phone notificationPreferences')
                .populate('patientId', 'firstName lastName contactInfo')
                .populate('reviewId', 'reviewNumber priority');
            if (!followUp) {
                throw new Error('Follow-up not found');
            }
            const assignedUser = followUp.assignedTo;
            const patient = followUp.patientId;
            const review = followUp.reviewId;
            const reminderTime = scheduledFor || new Date(followUp.scheduledDate.getTime() - 2 * 60 * 60 * 1000);
            const preferences = assignedUser.notificationPreferences || {};
            if (!preferences.followUpReminders) {
                logger_1.default.info(`Follow-up reminders disabled for user ${assignedUser._id}`);
                return;
            }
            const notificationData = {
                followUpId: followUp._id,
                patientName: `${patient.firstName} ${patient.lastName}`,
                followUpType: followUp.type,
                scheduledDate: followUp.scheduledDate,
                description: followUp.description,
                reviewNumber: review.reviewNumber,
                priority: followUp.priority,
                estimatedDuration: followUp.estimatedDuration
            };
            if (reminderType === 'email' && preferences.email !== false) {
                await this.scheduleNotification({
                    type: 'follow_up_reminder',
                    recipientId: assignedUser._id,
                    recipientType: 'pharmacist',
                    scheduledFor: reminderTime,
                    priority: followUp.priority === 'high' ? 'high' : 'medium',
                    channels: ['email'],
                    data: notificationData,
                    sent: false,
                    attempts: 0,
                    maxAttempts: 3
                });
            }
            if ((reminderType === 'sms' || followUp.priority === 'high') &&
                preferences.sms !== false &&
                assignedUser.phone) {
                await this.scheduleNotification({
                    type: 'follow_up_reminder',
                    recipientId: assignedUser._id,
                    recipientType: 'pharmacist',
                    scheduledFor: reminderTime,
                    priority: 'high',
                    channels: ['sms'],
                    data: notificationData,
                    sent: false,
                    attempts: 0,
                    maxAttempts: 2
                });
            }
            followUp.reminders.push({
                type: reminderType,
                scheduledFor: reminderTime,
                sent: false,
                recipientId: assignedUser._id,
                message: `Reminder: ${followUp.type} scheduled for ${followUp.scheduledDate.toLocaleString()}`
            });
            await followUp.save();
            logger_1.default.info(`Follow-up reminder scheduled for ${assignedUser.email} at ${reminderTime}`);
        }
        catch (error) {
            logger_1.default.error('Error scheduling follow-up reminder:', error);
            throw error;
        }
    }
    async sendCriticalAlert(alert) {
        try {
            const patient = await Patient_1.default.findById(alert.patientId).populate('workplaceId');
            if (!patient) {
                throw new Error('Patient not found');
            }
            const pharmacists = await User_1.default.find({
                workplaceId: patient.workplaceId,
                role: 'pharmacist',
                status: 'active',
                'notificationPreferences.criticalAlerts': { $ne: false }
            });
            const alertData = {
                alertType: alert.type,
                severity: alert.severity,
                patientName: `${patient.firstName} ${patient.lastName}`,
                patientMRN: patient.mrn,
                message: alert.message,
                details: alert.details,
                timestamp: new Date(),
                requiresImmediate: alert.requiresImmediate
            };
            for (const pharmacist of pharmacists) {
                const channels = [];
                if (pharmacist.email) {
                    channels.push('email');
                }
                if ((alert.severity === 'critical' || alert.requiresImmediate) &&
                    pharmacist.phone &&
                    pharmacist.notificationPreferences?.sms !== false) {
                    channels.push('sms');
                }
                if (channels.length > 0) {
                    await this.scheduleNotification({
                        type: 'critical_alert',
                        recipientId: pharmacist._id,
                        recipientType: 'pharmacist',
                        scheduledFor: new Date(),
                        priority: alert.severity === 'critical' ? 'high' : 'medium',
                        channels,
                        data: alertData,
                        sent: false,
                        attempts: 0,
                        maxAttempts: alert.requiresImmediate ? 5 : 3
                    });
                }
            }
            logger_1.default.info(`Critical alert sent for patient ${patient.mrn}: ${alert.message}`);
        }
        catch (error) {
            logger_1.default.error('Error sending critical alert:', error);
            throw error;
        }
    }
    async checkOverdueFollowUps() {
        try {
            const overdueFollowUps = await MTRFollowUp_1.default.find({
                status: { $in: ['scheduled', 'in_progress'] },
                scheduledDate: { $lt: new Date() }
            })
                .populate('assignedTo', 'firstName lastName email phone notificationPreferences')
                .populate('patientId', 'firstName lastName mrn')
                .populate('reviewId', 'reviewNumber priority');
            for (const followUp of overdueFollowUps) {
                const assignedUser = followUp.assignedTo;
                const patient = followUp.patientId;
                const review = followUp.reviewId;
                const recentAlert = followUp.reminders.find(r => r.type === 'system' &&
                    r.message?.includes('overdue') &&
                    r.scheduledFor > new Date(Date.now() - 24 * 60 * 60 * 1000));
                if (recentAlert) {
                    continue;
                }
                const daysOverdue = Math.floor((Date.now() - followUp.scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
                const alertData = {
                    followUpId: followUp._id,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    patientMRN: patient.mrn,
                    followUpType: followUp.type,
                    scheduledDate: followUp.scheduledDate,
                    daysOverdue,
                    reviewNumber: review.reviewNumber,
                    priority: followUp.priority
                };
                await this.scheduleNotification({
                    type: 'overdue_alert',
                    recipientId: assignedUser._id,
                    recipientType: 'pharmacist',
                    scheduledFor: new Date(),
                    priority: daysOverdue > 7 ? 'high' : 'medium',
                    channels: ['email'],
                    data: alertData,
                    sent: false,
                    attempts: 0,
                    maxAttempts: 3
                });
                followUp.reminders.push({
                    type: 'system',
                    scheduledFor: new Date(),
                    sent: false,
                    message: `Follow-up overdue by ${daysOverdue} days`
                });
                await followUp.save();
            }
            logger_1.default.info(`Checked ${overdueFollowUps.length} overdue follow-ups`);
        }
        catch (error) {
            logger_1.default.error('Error checking overdue follow-ups:', error);
            throw error;
        }
    }
    async scheduleNotification(notification) {
        const id = new mongoose_1.default.Types.ObjectId().toString();
        const scheduledNotification = {
            ...notification,
            id
        };
        this.scheduledNotifications.set(id, scheduledNotification);
        if (notification.scheduledFor <= new Date()) {
            await this.sendNotification(id);
        }
        else {
            setTimeout(() => {
                this.sendNotification(id);
            }, notification.scheduledFor.getTime() - Date.now());
        }
        return id;
    }
    async sendNotification(notificationId) {
        const notification = this.scheduledNotifications.get(notificationId);
        if (!notification || notification.sent) {
            return;
        }
        try {
            notification.attempts++;
            const recipient = await User_1.default.findById(notification.recipientId);
            if (!recipient) {
                throw new Error('Recipient not found');
            }
            for (const channel of notification.channels) {
                switch (channel) {
                    case 'email':
                        await this.sendEmailNotification(notification, recipient);
                        break;
                    case 'sms':
                        await this.sendSMSNotification(notification, recipient);
                        break;
                    case 'push':
                        logger_1.default.info(`Push notification would be sent to ${recipient.email}`);
                        break;
                }
            }
            notification.sent = true;
            notification.sentAt = new Date();
            this.scheduledNotifications.set(notificationId, notification);
            logger_1.default.info(`Notification ${notificationId} sent successfully to ${recipient.email}`);
        }
        catch (error) {
            notification.error = error.message;
            this.scheduledNotifications.set(notificationId, notification);
            logger_1.default.error(`Error sending notification ${notificationId}:`, error);
            if (notification.attempts < notification.maxAttempts) {
                const retryDelay = Math.pow(2, notification.attempts) * 60000;
                setTimeout(() => {
                    this.sendNotification(notificationId);
                }, retryDelay);
            }
        }
    }
    async sendEmailNotification(notification, recipient) {
        let subject;
        let html;
        let text;
        switch (notification.type) {
            case 'follow_up_reminder':
                subject = `MTR Follow-up Reminder - ${notification.data.patientName}`;
                html = this.generateFollowUpReminderEmail(notification.data);
                text = `Reminder: You have a ${notification.data.followUpType} scheduled for ${notification.data.patientName} on ${notification.data.scheduledDate}`;
                break;
            case 'critical_alert':
                subject = `🚨 Critical MTR Alert - ${notification.data.patientName}`;
                html = this.generateCriticalAlertEmail(notification.data);
                text = `CRITICAL ALERT: ${notification.data.message} for patient ${notification.data.patientName}`;
                break;
            case 'overdue_alert':
                subject = `⚠️ Overdue MTR Follow-up - ${notification.data.patientName}`;
                html = this.generateOverdueAlertEmail(notification.data);
                text = `OVERDUE: Follow-up for ${notification.data.patientName} is ${notification.data.daysOverdue} days overdue`;
                break;
            default:
                throw new Error(`Unknown notification type: ${notification.type}`);
        }
        await (0, email_1.sendEmail)({
            to: recipient.email,
            subject,
            html,
            text
        });
    }
    async sendSMSNotification(notification, recipient) {
        if (!recipient.phone) {
            throw new Error('Recipient phone number not available');
        }
        let message;
        switch (notification.type) {
            case 'follow_up_reminder':
                message = `MTR Reminder: ${notification.data.followUpType} for ${notification.data.patientName} scheduled at ${notification.data.scheduledDate.toLocaleTimeString()}`;
                break;
            case 'critical_alert':
                message = `🚨 CRITICAL MTR ALERT: ${notification.data.message} - Patient: ${notification.data.patientName}`;
                break;
            case 'overdue_alert':
                message = `⚠️ OVERDUE: MTR follow-up for ${notification.data.patientName} is ${notification.data.daysOverdue} days overdue`;
                break;
            default:
                throw new Error(`Unknown notification type: ${notification.type}`);
        }
        await (0, sms_1.sendSMS)(recipient.phone, message);
    }
    generateFollowUpReminderEmail(data) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">MTR Follow-up Reminder</h2>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e40af;">Patient Information</h3>
                    <p><strong>Patient:</strong> ${data.patientName}</p>
                    <p><strong>Review:</strong> ${data.reviewNumber}</p>
                    <p><strong>Follow-up Type:</strong> ${data.followUpType.replace('_', ' ').toUpperCase()}</p>
                </div>

                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #92400e;">Scheduled Details</h3>
                    <p><strong>Date & Time:</strong> ${data.scheduledDate.toLocaleString()}</p>
                    <p><strong>Estimated Duration:</strong> ${data.estimatedDuration} minutes</p>
                    <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
                </div>

                <div style="margin: 20px 0;">
                    <h3 style="color: #1e40af;">Description</h3>
                    <p>${data.description}</p>
                </div>

                <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #0277bd;">
                        Please ensure you're prepared for this follow-up session. Review the patient's MTR history and any previous interventions before the appointment.
                    </p>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                    This is an automated reminder from the PharmacyCopilot MTR system. 
                    To update your notification preferences, please log in to your account.
                </p>
            </div>
        `;
    }
    generateCriticalAlertEmail(data) {
        const severityColors = {
            critical: '#dc2626',
            major: '#ea580c',
            moderate: '#d97706'
        };
        const severityColor = severityColors[data.severity] || '#6b7280';
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #fef2f2; border-left: 4px solid ${severityColor}; padding: 20px; margin-bottom: 20px;">
                    <h2 style="color: ${severityColor}; margin-top: 0;">🚨 Critical MTR Alert</h2>
                    <p style="font-size: 16px; font-weight: bold; margin: 0;">
                        ${data.severity.toUpperCase()} SEVERITY - Immediate attention ${data.requiresImmediate ? 'REQUIRED' : 'recommended'}
                    </p>
                </div>

                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e40af;">Patient Information</h3>
                    <p><strong>Patient:</strong> ${data.patientName}</p>
                    <p><strong>MRN:</strong> ${data.patientMRN}</p>
                    <p><strong>Alert Type:</strong> ${data.alertType.replace('_', ' ').toUpperCase()}</p>
                </div>

                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #92400e;">Alert Details</h3>
                    <p><strong>Message:</strong> ${data.message}</p>
                    <p><strong>Timestamp:</strong> ${data.timestamp.toLocaleString()}</p>
                    ${data.details ? `<p><strong>Additional Details:</strong> ${JSON.stringify(data.details, null, 2)}</p>` : ''}
                </div>

                ${data.requiresImmediate ? `
                    <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold; color: #dc2626;">
                            ⚠️ IMMEDIATE ACTION REQUIRED - Please review this patient's case immediately and take appropriate action.
                        </p>
                    </div>
                ` : ''}

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                    This is an automated alert from the PharmacyCopilot MTR system. 
                    Please log in to your account to review the full details and take appropriate action.
                </p>
            </div>
        `;
    }
    generateOverdueAlertEmail(data) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 20px; margin-bottom: 20px;">
                    <h2 style="color: #92400e; margin-top: 0;">⚠️ Overdue MTR Follow-up</h2>
                    <p style="font-size: 16px; font-weight: bold; margin: 0;">
                        Follow-up is ${data.daysOverdue} days overdue
                    </p>
                </div>

                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e40af;">Patient Information</h3>
                    <p><strong>Patient:</strong> ${data.patientName}</p>
                    <p><strong>MRN:</strong> ${data.patientMRN}</p>
                    <p><strong>Review:</strong> ${data.reviewNumber}</p>
                </div>

                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #92400e;">Follow-up Details</h3>
                    <p><strong>Type:</strong> ${data.followUpType.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Originally Scheduled:</strong> ${data.scheduledDate.toLocaleString()}</p>
                    <p><strong>Priority:</strong> ${data.priority.toUpperCase()}</p>
                    <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
                </div>

                <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #0277bd;">
                        Please reschedule or complete this follow-up as soon as possible to ensure continuity of care for this patient.
                    </p>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                    This is an automated reminder from the PharmacyCopilot MTR system. 
                    Please log in to your account to update the follow-up status.
                </p>
            </div>
        `;
    }
    async updateNotificationPreferences(userId, preferences) {
        try {
            await User_1.default.findByIdAndUpdate(userId, { $set: { notificationPreferences: preferences } }, { new: true });
            logger_1.default.info(`Updated notification preferences for user ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Error updating notification preferences:', error);
            throw error;
        }
    }
    async getNotificationStatistics(workplaceId) {
        try {
            const stats = {
                totalScheduled: this.scheduledNotifications.size,
                sent: Array.from(this.scheduledNotifications.values()).filter(n => n.sent).length,
                pending: Array.from(this.scheduledNotifications.values()).filter(n => !n.sent).length,
                failed: Array.from(this.scheduledNotifications.values()).filter(n => n.error).length,
                byType: {},
                byChannel: {}
            };
            Array.from(this.scheduledNotifications.values()).forEach(notification => {
                stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
                notification.channels.forEach(channel => {
                    stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
                });
            });
            return stats;
        }
        catch (error) {
            logger_1.default.error('Error getting notification statistics:', error);
            throw error;
        }
    }
    async processPendingReminders() {
        try {
            const pendingFollowUps = await MTRFollowUp_1.default.find({
                'reminders.sent': false,
                'reminders.scheduledFor': { $lte: new Date() },
                status: { $in: ['scheduled', 'in_progress'] }
            }).populate('assignedTo', 'firstName lastName email phone notificationPreferences');
            for (const followUp of pendingFollowUps) {
                for (const reminder of followUp.reminders) {
                    if (!reminder.sent && reminder.scheduledFor <= new Date()) {
                        try {
                            await this.scheduleFollowUpReminder(followUp._id, reminder.type, new Date());
                            reminder.sent = true;
                            reminder.sentAt = new Date();
                        }
                        catch (error) {
                            logger_1.default.error(`Error processing reminder for follow-up ${followUp._id}:`, error);
                        }
                    }
                }
                await followUp.save();
            }
            logger_1.default.info(`Processed ${pendingFollowUps.length} pending follow-up reminders`);
        }
        catch (error) {
            logger_1.default.error('Error processing pending reminders:', error);
            throw error;
        }
    }
}
exports.mtrNotificationService = new MTRNotificationService();
exports.default = exports.mtrNotificationService;
//# sourceMappingURL=mtrNotificationService.js.map