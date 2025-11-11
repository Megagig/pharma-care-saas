import { Types } from 'mongoose';
import logger from '../../../utils/logger';
import LabIntegration, {
    ILabIntegration,
    IAIInterpretation,
    ISafetyCheck,
    ITherapyRecommendation,
    IMedicationAdjustment,
    IPharmacistReview
} from '../models/LabIntegration';
import LabResult, { ILabResult } from '../models/LabResult';
import LabOrder from '../models/LabOrder';
import Patient from '../../../models/Patient';
import Medication from '../../../models/Medication';
import MedicationRecord from '../../../models/MedicationRecord';
import openRouterService from '../../../services/openRouterService';
import clinicalApiService from './clinicalApiService';
import labIntegrationAlertService from './labIntegrationAlertService';

export interface CreateLabIntegrationRequest {
    patientId: string;
    pharmacistId: string;
    workplaceId: string;
    locationId?: string;
    labResultIds?: string[];
    labOrderId?: string;
    source: 'manual_entry' | 'pdf_upload' | 'image_upload' | 'fhir_import' | 'lis_integration';
    uploadedFiles?: Array<{
        fileType: 'pdf' | 'image' | 'hl7' | 'fhir';
        fileName: string;
        fileUrl: string;
    }>;
    labName?: string;
    reportId?: string;
    receivedAt?: Date;
    indication?: string;
    clinicalQuestion?: string;
    targetRange?: {
        parameter: string;
        target: string;
        goal: string;
    };
    urgency?: 'stat' | 'urgent' | 'routine';
}

export interface AIInterpretationInput {
    labResults: ILabResult[];
    patientData: {
        age?: number;
        gender?: string;
        weight?: number;
        allergies: string[];
        conditions: string[];
        currentMedications: Array<{
            name: string;
            dose?: string;
            frequency?: string;
        }>;
    };
    clinicalContext?: {
        indication?: string;
        clinicalQuestion?: string;
        targetRange?: {
            parameter: string;
            target: string;
            goal: string;
        };
    };
}

export interface TherapyRecommendationResult {
    recommendations: ITherapyRecommendation[];
    safetyChecks: ISafetyCheck[];
    criticalIssues: boolean;
}

