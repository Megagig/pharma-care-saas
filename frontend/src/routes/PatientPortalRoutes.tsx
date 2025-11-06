import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PatientPortalRoute from '../components/patient-portal/PatientPortalRoute';
import { LazyWrapper } from '../components/LazyWrapper';
import { PageSkeleton } from '../components/skeletons/LoadingSkeletons';

// Lazy load patient portal pages
const LazyPatientDashboard = lazy(() => import('../pages/patient-portal/PatientDashboard'));
const LazyPatientProfile = lazy(() => import('../pages/patient-portal/PatientProfile'));
const LazyPatientMedications = lazy(() => import('../pages/patient-portal/PatientMedications'));
const LazyPatientHealthRecords = lazy(() => import('../pages/patient-portal/PatientHealthRecords'));
const LazyPatientMessages = lazy(() => import('../pages/patient-portal/PatientMessages'));
const LazyPatientAppointments = lazy(() => import('../pages/patient-portal/PatientAppointments'));
const LazyPatientBilling = lazy(() => import('../pages/patient-portal/PatientBilling'));

// Lazy load public pages
const LazyPublicPatientPortal = lazy(() => import('../pages/public/PatientPortalLanding'));
const LazyPatientAuth = lazy(() => import('../pages/PatientAuth'));
const LazyBlogPage = lazy(() => import('../pages/public/BlogPage'));
const LazyBlogPostDetails = lazy(() => import('../components/blog/BlogPostDetails'));

// Lazy load admin pages
const LazyBlogManagement = lazy(() => import('../pages/super-admin/BlogManagement'));
const LazyBlogPostEditor = lazy(() => import('../pages/super-admin/BlogPostEditor'));
const LazyPatientPortalAdmin = lazy(() => import('../pages/workspace-admin/PatientPortalAdmin'));

/**
 * Patient Portal Routes Configuration
 * Handles all patient portal related routing including public, authenticated, and admin routes
 */
const PatientPortalRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes - No authentication required */}
      
      {/* Public Landing Page */}
      <Route
        path="/patient-access"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyPublicPatientPortal />
          </LazyWrapper>
        }
      />

      {/* Blog Routes - Public */}
      <Route
        path="/blog"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyBlogPage />
          </LazyWrapper>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyBlogPostDetails />
          </LazyWrapper>
        }
      />

      {/* Patient Authentication */}
      <Route
        path="/patient-auth/:workspaceId"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyPatientAuth />
          </LazyWrapper>
        }
      />

      {/* Protected Patient Portal Routes */}
      
      {/* Dashboard - Default route for authenticated patients */}
      <Route
        path="/patient-portal/:workspaceId"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientDashboard />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Patient Profile Management */}
      <Route
        path="/patient-portal/:workspaceId/profile"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientProfile />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Medication Management */}
      <Route
        path="/patient-portal/:workspaceId/medications"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientMedications />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Health Records & Vitals */}
      <Route
        path="/patient-portal/:workspaceId/health-records"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientHealthRecords />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Secure Messaging */}
      <Route
        path="/patient-portal/:workspaceId/messages"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientMessages />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Appointment Management */}
      <Route
        path="/patient-portal/:workspaceId/appointments"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientAppointments />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Billing & Payments */}
      <Route
        path="/patient-portal/:workspaceId/billing"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientBilling />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Educational Resources */}
      <Route
        path="/patient-portal/:workspaceId/education"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyBlogPage />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Settings & Preferences */}
      <Route
        path="/patient-portal/:workspaceId/settings"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientProfile />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Notifications */}
      <Route
        path="/patient-portal/:workspaceId/notifications"
        element={
          <PatientPortalRoute requiresAuth={true}>
            <LazyWrapper fallback={PageSkeleton}>
              <LazyPatientDashboard />
            </LazyWrapper>
          </PatientPortalRoute>
        }
      />

      {/* Admin Routes - Super Admin Blog Management */}
      <Route
        path="/super-admin/blog"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyBlogManagement />
          </LazyWrapper>
        }
      />
      <Route
        path="/super-admin/blog/new"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyBlogPostEditor />
          </LazyWrapper>
        }
      />
      <Route
        path="/super-admin/blog/:postId/edit"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyBlogPostEditor />
          </LazyWrapper>
        }
      />

      {/* Workspace Admin Routes - Patient Portal Management */}
      <Route
        path="/workspace-admin/patient-portal"
        element={
          <LazyWrapper fallback={PageSkeleton}>
            <LazyPatientPortalAdmin />
          </LazyWrapper>
        }
      />

      {/* Redirect legacy routes */}
      <Route
        path="/patient-portal-public"
        element={<Navigate to="/patient-access" replace />}
      />

      {/* Catch-all redirect for patient portal routes without workspace */}
      <Route
        path="/patient-portal"
        element={<Navigate to="/patient-access" replace />}
      />
    </Routes>
  );
};

export default PatientPortalRoutes;