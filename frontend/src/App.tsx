import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { theme } from './theme';
import { AuthProvider } from './context/AuthContext';
import { FeatureFlagProvider } from './context/FeatureFlagContext';
import { initializeStores } from './stores';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Landing from './pages/Landing';
import About from './pages/About';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import ClinicalNotes from './pages/ClinicalNotes';
import Medications from './pages/Medications';
import Subscriptions from './pages/Subscriptions';
import Reports from './pages/Reports';
import SaasSettings from './pages/SaasSettings';
import FeatureFlagsPage from './pages/FeatureFlags';
import Settings from './pages/Settings';
import Help from './pages/Help';

// RBAC and Enhanced Components
import AdminDashboard from './components/admin/AdminDashboard';
import LicenseUpload from './components/license/LicenseUpload';
import SubscriptionManagement from './components/subscription/SubscriptionManagement';
import SubscriptionSuccess from './components/subscription/SubscriptionSuccess';

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
            <FeatureFlagProvider>
              <Router>
                <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute requiresActiveSubscription>
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
                            <SubscriptionManagement />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Subscription Success Page */}
                    <Route
                      path="/subscription/success"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <SubscriptionSuccess />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Subscription Plans - This should not require active subscription */}
                    <Route
                      path="/dashboard/subscription/plans"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <SubscriptionManagement />
                          </AppLayout>
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/subscription/plans"
                      element={
                        <ProtectedRoute>
                          <AppLayout>
                            <SubscriptionManagement />
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

                    {/* Redirect any unknown routes to dashboard */}
                    <Route
                      path="*"
                      element={<Navigate to="/dashboard" replace />}
                    />
                  </Routes>
                </Box>
              </Router>
            </FeatureFlagProvider>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>
        <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default App;
