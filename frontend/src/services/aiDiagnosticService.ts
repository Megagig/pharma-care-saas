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
    // Alias for backward compatibility
    vitalSigns?: {
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
    patientConsent?: {
        provided: boolean;
        method: string;
    };
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
    patientId: string | {
        _id?: string;
        id?: string;
        firstName?: string;
        lastName?: string;
        age?: number;
        gender?: string;
    };
    caseData: DiagnosticCaseData;
    aiAnalysis?: AIAnalysisResult;
    status: 'draft' | 'submitted' | 'analyzing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}

class AIdiagnosticService {
    /**
     * Safely get confidence score from analysis object
     */
    private getConfidenceScore(analysis: unknown): number {
        if (analysis && typeof analysis === 'object' && 'confidenceScore' in analysis) {
            return (analysis as any).confidenceScore || 0;
        }
        return 0;
    }

    /**
     * Transform backend analysis structure to frontend format
     */
    private transformAnalysisStructure(backendAnalysis: unknown) {
        if (!backendAnalysis || typeof backendAnalysis !== 'object') {
            return {
                primaryDiagnosis: {
                    condition: 'Unknown',
                    confidence: 0,
                    reasoning: 'No reasoning provided'
                },
                differentialDiagnoses: [],
                recommendedTests: [],
                treatmentSuggestions: [],
                riskFactors: [],
                followUpRecommendations: []
            };
        }

        const analysis = backendAnalysis as {
            differentialDiagnoses?: Array<{
                condition?: string;
                probability?: number;
                reasoning?: string;
            }>;
            recommendedTests?: Array<{
                testName?: string;
                priority?: string;
                reasoning?: string;
            }>;
            therapeuticOptions?: Array<{
                medication?: string;
                reasoning?: string;
            }>;
            redFlags?: Array<{
                flag?: string;
                severity?: string;
                action?: string;
            }>;
            referralRecommendation?: {
                specialty?: string;
                urgency?: string;
                reason?: string;
            };
        };

        return {
            primaryDiagnosis: {
                condition: analysis.differentialDiagnoses?.[0]?.condition || 'Unknown',
                confidence: (analysis.differentialDiagnoses?.[0]?.probability || 0) / 100,
                reasoning: analysis.differentialDiagnoses?.[0]?.reasoning || 'No reasoning provided'
            },
            differentialDiagnoses: (analysis.differentialDiagnoses || []).slice(1).map((dx) => ({
                condition: dx.condition || 'Unknown',
                confidence: (dx.probability || 0) / 100,
                reasoning: dx.reasoning || 'No reasoning provided'
            })),
            recommendedTests: (analysis.recommendedTests || []).map((test) => ({
                test: test.testName || 'Unknown test',
                priority: (test.priority === 'urgent' ? 'high' : test.priority === 'routine' ? 'medium' : 'low') as 'high' | 'medium' | 'low',
                reasoning: test.reasoning || 'No reasoning provided'
            })),
            treatmentSuggestions: (analysis.therapeuticOptions || []).map((option) => ({
                treatment: option.medication || 'Unknown treatment',
                type: 'medication' as const,
                priority: 'medium' as const,
                reasoning: option.reasoning || 'No reasoning provided'
            })),
            riskFactors: (analysis.redFlags || []).map((flag) => ({
                factor: flag.flag || 'Unknown risk factor',
                severity: (flag.severity === 'critical' ? 'high' : flag.severity || 'medium') as 'high' | 'medium' | 'low',
                description: flag.action || 'No description provided'
            })),
            followUpRecommendations: analysis.referralRecommendation ? [{
                action: `Referral to ${analysis.referralRecommendation.specialty || 'specialist'}`,
                timeframe: analysis.referralRecommendation.urgency || 'As needed',
                reasoning: analysis.referralRecommendation.reason || 'No reasoning provided'
            }] : []
        };
    }
    /**
     * Validate patient access before submitting diagnostic case
     */
    async validatePatientAccess(patientId: string): Promise<{ hasAccess: boolean; patientName?: string; error?: string }> {
        try {
            const response = await apiClient.post('/diagnostics/patient/validate', {
                patientId
            });

            return {
                hasAccess: true,
                patientName: response.data.data.patientName
            };
        } catch (error: unknown) {
            console.error('Failed to validate patient access:', error);

            if (
                error &&
                typeof error === 'object' &&
                'response' in error &&
                error.response &&
                typeof error.response === 'object' &&
                'data' in error.response
            ) {
                const response = error.response as {
                    status: number;
                    data?: { message?: string; debug?: string };
                };

                return {
                    hasAccess: false,
                    error: response.data?.message || 'Patient access validation failed',
                };
            }

            return {
                hasAccess: false,
                error: 'Failed to validate patient access'
            };
        }
    }

    /**
     * Submit a diagnostic case for AI analysis
     */
    async submitCase(caseData: DiagnosticCaseData): Promise<DiagnosticCase> {
        try {
            // Transform data to match backend API expectations
            const apiPayload = {
                patientId: caseData.patientId,
                inputSnapshot: {
                    symptoms: caseData.symptoms,
                    vitals: caseData.vitalSigns || caseData.vitals || {},
                    currentMedications: caseData.currentMedications || [],
                    allergies: caseData.allergies || [],
                    medicalHistory: caseData.medicalHistory || [],
                    labResultIds: caseData.labResults || [],
                },
                priority: 'routine' as const,
                consentObtained: caseData.patientConsent?.provided ?? true
            };

            console.log('🚨🚨🚨 SUBMITCASE METHOD CALLED - CODE IS UPDATED 🚨🚨🚨');

            // Debug: Log the payload being sent
            console.log('🚀 Submitting to backend:', JSON.stringify(apiPayload, null, 2));

            // Use extended timeout for AI analysis (3 minutes)
            const response = await apiClient.post('/diagnostics', apiPayload, {
                timeout: 180000 // 3 minutes timeout for AI processing
            });

            console.log('🚨🚨🚨 RESPONSE RECEIVED 🚨🚨🚨');
            console.log('🚨 typeof response:', typeof response);
            console.log('🚨 response keys:', response ? Object.keys(response) : 'null');

            // Debug: Log the full response structure
            console.log('🔍 Full API Response:', response);
            console.log('🔍 Response Data:', response.data);
            console.log('🔍 Response Data.data:', response.data.data);

            // Transform response to match frontend expectations
            const responseData = response.data.data;
            console.log('🔍 Response Data Object:', responseData);

            const diagnosticRequest = responseData.request;
            console.log('🔍 Diagnostic Request:', diagnosticRequest);
            console.log('🔍 Request ID (_id):', diagnosticRequest?._id);
            console.log('🔍 Request ID (id):', diagnosticRequest?.id);

            const requestId = diagnosticRequest?._id || diagnosticRequest?.id;
            console.log('🔍 Extracted Request ID:', requestId);

            console.log('🚨🚨🚨 ABOUT TO RETURN OBJECT 🚨🚨🚨');
            console.log('🚨 requestId value:', requestId);
            console.log('🚨 requestId type:', typeof requestId);

            const transformedAnalysis = this.transformAnalysisStructure(responseData.analysis);

            return {
                id: requestId,
                patientId: caseData.patientId,
                caseData: caseData,
                aiAnalysis: {
                    id: requestId,
                    caseId: requestId,
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
            if (
                error &&
                typeof error === 'object' &&
                'response' in error &&
                error.response &&
                typeof error.response === 'object' &&
                'status' in error.response
            ) {
                const response = error.response as {
                    status: number;
                    data?: {
                        message?: string;
                        details?: any;
                        errors?: any;
                    };
                };

                // Log full error details for debugging
                console.error('API Error Response:', {
                    status: response.status,
                    data: response.data
                });

                if (response.status === 422) {
                    // Validation error - provide detailed feedback
                    const details = response.data?.details || response.data?.errors;
                    let message = 'Validation failed:\n';

                    if (Array.isArray(details)) {
                        // Handle array of validation errors
                        message += details.map((err: any) => {
                            if (typeof err === 'string') return err;
                            if (err.path && err.message) return `• ${err.path}: ${err.message}`;
                            if (err.message) return `• ${err.message}`;
                            if (err.msg) return `• ${err.msg}`;
                            return `• ${JSON.stringify(err)}`;
                        }).join('\n');
                    } else if (details && typeof details === 'object') {
                        // Handle object of validation errors
                        message += JSON.stringify(details, null, 2);
                    } else {
                        message += response.data?.message || 'Please check your input';
                    }

                    console.error('Validation Error Details:', message);
                    throw new Error(message);
                } else if (response.status === 401) {
                    const message = response.data?.message || 'Authentication failed';
                    throw new Error(`Authentication Error: ${message}`);
                } else if (response.status === 403) {
                    const message = response.data?.message || 'Access denied';
                    throw new Error(`Permission Error: ${message}`);
                } else if (response.status === 404) {
                    const message = response.data?.message || 'Patient not found or access denied';
                    throw new Error(`Patient Error: ${message}`);
                } else if (response.status === 402) {
                    const message = response.data?.message || 'Subscription required';
                    throw new Error(`Subscription Error: ${message}`);
                } else if (response.data?.message) {
                    throw new Error(response.data.message);
                }
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
            const response = await apiClient.get(`/diagnostics/${caseId}`, {
                timeout: 30000 // 30 seconds timeout for getting case data
            });
            const diagnosticCase = response.data.data;

            console.log('🔧 Backend diagnosticCase:', diagnosticCase);
            console.log('🔧 diagnosticCase._id:', diagnosticCase._id);
            console.log('🔧 diagnosticCase.id:', diagnosticCase.id);

            // Extract ID - try both _id and id
            const extractedId = diagnosticCase._id || diagnosticCase.id || caseId;

            // Extract patientId
            const extractedPatientId = diagnosticCase.patientId && typeof diagnosticCase.patientId === 'object'
                ? diagnosticCase.patientId._id || diagnosticCase.patientId.id
                : diagnosticCase.patientId;

            // Transform backend response to frontend format
            return {
                id: extractedId,
                patientId: extractedPatientId || 'unknown',
                caseData: {
                    patientId: extractedPatientId || 'unknown',
                    symptoms: diagnosticCase.symptoms || { subjective: [], objective: [], duration: '', severity: 'mild' as const, onset: 'acute' as const },
                    vitals: diagnosticCase.vitalSigns || {},
                    currentMedications: diagnosticCase.currentMedications || [],
                    allergies: [], // Not stored in this format
                    medicalHistory: [], // Not stored in this format
                    labResults: diagnosticCase.labResults || []
                },
                aiAnalysis: diagnosticCase.aiAnalysis ? {
                    id: extractedId,
                    caseId: extractedId,
                    analysis: this.transformAnalysisStructure(diagnosticCase.aiAnalysis),
                    confidence: this.getConfidenceScore(diagnosticCase.aiAnalysis),
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
            if (
                error &&
                typeof error === 'object' &&
                'response' in error &&
                error.response &&
                typeof error.response === 'object' &&
                'status' in error.response
            ) {
                const response = error.response as {
                    status: number;
                    data?: { message?: string };
                };

                if (response.status === 401) {
                    const message = response.data?.message || 'Authentication failed';
                    throw new Error(`Authentication Error: ${message}`);
                } else if (response.status === 403) {
                    const message = response.data?.message || 'Access denied';
                    throw new Error(`Permission Error: ${message}`);
                } else if (response.status === 422) {
                    const message = response.data?.message || 'Invalid request data';
                    throw new Error(`Validation Error: ${message}`);
                } else if (response.data?.message) {
                    throw new Error(response.data.message);
                }
            }

            throw error;
        }
    }

    /**
     * Get all cases for a patient
     */
    async getPatientCases(patientId: string): Promise<DiagnosticCase[]> {
        try {
            const response = await apiClient.get(`/diagnostics/patients/${patientId}/history`);
            const diagnosticCases = response.data.data.cases;

            // Transform backend cases to frontend format
            return diagnosticCases.map((diagnosticCase: {
                _id: string;
                patientId: string | { _id?: string; id?: string };
                symptoms: unknown;
                vitalSigns?: unknown;
                currentMedications?: unknown[];
                labResults?: string[];
                aiAnalysis?: unknown;
                aiRequestData?: { processingTime?: number };
                status: string;
                createdAt: string;
                updatedAt: string;
                caseId: string;
            }) => ({
                id: diagnosticCase._id,
                patientId: diagnosticCase.patientId && typeof diagnosticCase.patientId === 'object'
                    ? diagnosticCase.patientId._id || diagnosticCase.patientId.id
                    : diagnosticCase.patientId,
                caseData: {
                    patientId: diagnosticCase.patientId && typeof diagnosticCase.patientId === 'object'
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
                    confidence: this.getConfidenceScore(diagnosticCase.aiAnalysis),
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