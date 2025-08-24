import { QueryClient } from '@tanstack/react-query';

// Create a new QueryClient instance with optimized configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in production
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query Keys Factory - Centralized query key management
export const queryKeys = {
  // Patient queries
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.patients.lists(), { filters }] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
    search: (query: string) => [...queryKeys.patients.all, 'search', query] as const,
  },
  
  // Medication queries
  medications: {
    all: ['medications'] as const,
    lists: () => [...queryKeys.medications.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.medications.lists(), { filters }] as const,
    details: () => [...queryKeys.medications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.medications.details(), id] as const,
    byPatient: (patientId: string) => [...queryKeys.medications.all, 'patient', patientId] as const,
  },
  
  // Clinical Notes queries
  clinicalNotes: {
    all: ['clinicalNotes'] as const,
    lists: () => [...queryKeys.clinicalNotes.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.clinicalNotes.lists(), { filters }] as const,
    details: () => [...queryKeys.clinicalNotes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clinicalNotes.details(), id] as const,
    byPatient: (patientId: string) => [...queryKeys.clinicalNotes.all, 'patient', patientId] as const,
  },
} as const;