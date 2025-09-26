// import ClinicalNotesErrorBoundary from './ClinicalNotesErrorBoundary';

import { Spinner } from '@/components/ui/button';
// Lazy load Clinical Notes components
const ClinicalNotesDashboard = lazy(() => import('./ClinicalNotesDashboard'));
const ClinicalNoteForm = lazy(() => import('./ClinicalNoteForm'));
const ClinicalNoteDetail = lazy(() => import('./ClinicalNoteDetail'));
const PatientClinicalNotes = lazy(() => import('./PatientClinicalNotes'));

// Loading fallback component
const ClinicalNotesLoadingFallback: React.FC<{
  message?: string;
  minHeight?: number;
}> = ({ message = 'Loading Clinical Notes...', minHeight = 400 }) => (
  <div
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    minHeight={minHeight}
    gap={2}
  >
    <Spinner size={40} />
    <div  color="text.secondary">
      {message}
    </div>
  </div>
);

// Lazy-loaded Dashboard wrapper
export const LazyClinicalNotesDashboard: React.FC<any> = (props) => (
  <ClinicalNotesErrorBoundary>
    <Suspense
      fallback={<ClinicalNotesLoadingFallback message="Loading Dashboard..." />}
    >
      <ClinicalNotesDashboard {...props} />
    </Suspense>
  </ClinicalNotesErrorBoundary>
);

// Lazy-loaded Form wrapper
export const LazyClinicalNoteForm: React.FC<any> = (props) => (
  <ClinicalNotesErrorBoundary>
    <Suspense
      fallback={<ClinicalNotesLoadingFallback message="Loading Form..." />}
    >
      <ClinicalNoteForm {...props} />
    </Suspense>
  </ClinicalNotesErrorBoundary>
);

// Lazy-loaded Detail wrapper
export const LazyClinicalNoteDetail: React.FC<any> = (props) => (
  <ClinicalNotesErrorBoundary>
    <Suspense
      fallback={
        <ClinicalNotesLoadingFallback message="Loading Note Details..." />}
      }
    >
      <ClinicalNoteDetail {...props} />
    </Suspense>
  </ClinicalNotesErrorBoundary>
);

// Lazy-loaded Patient Notes wrapper
export const LazyPatientClinicalNotes: React.FC<any> = (props) => (
  <ClinicalNotesErrorBoundary>
    <Suspense
      fallback={
        <ClinicalNotesLoadingFallback
          message="Loading Patient Notes..."}
          minHeight={200}
        />
      }
    >
      <PatientClinicalNotes {...props} />
    </Suspense>
  </ClinicalNotesErrorBoundary>
);

// Preload functions for better UX
export const preloadClinicalNotesComponents = {
  dashboard: () => import('./ClinicalNotesDashboard'),
  form: () => import('./ClinicalNoteForm'),
  detail: () => import('./ClinicalNoteDetail'),
  patientNotes: () => import('./PatientClinicalNotes'),
  all: () =>
    Promise.all([
      import('./ClinicalNotesDashboard'),
      import('./ClinicalNoteForm'),
      import('./ClinicalNoteDetail'),
      import('./PatientClinicalNotes'),
    ]),
};

// Hook for preloading components on user interaction
export const useClinicalNotesPreloader = () => {
  const preloadOnHover = React.useCallback(
    (component: keyof typeof preloadClinicalNotesComponents) => {
      return () => {
        if (component === 'all') {
          preloadClinicalNotesComponents.all();
        } else {
          preloadClinicalNotesComponents[component]();
        }
      };
    },
    []
  );

  return { preloadOnHover };
};

export default {
  preloadClinicalNotesComponents,
  useClinicalNotesPreloader,
};
