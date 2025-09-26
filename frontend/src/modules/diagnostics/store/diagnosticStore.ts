import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { diagnosticApi } from '../api/diagnosticApi';

// Mock data and types
interface DiagnosticRequest {}
interface DiagnosticResult {}
interface DiagnosticRequestForm {}
interface DiagnosticAnalytics {}
interface ClinicalNoteFilters {}

interface DiagnosticStore {
  requests: DiagnosticRequest[];
  results: DiagnosticResult[];
  selectedRequest: DiagnosticRequest | null;
  selectedResult: DiagnosticResult | null;
  filters: ClinicalNoteFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  uiState: {
    pollingActive: boolean;
    pollingInterval: NodeJS.Timeout | null;
    showCreateModal: boolean;
    showResultModal: boolean;
    activeStep: number;
  };
  analytics: DiagnosticAnalytics | null;
  loading: {
    createRequest: boolean;
    fetchRequests: boolean;
    fetchResult: boolean;
    approveResult: boolean;
    fetchAnalytics: boolean;
    polling: boolean;
  };
  errors: {
    createRequest: string | null;
    fetchRequests: string | null;
    fetchResult: string | null;
    approveResult: string | null;
    fetchAnalytics: string | null;
    polling: string | null;
  };
  createRequest: (data: DiagnosticRequestForm) => Promise<DiagnosticRequest | null>;
  fetchRequests: (filters?: ClinicalNoteFilters) => Promise<void>;
  fetchResult: (requestId: string) => Promise<DiagnosticResult | null>;
  approveResult: (resultId: string) => Promise<boolean>;
  modifyResult: (resultId: string, modifications: string) => Promise<boolean>;
  rejectResult: (resultId: string, reason: string) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  startPolling: (requestId: string, interval?: number) => void;
  stopPolling: () => void;
  pollResult: (requestId: string) => Promise<void>;
  setFilters: (newFilters: Partial<ClinicalNoteFilters>) => void;
  clearFilters: () => void;
  searchRequests: (searchTerm: string) => void;
  filterByPatient: (patientId: string) => void;
  filterByStatus: (status: any) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  selectRequest: (request: DiagnosticRequest | null) => void;
  selectResult: (result: DiagnosticResult | null) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowResultModal: (show: boolean) => void;
  setActiveStep: (step: number) => void;
  fetchAnalytics: (params: any) => Promise<void>;
  addRequestToState: (request: DiagnosticRequest) => void;
  updateRequestInState: (id: string, updates: Partial<DiagnosticRequest>) => void;
  removeRequestFromState: (id: string) => void;
  addResultToState: (result: DiagnosticResult) => void;
  updateResultInState: (id: string, updates: Partial<DiagnosticResult>) => void;
  clearErrors: () => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
  getRequestsByPatient: (patientId: string) => DiagnosticRequest[];
  getResultsByRequest: (requestId: string) => DiagnosticResult[];
  getPendingRequests: () => DiagnosticRequest[];
  getCompletedRequests: () => DiagnosticRequest[];
  getFilteredRequests: () => DiagnosticRequest[];
}

export const useDiagnosticStore = create<DiagnosticStore>()(
  persist(
    (set, get) => ({
      requests: [],
      results: [],
      selectedRequest: null,
      selectedResult: null,
      filters: {
        search: '',
        patientId: '',
        status: undefined,
        dateFrom: '',
        dateTo: '',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      },
      uiState: {
        pollingActive: false,
        pollingInterval: null,
        showCreateModal: false,
        showResultModal: false,
        activeStep: 0,
      },
      analytics: null,
      loading: {
        createRequest: false,
        fetchRequests: false,
        fetchResult: false,
        approveResult: false,
        fetchAnalytics: false,
        polling: false,
      },
      errors: {
        createRequest: null,
        fetchRequests: null,
        fetchResult: null,
        approveResult: null,
        fetchAnalytics: null,
        polling: null,
      },
      createRequest: async (data) => {
        return null;
      },
      fetchRequests: async (filters) => {},
      fetchResult: async (requestId) => {
        return null;
      },
      approveResult: async (resultId) => {
        return false;
      },
      modifyResult: async (resultId, modifications) => {
        return false;
      },
      rejectResult: async (resultId, reason) => {
        return false;
      },
      cancelRequest: async (requestId) => {
        return false;
      },
      startPolling: (requestId, interval = 5000) => {},
      stopPolling: () => {},
      pollResult: async (requestId) => {},
      setFilters: (newFilters) => {},
      clearFilters: () => {},
      searchRequests: (searchTerm) => {},
      filterByPatient: (patientId) => {},
      filterByStatus: (status) => {},
      setPage: (page) => {},
      setLimit: (limit) => {},
      selectRequest: (request) => {},
      selectResult: (result) => {},
      setShowCreateModal: (show) => {},
      setShowResultModal: (show) => {},
      setActiveStep: (step) => {},
      fetchAnalytics: async (params) => {},
      addRequestToState: (request) => {},
      updateRequestInState: (id, updates) => {},
      removeRequestFromState: (id) => {},
      addResultToState: (result) => {},
      updateResultInState: (id, updates) => {},
      clearErrors: () => {},
      setLoading: (key, loading) => {},
      setError: (key, error) => {},
      getRequestsByPatient: (patientId) => [],
      getResultsByRequest: (requestId) => [],
      getPendingRequests: () => [],
      getCompletedRequests: () => [],
      getFilteredRequests: () => [],
    }),
    {
      name: 'diagnostic-store',
      partialize: (state) => ({
        selectedRequest: state.selectedRequest,
        selectedResult: state.selectedResult,
      }),
    }
  )
);