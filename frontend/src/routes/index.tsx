import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import VerifyEmail from '../pages/VerifyEmail';
import Dashboard from '../pages/Dashboard';
import Landing from '../pages/Landing';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Pricing from '../pages/Pricing';
import Patients from '../pages/Patients';
import Medications from '../pages/Medications';
import ClinicalNotes from '../pages/ClinicalNotes';
import Reports from '../pages/Reports';
import Subscriptions from '../pages/Subscriptions';
import FeatureFlags from '../pages/FeatureFlags';

// Admin routes
const AdminRoutes = React.lazy(() => import('./AdminRoutes.js'));

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute children={null} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/clinical-notes" element={<ClinicalNotes />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/subscriptions" element={<Subscriptions />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <React.Suspense fallback={<div>Loading...</div>}>
              <AdminRoutes />
            </React.Suspense>
          }
        />

        {/* Feature Flag Management */}
        <Route path="/admin/feature-flags" element={<FeatureFlags />} />
      </Route>

      {/* 404 - Not Found */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
