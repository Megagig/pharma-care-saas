import { IWorkplace } from '../models/Workplace';
import mongoose from 'mongoose';
export interface CreateWorkplaceData {
    name: string;
    type: 'Community' | 'Hospital' | 'Academia' | 'Industry' | 'Regulatory Body' | 'Other';
    licenseNumber: string;
    email: string;
    address?: string;
    state?: string;
    lga?: string;
    ownerId: mongoose.Types.ObjectId;
}
export interface JoinWorkplaceData {
    userId: mongoose.Types.ObjectId;
    inviteCode?: string;
    workplaceId?: mongoose.Types.ObjectId;
    workplaceRole?: 'Staff' | 'Pharmacist' | 'Cashier' | 'Technician' | 'Assistant';
}
export declare class WorkplaceService {
    createWorkplace(data: CreateWorkplaceData): Promise<IWorkplace>;
    joinWorkplace(data: JoinWorkplaceData): Promise<IWorkplace>;
    findByInviteCode(inviteCode: string): Promise<IWorkplace | null>;
    regenerateInviteCode(workplaceId: mongoose.Types.ObjectId): Promise<string>;
    getWorkplaceWithTeam(workplaceId: mongoose.Types.ObjectId): Promise<IWorkplace | null>;
    removeFromWorkplace(workplaceId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<void>;
    canAccessWorkplaceFeatures(userId: mongoose.Types.ObjectId): Promise<boolean>;
}
declare const _default: WorkplaceService;
export default _default;
//# sourceMappingURL=WorkplaceService.d.ts.map