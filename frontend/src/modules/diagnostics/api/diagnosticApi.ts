import { apiClient } from '../../../lib/api';
import type {
    DiagnosticRequest,
    DiagnosticResult,
    DiagnosticRequestForm,
    ApiResponse,
    PaginatedResponse,
    DiagnosticHistoryParams
} from '../types';

const API_BASE = '/api/diagnostics';

export const diagnosticApi = {
    // Create new diagnostic request
    createRequest: async (data: DiagnosticRequestForm): Promise<ApiResponse<DiagnosticRequest>> => {
        return apiClient.post(`${API_BASE}`, data);
    },

    // Get diagnostic result by request ID
    getResult: async (requestId: string): Promise<ApiResponse<DiagnosticResult>> => {
        return apiClient.get(`${API_BASE}/${requestId}`);
    },

    // Get diagnostic request by ID
    getRequest: async (requestId: string): Promise<ApiResponse<DiagnosticRequest>> => {
        return apiClient.get(`${API_BASE}/requests/${requestId}`);
    },

    // Get patient diagnostic history
    getHistory: async (params: DiagnosticHistoryParams): Promise<PaginatedResponse<DiagnosticRequest>> => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiClient.get(`${API_BASE}/history?${searchParams.toString()}`);
    },

    // Approve diagnostic result
    approveResult: async (resultId: string): Promise<ApiResponse<DiagnosticResult>> => {
        return apiClient.post(`${API_BASE}/results/${resultId}/approve`);
    },

    // Modify diagnostic result
    modifyResult: async (
        resultId: string,
        modifications: string
    ): Promise<ApiResponse<DiagnosticResult>> => {
        return apiClient.post(`${API_BASE}/results/${resultId}/modify`, {
            modifications
        });
    },

    // Reject diagnostic result
    rejectResult: async (
        resultId: string,
        rejectionReason: string
    ): Promise<ApiResponse<DiagnosticResult>> => {
        return apiClient.post(`${API_BASE}/results/${resultId}/reject`, {
            rejectionReason
        });
    },

    // Cancel diagnostic request
    cancelRequest: async (requestId: string): Promise<ApiResponse<DiagnosticRequest>> => {
        return apiClient.post(`${API_BASE}/requests/${requestId}/cancel`);
    },

    // Get processing status
    getStatus: async (requestId: string): Promise<ApiResponse<{
        status: string;
        progress?: number;
        message?: string;
        estimatedCompletion?: string;
    }>> => {
        return apiClient.get(`${API_BASE}/requests/${requestId}/status`);
    },

    // Get diagnostic analytics
    getAnalytics: async (params?: {
        dateFrom?: string;
        dateTo?: string;
        patientId?: string;
    }): Promise<ApiResponse<{
        totalRequests: number;
        completedRequests: number;
        averageProcessingTime: number;
        averageConfidenceScore: number;
        topDiagnoses: Array<{
            condition: string;
            count: number;
            averageConfidence: number;
        }>;
        pharmacistReviewStats: {
            approvedCount: number;
            modifiedCount: number;
            rejectedCount: number;
            averageReviewTime: number;
        };
    }>> => {
        const searchParams = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
        }

        return apiClient.get(`${API_BASE}/analytics?${searchParams.toString()}`);
    }
};