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
                vitalSigns: caseData.vitals || {},
                patientConsent: {
                    provided: true,
                    method: 'electronic'
                }
            };

            // Use extended timeout for AI analysis (60 seconds)
            const response = await apiClient.post('/api/diagnostics/ai', apiPayload, {
                timeout: 60000 // 60 seconds timeout for AI processing
            });

            // Transform response to match frontend expectations
            const responseData = response.data.data;
            return {
                id: responseData.caseId,
                patientId: caseData.patientId,
                caseData: caseData,
                aiAnalysis: {
                    id: responseData.caseId,
                    caseId: responseData.caseId,
                    analysis: responseData.analysis,
                    confidence: responseData.analysis.confidenceScore || 0,
                    processingTime: responseData.processingTime,
                    createdAt: new Date().toISOString(),
                    status: 'completed' as const
                },
                status: 'completed' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } catch (error: any) {
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
            const response = await apiClient.get(`/api/diagnostics/cases/${caseId}`);
            const diagnosticCase = response.data.data;

            // Transform backend response to frontend format
            return {
                id: diagnosticCase._id,
                patientId: diagnosticCase.patientId,
                caseData: {
                    patientId: diagnosticCase.patientId,
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
                    analysis: diagnosticCase.aiAnalysis,
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
                patientId: diagnosticCase.patientId,
                caseData: {
                    patientId: diagnosticCase.patientId,
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
                    analysis: diagnosticCase.aiAnalysis,
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