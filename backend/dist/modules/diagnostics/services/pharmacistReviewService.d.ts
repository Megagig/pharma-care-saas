import { IDiagnosticResult } from '../models/DiagnosticResult';
export interface ReviewDecisionData {
    status: 'approved' | 'modified' | 'rejected';
    modifications?: string;
    rejectionReason?: string;
    reviewNotes?: string;
    clinicalJustification?: string;
    reviewedBy: string;
    workplaceId: string;
}
export interface InterventionCreationData {
    type: 'medication_review' | 'counseling' | 'referral' | 'monitoring' | 'lifestyle';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    recommendations: string[];
    followUpRequired: boolean;
    followUpDate?: Date;
    targetOutcome?: string;
    monitoringParameters?: string[];
}
export interface ReviewWorkflowStatus {
    totalPending: number;
    totalReviewed: number;
    totalApproved: number;
    totalModified: number;
    totalRejected: number;
    averageReviewTime: number;
    oldestPendingDays: number;
}
export interface ReviewAnalytics {
    reviewerStats: {
        reviewerId: string;
        reviewerName: string;
        totalReviews: number;
        approvalRate: number;
        averageReviewTime: number;
    }[];
    qualityMetrics: {
        averageConfidenceScore: number;
        averageQualityScore: number;
        commonRejectionReasons: string[];
        interventionCreationRate: number;
    };
    timeMetrics: {
        averageTimeToReview: number;
        averageProcessingTime: number;
        peakReviewHours: number[];
    };
}
export declare class PharmacistReviewService {
    submitReviewDecision(resultId: string, reviewData: ReviewDecisionData): Promise<IDiagnosticResult>;
    createInterventionFromResult(resultId: string, interventionData: InterventionCreationData, createdBy: string, workplaceId: string): Promise<any>;
    getPendingReviews(workplaceId: string, page?: number, limit?: number, filters?: {
        priority?: 'low' | 'medium' | 'high' | 'critical';
        confidenceRange?: {
            min: number;
            max: number;
        };
        hasRedFlags?: boolean;
        orderBy?: 'oldest' | 'newest' | 'priority' | 'confidence';
    }): Promise<{
        results: IDiagnosticResult[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getReviewWorkflowStatus(workplaceId: string): Promise<ReviewWorkflowStatus>;
    getReviewAnalytics(workplaceId: string, dateRange: {
        from: Date;
        to: Date;
    }): Promise<ReviewAnalytics>;
    private validateReviewData;
    private determineFollowUpRequired;
    private calculateFollowUpDate;
    private generateFollowUpInstructions;
    private getReviewerStats;
    private getQualityMetrics;
    private getTimeMetrics;
}
declare const _default: PharmacistReviewService;
export default _default;
//# sourceMappingURL=pharmacistReviewService.d.ts.map