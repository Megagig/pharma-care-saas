"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnosticFollowUpService = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
const DiagnosticFollowUp_1 = __importDefault(require("../models/DiagnosticFollowUp"));
const DiagnosticRequest_1 = __importDefault(require("../models/DiagnosticRequest"));
const DiagnosticResult_1 = __importDefault(require("../models/DiagnosticResult"));
const Patient_1 = __importDefault(require("../../../models/Patient"));
const User_1 = __importDefault(require("../../../models/User"));
class DiagnosticFollowUpService {
    async createFollowUp(workplaceId, followUpData, createdBy) {
        try {
            const diagnosticRequest = await DiagnosticRequest_1.default.findById(followUpData.diagnosticRequestId);
            if (!diagnosticRequest) {
                throw new Error('Diagnostic request not found');
            }
            const diagnosticResult = await DiagnosticResult_1.default.findById(followUpData.diagnosticResultId);
            if (!diagnosticResult) {
                throw new Error('Diagnostic result not found');
            }
            const patient = await Patient_1.default.findById(followUpData.patientId);
            if (!patient) {
                throw new Error('Patient not found');
            }
            const assignedUser = await User_1.default.findById(followUpData.assignedTo);
            if (!assignedUser || !['pharmacist', 'admin'].includes(assignedUser.role)) {
                throw new Error('Invalid assigned user or insufficient permissions');
            }
            const followUp = new DiagnosticFollowUp_1.default({
                workplaceId,
                diagnosticRequestId: followUpData.diagnosticRequestId,
                diagnosticResultId: followUpData.diagnosticResultId,
                patientId: followUpData.patientId,
                type: followUpData.type,
                priority: followUpData.priority || 'medium',
                description: followUpData.description,
                objectives: followUpData.objectives || [],
                scheduledDate: followUpData.scheduledDate,
                estimatedDuration: followUpData.estimatedDuration || 30,
                assignedTo: followUpData.assignedTo,
                autoScheduled: followUpData.autoScheduled || false,
                schedulingRule: followUpData.schedulingRule,
                createdBy
            });
            if (diagnosticResult.diagnoses && diagnosticResult.diagnoses.length > 0) {
                followUp.relatedDiagnoses = diagnosticResult.diagnoses.map(d => d.condition);
            }
            if (diagnosticResult.medicationSuggestions && diagnosticResult.medicationSuggestions.length > 0) {
                followUp.relatedMedications = diagnosticResult.medicationSuggestions.map(m => m.drugName);
            }
            if (diagnosticResult.redFlags && diagnosticResult.redFlags.length > 0) {
                followUp.triggerConditions = diagnosticResult.redFlags.map(flag => ({
                    condition: flag.flag,
                    threshold: flag.severity,
                    action: flag.action
                }));
            }
            await followUp.save();
            logger_1.default.info(`Diagnostic follow-up created for patient ${patient.mrn}: ${followUp.type}`);
            return followUp;
        }
        catch (error) {
            logger_1.default.error('Error creating diagnostic follow-up:', error);
            throw error;
        }
    }
    async autoScheduleFollowUps(diagnosticResult, assignedTo) {
        try {
            const followUps = [];
            const diagnosticRequest = await DiagnosticRequest_1.default.findById(diagnosticResult.requestId);
            if (!diagnosticRequest) {
                throw new Error('Diagnostic request not found');
            }
            const schedulingRules = this.determineSchedulingRules(diagnosticResult);
            for (const rule of schedulingRules) {
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + rule.interval);
                const followUpData = {
                    diagnosticRequestId: diagnosticRequest._id,
                    diagnosticResultId: diagnosticResult._id,
                    patientId: diagnosticRequest.patientId,
                    type: this.getFollowUpTypeForRule(rule),
                    priority: this.getPriorityForRule(rule, diagnosticResult),
                    description: this.generateFollowUpDescription(rule, diagnosticResult),
                    objectives: this.generateFollowUpObjectives(rule, diagnosticResult),
                    scheduledDate: followUpDate,
                    estimatedDuration: this.getEstimatedDuration(rule),
                    assignedTo,
                    autoScheduled: true,
                    schedulingRule: rule
                };
                const followUp = await this.createFollowUp(diagnosticResult.workplaceId, followUpData, assignedTo);
                followUps.push(followUp);
            }
            logger_1.default.info(`Auto-scheduled ${followUps.length} follow-ups for diagnostic result ${diagnosticResult._id}`);
            return followUps;
        }
        catch (error) {
            logger_1.default.error('Error auto-scheduling follow-ups:', error);
            throw error;
        }
    }
    async completeFollowUp(followUpId, outcome, completedBy) {
        try {
            const followUp = await DiagnosticFollowUp_1.default.findById(followUpId);
            if (!followUp) {
                throw new Error('Follow-up not found');
            }
            if (followUp.status !== 'scheduled' && followUp.status !== 'in_progress') {
                throw new Error('Follow-up cannot be completed in current status');
            }
            await followUp.markCompleted(outcome);
            followUp.updatedBy = completedBy;
            await followUp.save();
            if (outcome.nextFollowUpDate) {
                await this.scheduleNextFollowUp(followUp, outcome.nextFollowUpDate, completedBy);
            }
            logger_1.default.info(`Follow-up ${followUpId} completed with status: ${outcome.status}`);
            return followUp;
        }
        catch (error) {
            logger_1.default.error('Error completing follow-up:', error);
            throw error;
        }
    }
    async rescheduleFollowUp(followUpId, newDate, reason, rescheduledBy) {
        try {
            const followUp = await DiagnosticFollowUp_1.default.findById(followUpId);
            if (!followUp) {
                throw new Error('Follow-up not found');
            }
            if (!followUp.canReschedule()) {
                throw new Error('Follow-up cannot be rescheduled in current status');
            }
            followUp.reschedule(newDate, reason);
            followUp.updatedBy = rescheduledBy;
            await followUp.save();
            logger_1.default.info(`Follow-up ${followUpId} rescheduled to ${newDate.toISOString()}`);
            return followUp;
        }
        catch (error) {
            logger_1.default.error('Error rescheduling follow-up:', error);
            throw error;
        }
    }
    async getPatientFollowUps(patientId, workplaceId, options) {
        try {
            let query = DiagnosticFollowUp_1.default.findByPatient(patientId, workplaceId);
            if (options?.status) {
                query = query.where('status', options.status);
            }
            if (options?.type) {
                query = query.where('type', options.type);
            }
            if (options?.limit) {
                query = query.limit(options.limit);
            }
            if (options?.skip) {
                query = query.skip(options.skip);
            }
            const followUps = await query
                .populate('assignedTo', 'firstName lastName email')
                .populate('patientId', 'firstName lastName mrn')
                .exec();
            return followUps;
        }
        catch (error) {
            logger_1.default.error('Error getting patient follow-ups:', error);
            throw error;
        }
    }
    async getOverdueFollowUps(workplaceId) {
        try {
            const overdueFollowUps = await DiagnosticFollowUp_1.default.findOverdue(workplaceId)
                .populate('assignedTo', 'firstName lastName email')
                .populate('patientId', 'firstName lastName mrn')
                .populate('diagnosticResultId', 'diagnoses riskAssessment')
                .exec();
            return overdueFollowUps;
        }
        catch (error) {
            logger_1.default.error('Error getting overdue follow-ups:', error);
            throw error;
        }
    }
    async getFollowUpAnalytics(workplaceId, dateRange) {
        try {
            const matchStage = { workplaceId };
            if (dateRange) {
                matchStage.scheduledDate = {
                    $gte: dateRange.start,
                    $lte: dateRange.end
                };
            }
            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalFollowUps: { $sum: 1 },
                        completedFollowUps: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        missedFollowUps: {
                            $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
                        },
                        overdueFollowUps: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $in: ['$status', ['scheduled', 'in_progress']] },
                                            { $lt: ['$scheduledDate', new Date()] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        avgDuration: { $avg: '$estimatedDuration' },
                        followUpsByType: {
                            $push: {
                                type: '$type',
                                status: '$status',
                                priority: '$priority'
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalFollowUps: 1,
                        completedFollowUps: 1,
                        missedFollowUps: 1,
                        overdueFollowUps: 1,
                        completionRate: {
                            $cond: [
                                { $gt: ['$totalFollowUps', 0] },
                                { $multiply: [{ $divide: ['$completedFollowUps', '$totalFollowUps'] }, 100] },
                                0
                            ]
                        },
                        averageDuration: { $round: ['$avgDuration', 1] },
                        followUpsByType: 1
                    }
                }
            ];
            const result = await DiagnosticFollowUp_1.default.aggregate(pipeline);
            const analytics = result[0] || {
                totalFollowUps: 0,
                completedFollowUps: 0,
                missedFollowUps: 0,
                overdueFollowUps: 0,
                completionRate: 0,
                averageDuration: 0,
                followUpsByType: []
            };
            const followUpsByType = {};
            const followUpsByPriority = {};
            const outcomeDistribution = {};
            analytics.followUpsByType.forEach((item) => {
                followUpsByType[item.type] = (followUpsByType[item.type] || 0) + 1;
                followUpsByPriority[item.priority] = (followUpsByPriority[item.priority] || 0) + 1;
                if (item.status === 'completed') {
                    outcomeDistribution['successful'] = (outcomeDistribution['successful'] || 0) + 1;
                }
            });
            return {
                ...analytics,
                followUpsByType,
                followUpsByPriority,
                outcomeDistribution
            };
        }
        catch (error) {
            logger_1.default.error('Error getting follow-up analytics:', error);
            throw error;
        }
    }
    async processMissedFollowUps() {
        try {
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - 2);
            const missedFollowUps = await DiagnosticFollowUp_1.default.find({
                status: 'scheduled',
                scheduledDate: { $lt: cutoffTime }
            });
            for (const followUp of missedFollowUps) {
                followUp.status = 'missed';
                await followUp.save();
                logger_1.default.info(`Follow-up ${followUp._id} marked as missed`);
            }
            logger_1.default.info(`Processed ${missedFollowUps.length} missed follow-ups`);
        }
        catch (error) {
            logger_1.default.error('Error processing missed follow-ups:', error);
            throw error;
        }
    }
    determineSchedulingRules(diagnosticResult) {
        const rules = [];
        if (diagnosticResult.riskAssessment.overallRisk === 'critical') {
            rules.push({
                basedOn: 'patient_risk',
                interval: 1,
                maxFollowUps: 3,
                conditions: ['critical_risk']
            });
        }
        else if (diagnosticResult.riskAssessment.overallRisk === 'high') {
            rules.push({
                basedOn: 'patient_risk',
                interval: 3,
                maxFollowUps: 2,
                conditions: ['high_risk']
            });
        }
        const criticalFlags = diagnosticResult.redFlags.filter(flag => flag.severity === 'critical');
        if (criticalFlags.length > 0) {
            rules.push({
                basedOn: 'red_flags',
                interval: 1,
                maxFollowUps: 2,
                conditions: criticalFlags.map(flag => flag.flag)
            });
        }
        if (diagnosticResult.medicationSuggestions.length > 0) {
            rules.push({
                basedOn: 'medication_type',
                interval: 7,
                maxFollowUps: 1,
                conditions: ['medication_adherence']
            });
        }
        const highSeverityDiagnoses = diagnosticResult.diagnoses.filter(d => d.severity === 'high');
        if (highSeverityDiagnoses.length > 0) {
            rules.push({
                basedOn: 'diagnosis_severity',
                interval: 14,
                maxFollowUps: 1,
                conditions: highSeverityDiagnoses.map(d => d.condition)
            });
        }
        return rules;
    }
    getFollowUpTypeForRule(rule) {
        switch (rule.basedOn) {
            case 'medication_type':
                return 'medication_review';
            case 'red_flags':
            case 'patient_risk':
                return 'symptom_check';
            case 'diagnosis_severity':
                return 'outcome_assessment';
            default:
                return 'symptom_check';
        }
    }
    getPriorityForRule(rule, diagnosticResult) {
        if (rule.basedOn === 'red_flags' || diagnosticResult.riskAssessment.overallRisk === 'critical') {
            return 'high';
        }
        if (rule.interval <= 3 || diagnosticResult.riskAssessment.overallRisk === 'high') {
            return 'medium';
        }
        return 'low';
    }
    generateFollowUpDescription(rule, diagnosticResult) {
        const primaryDiagnosis = diagnosticResult.diagnoses[0]?.condition || 'diagnostic assessment';
        switch (rule.basedOn) {
            case 'medication_type':
                return `Medication adherence and effectiveness review following ${primaryDiagnosis}`;
            case 'red_flags':
                return `Critical symptom monitoring following ${primaryDiagnosis} - red flags identified`;
            case 'patient_risk':
                return `High-risk patient monitoring following ${primaryDiagnosis}`;
            case 'diagnosis_severity':
                return `Outcome assessment and symptom progression review for ${primaryDiagnosis}`;
            default:
                return `Follow-up assessment for ${primaryDiagnosis}`;
        }
    }
    generateFollowUpObjectives(rule, diagnosticResult) {
        const objectives = [];
        switch (rule.basedOn) {
            case 'medication_type':
                objectives.push('Assess medication adherence');
                objectives.push('Monitor for side effects');
                objectives.push('Evaluate therapeutic effectiveness');
                break;
            case 'red_flags':
                objectives.push('Monitor critical symptoms');
                objectives.push('Assess need for immediate intervention');
                objectives.push('Evaluate patient safety');
                break;
            case 'patient_risk':
                objectives.push('Monitor high-risk conditions');
                objectives.push('Assess symptom progression');
                objectives.push('Review care plan effectiveness');
                break;
            case 'diagnosis_severity':
                objectives.push('Evaluate treatment outcomes');
                objectives.push('Monitor symptom resolution');
                objectives.push('Assess need for referral');
                break;
        }
        return objectives;
    }
    getEstimatedDuration(rule) {
        switch (rule.basedOn) {
            case 'red_flags':
            case 'patient_risk':
                return 45;
            case 'medication_type':
                return 30;
            case 'diagnosis_severity':
                return 30;
            default:
                return 30;
        }
    }
    async scheduleNextFollowUp(currentFollowUp, nextDate, scheduledBy) {
        try {
            if (currentFollowUp.schedulingRule?.maxFollowUps) {
                const existingFollowUps = await DiagnosticFollowUp_1.default.countDocuments({
                    diagnosticRequestId: currentFollowUp.diagnosticRequestId,
                    'schedulingRule.basedOn': currentFollowUp.schedulingRule.basedOn
                });
                if (existingFollowUps >= currentFollowUp.schedulingRule.maxFollowUps) {
                    return null;
                }
            }
            const nextFollowUpData = {
                diagnosticRequestId: currentFollowUp.diagnosticRequestId,
                diagnosticResultId: currentFollowUp.diagnosticResultId,
                patientId: currentFollowUp.patientId,
                type: currentFollowUp.type,
                priority: currentFollowUp.priority,
                description: `Follow-up continuation: ${currentFollowUp.description}`,
                objectives: currentFollowUp.objectives,
                scheduledDate: nextDate,
                estimatedDuration: currentFollowUp.estimatedDuration,
                assignedTo: currentFollowUp.assignedTo,
                autoScheduled: true,
                schedulingRule: currentFollowUp.schedulingRule
            };
            const nextFollowUp = await this.createFollowUp(currentFollowUp.workplaceId, nextFollowUpData, scheduledBy);
            logger_1.default.info(`Next follow-up scheduled for ${nextDate.toISOString()}`);
            return nextFollowUp;
        }
        catch (error) {
            logger_1.default.error('Error scheduling next follow-up:', error);
            return null;
        }
    }
}
exports.diagnosticFollowUpService = new DiagnosticFollowUpService();
exports.default = exports.diagnosticFollowUpService;
//# sourceMappingURL=diagnosticFollowUpService.js.map