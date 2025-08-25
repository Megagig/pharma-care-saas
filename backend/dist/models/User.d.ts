import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    phone?: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: 'pharmacist' | 'pharmacy_team' | 'pharmacy_outlet' | 'intern_pharmacist' | 'super_admin';
    status: 'pending' | 'active' | 'suspended' | 'license_pending' | 'license_rejected';
    emailVerified: boolean;
    verificationToken?: string;
    verificationCode?: string;
    resetToken?: string;
    pharmacyId?: mongoose.Types.ObjectId;
    currentPlanId: mongoose.Types.ObjectId;
    planOverride?: Record<string, any>;
    currentSubscriptionId?: mongoose.Types.ObjectId;
    lastLoginAt?: Date;
    licenseNumber?: string;
    licenseDocument?: {
        fileName: string;
        filePath: string;
        uploadedAt: Date;
        fileSize: number;
        mimeType: string;
    };
    licenseStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
    licenseVerifiedAt?: Date;
    licenseVerifiedBy?: mongoose.Types.ObjectId;
    licenseRejectionReason?: string;
    parentUserId?: mongoose.Types.ObjectId;
    teamMembers?: mongoose.Types.ObjectId[];
    permissions: string[];
    subscriptionTier: 'free_trial' | 'basic' | 'pro' | 'pharmily' | 'network' | 'enterprise';
    trialStartDate?: Date;
    trialEndDate?: Date;
    features: string[];
    stripeCustomerId?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
    generateVerificationToken(): string;
    generateVerificationCode(): string;
    generateResetToken(): string;
    hasPermission(permission: string): boolean;
    hasFeature(feature: string): boolean;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map