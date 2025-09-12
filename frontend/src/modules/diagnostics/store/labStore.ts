import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { labApi } from '../api/labApi';
import type {
    LabOrder,
    LabResult,
    LabOrderForm,
    LabResultForm,
    LabStore
} from '../types';

export const useLabStore = create<LabStore>()(
    persist(
        (set, get) => ({
            // Initial state
            orders: [],
            results: [],
            selectedOrder: null,
            selectedResult: null,
            loading: {
                createOrder: false,
                fetchOrders: false,
                addResult: false,
                fetchResults: false,
            },
            errors: {
                createOrder: null,
                fetchOrders: null,
                addResult: null,
                fetchResults: null,
            },

            // Actions
            createOrder: async (data: LabOrderForm) => {
                set((state) => ({
                    loading: { ...state.loading, createOrder: true },
                    errors: { ...state.errors, createOrder: null }
                }));

                try {
                    const response = await labApi.createOrder(data);

                    if (response.success && response.data) {
                        set((state) => ({
                            orders: [response.data!, ...state.orders],
                            selectedOrder: response.data!,
                            loading: { ...state.loading, createOrder: false }
                        }));
                        return response.data;
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, createOrder: false },
                            errors: { ...state.errors, createOrder: response.message || 'Failed to create order' }
                        }));
                        return null;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, createOrder: false },
                        errors: { ...state.errors, createOrder: errorMessage }
                    }));
                    return null;
                }
            },

            fetchOrders: async (patientId?: string) => {
                set((state) => ({
                    loading: { ...state.loading, fetchOrders: true },
                    errors: { ...state.errors, fetchOrders: null }
                }));

                try {
                    const params = patientId ? { patientId } : {};
                    const response = await labApi.getOrders(params);

                    if (response.success && response.data) {
                        set((state) => ({
                            orders: response.data!.results,
                            loading: { ...state.loading, fetchOrders: false }
                        }));
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, fetchOrders: false },
                            errors: { ...state.errors, fetchOrders: response.message || 'Failed to fetch orders' }
                        }));
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, fetchOrders: false },
                        errors: { ...state.errors, fetchOrders: errorMessage }
                    }));
                }
            },

            addResult: async (data: LabResultForm) => {
                set((state) => ({
                    loading: { ...state.loading, addResult: true },
                    errors: { ...state.errors, addResult: null }
                }));

                try {
                    const response = await labApi.addResult(data);

                    if (response.success && response.data) {
                        set((state) => ({
                            results: [response.data!, ...state.results],
                            selectedResult: response.data!,
                            loading: { ...state.loading, addResult: false }
                        }));
                        return response.data;
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, addResult: false },
                            errors: { ...state.errors, addResult: response.message || 'Failed to add result' }
                        }));
                        return null;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, addResult: false },
                        errors: { ...state.errors, addResult: errorMessage }
                    }));
                    return null;
                }
            },

            fetchResults: async (patientId?: string) => {
                set((state) => ({
                    loading: { ...state.loading, fetchResults: true },
                    errors: { ...state.errors, fetchResults: null }
                }));

                try {
                    const params = patientId ? { patientId } : {};
                    const response = await labApi.getResults(params);

                    if (response.success && response.data) {
                        set((state) => ({
                            results: response.data!.results,
                            loading: { ...state.loading, fetchResults: false }
                        }));
                    } else {
                        set((state) => ({
                            loading: { ...state.loading, fetchResults: false },
                            errors: { ...state.errors, fetchResults: response.message || 'Failed to fetch results' }
                        }));
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
                    set((state) => ({
                        loading: { ...state.loading, fetchResults: false },
                        errors: { ...state.errors, fetchResults: errorMessage }
                    }));
                }
            },

            selectOrder: (order: LabOrder | null) => {
                set({ selectedOrder: order });
            },

            selectResult: (result: LabResult | null) => {
                set({ selectedResult: result });
            },

            clearErrors: () => {
                set({
                    errors: {
                        createOrder: null,
                        fetchOrders: null,
                        addResult: null,
                        fetchResults: null,
                    }
                });
            }
        }),
        {
            name: 'lab-store',
            partialize: (state) => ({
                selectedOrder: state.selectedOrder,
                selectedResult: state.selectedResult,
            }),
        }
    )
);

// Utility hooks for easier access to specific lab states
export const useLabOrders = () =>
    useLabStore((state) => ({
        orders: state.orders,
        selectedOrder: state.selectedOrder,
        loading: state.loading.fetchOrders,
        error: state.errors.fetchOrders,
        fetchOrders: state.fetchOrders,
        selectOrder: state.selectOrder,
    }));

export const useLabResults = () =>
    useLabStore((state) => ({
        results: state.results,
        selectedResult: state.selectedResult,
        loading: state.loading.fetchResults,
        error: state.errors.fetchResults,
        fetchResults: state.fetchResults,
        selectResult: state.selectResult,
    }));

export const useLabActions = () =>
    useLabStore((state) => ({
        createOrder: state.createOrder,
        addResult: state.addResult,
        loading: {
            createOrder: state.loading.createOrder,
            addResult: state.loading.addResult,
        },
        errors: {
            createOrder: state.errors.createOrder,
            addResult: state.errors.addResult,
        },
        clearErrors: state.clearErrors,
    }));