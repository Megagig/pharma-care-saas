import mongoose, { Document } from 'mongoose';
export interface IPharmacy extends Document {
    name: string;
    licenseNumber: string;
    address: string;
    state: string;
    lga: string;
    ownerId: mongoose.Types.ObjectId;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    documents: Array<{
        kind: string;
        url: string;
        uploadedAt: Date;
    }>;
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPharmacy, {}, {}, {}, mongoose.Document<unknown, {}, IPharmacy> & IPharmacy & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Pharmacy.d.ts.map