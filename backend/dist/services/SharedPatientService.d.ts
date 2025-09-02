import mongoose from 'mongoose';
import { IWorkplace } from '../models/Workplace';
export interface SharedPatientAccess {
    patientId: mongoose.Types.ObjectId;
    sharedWithLocations: string[];
    sharedBy: mongoose.Types.ObjectId;
    sharedAt: Date;
    accessLevel: 'read' | 'write' | 'full';
    expiresAt?: Date;
}
export interface PatientSharingOptions {
    patientId: mongoose.Types.ObjectId;
    fromLocationId: string;
    toLocationIds: string[];
    accessLevel: 'read' | 'write' | 'full';
    sharedBy: mongoose.Types.ObjectId;
    expiresAt?: Date;
}
export interface CrossLocationPatientAccess {
    patientId: mongoose.Types.ObjectId;
    primaryLocationId: string;
    accessibleLocations: string[];
    accessLevel: 'read' | 'write' | 'full';
    lastAccessedAt?: Date;
}
export declare class SharedPatientService {
    sharePatientWithLocations(options: PatientSharingOptions): Promise<boolean>;
    revokeSharedAccess(patientId: mongoose.Types.ObjectId, locationIds?: string[]): Promise<boolean>;
    getPatientsAccessibleFromLocation(workspaceId: mongoose.Types.ObjectId, locationId: string, includeShared?: boolean): Promise<any[]>;
    getSharedPatientRecords(workspaceId: mongoose.Types.ObjectId): Promise<any[]>;
    checkPatientAccess(patientId: mongoose.Types.ObjectId, locationId: string, workspaceId: mongoose.Types.ObjectId): Promise<{
        hasAccess: boolean;
        accessLevel: 'read' | 'write' | 'full';
        accessType: 'direct' | 'shared' | 'workspace_shared';
    }>;
    createTransferWorkflow(patientId: mongoose.Types.ObjectId, fromLocationId: string, toLocationId: string, transferredBy: mongoose.Types.ObjectId, transferReason?: string): Promise<{
        transferId: string;
        status: 'pending' | 'approved' | 'completed';
    }>;
    completePatientTransfer(patientId: mongoose.Types.ObjectId, transferId: string, completedBy: mongoose.Types.ObjectId): Promise<boolean>;
    getLocationAccessSummary(workspaceId: mongoose.Types.ObjectId, workspace: IWorkplace): Promise<{
        totalPatients: number;
        directlyAssigned: number;
        sharedPatients: number;
        workspaceShared: number;
        locationBreakdown: Array<{
            locationId: string;
            locationName: string;
            directPatients: number;
            accessiblePatients: number;
        }>;
    }>;
    cleanupExpiredSharedAccess(): Promise<number>;
}
declare const _default: SharedPatientService;
export default _default;
//# sourceMappingURL=SharedPatientService.d.ts.map