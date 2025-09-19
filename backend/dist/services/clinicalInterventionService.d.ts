import mongoose from 'mongoose';
import { IClinicalIntervention, IInterventionStrategy, ITeamAssignment, IInterventionOutcome } from '../models/ClinicalIntervention';
export interface AuditContext {
    userId: string;
    workspaceId: string;
    sessionId?: string;
}
export interface AuditLogData {
    action: string;
    userId: string;
    interventionId?: string;
    details: Record<string, any>;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    complianceCategory: string;
    changedFields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    workspaceId?: string;
}
export interface CreateInterventionDTO {
    patientId: mongoose.Types.ObjectId;
    category: string;
    priority: string;
    issueDescription: string;
    identifiedBy: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    strategies?: IInterventionStrategy[];
    estimatedDuration?: number;
    relatedMTRId?: mongoose.Types.ObjectId;
    relatedDTPIds?: mongoose.Types.ObjectId[];
}
export interface UpdateInterventionDTO {
    category?: string;
    priority?: string;
    issueDescription?: string;
    status?: string;
    implementationNotes?: string;
    estimatedDuration?: number;
    outcomes?: IInterventionOutcome;
    followUp?: {
        required?: boolean;
        scheduledDate?: Date;
        notes?: string;
        nextReviewDate?: Date;
    };
}
export interface InterventionFilters {
    workplaceId: mongoose.Types.ObjectId;
    patientId?: mongoose.Types.ObjectId;
    category?: string;
    priority?: string;
    status?: string;
    identifiedBy?: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface StrategyRecommendation {
    type: string;
    label: string;
    description: string;
    rationale: string;
    expectedOutcome: string;
    priority: 'primary' | 'secondary';
    applicableCategories: string[];
}
export interface OutcomeMetrics {
    totalInterventions: number;
    completedInterventions: number;
    successRate: number;
    averageDuration: number;
    costSavings: number;
    categoryBreakdown: Record<string, number>;
    priorityBreakdown: Record<string, number>;
}
export interface DashboardMetrics {
    totalInterventions: number;
    activeInterventions: number;
    completedInterventions: number;
    overdueInterventions: number;
    successRate: number;
    averageResolutionTime: number;
    totalCostSavings: number;
    categoryDistribution: Array<{
        name: string;
        value: number;
        successRate: number;
        color: string;
    }>;
    priorityDistribution: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    monthlyTrends: Array<{
        month: string;
        total: number;
        completed: number;
        successRate: number;
    }>;
    recentInterventions: Array<{
        _id: string;
        interventionNumber: string;
        category: string;
        priority: string;
        status: string;
        patientName: string;
        identifiedDate: string;
        assignedTo?: string;
    }>;
}
declare class ClinicalInterventionService {
    static getRecommendedStrategies: (category: string) => StrategyRecommendation[];
    static getAllStrategies: () => StrategyRecommendation[];
    static getStrategiesForCategories: (categories: string[]) => StrategyRecommendation[];
    static validateCustomStrategy: (strategy: Partial<IInterventionStrategy>) => {
        isValid: boolean;
        errors: string[];
    };
    static generateRecommendations: (category: string, priority: string, issueDescription: string, patientFactors?: any) => StrategyRecommendation[];
    static getStrategyByType: (type: string) => StrategyRecommendation | null;
    static assignTeamMember: (interventionId: string, assignment: Omit<ITeamAssignment, 'assignedAt'>, assignedBy: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => Promise<IClinicalIntervention>;
    static updateAssignmentStatus: (interventionId: string, assignmentUserId: mongoose.Types.ObjectId, status: 'pending' | 'in_progress' | 'completed' | 'cancelled', notes: string | undefined, updatedBy: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => Promise<IClinicalIntervention>;
    static getUserAssignments: (userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, status?: string[]) => Promise<IClinicalIntervention[]>;
    static getAssignmentHistory: (interventionId: string, workplaceId: mongoose.Types.ObjectId) => Promise<{
        assignments: ITeamAssignment[];
        auditTrail: any[];
    }>;
    static removeAssignment: (interventionId: string, assignmentUserId: mongoose.Types.ObjectId, removedBy: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, reason?: string) => Promise<IClinicalIntervention>;
    static getTeamWorkloadStats: (workplaceId: mongoose.Types.ObjectId, dateRange?: {
        from: Date;
        to: Date;
    }) => Promise<{
        totalAssignments: number;
        activeAssignments: number;
        completedAssignments: number;
        userWorkloads: Array<{
            userId: mongoose.Types.ObjectId;
            userName: string;
            activeAssignments: number;
            completedAssignments: number;
            averageCompletionTime: number;
        }>;
    }>;
    static generateOutcomeReport: (workplaceId: mongoose.Types.ObjectId, filters: {
        dateFrom?: Date;
        dateTo?: Date;
        category?: string;
        priority?: string;
        outcome?: string;
    }) => Promise<any>;
    static calculateCostSavings: (interventions: IClinicalIntervention[], parameters: {
        adverseEventCost?: number;
    }) => Promise<any>;
    static addStrategy: (interventionId: string, strategy: any, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => Promise<IClinicalIntervention>;
    static updateStrategy: (interventionId: string, strategyId: string, updates: any, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => Promise<IClinicalIntervention>;
    static recordOutcome: (interventionId: string, outcome: any, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => Promise<IClinicalIntervention>;
    static scheduleFollowUp: (interventionId: string, followUpData: any, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => Promise<IClinicalIntervention>;
    static advancedSearch: (filters: any, options: any) => Promise<any>;
    static getUserAssignmentStats: (userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, dateRange?: any) => Promise<any>;
    static getDashboardMetrics: (workplaceId: mongoose.Types.ObjectId, dateRange?: any) => Promise<any>;
    static getTrendAnalysis: (workplaceId: mongoose.Types.ObjectId, filters: any) => Promise<any>;
    static exportData: (filters: any, format: string) => Promise<any>;
    static sendNotifications: (interventionId: string, notificationData: any, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId) => Promise<any>;
    static createIntervention(data: CreateInterventionDTO): Promise<IClinicalIntervention>;
    static updateIntervention(id: string, updates: UpdateInterventionDTO, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId): Promise<IClinicalIntervention>;
    static getInterventions(filters: InterventionFilters): Promise<PaginatedResult<IClinicalIntervention>>;
    static getInterventionById(id: string, workplaceId: mongoose.Types.ObjectId): Promise<IClinicalIntervention>;
    static deleteIntervention(id: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId): Promise<boolean>;
    static generateInterventionNumber(workplaceId: mongoose.Types.ObjectId): Promise<string>;
    static checkDuplicateInterventions(patientId: mongoose.Types.ObjectId, category: string, workplaceId: mongoose.Types.ObjectId, excludeId?: string): Promise<IClinicalIntervention[]>;
    private static isValidStatusTransition;
    static updatePatientInterventionFlags(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId): Promise<void>;
    static getPatientInterventionSummary(patientId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId): Promise<{
        totalInterventions: number;
        activeInterventions: number;
        completedInterventions: number;
        successfulInterventions: number;
        categoryBreakdown: Record<string, number>;
        recentInterventions: IClinicalIntervention[];
    }>;
    static searchPatientsWithInterventions(searchQuery: string, workplaceId: mongoose.Types.ObjectId, limit?: number): Promise<Array<{
        _id: string;
        firstName: string;
        lastName: string;
        mrn: string;
        displayName: string;
        age?: number;
        interventionCount: number;
        activeInterventionCount: number;
        lastInterventionDate?: Date;
    }>>;
    static linkToMTR(interventionId: string, mtrId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId): Promise<IClinicalIntervention>;
    static createInterventionFromMTR(mtrId: string, problemIds: string[], userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, additionalData?: {
        priority?: string;
        estimatedDuration?: number;
    }): Promise<IClinicalIntervention[]>;
    static getMTRReferenceData(mtrId: string, workplaceId: mongoose.Types.ObjectId): Promise<{
        _id: string;
        reviewNumber: string;
        status: string;
        priority: string;
        startedAt: Date;
        completedAt?: Date;
        patientName: string;
        pharmacistName: string;
        problemCount: number;
        interventionCount: number;
    } | null>;
    static getInterventionsForMTR(mtrId: string, workplaceId: mongoose.Types.ObjectId): Promise<IClinicalIntervention[]>;
    static syncWithMTR(interventionId: string, workplaceId: mongoose.Types.ObjectId): Promise<void>;
    private static mapDTPCategoryToInterventionCategory;
    private static determinePriorityFromProblem;
    private static getRecommendedStrategiesForDTP;
    private static updateMTRFromInterventionOutcome;
    static logActivity(action: string, interventionId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, details: any, req?: any, oldValues?: any, newValues?: any): Promise<void>;
    static logInterventionAccess(interventionId: string, userId: mongoose.Types.ObjectId, workplaceId: mongoose.Types.ObjectId, accessType: 'view' | 'edit' | 'create' | 'delete', req?: any, details?: any): Promise<void>;
    static getInterventionAuditTrail(interventionId: string, workplaceId: mongoose.Types.ObjectId, options?: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        logs: any[];
        total: number;
        summary: {
            totalActions: number;
            uniqueUsers: number;
            lastActivity: Date | null;
            riskActivities: number;
        };
    }>;
    static generateComplianceReport(workplaceId: mongoose.Types.ObjectId, dateRange: {
        start: Date;
        end: Date;
    }, options?: {
        includeDetails?: boolean;
        interventionIds?: string[];
    }): Promise<{
        summary: {
            totalInterventions: number;
            auditedActions: number;
            complianceScore: number;
            riskActivities: number;
        };
        interventionCompliance: Array<{
            interventionId: string;
            interventionNumber: string;
            auditCount: number;
            lastAudit: Date;
            complianceStatus: 'compliant' | 'warning' | 'non-compliant';
            riskLevel: 'low' | 'medium' | 'high' | 'critical';
        }>;
        recommendations: string[];
    }>;
    private static getChangedFields;
    private static determineRiskLevel;
}
export default ClinicalInterventionService;
//# sourceMappingURL=clinicalInterventionService.d.ts.map