import mongoose, { Document } from 'mongoose';
export interface IWorkplace extends Document {
    name: string;
    type: 'Community' | 'Hospital' | 'Academia' | 'Industry' | 'Regulatory Body' | 'Other';
    licenseNumber: string;
    email: string;
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
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IWorkplace, {}, {}, {}, mongoose.Document<unknown, {}, IWorkplace> & IWorkplace & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Workplace.d.ts.map