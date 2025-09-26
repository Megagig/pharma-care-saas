import mongoose from 'mongoose';
import { IDiagnosticFollowUp, IFollowUpOutcome } from '../models/DiagnosticFollowUp';
import { IDiagnosticResult } from '../models/DiagnosticResult';
export interface CreateFollowUpRequest {
    diagnosticRequestId: mongoose.Types.ObjectId;
    diagnosticResultId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    type: IDiagnosticFollowUp['type'];
    priority?: IDiagnosticFollowUp['priority'];
    description: string;
    objectives?: string[];
    scheduledDate: Date;
    estimatedDuration?: number;
    assignedTo: mongoose.Types.ObjectId;
    autoScheduled?: boolean;
    schedulingRule?: IDiagnosticFollowUp['schedulingRule'];
}
export interface FollowUpSchedulingRule {
    basedOn: 'diagnosis_severity' | 'medication_type' | 'red_flags' | 'patient_risk';
    interval: number;
    maxFollowUps?: number;
    conditions?: string[];
}
export interface FollowUpAnalytics {
    totalFollowUps: number;
    completedFollowUps: number;
    missedFollowUps: number;
    overdueFollowUps: number;
    completionRate: number;
    averageDuration: number;
    followUpsByType: Record<string, number>;
    followUpsByPriority: Record<string, number>;
    outcomeDistribution: Record<string, number>;
}
declare class DiagnosticFollowUpService {
    createFollowUp(workplaceId: mongoose.Types.ObjectId, followUpData: CreateFollowUpRequest, createdBy: mongoose.Types.ObjectId): Promise<IDiagnosticFollowUp>;
    autoScheduleFollowUps(diagnosticResult: IDiagnosticResult, assignedTo: mongoose.Types.ObjectId): Promise<IDiagnosticFollowUp[]>;
    completeFollowUp(followUpId: mongoose.Types.ObjectId, outcome: IFollowUpOutcome, completedBy: mongoose.Types.ObjectId): Promise<IDiagnosticFollowUp>;
    rescheduleFollowUp(followUpId: mongoose.Types.ObjectId, newDate: Date, reason: string, rescheduledBy: mongoose.Types.ObjectId): Promise<IDiagnosticFollowUp>;
    getPatientFollowUps(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, options?: {
        status?: string;
        type?: string;
        limit?: number;
        skip?: number;
    }): Promise<IDiagnosticFollowUp[]>;
    getOverdueFollowUps(workplaceId: mongoose.Types.ObjectId): Promise<IDiagnosticFollowUp[]>;
    getFollowUpAnalytics(workplaceId: mongoose.Types.ObjectId, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<FollowUpAnalytics>;
    processMissedFollowUps(): Promise<void>;
    private determineSchedulingRules;
    private getFollowUpTypeForRule;
    private getPriorityForRule;
    private generateFollowUpDescription;
    private generateFollowUpObjectives;
    private getEstimatedDuration;
    private scheduleNextFollowUp;
}
export declare const diagnosticFollowUpService: DiagnosticFollowUpService;
export default diagnosticFollowUpService;
//# sourceMappingURL=diagnosticFollowUpService.d.ts.map