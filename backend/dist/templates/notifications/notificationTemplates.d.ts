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
export declare class NotificationTemplateService {
    private templates;
    constructor();
    getTemplate(type: string, variables?: TemplateVariables): NotificationTemplate;
    private processTemplate;
    private initializeTemplates;
    private getDefaultTemplate;
    static getTemplateVariables(type: string, data: INotificationData, additionalVars?: TemplateVariables): TemplateVariables;
}
export declare const notificationTemplateService: NotificationTemplateService;
//# sourceMappingURL=notificationTemplates.d.ts.map