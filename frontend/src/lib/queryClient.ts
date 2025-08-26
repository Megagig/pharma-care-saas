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

// Query Keys Factory - Centralized query key management for Patient Management
export const queryKeys = {
  // Patient queries
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.patients.lists(), { filters }] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
    search: (query: string) =>
      [...queryKeys.patients.all, 'search', query] as const,
    summary: (id: string) =>
      [...queryKeys.patients.all, 'summary', id] as const,
  },

  // Allergy queries
  allergies: {
    all: ['allergies'] as const,
    lists: () => [...queryKeys.allergies.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.allergies.lists(), { filters }] as const,
    details: () => [...queryKeys.allergies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.allergies.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.allergies.all, 'patient', patientId] as const,
  },

  // Condition queries
  conditions: {
    all: ['conditions'] as const,
    lists: () => [...queryKeys.conditions.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.conditions.lists(), { filters }] as const,
    details: () => [...queryKeys.conditions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conditions.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.conditions.all, 'patient', patientId] as const,
  },

  // Medication queries
  medications: {
    all: ['medications'] as const,
    lists: () => [...queryKeys.medications.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.medications.lists(), { filters }] as const,
    details: () => [...queryKeys.medications.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.medications.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.medications.all, 'patient', patientId] as const,
    current: (patientId: string) =>
      [...queryKeys.medications.byPatient(patientId), 'current'] as const,
    past: (patientId: string) =>
      [...queryKeys.medications.byPatient(patientId), 'past'] as const,
  },

  // Clinical Assessment queries
  assessments: {
    all: ['assessments'] as const,
    lists: () => [...queryKeys.assessments.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.assessments.lists(), { filters }] as const,
    details: () => [...queryKeys.assessments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assessments.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.assessments.all, 'patient', patientId] as const,
    latest: (patientId: string) =>
      [...queryKeys.assessments.byPatient(patientId), 'latest'] as const,
  },

  // Drug Therapy Problem queries
  dtps: {
    all: ['dtps'] as const,
    lists: () => [...queryKeys.dtps.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.dtps.lists(), { filters }] as const,
    details: () => [...queryKeys.dtps.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.dtps.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.dtps.all, 'patient', patientId] as const,
    active: (patientId: string) =>
      [...queryKeys.dtps.byPatient(patientId), 'active'] as const,
  },

  // Care Plan queries
  carePlans: {
    all: ['carePlans'] as const,
    lists: () => [...queryKeys.carePlans.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.carePlans.lists(), { filters }] as const,
    details: () => [...queryKeys.carePlans.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.carePlans.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.carePlans.all, 'patient', patientId] as const,
    latest: (patientId: string) =>
      [...queryKeys.carePlans.byPatient(patientId), 'latest'] as const,
  },

  // Visit queries
  visits: {
    all: ['visits'] as const,
    lists: () => [...queryKeys.visits.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.visits.lists(), { filters }] as const,
    details: () => [...queryKeys.visits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.visits.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.visits.all, 'patient', patientId] as const,
    attachments: (visitId: string) =>
      [...queryKeys.visits.detail(visitId), 'attachments'] as const,
  },

  // Clinical Notes queries (legacy support)
  clinicalNotes: {
    all: ['clinicalNotes'] as const,
    lists: () => [...queryKeys.clinicalNotes.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.clinicalNotes.lists(), { filters }] as const,
    details: () => [...queryKeys.clinicalNotes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clinicalNotes.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.clinicalNotes.all, 'patient', patientId] as const,
  },
} as const;
