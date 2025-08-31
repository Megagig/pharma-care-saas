import mongoose, { Document } from 'mongoose';
interface IMTRAuditLogModel extends mongoose.Model<IMTRAuditLog> {
    findWithFilters(workplaceId: mongoose.Types.ObjectId, filters?: {
        userId?: mongoose.Types.ObjectId;
        action?: string;
        resourceType?: string;
        complianceCategory?: string;
        riskLevel?: string;
        patientId?: mongoose.Types.ObjectId;
        reviewId?: mongoose.Types.ObjectId;
        startDate?: Date;
        endDate?: Date;
        ipAddress?: string;
    }, options?: {
        page?: number;
        limit?: number;
        sort?: string;
    }): mongoose.Query<IMTRAuditLog[], IMTRAuditLog>;
    getAuditStatistics(workplaceId: mongoose.Types.ObjectId, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<any>;
    findHighRiskActivities(workplaceId: mongoose.Types.ObjectId, hours?: number): mongoose.Query<IMTRAuditLog[], IMTRAuditLog>;
    findSuspiciousActivities(workplaceId: mongoose.Types.ObjectId, hours?: number): mongoose.Aggregate<any[]>;
    createAuditLog(auditData: Partial<IMTRAuditLog>): Promise<IMTRAuditLog>;
}
export interface IMTRAuditLog extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    action: string;
    resourceType: 'MedicationTherapyReview' | 'DrugTherapyProblem' | 'MTRIntervention' | 'MTRFollowUp' | 'Patient' | 'User';
    resourceId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userRole: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestMethod?: string;
    requestUrl?: string;
    oldValues?: any;
    newValues?: any;
    changedFields?: string[];
    patientId?: mongoose.Types.ObjectId;
    reviewId?: mongoose.Types.ObjectId;
    complianceCategory: 'clinical_documentation' | 'patient_safety' | 'data_access' | 'system_security' | 'workflow_compliance';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    details: any;
    errorMessage?: string;
    duration?: number;
    timestamp: Date;
    createdBy: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    actionDisplay: string;
    riskLevelDisplay: string;
    complianceCategoryDisplay: string;
}
declare const _default: IMTRAuditLogModel;
export default _default;
//# sourceMappingURL=MTRAuditLog.d.ts.map