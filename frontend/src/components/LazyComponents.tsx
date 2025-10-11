import { lazy } from 'react';

// Heavy page components that should be lazy loaded
export const LazyModernDashboard = lazy(() => import('../pages/ModernDashboardPage'));
export const LazyPatients = lazy(() => import('../pages/Patients'));
export const LazyClinicalNotes = lazy(() => import('../pages/ClinicalNotes'));
export const LazyClinicalNoteDetail = lazy(() => import('../pages/ClinicalNoteDetailPage'));
export const LazyClinicalNoteForm = lazy(() => import('../pages/ClinicalNoteFormPage'));
export const LazyMedications = lazy(() => import('../pages/Medications'));
export const LazyMedicationTherapyReview = lazy(() => import('../pages/MedicationTherapyReview'));
export const LazyCommunicationHub = lazy(() => import('../pages/CommunicationHub'));
export const LazyDrugInformationCenter = lazy(() => import('../pages/DrugInformationCenter'));
export const LazyClinicalDecisionSupport = lazy(() => import('../pages/ClinicalDecisionSupport'));
export const LazyPharmacyReports = lazy(() => import('../pages/PharmacyReports'));
export const LazyPharmacyUserManagement = lazy(() => import('../pages/EnhancedUserManagement'));
export const LazyPharmacyUserManagementOld = lazy(() => import('../pages/PharmacyUserManagement'));

// Module components
export const LazyDiagnosticDashboard = lazy(() => import('../modules/diagnostics/pages/DiagnosticDashboard'));
export const LazyCaseIntakePage = lazy(() => import('../modules/diagnostics/pages/CaseIntakePage'));
export const LazyCaseResultsPage = lazy(() => import('../modules/diagnostics/pages/CaseResultsPage'));
export const LazyResultsReviewPage = lazy(() => import('../modules/diagnostics/pages/ResultsReviewPage'));
export const LazyComponentDemo = lazy(() => import('../modules/diagnostics/pages/ComponentDemo'));

// New diagnostic pages
export const LazyAllDiagnosticCasesPage = lazy(() => import('../modules/diagnostics/pages/AllDiagnosticCasesPage'));
export const LazyDiagnosticAnalyticsPage = lazy(() => import('../modules/diagnostics/pages/DiagnosticAnalyticsPage'));
export const LazyDiagnosticReferralsPage = lazy(() => import('../modules/diagnostics/pages/DiagnosticReferralsPage'));
export const LazyFollowUpCasesPage = lazy(() => import('../modules/diagnostics/pages/FollowUpCasesPage'));

// Reports & Analytics
export const LazyReportsAnalyticsDashboard = lazy(() =>
  import('../modules/reports-analytics/components/ReportsAnalyticsDashboard')
);

// Admin components
export const LazyAdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
export const LazyFeatureFlagsPage = lazy(() => import('../pages/FeatureFlags'));
export const LazyFeatureManagement = lazy(() => import('../pages/FeatureManagement'));

// Heavy form components
export const LazyPatientForm = lazy(() => import('../components/PatientForm'));
export const LazyPatientManagement = lazy(() => import('../components/PatientManagement'));
export const LazyMedicationsManagementDashboard = lazy(() =>
  import('../components/medications/MedicationsManagementDashboard')
);
export const LazyPatientMedicationsPage = lazy(() =>
  import('../components/medications/PatientMedicationsPage')
);
export const LazyClinicalInterventionsLayout = lazy(() =>
  import('../components/ClinicalInterventionsLayout')
);

// Settings and subscription components
export const LazySubscriptions = lazy(() => import('../pages/Subscriptions'));
export const LazySubscriptionManagement = lazy(() => import('../pages/SubscriptionManagement'));
export const LazySubscriptionSuccess = lazy(() => import('../pages/SubscriptionSuccess'));
export const LazySettings = lazy(() => import('../pages/Settings'));
export const LazySettingsTheme = lazy(() => import('../pages/SettingsTheme'));
export const LazyHelp = lazy(() => import('../pages/Help'));
export const LazyMTRHelp = lazy(() => import('../pages/MTRHelp'));
export const LazyLicenseUpload = lazy(() => import('../components/license/LicenseUpload'));

// Workspace management components
export const LazyWorkspaceTeam = lazy(() => import('../pages/workspace/WorkspaceTeam'));

// Preloading functions for critical routes
export const preloadCriticalRoutes = () => {
  // Preload dashboard and patients as they are most commonly accessed
  import('../pages/ModernDashboardPage');
  import('../pages/Patients');
};

export const preloadSecondaryRoutes = () => {
  // Preload secondary routes that users might navigate to
  import('../pages/ClinicalNotes');
  import('../pages/Medications');
};

export const preloadModuleRoutes = () => {
  // Preload module routes
  import('../modules/diagnostics/pages/DiagnosticDashboard');
  import('../modules/reports-analytics/components/ReportsAnalyticsDashboard');
};