"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticService = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const DiagnosticRequest_1 = __importDefault(require("../models/DiagnosticRequest"));
const DiagnosticResult_1 = __importDefault(require("../models/DiagnosticResult"));
const DiagnosticCase_1 = __importDefault(require("../../../models/DiagnosticCase"));
const Patient_1 = __importDefault(require("../../../models/Patient"));
const User_1 = __importDefault(require("../../../models/User"));
const openRouterService_1 = __importDefault(require("../../../services/openRouterService"));
const clinicalApiService_1 = __importDefault(require("./clinicalApiService"));
const labService_1 = __importDefault(require("./labService"));
const auditService_1 = require("../../../services/auditService");
class DiagnosticService {
    constructor() {
        this.maxRetries = 3;
        this.processingTimeout = 300000;
    }
    async createDiagnosticRequest(data) {
        try {
            const patient = await Patient_1.default.findOne({
                _id: data.patientId,
                workplaceId: data.workplaceId,
            });
            if (!patient) {
                throw new Error('Patient not found or does not belong to this workplace');
            }
            const pharmacist = await User_1.default.findOne({
                _id: data.pharmacistId,
                workplaceId: data.workplaceId,
            });
            if (!pharmacist) {
                throw new Error('Pharmacist not found or does not belong to this workplace');
            }
            if (!data.consentObtained) {
                throw new Error('Patient consent is required for AI diagnostic processing');
            }
            const existingRequest = await DiagnosticRequest_1.default.findOne({
                patientId: data.patientId,
                workplaceId: data.workplaceId,
                status: { $in: ['pending', 'processing'] },
                isDeleted: false,
            });
            if (existingRequest) {
                throw new Error('ACTIVE_REQUEST_EXISTS');
            }
            const diagnosticRequest = new DiagnosticRequest_1.default({
                patientId: new mongoose_1.Types.ObjectId(data.patientId),
                pharmacistId: new mongoose_1.Types.ObjectId(data.pharmacistId),
                workplaceId: new mongoose_1.Types.ObjectId(data.workplaceId),
                locationId: data.locationId,
                inputSnapshot: data.inputSnapshot,
                priority: data.priority || 'routine',
                consentObtained: data.consentObtained,
                consentTimestamp: new Date(),
                promptVersion: 'v1.0',
                status: 'pending',
                createdBy: new mongoose_1.Types.ObjectId(data.pharmacistId),
            });
            const savedRequest = await diagnosticRequest.save();
            await auditService_1.AuditService.logActivity({
                userId: new mongoose_1.Types.ObjectId(data.pharmacistId),
                workplaceId: new mongoose_1.Types.ObjectId(data.workplaceId),
                userRole: pharmacist.role,
            }, {
                action: 'DIAGNOSTIC_CASE_CREATED',
                resourceType: 'DiagnosticRequest',
                resourceId: savedRequest._id,
                complianceCategory: 'patient_care',
                riskLevel: data.priority === 'urgent' ? 'high' : 'low',
                details: {
                    patientId: data.patientId,
                    priority: data.priority,
                    symptomsCount: data.inputSnapshot.symptoms.subjective.length,
                },
            });
            logger_1.default.info('Diagnostic request created successfully', {
                requestId: savedRequest._id,
                patientId: data.patientId,
                pharmacistId: data.pharmacistId,
                workplaceId: data.workplaceId,
                priority: data.priority,
            });
            return savedRequest;
        }
        catch (error) {
            logger_1.default.error('Failed to create diagnostic request:', error);
            if (error instanceof Error && error.message === 'ACTIVE_REQUEST_EXISTS') {
                throw error;
            }
            throw new Error(`Failed to create diagnostic request: ${error}`);
        }
    }
    async processDiagnosticRequest(requestId, options = {}) {
        const startTime = Date.now();
        let request = null;
        try {
            request = await DiagnosticRequest_1.default.findById(requestId);
            if (!request) {
                throw new Error('Diagnostic request not found');
            }
            if (!['pending', 'failed'].includes(request.status)) {
                throw new Error(`Cannot process request with status: ${request.status}`);
            }
            if (request.status === 'failed' && !request.canRetry()) {
                throw new Error('Maximum retry attempts exceeded');
            }
            await request.markAsProcessing();
            logger_1.default.info('Starting diagnostic processing', {
                requestId,
                patientId: request.patientId,
                retryCount: request.retryCount,
            });
            const patientData = await this.aggregatePatientData(request);
            let interactionResults = [];
            if (!options.skipInteractionCheck && patientData.medications && patientData.medications.length > 0) {
                try {
                    const medicationNames = patientData.medications.map(med => med.name);
                    const interactionCheck = await clinicalApiService_1.default.checkDrugInteractions(medicationNames);
                    interactionResults = interactionCheck.data;
                    logger_1.default.info('Drug interaction check completed', {
                        requestId,
                        medicationsCount: medicationNames.length,
                        interactionsFound: interactionResults.length,
                    });
                }
                catch (error) {
                    logger_1.default.warn('Drug interaction check failed, continuing without interaction data', {
                        requestId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
            let labValidation = [];
            if (!options.skipLabValidation && patientData.labResults && patientData.labResults.length > 0) {
                try {
                    labValidation = await Promise.all(patientData.labResults.map(async (labResult) => {
                        return await labService_1.default.validateResult(labResult);
                    }));
                    logger_1.default.info('Lab result validation completed', {
                        requestId,
                        labResultsCount: patientData.labResults.length,
                    });
                }
                catch (error) {
                    logger_1.default.warn('Lab result validation failed, continuing without validation data', {
                        requestId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
            const aiInput = this.prepareAIInput(patientData, interactionResults, labValidation);
            const aiAnalysis = await Promise.race([
                openRouterService_1.default.generateDiagnosticAnalysis(aiInput),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI processing timeout')), this.processingTimeout)),
            ]);
            const diagnosticResult = await this.createDiagnosticResult(request, aiAnalysis, interactionResults, labValidation);
            await request.markAsCompleted();
            const processingTime = Date.now() - startTime;
            const pharmacist = await User_1.default.findById(request.pharmacistId);
            const userRole = pharmacist?.role || 'unknown';
            await auditService_1.AuditService.logActivity({
                userId: request.pharmacistId.toString(),
                workspaceId: request.workplaceId.toString(),
            }, {
                action: 'DIAGNOSTIC_ANALYSIS_REQUESTED',
                resourceType: 'DiagnosticResult',
                resourceId: diagnosticResult._id,
                complianceCategory: 'patient_care',
                riskLevel: diagnosticResult.redFlags.length > 0 ? 'high' : 'low',
                details: {
                    requestId,
                    processingTime,
                    diagnosesCount: diagnosticResult.diagnoses.length,
                    confidenceScore: diagnosticResult.aiMetadata.confidenceScore,
                    hasRedFlags: diagnosticResult.redFlags.length > 0,
                    requiresReferral: diagnosticResult.referralRecommendation?.recommended || false,
                },
            });
            logger_1.default.info('Diagnostic processing completed successfully', {
                requestId,
                resultId: diagnosticResult._id,
                processingTime,
                diagnosesCount: diagnosticResult.diagnoses.length,
                confidenceScore: diagnosticResult.aiMetadata.confidenceScore,
            });
            return {
                request,
                result: diagnosticResult,
                processingTime,
                interactionResults,
                labValidation,
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            if (request) {
                await request.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
            }
            if (request) {
                const pharmacist = await User_1.default.findById(request.pharmacistId);
                const userRole = pharmacist?.role || 'unknown';
                await auditService_1.AuditService.logActivity({
                    userId: request.pharmacistId,
                    workplaceId: request.workplaceId,
                    userRole: userRole,
                }, {
                    action: 'DIAGNOSTIC_ANALYSIS_REQUESTED',
                    resourceType: 'DiagnosticRequest',
                    resourceId: new mongoose_1.Types.ObjectId(requestId),
                    complianceCategory: 'patient_care',
                    riskLevel: 'high',
                    details: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        processingTime,
                        retryCount: request.retryCount,
                    },
                });
            }
            logger_1.default.error('Diagnostic processing failed', {
                requestId,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
            });
            throw new Error(`Diagnostic processing failed: ${error}`);
        }
    }
    async aggregatePatientData(request) {
        try {
            const patient = await Patient_1.default.findById(request.patientId);
            if (!patient) {
                throw new Error('Patient not found');
            }
            const age = patient.dob ? Math.floor((Date.now() - patient.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : patient.age || 0;
            let labResults = [];
            if (request.inputSnapshot.labResultIds && request.inputSnapshot.labResultIds.length > 0) {
                labResults = await labService_1.default.getLabResults(request.workplaceId.toString(), {
                    patientId: request.patientId.toString(),
                }).then(response => response.results);
            }
            const aggregatedData = {
                demographics: {
                    age,
                    gender: patient.gender || 'unknown',
                    weight: request.inputSnapshot.vitals?.weight,
                    height: request.inputSnapshot.vitals?.height,
                },
                symptoms: request.inputSnapshot.symptoms,
                vitals: request.inputSnapshot.vitals,
                medications: request.inputSnapshot.currentMedications || [],
                allergies: request.inputSnapshot.allergies || [],
                medicalHistory: request.inputSnapshot.medicalHistory || [],
                labResults,
                socialHistory: request.inputSnapshot.socialHistory,
                familyHistory: request.inputSnapshot.familyHistory || [],
            };
            logger_1.default.info('Patient data aggregated successfully', {
                requestId: request._id,
                patientId: request.patientId,
                age,
                medicationsCount: aggregatedData.medications.length,
                allergiesCount: aggregatedData.allergies.length,
                labResultsCount: labResults.length,
            });
            return aggregatedData;
        }
        catch (error) {
            logger_1.default.error('Failed to aggregate patient data:', error);
            throw new Error(`Failed to aggregate patient data: ${error}`);
        }
    }
    prepareAIInput(patientData, interactionResults, labValidation) {
        const labResults = patientData.labResults.map(result => ({
            testName: result.testName,
            value: result.value,
            referenceRange: result.referenceRange.text ||
                `${result.referenceRange.low || ''}-${result.referenceRange.high || ''} ${result.unit || ''}`,
            abnormal: result.interpretation !== 'normal',
        }));
        const currentMedications = patientData.medications ? patientData.medications.map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            startDate: undefined,
            route: undefined,
            indication: undefined,
        })) : undefined;
        const aiInput = {
            symptoms: patientData.symptoms,
            labResults: labResults.length > 0 ? labResults : undefined,
            currentMedications: currentMedications && currentMedications.length > 0 ? currentMedications : undefined,
            vitalSigns: patientData.vitals ? {
                bloodPressure: patientData.vitals.bloodPressure,
                heartRate: patientData.vitals.heartRate,
                temperature: patientData.vitals.temperature,
                respiratoryRate: patientData.vitals.respiratoryRate,
                oxygenSaturation: patientData.vitals.oxygenSaturation,
            } : undefined,
            patientAge: patientData.demographics.age,
            patientGender: patientData.demographics.gender,
            allergies: patientData.allergies.length > 0 ? patientData.allergies : undefined,
            medicalHistory: patientData.medicalHistory.length > 0 ? patientData.medicalHistory : undefined,
        };
        return aiInput;
    }
    async createDiagnosticResult(request, aiAnalysis, interactionResults, labValidation) {
        try {
            const diagnoses = aiAnalysis.analysis.differentialDiagnoses.map((diagnosis) => ({
                condition: diagnosis.condition,
                probability: diagnosis.probability / 100,
                reasoning: diagnosis.reasoning,
                severity: diagnosis.severity,
                confidence: this.mapConfidenceLevel(diagnosis.probability),
                evidenceLevel: this.mapEvidenceLevel(diagnosis.probability),
            }));
            const suggestedTests = aiAnalysis.analysis.recommendedTests?.map((test) => ({
                testName: test.testName,
                priority: test.priority,
                reasoning: test.reasoning,
                clinicalSignificance: test.reasoning,
            })) || [];
            const medicationSuggestions = aiAnalysis.analysis.therapeuticOptions?.map((option) => ({
                drugName: option.medication,
                dosage: option.dosage,
                frequency: option.frequency,
                duration: option.duration,
                reasoning: option.reasoning,
                safetyNotes: option.safetyNotes || [],
            })) || [];
            const redFlags = aiAnalysis.analysis.redFlags?.map((flag) => ({
                flag: flag.flag,
                severity: flag.severity,
                action: flag.action,
                clinicalRationale: flag.action,
            })) || [];
            const overallRisk = this.calculateOverallRisk(diagnoses, redFlags, interactionResults);
            const diagnosticResult = new DiagnosticResult_1.default({
                requestId: request._id,
                workplaceId: request.workplaceId,
                diagnoses,
                suggestedTests,
                medicationSuggestions,
                redFlags,
                referralRecommendation: aiAnalysis.analysis.referralRecommendation,
                differentialDiagnosis: diagnoses.map((d) => d.condition),
                clinicalImpression: this.generateClinicalImpression(diagnoses, request.inputSnapshot.symptoms),
                riskAssessment: {
                    overallRisk,
                    riskFactors: this.extractRiskFactors(diagnoses, interactionResults, labValidation),
                    mitigatingFactors: this.extractMitigatingFactors(request.inputSnapshot),
                },
                aiMetadata: {
                    modelId: 'deepseek/deepseek-chat-v3.1',
                    modelVersion: 'v3.1',
                    confidenceScore: aiAnalysis.analysis.confidenceScore / 100,
                    processingTime: aiAnalysis.processingTime,
                    tokenUsage: {
                        promptTokens: aiAnalysis.usage.prompt_tokens,
                        completionTokens: aiAnalysis.usage.completion_tokens,
                        totalTokens: aiAnalysis.usage.total_tokens,
                    },
                    requestId: aiAnalysis.requestId,
                },
                rawResponse: JSON.stringify(aiAnalysis.analysis),
                disclaimer: aiAnalysis.analysis.disclaimer,
                followUpRequired: this.determineFollowUpRequired(diagnoses, redFlags),
                createdBy: request.pharmacistId,
            });
            const savedResult = await diagnosticResult.save();
            logger_1.default.info('Diagnostic result created successfully', {
                resultId: savedResult._id,
                requestId: request._id,
                diagnosesCount: diagnoses.length,
                overallRisk,
                followUpRequired: savedResult.followUpRequired,
            });
            return savedResult;
        }
        catch (error) {
            logger_1.default.error('Failed to create diagnostic result:', error);
            throw new Error(`Failed to create diagnostic result: ${error}`);
        }
    }
    mapConfidenceLevel(probability) {
        if (probability >= 70)
            return 'high';
        if (probability >= 40)
            return 'medium';
        return 'low';
    }
    mapEvidenceLevel(probability) {
        if (probability >= 80)
            return 'definite';
        if (probability >= 60)
            return 'probable';
        if (probability >= 30)
            return 'possible';
        return 'unlikely';
    }
    calculateOverallRisk(diagnoses, redFlags, interactionResults) {
        if (redFlags.some(flag => flag.severity === 'critical')) {
            return 'critical';
        }
        if (diagnoses.some(diagnosis => diagnosis.severity === 'high' && diagnosis.probability > 0.5)) {
            return 'high';
        }
        if (interactionResults.some(interaction => interaction.severity === 'major' || interaction.severity === 'contraindicated')) {
            return 'high';
        }
        if (redFlags.some(flag => flag.severity === 'high')) {
            return 'high';
        }
        if (diagnoses.some(diagnosis => diagnosis.severity === 'medium' && diagnosis.probability > 0.6)) {
            return 'medium';
        }
        return 'low';
    }
    extractRiskFactors(diagnoses, interactionResults, labValidation) {
        const riskFactors = [];
        diagnoses
            .filter(diagnosis => diagnosis.probability > 0.5 && diagnosis.severity !== 'low')
            .forEach(diagnosis => {
            riskFactors.push(`High probability of ${diagnosis.condition}`);
        });
        interactionResults
            .filter(interaction => ['moderate', 'major', 'contraindicated'].includes(interaction.severity))
            .forEach(interaction => {
            riskFactors.push(`Drug interaction: ${interaction.drugPair.drug1} + ${interaction.drugPair.drug2}`);
        });
        labValidation
            .filter(validation => validation.interpretation !== 'normal')
            .forEach(validation => {
            riskFactors.push(`Abnormal lab result: ${validation.interpretation}`);
        });
        return riskFactors;
    }
    extractMitigatingFactors(inputSnapshot) {
        const mitigatingFactors = [];
        if (inputSnapshot.socialHistory?.exercise === 'active' || inputSnapshot.socialHistory?.exercise === 'moderate') {
            mitigatingFactors.push('Regular physical activity');
        }
        if (inputSnapshot.socialHistory?.smoking === 'never') {
            mitigatingFactors.push('Non-smoker');
        }
        if (inputSnapshot.socialHistory?.alcohol === 'never' || inputSnapshot.socialHistory?.alcohol === 'occasional') {
            mitigatingFactors.push('Minimal alcohol consumption');
        }
        if (inputSnapshot.symptoms.severity === 'mild') {
            mitigatingFactors.push('Mild symptom severity');
        }
        return mitigatingFactors;
    }
    generateClinicalImpression(diagnoses, symptoms) {
        const primaryDiagnosis = diagnoses.reduce((highest, current) => current.probability > highest.probability ? current : highest);
        const impression = `Patient presents with ${symptoms.onset} onset ${symptoms.severity} ${symptoms.subjective.join(', ')}. ` +
            `Most likely diagnosis is ${primaryDiagnosis.condition} (${Math.round(primaryDiagnosis.probability * 100)}% probability). ` +
            `${primaryDiagnosis.reasoning}`;
        return impression;
    }
    determineFollowUpRequired(diagnoses, redFlags) {
        if (diagnoses.some(diagnosis => diagnosis.severity === 'high' && diagnosis.probability > 0.4)) {
            return true;
        }
        if (redFlags.length > 0) {
            return true;
        }
        return false;
    }
    async getDiagnosticRequest(requestId, workplaceId) {
        try {
            const isMongoId = /^[0-9a-fA-F]{24}$/.test(requestId);
            const isLegacyCaseId = /^DX-[A-Z0-9]+-[A-Z0-9]+$/i.test(requestId);
            const workplaceObjectId = new mongoose_1.Types.ObjectId(workplaceId);
            if (isMongoId) {
                const request = await DiagnosticRequest_1.default.findOne({
                    _id: requestId,
                    workplaceId: workplaceObjectId,
                    isDeleted: false,
                })
                    .populate('patientId', 'firstName lastName dateOfBirth gender')
                    .populate('pharmacistId', 'firstName lastName')
                    .lean()
                    .maxTimeMS(10000);
                return request;
            }
            if (isLegacyCaseId) {
                const legacyCase = await DiagnosticCase_1.default.findOne({
                    caseId: requestId.toUpperCase(),
                    workplaceId: workplaceObjectId,
                })
                    .populate('patientId', 'firstName lastName dateOfBirth gender')
                    .populate('pharmacistId', 'firstName lastName')
                    .lean()
                    .maxTimeMS(10000);
                if (!legacyCase)
                    return null;
                const requestLike = {
                    _id: legacyCase._id,
                    patientId: legacyCase.patientId,
                    pharmacistId: legacyCase.pharmacistId,
                    workplaceId: legacyCase.workplaceId,
                    inputSnapshot: {
                        symptoms: legacyCase.symptoms || { subjective: [], objective: [], duration: '', severity: 'mild', onset: 'acute' },
                        vitals: legacyCase.vitalSigns || {},
                        currentMedications: legacyCase.currentMedications || [],
                        allergies: [],
                        medicalHistory: [],
                        labResultIds: [],
                    },
                    priority: 'routine',
                    consentObtained: true,
                    promptVersion: 'legacy',
                    status: legacyCase.aiAnalysis ? 'completed' : 'processing',
                    processingStartedAt: legacyCase.createdAt,
                    processingCompletedAt: legacyCase.aiAnalysis ? legacyCase.updatedAt : undefined,
                    createdAt: legacyCase.createdAt,
                    updatedAt: legacyCase.updatedAt,
                    createdBy: legacyCase.pharmacistId,
                    retryCount: 0,
                };
                return requestLike;
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to get diagnostic request:', error);
            throw new Error(`Failed to get diagnostic request: ${error}`);
        }
    }
    async getDiagnosticResult(requestId, workplaceId) {
        try {
            const isMongoId = /^[0-9a-fA-F]{24}$/.test(requestId);
            const isLegacyCaseId = /^DX-[A-Z0-9]+-[A-Z0-9]+$/i.test(requestId);
            const workplaceObjectId = new mongoose_1.Types.ObjectId(workplaceId);
            if (isMongoId) {
                const result = await DiagnosticResult_1.default.findOne({
                    requestId: new mongoose_1.Types.ObjectId(requestId),
                    workplaceId: workplaceObjectId,
                    isDeleted: false,
                })
                    .lean()
                    .maxTimeMS(10000);
                return result;
            }
            if (isLegacyCaseId) {
                const legacyCase = await DiagnosticCase_1.default.findOne({
                    caseId: requestId.toUpperCase(),
                    workplaceId: workplaceObjectId,
                }).lean().maxTimeMS(10000);
                if (!legacyCase || !legacyCase.aiAnalysis) {
                    return null;
                }
                const ai = legacyCase.aiAnalysis;
                const diagnoses = (ai.differentialDiagnoses || []).map((d) => ({
                    condition: d.condition || 'Unknown',
                    probability: typeof d.probability === 'number' && d.probability > 1 ? d.probability / 100 : (d.probability || 0),
                    reasoning: d.reasoning || 'No reasoning provided',
                    severity: d.severity || 'medium',
                    icdCode: undefined,
                    snomedCode: undefined,
                    confidence: d.severity || 'medium',
                    evidenceLevel: 'probable',
                }));
                const suggestedTests = (ai.recommendedTests || []).map((t) => ({
                    testName: t.testName || 'Unknown test',
                    priority: t.priority || 'routine',
                    reasoning: t.reasoning || 'No reasoning provided',
                    loincCode: undefined,
                    expectedCost: undefined,
                    turnaroundTime: undefined,
                    clinicalSignificance: 'Recommended based on presenting symptoms',
                }));
                const medicationSuggestions = (ai.therapeuticOptions || []).map((m) => ({
                    drugName: m.medication || 'Unknown',
                    dosage: m.dosage || '',
                    frequency: m.frequency || '',
                    duration: m.duration || '',
                    reasoning: m.reasoning || 'No reasoning provided',
                    safetyNotes: m.safetyNotes || [],
                    rxcui: undefined,
                    contraindications: [],
                    monitoringParameters: [],
                    alternativeOptions: [],
                }));
                const redFlags = (ai.redFlags || []).map((r) => ({
                    flag: r.flag || 'Risk factor',
                    severity: r.severity || 'medium',
                    action: r.action || 'Monitor',
                    timeframe: undefined,
                    clinicalRationale: r.action || 'See action',
                }));
                const highestSeverity = redFlags.reduce((acc, cur) => {
                    const order = { low: 1, medium: 2, high: 3, critical: 4 };
                    return order[cur.severity] > order[acc] ? cur.severity : acc;
                }, 'medium');
                const resultLike = {
                    _id: legacyCase._id,
                    requestId: legacyCase._id,
                    workplaceId: legacyCase.workplaceId,
                    diagnoses,
                    suggestedTests,
                    medicationSuggestions,
                    redFlags,
                    referralRecommendation: ai.referralRecommendation || undefined,
                    differentialDiagnosis: diagnoses.map((d) => d.condition),
                    clinicalImpression: 'AI-assisted diagnostic impression',
                    riskAssessment: {
                        overallRisk: highestSeverity,
                        riskFactors: redFlags.map((r) => r.flag),
                        mitigatingFactors: [],
                    },
                    aiMetadata: {
                        modelId: 'legacy',
                        modelVersion: 'legacy',
                        confidenceScore: ai.confidenceScore || 0,
                        processingTime: ai.processingTime || 0,
                        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                        requestId: requestId,
                    },
                    rawResponse: JSON.stringify({ source: 'legacy', caseId: legacyCase.caseId }),
                    disclaimer: ai.disclaimer || 'This AI-generated diagnostic analysis is for informational purposes only.',
                    validationScore: undefined,
                    qualityFlags: [],
                    pharmacistReview: undefined,
                    followUpRequired: false,
                    followUpDate: undefined,
                    followUpInstructions: [],
                    createdAt: legacyCase.createdAt,
                    updatedAt: legacyCase.updatedAt,
                    isDeleted: false,
                };
                return resultLike;
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Failed to get diagnostic result:', error);
            throw new Error(`Failed to get diagnostic result: ${error}`);
        }
    }
    async getPatientDiagnosticHistory(patientId, workplaceId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [requests, total] = await Promise.all([
                DiagnosticRequest_1.default.find({
                    patientId: new mongoose_1.Types.ObjectId(patientId),
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    isDeleted: false,
                })
                    .populate('pharmacistId', 'firstName lastName')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                DiagnosticRequest_1.default.countDocuments({
                    patientId: new mongoose_1.Types.ObjectId(patientId),
                    workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                    isDeleted: false,
                }),
            ]);
            const totalPages = Math.ceil(total / limit);
            return {
                requests: requests,
                total,
                page,
                totalPages,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get patient diagnostic history:', error);
            throw new Error(`Failed to get patient diagnostic history: ${error}`);
        }
    }
    async retryDiagnosticRequest(requestId, options = {}) {
        try {
            const request = await DiagnosticRequest_1.default.findById(requestId);
            if (!request) {
                throw new Error('Diagnostic request not found');
            }
            if (!request.canRetry()) {
                throw new Error('Request cannot be retried (maximum attempts exceeded or invalid status)');
            }
            await request.incrementRetryCount();
            return await this.processDiagnosticRequest(requestId, { ...options, retryOnFailure: true });
        }
        catch (error) {
            logger_1.default.error('Failed to retry diagnostic request:', error);
            throw new Error(`Failed to retry diagnostic request: ${error}`);
        }
    }
    async cancelDiagnosticRequest(requestId, workplaceId, cancelledBy, reason) {
        try {
            const request = await DiagnosticRequest_1.default.findOne({
                _id: requestId,
                workplaceId: new mongoose_1.Types.ObjectId(workplaceId),
                isDeleted: false,
            });
            if (!request) {
                throw new Error('Diagnostic request not found');
            }
            if (!['pending', 'processing', 'failed'].includes(request.status)) {
                throw new Error(`Cannot cancel request with status: ${request.status}`);
            }
            await request.updateStatus('cancelled');
            request.errorMessage = reason || 'Cancelled by user';
            request.updatedBy = new mongoose_1.Types.ObjectId(cancelledBy);
            await request.save();
            const cancelledByUser = await User_1.default.findById(cancelledBy);
            const userRole = cancelledByUser?.role || 'unknown';
            await auditService_1.AuditService.logActivity({
                userId: cancelledBy,
                workspaceId: workplaceId,
            }, {
                action: 'DIAGNOSTIC_CASE_DELETED',
                resourceType: 'DiagnosticRequest',
                resourceId: new mongoose_1.Types.ObjectId(requestId),
                complianceCategory: 'patient_care',
                riskLevel: 'low',
                details: {
                    reason: reason || 'Cancelled by user',
                    originalStatus: request.status,
                },
            });
            logger_1.default.info('Diagnostic request cancelled', {
                requestId,
                cancelledBy,
                reason,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to cancel diagnostic request:', error);
            throw new Error(`Failed to cancel diagnostic request: ${error}`);
        }
    }
}
exports.DiagnosticService = DiagnosticService;
exports.default = new DiagnosticService();
//# sourceMappingURL=diagnosticService.js.map