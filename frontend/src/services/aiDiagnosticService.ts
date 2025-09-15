import { apiClient } from './apiClient';

export interface DiagnosticCaseData {
    patientId: string;
    symptoms: {
        subjective: string[];
        objective: string[];
        duration: string;
        severity: 'mild' | 'moderate' | 'severe';
        onset: 'acute' | 'chronic' | 'subacute';
    };
    vitals?: {
        bloodPressure?: string;
        heartRate?: number;
        temperature?: number;
        bloodGlucose?: number;
        respiratoryRate?: number;
    };
    currentMedications?: Array<{
        name: string;
        dosage: string;
        frequency: string;
    }>;
    allergies?: string[];
    medicalHistory?: string[];
    labResults?: string[];
}

export interface AIAnalysisResult {
    id: string;
    caseId: string;
    analysis: {
        primaryDiagnosis: {
            condition: string;
            confidence: number;
            reasoning: string;
        };
        differentialDiagnoses: Array<{
            condition: string;
            confidence: number;
            reasoning: string;
        }>;
        recommendedTests: Array<{
            test: string;
            priority: 'high' | 'medium' | 'low';
            reasoning: string;
        }>;
        treatmentSuggestions: Array<{
            treatment: string;
            type: 'medication' | 'procedure' | 'lifestyle' | 'referral';
            priority: 'high' | 'medium' | 'low';
            reasoning: string;
        }>;
        riskFactors: Array<{
            factor: string;
            severity: 'high' | 'medium' | 'low';
            description: string;
        }>;
        followUpRecommendations: Array<{
            action: string;
            timeframe: string;
            reasoning: string;
        }>;
    };
    confidence: number;
    processingTime: number;
    createdAt: string;
    status: 'processing' | 'completed' | 'failed';
}

