import mongoose, { Document } from 'mongoose';
export interface LocationInfo {
    id: string;
    name: string;
    address: string;
    isPrimary: boolean;
    metadata?: Record<string, any>;
}
export interface WorkspaceStats {
    patientsCount: number;
    usersCount: number;
    storageUsed?: number;
    apiCallsThisMonth?: number;
    lastUpdated: Date;
}
export interface WorkspaceSettings {
    maxPendingInvites: number;
    allowSharedPatients: boolean;
}
export interface IWorkplace extends Document {
    name: string;
    type: 'Community' | 'Hospital' | 'Academia' | 'Industry' | 'Regulatory Body' | 'Other';
    licenseNumber: string;
    email: string;
    phone?: string;
    address?: string;
    state?: string;
    lga?: string;
    ownerId: mongoose.Types.ObjectId;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    documents: Array<{
        kind: string;
        url: string;
        uploadedAt: Date;
    }>;
    logoUrl?: string;
    inviteCode: string;
    teamMembers: mongoose.Types.ObjectId[];
    currentSubscriptionId?: mongoose.Types.ObjectId;
    subscriptionId?: mongoose.Types.ObjectId;
    currentPlanId?: mongoose.Types.ObjectId;
    subscriptionStatus: 'trial' | 'active' | 'past_due' | 'expired' | 'canceled';
    trialStartDate?: Date;
    trialEndDate?: Date;
    stats: WorkspaceStats;
    locations: LocationInfo[];
    settings: WorkspaceSettings;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IWorkplace, {}, {}, {}, mongoose.Document<unknown, {}, IWorkplace> & IWorkplace & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Workplace.d.ts.map