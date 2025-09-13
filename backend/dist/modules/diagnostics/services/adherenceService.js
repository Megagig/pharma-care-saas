"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adherenceService = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
const AdherenceTracking_1 = __importDefault(require("../models/AdherenceTracking"));
const Patient_1 = __importDefault(require("../../../models/Patient"));
class AdherenceService {
    async createAdherenceTracking(workplaceId, trackingData, createdBy) {
        try {
            const patient = await Patient_1.default.findById(trackingData.patientId);
            if (!patient) {
                throw new Error('Patient not found');
            }
            const existingTracking = await AdherenceTracking_1.default.findByPatient(trackingData.patientId, workplaceId);
            if (existingTracking) {
                throw new Error('Adherence tracking already exists for this patient');
            }
            const adherenceTracking = new AdherenceTracking_1.default({
                workplaceId,
                patientId: trackingData.patientId,
                diagnosticRequestId: trackingData.diagnosticRequestId,
                diagnosticResultId: trackingData.diagnosticResultId,
                medications: trackingData.medications.map(med => ({
                    ...med,
                    adherenceScore: 0,
                    adherenceStatus: 'unknown',
                    refillHistory: []
                })),
                monitoringFrequency: trackingData.monitoringFrequency || 'weekly',
                alertPreferences: trackingData.alertPreferences || {
                    enableRefillReminders: true,
                    enableAdherenceAlerts: true,
                    reminderDaysBefore: 7,
                    escalationThreshold: 3
                },
                createdBy
            });
            await adherenceTracking.save();
            logger_1.default.info(`Adherence tracking created for patient ${patient.mrn}`);
            return adherenceTracking;
        }
        catch (error) {
            logger_1.default.error('Error creating adherence tracking:', error);
            throw error;
        }
    }
    async createFromDiagnosticResult(diagnosticResult, createdBy) {
        try {
            if (!diagnosticResult.medicationSuggestions || diagnosticResult.medicationSuggestions.length === 0) {
                return null;
            }
            const medications = diagnosticResult.medicationSuggestions.map(suggestion => ({
                medicationName: suggestion.drugName,
                rxcui: suggestion.rxcui,
                dosage: suggestion.dosage,
                frequency: suggestion.frequency,
                prescribedDate: new Date()
            }));
            const trackingData = {
                patientId: diagnosticResult.requestId,
                diagnosticResultId: diagnosticResult._id,
                medications,
                monitoringFrequency: this.determineMonitoringFrequency(diagnosticResult),
                alertPreferences: this.determineAlertPreferences(diagnosticResult)
            };
            return await this.createAdherenceTracking(diagnosticResult.workplaceId, trackingData, createdBy);
        }
        catch (error) {
            logger_1.default.error('Error creating adherence tracking from diagnostic result:', error);
            throw error;
        }
    }
    async addRefill(patientId, workplaceId, refillData) {
        try {
            const tracking = await AdherenceTracking_1.default.findByPatient(patientId, workplaceId);
            if (!tracking) {
                throw new Error('Adherence tracking not found for patient');
            }
            tracking.addRefill(refillData.medicationName, {
                date: refillData.date,
                daysSupply: refillData.daysSupply,
                source: refillData.source,
                notes: refillData.notes
            });
            await tracking.save();
            await this.checkAdherenceAlerts(tracking);
            logger_1.default.info(`Refill added for patient ${patientId}: ${refillData.medicationName}`);
            return tracking;
        }
        catch (error) {
            logger_1.default.error('Error adding refill:', error);
            throw error;
        }
    }
    async updateMedicationAdherence(patientId, workplaceId, medicationName, adherenceData) {
        try {
            const tracking = await AdherenceTracking_1.default.findByPatient(patientId, workplaceId);
            if (!tracking) {
                throw new Error('Adherence tracking not found for patient');
            }
            tracking.updateMedicationAdherence(medicationName, adherenceData);
            await tracking.save();
            await this.checkAdherenceAlerts(tracking);
            logger_1.default.info(`Adherence updated for patient ${patientId}: ${medicationName}`);
            return tracking;
        }
        catch (error) {
            logger_1.default.error('Error updating medication adherence:', error);
            throw error;
        }
    }
    async assessPatientAdherence(patientId, workplaceId) {
        try {
            const tracking = await AdherenceTracking_1.default.findByPatient(patientId, workplaceId);
            if (!tracking) {
                throw new Error('Adherence tracking not found for patient');
            }
            const overallScore = tracking.calculateOverallAdherence();
            const riskLevel = tracking.assessAdherenceRisk();
            const medicationsAtRisk = tracking.medicationsAtRisk;
            const recommendations = this.generateAdherenceRecommendations(tracking);
            return {
                patientId,
                overallScore,
                category: tracking.adherenceCategory,
                riskLevel,
                medicationsAtRisk: medicationsAtRisk.map(med => ({
                    name: med.medicationName,
                    score: med.adherenceScore,
                    status: med.adherenceStatus,
                    issues: this.identifyMedicationIssues(med)
                })),
                recommendations,
                nextAssessmentDate: tracking.nextAssessmentDate
            };
        }
        catch (error) {
            logger_1.default.error('Error assessing patient adherence:', error);
            throw error;
        }
    }
    async checkAdherenceAlerts(tracking) {
        try {
            const alerts = [];
            for (const medication of tracking.medications) {
                if (medication.expectedRefillDate && medication.expectedRefillDate < new Date()) {
                    const daysOverdue = Math.floor((Date.now() - medication.expectedRefillDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysOverdue > 0) {
                        alerts.push({
                            type: 'missed_refill',
                            severity: daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low',
                            message: `${medication.medicationName} refill is ${daysOverdue} days overdue`
                        });
                    }
                }
                if (medication.adherenceScore < 70) {
                    alerts.push({
                        type: 'low_adherence',
                        severity: medication.adherenceScore < 50 ? 'critical' : 'high',
                        message: `Low adherence detected for ${medication.medicationName} (${medication.adherenceScore}%)`
                    });
                }
                if (medication.refillHistory.length >= 2) {
                    const lastTwoRefills = medication.refillHistory
                        .sort((a, b) => b.date.getTime() - a.date.getTime())
                        .slice(0, 2);
                    const daysBetween = Math.floor(((lastTwoRefills[0].date.getTime()) - (lastTwoRefills[1].date.getTime())) / (1000 * 60 * 60 * 24));
                    const expectedDays = lastTwoRefills[1].daysSupply || 0;
                    const gap = daysBetween - expectedDays;
                    if (gap > 3) {
                        alerts.push({
                            type: 'medication_gap',
                            severity: gap > 7 ? 'high' : 'medium',
                            message: `${gap}-day gap detected in ${medication.medicationName} therapy`
                        });
                    }
                }
            }
            for (const alert of alerts) {
                tracking.createAlert(alert);
            }
            if (alerts.length > 0) {
                await tracking.save();
                logger_1.default.info(`Created ${alerts.length} adherence alerts for patient ${tracking.patientId}`);
            }
        }
        catch (error) {
            logger_1.default.error('Error checking adherence alerts:', error);
            throw error;
        }
    }
    async addIntervention(patientId, workplaceId, intervention, implementedBy) {
        try {
            const tracking = await AdherenceTracking_1.default.findByPatient(patientId, workplaceId);
            if (!tracking) {
                throw new Error('Adherence tracking not found for patient');
            }
            tracking.addIntervention({
                ...intervention,
                implementedBy
            });
            await tracking.save();
            logger_1.default.info(`Adherence intervention added for patient ${patientId}: ${intervention.type}`);
            return tracking;
        }
        catch (error) {
            logger_1.default.error('Error adding adherence intervention:', error);
            throw error;
        }
    }
    async generateAdherenceReport(patientId, workplaceId, reportPeriod) {
        try {
            const tracking = await AdherenceTracking_1.default.findByPatient(patientId, workplaceId);
            if (!tracking) {
                throw new Error('Adherence tracking not found for patient');
            }
            const periodAlerts = tracking.alerts.filter(alert => alert.triggeredAt >= reportPeriod.start && alert.triggeredAt <= reportPeriod.end);
            const periodInterventions = tracking.interventions.filter(intervention => intervention.implementedAt >= reportPeriod.start && intervention.implementedAt <= reportPeriod.end);
            const alertsByType = {};
            const alertsBySeverity = {};
            periodAlerts.forEach(alert => {
                alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
                alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
            });
            const interventionsByType = {};
            const interventionEffectiveness = {};
            periodInterventions.forEach(intervention => {
                interventionsByType[intervention.type] = (interventionsByType[intervention.type] || 0) + 1;
                if (intervention.effectiveness) {
                    interventionEffectiveness[intervention.effectiveness] =
                        (interventionEffectiveness[intervention.effectiveness] || 0) + 1;
                }
            });
            return {
                patientId,
                reportPeriod,
                overallAdherence: tracking.overallAdherenceScore,
                medicationDetails: tracking.medications.map(med => ({
                    name: med.medicationName,
                    adherenceScore: med.adherenceScore,
                    refillPattern: this.analyzeRefillPattern(med),
                    issues: this.identifyMedicationIssues(med),
                    interventions: periodInterventions.filter(i => i.description.includes(med.medicationName)).length
                })),
                alerts: {
                    total: periodAlerts.length,
                    byType: alertsByType,
                    bySeverity: alertsBySeverity
                },
                interventions: {
                    total: periodInterventions.length,
                    byType: interventionsByType,
                    effectiveness: interventionEffectiveness
                },
                outcomes: {
                    symptomsImproved: tracking.clinicalOutcomes?.symptomsImproved || false,
                    adherenceImproved: this.calculateAdherenceImprovement(tracking, reportPeriod),
                    qualityOfLife: tracking.clinicalOutcomes?.qualityOfLifeScore
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error generating adherence report:', error);
            throw error;
        }
    }
    async getPatientsWithPoorAdherence(workplaceId, threshold = 70) {
        try {
            const poorAdherencePatients = AdherenceTracking_1.default.findPoorAdherence(workplaceId, threshold)
                .populate('patientId', 'firstName lastName mrn')
                .exec();
            return poorAdherencePatients;
        }
        catch (error) {
            logger_1.default.error('Error getting patients with poor adherence:', error);
            throw error;
        }
    }
    async processAdherenceAssessments() {
        try {
            const dueAssessments = AdherenceTracking_1.default.findDueForAssessment();
            for (const tracking of dueAssessments) {
                tracking.calculateOverallAdherence();
                await this.checkAdherenceAlerts(tracking);
                const nextDate = new Date();
                switch (tracking.monitoringFrequency) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case 'biweekly':
                        nextDate.setDate(nextDate.getDate() + 14);
                        break;
                    case 'monthly':
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                }
                tracking.nextAssessmentDate = nextDate;
                await tracking.save();
            }
            logger_1.default.info(`Processed ${dueAssessments.length} adherence assessments`);
        }
        catch (error) {
            logger_1.default.error('Error processing adherence assessments:', error);
            throw error;
        }
    }
    determineMonitoringFrequency(diagnosticResult) {
        if (diagnosticResult.riskAssessment.overallRisk === 'critical') {
            return 'daily';
        }
        if (diagnosticResult.riskAssessment.overallRisk === 'high') {
            return 'weekly';
        }
        return 'biweekly';
    }
    determineAlertPreferences(diagnosticResult) {
        const riskLevel = diagnosticResult.riskAssessment.overallRisk;
        return {
            enableRefillReminders: true,
            enableAdherenceAlerts: true,
            reminderDaysBefore: riskLevel === 'critical' ? 3 : riskLevel === 'high' ? 5 : 7,
            escalationThreshold: riskLevel === 'critical' ? 1 : riskLevel === 'high' ? 2 : 3
        };
    }
    generateAdherenceRecommendations(tracking) {
        const recommendations = [];
        if (tracking.overallAdherenceScore < 70) {
            recommendations.push('Consider medication adherence counseling');
            recommendations.push('Evaluate barriers to adherence');
        }
        if (tracking.medicationsAtRisk.length > 0) {
            recommendations.push('Focus on high-risk medications');
            recommendations.push('Consider dose simplification or alternative formulations');
        }
        if (tracking.activeAlerts.length > 2) {
            recommendations.push('Implement intensive monitoring program');
            recommendations.push('Consider medication synchronization');
        }
        const missedRefills = tracking.alerts.filter(a => a.type === 'missed_refill' && !a.resolved);
        if (missedRefills.length > 0) {
            recommendations.push('Set up automated refill reminders');
            recommendations.push('Consider 90-day supplies where appropriate');
        }
        return recommendations;
    }
    identifyMedicationIssues(medication) {
        const issues = [];
        if (medication.adherenceScore < 70) {
            issues.push('Low adherence score');
        }
        if (medication.expectedRefillDate && medication.expectedRefillDate < new Date()) {
            issues.push('Overdue refill');
        }
        if (medication.refillHistory.length >= 2) {
            const gaps = this.calculateRefillGaps(medication);
            if (gaps.some(gap => gap > 3)) {
                issues.push('Therapy gaps detected');
            }
        }
        if (medication.missedDoses && medication.totalDoses &&
            (medication.missedDoses / medication.totalDoses) > 0.2) {
            issues.push('Frequent missed doses');
        }
        return issues;
    }
    analyzeRefillPattern(medication) {
        if (medication.refillHistory.length < 2) {
            return 'Insufficient data';
        }
        const gaps = this.calculateRefillGaps(medication);
        const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
        if (avgGap <= 1)
            return 'Excellent';
        if (avgGap <= 3)
            return 'Good';
        if (avgGap <= 7)
            return 'Fair';
        return 'Poor';
    }
    calculateRefillGaps(medication) {
        const refills = medication.refillHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
        const gaps = [];
        for (let i = 1; i < refills.length; i++) {
            const daysBetween = Math.floor((refills[i].date.getTime() - refills[i - 1].date.getTime()) / (1000 * 60 * 60 * 24));
            const expectedDays = refills[i - 1].daysSupply || 30;
            gaps.push(Math.max(0, daysBetween - expectedDays));
        }
        return gaps;
    }
    calculateAdherenceImprovement(tracking, reportPeriod) {
        return tracking.overallAdherenceScore >= 80 &&
            tracking.interventions.some(i => i.implementedAt >= reportPeriod.start);
    }
}
exports.adherenceService = new AdherenceService();
exports.default = exports.adherenceService;
//# sourceMappingURL=adherenceService.js.map