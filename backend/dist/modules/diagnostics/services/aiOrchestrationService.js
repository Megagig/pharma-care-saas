"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOrchestrationService = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
const openRouterService_1 = __importDefault(require("../../../services/openRouterService"));
const auditService_1 = require("../../../services/auditService");
class AIOrchestrationService {
    constructor() {
        this.defaultOptions = {
            temperature: 0.1,
            maxTokens: 4000,
            timeout: 180000,
            retryAttempts: 3,
            promptVersion: 'v1.0',
        };
    }
    async processPatientCase(input, consent, options = {}) {
        const startTime = Date.now();
        const processingOptions = { ...this.defaultOptions, ...options };
        try {
            this.validateConsent(consent);
            this.validateInputData(input);
            await this.logAIRequest(input, consent, processingOptions);
            const prompt = this.buildStructuredPrompt(input, processingOptions.promptVersion);
            const promptHash = this.generatePromptHash(prompt);
            const aiResponse = await this.callOpenRouterWithRetry(input, processingOptions);
            const enhancedResponse = await this.validateAndEnhanceResponse(aiResponse, input, processingOptions, promptHash, startTime);
            await this.logAIResponse(enhancedResponse, consent, new mongoose_1.Types.ObjectId(input.workplaceId));
            logger_1.default.info('AI diagnostic analysis completed successfully', {
                patientId: consent.patientId,
                processingTime: enhancedResponse.metadata.processingTime,
                confidenceScore: enhancedResponse.metadata.confidenceScore,
                qualityScore: enhancedResponse.qualityScore,
                diagnosesCount: enhancedResponse.differentialDiagnoses.length,
            });
            return enhancedResponse;
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            await this.logAIError(error, consent, processingTime, new mongoose_1.Types.ObjectId(input.workplaceId));
            logger_1.default.error('AI diagnostic analysis failed', {
                patientId: consent.patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
            });
            throw new Error(`AI diagnostic analysis failed: ${error}`);
        }
    }
    validateConsent(consent) {
        if (!consent.isValid) {
            throw new Error('Invalid consent for AI processing');
        }
        if (!consent.consentTimestamp) {
            throw new Error('Consent timestamp is required');
        }
        if (!consent.patientId || !consent.pharmacistId) {
            throw new Error('Patient ID and Pharmacist ID are required for consent validation');
        }
        const consentAge = Date.now() - consent.consentTimestamp.getTime();
        const maxConsentAge = 24 * 60 * 60 * 1000;
        if (consentAge > maxConsentAge) {
            throw new Error('Consent has expired. Please obtain fresh consent for AI processing');
        }
        if (consent.errors && consent.errors.length > 0) {
            throw new Error(`Consent validation errors: ${consent.errors.join(', ')}`);
        }
    }
    validateInputData(input) {
        if (!input.symptoms || !input.symptoms.subjective || input.symptoms.subjective.length === 0) {
            throw new Error('At least one subjective symptom is required');
        }
        if (!input.symptoms.duration || !input.symptoms.severity || !input.symptoms.onset) {
            throw new Error('Symptom duration, severity, and onset are required');
        }
        if (input.patientAge !== undefined && (input.patientAge < 0 || input.patientAge > 150)) {
            throw new Error('Invalid patient age');
        }
        if (input.vitalSigns) {
            this.validateVitalSigns(input.vitalSigns);
        }
        if (input.labResults) {
            this.validateLabResults(input.labResults);
        }
        if (input.currentMedications) {
            this.validateMedications(input.currentMedications);
        }
    }
    validateVitalSigns(vitals) {
        if (vitals.heartRate !== undefined && (vitals.heartRate < 30 || vitals.heartRate > 250)) {
            throw new Error('Invalid heart rate value');
        }
        if (vitals.temperature !== undefined && (vitals.temperature < 30 || vitals.temperature > 45)) {
            throw new Error('Invalid temperature value');
        }
        if (vitals.respiratoryRate !== undefined && (vitals.respiratoryRate < 8 || vitals.respiratoryRate > 60)) {
            throw new Error('Invalid respiratory rate value');
        }
        if (vitals.oxygenSaturation !== undefined && (vitals.oxygenSaturation < 70 || vitals.oxygenSaturation > 100)) {
            throw new Error('Invalid oxygen saturation value');
        }
        if (vitals.bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(vitals.bloodPressure)) {
            throw new Error('Invalid blood pressure format (should be systolic/diastolic)');
        }
    }
    validateLabResults(labResults) {
        for (const result of labResults) {
            if (!result.testName || !result.value) {
                throw new Error('Lab results must have test name and value');
            }
            if (result.testName.length > 200) {
                throw new Error('Lab test name too long');
            }
            if (result.value.length > 500) {
                throw new Error('Lab result value too long');
            }
        }
    }
    validateMedications(medications) {
        for (const medication of medications) {
            if (!medication.name || !medication.dosage || !medication.frequency) {
                throw new Error('Medications must have name, dosage, and frequency');
            }
            if (medication.name.length > 200) {
                throw new Error('Medication name too long');
            }
        }
    }
    buildStructuredPrompt(input, promptVersion) {
        return `Diagnostic analysis prompt for version ${promptVersion}`;
    }
    generatePromptHash(prompt) {
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
    async callOpenRouterWithRetry(input, options) {
        let lastError = null;
        for (let attempt = 1; attempt <= options.retryAttempts; attempt++) {
            try {
                logger_1.default.info(`AI API call attempt ${attempt}/${options.retryAttempts}`);
                const response = await Promise.race([
                    openRouterService_1.default.generateDiagnosticAnalysis(input),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('AI API timeout')), options.timeout)),
                ]);
                return response;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                logger_1.default.warn(`AI API call attempt ${attempt} failed`, {
                    error: lastError.message,
                    attempt,
                    maxAttempts: options.retryAttempts,
                });
                if (this.isNonRetryableError(lastError)) {
                    break;
                }
                if (attempt < options.retryAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError || new Error('AI API call failed after all retry attempts');
    }
    isNonRetryableError(error) {
        const nonRetryablePatterns = [
            'Invalid or missing OpenRouter API key',
            'OpenRouter API quota exceeded',
            'Invalid consent',
            'Validation error',
        ];
        return nonRetryablePatterns.some(pattern => error.message.includes(pattern));
    }
    async validateAndEnhanceResponse(aiResponse, input, options, promptHash, startTime) {
        const processingTime = Date.now() - startTime;
        this.validateAIResponseStructure(aiResponse.analysis);
        const qualityScore = this.calculateQualityScore(aiResponse.analysis, input);
        const validationFlags = this.generateValidationFlags(aiResponse.analysis, input);
        const processingNotes = this.generateProcessingNotes(aiResponse.analysis, input, qualityScore);
        const metadata = {
            modelId: 'deepseek/deepseek-chat-v3.1',
            modelVersion: 'v3.1',
            promptVersion: options.promptVersion,
            processingTime,
            tokenUsage: aiResponse.usage,
            requestId: aiResponse.requestId,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            confidenceScore: aiResponse.analysis.confidenceScore / 100,
            promptHash,
        };
        return {
            ...aiResponse.analysis,
            metadata,
            qualityScore,
            validationFlags,
            processingNotes,
        };
    }
    validateAIResponseStructure(analysis) {
        if (!analysis.differentialDiagnoses || analysis.differentialDiagnoses.length === 0) {
            throw new Error('AI response must contain at least one differential diagnosis');
        }
        if (typeof analysis.confidenceScore !== 'number' || analysis.confidenceScore < 0 || analysis.confidenceScore > 100) {
            throw new Error('AI response must contain valid confidence score (0-100)');
        }
        if (!analysis.disclaimer || analysis.disclaimer.length === 0) {
            throw new Error('AI response must contain disclaimer');
        }
        for (const diagnosis of analysis.differentialDiagnoses) {
            if (!diagnosis.condition || !diagnosis.reasoning) {
                throw new Error('Each diagnosis must have condition and reasoning');
            }
            if (typeof diagnosis.probability !== 'number' || diagnosis.probability < 0 || diagnosis.probability > 100) {
                throw new Error('Each diagnosis must have valid probability (0-100)');
            }
        }
    }
    calculateQualityScore(analysis, input) {
        let score = 0;
        let maxScore = 0;
        maxScore += 20;
        const diagnosesCount = analysis.differentialDiagnoses.length;
        if (diagnosesCount >= 2 && diagnosesCount <= 5) {
            score += 20;
        }
        else if (diagnosesCount === 1 || diagnosesCount === 6) {
            score += 15;
        }
        else if (diagnosesCount > 6) {
            score += 10;
        }
        maxScore += 20;
        score += Math.min(20, analysis.confidenceScore / 5);
        maxScore += 15;
        const avgReasoningLength = analysis.differentialDiagnoses.reduce((sum, d) => sum + d.reasoning.length, 0) / analysis.differentialDiagnoses.length;
        if (avgReasoningLength >= 100)
            score += 15;
        else if (avgReasoningLength >= 50)
            score += 10;
        else
            score += 5;
        maxScore += 15;
        if (analysis.redFlags && analysis.redFlags.length > 0) {
            score += 15;
        }
        else if (input.symptoms.severity === 'severe') {
            score += 5;
        }
        else {
            score += 10;
        }
        maxScore += 15;
        if (analysis.recommendedTests && analysis.recommendedTests.length > 0) {
            score += 15;
        }
        else {
            score += 5;
        }
        maxScore += 15;
        if (analysis.therapeuticOptions && analysis.therapeuticOptions.length > 0) {
            score += 15;
        }
        else {
            score += 10;
        }
        return Math.round((score / maxScore) * 100);
    }
    generateValidationFlags(analysis, input) {
        const flags = [];
        if (analysis.confidenceScore < 50) {
            flags.push('LOW_CONFIDENCE');
        }
        if (input.symptoms.severity === 'severe' && (!analysis.redFlags || analysis.redFlags.length === 0)) {
            flags.push('SEVERE_SYMPTOMS_NO_RED_FLAGS');
        }
        const highProbDiagnoses = analysis.differentialDiagnoses.filter(d => d.probability > 70);
        if (highProbDiagnoses.length > 0 && (!analysis.recommendedTests || analysis.recommendedTests.length === 0)) {
            flags.push('HIGH_PROB_DIAGNOSIS_NO_TESTS');
        }
        if (analysis.redFlags && analysis.redFlags.some(flag => flag.severity === 'critical')) {
            flags.push('CRITICAL_RED_FLAGS');
        }
        if (input.currentMedications && input.currentMedications.length > 0 &&
            analysis.therapeuticOptions && analysis.therapeuticOptions.length > 0) {
            flags.push('MEDICATION_INTERACTION_RISK');
        }
        return flags;
    }
    generateProcessingNotes(analysis, input, qualityScore) {
        const notes = [];
        if (qualityScore < 70) {
            notes.push('AI response quality score is below threshold - consider manual review');
        }
        if (analysis.confidenceScore < 60) {
            notes.push('Low AI confidence - additional clinical assessment recommended');
        }
        if (input.symptoms.severity === 'severe') {
            notes.push('Severe symptoms reported - prioritize immediate clinical evaluation');
        }
        if (analysis.redFlags && analysis.redFlags.length > 0) {
            notes.push(`${analysis.redFlags.length} red flag(s) identified - review urgently`);
        }
        if (analysis.referralRecommendation?.recommended) {
            notes.push(`Referral recommended to ${analysis.referralRecommendation.specialty} - ${analysis.referralRecommendation.urgency} priority`);
        }
        return notes;
    }
    async logAIRequest(input, consent, options) {
        try {
            await auditService_1.AuditService.logActivity({
                userId: consent.pharmacistId,
                workplaceId: input.workplaceId,
                userRole: consent.pharmacistRole,
            }, {
                action: 'ai_diagnostic_request',
                resourceType: 'AIAnalysis',
                details: {
                    patientId: consent.patientId,
                    symptomsCount: input.symptoms.subjective.length,
                    hasVitals: !!input.vitalSigns,
                    hasLabResults: !!(input.labResults && input.labResults.length > 0),
                    hasMedications: !!(input.currentMedications && input.currentMedications.length > 0),
                    promptVersion: options.promptVersion,
                    temperature: options.temperature,
                    maxTokens: options.maxTokens,
                },
                complianceCategory: 'ai_diagnostics'
            });
        }
        catch (error) {
            logger_1.default.warn('Failed to log AI request audit event', { error });
        }
    }
    async logAIResponse(response, consent, workplaceId) {
        try {
            await auditService_1.AuditService.logActivity({
                userId: consent.pharmacistId,
                workplaceId: workplaceId.toString(),
                userRole: consent.pharmacistRole,
            }, {
                action: 'ai_diagnostic_response',
                resourceType: 'AIAnalysis',
                resourceId: new mongoose_1.Types.ObjectId().toString(),
                details: {
                    requestId: response.metadata.requestId,
                    patientId: consent.patientId,
                    processingTime: response.metadata.processingTime,
                    confidenceScore: response.metadata.confidenceScore,
                    qualityScore: response.qualityScore,
                    diagnosesCount: response.differentialDiagnoses.length,
                    redFlagsCount: response.redFlags?.length || 0,
                    tokenUsage: response.metadata.tokenUsage,
                    validationFlags: response.validationFlags,
                },
                complianceCategory: 'ai_diagnostics'
            });
        }
        catch (error) {
            logger_1.default.warn('Failed to log AI response audit event', { error });
        }
    }
    async logAIError(error, consent, processingTime, workplaceId) {
        try {
            await auditService_1.AuditService.logActivity({
                userId: consent.pharmacistId,
                workplaceId: workplaceId.toString(),
                userRole: consent.pharmacistRole,
            }, {
                action: 'ai_diagnostic_error',
                resourceType: 'AIAnalysis',
                resourceId: new mongoose_1.Types.ObjectId().toString(),
                complianceCategory: 'ai_diagnostics',
                details: {
                    patientId: consent.patientId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    processingTime,
                },
            });
        }
        catch (auditError) {
            logger_1.default.warn('Failed to log AI error audit event', { auditError });
        }
    }
    async testAIService() {
        const startTime = Date.now();
        try {
            const isConnected = await openRouterService_1.default.testConnection();
            const responseTime = Date.now() - startTime;
            return {
                isConnected,
                responseTime,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                isConnected: false,
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    getAIServiceStats() {
        return {
            defaultOptions: this.defaultOptions,
            supportedModels: ['deepseek/deepseek-chat-v3.1'],
            maxTokenLimit: 4000,
        };
    }
}
exports.AIOrchestrationService = AIOrchestrationService;
exports.default = new AIOrchestrationService();
//# sourceMappingURL=aiOrchestrationService.js.map