export class LabIntegrationService {
    /**
     * Create a new lab integration case
     */
    async createLabIntegration(data: CreateLabIntegrationRequest): Promise<ILabIntegration> {
        try {
            // Validate patient exists and belongs to workplace
            const patient = await Patient.findOne({
                _id: data.patientId,
                workplaceId: data.workplaceId
            });

            if (!patient) {
                throw new Error('Patient not found or does not belong to this workplace');
            }

            // Validate lab results if provided
            if (data.labResultIds && data.labResultIds.length > 0) {
                const labResults = await LabResult.find({
                    _id: { $in: data.labResultIds.map(id => new Types.ObjectId(id)) },
                    workplaceId: new Types.ObjectId(data.workplaceId)
                });

                if (labResults.length !== data.labResultIds.length) {
                    throw new Error('One or more lab results not found or access denied');
                }
            }

            // Validate lab order if provided
            if (data.labOrderId) {
                const labOrder = await LabOrder.findOne({
                    _id: data.labOrderId,
                    workplaceId: new Types.ObjectId(data.workplaceId)
                });

                if (!labOrder) {
                    throw new Error('Lab order not found or access denied');
                }
            }

            // Create lab integration document
            const labIntegration = new LabIntegration({
                workplaceId: new Types.ObjectId(data.workplaceId),
                patientId: new Types.ObjectId(data.patientId),
                pharmacistId: new Types.ObjectId(data.pharmacistId),
                locationId: data.locationId,
                labResultIds: data.labResultIds?.map(id => new Types.ObjectId(id)) || [],
                labOrderId: data.labOrderId ? new Types.ObjectId(data.labOrderId) : undefined,
                source: data.source,
                uploadedFiles: data.uploadedFiles,
                labName: data.labName,
                reportId: data.reportId,
                receivedAt: data.receivedAt || new Date(),
                indication: data.indication,
                clinicalQuestion: data.clinicalQuestion,
                targetRange: data.targetRange,
                urgency: data.urgency || 'routine',
                status: 'draft',
                aiProcessingStatus: 'pending',
                safetyCheckStatus: 'pending',
                reviewStatus: 'pending_review',
                safetyChecks: [],
                therapyRecommendations: [],
                medicationAdjustments: [],
                followUpRequired: false,
                patientNotified: false,
                patientConsentObtained: false,
                patientEducationProvided: false,
                requiresPhysicianEscalation: false,
                physicianNotified: false,
                adjustmentsImplemented: false,
                criticalSafetyIssues: false,
                createdBy: new Types.ObjectId(data.pharmacistId)
            });

            await labIntegration.save();

            logger.info('Lab integration case created', {
                labIntegrationId: labIntegration._id,
                patientId: data.patientId,
                workplaceId: data.workplaceId,
                source: data.source,
                labResultCount: data.labResultIds?.length || 0
            });

            return labIntegration;
        } catch (error) {
            logger.error('Failed to create lab integration case', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId: data.patientId,
                workplaceId: data.workplaceId
            });
            throw error;
        }
    }

    /**
     * Request AI interpretation for lab results
     */
    async requestAIInterpretation(labIntegrationId: string): Promise<ILabIntegration> {
        try {
            const labIntegration = await LabIntegration.findById(labIntegrationId)
                .populate('labResultIds')
                .populate('patientId');

            if (!labIntegration) {
                throw new Error('Lab integration case not found');
            }

            // Update status
            labIntegration.aiProcessingStatus = 'processing';
            labIntegration.status = 'pending_interpretation';
            await labIntegration.save();

            // Gather patient data
            const patient = labIntegration.patientId as any;
            const patientData = await this.gatherPatientData(patient._id, labIntegration.workplaceId);

            // Prepare AI input
            const aiInput: AIInterpretationInput = {
                labResults: labIntegration.labResultIds as any[],
                patientData,
                clinicalContext: {
                    indication: labIntegration.indication,
                    clinicalQuestion: labIntegration.clinicalQuestion,
                    targetRange: labIntegration.targetRange
                }
            };

            // Call AI service
            const aiInterpretation = await this.generateAIInterpretation(aiInput);

            // Update lab integration with AI results
            labIntegration.aiInterpretation = aiInterpretation;
            labIntegration.aiProcessingStatus = 'completed';

            // Generate therapy recommendations based on AI interpretation
            const therapyResult = await this.generateTherapyRecommendations(
                aiInterpretation,
                aiInput.labResults,
                patientData
            );

            labIntegration.therapyRecommendations = therapyResult.recommendations;
            labIntegration.safetyChecks = therapyResult.safetyChecks;
            labIntegration.criticalSafetyIssues = therapyResult.criticalIssues;
            labIntegration.safetyCheckStatus = 'completed';
            labIntegration.recommendationSource = 'ai_generated';
            labIntegration.status = 'pending_review';

            await labIntegration.save();

            logger.info('AI interpretation completed', {
                labIntegrationId: labIntegration._id,
                confidence: aiInterpretation.confidence,
                clinicalSignificance: aiInterpretation.clinicalSignificance,
                recommendationCount: therapyResult.recommendations.length,
                criticalIssues: therapyResult.criticalIssues
            });

            // Check for critical values and send alerts
            await labIntegrationAlertService.checkAndAlertCriticalValues(labIntegrationId);

            return labIntegration;
        } catch (error) {
            logger.error('AI interpretation failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                labIntegrationId
            });

            // Update status to failed
            const labIntegration = await LabIntegration.findById(labIntegrationId);
            if (labIntegration) {
                labIntegration.aiProcessingStatus = 'failed';
                labIntegration.aiProcessingError = error instanceof Error ? error.message : 'Unknown error';
                await labIntegration.save();
            }

            throw error;
        }
    }

    /**
     * Gather comprehensive patient data for AI analysis
     */
    private async gatherPatientData(patientId: Types.ObjectId, workplaceId: Types.ObjectId): Promise<AIInterpretationInput['patientData']> {
        const patient = await Patient.findById(patientId);

        if (!patient) {
            throw new Error('Patient not found');
        }

        // Get allergies from patient embedded data
        const allergies = patient.allergies?.map(a => a.allergen) || [];

        // Get active chronic conditions from patient embedded data
        const conditions = patient.chronicConditions
            ?.filter(c => c.status === 'active')
            .map(c => c.condition) || [];

        // Get current medications from both Medication and MedicationRecord models
        const activeMedications = await Medication.find({
            patient: patientId,
            status: 'active'
        }).select('drugName genericName strength dosageForm instructions');

        const currentMedicationRecords = await MedicationRecord.find({
            patientId,
            workplaceId,
            phase: 'current',
            isDeleted: false
        }).select('medicationName dose frequency route');

        // Combine medications from both sources
        const currentMedications = [
            ...activeMedications.map(m => ({
                name: m.drugName,
                genericName: m.genericName,
                dose: m.strength?.value && m.strength?.unit
                    ? `${m.strength.value}${m.strength.unit}`
                    : m.instructions?.dosage,
                frequency: m.instructions?.frequency
            })),
            ...currentMedicationRecords.map(m => ({
                name: m.medicationName,
                dose: m.dose,
                frequency: m.frequency
            }))
        ];

        return {
            age: patient.age,
            gender: patient.gender,
            weight: patient.weightKg,
            allergies,
            conditions,
            currentMedications
        };
    }

    /**
     * Generate AI interpretation using OpenRouter
     */
    private async generateAIInterpretation(input: AIInterpretationInput): Promise<IAIInterpretation> {
        const startTime = Date.now();

        // Build structured prompt for lab interpretation
        const prompt = this.buildLabInterpretationPrompt(input);

        try {
            // Build a comprehensive prompt for AI interpretation
            const prompt = this.buildLabInterpretationPrompt(input);

            // Call OpenRouter service using diagnostic analysis method
            // We'll use a simplified input format for lab interpretation
            const diagnosticInput = {
                patientData: input.patientData,
                symptoms: {
                    subjective: [`Lab results analysis for ${input.labResults.map(r => r.testName).join(', ')}`],
                    objective: input.labResults.map(r => `${r.testName}: ${r.value} ${r.unit} (Ref: ${r.referenceRange.text || `${r.referenceRange.low}-${r.referenceRange.high}`})`),
                    duration: 'current',
                    severity: input.labResults.some(r => r.criticalValue) ? 'severe' as const : 'moderate' as const,
                    onset: 'acute' as const
                },
                vitalSigns: {},
                medications: input.patientData.currentMedications.map(m => m.name),
                labResults: input.labResults.map(r => ({
                    testName: r.testName,
                    value: r.value,
                    referenceRange: r.referenceRange.text || `${r.referenceRange.low || ''}-${r.referenceRange.high || ''}${r.referenceRange.unit ? ' ' + r.referenceRange.unit : ''}`,
                    abnormal: r.interpretation !== 'normal'
                })),
                allergies: input.patientData.allergies,
                chronicConditions: input.patientData.conditions
            };

            const aiResult = await openRouterService.generateDiagnosticAnalysis(diagnosticInput);
            const processingTime = Date.now() - startTime;

            // Parse and structure the AI response
            const interpretation = this.parseAIResponse(aiResult);

            return {
                interpretation: interpretation.interpretation,
                clinicalSignificance: interpretation.clinicalSignificance,
                confidence: interpretation.confidence,
                differentialDiagnosis: interpretation.differentialDiagnosis,
                therapeuticImplications: interpretation.therapeuticImplications,
                monitoringRecommendations: interpretation.monitoringRecommendations,
                redFlags: interpretation.redFlags,
                processingTime,
                modelUsed: 'deepseek/deepseek-chat-v3.1:free',
                promptVersion: '1.0'
            };
        } catch (error) {
            logger.error('OpenRouter AI call failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Build structured prompt for lab interpretation
     */
    private buildLabInterpretationPrompt(input: AIInterpretationInput): string {
        const labResultsText = input.labResults.map(result =>
            `${result.testName} (${result.testCode}): ${result.value} ${result.unit || ''} [Reference: ${result.referenceRange.text || `${result.referenceRange.low}-${result.referenceRange.high}`}] - ${result.interpretation}`
        ).join('\n');

        const medicationsText = input.patientData.currentMedications.map(med =>
            `${med.name} ${med.dose || ''} ${med.frequency || ''}`
        ).join('\n');

        return `You are a clinical pharmacist AI assistant analyzing laboratory results to provide therapeutic recommendations.

PATIENT CONTEXT:
- Age: ${input.patientData.age || 'Unknown'}
- Gender: ${input.patientData.gender || 'Unknown'}
- Weight: ${input.patientData.weight ? `${input.patientData.weight} kg` : 'Unknown'}
- Allergies: ${input.patientData.allergies.length > 0 ? input.patientData.allergies.join(', ') : 'None documented'}
- Chronic Conditions: ${input.patientData.conditions.length > 0 ? input.patientData.conditions.join(', ') : 'None documented'}

CURRENT MEDICATIONS:
${medicationsText || 'None documented'}

LABORATORY RESULTS:
${labResultsText}

CLINICAL CONTEXT:
${input.clinicalContext?.indication ? `Indication: ${input.clinicalContext.indication}` : ''}
${input.clinicalContext?.clinicalQuestion ? `Clinical Question: ${input.clinicalContext.clinicalQuestion}` : ''}
${input.clinicalContext?.targetRange ? `Target: ${input.clinicalContext.targetRange.parameter} - ${input.clinicalContext.targetRange.target} (Goal: ${input.clinicalContext.targetRange.goal})` : ''}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "interpretation": "Detailed clinical interpretation of the lab results",
  "clinicalSignificance": "critical|significant|moderate|minimal|normal",
  "confidence": 0-100,
  "differentialDiagnosis": ["possible diagnosis 1", "possible diagnosis 2"],
  "therapeuticImplications": ["implication 1", "implication 2"],
  "monitoringRecommendations": ["recommendation 1", "recommendation 2"],
  "redFlags": [
    {
      "flag": "description of red flag",
      "severity": "critical|high|medium|low",
      "action": "recommended action"
    }
  ],
  "therapyRecommendations": [
    {
      "medicationName": "medication name",
      "action": "start|stop|adjust_dose|monitor|continue",
      "currentDose": "current dose if applicable",
      "recommendedDose": "recommended dose if applicable",
      "rationale": "clinical rationale for recommendation",
      "priority": "critical|high|medium|low",
      "evidenceLevel": "strong|moderate|weak"
    }
  ]
}

Focus on:
1. Clinical interpretation of abnormal values
2. Drug-lab interactions with current medications
3. Dose adjustments needed based on lab values (e.g., renal/hepatic function)
4. Therapeutic drug monitoring implications
5. Safety concerns and contraindications
6. Monitoring parameters and follow-up timing`;
    }

    /**
     * Parse AI response into structured format
     */
    private parseAIResponse(diagnosticResult: any): any {
        try {
            // The diagnosticResult is already a structured DiagnosticResponse object
            const analysis = diagnosticResult.analysis || diagnosticResult;

            // Map DiagnosticResponse to our IAIInterpretation format
            return {
                interpretation: this.formatDiagnosticSummary(analysis),
                clinicalSignificance: this.determineClinicalSignificance(analysis),
                confidence: this.calculateConfidence(analysis),
                differentialDiagnosis: analysis.differentialDiagnoses?.map((d: any) => d.condition) || [],
                therapeuticImplications: analysis.therapeuticOptions?.map((t: any) =>
                    `${t.medication} ${t.dosage} ${t.frequency} - ${t.reasoning}`
                ) || [],
                monitoringRecommendations: analysis.monitoringPlan?.parameters?.map((p: any) =>
                    `Monitor ${p.parameter} ${p.frequency}`
                ) || [],
                redFlags: analysis.redFlags?.map((r: any) => r.flag) || []
            };
        } catch (error) {
            logger.error('Failed to parse AI response', { error });
            // Fallback: create a basic structure
            return {
                interpretation: 'AI analysis completed',
                clinicalSignificance: 'moderate' as const,
                confidence: 70,
                differentialDiagnosis: [],
                therapeuticImplications: [],
                monitoringRecommendations: [],
                redFlags: []
            };
        }
    }

    /**
     * Format diagnostic summary from AI response
     */
    private formatDiagnosticSummary(analysis: any): string {
        const parts: string[] = [];

        if (analysis.differentialDiagnoses && analysis.differentialDiagnoses.length > 0) {
            parts.push(`Primary considerations: ${analysis.differentialDiagnoses.slice(0, 3).map((d: any) => d.condition).join(', ')}`);
        }

        if (analysis.redFlags && analysis.redFlags.length > 0) {
            parts.push(`Red flags: ${analysis.redFlags.map((r: any) => r.flag).join(', ')}`);
        }

        return parts.join('. ') || 'Lab results analyzed';
    }

    /**
     * Determine clinical significance from AI response
     */
    private determineClinicalSignificance(analysis: any): 'critical' | 'significant' | 'moderate' | 'minimal' | 'normal' {
        if (analysis.redFlags && analysis.redFlags.length > 0) {
            return 'critical';
        }

        if (analysis.differentialDiagnoses && analysis.differentialDiagnoses.some((d: any) => d.severity === 'high')) {
            return 'significant';
        }

        if (analysis.differentialDiagnoses && analysis.differentialDiagnoses.length > 0) {
            return 'moderate';
        }

        return 'minimal';
    }

    /**
     * Calculate confidence score from AI response
     */
    private calculateConfidence(analysis: any): number {
        if (!analysis.differentialDiagnoses || analysis.differentialDiagnoses.length === 0) {
            return 50;
        }

        // Use the highest probability from differential diagnoses
        const maxProbability = Math.max(...analysis.differentialDiagnoses.map((d: any) => d.probability || 0));
        return Math.round(maxProbability);
    }

    /**
     * Generate therapy recommendations with safety checks
     */
    private async generateTherapyRecommendations(
        aiInterpretation: IAIInterpretation,
        labResults: ILabResult[],
        patientData: AIInterpretationInput['patientData']
    ): Promise<TherapyRecommendationResult> {
        const recommendations: ITherapyRecommendation[] = [];
        const safetyChecks: ISafetyCheck[] = [];
        let criticalIssues = false;

        // Extract therapy recommendations from AI response
        const aiRecommendations = (aiInterpretation as any).therapyRecommendations || [];

        for (const aiRec of aiRecommendations) {
            recommendations.push({
                medicationName: aiRec.medicationName,
                action: aiRec.action,
                currentDose: aiRec.currentDose,
                recommendedDose: aiRec.recommendedDose,
                rationale: aiRec.rationale,
                priority: aiRec.priority || 'medium',
                evidenceLevel: aiRec.evidenceLevel
            });

            // Perform safety checks for each recommendation
            const checks = await this.performSafetyChecks(
                aiRec.medicationName,
                patientData
            );

            safetyChecks.push(...checks);

            // Check for critical issues
            if (checks.some(check => check.severity === 'critical' || check.severity === 'major')) {
                criticalIssues = true;
            }
        }

        return {
            recommendations,
            safetyChecks,
            criticalIssues
        };
    }

    /**
     * Perform comprehensive safety checks
     */
    private async performSafetyChecks(
        medicationName: string,
        patientData: AIInterpretationInput['patientData']
    ): Promise<ISafetyCheck[]> {
        const checks: ISafetyCheck[] = [];

        try {
            // Check for drug allergies
            const allergyCheck = this.checkAllergies(medicationName, patientData.allergies);
            if (allergyCheck) {
                checks.push(allergyCheck);
            }

            // Check for drug interactions with current medications
            for (const currentMed of patientData.currentMedications) {
                const interactionCheck = await this.checkDrugInteraction(
                    medicationName,
                    currentMed.name
                );
                if (interactionCheck) {
                    checks.push(interactionCheck);
                }
            }

            // Check for duplicate therapy
            const duplicateCheck = this.checkDuplicateTherapy(
                medicationName,
                patientData.currentMedications.map(m => m.name)
            );
            if (duplicateCheck) {
                checks.push(duplicateCheck);
            }

        } catch (error) {
            logger.error('Safety check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                medicationName
            });
        }

        return checks;
    }

    /**
     * Check for drug allergies
     */
    private checkAllergies(medicationName: string, allergies: string[]): ISafetyCheck | null {
        const normalizedMed = medicationName.toLowerCase();
        const matchedAllergy = allergies.find(allergy =>
            normalizedMed.includes(allergy.toLowerCase()) ||
            allergy.toLowerCase().includes(normalizedMed)
        );

        if (matchedAllergy) {
            return {
                checkType: 'allergy',
                severity: 'critical',
                description: `Patient has documented allergy to ${matchedAllergy}`,
                affectedMedications: [medicationName],
                recommendation: 'DO NOT PRESCRIBE. Consider alternative therapy.',
                source: 'Patient Allergy Record',
                timestamp: new Date()
            };
        }

        return null;
    }

    /**
     * Check for drug-drug interactions
     */
    private async checkDrugInteraction(drug1: string, drug2: string): Promise<ISafetyCheck | null> {
        try {
            // Use clinical API service to check interactions
            const result = await clinicalApiService.checkDrugInteractions([drug1, drug2]);
            const interactions = result.data;

            if (interactions && interactions.length > 0) {
                const highestSeverity = interactions.reduce((max, interaction) => {
                    const severityMap: Record<string, number> = {
                        'critical': 4,
                        'major': 3,
                        'moderate': 2,
                        'minor': 1
                    };
                    const currentSeverity = severityMap[interaction.severity?.toLowerCase() || 'minor'] || 1;
                    return currentSeverity > max.value ? { value: currentSeverity, severity: interaction.severity } : max;
                }, { value: 0, severity: 'minor' });

                return {
                    checkType: 'drug_interaction',
                    severity: highestSeverity.severity as any,
                    description: interactions[0].description || `Interaction detected between ${drug1} and ${drug2}`,
                    affectedMedications: [drug1, drug2],
                    recommendation: interactions[0].management || 'Monitor closely and consider alternative therapy',
                    source: 'RxNorm/OpenFDA',
                    timestamp: new Date()
                };
            }
        } catch (error) {
            logger.error('Drug interaction check failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                drug1,
                drug2
            });
        }

        return null;
    }

    /**
     * Check for duplicate therapy
     */
    private checkDuplicateTherapy(newMedication: string, currentMedications: string[]): ISafetyCheck | null {
        const normalizedNew = newMedication.toLowerCase();
        const duplicate = currentMedications.find(med =>
            med.toLowerCase() === normalizedNew
        );

        if (duplicate) {
            return {
                checkType: 'duplicate_therapy',
                severity: 'moderate',
                description: `Patient is already taking ${duplicate}`,
                affectedMedications: [newMedication, duplicate],
                recommendation: 'Review current therapy before adding duplicate medication',
                source: 'Current Medication List',
                timestamp: new Date()
            };
        }

        return null;
    }

    /**
     * Approve therapy recommendations
     */
    async approveRecommendations(
        labIntegrationId: string,
        pharmacistId: string,
        reviewData: {
            decision: 'approved' | 'modified' | 'rejected' | 'escalated';
            clinicalNotes: string;
            modifications?: string;
            rejectionReason?: string;
            escalationReason?: string;
            escalatedTo?: string;
        }
    ): Promise<ILabIntegration> {
        try {
            const labIntegration = await LabIntegration.findById(labIntegrationId);

            if (!labIntegration) {
                throw new Error('Lab integration case not found');
            }

            const review: IPharmacistReview = {
                reviewedBy: new Types.ObjectId(pharmacistId),
                reviewedAt: new Date(),
                decision: reviewData.decision,
                clinicalNotes: reviewData.clinicalNotes,
                modifications: reviewData.modifications,
                rejectionReason: reviewData.rejectionReason,
                escalationReason: reviewData.escalationReason,
                escalatedTo: reviewData.escalatedTo ? new Types.ObjectId(reviewData.escalatedTo) : undefined,
                signedOff: reviewData.decision === 'approved'
            };

            if (reviewData.decision === 'approved') {
                await labIntegration.approveRecommendations(review);
            } else if (reviewData.decision === 'rejected') {
                await labIntegration.rejectRecommendations(review);
            } else if (reviewData.decision === 'escalated') {
                await labIntegration.escalateToPhysician(
                    reviewData.escalationReason || 'Requires physician review',
                    reviewData.escalatedTo ? new Types.ObjectId(reviewData.escalatedTo) : undefined
                );
            }

            logger.info('Therapy recommendations reviewed', {
                labIntegrationId,
                pharmacistId,
                decision: reviewData.decision
            });

            return labIntegration;
        } catch (error) {
            logger.error('Failed to review therapy recommendations', {
                error: error instanceof Error ? error.message : 'Unknown error',
                labIntegrationId,
                pharmacistId
            });
            throw error;
        }
    }

    /**
     * Implement medication adjustments
     */
    async implementAdjustments(
        labIntegrationId: string,
        pharmacistId: string,
        adjustments: Array<{
            medicationId?: string;
            medicationName: string;
            adjustmentType: 'dose_increase' | 'dose_decrease' | 'frequency_change' | 'discontinuation' | 'new_medication' | 'formulation_change';
            previousRegimen?: string;
            newRegimen: string;
            effectiveDate: Date;
            reason: string;
            patientNotified: boolean;
            patientConsentObtained: boolean;
        }>
    ): Promise<ILabIntegration> {
        try {
            const labIntegration = await LabIntegration.findById(labIntegrationId);

            if (!labIntegration) {
                throw new Error('Lab integration case not found');
            }

            const medicationAdjustments: IMedicationAdjustment[] = adjustments.map(adj => ({
                medicationId: adj.medicationId ? new Types.ObjectId(adj.medicationId) : undefined,
                medicationName: adj.medicationName,
                adjustmentType: adj.adjustmentType,
                previousRegimen: adj.previousRegimen,
                newRegimen: adj.newRegimen,
                effectiveDate: adj.effectiveDate,
                reason: adj.reason,
                approvedBy: new Types.ObjectId(pharmacistId),
                patientNotified: adj.patientNotified,
                patientConsentObtained: adj.patientConsentObtained
            }));

            // Apply adjustments to actual medication records
            for (const adjustment of adjustments) {
                await this.applyMedicationAdjustment(
                    labIntegration.patientId,
                    labIntegration.workplaceId,
                    new Types.ObjectId(pharmacistId),
                    adjustment
                );
            }

            // Update lab integration with adjustments
            await labIntegration.implementAdjustments(medicationAdjustments);

            logger.info('Medication adjustments implemented', {
                labIntegrationId,
                pharmacistId,
                adjustmentCount: adjustments.length
            });

            return labIntegration;
        } catch (error) {
            logger.error('Failed to implement medication adjustments', {
                error: error instanceof Error ? error.message : 'Unknown error',
                labIntegrationId,
                pharmacistId
            });
            throw error;
        }
    }

    /**
     * Apply medication adjustment to actual medication records
     */
    private async applyMedicationAdjustment(
        patientId: Types.ObjectId,
        workplaceId: Types.ObjectId,
        pharmacistId: Types.ObjectId,
        adjustment: {
            medicationId?: string;
            medicationName: string;
            adjustmentType: string;
            newRegimen: string;
            effectiveDate: Date;
            reason: string;
        }
    ): Promise<void> {
        try {
            if (adjustment.adjustmentType === 'discontinuation' && adjustment.medicationId) {
                // Discontinue existing medication
                await Medication.findByIdAndUpdate(adjustment.medicationId, {
                    status: 'discontinued',
                    updatedBy: pharmacistId
                });
            } else if (adjustment.adjustmentType === 'new_medication') {
                // Parse new regimen to extract medication details
                // Format expected: "Drug Name dose frequency"
                const regimenParts = adjustment.newRegimen.split(' ');

                // Create new medication record
                const newMedication = new Medication({
                    patient: patientId,
                    pharmacist: pharmacistId,
                    drugName: adjustment.medicationName,
                    dosageForm: 'tablet', // Default, should be specified in UI
                    instructions: {
                        dosage: regimenParts[1] || '',
                        frequency: regimenParts[2] || '',
                        specialInstructions: `Lab-guided therapy adjustment: ${adjustment.reason}`
                    },
                    therapy: {
                        indication: adjustment.reason
                    },
                    status: 'active'
                });
                await newMedication.save();
            } else if (adjustment.medicationId) {
                // Update existing medication (dose change, frequency change, etc.)
                const medication = await Medication.findById(adjustment.medicationId);
                if (medication) {
                    const regimenParts = adjustment.newRegimen.split(' ');
                    medication.instructions = {
                        ...medication.instructions,
                        dosage: regimenParts[1] || medication.instructions?.dosage,
                        frequency: regimenParts[2] || medication.instructions?.frequency,
                        specialInstructions: `${medication.instructions?.specialInstructions || ''}\nLab-guided adjustment (${new Date().toLocaleDateString()}): ${adjustment.reason}`
                    };
                    await medication.save();
                }
            }
        } catch (error) {
            logger.error('Failed to apply medication adjustment', {
                error: error instanceof Error ? error.message : 'Unknown error',
                medicationId: adjustment.medicationId,
                adjustmentType: adjustment.adjustmentType
            });
            // Don't throw - log error but continue with other adjustments
        }
    }

    /**
     * Get lab value trends for a patient
     */
    async getLabTrends(
        patientId: string,
        workplaceId: string,
        testCode: string,
        daysBack: number = 180
    ): Promise<any> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysBack);

            // Get all lab results for this test
            const labResults = await LabResult.find({
                patientId: new Types.ObjectId(patientId),
                workplaceId: new Types.ObjectId(workplaceId),
                testCode,
                resultDate: { $gte: cutoffDate },
                isDeleted: false
            }).sort({ resultDate: 1 });

            if (labResults.length === 0) {
                return {
                    testCode,
                    testName: '',
                    dataPoints: [],
                    trend: null
                };
            }

            // Get therapy changes during this period
            const labIntegrations = await LabIntegration.find({
                patientId: new Types.ObjectId(patientId),
                workplaceId: new Types.ObjectId(workplaceId),
                'medicationAdjustments.0': { $exists: true },
                createdAt: { $gte: cutoffDate },
                isDeleted: false
            }).sort({ createdAt: 1 });

            // Calculate trend
            const trend = this.calculateTrend(labResults);

            return {
                testCode,
                testName: labResults[0].testName,
                unit: labResults[0].unit,
                referenceRange: labResults[0].referenceRange,
                dataPoints: labResults.map(result => ({
                    date: result.performedAt,
                    value: result.numericValue,
                    interpretation: result.interpretation,
                    criticalValue: result.criticalValue
                })),
                therapyMarkers: labIntegrations.map(integration => ({
                    date: integration.createdAt,
                    adjustments: integration.medicationAdjustments.map(adj => ({
                        medication: adj.medicationName,
                        type: adj.adjustmentType,
                        change: `${adj.previousRegimen || 'None'} → ${adj.newRegimen}`
                    }))
                })),
                trend
            };
        } catch (error) {
            logger.error('Failed to get lab trends', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId,
                testCode
            });
            throw error;
        }
    }

    /**
     * Calculate trend from lab results
     */
    private calculateTrend(labResults: ILabResult[]): any {
        if (labResults.length < 2) {
            return {
                direction: 'stable',
                percentChange: 0,
                clinicalImplication: 'Insufficient data for trend analysis'
            };
        }

        const firstValue = labResults[0].numericValue;
        const lastValue = labResults[labResults.length - 1].numericValue;

        if (!firstValue || !lastValue) {
            return {
                direction: 'stable',
                percentChange: 0,
                clinicalImplication: 'Non-numeric values cannot be trended'
            };
        }

        const percentChange = ((lastValue - firstValue) / firstValue) * 100;
        let direction: 'improving' | 'stable' | 'worsening' = 'stable';

        if (Math.abs(percentChange) < 5) {
            direction = 'stable';
        } else {
            // Determine if change is improving or worsening based on interpretation
            const lastInterpretation = labResults[labResults.length - 1].interpretation;
            const firstInterpretation = labResults[0].interpretation;

            if (lastInterpretation === 'normal' && firstInterpretation !== 'normal') {
                direction = 'improving';
            } else if (lastInterpretation !== 'normal' && firstInterpretation === 'normal') {
                direction = 'worsening';
            } else if (lastInterpretation === 'critical' || lastInterpretation === 'abnormal') {
                direction = 'worsening';
            } else {
                direction = percentChange > 0 ? 'improving' : 'worsening';
            }
        }

        return {
            direction,
            percentChange: Math.round(percentChange * 10) / 10,
            comparisonPeriod: `${labResults.length} measurements over ${Math.ceil((labResults[labResults.length - 1].performedAt.getTime() - labResults[0].performedAt.getTime()) / (1000 * 60 * 60 * 24))} days`,
            clinicalImplication: this.getTrendImplication(direction, percentChange)
        };
    }

    /**
     * Get clinical implication of trend
     */
    private getTrendImplication(direction: string, percentChange: number): string {
        if (direction === 'stable') {
            return 'Values remain stable within expected range';
        } else if (direction === 'improving') {
            return `Values showing improvement (${percentChange > 0 ? '+' : ''}${percentChange}% change)`;
        } else {
            return `Values showing concerning trend (${percentChange > 0 ? '+' : ''}${percentChange}% change) - consider intervention`;
        }
    }

    /**
     * Get lab integration by ID with full population
     */
    async getLabIntegrationById(labIntegrationId: string): Promise<ILabIntegration | null> {
        return await LabIntegration.findById(labIntegrationId)
            .populate({
                path: 'patientId',
                select: 'firstName lastName otherNames mrn age gender phone email allergies chronicConditions bloodGroup genotype weightKg'
            })
            .populate({
                path: 'pharmacistId',
                select: 'firstName lastName email role'
            })
            .populate({
                path: 'labResultIds',
                select: 'testCode testName value numericValue unit referenceRange interpretation criticalValue performedAt reportedAt'
            })
            .populate({
                path: 'labOrderId',
                select: 'orderNumber tests status orderDate clinicalIndication'
            })
            .populate({
                path: 'pharmacistReview.reviewedBy',
                select: 'firstName lastName email role'
            })
            .populate({
                path: 'medicationAdjustments.medicationId',
                select: 'drugName genericName strength dosageForm instructions status'
            });
    }

    /**
     * Get lab integrations for a patient
     */
    async getLabIntegrationsByPatient(
        patientId: string,
        workplaceId: string
    ): Promise<ILabIntegration[]> {
        return await LabIntegration.findByPatient(
            new Types.ObjectId(workplaceId),
            new Types.ObjectId(patientId)
        );
    }

    /**
     * Get pending reviews for a workplace
     */
    async getPendingReviews(workplaceId: string): Promise<ILabIntegration[]> {
        return await LabIntegration.findPendingReviews(new Types.ObjectId(workplaceId));
    }

    /**
     * Get critical cases for a workplace
     */
    async getCriticalCases(workplaceId: string): Promise<ILabIntegration[]> {
        return await LabIntegration.findCriticalCases(new Types.ObjectId(workplaceId));
    }

    /**
     * Get cases requiring physician escalation
     */
    async getCasesRequiringEscalation(workplaceId: string): Promise<ILabIntegration[]> {
        return await LabIntegration.findRequiringEscalation(new Types.ObjectId(workplaceId));
    }
}

export const labIntegrationService = new LabIntegrationService();
export default labIntegrationService;
