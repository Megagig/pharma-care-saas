import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MedicationCard from '../MedicationCard';
import { MedicationRecord } from '../../../types/patientManagement';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MedicationCard', () => {
  const mockMedication: MedicationRecord = {
    _id: 'med123',
    pharmacyId: 'pharmacy456',
    patientId: 'patient789',
    phase: 'current',
    medicationName: 'Metformin 500mg',
    purposeIndication: 'Type 2 Diabetes Management',
    dose: '500mg',
    frequency: 'Twice daily',
    route: 'Oral',
    duration: '3 months',
    startDate: '2024-01-15',
    endDate: '2024-04-15',
    adherence: 'good',
    status: 'active',
    notes: 'Take with meals to reduce stomach upset',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    createdBy: 'pharmacist123'
  };

  const mockOnRefillRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders medication card with basic information', () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('500mg')).toBeInTheDocument();
    expect(screen.getByText('Twice daily')).toBeInTheDocument();
    expect(screen.getByText('Oral')).toBeInTheDocument();
    expect(screen.getByText('Type 2 Diabetes Management')).toBeInTheDocument();
  });

  it('displays status and adherence chips', () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Adherence: good')).toBeInTheDocument();
  });

  it('shows days remaining calculation', () => {
    const futureMedication = {
      ...mockMedication,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };

    renderWithTheme(
      <MedicationCard 
        medication={futureMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.getByText(/days remaining/)).toBeInTheDocument();
  });

  it('expands to show detailed information when expand button is clicked', async () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    const expandButton = screen.getByLabelText('show more');
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Treatment Details')).toBeInTheDocument();
      expect(screen.getByText('Additional Information')).toBeInTheDocument();
    });
  });

  it('shows refill button for active current medications', () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
        showRefillButton={true}
      />
    );

    expect(screen.getByText('Request Refill')).toBeInTheDocument();
  });

  it('hides refill button when showRefillButton is false', () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
        showRefillButton={false}
      />
    );

    expect(screen.queryByText('Request Refill')).not.toBeInTheDocument();
  });

  it('opens refill dialog when refill button is clicked', async () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    const refillButton = screen.getByText('Request Refill');
    fireEvent.click(refillButton);

    await waitFor(() => {
      expect(screen.getByText('Request Refill for Metformin 500mg')).toBeInTheDocument();
      expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument();
    });
  });

  it('submits refill request with notes', async () => {
    mockOnRefillRequest.mockResolvedValue(undefined);

    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    // Open refill dialog
    const refillButton = screen.getByText('Request Refill');
    fireEvent.click(refillButton);

    await waitFor(() => {
      const notesInput = screen.getByLabelText('Notes (Optional)');
      fireEvent.change(notesInput, { target: { value: 'Running low on medication' } });
    });

    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnRefillRequest).toHaveBeenCalledWith('med123', 'Running low on medication');
    });
  });

  it('handles refill request error', async () => {
    mockOnRefillRequest.mockRejectedValue(new Error('Refill not eligible'));

    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    // Open refill dialog
    const refillButton = screen.getByText('Request Refill');
    fireEvent.click(refillButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit Request');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Refill not eligible')).toBeInTheDocument();
    });
  });

  it('shows loading state during refill request', () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
        isRefillLoading={true}
      />
    );

    const refillButton = screen.getByText('Request Refill');
    expect(refillButton).toBeDisabled();
  });

  it('displays medication notes when available', () => {
    renderWithTheme(
      <MedicationCard 
        medication={mockMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.getByText('Take with meals to reduce stomach upset')).toBeInTheDocument();
  });

  it('handles medication without end date', () => {
    const medicationWithoutEndDate = {
      ...mockMedication,
      endDate: undefined
    };

    renderWithTheme(
      <MedicationCard 
        medication={medicationWithoutEndDate}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    // Should not show days remaining
    expect(screen.queryByText(/days remaining/)).not.toBeInTheDocument();
  });

  it('shows expired medication status', () => {
    const expiredMedication = {
      ...mockMedication,
      status: 'expired' as const,
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    };

    renderWithTheme(
      <MedicationCard 
        medication={expiredMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.getByText('EXPIRED')).toBeInTheDocument();
    expect(screen.getByText(/Ended \d+ days ago/)).toBeInTheDocument();
  });

  it('does not show refill button for expired medications', () => {
    const expiredMedication = {
      ...mockMedication,
      status: 'expired' as const
    };

    renderWithTheme(
      <MedicationCard 
        medication={expiredMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.queryByText('Request Refill')).not.toBeInTheDocument();
  });

  it('does not show refill button for past phase medications', () => {
    const pastMedication = {
      ...mockMedication,
      phase: 'past' as const
    };

    renderWithTheme(
      <MedicationCard 
        medication={pastMedication}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.queryByText('Request Refill')).not.toBeInTheDocument();
  });

  it('displays phase chip when available', () => {
    const medicationWithPhase = {
      ...mockMedication,
      phase: 'current' as const
    };

    renderWithTheme(
      <MedicationCard 
        medication={medicationWithPhase}
        onRefillRequest={mockOnRefillRequest}
      />
    );

    expect(screen.getByText('CURRENT')).toBeInTheDocument();
  });
});