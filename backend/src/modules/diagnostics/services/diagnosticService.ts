import { Types } from 'mongoose';
import logger from '../../../utils/logger';
import DiagnosticRequest, { IDiagnosticRequest, IInputSnapshot } from '../models/DiagnosticRequest';
import DiagnosticResult, { IDiagnosticResult } from '../models/DiagnosticResult';
import Patient from '../../../models/Patient';
import User from '../../../models/User';
import openRouterService, { DiagnosticInput, DiagnosticResponse } from '../../../services/openRouterService';
import clinicalApiService from './clinicalApiService';
import labService from './labService';
import auditService from '../../../services/auditService';

export interface CreateDiagnosticRequestData {
    patientId: string;
    pharmacistId: string;
    workplaceId: string;
    locationId?: string;
    inputSnapshot: IInputSnapshot;
    priority?: 'routine' | 'urgent' | 'stat';
    consentObtained: boolean;
}

export interface DiagnosticProcessingOptions {
    skipInteractionCheck?: boolean;
    skipLabValidation?: boolean;
    retryOnFailure?: boolean;
    maxRetries?: number;
}

export interface DiagnosticAnalysisResult {
    request: IDiagnosticRequest;
    result: IDiagnosticResult;
    processingTime: number;
    interactionResults?: any[];
    labValidation?: any[];
}

export interface PatientDataAggregation {
    demographics: {
        age: number;
        gender: string;
        weight?: number;
        height?: number;
    };
    symptoms: IInputSnapshot['symptoms'];
    vitals?: IInputSnapshot['vitals'];
    medications: IInputSnapshot['currentMedications'];
    allergies: string[];
    medicalHistory: string[];
    labResults: any[];
    socialHistory?: IInputSnapshot['socialHistory'];
    familyHistory?: string[];
}

export class DiagnosticService {
    private readonly maxRetries = 3;
    private readonly processingTimeout = 60000; // 60 seconds

    /**
     * Create a new diagnostic request
     */
    async createDiagnosticRequest(data: CreateDiagnosticRequestData): Promise<IDiagnosticRequest> {
        try {
            // Validate patient exists and belongs to workplace
            const patient = await Patient.findOne({
                _id: data.patientId,
                workplaceId: data.workplaceId,
            });

            if (!patient) {
                throw new Error('Patient not found or does not belong to this workplace');
            }

            // Validate pharmacist exists and belongs to workplace
            const pharmacist = await User.findOne({
                _id: data.pharmacistId,
                workplaceId: data.workplaceId,
            });

            if (!pharmacist) {
                throw new Error('Pharmacist not found or does not belong to this workplace');
            }

            // Validate consent
            if (!data.consentObtained) {
                throw new Error('Patient consent is required for AI diagnostic processing');
            }

            // Check for existing active requests for this patient
            const existingRequest = await DiagnosticRequest.findOne({
                patientId: data.patientId,
                workplaceId: data.workplaceId,
                status: { $in: ['pending', 'processing'] },
                isDeleted: false,
            });

            if (existingRequest) {
                throw new Error('An active diagnostic request already exists for this patient');
            }

            // Create diagnostic request
            const diagnosticRequest = new DiagnosticRequest({
                patientId: new Types.ObjectId(data.patientId),
                pharmacistId: new Types.ObjectId(data.pharmacistId),
                workplaceId: new Types.ObjectId(data.workplaceId),
                locationId: data.locationId,
                inputSnapshot: data.inputSnapshot,
                priority: data.priority || 'routine',
                consentObtained: data.consentObtained,
                consentTimestamp: new Date(),
                promptVersion: 'v1.0',
                status: 'pending',
                createdBy: new Types.ObjectId(data.pharmacistId),
            });

            const savedRequest = await diagnosticRequest.save();

            // Log audit event
            await auditService.logEvent({
                userId: data.pharmacistId,
                workplaceId: data.workplaceId,
                action: 'diagnostic_request_created',
                resourceType: 'DiagnosticRequest',
                resourceId: savedRequest._id.toString(),
                details: {
                    patientId: data.patientId,
                    priority: data.priority,
                    symptomsCount: data.inputSnapshot.symptoms.subjective.length,
                },
            });

            logger.info('Diagnostic request created successfully', {
                requestId: savedRequest._id,
                patientId: data.patientId,
                pharmacistId: data.pharmacistId,
                workplaceId: data.workplaceId,
                priority: data.priority,
            });

            return savedRequest;
        } catch (error) {
            logger.error('Failed to create diagnostic request:', error);
            throw new Error(`Failed to create diagnostic request: ${error}`);
        }
    }

