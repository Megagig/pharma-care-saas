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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
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
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.clinicalNotes.lists(), { filters }] as const,
    details: () => [...queryKeys.clinicalNotes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clinicalNotes.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.clinicalNotes.all, 'patient', patientId] as const,
  },

  // MTR (Medication Therapy Review) queries
  mtr: {
    all: ['mtr'] as const,
    lists: () => [...queryKeys.mtr.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.mtr.lists(), { filters }] as const,
    details: () => [...queryKeys.mtr.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.mtr.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.mtr.all, 'patient', patientId] as const,
    active: () => [...queryKeys.mtr.all, 'active'] as const,
    overdue: () => [...queryKeys.mtr.all, 'overdue'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      [...queryKeys.mtr.all, 'statistics', dateRange] as const,
    workflowSteps: () => [...queryKeys.mtr.all, 'workflow', 'steps'] as const,
  },

  // Drug Therapy Problems queries
  drugTherapyProblems: {
    all: ['drugTherapyProblems'] as const,
    lists: () => [...queryKeys.drugTherapyProblems.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.drugTherapyProblems.lists(), { filters }] as const,
    details: () => [...queryKeys.drugTherapyProblems.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.drugTherapyProblems.details(), id] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.drugTherapyProblems.all, 'patient', patientId] as const,
    byReview: (reviewId: string) =>
      [...queryKeys.drugTherapyProblems.all, 'review', reviewId] as const,
    active: () => [...queryKeys.drugTherapyProblems.all, 'active'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      [...queryKeys.drugTherapyProblems.all, 'statistics', dateRange] as const,
  },

  // MTR Interventions queries
  mtrInterventions: {
    all: ['mtrInterventions'] as const,
    lists: () => [...queryKeys.mtrInterventions.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.mtrInterventions.lists(), { filters }] as const,
    details: () => [...queryKeys.mtrInterventions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.mtrInterventions.details(), id] as const,
    byReview: (reviewId: string) =>
      [...queryKeys.mtrInterventions.all, 'review', reviewId] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.mtrInterventions.all, 'patient', patientId] as const,
    pending: () => [...queryKeys.mtrInterventions.all, 'pending'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      [...queryKeys.mtrInterventions.all, 'statistics', dateRange] as const,
  },

  // MTR Follow-ups queries
  mtrFollowUps: {
    all: ['mtrFollowUps'] as const,
    lists: () => [...queryKeys.mtrFollowUps.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.mtrFollowUps.lists(), { filters }] as const,
    details: () => [...queryKeys.mtrFollowUps.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.mtrFollowUps.details(), id] as const,
    byReview: (reviewId: string) =>
      [...queryKeys.mtrFollowUps.all, 'review', reviewId] as const,
    byPatient: (patientId: string) =>
      [...queryKeys.mtrFollowUps.all, 'patient', patientId] as const,
    scheduled: () => [...queryKeys.mtrFollowUps.all, 'scheduled'] as const,
    overdue: () => [...queryKeys.mtrFollowUps.all, 'overdue'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      [...queryKeys.mtrFollowUps.all, 'statistics', dateRange] as const,
  },
} as const;
