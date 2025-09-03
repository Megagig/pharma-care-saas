// Main store composition and exports
export * from './types';
export * from './uiStore';
export * from './patientStore';
export * from './medicationStore';
export * from './clinicalNoteStore';
export * from './mtrStore';
export * from './clinicalInterventionStore';

// Re-export all store hooks for easier importing
export {
  // UI Store hooks
  useUIStore,
  useNotifications,
  useModals,
  useLoading,
  useSidebar,
  useTheme,
} from './uiStore';

export {
  // Patient Store hooks
  usePatientStore,
  usePatients,
  useSelectedPatient,
  usePatientFilters,
  usePatientActions,
} from './patientStore';

export {
  // Medication Store hooks
  useMedicationStore,
  useMedications,
  useSelectedMedication,
  useMedicationFilters,
  useMedicationActions,
  useMedicationAnalytics,
} from './medicationStore';

export {
  // Clinical Note Store hooks
  useClinicalNoteStore,
  useClinicalNotes,
  useSelectedNote,
  useClinicalNoteFilters,
  useClinicalNoteActions,
  useClinicalNoteAnalytics,
} from './clinicalNoteStore';

export {
  // MTR Store hooks
  useMTRStore,
  useMTRSession,
  useMTRNavigation,
  useMTRPatient,
  useMTRMedications,
  useMTRAssessment,
  useMTRPlan,
  useMTRInterventions,
  useMTRFollowUps,
} from './mtrStore';

export {
  // Clinical Intervention Store hooks
  useClinicalInterventionStore,
  useInterventions,
  useSelectedIntervention,
  useInterventionFilters,
  useInterventionActions,
  useInterventionWorkflow,
  useInterventionUI,
  useInterventionAnalytics,
} from './clinicalInterventionStore';

// Store reset function for clearing all stores (useful for logout)
export const resetAllStores = () => {
  // Note: Previously used localStorage, but now using httpOnly cookies
  // Store data is managed server-side, so no local cleanup needed
  // You can also programmatically reset stores if needed
  // This would require implementing reset actions in each store
};

// Global store utilities
export const clearAllErrors = () => {
  // You can call clearErrors on all stores that have this method
  // This requires accessing the stores directly
};

// Store health check - useful for debugging
export const getStoreStatus = () => {
  return {
    ui: {
      hasPersistedData: false, // localStorage removed for security
    },
    patient: {
      hasPersistedData: false, // localStorage removed for security
    },
    medication: {
      hasPersistedData: false, // localStorage removed for security
    },
    clinicalNote: {
      hasPersistedData: false, // localStorage removed for security
    },
    mtr: {
      hasPersistedData: false, // localStorage removed for security
    },
  };
};

// Store initialization helper
export const initializeStores = async () => {
  // This function can be called on app startup to initialize all stores
  // You can add any initialization logic here
  console.log('Zustand stores initialized');
  console.log('Store status:', getStoreStatus());
};
