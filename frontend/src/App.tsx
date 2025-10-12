import React, { useEffect, useMemo } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Toolbar } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { createAppTheme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { initializeStores } from './stores';
import { queryClient, queryPrefetcher } from './lib/queryClient';
import { initializeQueryDevtools } from './lib/queryDevtools';
import { useTheme as useThemeStore } from './stores/themeStore';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { NotificationProvider } from './components/common/NotificationSystem';
import CustomThemeProvider from './components/providers/ThemeProvider';
import ServiceWorkerUpdateNotification from './components/ServiceWorkerUpdateNotification';

// Import theme styles
import './styles/theme.css';
import './styles/dark-mode-overrides.css';

// Lazy loading components and utilities
import {
  LazyModernDashboard,
  LazyPatients,
  LazyClinicalNotes,
  LazyClinicalNoteDetail,
  LazyClinicalNoteForm,
  LazyMedications,
  LazyMedicationTherapyReview,
  LazyCommunicationHub,
  LazyDrugInformationCenter,
  LazyClinicalDecisionSupport,
  LazyPharmacyReports,
  LazyPharmacyUserManagement,
  LazyDiagnosticDashboard,
  LazyCaseIntakePage,
  LazyCaseResultsPage,
  LazyResultsReviewPage,
  LazyComponentDemo,
  LazyAllDiagnosticCasesPage,
  LazyDiagnosticAnalyticsPage,
  LazyDiagnosticReferralsPage,
  LazyFollowUpCasesPage,
  LazyReportsAnalyticsDashboard,
  LazyAdminDashboard,
  LazyFeatureFlagsPage,
  LazyFeatureManagement,
  LazyPatientForm,
  LazyPatientManagement,
  LazyMedicationsManagementDashboard,
  LazyPatientMedicationsPage,
  LazyClinicalInterventionsLayout,
  LazySubscriptions,
  LazySubscriptionSuccess,
  LazySettings,
  LazySettingsTheme,
  LazyHelp,
  LazyMTRHelp,
  LazyLicenseUpload,
  LazyWorkspaceTeam,
} from './components/LazyComponents';

import { LazyWrapper, useRoutePreloading } from './components/LazyWrapper';
import { useRoutePrefetching, useBackgroundSync, useCacheWarming } from './hooks/useRoutePrefetching';
import { modulePreloader } from './utils/modulePreloader';
import { compressionUtils } from './utils/compressionUtils';
import { registerSW } from './utils/serviceWorkerRegistration';
import {
  DashboardSkeleton,
  PatientListSkeleton,
  ClinicalNotesSkeleton,
  FormSkeleton,
  ChartSkeleton,
  PageSkeleton,
} from './components/skeletons/LoadingSkeletons';

// Keep lightweight public pages as regular imports
import Landing from './pages/Landing';
import About from './pages/About';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import MultiStepRegister from './pages/MultiStepRegister';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Keep lightweight components as regular imports
import SaasSettings from './pages/SaasSettings';
import SidebarTest from './components/SidebarTest';
import TrialExpiryHandler from './components/TrialExpiryHandler';

// Component to handle hooks that require Router context
function AppHooks() {
  // Use route preloading and prefetching hooks inside Router context
  useRoutePreloading();
  useRoutePrefetching();
  useBackgroundSync();
  useCacheWarming();

  return null; // This component doesn't render anything
}

function App(): JSX.Element {
  // Initialize Zustand stores on app startup
  useEffect(() => {
    initializeStores();

    // Initialize query devtools in development
    initializeQueryDevtools(queryClient);

    // Initialize module preloader and compression utils
    modulePreloader.initialize();
    compressionUtils.preloadCriticalAssets().catch(console.error);

    // Register service worker for caching
    registerSW({
      onSuccess: () => console.log('Service worker registered successfully'),
      onUpdate: () => console.log('Service worker update available'),
      onOfflineReady: () => console.log('App ready to work offline'),
      onNeedRefresh: () => console.log('App needs refresh for updates'),
    });

    // Prefetch likely routes on app load
    queryPrefetcher.prefetchLikelyRoutes().catch(console.error);
  }, []);

  // Get current theme from store
  const { resolvedTheme } = useThemeStore();

  // Create dynamic theme based on current theme mode
  const dynamicTheme = useMemo(
    () => createAppTheme(resolvedTheme === 'dark' ? 'dark' : 'light'),
    [resolvedTheme]
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          <ThemeProvider theme={dynamicTheme}>
            <CssBaseline />
            <AuthProvider>
              <SubscriptionProvider>
                <FeatureFlagProvider>
                  <NotificationProvider>
                    <Router>
                      <AppHooks />
                      <Box
                        sx={{
                          minHeight: '100vh',
                          bgcolor: 'background.default',
                        }}
                      >
                        <Toaster
                          position="top-right"
                          toastOptions={{
                            duration: 4000,
                            style: {
                              background: '#363636',
                              color: '#fff',
                            },
                            success: {
                              duration: 3000,
                              iconTheme: {
                                primary: '#4ade80',
                                secondary: '#fff',
                              },
                            },
                            error: {
                              duration: 4000,
                              iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                              },
                            },
                          }}
                        />
                        {/* React Query DevTools - only in development */}
                        {import.meta.env.DEV && (
                          <ReactQueryDevtools
                            initialIsOpen={false}
                            // @ts-ignore - DevtoolsPosition type mismatch
                            position="bottom-right"
                          />
                        )}

                        {/* Service Worker Update Notifications */}
                        <ServiceWorkerUpdateNotification />

                        <Routes>
                          {/* Public Routes */}
                          <Route path="/" element={<Landing />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/pricing" element={<Pricing />} />
                          <Route path="/login" element={<Login />} />
                          <Route
                            path="/register"
                            element={<MultiStepRegister />}
                          />
                          <Route
                            path="/verify-email"
                            element={<VerifyEmail />}
                          />
                          <Route
                            path="/forgot-password"
                            element={<ForgotPassword />}
                          />
                          <Route
                            path="/reset-password"
                            element={<ResetPassword />}
                          />
                          {/* Protected Routes */}
                          <Route
                            path="/dashboard"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <LazyWrapper fallback={DashboardSkeleton}>
                                    <LazyModernDashboard />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Removed old dashboard route */}
                          <Route
                            path="/patients"
                            element={
                              <ProtectedRoute
                                requiredFeature="patient_management"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={PatientListSkeleton}>
                                    <LazyPatients />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/patients/new"
                            element={
                              <ProtectedRoute
                                requiredFeature="patient_management"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={FormSkeleton}>
                                    <LazyPatientForm />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/patients/:patientId"
                            element={
                              <ProtectedRoute
                                requiredFeature="patient_management"
                                requiresActiveSubscription
                              >
                                <LazyWrapper fallback={PageSkeleton}>
                                  <LazyPatientManagement />
                                </LazyWrapper>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/patients/:patientId/medications"
                            element={
                              <ProtectedRoute
                                requiredFeature="medication_management"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyPatientMedicationsPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/patients/:patientId/edit"
                            element={
                              <ProtectedRoute
                                requiredFeature="patient_management"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={FormSkeleton}>
                                    <LazyPatientForm />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/notes"
                            element={
                              <ProtectedRoute
                                requiredFeature="clinical_notes"
                                requiresLicense={true}
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={ClinicalNotesSkeleton}>
                                    <LazyClinicalNotes />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/notes/new"
                            element={
                              <ProtectedRoute
                                requiredFeature="clinical_notes"
                                requiresLicense
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={FormSkeleton}>
                                    <LazyClinicalNoteForm />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/notes/:id"
                            element={
                              <ProtectedRoute
                                requiredFeature="clinical_notes"
                                requiresLicense
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyClinicalNoteDetail />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/notes/:id/edit"
                            element={
                              <ProtectedRoute
                                requiredFeature="clinical_notes"
                                requiresLicense
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={FormSkeleton}>
                                    <LazyClinicalNoteForm />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/medications"
                            element={
                              <ProtectedRoute
                                requiredFeature="medication_management"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyMedications />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/medications/dashboard"
                            element={
                              <ProtectedRoute
                                requiredFeature="medication_management"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={DashboardSkeleton}>
                                    <LazyMedicationsManagementDashboard />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/subscriptions"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazySubscriptions />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />

                          {/* Reports & Analytics Module */}
                          <Route
                            path="/reports-analytics"
                            element={
                              <ProtectedRoute
                                requiredFeature="basic_reports"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={ChartSkeleton}>
                                    <LazyReportsAnalyticsDashboard
                                      workspaceId="current-workspace"
                                      userPermissions={[]}
                                    />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />

                          {/* Pharmacy Module Routes */}
                          <Route
                            path="/pharmacy/medication-therapy"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyMedicationTherapyReview />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/medication-therapy/new"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={FormSkeleton}>
                                    <LazyMedicationTherapyReview />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/medication-therapy/patient/:patientId"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyMedicationTherapyReview />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/medication-therapy/:reviewId"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyMedicationTherapyReview />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/medication-therapy/:reviewId/step/:stepId"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyMedicationTherapyReview />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/medication-therapy/:reviewId/summary"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyMedicationTherapyReview />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/clinical-interventions/*"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyClinicalInterventionsLayout />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={DashboardSkeleton}>
                                    <LazyDiagnosticDashboard />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/case/new"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={FormSkeleton}>
                                    <LazyCaseIntakePage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/case/:requestId"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyResultsReviewPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/case/:caseId/results"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyCaseResultsPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/demo"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyComponentDemo />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/cases/all"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyAllDiagnosticCasesPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/analytics"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyDiagnosticAnalyticsPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/referrals"
                            element={
                              <ProtectedRoute requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyDiagnosticReferralsPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/diagnostics/follow-up"
                            element={
                              <ProtectedRoute requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyFollowUpCasesPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/communication"
                            element={
                              <ProtectedRoute requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyCommunicationHub />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/drug-information"
                            element={
                              <ProtectedRoute requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyDrugInformationCenter />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/decision-support"
                            element={
                              <ProtectedRoute requiresLicense={true} requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyClinicalDecisionSupport />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/pharmacy/reports"
                            element={
                              <ProtectedRoute requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={ChartSkeleton}>
                                    <LazyPharmacyReports />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/user-management"
                            element={
                              <ProtectedRoute requiresActiveSubscription>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyPharmacyUserManagement />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />

                          {/* Workspace Team Management - Only for pharmacy_outlet users */}
                          <Route
                            path="/workspace/team"
                            element={
                              <ProtectedRoute 
                                requiredRole="pharmacy_outlet"
                                requiresActiveSubscription
                              >
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyWorkspaceTeam />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />

                          {/* Admin Routes */}
                          <Route
                            path="/admin"
                            element={
                              <ProtectedRoute requiredRole="super_admin">
                                <AppLayout>
                                  <LazyWrapper fallback={DashboardSkeleton}>
                                    <LazyAdminDashboard />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Feature Flags Route */}
                          <Route
                            path="/feature-flags"
                            element={
                              <ProtectedRoute requiredRole="super_admin">
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyFeatureFlagsPage />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Admin Feature Management Route */}
                          <Route
                            path="/admin/feature-management"
                            element={
                              <ProtectedRoute requiredRole="super_admin">
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyFeatureManagement />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* License Management */}
                          <Route
                            path="/license"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <LazyWrapper fallback={FormSkeleton}>
                                    <LazyLicenseUpload />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Redirect old subscription-management to subscriptions */}
                          <Route
                            path="/subscription-management"
                            element={<Navigate to="/subscriptions" replace />}
                          />
                          {/* Subscription Success Page - No auth required for payment redirection */}
                          <Route
                            path="/subscription/success"
                            element={
                              <AppLayout>
                                <LazyWrapper fallback={PageSkeleton}>
                                  <LazySubscriptionSuccess />
                                </LazyWrapper>
                              </AppLayout>
                            }
                          />
                          {/* Redirect old subscription plan routes to subscriptions */}
                          <Route
                            path="/dashboard/subscription/plans"
                            element={<Navigate to="/subscriptions" replace />}
                          />
                          <Route
                            path="/subscription/plans"
                            element={<Navigate to="/subscriptions" replace />}
                          />
                          {/* SaaS Settings - accessible to everyone */}
                          <Route
                            path="/saas-settings"
                            element={
                              <AppLayout>
                                <SaasSettings />
                              </AppLayout>
                            }
                          />
                          {/* Settings Page */}
                          <Route
                            path="/settings"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazySettings />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Theme Settings Page */}
                          <Route
                            path="/settings/theme"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazySettingsTheme />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* License Upload Page */}
                          <Route
                            path="/license"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyLicenseUpload />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Help & Support Page */}
                          <Route
                            path="/help"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyHelp />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* MTR Help & Documentation */}
                          <Route
                            path="/help/mtr"
                            element={
                              <ProtectedRoute requiredFeature="medication_therapy_review">
                                <AppLayout>
                                  <LazyWrapper fallback={PageSkeleton}>
                                    <LazyMTRHelp />
                                  </LazyWrapper>
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Sidebar Test Page - Development Only */}
                          <Route
                            path="/test/sidebar"
                            element={
                              <ProtectedRoute>
                                <AppLayout>
                                  <SidebarTest />
                                </AppLayout>
                              </ProtectedRoute>
                            }
                          />
                          {/* Redirect any unknown routes to dashboard */}
                          <Route
                            path="*"
                            element={<Navigate to="/dashboard" replace />}
                          />
                        </Routes>
                      </Box>
                    </Router>
                  </NotificationProvider>
                </FeatureFlagProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </ThemeProvider>
        </CustomThemeProvider>
        {/* React Query DevTools - only shows in development */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Layout wrapper for protected routes
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <TrialExpiryHandler>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          color: 'text.primary',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >
        <Navbar />
        <Toolbar /> {/* This creates space for the fixed AppBar */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            backgroundColor: 'background.default',
            transition: 'background-color 0.3s ease',
          }}
        >
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
          <Box
            component="main"
            sx={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: 'background.default',
              color: 'text.primary',
              minHeight: 'calc(100vh - 64px)', // Account for navbar height
              transition: 'background-color 0.3s ease, color 0.3s ease',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </TrialExpiryHandler>
  );
};

export default App;
