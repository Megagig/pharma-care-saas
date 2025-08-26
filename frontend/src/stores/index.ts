// Main store composition and exports
export * from './types';
export * from './uiStore';
export * from './patientStore';
export * from './medicationStore';
export * from './clinicalNoteStore';

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

// Store reset function for clearing all stores (useful for logout)
export const resetAllStores = () => {
  // Clear localStorage for all persisted stores
  localStorage.removeItem('ui-store');
  localStorage.removeItem('patient-store');
  localStorage.removeItem('medication-store');
  localStorage.removeItem('clinical-note-store');
  
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
      hasPersistedData: !!localStorage.getItem('ui-store'),
    },
    patient: {
      hasPersistedData: !!localStorage.getItem('patient-store'),
    },
    medication: {
      hasPersistedData: !!localStorage.getItem('medication-store'),
    },
    clinicalNote: {
      hasPersistedData: !!localStorage.getItem('clinical-note-store'),
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