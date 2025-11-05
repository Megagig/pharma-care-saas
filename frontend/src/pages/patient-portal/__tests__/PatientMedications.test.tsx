import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PatientMedications from '../PatientMedications';

// Mock the hooks
vi.mock('../../../hooks/usePatientAuth', () => ({
  usePatientAuth: vi.fn()
}));

vi.mock('../../../hooks/usePatientMedications', () => ({
  usePatientMedications: vi.fn()
}));

// Mock the components
vi.mock('../../../components/patient-portal/MedicationCard', () => ({
  default: ({ medication, onRefillRequest }: any) => (
    <div data-testid={`medication-card-${medication._id}`}>
      <h3>{medication.medicationName}</h3>
      <button onClick={() => onRefillRequest?.(medication._id, 'test notes')}>
        Request Refill
      </button>
    </div>
  )
}));

vi.mock('../../../components/patient-portal/AdherenceChart', () => ({
  default: ({ data }: any) => (
    <div data-testid="adherence-chart">
      <div>Overall Score: {data.overallScore}%</div>
    </div>
  )
}));

vi.mock('../../../components/patient-portal/RefillRequest', () => ({
  default: ({ request, onCancel }: any) => (
    <div data-testid={`refill-request-${request._id}`}>
      <h3>{request.medicationName}</h3>
      <span>Status: {request.status}</span>
      <button onClick={() => onCancel?.(request._id, 'test reason')}>
        Cancel Request
      </button>
    </div>
  )
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PatientMedications', () => {
  const mockUser = {
    _id: 'user123',
    patientId: 'patient123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  const mockCurrentMedications = [
    {
      _id: 'med1',
      medicationName: 'Metformin 500mg',
      dose: '500mg',
      frequency: 'Twice daily',
      route: 'Oral',
      purposeIndication: 'Type 2 Diabetes',
      status: 'active',
      phase: 'current',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      _id: 'med2',
      medicationName: 'Lisinopril 10mg',
      dose: '10mg',
      frequency: 'Once daily',
      route: 'Oral',
      purposeIndication: 'Hypertension',
      status: 'active',
      phase: 'current',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ];

  const mockMedicationHistory = [
    {
      _id: 'med3',
      medicationName: 'Amoxicillin 500mg',
      dose: '500mg',
      frequency: 'Three times daily',
      route: 'Oral',
      purposeIndication: 'Bacterial Infection',
      status: 'completed',
      phase: 'past',
      createdAt: '2023-12-01T00:00:00.000Z',
      updatedAt: '2023-12-07T00:00:00.000Z'
    }
  ];

  const mockAdherenceData = {
    overallScore: 87,
    trend: 'up' as const,
    medicationScores: [
      {
        medicationId: 'med1',
        medicationName: 'Metformin 500mg',
        score: 92,
        trend: 'up' as const,
        daysTracked: 30,
        missedDoses: 2,
        totalDoses: 60
      }
    ],
    weeklyScores: [
      { week: 'Week 1', score: 85 },
      { week: 'Week 2', score: 88 }
    ],
    insights: [
      {
        type: 'success' as const,
        message: 'Great job! Your adherence has improved.'
      }
    ]
  };

  const mockRefillRequests = [
    {
      _id: 'refill1',
      medicationId: 'med1',
      medicationName: 'Metformin 500mg',
      status: 'pending' as const,
      requestedDate: '2024-03-10',
      notes: 'Running low',
      createdAt: '2024-03-10T10:30:00.000Z',
      updatedAt: '2024-03-10T10:30:00.000Z'
    }
  ];

  const mockUsePatientAuth = {
    user: mockUser,
    isAuthenticated: true,
    loading: false,
    error: null
  };

  const mockUsePatientMedications = {
    currentMedications: mockCurrentMedications,
    medicationHistory: mockMedicationHistory,
    adherenceData: mockAdherenceData,
    refillRequests: mockRefillRequests,
    loading: false,
    error: null,
    refreshMedications: vi.fn(),
    requestRefill: vi.fn(),
    cancelRefillRequest: vi.fn(),
    refillLoading: false,
    cancelLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { usePatientAuth } = require('../../../hooks/usePatientAuth');
    const { usePatientMedications } = require('../../../hooks/usePatientMedications');
    
    usePatientAuth.mockReturnValue(mockUsePatientAuth);
    usePatientMedications.mockReturnValue(mockUsePatientMedications);
  });

  it('renders the medications page with all tabs', () => {
    renderWithTheme(<PatientMedications />);

    expect(screen.getByText('My Medications')).toBeInTheDocument();
    expect(screen.getByText('Manage your current medications, view history, track adherence, and request refills.')).toBeInTheDocument();
    
    // Check all tabs are present
    expect(screen.getByText('Current Medications (2)')).toBeInTheDocument();
    expect(screen.getByText('Medication History (1)')).toBeInTheDocument();
    expect(screen.getByText('Adherence Tracking')).toBeInTheDocument();
    expect(screen.getByText('Refill Requests (1)')).toBeInTheDocument();
  });

  it('displays current medications in the first tab', () => {
    renderWithTheme(<PatientMedications />);

    // Current medications tab should be active by default
    expect(screen.getByTestId('medication-card-med1')).toBeInTheDocument();
    expect(screen.getByTestId('medication-card-med2')).toBeInTheDocument();
    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();
  });

  it('displays medication history in timeline view when history tab is clicked', async () => {
    renderWithTheme(<PatientMedications />);

    // Click on medication history tab
    fireEvent.click(screen.getByText('Medication History (1)'));

    await waitFor(() => {
      expect(screen.getByTestId('medication-card-med3')).toBeInTheDocument();
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument();
    });
  });

  it('displays adherence chart when adherence tab is clicked', async () => {
    renderWithTheme(<PatientMedications />);

    // Click on adherence tracking tab
    fireEvent.click(screen.getByText('Adherence Tracking'));

    await waitFor(() => {
      expect(screen.getByTestId('adherence-chart')).toBeInTheDocument();
      expect(screen.getByText('Overall Score: 87%')).toBeInTheDocument();
    });
  });

  it('displays refill requests when refill requests tab is clicked', async () => {
    renderWithTheme(<PatientMedications />);

    // Click on refill requests tab
    fireEvent.click(screen.getByText('Refill Requests (1)'));

    await waitFor(() => {
      expect(screen.getByTestId('refill-request-refill1')).toBeInTheDocument();
      expect(screen.getByText('Status: pending')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    renderWithTheme(<PatientMedications />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockUsePatientMedications.refreshMedications).toHaveBeenCalled();
    });
  });

  it('handles refill request from medication card', async () => {
    renderWithTheme(<PatientMedications />);

    const refillButton = screen.getAllByText('Request Refill')[0];
    fireEvent.click(refillButton);

    await waitFor(() => {
      expect(mockUsePatientMedications.requestRefill).toHaveBeenCalledWith('med1', 'test notes');
    });
  });

  it('handles cancel refill request', async () => {
    renderWithTheme(<PatientMedications />);

    // Switch to refill requests tab
    fireEvent.click(screen.getByText('Refill Requests (1)'));

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel Request');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(mockUsePatientMedications.cancelRefillRequest).toHaveBeenCalledWith('refill1', 'test reason');
    });
  });

  it('shows loading state', () => {
    const { usePatientMedications } = require('../../../hooks/usePatientMedications');
    usePatientMedications.mockReturnValue({
      ...mockUsePatientMedications,
      loading: true
    });

    renderWithTheme(<PatientMedications />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const { usePatientMedications } = require('../../../hooks/usePatientMedications');
    usePatientMedications.mockReturnValue({
      ...mockUsePatientMedications,
      error: 'Failed to load medications'
    });

    renderWithTheme(<PatientMedications />);

    expect(screen.getByText('Failed to load medications')).toBeInTheDocument();
  });

  it('shows empty state for current medications', () => {
    const { usePatientMedications } = require('../../../hooks/usePatientMedications');
    usePatientMedications.mockReturnValue({
      ...mockUsePatientMedications,
      currentMedications: []
    });

    renderWithTheme(<PatientMedications />);

    expect(screen.getByText('No current medications found. Your pharmacist will add medications here when prescribed.')).toBeInTheDocument();
  });

  it('shows empty state for medication history', async () => {
    const { usePatientMedications } = require('../../../hooks/usePatientMedications');
    usePatientMedications.mockReturnValue({
      ...mockUsePatientMedications,
      medicationHistory: []
    });

    renderWithTheme(<PatientMedications />);

    // Click on medication history tab
    fireEvent.click(screen.getByText('Medication History (0)'));

    await waitFor(() => {
      expect(screen.getByText('No medication history available.')).toBeInTheDocument();
    });
  });

  it('shows empty state for adherence data', async () => {
    const { usePatientMedications } = require('../../../hooks/usePatientMedications');
    usePatientMedications.mockReturnValue({
      ...mockUsePatientMedications,
      adherenceData: null
    });

    renderWithTheme(<PatientMedications />);

    // Click on adherence tracking tab
    fireEvent.click(screen.getByText('Adherence Tracking'));

    await waitFor(() => {
      expect(screen.getByText('No adherence data available. Start tracking your medication adherence to see detailed insights and trends here.')).toBeInTheDocument();
    });
  });

  it('shows empty state for refill requests', async () => {
    const { usePatientMedications } = require('../../../hooks/usePatientMedications');
    usePatientMedications.mockReturnValue({
      ...mockUsePatientMedications,
      refillRequests: []
    });

    renderWithTheme(<PatientMedications />);

    // Click on refill requests tab
    fireEvent.click(screen.getByText('Refill Requests (0)'));

    await waitFor(() => {
      expect(screen.getByText('No refill requests found. You can request refills for your current medications from the "Current Medications" tab.')).toBeInTheDocument();
    });
  });

  it('shows authentication error when user is not logged in', () => {
    const { usePatientAuth } = require('../../../hooks/usePatientAuth');
    usePatientAuth.mockReturnValue({
      ...mockUsePatientAuth,
      user: null,
      isAuthenticated: false
    });

    renderWithTheme(<PatientMedications />);

    expect(screen.getByText('Please log in to view your medications.')).toBeInTheDocument();
  });

  it('displays floating action button on mobile', () => {
    renderWithTheme(<PatientMedications />);

    const fab = screen.getByLabelText('add medication reminder');
    expect(fab).toBeInTheDocument();
  });
});