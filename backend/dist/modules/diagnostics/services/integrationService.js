"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticIntegrationService = void 0;
const ClinicalNote_1 = __importDefault(require("../../../models/ClinicalNote"));
const MedicationTherapyReview_1 = __importDefault(require("../../../models/MedicationTherapyReview"));
const DiagnosticRequest_1 = __importDefault(require("../models/DiagnosticRequest"));
const DiagnosticResult_1 = __importDefault(require("../models/DiagnosticResult"));
const logger_1 = __importDefault(require("../../../utils/logger"));
class DiagnosticIntegrationService {
    async createClinicalNoteFromDiagnostic(integrationData, noteData) {
        try {
            const diagnosticRequest = await DiagnosticRequest_1.default.findById(integrationData.diagnosticRequestId);
            if (!diagnosticRequest) {
                throw new Error('Diagnostic request not found');
            }
            let diagnosticResult = null;
            if (integrationData.diagnosticResultId) {
                diagnosticResult = await DiagnosticResult_1.default.findById(integrationData.diagnosticResultId);
            }
            const clinicalNoteData = this.buildClinicalNoteFromDiagnostic(diagnosticRequest, diagnosticResult, noteData);
            const clinicalNote = new ClinicalNote_1.default({
                patient: integrationData.patientId,
                pharmacist: integrationData.pharmacistId,
                workplaceId: integrationData.workplaceId,
                locationId: integrationData.locationId,
                ...clinicalNoteData,
                createdBy: integrationData.pharmacistId,
                lastModifiedBy: integrationData.pharmacistId,
            });
            await clinicalNote.save();
            logger_1.default.info('Clinical note created from diagnostic', {
                diagnosticRequestId: integrationData.diagnosticRequestId,
                clinicalNoteId: clinicalNote._id,
                patientId: integrationData.patientId,
            });
            return clinicalNote;
        }
        catch (error) {
            logger_1.default.error('Error creating clinical note from diagnostic', {
                error: error instanceof Error ? error.message : 'Unknown error',
                integrationData,
            });
            throw error;
        }
    }
    async addDiagnosticDataToMTR(mtrId, integrationData) {
        try {
            const mtr = await MedicationTherapyReview_1.default.findById(mtrId);
            if (!mtr) {
                throw new Error('MTR not found');
            }
            const diagnosticRequest = await DiagnosticRequest_1.default.findById(integrationData.diagnosticRequestId);
            if (!diagnosticRequest) {
                throw new Error('Diagnostic request not found');
            }
            let diagnosticResult = null;
            if (integrationData.diagnosticResultId) {
                diagnosticResult = await DiagnosticResult_1.default.findById(integrationData.diagnosticResultId);
            }
            await this.enrichMTRWithDiagnosticData(mtr, diagnosticRequest, diagnosticResult);
            await mtr.save();
            logger_1.default.info('MTR enriched with diagnostic data', {
                mtrId,
                diagnosticRequestId: integrationData.diagnosticRequestId,
                patientId: integrationData.patientId,
            });
            return mtr;
        }
        catch (error) {
            logger_1.default.error('Error adding diagnostic data to MTR', {
                error: error instanceof Error ? error.message : 'Unknown error',
                mtrId,
                integrationData,
            });
            throw error;
        }
    }
    async createMTRFromDiagnostic(integrationData, mtrData) {
        try {
            const diagnosticRequest = await DiagnosticRequest_1.default.findById(integrationData.diagnosticRequestId);
            if (!diagnosticRequest) {
                throw new Error('Diagnostic request not found');
            }
            let diagnosticResult = null;
            if (integrationData.diagnosticResultId) {
                diagnosticResult = await DiagnosticResult_1.default.findById(integrationData.diagnosticResultId);
            }
            const mtrReviewData = this.buildMTRFromDiagnostic(diagnosticRequest, diagnosticResult, mtrData);
            const mtr = new MedicationTherapyReview_1.default({
                workplaceId: integrationData.workplaceId,
                patientId: integrationData.patientId,
                pharmacistId: integrationData.pharmacistId,
                ...mtrReviewData,
                patientConsent: true,
                confidentialityAgreed: true,
                createdBy: integrationData.pharmacistId,
                updatedBy: integrationData.pharmacistId,
            });
            await mtr.save();
            logger_1.default.info('MTR created from diagnostic', {
                diagnosticRequestId: integrationData.diagnosticRequestId,
                mtrId: mtr._id,
                patientId: integrationData.patientId,
            });
            return mtr;
        }
        catch (error) {
            logger_1.default.error('Error creating MTR from diagnostic', {
                error: error instanceof Error ? error.message : 'Unknown error',
                integrationData,
            });
            throw error;
        }
    }
    async getUnifiedPatientTimeline(patientId, workplaceId, options = {}) {
        try {
            const { startDate, endDate, limit = 50 } = options;
            const dateFilter = {};
            if (startDate)
                dateFilter.$gte = startDate;
            if (endDate)
                dateFilter.$lte = endDate;
            const baseFilter = {
                workplaceId,
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
            };
            const diagnosticRequests = await DiagnosticRequest_1.default.find({
                ...baseFilter,
                patientId,
            }).sort({ createdAt: -1 }).limit(limit);
            const clinicalNotes = await ClinicalNote_1.default.findActive({
                ...baseFilter,
                patient: patientId,
            }).sort({ createdAt: -1 }).limit(limit);
            const mtrs = await MedicationTherapyReview_1.default.find({
                ...baseFilter,
                patientId,
                isDeleted: false,
            }).sort({ createdAt: -1 }).limit(limit);
            const timelineEvents = [
                ...diagnosticRequests.map(req => ({
                    type: 'diagnostic',
                    id: req._id,
                    date: req.createdAt,
                    title: `Diagnostic Assessment - ${req.clinicalContext?.chiefComplaint || 'General Assessment'}`,
                    summary: this.summarizeDiagnosticRequest(req),
                    priority: req.priority,
                    status: req.status,
                    data: req,
                })),
                ...clinicalNotes.map(note => ({
                    type: 'clinical_note',
                    id: note._id,
                    date: note.createdAt,
                    title: note.title,
                    summary: this.summarizeClinicalNote(note),
                    priority: note.priority,
                    data: note,
                })),
                ...mtrs.map(mtr => ({
                    type: 'mtr',
                    id: mtr._id,
                    date: mtr.createdAt,
                    title: `MTR - ${mtr.reviewNumber}`,
                    summary: this.summarizeMTR(mtr),
                    priority: mtr.priority,
                    status: mtr.status,
                    data: mtr,
                })),
            ];
            return timelineEvents
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, limit);
        }
        catch (error) {
            logger_1.default.error('Error getting unified patient timeline', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId,
                workplaceId,
            });
            throw error;
        }
    }
    async crossReferenceWithExistingRecords(diagnosticRequestId) {
        try {
            const diagnosticRequest = await DiagnosticRequest_1.default.findById(diagnosticRequestId);
            if (!diagnosticRequest) {
                throw new Error('Diagnostic request not found');
            }
            const patientId = diagnosticRequest.patientId;
            const workplaceId = diagnosticRequest.workplaceId;
            const recentClinicalNotes = await ClinicalNote_1.default.findActive({
                patient: patientId,
                workplaceId,
                createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            }).sort({ createdAt: -1 }).limit(10);
            const recentMTRs = await MedicationTherapyReview_1.default.find({
                patientId,
                workplaceId,
                isDeleted: false,
                createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
            }).sort({ createdAt: -1 }).limit(5);
            const correlations = this.findCorrelations(diagnosticRequest, recentClinicalNotes, recentMTRs);
            return {
                relatedClinicalNotes: recentClinicalNotes,
                relatedMTRs: recentMTRs,
                correlations,
            };
        }
        catch (error) {
            logger_1.default.error('Error cross-referencing diagnostic data', {
                error: error instanceof Error ? error.message : 'Unknown error',
                diagnosticRequestId,
            });
            throw error;
        }
    }
    buildClinicalNoteFromDiagnostic(diagnosticRequest, diagnosticResult, noteData) {
        const symptoms = diagnosticRequest.inputSnapshot?.symptoms;
        const vitals = diagnosticRequest.inputSnapshot?.vitals;
        const subjective = [
            symptoms?.subjective?.join(', ') || '',
            symptoms?.duration ? `Duration: ${symptoms.duration}` : '',
            symptoms?.onset ? `Onset: ${symptoms.onset}` : '',
        ].filter(Boolean).join('. ');
        const objective = [
            symptoms?.objective?.join(', ') || '',
            vitals ? this.formatVitals(vitals) : '',
        ].filter(Boolean).join('. ');
        let assessment = '';
        let plan = '';
        let recommendations = [];
        let priority = 'medium';
        let followUpRequired = false;
        let followUpDate;
        if (diagnosticResult) {
            assessment = diagnosticResult.diagnoses
                .map(d => `${d.condition} (${Math.round(d.probability * 100)}% confidence): ${d.reasoning}`)
                .join('. ');
            plan = diagnosticResult.medicationSuggestions
                .map(m => `${m.drugName} ${m.dosage} ${m.frequency}: ${m.reasoning}`)
                .join('. ');
            recommendations = [
                ...diagnosticResult.medicationSuggestions.map(m => `Consider ${m.drugName} ${m.dosage} ${m.frequency}`),
                ...diagnosticResult.suggestedTests?.map(t => `Order ${t.testName} (${t.priority})`) || [],
            ];
            const hasCriticalFlags = diagnosticResult.redFlags.some(f => f.severity === 'critical');
            const hasHighFlags = diagnosticResult.redFlags.some(f => f.severity === 'high');
            if (hasCriticalFlags)
                priority = 'high';
            else if (hasHighFlags)
                priority = 'medium';
            else
                priority = 'low';
            if (diagnosticResult.referralRecommendation?.recommended) {
                followUpRequired = true;
                const urgency = diagnosticResult.referralRecommendation.urgency;
                if (urgency === 'immediate') {
                    followUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                }
                else if (urgency === 'within_24h') {
                    followUpDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                }
                else {
                    followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                }
            }
        }
        return {
            title: noteData?.title || `Diagnostic Assessment - ${symptoms?.subjective?.[0] || 'General'}`,
            content: {
                subjective: noteData?.content?.subjective || subjective,
                objective: noteData?.content?.objective || objective,
                assessment: noteData?.content?.assessment || assessment,
                plan: noteData?.content?.plan || plan,
            },
            type: noteData?.type || 'consultation',
            priority: noteData?.priority || priority,
            followUpRequired: noteData?.followUpRequired ?? followUpRequired,
            followUpDate: noteData?.followUpDate || followUpDate,
            tags: noteData?.tags || ['diagnostic', 'ai-assisted'],
            recommendations: noteData?.recommendations || recommendations,
        };
    }
    buildMTRFromDiagnostic(diagnosticRequest, diagnosticResult, mtrData) {
        let priority = 'routine';
        let reviewReason = 'Diagnostic assessment indicated medication review';
        if (diagnosticResult) {
            const hasCriticalFlags = diagnosticResult.redFlags.some(f => f.severity === 'critical');
            const hasHighFlags = diagnosticResult.redFlags.some(f => f.severity === 'high');
            const hasMedicationSuggestions = diagnosticResult.medicationSuggestions.length > 0;
            if (hasCriticalFlags)
                priority = 'high_risk';
            else if (hasHighFlags || hasMedicationSuggestions)
                priority = 'urgent';
            reviewReason = `Diagnostic assessment revealed: ${diagnosticResult.diagnoses.map(d => d.condition).join(', ')}`;
        }
        return {
            reviewType: 'targeted',
            priority: mtrData?.priority || priority,
            reviewReason: mtrData?.reviewReason || reviewReason,
            steps: {
                patientSelection: {
                    completed: true,
                    completedAt: new Date(),
                    data: {
                        source: 'diagnostic_assessment',
                        diagnosticRequestId: diagnosticRequest._id,
                    },
                },
                medicationHistory: { completed: false },
                therapyAssessment: { completed: false },
                planDevelopment: { completed: false },
                interventions: { completed: false },
                followUp: { completed: false },
            },
        };
    }
    async enrichMTRWithDiagnosticData(mtr, diagnosticRequest, diagnosticResult) {
        if (diagnosticResult) {
            const diagnosticFindings = diagnosticResult.diagnoses.map(d => d.condition).join(', ');
            mtr.reviewReason = `${mtr.reviewReason || 'MTR'}. Diagnostic findings: ${diagnosticFindings}`;
        }
        if (diagnosticResult && !mtr.steps.therapyAssessment.completed) {
            mtr.steps.therapyAssessment.data = {
                ...mtr.steps.therapyAssessment.data,
                diagnosticFindings: {
                    diagnoses: diagnosticResult.diagnoses,
                    redFlags: diagnosticResult.redFlags,
                    medicationSuggestions: diagnosticResult.medicationSuggestions,
                    source: 'ai_diagnostic_assessment',
                    requestId: diagnosticRequest._id,
                },
            };
        }
        if (diagnosticResult) {
            const hasCriticalFlags = diagnosticResult.redFlags.some(f => f.severity === 'critical');
            if (hasCriticalFlags && mtr.priority !== 'high_risk') {
                mtr.priority = 'high_risk';
            }
        }
    }
    formatVitals(vitals) {
        const vitalStrings = [];
        if (vitals.bloodPressure) {
            vitalStrings.push(`BP: ${vitals.bloodPressure}`);
        }
        if (vitals.heartRate) {
            vitalStrings.push(`HR: ${vitals.heartRate} bpm`);
        }
        if (vitals.temperature) {
            vitalStrings.push(`Temp: ${vitals.temperature}°C`);
        }
        if (vitals.bloodGlucose) {
            vitalStrings.push(`BG: ${vitals.bloodGlucose} mg/dL`);
        }
        if (vitals.respiratoryRate) {
            vitalStrings.push(`RR: ${vitals.respiratoryRate}/min`);
        }
        return vitalStrings.join(', ');
    }
    summarizeDiagnosticRequest(request) {
        const symptoms = request.inputSnapshot?.symptoms?.subjective?.slice(0, 2).join(', ') || 'Assessment';
        return `${symptoms}. Status: ${request.status}`;
    }
    summarizeClinicalNote(note) {
        const assessment = note.content?.assessment?.substring(0, 100) || '';
        return assessment + (assessment.length === 100 ? '...' : '');
    }
    summarizeMTR(mtr) {
        const completion = mtr.getCompletionPercentage();
        const medicationCount = mtr.medications?.length || 0;
        return `${medicationCount} medications reviewed. ${completion}% complete.`;
    }
    findCorrelations(diagnosticRequest, clinicalNotes, mtrs) {
        const correlations = [];
        const diagnosticSymptoms = diagnosticRequest.inputSnapshot?.symptoms?.subjective || [];
        const diagnosticMedications = diagnosticRequest.inputSnapshot?.currentMedications || [];
        clinicalNotes.forEach(note => {
            const noteContent = [
                note.content?.subjective || '',
                note.content?.objective || '',
                note.content?.assessment || '',
            ].join(' ').toLowerCase();
            diagnosticSymptoms.forEach(symptom => {
                if (noteContent.includes(symptom.toLowerCase())) {
                    correlations.push({
                        type: 'symptom_match',
                        recordType: 'clinical_note',
                        recordId: note._id,
                        correlation: `Symptom "${symptom}" mentioned in previous note`,
                        confidence: 0.8,
                    });
                }
            });
        });
        mtrs.forEach(mtr => {
            diagnosticMedications.forEach(diagMed => {
                const matchingMedication = mtr.medications?.find(mtrMed => mtrMed.drugName.toLowerCase().includes(diagMed.name.toLowerCase()) ||
                    diagMed.name.toLowerCase().includes(mtrMed.drugName.toLowerCase()));
                if (matchingMedication) {
                    correlations.push({
                        type: 'medication_match',
                        recordType: 'mtr',
                        recordId: mtr._id,
                        correlation: `Medication "${diagMed.name}" was reviewed in previous MTR`,
                        confidence: 0.9,
                    });
                }
            });
        });
        return correlations;
    }
}
exports.DiagnosticIntegrationService = DiagnosticIntegrationService;
exports.default = new DiagnosticIntegrationService();
//# sourceMappingURL=integrationService.js.map