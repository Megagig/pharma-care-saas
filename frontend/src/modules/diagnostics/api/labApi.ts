import { apiClient } from '../../../lib/api';
import type {
    LabOrder,
    LabResult,
    LabOrderForm,
    LabResultForm,
    ApiResponse,
    PaginatedResponse,
    LabOrderParams,
    LabResultParams
} from '../types';

const API_BASE = '/api/lab';

export const labApi = {
    // Lab Orders
    createOrder: async (data: LabOrderForm): Promise<ApiResponse<LabOrder>> => {
        return apiClient.post(`${API_BASE}/orders`, data);
    },

    getOrders: async (params: LabOrderParams = {}): Promise<PaginatedResponse<LabOrder>> => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiClient.get(`${API_BASE}/orders?${searchParams.toString()}`);
    },

    getOrder: async (orderId: string): Promise<ApiResponse<LabOrder>> => {
        return apiClient.get(`${API_BASE}/orders/${orderId}`);
    },

    updateOrderStatus: async (
        orderId: string,
        status: LabOrder['status']
    ): Promise<ApiResponse<LabOrder>> => {
        return apiClient.patch(`${API_BASE}/orders/${orderId}/status`, { status });
    },

    cancelOrder: async (orderId: string): Promise<ApiResponse<LabOrder>> => {
        return apiClient.post(`${API_BASE}/orders/${orderId}/cancel`);
    },

    // Lab Results
    addResult: async (data: LabResultForm): Promise<ApiResponse<LabResult>> => {
        return apiClient.post(`${API_BASE}/results`, data);
    },

    getResults: async (params: LabResultParams = {}): Promise<PaginatedResponse<LabResult>> => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });

        return apiClient.get(`${API_BASE}/results?${searchParams.toString()}`);
    },

    getResult: async (resultId: string): Promise<ApiResponse<LabResult>> => {
        return apiClient.get(`${API_BASE}/results/${resultId}`);
    },

    updateResult: async (
        resultId: string,
        data: Partial<LabResultForm>
    ): Promise<ApiResponse<LabResult>> => {
        return apiClient.patch(`${API_BASE}/results/${resultId}`, data);
    },

    deleteResult: async (resultId: string): Promise<ApiResponse<null>> => {
        return apiClient.delete(`${API_BASE}/results/${resultId}`);
    },

    // Trend Analysis
    getTrends: async (
        patientId: string,
        testCode: string,
        days: number = 90
    ): Promise<ApiResponse<{
        testCode: string;
        testName: string;
        unit?: string;
        referenceRange: {
            low?: number;
            high?: number;
            text?: string;
        };
        results: Array<{
            value: string;
            numericValue?: number;
            interpretation: string;
            performedAt: string;
            flags: string[];
        }>;
        trend: 'improving' | 'stable' | 'worsening' | 'insufficient_data';
        summary: {
            latestValue: string;
            latestInterpretation: string;
            changeFromPrevious?: number;
            abnormalCount: number;
            totalCount: number;
        };
    }>> => {
        return apiClient.get(`${API_BASE}/trends/${patientId}/${testCode}?days=${days}`);
    },

    // Critical Results
    getCriticalResults: async (workplaceId?: string): Promise<ApiResponse<LabResult[]>> => {
        const params = workplaceId ? `?workplaceId=${workplaceId}` : '';
        return apiClient.get(`${API_BASE}/results/critical${params}`);
    },

    // Abnormal Results
    getAbnormalResults: async (
        patientId: string,
        days: number = 30
    ): Promise<ApiResponse<LabResult[]>> => {
        return apiClient.get(`${API_BASE}/results/abnormal/${patientId}?days=${days}`);
    },

    // FHIR Integration
    importFHIR: async (data: {
        fhirBundle: any;
        patientMapping: {
            fhirPatientId: string;
            internalPatientId: string;
        };
    }): Promise<ApiResponse<LabResult[]>> => {
        return apiClient.post(`${API_BASE}/import/fhir`, data);
    },

    exportOrder: async (orderId: string): Promise<ApiResponse<{
        fhirResource: any;
        exportedAt: string;
    }>> => {
        return apiClient.post(`${API_BASE}/orders/${orderId}/export`);
    },

    // Lab Test Catalog
    getTestCatalog: async (search?: string): Promise<ApiResponse<Array<{
        code: string;
        name: string;
        loincCode?: string;
        category: string;
        description?: string;
        referenceRange?: {
            low?: number;
            high?: number;
            text?: string;
            unit?: string;
        };
    }>>> => {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        return apiClient.get(`${API_BASE}/catalog${params}`);
    },

    // Reference Ranges
    getReferenceRanges: async (testCode: string): Promise<ApiResponse<{
        testCode: string;
        testName: string;
        ranges: Array<{
            ageGroup?: string;
            gender?: string;
            low?: number;
            high?: number;
            unit?: string;
            text?: string;
        }>;
    }>> => {
        return apiClient.get(`${API_BASE}/reference-ranges/${testCode}`);
    }
};