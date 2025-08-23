import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'pharmacist' | 'pharmacy_manager' | 'admin';
    licenseNumber: string;
    pharmacyName: string;
    phoneNumber?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    profileImage?: string;
    isActive: boolean;
    subscription?: mongoose.Types.ObjectId;
    createdAt: Date;
    lastLogin?: Date;
    comparePassword(password: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map