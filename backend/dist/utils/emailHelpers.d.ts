interface SendEmailOptions {
    to: string;
    subject: string;
    template?: string;
    data?: Record<string, any>;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        path: string;
    }>;
}
export declare const sendTemplatedEmail: (options: SendEmailOptions) => Promise<any>;
export declare const sendBulkEmails: (recipients: string[], options: Omit<SendEmailOptions, "to">) => Promise<any[]>;
export declare const isValidEmail: (email: string) => boolean;
export declare const sanitizeEmailContent: (content: string) => string;
export declare function sendEmail(to: string, subject: string, body: string): Promise<void>;
export {};
//# sourceMappingURL=emailHelpers.d.ts.map