import React, { useEffect } from 'react';
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
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { initializeStores } from './stores';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { NotificationProvider } from './components/common/NotificationSystem';

import Landing from './pages/Landing';
import About from './pages/About';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import MultiStepRegister from './pages/MultiStepRegister';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
// Lazy load Clinical Notes components for better performance
// Lazy loading components is handled directly in routes
// import {
//   LazyClinicalNotesDashboard,
//   LazyClinicalNoteDetail,
//   LazyClinicalNoteForm,
//   preloadClinicalNotesComponents,
// } from './components/ClinicalNotesLazy';

// Keep original imports as fallback
import ClinicalNotes from './pages/ClinicalNotes';
import ClinicalNoteDetailPage from './pages/ClinicalNoteDetailPage';
import ClinicalNoteFormPage from './pages/ClinicalNoteFormPage';
import Medications from './pages/Medications';
import MedicationsManagementDashboard from './components/medications/MedicationsManagementDashboard';
import PatientMedicationsPage from './components/medications/PatientMedicationsPage';
import Subscriptions from './pages/Subscriptions';
import Reports from './pages/Reports';
import SaasSettings from './pages/SaasSettings';
import FeatureFlagsPage from './pages/FeatureFlags';
import Settings from './pages/Settings';
import Help from './pages/Help';
import MTRHelp from './pages/MTRHelp';

// Pharmacy Module Components
import MedicationTherapyReview from './pages/MedicationTherapyReview';
import ClinicalInterventionsLayout from './components/ClinicalInterventionsLayout';
import LabResultIntegration from './pages/LabResultIntegration';
import CommunicationHub from './pages/CommunicationHub';
import DrugInformationCenter from './pages/DrugInformationCenter';
import ClinicalDecisionSupport from './pages/ClinicalDecisionSupport';
import PharmacyReports from './pages/PharmacyReports';
import PharmacyUserManagement from './pages/PharmacyUserManagement';
import PharmacySettings from './pages/PharmacySettings';

// Test Components
import SidebarTest from './components/SidebarTest';

// Patient Management Components
import PatientForm from './components/PatientForm';
import PatientManagement from './components/PatientManagement';

// RBAC and Enhanced Components
import AdminDashboard from './components/admin/AdminDashboard';
import LicenseUpload from './components/license/LicenseUpload';
import SubscriptionManagementNew from './pages/SubscriptionManagement';
import SubscriptionSuccessNew from './pages/SubscriptionSuccess';
import TrialExpiryHandler from './components/TrialExpiryHandler';

function App(): JSX.Element {
  // Initialize Zustand stores on app startup
  useEffect(() => {
    initializeStores();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <SubscriptionProvider>
              <FeatureFlagProvider>
                <NotificationProvider>
                  <Router>
                    <Box
                      sx={{ minHeight: '100vh', bgcolor: 'background.default' }}
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
                        <Route path="/verify-email" element={<VerifyEmail />} />
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
                                <Dashboard />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/patients"
                          element={
                            <ProtectedRoute
                              requiredFeature="patient_management"
                              requiresActiveSubscription
                            >
                              <AppLayout>
                                <Patients />
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
                                <PatientForm />
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
                              <PatientManagement />
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
                                <PatientMedicationsPage />
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
                                <PatientForm />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/notes"
                          element={
                            <ProtectedRoute
                              requiredFeature="clinical_notes"
                              requiresLicense
                              requiresActiveSubscription
                            >
                              <AppLayout>
                                <ClinicalNotes />
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
                                <ClinicalNoteFormPage />
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
                                <ClinicalNoteDetailPage />
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
                                <ClinicalNoteFormPage />
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
                                <Medications />
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
                                <MedicationsManagementDashboard />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/subscriptions"
                          element={
                            <ProtectedRoute>
                              <AppLayout>
                                <Subscriptions />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/reports"
                          element={
                            <ProtectedRoute
                              requiredFeature="basic_reports"
                              requiresActiveSubscription
                            >
                              <AppLayout>
                                <Reports />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />

                        {/* Pharmacy Module Routes */}
                        <Route
                          path="/pharmacy/medication-therapy"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <MedicationTherapyReview />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/medication-therapy/new"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <MedicationTherapyReview />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/medication-therapy/patient/:patientId"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <MedicationTherapyReview />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/medication-therapy/:reviewId"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <MedicationTherapyReview />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/medication-therapy/:reviewId/step/:stepId"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <MedicationTherapyReview />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/medication-therapy/:reviewId/summary"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <MedicationTherapyReview />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/clinical-interventions/*"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <ClinicalInterventionsLayout />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/lab-integration"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <LabResultIntegration />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/communication"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <CommunicationHub />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/drug-information"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <DrugInformationCenter />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/decision-support"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <ClinicalDecisionSupport />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/reports"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <PharmacyReports />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/user-management"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <PharmacyUserManagement />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/pharmacy/settings"
                          element={
                            <ProtectedRoute requiresActiveSubscription>
                              <AppLayout>
                                <PharmacySettings />
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
                                <AdminDashboard />
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
                                <FeatureFlagsPage />
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
                                <LicenseUpload />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        {/* Enhanced Subscription Management */}
                        <Route
                          path="/subscription-management"
                          element={
                            <ProtectedRoute>
                              <AppLayout>
                                <SubscriptionManagementNew />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        {/* Subscription Success Page - No auth required for payment redirection */}
                        <Route
                          path="/subscription/success"
                          element={
                            <AppLayout>
                              <SubscriptionSuccessNew />
                            </AppLayout>
                          }
                        />
                        {/* Subscription Plans - This should not require active subscription */}
                        <Route
                          path="/dashboard/subscription/plans"
                          element={
                            <ProtectedRoute>
                              <AppLayout>
                                <SubscriptionManagementNew />
                              </AppLayout>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/subscription/plans"
                          element={
                            <ProtectedRoute>
                              <AppLayout>
                                <SubscriptionManagementNew />
                              </AppLayout>
                            </ProtectedRoute>
                          }
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
                                <Settings />
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
                                <Help />
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
                                <MTRHelp />
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
        sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <Navbar />
        <Toolbar /> {/* This creates space for the fixed AppBar */}
        <Box sx={{ display: 'flex', flex: 1 }}>
          <ErrorBoundary>
            <Sidebar />
          </ErrorBoundary>
          <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </TrialExpiryHandler>
  );
};

export default App;
