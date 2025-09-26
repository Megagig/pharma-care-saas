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
  }
});

// Query Keys Factory - Centralized query key management for Patient Management
// Using a functional approach to avoid circular references

// Base query key generators
const createBaseKeys = (entity: string) => ({
  all: [entity] as const,
  lists: () => [entity, 'list'] as const,
  list: (filters: Record<string, unknown>) => [entity, 'list', { filters }] as const,
  details: () => [entity, 'detail'] as const,
  detail: (id: string) => [entity, 'detail', id] as const
});

const createPatientRelatedKeys = (entity: string) => ({
  ...createBaseKeys(entity),
  byPatient: (patientId: string) => [entity, 'patient', patientId] as const
});

export const queryKeys = {
  // Patient queries
  patients: {
    ...createBaseKeys('patients'),
    search: (query: string) => ['patients', 'search', query] as const,
    summary: (id: string) => ['patients', 'summary', id] as const,
  },

  // Allergy queries
  allergies: createPatientRelatedKeys('allergies'),

  // Condition queries
  conditions: createPatientRelatedKeys('conditions'),

  // Medication queries
  medications: {
    ...createPatientRelatedKeys('medications'),
    current: (patientId: string) => ['medications', 'patient', patientId, 'current'] as const,
    past: (patientId: string) => ['medications', 'patient', patientId, 'past'] as const,
  },

  // Clinical Assessment queries
  assessments: {
    ...createPatientRelatedKeys('assessments'),
    latest: (patientId: string) => ['assessments', 'patient', patientId, 'latest'] as const,
  },

  // Drug Therapy Problem queries
  dtps: {
    ...createPatientRelatedKeys('dtps'),
    active: (patientId: string) => ['dtps', 'patient', patientId, 'active'] as const,
  },

  // Care Plan queries
  carePlans: {
    ...createPatientRelatedKeys('carePlans'),
    latest: (patientId: string) => ['carePlans', 'patient', patientId, 'latest'] as const,
  },

  // Visit queries
  visits: {
    ...createPatientRelatedKeys('visits'),
    attachments: (visitId: string) => ['visits', 'detail', visitId, 'attachments'] as const,
  },

  // Clinical Notes queries (legacy support)
  clinicalNotes: createPatientRelatedKeys('clinicalNotes'),

  // MTR (Medication Therapy Review) queries
  mtr: {
    ...createPatientRelatedKeys('mtr'),
    active: () => ['mtr', 'active'] as const,
    overdue: () => ['mtr', 'overdue'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      ['mtr', 'statistics', dateRange] as const,
    workflowSteps: () => ['mtr', 'workflow', 'steps'] as const,
  },

  // Drug Therapy Problems queries
  drugTherapyProblems: {
    ...createPatientRelatedKeys('drugTherapyProblems'),
    byReview: (reviewId: string) => ['drugTherapyProblems', 'review', reviewId] as const,
    active: () => ['drugTherapyProblems', 'active'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      ['drugTherapyProblems', 'statistics', dateRange] as const,
  },

  // MTR Interventions queries
  mtrInterventions: {
    ...createPatientRelatedKeys('mtrInterventions'),
    byReview: (reviewId: string) => ['mtrInterventions', 'review', reviewId] as const,
    pending: () => ['mtrInterventions', 'pending'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      ['mtrInterventions', 'statistics', dateRange] as const,
  },

  // MTR Follow-ups queries
  mtrFollowUps: {
    ...createPatientRelatedKeys('mtrFollowUps'),
    byReview: (reviewId: string) => ['mtrFollowUps', 'review', reviewId] as const,
    scheduled: () => ['mtrFollowUps', 'scheduled'] as const,
    overdue: () => ['mtrFollowUps', 'overdue'] as const,
    statistics: (dateRange?: { start: string; end: string }) =>
      ['mtrFollowUps', 'statistics', dateRange] as const,
  },

  // Clinical Interventions queries
  clinicalInterventions: {
    ...createPatientRelatedKeys('clinicalInterventions'),
    assignedToMe: () => ['clinicalInterventions', 'assigned-to-me'] as const,
    search: (query: string) => ['clinicalInterventions', 'search', query] as const,
    analytics: {
      all: ['clinicalInterventions', 'analytics'] as const,
      dashboard: (dateRange?: { start: string; end: string }) =>
        ['clinicalInterventions', 'analytics', 'dashboard', dateRange] as const,
      trends: (dateRange?: { start: string; end: string }) =>
        ['clinicalInterventions', 'analytics', 'trends', dateRange] as const,
      categories: () => ['clinicalInterventions', 'analytics', 'categories'] as const,
      priorities: () => ['clinicalInterventions', 'analytics', 'priorities'] as const,
    },
    recommendations: (category: string) =>
      ['clinicalInterventions', 'recommendations', category] as const,
    duplicates: (patientId: string, category: string) =>
      ['clinicalInterventions', 'duplicates', patientId, category] as const,
  },

  // Diagnostics queries
  diagnostics: {
    all: ['diagnostics'] as const,
    requests: () => ['diagnostics', 'requests'] as const,
    request: (id: string) => ['diagnostics', 'request', id] as const,
    results: () => ['diagnostics', 'results'] as const,
    result: (requestId: string) => ['diagnostics', 'result', requestId] as const,
    history: (params: Record<string, unknown>) => ['diagnostics', 'history', params] as const,
    analytics: (params?: Record<string, unknown>) => ['diagnostics', 'analytics', params] as const,
    status: (requestId: string) => ['diagnostics', 'status', requestId] as const,
  },

  // Lab queries
  lab: {
    orders: {
      all: ['lab', 'orders'] as const,
      lists: () => ['lab', 'orders', 'list'] as const,
      list: (params: Record<string, unknown>) => ['lab', 'orders', 'list', params] as const,
      detail: (id: string) => ['lab', 'orders', 'detail', id] as const,
      byPatient: (patientId: string) => ['lab', 'orders', 'patient', patientId] as const,
      pending: () => ['lab', 'orders', 'pending'] as const,
      completed: () => ['lab', 'orders', 'completed'] as const,
    },
    results: {
      all: ['lab', 'results'] as const,
      lists: () => ['lab', 'results', 'list'] as const,
      list: (params: Record<string, unknown>) => ['lab', 'results', 'list', params] as const,
      detail: (id: string) => ['lab', 'results', 'detail', id] as const,
      byPatient: (patientId: string) => ['lab', 'results', 'patient', patientId] as const,
      byOrder: (orderId: string) => ['lab', 'results', 'order', orderId] as const,
      critical: (workplaceId?: string) => ['lab', 'results', 'critical', workplaceId] as const,
      abnormal: (patientId: string, days?: number) => ['lab', 'results', 'abnormal', patientId, days] as const,
    },
    trends: (patientId: string, testCode: string, days?: number) =>
      ['lab', 'trends', patientId, testCode, days] as const,
    catalog: {
      all: ['lab', 'catalog'] as const,
      search: (search?: string) => ['lab', 'catalog', 'search', search] as const,
    },
    referenceRanges: (testCode: string) => ['lab', 'reference-ranges', testCode] as const,
  },

  // Interactions queries
  interactions: {
    all: ['interactions'] as const,
    check: (medications: string[], allergies?: string[]) =>
      ['interactions', 'check', { medications, allergies }] as const,
    drugInfo: (drugName: string) => ['interactions', 'drug-info', drugName] as const,
    search: (query: string, limit?: number) => ['interactions', 'search', query, limit] as const,
    allergies: (medications: string[], allergies: string[]) =>
      ['interactions', 'allergies', { medications, allergies }] as const,
    details: (drug1: string, drug2: string) =>
      ['interactions', 'details', drug1, drug2] as const,
    classInteractions: (drugClass: string) =>
      ['interactions', 'class', drugClass] as const,
    foodInteractions: (drugName: string) =>
      ['interactions', 'food', drugName] as const,
    pregnancyInfo: (drugName: string) =>
      ['interactions', 'pregnancy', drugName] as const,
  },
};
