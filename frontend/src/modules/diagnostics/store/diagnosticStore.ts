import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { diagnosticApi } from '../api/diagnosticApi';
import type {
    DiagnosticRequest,
    DiagnosticResult,
    DiagnosticRequestForm,
    DiagnosticStore
} from '../types';

export const useDiagnosticStore = create<DiagnosticStore>()(
    persist(
        (set, get) => ({
            // Initial state
            requests: [],
            results: [],
            selectedRequest: null,
            selectedResult: null,
            loading: {
                createRequest: false,
                fetchRequests: false,
                fetchResult: false,
                approveResult: false,
            },
            errors: {
                createRequest: null,
                fetchRequests: null,
                fetchResult: null,
                approveResult: null,
            },

            // Actions
            createRequest: async (data: DiagnosticRequestForm) => {
                set((state) => ({
                    loading: { ...state.loading, createRequest: true },
                    errors: { ...state.errors, createRequest: null }
                }));

                try {
                    const response = await diagnosticApi.createRequest(data);

                    if (response.success && response.data) {
                        set((state) => ({
                            requests: [response.data!, ...state.requests],
                            selectedRequest: response.data!,
                            loading: { ...state.loading, createRequest: false }
                        }));
                        return response.data;
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, createRequest: false },
                            errors: { ...state.errors, createRequest: response.message || 'Failed to create request' }
                        }));
                        return null;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, createRequest: false },
                        errors: { ...state.errors, createRequest: errorMessage }
                    }));
                    return null;
                }
            },

            fetchRequests: async (patientId?: string) => {
                set((state) => ({
                    loading: { ...state.loading, fetchRequests: true },
                    errors: { ...state.errors, fetchRequests: null }
                }));

                try {
                    const params = patientId ? { patientId } : {};
                    const response = await diagnosticApi.getHistory(params);

                    if (response.success && response.data) {
                        set((state) => ({
                            requests: response.data!.results,
                            loading: { ...state.loading, fetchRequests: false }
                        }));
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, fetchRequests: false },
                            errors: { ...state.errors, fetchRequests: response.message || 'Failed to fetch requests' }
                        }));
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, fetchRequests: false },
                        errors: { ...state.errors, fetchRequests: errorMessage }
                    }));
                }
            },

            fetchResult: async (requestId: string) => {
                set((state) => ({
                    loading: { ...state.loading, fetchResult: true },
                    errors: { ...state.errors, fetchResult: null }
                }));

                try {
                    const response = await diagnosticApi.getResult(requestId);

                    if (response.success && response.data) {
                        set((state) => ({
                            selectedResult: response.data!,
                            results: state.results.some(r => r._id === response.data!._id)
                                ? state.results.map(r => r._id === response.data!._id ? response.data! : r)
                                : [response.data!, ...state.results],
                            loading: { ...state.loading, fetchResult: false }
                        }));
                        return response.data;
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, fetchResult: false },
                            errors: { ...state.errors, fetchResult: response.message || 'Failed to fetch result' }
                        }));
                        return null;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, fetchResult: false },
                        errors: { ...state.errors, fetchResult: errorMessage }
                    }));
                    return null;
                }
            },

            approveResult: async (resultId: string) => {
                set((state) => ({
                    loading: { ...state.loading, approveResult: true },
                    errors: { ...state.errors, approveResult: null }
                }));

                try {
                    const response = await diagnosticApi.approveResult(resultId);

                    if (response.success && response.data) {
                        set((state) => ({
                            selectedResult: response.data!,
                            results: state.results.map(r => r._id === resultId ? response.data! : r),
                            loading: { ...state.loading, approveResult: false }
                        }));
                        return true;
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, approveResult: false },
                            errors: { ...state.errors, approveResult: response.message || 'Failed to approve result' }
                        }));
                        return false;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, approveResult: false },
                        errors: { ...state.errors, approveResult: errorMessage }
                    }));
                    return false;
                }
            },

            modifyResult: async (resultId: string, modifications: string) => {
                set((state) => ({
                    loading: { ...state.loading, approveResult: true },
                    errors: { ...state.errors, approveResult: null }
                }));

                try {
                    const response = await diagnosticApi.modifyResult(resultId, modifications);

                    if (response.success && response.data) {
                        set((state) => ({
                            selectedResult: response.data!,
                            results: state.results.map(r => r._id === resultId ? response.data! : r),
                            loading: { ...state.loading, approveResult: false }
                        }));
                        return true;
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, approveResult: false },
                            errors: { ...state.errors, approveResult: response.message || 'Failed to modify result' }
                        }));
                        return false;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, approveResult: false },
                        errors: { ...state.errors, approveResult: errorMessage }
                    }));
                    return false;
                }
            },

            rejectResult: async (resultId: string, reason: string) => {
                set((state) => ({
                    loading: { ...state.loading, approveResult: true },
                    errors: { ...state.errors, approveResult: null }
                }));

                try {
                    const response = await diagnosticApi.rejectResult(resultId, reason);

                    if (response.success && response.data) {
                        set((state) => ({
                            selectedResult: response.data!,
                            results: state.results.map(r => r._id === resultId ? response.data! : r),
                            loading: { ...state.loading, approveResult: false }
                        }));
                        return true;
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, approveResult: false },
                            errors: { ...state.errors, approveResult: response.message || 'Failed to reject result' }
                        }));
                        return false;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, approveResult: false },
                        errors: { ...state.errors, approveResult: errorMessage }
                    }));
                    return false;
                }
            },

            selectRequest: (request: DiagnosticRequest | null) => {
                set({ selectedRequest: request });
            },

            selectResult: (result: DiagnosticResult | null) => {
                set({ selectedResult: result });
            },

            clearErrors: () => {
                set({
                    errors: {
                        createRequest: null,
                        fetchRequests: null,
                        fetchResult: null,
                        approveResult: null,
                    }
                });
            }
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

// Utility hooks for easier access to specific diagnostic states
export const useDiagnosticRequests = () =>
    useDiagnosticStore((state) => ({
        requests: state.requests,
        loading: state.loading.fetchRequests,
        error: state.errors.fetchRequests,
        fetchRequests: state.fetchRequests,
    }));

export const useDiagnosticResults = () =>
    useDiagnosticStore((state) => ({
        results: state.results,
        selectedResult: state.selectedResult,
        loading: state.loading.fetchResult,
        error: state.errors.fetchResult,
        fetchResult: state.fetchResult,
        selectResult: state.selectResult,
    }));

export const useDiagnosticActions = () =>
    useDiagnosticStore((state) => ({
        createRequest: state.createRequest,
        approveResult: state.approveResult,
        modifyResult: state.modifyResult,
        rejectResult: state.rejectResult,
        loading: {
            create: state.loading.createRequest,
            approve: state.loading.approveResult,
        },
        errors: {
            create: state.errors.createRequest,
            approve: state.errors.approveResult,
        },
        clearErrors: state.clearErrors,
    }));