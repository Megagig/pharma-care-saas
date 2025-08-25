import mongoose, { Document } from 'mongoose';
export interface ISubscriptionPlan extends Document {
    name: string;
    priceNGN: number;
    billingInterval: 'monthly' | 'yearly';
    tier: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
    trialDuration?: number;
    popularPlan: boolean;
    isContactSales?: boolean;
    whatsappNumber?: string;
    features: {
        patientLimit: number | null;
        reminderSmsMonthlyLimit: number | null;
        reportsExport: boolean;
        careNoteExport: boolean;
        adrModule: boolean;
        multiUserSupport: boolean;
        teamSize: number | null;
        apiAccess: boolean;
        auditLogs: boolean;
        dataBackup: boolean;
        clinicalNotesLimit: number | null;
        patientRecordsLimit?: number | null;
        prioritySupport: boolean;
        emailReminders: boolean;
        smsReminders: boolean;
        advancedReports: boolean;
        drugTherapyManagement: boolean;
        teamManagement: boolean;
        dedicatedSupport: boolean;
        integrations?: boolean;
        customIntegrations?: boolean;
        adrReporting: boolean;
        drugInteractionChecker: boolean;
        doseCalculator: boolean;
        multiLocationDashboard: boolean;
        sharedPatientRecords: boolean;
        groupAnalytics: boolean;
        cdss: boolean;
    };
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISubscriptionPlan, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionPlan> & ISubscriptionPlan & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=SubscriptionPlan.d.ts.map