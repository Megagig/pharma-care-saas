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

// Patient Engagement & Follow-up
export const LazyPatientEngagement = lazy(() => import('../pages/PatientEngagement'));
export const LazyAppointmentManagement = lazy(() => import('../pages/AppointmentManagement'));
export const LazyFollowUpManagement = lazy(() => import('../pages/FollowUpManagement'));
export const LazyPatientPortal = lazy(() => import('../pages/PatientPortal'));
export const LazyPatientAuth = lazy(() => import('../pages/PatientAuth'));
export const LazyPublicPatientPortal = lazy(() => import('../pages/public/PatientPortalLanding'));
export const LazyWorkspaceSearchPage = lazy(() => import('../pages/public/WorkspaceSearchPage'));
export const LazyPatientWorkspaceDetailPage = lazy(() => import('../pages/public/PatientWorkspaceDetailPage'));

// Pharmacist Portal - Health Records
export const LazyPharmacistLabInterpretations = lazy(() => import('../pages/pharmacist-portal/PharmacistLabInterpretations'));

// Admin components
export const LazyAdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
export const LazyFeatureManagement = lazy(() => import('../pages/FeatureManagement'));
export const LazySuperAdminAuditTrail = lazy(() => import('../pages/SuperAdminAuditTrail'));
export const LazyRBACManagement = lazy(() => import('../pages/admin/RBACManagement'));
export const LazySecurityDashboard = lazy(() => import('../components/admin/SecurityDashboard'));
export const LazyPricingManagement = lazy(() => import('../components/admin/PricingManagement'));
export const LazyUsageMonitoring = lazy(() => import('../components/admin/UsageMonitoring'));
export const LazyLocationManagement = lazy(() => import('../components/admin/LocationManagement'));
export const LazyQueueMonitoringDashboard = lazy(() => import('../components/admin/QueueMonitoringDashboard'));
export const LazyWebhookManagement = lazy(() => import('../components/admin/WebhookManagement'));
export const LazyMigrationDashboard = lazy(() => import('../components/admin/MigrationDashboard'));
export const LazyAppointmentAnalyticsDashboard = lazy(() => import('../components/appointments/AppointmentAnalyticsDashboard'));

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
export const LazyNotifications = lazy(() => import('../pages/Notifications'));
export const LazyHelp = lazy(() => import('../pages/Help'));
export const LazyMTRHelp = lazy(() => import('../pages/MTRHelp'));
export const LazyLicenseUpload = lazy(() => import('../components/license/LicenseUpload'));

// Additional unrouted pages
export const LazyLabResultIntegration = lazy(() => import('../pages/LabResultIntegration'));
export const LazyLabIntegrationCaseDetail = lazy(() => import('../pages/LabIntegrationCaseDetail'));
export const LazyLabIntegrationNewCase = lazy(() => import('../pages/LabIntegrationNewCase'));
export const LazyLabIntegrationReviewQueue = lazy(() => import('../pages/LabIntegrationReviewQueue'));

// Laboratory Findings Module
export const LazyLaboratoryDashboard = lazy(() => import('../pages/LaboratoryDashboard'));
export const LazyLabResultForm = lazy(() => import('../pages/LabResultForm'));
export const LazyLabResultDetail = lazy(() => import('../pages/LabResultDetail'));
export const LazyLabUploadPage = lazy(() => import('../pages/LabUploadPage'));
export const LazyLabTemplatesPage = lazy(() => import('../pages/LabTemplatesPage'));
export const LazyLabTemplateForm = lazy(() => import('../pages/LabTemplateForm'));
export const LazyLabTrendsPage = lazy(() => import('../pages/LabTrendsPage'));
export const LazyPaymentSimulation = lazy(() => import('../pages/PaymentSimulation'));
export const LazyPricingPlanManagement = lazy(() => import('../pages/PricingPlanManagement'));
export const LazyReports = lazy(() => import('../pages/Reports'));
export const LazyPatientLinkingAdmin = lazy(() => import('../pages/admin/PatientLinkingAdmin'));
export const LazyPatientLinkingManagement = lazy(() => import('../pages/admin/PatientLinkingManagement'));
export const LazySuperAdminHealthRecordsDashboard = lazy(() => import('../pages/super-admin/SuperAdminHealthRecordsDashboard'));
export const LazyMedicationAnalytics = lazy(() => import('../pages/MedicationAnalytics'));

// Phase 3: Admin Features
export const LazySaasAdminDashboard = lazy(() => import('../pages/admin/SaasAdminDashboard'));
export const LazyDeploymentMonitoringDashboard = lazy(() => import('../components/admin/DeploymentMonitoringDashboard'));
export const LazySystemMonitoringDashboard = lazy(() => import('../components/admin/SystemMonitoringDashboard'));
export const LazyApiManagementDashboard = lazy(() => import('../components/admin/ApiManagementDashboard'));

// Workspace management components
export const LazyWorkspaceTeam = lazy(() => import('../pages/workspace/WorkspaceTeam'));

// Blog components
export const LazyBlogPage = lazy(() => import('../pages/public/BlogPage'));
export const LazyBlogPostDetails = lazy(() => import('../components/blog/BlogPostDetails'));
export const LazyBlogManagement = lazy(() => import('../pages/super-admin/BlogManagement'));
export const LazyBlogPostEditor = lazy(() => import('../pages/super-admin/BlogPostEditor'));

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