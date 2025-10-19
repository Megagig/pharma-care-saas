"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patientMTRIntegrationService = exports.PatientMTRIntegrationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
class PatientMTRIntegrationService {
    async getPatientMTRSummary(patientId, workplaceId) {
        try {
            return {
                patientId,
                totalMTRSessions: 0,
                activeMTRSessions: 0,
                completedMTRSessions: 0,
                hasActiveMTR: false,
                mtrStatus: 'none',
                recentMTRs: [],
            };
        }
        catch (error) {
            console.error('Error getting patient MTR summary:', error);
            throw new AppError('Failed to get patient MTR summary', 500);
        }
    }
    async getPatientDataForMTR(patientId, workplaceId) {
        try {
            return {
                patient: { _id: patientId },
                medications: [],
                dtps: [],
                mtrHistory: [],
            };
        }
        catch (error) {
            console.error('Error getting patient data for MTR:', error);
            throw error instanceof AppError ? error : new AppError('Failed to get patient data for MTR', 500);
        }
    }
    async syncMedicationsWithMTR(patientId, mtrId, workplaceId) {
        try {
            return {
                patientMedications: [],
                mtrMedications: [],
                syncStatus: 'synced',
            };
        }
        catch (error) {
            console.error('Error syncing medications with MTR:', error);
            throw error instanceof AppError ? error : new AppError('Failed to sync medications with MTR', 500);
        }
    }
    async getPatientDashboardMTRData(patientId, workplaceId) {
        try {
            const patientObjectId = mongoose_1.default.Types.ObjectId.isValid(patientId)
                ? new mongoose_1.default.Types.ObjectId(patientId)
                : patientId;
            const mtrSessions = await MedicationTherapyReview_1.default.find({
                patientId: patientObjectId,
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId)
            })
                .populate('pharmacistId', 'firstName lastName')
                .sort('-createdAt')
                .lean();
            const activeMTRs = mtrSessions.filter(session => session.status === 'in_progress' || session.status === 'on_hold');
            const recentMTRs = mtrSessions.slice(0, 5);
            const processedActiveMTRs = activeMTRs.map(session => ({
                ...session,
                completionPercentage: this.calculateCompletionPercentage(session),
                isOverdue: this.isSessionOverdue(session)
            }));
            const processedRecentMTRs = recentMTRs.map(session => ({
                ...session,
                completionPercentage: this.calculateCompletionPercentage(session),
                isOverdue: this.isSessionOverdue(session)
            }));
            const mtrSummary = await this.getPatientMTRSummary(patientId, workplaceId);
            const pendingActions = activeMTRs.map(session => ({
                type: 'review',
                description: `Continue MTR session ${session.reviewNumber}`,
                priority: session.priority === 'high_risk' ? 'high' :
                    session.priority === 'urgent' ? 'medium' : 'low',
                dueDate: session.nextReviewDate
            }));
            return {
                activeMTRs: processedActiveMTRs,
                recentMTRs: processedRecentMTRs,
                mtrSummary,
                pendingActions,
            };
        }
        catch (error) {
            console.error('Error getting patient dashboard MTR data:', error);
            throw new AppError('Failed to get patient dashboard MTR data', 500);
        }
    }
    calculateCompletionPercentage(session) {
        if (!session.steps)
            return 0;
        const stepNames = ['patientSelection', 'medicationHistory', 'therapyAssessment', 'planDevelopment', 'interventions', 'followUp'];
        const completedSteps = stepNames.filter(stepName => session.steps[stepName] && session.steps[stepName].completed).length;
        return Math.round((completedSteps / stepNames.length) * 100);
    }
    isSessionOverdue(session) {
        if (session.status === 'completed')
            return false;
        const startDate = new Date(session.startedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 7;
    }
    async searchPatientsWithMTR(params, workplaceId) {
        try {
            const page = parseInt(params.page) || 1;
            const limit = parseInt(params.limit) || 10;
            return {
                results: [],
                total: 0,
                page,
                limit,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };
        }
        catch (error) {
            console.error('Error searching patients with MTR:', error);
            throw new AppError('Failed to search patients with MTR', 500);
        }
    }
}
exports.PatientMTRIntegrationService = PatientMTRIntegrationService;
exports.patientMTRIntegrationService = new PatientMTRIntegrationService();
//# sourceMappingURL=patientMTRIntegrationService.js.map