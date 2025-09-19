import mongoose from 'mongoose';
import { IWorkplace } from '../models/Workplace';
export interface LocationFilterOptions {
    workspaceId: mongoose.Types.ObjectId;
    locationId?: string;
    includeShared?: boolean;
    userLocationAccess?: string[];
}
export interface LocationAnalytics {
    locationId: string;
    locationName: string;
    statistics: {
        totalPatients: number;
        activePatients: number;
        newPatientsThisMonth: number;
        totalVisits: number;
        totalClinicalNotes: number;
        visitsThisMonth: number;
        clinicalNotesThisMonth: number;
        lastActivity: Date | null;
    };
}
export declare class LocationFilterService {
    buildLocationFilter(options: LocationFilterOptions): any;
    getPatientsForLocation(options: LocationFilterOptions): Promise<any[]>;
    getVisitsForLocation(options: LocationFilterOptions): Promise<any[]>;
    getClinicalNotesForLocation(options: LocationFilterOptions): Promise<any[]>;
    getLocationAnalytics(workspaceId: mongoose.Types.ObjectId, locationId: string, locationName: string): Promise<LocationAnalytics>;
    getWorkspaceLocationAnalytics(workspace: IWorkplace): Promise<LocationAnalytics[]>;
    assignPatientToLocation(patientId: mongoose.Types.ObjectId, locationId: string, workspaceId: mongoose.Types.ObjectId): Promise<boolean>;
    bulkAssignPatientsToLocation(patientIds: mongoose.Types.ObjectId[], locationId: string, workspaceId: mongoose.Types.ObjectId): Promise<{
        success: number;
        failed: number;
    }>;
    removeLocationAssignment(patientIds: mongoose.Types.ObjectId[], workspaceId: mongoose.Types.ObjectId): Promise<{
        success: number;
        failed: number;
    }>;
    transferPatientsBetweenLocations(patientIds: mongoose.Types.ObjectId[], fromLocationId: string, toLocationId: string, workspaceId: mongoose.Types.ObjectId): Promise<{
        success: number;
        failed: number;
    }>;
    assignVisitToLocation(visitId: mongoose.Types.ObjectId, locationId: string, workspaceId: mongoose.Types.ObjectId): Promise<boolean>;
    assignClinicalNoteToLocation(clinicalNoteId: mongoose.Types.ObjectId, locationId: string, workspaceId: mongoose.Types.ObjectId): Promise<boolean>;
    getSharedPatients(workspaceId: mongoose.Types.ObjectId): Promise<any[]>;
    validateLocationAccess(requestedLocationId: string, userLocationAccess: string[], allowSharedAccess?: boolean): boolean;
    getLocationDistributionSummary(workspaceId: mongoose.Types.ObjectId): Promise<{
        totalPatients: number;
        locationDistribution: {
            locationId: string;
            count: number;
            percentage: number;
        }[];
        sharedPatients: number;
    }>;
}
declare const _default: LocationFilterService;
export default _default;
//# sourceMappingURL=LocationFilterService.d.ts.map