import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { PatientDashboard } from '../PatientDashboard';

// Mock Material-UI components that might cause issues in tests
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    LinearProgress: ({ value, ...props }: any) => (
      <div data-testid="linear-progress" data-value={value} {...props} />
    ),
  };
});

describe('PatientDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header correctly', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
    expect(screen.getByText("Here's an overview of your health information")).toBeInTheDocument();
  });

  it('displays quick stats cards', () => {
    render(<PatientDashboard />);

    expect(screen.getAllByText('Upcoming Appointments').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Active Medications').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Unread Messages').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending Refills').length).toBeGreaterThan(0);

    // Check stat values
    expect(screen.getByText('2')).toBeInTheDocument(); // Upcoming appointments
    expect(screen.getByText('4')).toBeInTheDocument(); // Active medications
    expect(screen.getByText('3')).toBeInTheDocument(); // Unread messages
    expect(screen.getByText('1')).toBeInTheDocument(); // Pending refills
  });

  it('displays upcoming appointments section', () => {
    render(<PatientDashboard />);

    expect(screen.getAllByText('Upcoming Appointments').length).toBeGreaterThan(0);
    expect(screen.getByText('Medication Review')).toBeInTheDocument();
    expect(screen.getByText('Health Consultation')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Dr. Michael Chen')).toBeInTheDocument();
  });

  it('displays current medications with adherence scores', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Current Medications')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();
    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Atorvastatin 20mg')).toBeInTheDocument();

    // Check adherence scores
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('shows refill warning for medications with no refills remaining', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Refill needed - contact your pharmacy')).toBeInTheDocument();
  });

  it('displays recent health records', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Recent Health Records')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Medication Review Visit')).toBeInTheDocument();
    expect(screen.getByText('New Prescription - Lisinopril')).toBeInTheDocument();
  });

  it('shows new badge for unreviewed health records', () => {
    render(<PatientDashboard />);

    const newBadges = screen.getAllByText('New');
    expect(newBadges.length).toBeGreaterThan(0);
  });

  it('displays quick action buttons', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Book Appointment')).toBeInTheDocument();
    expect(screen.getByText('Request Refill')).toBeInTheDocument();
    expect(screen.getByText('Message Pharmacist')).toBeInTheDocument();
    expect(screen.getByText('View Health Records')).toBeInTheDocument();
  });

  it('displays recent messages section', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Recent Messages')).toBeInTheDocument();
    expect(screen.getByText('Lab Results Available')).toBeInTheDocument();
    expect(screen.getByText('Prescription Ready')).toBeInTheDocument();
    expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
  });

  it('shows unread message indicators', () => {
    render(<PatientDashboard />);

    // Check for unread message indicators (blue dots)
    const unreadIndicators = screen.getAllByRole('generic').filter(
      element => element.className?.includes('bg-blue-600') && element.className?.includes('rounded-full')
    );
    expect(unreadIndicators.length).toBeGreaterThan(0);
  });

  it('displays recent vitals section', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Recent Vitals')).toBeInTheDocument();
    expect(screen.getByText(/blood pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/weight/i)).toBeInTheDocument();
    expect(screen.getByText(/glucose/i)).toBeInTheDocument();

    // Check vital values
    expect(screen.getByText('120/80 mmHg')).toBeInTheDocument();
    expect(screen.getByText('75.2 kg')).toBeInTheDocument();
    expect(screen.getByText('95 mg/dL')).toBeInTheDocument();
  });

  it('shows normal status badges for vitals', () => {
    render(<PatientDashboard />);

    const normalBadges = screen.getAllByText('normal');
    expect(normalBadges.length).toBe(3); // All three vitals are normal
  });

  it('has clickable View All buttons', () => {
    render(<PatientDashboard />);

    const viewAllButtons = screen.getAllByText('View All');
    expect(viewAllButtons.length).toBeGreaterThan(0);

    // Test that buttons are clickable
    viewAllButtons.forEach(button => {
      expect(button).toBeEnabled();
    });
  });

  it('has clickable quick action buttons', () => {
    render(<PatientDashboard />);

    const bookAppointmentButton = screen.getByText('Book Appointment');
    const requestRefillButton = screen.getByText('Request Refill');
    const messagePharmacistButton = screen.getByText('Message Pharmacist');
    const viewHealthRecordsButton = screen.getByText('View Health Records');

    expect(bookAppointmentButton).toBeEnabled();
    expect(requestRefillButton).toBeEnabled();
    expect(messagePharmacistButton).toBeEnabled();
    expect(viewHealthRecordsButton).toBeEnabled();
  });

  it('has clickable reschedule buttons for appointments', () => {
    render(<PatientDashboard />);

    const rescheduleButtons = screen.getAllByText('Reschedule');
    expect(rescheduleButtons.length).toBe(2); // Two appointments

    rescheduleButtons.forEach(button => {
      expect(button).toBeEnabled();
    });
  });

  it('has clickable Log Vitals button', () => {
    render(<PatientDashboard />);

    const logVitalsButton = screen.getByText('Log Vitals');
    expect(logVitalsButton).toBeEnabled();
  });

  it('displays appointment status badges correctly', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<PatientDashboard />);

    // Check that dates are displayed (exact format may vary based on locale)
    expect(screen.getByText(/1\/15\/2024|15\/1\/2024|2024-01-15/)).toBeInTheDocument();
    expect(screen.getByText(/1\/22\/2024|22\/1\/2024|2024-01-22/)).toBeInTheDocument();
  });

  it('displays medication frequencies correctly', () => {
    render(<PatientDashboard />);

    expect(screen.getAllByText('Once daily').length).toBeGreaterThan(0);
    expect(screen.getByText('Twice daily')).toBeInTheDocument();
  });

  it('shows adherence progress bars', () => {
    render(<PatientDashboard />);

    const progressBars = screen.getAllByTestId('linear-progress');
    expect(progressBars.length).toBe(3); // Three medications

    // Check that progress bars have correct values
    expect(progressBars[0]).toHaveAttribute('data-value', '95');
    expect(progressBars[1]).toHaveAttribute('data-value', '88');
    expect(progressBars[2]).toHaveAttribute('data-value', '92');
  });

  it('displays message timestamps', () => {
    render(<PatientDashboard />);

    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
  });
});