import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    phone?: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: 'pharmacist' | 'pharmacy_team' | 'pharmacy_outlet' | 'intern_pharmacist' | 'super_admin' | 'owner';
    status: 'pending' | 'active' | 'suspended' | 'license_pending' | 'license_rejected';
    isActive: boolean;
    emailVerified: boolean;
    verificationToken?: string;
    verificationCode?: string;
    resetToken?: string;
    workplaceId?: mongoose.Types.ObjectId;
    workplaceRole?: 'Owner' | 'Staff' | 'Pharmacist' | 'Cashier' | 'Technician' | 'Assistant';
    currentPlanId: mongoose.Types.ObjectId;
    planOverride?: Record<string, any>;
    currentSubscriptionId?: mongoose.Types.ObjectId;
    lastLoginAt?: Date;
    licenseNumber?: string;
    licenseDocument?: {
        fileName: string;
        filePath?: string;
        cloudinaryUrl?: string;
        cloudinaryPublicId?: string;
        uploadedAt: Date;
        fileSize: number;
        mimeType: string;
        uploadMethod: 'cloudinary' | 'local';
    };
    licenseStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
    licenseVerifiedAt?: Date;
    licenseVerifiedBy?: mongoose.Types.ObjectId;
    licenseRejectedAt?: Date;
    licenseRejectedBy?: mongoose.Types.ObjectId;
    licenseRejectionReason?: string;
    licenseExpirationDate?: Date;
    pharmacySchool?: string;
    yearOfGraduation?: number;
    suspensionReason?: string;
    suspendedAt?: Date;
    suspendedBy?: mongoose.Types.ObjectId;
    reactivatedAt?: Date;
    reactivatedBy?: mongoose.Types.ObjectId;
    parentUserId?: mongoose.Types.ObjectId;
    teamMembers?: mongoose.Types.ObjectId[];
    permissions: string[];
    assignedRoles: mongoose.Types.ObjectId[];
    directPermissions: string[];
    deniedPermissions: string[];
    cachedPermissions?: {
        permissions: string[];
        lastUpdated: Date;
        expiresAt: Date;
        workspaceId?: mongoose.Types.ObjectId;
    };
    roleLastModifiedBy?: mongoose.Types.ObjectId;
    roleLastModifiedAt?: Date;
    lastPermissionCheck?: Date;
    features: string[];
    stripeCustomerId?: string;
    notificationPreferences?: {
        email: boolean;
        sms: boolean;
        push: boolean;
        followUpReminders: boolean;
        criticalAlerts: boolean;
        dailyDigest: boolean;
        weeklyReport: boolean;
        manualLab?: {
            criticalAlerts: boolean;
            resultNotifications: boolean;
            orderReminders: boolean;
            aiUpdates: boolean;
            weeklyReports: boolean;
        };
    };
    avatar?: string;
    bio?: string;
    location?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    organization?: string;
    professionalTitle?: string;
    specialization?: string;
    operatingHours?: {
        monday?: {
            open: string;
            close: string;
            closed?: boolean;
        };
        tuesday?: {
            open: string;
            close: string;
            closed?: boolean;
        };
        wednesday?: {
            open: string;
            close: string;
            closed?: boolean;
        };
        thursday?: {
            open: string;
            close: string;
            closed?: boolean;
        };
        friday?: {
            open: string;
            close: string;
            closed?: boolean;
        };
        saturday?: {
            open: string;
            close: string;
            closed?: boolean;
        };
        sunday?: {
            open: string;
            close: string;
            closed?: boolean;
        };
    };
    themePreference?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    dateFormat?: string;
    timeFormat?: '12h' | '24h';
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    sessionTimeout?: number;
    loginNotifications?: boolean;
    profileVisibility?: 'public' | 'organization' | 'private';
    dataSharing?: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
    generateVerificationToken(): string;
    generateVerificationCode(): string;
    generateResetToken(): string;
    hasPermission(permission: string): boolean;
    hasFeature(feature: string): boolean;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export { User };
export default User;
//# sourceMappingURL=User.d.ts.map