    /**
     * Process diagnostic request with AI analysis
     */
    async processDiagnosticRequest(
        requestId: string,
        options: DiagnosticProcessingOptions = {}
    ): Promise<DiagnosticAnalysisResult> {
        const startTime = Date.now();
        let request: IDiagnosticRequest | null = null;

        try {
            // Get diagnostic request
            request = await DiagnosticRequest.findById(requestId);
            if (!request) {
                throw new Error('Diagnostic request not found');
            }

            // Check if request can be processed
            if (!['pending', 'failed'].includes(request.status)) {
                throw new Error(`Cannot process request with status: ${request.status}`);
            }

            // Check retry limits
            if (request.status === 'failed' && !request.canRetry()) {
                throw new Error('Maximum retry attempts exceeded');
            }

            // Mark as processing
            await request.markAsProcessing();

            logger.info('Starting diagnostic processing', {
                requestId,
                patientId: request.patientId,
                retryCount: request.retryCount,
            });

            // Aggregate patient data
            const patientData = await this.aggregatePatientData(request);

            // Check drug interactions if medications are present
            let interactionResults: any[] = [];
            if (!options.skipInteractionCheck && patientData.medications && patientData.medications.length > 0) {
                try {
                    const medicationNames = patientData.medications.map(med => med.name);
                    const interactionCheck = await clinicalApiService.checkDrugInteractions(medicationNames);
                    interactionResults = interactionCheck.data;

                    logger.info('Drug interaction check completed', {
                        requestId,
                        medicationsCount: medicationNames.length,
                        interactionsFound: interactionResults.length,
                    });
                } catch (error) {
                    logger.warn('Drug interaction check failed, continuing without interaction data', {
                        requestId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }

            // Validate lab results if present
            let labValidation: any[] = [];
            if (!options.skipLabValidation && patientData.labResults && patientData.labResults.length > 0) {
                try {
                    labValidation = await Promise.all(
                        patientData.labResults.map(async (labResult) => {
                            return await labService.validateResult(labResult);
                        })
                    );

                    logger.info('Lab result validation completed', {
                        requestId,
                        labResultsCount: patientData.labResults.length,
                    });
                } catch (error) {
                    logger.warn('Lab result validation failed, continuing without validation data', {
                        requestId,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }

            // Prepare AI input
            const aiInput = this.prepareAIInput(patientData, interactionResults, labValidation);

            // Call AI service with timeout
            const aiAnalysis = await Promise.race([
                openRouterService.generateDiagnosticAnalysis(aiInput),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('AI processing timeout')), this.processingTimeout)
                ),
            ]);

            // Create diagnostic result
            const diagnosticResult = await this.createDiagnosticResult(
                request,
                aiAnalysis,
                interactionResults,
                labValidation
            );

            // Mark request as completed
            await request.markAsCompleted();

            const processingTime = Date.now() - startTime;

            // Log audit event
            await auditService.logEvent({
                userId: request.pharmacistId.toString(),
                workplaceId: request.workplaceId.toString(),
                action: 'diagnostic_analysis_completed',
                resourceType: 'DiagnosticResult',
                resourceId: diagnosticResult._id.toString(),
                details: {
                    requestId,
                    processingTime,
                    diagnosesCount: diagnosticResult.diagnoses.length,
                    confidenceScore: diagnosticResult.aiMetadata.confidenceScore,
                    hasRedFlags: diagnosticResult.redFlags.length > 0,
                    requiresReferral: diagnosticResult.referralRecommendation?.recommended || false,
                },
            });

            logger.info('Diagnostic processing completed successfully', {
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
        } catch (error) {
            const processingTime = Date.now() - startTime;

            // Mark request as failed if we have a request object
            if (request) {
                await request.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
            }

            // Log audit event
            if (request) {
                await auditService.logEvent({
                    userId: request.pharmacistId.toString(),
                    workplaceId: request.workplaceId.toString(),
                    action: 'diagnostic_analysis_failed',
                    resourceType: 'DiagnosticRequest',
                    resourceId: requestId,
                    details: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        processingTime,
                        retryCount: request.retryCount,
                    },
                });
            }

            logger.error('Diagnostic processing failed', {
                requestId,
                error: error instanceof Error ? error.message : 'Unknown error',
                processingTime,
            });

            throw new Error(`Diagnostic processing failed: ${error}`);
        }
    }

    /**
     * Aggregate patient data from multiple sources
     */
    private async aggregatePatientData(request: IDiagnosticRequest): Promise<PatientDataAggregation> {
        try {
            // Get patient demographics
            const patient = await Patient.findById(request.patientId);
            if (!patient) {
                throw new Error('Patient not found');
            }

            // Calculate age
            const age = Math.floor(
                (Date.now() - patient.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            );

            // Get lab results if referenced
            let labResults: any[] = [];
            if (request.inputSnapshot.labResultIds && request.inputSnapshot.labResultIds.length > 0) {
                labResults = await labService.getLabResults(
                    request.workplaceId.toString(),
                    {
                        patientId: request.patientId.toString(),
                    }
                ).then(response => response.results);
            }

            const aggregatedData: PatientDataAggregation = {
                demographics: {
                    age,
                    gender: patient.gender,
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

            logger.info('Patient data aggregated successfully', {
                requestId: request._id,
                patientId: request.patientId,
                age,
                medicationsCount: aggregatedData.medications.length,
                allergiesCount: aggregatedData.allergies.length,
                labResultsCount: labResults.length,
            });

            return aggregatedData;
        } catch (error) {
            logger.error('Failed to aggregate patient data:', error);
            throw new Error(`Failed to aggregate patient data: ${error}`);
        }
    }

    /**
     * Prepare AI input from aggregated patient data
     */
    private prepareAIInput(
        patientData: PatientDataAggregation,
        interactionResults: any[],
        labValidation: any[]
    ): DiagnosticInput {
        // Convert lab results to AI input format
        const labResults = patientData.labResults.map(result => ({
            testName: result.testName,
            value: result.value,
            referenceRange: result.referenceRange.text ||
                `${result.referenceRange.low || ''}-${result.referenceRange.high || ''} ${result.unit || ''}`,
            abnormal: result.interpretation !== 'normal',
        }));

        // Convert medications to AI input format
        const currentMedications = patientData.medications.map(med => ({
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
        }));

        const aiInput: DiagnosticInput = {
            symptoms: patientData.symptoms,
            labResults: labResults.length > 0 ? labResults : undefined,
            currentMedications: currentMedications.length > 0 ? currentMedications : undefined,
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

    /**
     * Create diagnostic result from AI analysis
     */
    private async createDiagnosticResult(
        request: IDiagnosticRequest,
        aiAnalysis: any,
        interactionResults: any[],
        labValidation: any[]
    ): Promise<IDiagnosticResult> {
        try {
            // Map AI response to diagnostic result format
            const diagnoses = aiAnalysis.analysis.differentialDiagnoses.map((diagnosis: any) => ({
                condition: diagnosis.condition,
                probability: diagnosis.probability / 100, // Convert percentage to decimal
                reasoning: diagnosis.reasoning,
                severity: diagnosis.severity,
                confidence: this.mapConfidenceLevel(diagnosis.probability),
                evidenceLevel: this.mapEvidenceLevel(diagnosis.probability),
            }));

            const suggestedTests = aiAnalysis.analysis.recommendedTests?.map((test: any) => ({
                testName: test.testName,
                priority: test.priority,
                reasoning: test.reasoning,
                clinicalSignificance: test.reasoning, // Use reasoning as clinical significance
            })) || [];

            const medicationSuggestions = aiAnalysis.analysis.therapeuticOptions?.map((option: any) => ({
                drugName: option.medication,
                dosage: option.dosage,
                frequency: option.frequency,
                duration: option.duration,
                reasoning: option.reasoning,
                safetyNotes: option.safetyNotes || [],
            })) || [];

            const redFlags = aiAnalysis.analysis.redFlags?.map((flag: any) => ({
                flag: flag.flag,
                severity: flag.severity,
                action: flag.action,
                clinicalRationale: flag.action, // Use action as clinical rationale
            })) || [];

            // Determine overall risk assessment
            const overallRisk = this.calculateOverallRisk(diagnoses, redFlags, interactionResults);

            // Create diagnostic result
            const diagnosticResult = new DiagnosticResult({
                requestId: request._id,
                workplaceId: request.workplaceId,
                diagnoses,
                suggestedTests,
                medicationSuggestions,
                redFlags,
                referralRecommendation: aiAnalysis.analysis.referralRecommendation,
                differentialDiagnosis: diagnoses.map((d: any) => d.condition),
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
                    tokenUsage: aiAnalysis.usage,
                    requestId: aiAnalysis.requestId,
                },
                rawResponse: JSON.stringify(aiAnalysis.analysis),
                disclaimer: aiAnalysis.analysis.disclaimer,
                followUpRequired: this.determineFollowUpRequired(diagnoses, redFlags),
                createdBy: request.pharmacistId,
            });

            const savedResult = await diagnosticResult.save();

            logger.info('Diagnostic result created successfully', {
                resultId: savedResult._id,
                requestId: request._id,
                diagnosesCount: diagnoses.length,
                overallRisk,
                followUpRequired: savedResult.followUpRequired,
            });

            return savedResult;
        } catch (error) {
            logger.error('Failed to create diagnostic result:', error);
            throw new Error(`Failed to create diagnostic result: ${error}`);
        }
    }

    /**
     * Map confidence level based on probability
     */
    private mapConfidenceLevel(probability: number): 'low' | 'medium' | 'high' {
        if (probability >= 70) return 'high';
        if (probability >= 40) return 'medium';
        return 'low';
    }

    /**
     * Map evidence level based on probability
     */
    private mapEvidenceLevel(probability: number): 'definite' | 'probable' | 'possible' | 'unlikely' {
        if (probability >= 80) return 'definite';
        if (probability >= 60) return 'probable';
        if (probability >= 30) return 'possible';
        return 'unlikely';
    }

    /**
     * Calculate overall risk assessment
     */
    private calculateOverallRisk(
        diagnoses: any[],
        redFlags: any[],
        interactionResults: any[]
    ): 'low' | 'medium' | 'high' | 'critical' {
        // Check for critical red flags
        if (redFlags.some(flag => flag.severity === 'critical')) {
            return 'critical';
        }

        // Check for high severity diagnoses
        if (diagnoses.some(diagnosis => diagnosis.severity === 'high' && diagnosis.probability > 0.5)) {
            return 'high';
        }

        // Check for major drug interactions
        if (interactionResults.some(interaction => interaction.severity === 'major' || interaction.severity === 'contraindicated')) {
            return 'high';
        }

        // Check for high red flags
        if (redFlags.some(flag => flag.severity === 'high')) {
            return 'high';
        }

        // Check for medium severity conditions
        if (diagnoses.some(diagnosis => diagnosis.severity === 'medium' && diagnosis.probability > 0.6)) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Extract risk factors from analysis
     */
    private extractRiskFactors(
        diagnoses: any[],
        interactionResults: any[],
        labValidation: any[]
    ): string[] {
        const riskFactors: string[] = [];

        // Add high-probability diagnoses as risk factors
        diagnoses
            .filter(diagnosis => diagnosis.probability > 0.5 && diagnosis.severity !== 'low')
            .forEach(diagnosis => {
                riskFactors.push(`High probability of ${diagnosis.condition}`);
            });

        // Add drug interactions as risk factors
        interactionResults
            .filter(interaction => ['moderate', 'major', 'contraindicated'].includes(interaction.severity))
            .forEach(interaction => {
                riskFactors.push(`Drug interaction: ${interaction.drugPair.drug1} + ${interaction.drugPair.drug2}`);
            });

        // Add abnormal lab results as risk factors
        labValidation
            .filter(validation => validation.interpretation !== 'normal')
            .forEach(validation => {
                riskFactors.push(`Abnormal lab result: ${validation.interpretation}`);
            });

        return riskFactors;
    }

    /**
     * Extract mitigating factors from input snapshot
     */
    private extractMitigatingFactors(inputSnapshot: IInputSnapshot): string[] {
        const mitigatingFactors: string[] = [];

        // Add positive lifestyle factors
        if (inputSnapshot.socialHistory?.exercise === 'active' || inputSnapshot.socialHistory?.exercise === 'moderate') {
            mitigatingFactors.push('Regular physical activity');
        }

        if (inputSnapshot.socialHistory?.smoking === 'never') {
            mitigatingFactors.push('Non-smoker');
        }

        if (inputSnapshot.socialHistory?.alcohol === 'never' || inputSnapshot.socialHistory?.alcohol === 'occasional') {
            mitigatingFactors.push('Minimal alcohol consumption');
        }

        // Add mild symptom severity as mitigating factor
        if (inputSnapshot.symptoms.severity === 'mild') {
            mitigatingFactors.push('Mild symptom severity');
        }

        return mitigatingFactors;
    }

    /**
     * Generate clinical impression
     */
    private generateClinicalImpression(diagnoses: any[], symptoms: any): string {
        const primaryDiagnosis = diagnoses.reduce((highest, current) =>
            current.probability > highest.probability ? current : highest
        );

        const impression = `Patient presents with ${symptoms.onset} onset ${symptoms.severity} ${symptoms.subjective.join(', ')}. ` +
            `Most likely diagnosis is ${primaryDiagnosis.condition} (${Math.round(primaryDiagnosis.probability * 100)}% probability). ` +
            `${primaryDiagnosis.reasoning}`;

        return impression;
    }

    /**
     * Determine if follow-up is required
     */
    private determineFollowUpRequired(diagnoses: any[], redFlags: any[]): boolean {
        // Require follow-up for high-severity diagnoses
        if (diagnoses.some(diagnosis => diagnosis.severity === 'high' && diagnosis.probability > 0.4)) {
            return true;
        }

        // Require follow-up for any red flags
        if (redFlags.length > 0) {
            return true;
        }

        return false;
    }

    /**
     * Get diagnostic request by ID
     */
    async getDiagnosticRequest(requestId: string, workplaceId: string): Promise<IDiagnosticRequest | null> {
        try {
            const request = await DiagnosticRequest.findOne({
                _id: requestId,
                workplaceId: new Types.ObjectId(workplaceId),
                isDeleted: false,
            })
                .populate('patientId', 'firstName lastName dateOfBirth gender')
                .populate('pharmacistId', 'firstName lastName')
                .lean();

            return request as IDiagnosticRequest | null;
        } catch (error) {
            logger.error('Failed to get diagnostic request:', error);
            throw new Error(`Failed to get diagnostic request: ${error}`);
        }
    }

    /**
     * Get diagnostic result by request ID
     */
    async getDiagnosticResult(requestId: string, workplaceId: string): Promise<IDiagnosticResult | null> {
        try {
            const result = await DiagnosticResult.findOne({
                requestId: new Types.ObjectId(requestId),
                workplaceId: new Types.ObjectId(workplaceId),
                isDeleted: false,
            }).lean();

            return result as IDiagnosticResult | null;
        } catch (error) {
            logger.error('Failed to get diagnostic result:', error);
            throw new Error(`Failed to get diagnostic result: ${error}`);
        }
    }

    /**
     * Get patient diagnostic history
     */
    async getPatientDiagnosticHistory(
        patientId: string,
        workplaceId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        requests: IDiagnosticRequest[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const [requests, total] = await Promise.all([
                DiagnosticRequest.find({
                    patientId: new Types.ObjectId(patientId),
                    workplaceId: new Types.ObjectId(workplaceId),
                    isDeleted: false,
                })
                    .populate('pharmacistId', 'firstName lastName')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                DiagnosticRequest.countDocuments({
                    patientId: new Types.ObjectId(patientId),
                    workplaceId: new Types.ObjectId(workplaceId),
                    isDeleted: false,
                }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                requests: requests as IDiagnosticRequest[],
                total,
                page,
                totalPages,
            };
        } catch (error) {
            logger.error('Failed to get patient diagnostic history:', error);
            throw new Error(`Failed to get patient diagnostic history: ${error}`);
        }
    }

    /**
     * Retry failed diagnostic request
     */
    async retryDiagnosticRequest(
        requestId: string,
        options: DiagnosticProcessingOptions = {}
    ): Promise<DiagnosticAnalysisResult> {
        try {
            const request = await DiagnosticRequest.findById(requestId);
            if (!request) {
                throw new Error('Diagnostic request not found');
            }

            if (!request.canRetry()) {
                throw new Error('Request cannot be retried (maximum attempts exceeded or invalid status)');
            }

            // Increment retry count
            await request.incrementRetryCount();

            // Process the request
            return await this.processDiagnosticRequest(requestId, { ...options, retryOnFailure: true });
        } catch (error) {
            logger.error('Failed to retry diagnostic request:', error);
            throw new Error(`Failed to retry diagnostic request: ${error}`);
        }
    }

    /**
     * Cancel diagnostic request
     */
    async cancelDiagnosticRequest(
        requestId: string,
        workplaceId: string,
        cancelledBy: string,
        reason?: string
    ): Promise<void> {
        try {
            const request = await DiagnosticRequest.findOne({
                _id: requestId,
                workplaceId: new Types.ObjectId(workplaceId),
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
            request.updatedBy = new Types.ObjectId(cancelledBy);
            await request.save();

            // Log audit event
            await auditService.logEvent({
                userId: cancelledBy,
                workplaceId,
                action: 'diagnostic_request_cancelled',
                resourceType: 'DiagnosticRequest',
                resourceId: requestId,
                details: {
                    reason: reason || 'Cancelled by user',
                    originalStatus: request.status,
                },
            });

            logger.info('Diagnostic request cancelled', {
                requestId,
                cancelledBy,
                reason,
            });
        } catch (error) {
            logger.error('Failed to cancel diagnostic request:', error);
            throw new Error(`Failed to cancel diagnostic request: ${error}`);
        }
    }
}

export default new DiagnosticService();