export interface DiagnosticCase {
    id: string;
    patientId: string;
    caseData: DiagnosticCaseData;
    aiAnalysis?: AIAnalysisResult;
    status: 'draft' | 'submitted' | 'analyzing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}

class AIdiagnosticService {
    /**
     * Transform backend analysis structure to frontend format
     */
    private transformAnalysisStructure(backendAnalysis: any) {
        return {
            primaryDiagnosis: {
                condition: backendAnalysis.differentialDiagnoses?.[0]?.condition || 'Unknown',
                confidence: (backendAnalysis.differentialDiagnoses?.[0]?.probability || 0) / 100,
                reasoning: backendAnalysis.differentialDiagnoses?.[0]?.reasoning || 'No reasoning provided'
            },
            differentialDiagnoses: (backendAnalysis.differentialDiagnoses || []).slice(1).map((dx: unknown) => ({
                condition: dx.condition,
                confidence: dx.probability / 100,
                reasoning: dx.reasoning
            })),
            recommendedTests: (backendAnalysis.recommendedTests || []).map((test: unknown) => ({
                test: test.testName,
                priority: test.priority === 'urgent' ? 'high' : test.priority === 'routine' ? 'medium' : 'low',
                reasoning: test.reasoning
            })),
            treatmentSuggestions: (backendAnalysis.therapeuticOptions || []).map((option: unknown) => ({
                treatment: option.medication,
                type: 'medication' as const,
                priority: 'medium' as const,
                reasoning: option.reasoning
            })),
            riskFactors: (backendAnalysis.redFlags || []).map((flag: unknown) => ({
                factor: flag.flag,
                severity: flag.severity === 'critical' ? 'high' : flag.severity,
                description: flag.action
            })),
            followUpRecommendations: backendAnalysis.referralRecommendation ? [{
                action: `Referral to ${backendAnalysis.referralRecommendation.specialty}`,
                timeframe: backendAnalysis.referralRecommendation.urgency,
                reasoning: backendAnalysis.referralRecommendation.reason
            }] : []
        };
    }
    /**
     * Submit a diagnostic case for AI analysis
     */
    async submitCase(caseData: DiagnosticCaseData): Promise<DiagnosticCase> {
        try {
            // Transform data to match backend API expectations
            const apiPayload = {
                patientId: caseData.patientId,
                symptoms: caseData.symptoms,
                labResults: caseData.labResults || [],
                currentMedications: caseData.currentMedications || [],
                vitalSigns: caseData.vitalSigns || {},
                patientConsent: caseData.patientConsent || {
                    provided: true,
                    method: 'electronic'
                }
            };

            // Use extended timeout for AI analysis (3 minutes)
            const response = await apiClient.post('/api/diagnostics/ai', apiPayload, {
                timeout: 180000 // 3 minutes timeout for AI processing
            });

            // Transform response to match frontend expectations
            const responseData = response.data.data;
            const transformedAnalysis = this.transformAnalysisStructure(responseData.analysis);

            return {
                id: responseData.caseId,
                patientId: caseData.patientId,
                caseData: caseData,
                aiAnalysis: {
                    id: responseData.caseId,
                    caseId: responseData.caseId,
                    analysis: transformedAnalysis,
                    confidence: responseData.analysis?.confidenceScore || 0,
                    processingTime: responseData.processingTime,
                    createdAt: new Date().toISOString(),
                    status: 'completed' as const
                },
                status: 'completed' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } catch (error: unknown) {
            console.error('Failed to submit diagnostic case:', error);

            // Provide more specific error messages
            if (error?.response?.status === 401) {
                const message = error?.response?.data?.message || 'Authentication failed';
                throw new Error(`Authentication Error: ${message}`);
            } else if (error?.response?.status === 403) {
                const message = error?.response?.data?.message || 'Access denied';
                throw new Error(`Permission Error: ${message}`);
            } else if (error?.response?.status === 402) {
                const message = error?.response?.data?.message || 'Subscription required';
                throw new Error(`Subscription Error: ${message}`);
            } else if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw error;
        }
    }

    /**
     * Get AI analysis for a case
     */
    async getAnalysis(caseId: string): Promise<AIAnalysisResult> {
        try {
            const caseData = await this.getCase(caseId);
            if (caseData.aiAnalysis) {
                return caseData.aiAnalysis;
            }
            throw new Error('No AI analysis found for this case');
        } catch (error) {
            console.error('Failed to get AI analysis:', error);
            throw error;
        }
    }

    /**
     * Get case details
     */
    async getCase(caseId: string): Promise<DiagnosticCase> {
        try {
            const response = await apiClient.get(`/api/diagnostics/cases/${caseId}`, {
                timeout: 30000 // 30 seconds timeout for getting case data
            });
            const diagnosticCase = response.data.data;

            // Transform backend response to frontend format
            return {
                id: diagnosticCase._id,
                patientId: typeof diagnosticCase.patientId === 'object'
                    ? diagnosticCase.patientId._id || diagnosticCase.patientId.id
                    : diagnosticCase.patientId,
                caseData: {
                    patientId: typeof diagnosticCase.patientId === 'object'
                        ? diagnosticCase.patientId._id || diagnosticCase.patientId.id
                        : diagnosticCase.patientId,
                    symptoms: diagnosticCase.symptoms,
                    vitals: diagnosticCase.vitalSigns || {},
                    currentMedications: diagnosticCase.currentMedications || [],
                    allergies: [], // Not stored in this format
                    medicalHistory: [], // Not stored in this format
                    labResults: diagnosticCase.labResults || []
                },
                aiAnalysis: diagnosticCase.aiAnalysis ? {
                    id: diagnosticCase._id,
                    caseId: diagnosticCase.caseId,
                    analysis: this.transformAnalysisStructure(diagnosticCase.aiAnalysis),
                    confidence: diagnosticCase.aiAnalysis.confidenceScore || 0,
                    processingTime: diagnosticCase.aiRequestData?.processingTime || 0,
                    createdAt: diagnosticCase.createdAt,
                    status: 'completed' as const
                } : undefined,
                status: diagnosticCase.status === 'pending' ? 'analyzing' as const :
                    diagnosticCase.status === 'processing' ? 'analyzing' as const :
                        diagnosticCase.status === 'completed' ? 'completed' as const :
                            diagnosticCase.status === 'failed' ? 'failed' as const : 'analyzing' as const,
                createdAt: diagnosticCase.createdAt,
                updatedAt: diagnosticCase.updatedAt
            };
        } catch (error: unknown) {
            console.error('Failed to get diagnostic case:', error);

            // Provide more specific error messages
            if (error?.response?.status === 401) {
                const message = error?.response?.data?.message || 'Authentication failed';
                throw new Error(`Authentication Error: ${message}`);
            } else if (error?.response?.status === 403) {
                const message = error?.response?.data?.message || 'Access denied';
                throw new Error(`Permission Error: ${message}`);
            } else if (error?.response?.status === 422) {
                const message = error?.response?.data?.message || 'Invalid request data';
                throw new Error(`Validation Error: ${message}`);
            } else if (error?.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw error;
        }
    }

    /**
     * Get all cases for a patient
     */
    async getPatientCases(patientId: string): Promise<DiagnosticCase[]> {
        try {
            const response = await apiClient.get(`/api/diagnostics/patients/${patientId}/history`);
            const diagnosticCases = response.data.data.cases;

            // Transform backend cases to frontend format
            return diagnosticCases.map((diagnosticCase: unknown) => ({
                id: diagnosticCase._id,
                patientId: typeof diagnosticCase.patientId === 'object'
                    ? diagnosticCase.patientId._id || diagnosticCase.patientId.id
                    : diagnosticCase.patientId,
                caseData: {
                    patientId: typeof diagnosticCase.patientId === 'object'
                        ? diagnosticCase.patientId._id || diagnosticCase.patientId.id
                        : diagnosticCase.patientId,
                    symptoms: diagnosticCase.symptoms,
                    vitals: diagnosticCase.vitalSigns || {},
                    currentMedications: diagnosticCase.currentMedications || [],
                    allergies: [], // Not stored in this format
                    medicalHistory: [], // Not stored in this format
                    labResults: diagnosticCase.labResults || []
                },
                aiAnalysis: diagnosticCase.aiAnalysis ? {
                    id: diagnosticCase._id,
                    caseId: diagnosticCase.caseId,
                    analysis: this.transformAnalysisStructure(diagnosticCase.aiAnalysis),
                    confidence: diagnosticCase.aiAnalysis.confidenceScore || 0,
                    processingTime: diagnosticCase.aiRequestData?.processingTime || 0,
                    createdAt: diagnosticCase.createdAt,
                    status: 'completed' as const
                } : undefined,
                status: diagnosticCase.status === 'pending' ? 'analyzing' as const :
                    diagnosticCase.status === 'processing' ? 'analyzing' as const :
                        diagnosticCase.status === 'completed' ? 'completed' as const :
                            diagnosticCase.status === 'failed' ? 'failed' as const : 'analyzing' as const,
                createdAt: diagnosticCase.createdAt,
                updatedAt: diagnosticCase.updatedAt
            }));
        } catch (error) {
            console.error('Failed to get patient cases:', error);
            throw error;
        }
    }

    /**
     * Poll for analysis completion
     */
    async pollAnalysis(caseId: string, maxAttempts: number = 30): Promise<AIAnalysisResult> {
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const analysis = await this.getAnalysis(caseId);

                if (analysis.status === 'completed') {
                    return analysis;
                } else if (analysis.status === 'failed') {
                    throw new Error('AI analysis failed');
                }

                // Wait 2 seconds before next attempt
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            } catch (error) {
                if (attempts === maxAttempts - 1) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }
        }

        throw new Error('Analysis timeout - please check back later');
    }
}

export const aiDiagnosticService = new AIdiagnosticService();