import mongoose, { Document } from 'mongoose';
export interface ISession extends Document {
    userId: mongoose.Types.ObjectId;
    refreshToken: string;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISession, {}, {}, {}, mongoose.Document<unknown, {}, ISession> & ISession & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Session.d.ts.map