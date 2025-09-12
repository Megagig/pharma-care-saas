// Frontend Types for Diagnostics Module

export interface DiagnosticRequest {
    _id: string;
    patientId: string;
    pharmacistId: string;
    workplaceId: string;
    locationId?: string;
    inputSnapshot: {
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
        labResultIds?: string[];
    };
    consentObtained: boolean;
    consentTimestamp: string;
    promptVersion: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DiagnosticResult {
    _id: string;
    requestId: string;
    diagnoses: Array<{
        condition: string;
        probability: number;
        reasoning: string;
        severity: 'low' | 'medium' | 'high';
        icdCode?: string;
        snomedCode?: string;
    }>;
    suggestedTests: Array<{
        testName: string;
        priority: 'urgent' | 'routine' | 'optional';
        reasoning: string;
        loincCode?: string;
    }>;
    medicationSuggestions: Array<{
        drugName: string;
        dosage: string;
        frequency: string;
        duration: string;
        reasoning: string;
        safetyNotes: string[];
        rxcui?: string;
    }>;
    redFlags: Array<{
        flag: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        action: string;
    }>;
    referralRecommendation?: {
        recommended: boolean;
        urgency: 'immediate' | 'within_24h' | 'routine';
        specialty: string;
        reason: string;
    };
    aiMetadata: {
        modelId: string;
        modelVersion: string;
        confidenceScore: number;
        processingTime: number;
        tokenUsage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        requestId: string;
    };
    disclaimer: string;
    pharmacistReview?: {
        status: 'approved' | 'modified' | 'rejected';
        modifications?: string;
        rejectionReason?: string;
        reviewedBy: string;
        reviewedAt: string;
    };
    createdAt: string;
}

export interface LabOrder {
    _id: string;
    patientId: string;
    orderedBy: string;
    workplaceId: string;
    locationId?: string;
    tests: Array<{
        code: string;
        name: string;
        loincCode?: string;
        indication: string;
        priority: 'stat' | 'urgent' | 'routine';
    }>;
    status: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
    orderDate: string;
    expectedDate?: string;
    externalOrderId?: string;
    fhirReference?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LabResult {
    _id: string;
    orderId?: string;
    patientId: string;
    workplaceId: string;
    testCode: string;
    testName: string;
    value: string;
    unit?: string;
    referenceRange: {
        low?: number;
        high?: number;
        text?: string;
    };
    interpretation: 'low' | 'normal' | 'high' | 'critical' | 'abnormal';
    flags: string[];
    source: 'manual' | 'fhir' | 'lis' | 'external';
    performedAt: string;
    recordedAt: string;
    recordedBy: string;
    externalResultId?: string;
    fhirReference?: string;
    loincCode?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DrugInteraction {
    drug1: string;
    drug2: string;
    severity: 'minor' | 'moderate' | 'major';
    description: string;
    clinicalEffect: string;
    mechanism?: string;
    management?: string;
}

export interface AllergyAlert {
    drug: string;
    allergy: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction: string;
}

export interface Contraindication {
    drug: string;
    condition: string;
    reason: string;
    severity: 'warning' | 'contraindicated';
}

// Form types
export interface DiagnosticRequestForm {
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
    consent: boolean;
}

export interface LabOrderForm {
    patientId: string;
    tests: Array<{
        code: string;
        name: string;
        loincCode?: string;
        indication: string;
        priority: 'stat' | 'urgent' | 'routine';
    }>;
    expectedDate?: string;
}

export interface LabResultForm {
    patientId: string;
    orderId?: string;
    testCode: string;
    testName: string;
    value: string;
    unit?: string;
    referenceRange: {
        low?: number;
        high?: number;
        text?: string;
    };
    interpretation?: 'low' | 'normal' | 'high' | 'critical' | 'abnormal';
    flags?: string[];
    performedAt: string;
    loincCode?: string;
}

// Store types
export interface DiagnosticStore {
    // State
    requests: DiagnosticRequest[];
    results: DiagnosticResult[];
    selectedRequest: DiagnosticRequest | null;
    selectedResult: DiagnosticResult | null;
    loading: {
        createRequest: boolean;
        fetchRequests: boolean;
        fetchResult: boolean;
        approveResult: boolean;
    };
    errors: {
        createRequest: string | null;
        fetchRequests: string | null;
        fetchResult: string | null;
        approveResult: string | null;
    };

    // Actions
    createRequest: (data: DiagnosticRequestForm) => Promise<DiagnosticRequest | null>;
    fetchRequests: (patientId?: string) => Promise<void>;
    fetchResult: (requestId: string) => Promise<DiagnosticResult | null>;
    approveResult: (resultId: string) => Promise<boolean>;
    modifyResult: (resultId: string, modifications: string) => Promise<boolean>;
    rejectResult: (resultId: string, reason: string) => Promise<boolean>;
    selectRequest: (request: DiagnosticRequest | null) => void;
    selectResult: (result: DiagnosticResult | null) => void;
    clearErrors: () => void;
}

export interface LabStore {
    // State
    orders: LabOrder[];
    results: LabResult[];
    selectedOrder: LabOrder | null;
    selectedResult: LabResult | null;
    loading: {
        createOrder: boolean;
        fetchOrders: boolean;
        addResult: boolean;
        fetchResults: boolean;
    };
    errors: {
        createOrder: string | null;
        fetchOrders: string | null;
        addResult: string | null;
        fetchResults: string | null;
    };

    // Actions
    createOrder: (data: LabOrderForm) => Promise<LabOrder | null>;
    fetchOrders: (patientId?: string) => Promise<void>;
    addResult: (data: LabResultForm) => Promise<LabResult | null>;
    fetchResults: (patientId?: string) => Promise<void>;
    selectOrder: (order: LabOrder | null) => void;
    selectResult: (result: LabResult | null) => void;
    clearErrors: () => void;
}

// UI Component Props
export interface SymptomInputProps {
    value: DiagnosticRequestForm['symptoms'];
    onChange: (symptoms: DiagnosticRequestForm['symptoms']) => void;
    error?: string;
    disabled?: boolean;
}

export interface VitalSignsInputProps {
    value?: DiagnosticRequestForm['vitals'];
    onChange: (vitals: DiagnosticRequestForm['vitals']) => void;
    error?: string;
    disabled?: boolean;
}

export interface MedicationHistoryInputProps {
    value?: DiagnosticRequestForm['currentMedications'];
    onChange: (medications: DiagnosticRequestForm['currentMedications']) => void;
    error?: string;
    disabled?: boolean;
}

export interface AllergyInputProps {
    value?: string[];
    onChange: (allergies: string[]) => void;
    error?: string;
    disabled?: boolean;
}

export interface DiagnosticResultsPanelProps {
    result: DiagnosticResult;
    onApprove?: () => void;
    onModify?: (modifications: string) => void;
    onReject?: (reason: string) => void;
    loading?: boolean;
    error?: string;
}

export interface LabOrderFormProps {
    patientId: string;
    onSubmit: (data: LabOrderForm) => void;
    loading?: boolean;
    error?: string;
}

export interface LabResultEntryProps {
    orderId?: string;
    patientId: string;
    onSubmit: (data: LabResultForm) => void;
    loading?: boolean;
    error?: string;
}

export interface LabResultViewerProps {
    results: LabResult[];
    showTrends?: boolean;
    onResultClick?: (result: LabResult) => void;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<{ results: T[] }> {
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// Query parameters
export interface DiagnosticHistoryParams {
    patientId?: string;
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface LabOrderParams {
    patientId?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface LabResultParams {
    patientId?: string;
    testCode?: string;
    interpretation?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

// Utility types
export type DiagnosticStatus = DiagnosticRequest['status'];
export type LabOrderStatus = LabOrder['status'];
export type LabResultInterpretation = LabResult['interpretation'];
export type SeverityLevel = 'mild' | 'moderate' | 'severe';
export type PriorityLevel = 'stat' | 'urgent' | 'routine' | 'optional';
export type ReviewStatus = 'approved' | 'modified' | 'rejected';

// Error types
export interface DiagnosticError {
    code: string;
    message: string;
    field?: string;
    details?: any;
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

// Loading states
export interface LoadingStates {
    [key: string]: boolean;
}

export interface ErrorStates {
    [key: string]: string | null;
}