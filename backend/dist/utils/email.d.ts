interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
interface User {
    email: string;
    firstName: string;
    pharmacyName: string;
}
interface Subscription {
    plan: string;
    endDate: Date;
}
export declare const sendEmail: (options: EmailOptions) => Promise<any>;
export declare const sendWelcomeEmail: (user: User) => Promise<any>;
export declare const sendSubscriptionReminder: (user: User, subscription: Subscription) => Promise<any>;
export {};
//# sourceMappingURL=email.d.ts.map