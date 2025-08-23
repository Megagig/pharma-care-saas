import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    phone?: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: 'pharmacist' | 'technician' | 'owner' | 'admin';
    status: 'pending' | 'active' | 'suspended';
    emailVerified: boolean;
    verificationToken?: string;
    verificationCode?: string;
    resetToken?: string;
    pharmacyId?: mongoose.Types.ObjectId;
    currentPlanId: mongoose.Types.ObjectId;
    planOverride?: Record<string, any>;
    currentSubscriptionId?: mongoose.Types.ObjectId;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
    generateVerificationToken(): string;
    generateVerificationCode(): string;
    generateResetToken(): string;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map