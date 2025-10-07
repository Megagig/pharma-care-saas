import { INotificationData } from '../../models/Notification';

export interface NotificationTemplate {
    subject: string;
    content: string;
    htmlTemplate?: string;
    smsTemplate?: string;
    emailTemplate?: string;
}

export interface TemplateVariables {
    [key: string]: any;
}

/**
 * Communication Hub notification templates
 */
export class NotificationTemplateService {
    private templates: Map<string, NotificationTemplate> = new Map();

    constructor() {
        this.initializeTemplates();
    }

    /**
     * Get template for notification type
     */
    getTemplate(type: string, variables: TemplateVariables = {}): NotificationTemplate {
        const template = this.templates.get(type);
        if (!template) {
            return this.getDefaultTemplate(variables);
        }

        return this.processTemplate(template, variables);
    }

    /**
     * Process template with variables
     */
    private processTemplate(template: NotificationTemplate, variables: TemplateVariables): NotificationTemplate {
        const processString = (str: string): string => {
            return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return variables[key] || match;
            });
        };

        return {
            subject: processString(template.subject),
            content: processString(template.content),
            htmlTemplate: template.htmlTemplate ? processString(template.htmlTemplate) : undefined,
            smsTemplate: template.smsTemplate ? processString(template.smsTemplate) : undefined,
            emailTemplate: template.emailTemplate ? processString(template.emailTemplate) : undefined,
        };
    }

    /**
     * Initialize all notification templates
     */
    private initializeTemplates(): void {
        // New Message Templates
        this.templates.set('new_message', {
            subject: 'New Message from {{senderName}}',
            content: '{{senderName}} sent you a message in {{conversationTitle}}',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #2563eb; margin-top: 0;">💬 New Message</h2>
                        <p style="font-size: 16px; margin: 0;">
                            <strong>{{senderName}}</strong> sent you a message in <strong>{{conversationTitle}}</strong>
                        </p>
                    </div>
                    
                    {{#if messagePreview}}
                    <div style="background-color: #ffffff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-style: italic; color: #4b5563;">
                            "{{messagePreview}}"
                        </p>
                    </div>
                    {{/if}}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            View Conversation
                        </a>
                    </div>
                    
                    {{#if patientInfo}}
                    <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #0369a1;">Patient Information</h4>
                        <p style="margin: 5px 0;"><strong>Name:</strong> {{patientInfo.name}}</p>
                        <p style="margin: 5px 0;"><strong>MRN:</strong> {{patientInfo.mrn}}</p>
                    </div>
                    {{/if}}
                </div>
            `,
            smsTemplate: 'New message from {{senderName}}: {{messagePreview}}',
            emailTemplate: `
                <h3>New Message from {{senderName}}</h3>
                <p>You have received a new message in <strong>{{conversationTitle}}</strong></p>
                {{#if messagePreview}}<blockquote>{{messagePreview}}</blockquote>{{/if}}
                <p><a href="{{actionUrl}}">View Conversation</a></p>
            `,
        });

        // Mention Templates
        this.templates.set('mention', {
            subject: 'You were mentioned by {{senderName}}',
            content: '{{senderName}} mentioned you in {{conversationTitle}}',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #92400e; margin-top: 0;">🏷️ You were mentioned</h2>
                        <p style="font-size: 16px; margin: 0;">
                            <strong>{{senderName}}</strong> mentioned you in <strong>{{conversationTitle}}</strong>
                        </p>
                    </div>
                    
                    <div style="background-color: #ffffff; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #4b5563;">
                            "{{messagePreview}}"
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            View Message
                        </a>
                    </div>
                </div>
            `,
            smsTemplate: '{{senderName}} mentioned you: {{messagePreview}}',
        });

        // Patient Query Templates
        this.templates.set('patient_query', {
            subject: 'New Patient Query from {{patientName}}',
            content: 'Patient {{patientName}} has sent a new query',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #047857; margin-top: 0;">🏥 New Patient Query</h2>
                        <p style="font-size: 16px; margin: 0;">
                            Patient <strong>{{patientName}}</strong> has sent a new query
                        </p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1e40af;">Patient Information</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> {{patientName}}</p>
                        <p style="margin: 5px 0;"><strong>MRN:</strong> {{patientMRN}}</p>
                        <p style="margin: 5px 0;"><strong>Query Time:</strong> {{queryTime}}</p>
                    </div>
                    
                    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #374151;">Patient's Query:</h4>
                        <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                            {{queryPreview}}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            Respond to Query
                        </a>
                    </div>
                    
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #92400e;">
                            ⚠️ <strong>Response Time:</strong> Please respond to patient queries within 2 hours during business hours.
                        </p>
                    </div>
                </div>
            `,
            smsTemplate: 'New patient query from {{patientName}}: {{queryPreview}}',
        });

        // Conversation Invite Templates
        this.templates.set('conversation_invite', {
            subject: 'Invited to conversation by {{senderName}}',
            content: '{{senderName}} invited you to join {{conversationTitle}}',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #0369a1; margin-top: 0;">👥 Conversation Invitation</h2>
                        <p style="font-size: 16px; margin: 0;">
                            <strong>{{senderName}}</strong> invited you to join <strong>{{conversationTitle}}</strong>
                        </p>
                    </div>
                    
                    {{#if conversationDescription}}
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #374151;">About this conversation:</h4>
                        <p style="margin: 0; color: #4b5563;">{{conversationDescription}}</p>
                    </div>
                    {{/if}}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            Join Conversation
                        </a>
                    </div>
                </div>
            `,
            smsTemplate: '{{senderName}} invited you to join {{conversationTitle}}',
        });

        // Urgent Message Templates
        this.templates.set('urgent_message', {
            subject: '🚨 URGENT: Message from {{senderName}}',
            content: 'URGENT: {{senderName}} sent you an urgent message',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #dc2626; margin-top: 0;">🚨 URGENT MESSAGE</h2>
                        <p style="font-size: 16px; margin: 0; font-weight: bold;">
                            <strong>{{senderName}}</strong> sent you an urgent message in <strong>{{conversationTitle}}</strong>
                        </p>
                    </div>
                    
                    <div style="background-color: #ffffff; border: 2px solid #dc2626; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; color: #4b5563; font-weight: 600;">
                            {{messagePreview}}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            View Urgent Message
                        </a>
                    </div>
                    
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: 600;">
                            ⚠️ This message requires immediate attention. Please respond as soon as possible.
                        </p>
                    </div>
                </div>
            `,
            smsTemplate: '🚨 URGENT from {{senderName}}: {{messagePreview}}',
        });

        // Clinical Alert Templates
        this.templates.set('clinical_alert', {
            subject: '⚕️ Clinical Alert: {{alertType}}',
            content: 'Clinical alert for patient {{patientName}}: {{alertMessage}}',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #92400e; margin-top: 0;">⚕️ Clinical Alert</h2>
                        <p style="font-size: 16px; margin: 0; font-weight: bold;">
                            {{alertType}} - {{severity}} Priority
                        </p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1e40af;">Patient Information</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> {{patientName}}</p>
                        <p style="margin: 5px 0;"><strong>MRN:</strong> {{patientMRN}}</p>
                        <p style="margin: 5px 0;"><strong>Alert Time:</strong> {{alertTime}}</p>
                    </div>
                    
                    <div style="background-color: #ffffff; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #92400e;">Alert Details:</h4>
                        <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                            {{alertMessage}}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            Review Alert
                        </a>
                    </div>
                </div>
            `,
            smsTemplate: '⚕️ Clinical Alert for {{patientName}}: {{alertMessage}}',
        });

        // Therapy Update Templates
        this.templates.set('therapy_update', {
            subject: 'Therapy Update for {{patientName}}',
            content: 'Therapy plan updated for patient {{patientName}}',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #15803d; margin-top: 0;">💊 Therapy Update</h2>
                        <p style="font-size: 16px; margin: 0;">
                            Therapy plan updated for <strong>{{patientName}}</strong>
                        </p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1e40af;">Update Details</h3>
                        <p style="margin: 5px 0;"><strong>Patient:</strong> {{patientName}} ({{patientMRN}})</p>
                        <p style="margin: 5px 0;"><strong>Updated by:</strong> {{updatedBy}}</p>
                        <p style="margin: 5px 0;"><strong>Update Time:</strong> {{updateTime}}</p>
                    </div>
                    
                    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #374151;">Changes Made:</h4>
                        <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                            {{updateDescription}}
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            View Therapy Plan
                        </a>
                    </div>
                </div>
            `,
            smsTemplate: 'Therapy updated for {{patientName}}: {{updateDescription}}',
        });

        // File Shared Templates
        this.templates.set('file_shared', {
            subject: 'File shared by {{senderName}}',
            content: '{{senderName}} shared a file with you: {{fileName}}',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #4338ca; margin-top: 0;">📎 File Shared</h2>
                        <p style="font-size: 16px; margin: 0;">
                            <strong>{{senderName}}</strong> shared a file with you
                        </p>
                    </div>
                    
                    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #374151;">File Details</h3>
                        <p style="margin: 5px 0;"><strong>File Name:</strong> {{fileName}}</p>
                        <p style="margin: 5px 0;"><strong>File Size:</strong> {{fileSize}}</p>
                        <p style="margin: 5px 0;"><strong>File Type:</strong> {{fileType}}</p>
                        <p style="margin: 5px 0;"><strong>Shared in:</strong> {{conversationTitle}}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            View File
                        </a>
                    </div>
                </div>
            `,
            smsTemplate: '{{senderName}} shared {{fileName}} with you',
        });

        // System Notification Templates
        this.templates.set('system_notification', {
            subject: 'PharmacyCopilot System Notification',
            content: '{{notificationMessage}}',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #475569; margin-top: 0;">🔔 System Notification</h2>
                        <p style="font-size: 16px; margin: 0;">
                            PharmacyCopilot System Update
                        </p>
                    </div>
                    
                    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #4b5563; line-height: 1.6;">
                            {{notificationMessage}}
                        </p>
                    </div>
                    
                    {{#if actionUrl}}
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{actionUrl}}" style="background-color: #64748b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            Learn More
                        </a>
                    </div>
                    {{/if}}
                </div>
            `,
            smsTemplate: 'PharmacyCopilot: {{notificationMessage}}',
        });
    }

    /**
     * Get default template for unknown types
     */
    private getDefaultTemplate(variables: TemplateVariables): NotificationTemplate {
        return {
            subject: variables.title || 'PharmacyCopilot Notification',
            content: variables.content || 'You have a new notification from PharmacyCopilot',
            htmlTemplate: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #2563eb; margin-top: 0;">PharmacyCopilot Notification</h2>
                        <p style="margin: 0; color: #4b5563;">
                            ${variables.content || 'You have a new notification from PharmacyCopilot'}
                        </p>
                    </div>
                </div>
            `,
            smsTemplate: variables.content || 'PharmacyCopilot notification',
        };
    }

    /**
     * Get template variables from notification data
     */
    static getTemplateVariables(type: string, data: INotificationData, additionalVars: TemplateVariables = {}): TemplateVariables {
        const baseVars = {
            actionUrl: data.actionUrl || '#',
            timestamp: new Date().toLocaleString(),
            ...additionalVars,
        };

        // Add type-specific variables
        switch (type) {
            case 'new_message':
            case 'mention':
            case 'urgent_message':
                return {
                    ...baseVars,
                    conversationId: data.conversationId?.toString(),
                    messageId: data.messageId?.toString(),
                    senderId: data.senderId?.toString(),
                    ...data.metadata,
                };

            case 'patient_query':
                return {
                    ...baseVars,
                    patientId: data.patientId?.toString(),
                    conversationId: data.conversationId?.toString(),
                    queryTime: new Date().toLocaleString(),
                    ...data.metadata,
                };

            case 'clinical_alert':
                return {
                    ...baseVars,
                    patientId: data.patientId?.toString(),
                    alertTime: new Date().toLocaleString(),
                    ...data.metadata,
                };

            case 'therapy_update':
                return {
                    ...baseVars,
                    patientId: data.patientId?.toString(),
                    updateTime: new Date().toLocaleString(),
                    ...data.metadata,
                };

            case 'file_shared':
                return {
                    ...baseVars,
                    conversationId: data.conversationId?.toString(),
                    senderId: data.senderId?.toString(),
                    ...data.metadata,
                };

            default:
                return {
                    ...baseVars,
                    ...data.metadata,
                };
        }
    }
}

export const notificationTemplateService = new NotificationTemplateService();