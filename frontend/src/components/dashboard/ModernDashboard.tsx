import React from 'react';
import DashboardCard from './DashboardCard';
import QuickActionCard from './QuickActionCard';
import DashboardChart from './DashboardChart';
import { useDashboardData } from '../../hooks/useDashboardData';
import '../../styles/dashboard.css';

export const ModernDashboard: React.FC = () => {
  const {
    stats,
    patientsByMonth,
    medicationsByStatus,
    clinicalNotesByType,
    mtrsByStatus,
    patientAgeDistribution,
    monthlyActivity,
    loading,
    error,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      <div className="dashboard-header">
        <h1>Healthcare Dashboard</h1>
        <p>Welcome back! Here's your healthcare system overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <DashboardCard
          title="Total Patients"
          value={stats.totalPatients}
          icon="👥"
          color="#2196f3"
          navigateTo="/patients"
          subtitle="Active patients in system"
        />
        <DashboardCard
          title="Clinical Notes"
          value={stats.totalClinicalNotes}
          icon="📋"
          color="#4caf50"
          navigateTo="/clinical-notes"
          subtitle="Total notes recorded"
        />
        <DashboardCard
          title="Medications"
          value={stats.totalMedications}
          icon="💊"
          color="#ff9800"
          navigateTo="/medications"
          subtitle="Medication records"
        />
        <DashboardCard
          title="MTR Sessions"
          value={stats.totalMTRs}
          icon="🔍"
          color="#9c27b0"
          navigateTo="/mtr"
          subtitle="Medication therapy reviews"
        />
        <DashboardCard
          title="Diagnostics"
          value={stats.totalDiagnostics}
          icon="🧪"
          color="#f44336"
          navigateTo="/diagnostics"
          subtitle="Diagnostic tests"
        />
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        <DashboardChart
          title="Patients by Month"
          data={patientsByMonth}
          type="line"
          colors={['#2196f3']}
        />

        <DashboardChart
          title="Medications by Status"
          data={medicationsByStatus}
          type="pie"
          colors={['#4caf50', '#2196f3', '#ff9800']}
        />

        <DashboardChart
          title="Clinical Notes by Type"
          data={clinicalNotesByType}
          type="bar"
          colors={['#9c27b0']}
        />

        <DashboardChart
          title="MTR Sessions by Status"
          data={mtrsByStatus}
          type="pie"
          colors={['#ff9800', '#4caf50', '#9e9e9e']}
        />

        <DashboardChart
          title="Patient Age Distribution"
          data={patientAgeDistribution}
          type="bar"
          colors={['#00bcd4']}
        />

        <DashboardChart
          title="Monthly Activity Trend"
          data={monthlyActivity}
          type="line"
          colors={['#8bc34a']}
        />
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <QuickActionCard
            title="Add New Patient"
            description="Register a new patient in the system"
            icon="👤"
            color="#2196f3"
            navigateTo="/patients/new"
            buttonText="Add Patient"
          />
          <QuickActionCard
            title="Create Clinical Note"
            description="Document a new clinical observation"
            icon="📝"
            color="#4caf50"
            navigateTo="/clinical-notes/new"
            buttonText="Create Note"
          />
          <QuickActionCard
            title="Schedule MTR"
            description="Schedule a medication therapy review"
            icon="📅"
            color="#9c27b0"
            navigateTo="/mtr/new"
            buttonText="Schedule"
          />
          <QuickActionCard
            title="View Reports"
            description="Access detailed analytics and reports"
            icon="📊"
            color="#ff9800"
            navigateTo="/reports"
            buttonText="View Reports"
          />
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
