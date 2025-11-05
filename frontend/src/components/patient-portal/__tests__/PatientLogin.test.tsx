import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PatientLogin } from '../PatientLogin';
import type { Workspace } from '../WorkspaceSearch';

const mockWorkspace: Workspace = {
  _id: '1',
  name: 'Test Pharmacy',
  description: 'A test pharmacy for testing',
  address: {
    street: '123 Test Street',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
  },
  contact: {
    phone: '+234-801-234-5678',
    email: 'test@pharmacy.com',
  },
  businessHours: {
    monday: { open: '08:00', close: '20:00', isOpen: true },
    tuesday: { open: '08:00', close: '20:00', isOpen: true },
    wednesday: { open: '08:00', close: '20:00', isOpen: true },
    thursday: { open: '08:00', close: '20:00', isOpen: true },
    friday: { open: '08:00', close: '20:00', isOpen: true },
    saturday: { open: '09:00', close: '18:00', isOpen: true },
    sunday: { open: '10:00', close: '16:00', isOpen: true },
  },
  services: ['Prescription Dispensing', 'Health Consultation'],
  rating: 4.8,
  totalPatients: 1250,
  isVerified: true,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('PatientLogin', () => {
  const mockOnBack = vi.fn();
  const mockOnLoginSuccess = vi.fn();
  const mockOnSwitchToRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Access your patient portal')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('displays workspace information', () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Contact Test Pharmacy at +234-801-234-5678')).toBeInTheDocument();
    expect(screen.getByText('test@pharmacy.com')).toBeInTheDocument();
  });

  it('validates email field', async () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Test empty email
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Test invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Submit button should be disabled with invalid form
    expect(submitButton).toBeDisabled();
  });

  it('validates password field', async () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Test empty password
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    // Test short password
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.blur(passwordInput);
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });

    // Submit button should be disabled with invalid form
    expect(submitButton).toBeDisabled();
  });

  it('toggles password visibility', () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('submits form with valid data', async () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill form with valid data
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument();
    });

    // Should call onLoginSuccess after mock delay
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith({
        id: 'patient_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        workspaceId: '1',
        workspaceName: 'Test Pharmacy',
        status: 'active',
        emailVerified: true,
      });
    }, { timeout: 2000 });
  });

  it('calls onBack when back button is clicked', () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const backButton = screen.getByText('Back to search');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onSwitchToRegister when register link is clicked', () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const registerLink = screen.getByText('Create one here');
    fireEvent.click(registerLink);

    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1);
  });

  it('displays forgot password link', () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const forgotPasswordLink = screen.getByText('Forgot your password?');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/patient-portal/forgot-password');
  });

  it('displays help information', () => {
    renderWithRouter(
      <PatientLogin
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onLoginSuccess={mockOnLoginSuccess}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    expect(screen.getByText('Need help?')).toBeInTheDocument();
    
    const phoneLink = screen.getByText('+234-801-234-5678');
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+234-801-234-5678');
    
    const emailLink = screen.getByText('test@pharmacy.com');
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:test@pharmacy.com');
  });
});