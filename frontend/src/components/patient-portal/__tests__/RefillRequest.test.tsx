import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RefillRequest from '../RefillRequest';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('RefillRequest', () => {
  const mockRefillRequest = {
    _id: 'refill123',
    medicationId: 'med456',
    medicationName: 'Metformin 500mg',
    status: 'pending' as const,
    requestedDate: '2024-03-10',
    estimatedCompletionDate: '2024-03-12',
    notes: 'Running low on medication',
    quantity: 90,
    refillsRemaining: 2,
    urgency: 'routine' as const,
    createdAt: '2024-03-10T10:30:00.000Z',
    updatedAt: '2024-03-10T10:30:00.000Z'
  };

  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders refill request with basic information', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('ROUTINE')).toBeInTheDocument();
    expect(screen.getByText('Running low on medication')).toBeInTheDocument();
  });

  it('displays request dates correctly', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Requested:/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Completion:/)).toBeInTheDocument();
  });

  it('shows quantity and refills remaining', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Quantity: 90')).toBeInTheDocument();
    expect(screen.getByText('Refills Remaining: 2')).toBeInTheDocument();
  });

  it('displays patient notes', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Your Notes:')).toBeInTheDocument();
    expect(screen.getByText('Running low on medication')).toBeInTheDocument();
  });

  it('shows pharmacist notes when available', () => {
    const requestWithPharmacistNotes = {
      ...mockRefillRequest,
      pharmacistNotes: 'Will be ready for pickup tomorrow'
    };

    renderWithTheme(
      <RefillRequest 
        request={requestWithPharmacistNotes}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Pharmacist Notes:')).toBeInTheDocument();
    expect(screen.getByText('Will be ready for pickup tomorrow')).toBeInTheDocument();
  });

  it('shows cancel button for pending requests', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
        canCancel={true}
      />
    );

    expect(screen.getByLabelText('Cancel Request')).toBeInTheDocument();
  });

  it('hides cancel button when canCancel is false', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
        canCancel={false}
      />
    );

    expect(screen.queryByLabelText('Cancel Request')).not.toBeInTheDocument();
  });

  it('opens cancel dialog when cancel button is clicked', async () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByLabelText('Cancel Request');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Cancel Refill Request')).toBeInTheDocument();
      expect(screen.getByLabelText('Reason for Cancellation')).toBeInTheDocument();
    });
  });

  it('submits cancel request with reason', async () => {
    mockOnCancel.mockResolvedValue(undefined);

    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    // Open cancel dialog
    const cancelButton = screen.getByLabelText('Cancel Request');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      const reasonInput = screen.getByLabelText('Reason for Cancellation');
      fireEvent.change(reasonInput, { target: { value: 'No longer needed' } });
    });

    const submitButton = screen.getByText('Cancel Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledWith('refill123', 'No longer needed');
    });
  });

  it('handles cancel request error', async () => {
    mockOnCancel.mockRejectedValue(new Error('Cannot cancel request'));

    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    // Open cancel dialog
    const cancelButton = screen.getByLabelText('Cancel Request');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      const reasonInput = screen.getByLabelText('Reason for Cancellation');
      fireEvent.change(reasonInput, { target: { value: 'Test reason' } });
    });

    const submitButton = screen.getByText('Cancel Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Cannot cancel request')).toBeInTheDocument();
    });
  });

  it('shows loading state during cancel', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
        isCancelLoading={true}
      />
    );

    const cancelButton = screen.getByLabelText('Cancel Request');
    expect(cancelButton).toBeDisabled();
  });

  it('displays different status messages', () => {
    const pendingRequest = { ...mockRefillRequest, status: 'pending' as const };
    const { rerender } = renderWithTheme(
      <RefillRequest request={pendingRequest} onCancel={mockOnCancel} />
    );
    expect(screen.getByText('Your refill request is pending review by the pharmacy team.')).toBeInTheDocument();

    const inProgressRequest = { ...mockRefillRequest, status: 'in_progress' as const };
    rerender(
      <ThemeProvider theme={theme}>
        <RefillRequest request={inProgressRequest} onCancel={mockOnCancel} />
      </ThemeProvider>
    );
    expect(screen.getByText('Your refill is being prepared. You\'ll be notified when it\'s ready for pickup.')).toBeInTheDocument();

    const completedRequest = { ...mockRefillRequest, status: 'completed' as const };
    rerender(
      <ThemeProvider theme={theme}>
        <RefillRequest request={completedRequest} onCancel={mockOnCancel} />
      </ThemeProvider>
    );
    expect(screen.getByText('Your refill is ready for pickup! Please contact the pharmacy for pickup instructions.')).toBeInTheDocument();

    const deniedRequest = { ...mockRefillRequest, status: 'denied' as const };
    rerender(
      <ThemeProvider theme={theme}>
        <RefillRequest request={deniedRequest} onCancel={mockOnCancel} />
      </ThemeProvider>
    );
    expect(screen.getByText('Your refill request was denied. Please contact the pharmacy for more information.')).toBeInTheDocument();

    const cancelledRequest = { ...mockRefillRequest, status: 'cancelled' as const };
    rerender(
      <ThemeProvider theme={theme}>
        <RefillRequest request={cancelledRequest} onCancel={mockOnCancel} />
      </ThemeProvider>
    );
    expect(screen.getByText('This refill request was cancelled.')).toBeInTheDocument();
  });

  it('shows pickup instructions button for completed requests', () => {
    const completedRequest = { ...mockRefillRequest, status: 'completed' as const };
    
    renderWithTheme(
      <RefillRequest 
        request={completedRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('View Pickup Instructions')).toBeInTheDocument();
  });

  it('does not show cancel button for completed requests', () => {
    const completedRequest = { ...mockRefillRequest, status: 'completed' as const };
    
    renderWithTheme(
      <RefillRequest 
        request={completedRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByLabelText('Cancel Request')).not.toBeInTheDocument();
  });

  it('shows urgent priority correctly', () => {
    const urgentRequest = { ...mockRefillRequest, urgency: 'urgent' as const };
    
    renderWithTheme(
      <RefillRequest 
        request={urgentRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('URGENT')).toBeInTheDocument();
  });

  it('handles request without optional fields', () => {
    const minimalRequest = {
      _id: 'refill123',
      medicationId: 'med456',
      medicationName: 'Test Medication',
      status: 'pending' as const,
      requestedDate: '2024-03-10',
      createdAt: '2024-03-10T10:30:00.000Z',
      updatedAt: '2024-03-10T10:30:00.000Z'
    };

    renderWithTheme(
      <RefillRequest 
        request={minimalRequest}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test Medication')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('validates cancel reason is required', async () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    // Open cancel dialog
    const cancelButton = screen.getByLabelText('Cancel Request');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      const submitButton = screen.getByText('Cancel Request');
      expect(submitButton).toBeDisabled(); // Should be disabled when no reason is provided
    });
  });

  it('formats dates correctly', () => {
    renderWithTheme(
      <RefillRequest 
        request={mockRefillRequest}
        onCancel={mockOnCancel}
      />
    );

    // The component should format dates in a readable format
    expect(screen.getByText(/Requested:/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated Completion:/)).toBeInTheDocument();
  });
});