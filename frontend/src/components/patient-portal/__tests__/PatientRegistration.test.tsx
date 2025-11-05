import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { PatientRegistration } from '../PatientRegistration';
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

describe('PatientRegistration', () => {
  const mockOnBack = vi.fn();
  const mockOnRegistrationSuccess = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form correctly', () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Test Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Join the patient portal to manage your healthcare')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Gender')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Try to submit empty form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const phoneInput = screen.getByLabelText('Phone Number');
    
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.blur(phoneInput);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid Nigerian phone number')).toBeInTheDocument();
    });
  });

  it('validates age from date of birth', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const dobInput = screen.getByLabelText('Date of Birth');
    
    // Set date that makes user too young (less than 13)
    const tooYoungDate = new Date();
    tooYoungDate.setFullYear(tooYoungDate.getFullYear() - 10);
    
    fireEvent.change(dobInput, { target: { value: tooYoungDate.toISOString().split('T')[0] } });
    fireEvent.blur(dobInput);

    await waitFor(() => {
      expect(screen.getByText('You must be between 13 and 120 years old')).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    
    // Test weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    // Test password without required characters
    fireEvent.change(passwordInput, { target: { value: 'weakpassword' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument();
    });
  });

  it('shows password strength indicator', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    
    // Test strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    
    await waitFor(() => {
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
    fireEvent.blur(confirmPasswordInput);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button', { name: '' }); // Eye icon buttons
    const passwordToggle = toggleButtons[0]; // First toggle is for password

    expect(passwordInput.type).toBe('password');

    fireEvent.click(passwordToggle);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(passwordToggle);
    expect(passwordInput.type).toBe('password');
  });

  it('requires terms and conditions agreement', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    // Fill form but don't check terms
    await fillValidForm();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('You must agree to the terms and conditions')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    await fillValidForm();
    
    // Check terms and conditions
    const termsCheckbox = screen.getByLabelText(/I agree to the/);
    fireEvent.click(termsCheckbox);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    });

    // Should call onRegistrationSuccess after mock delay
    await waitFor(() => {
      expect(mockOnRegistrationSuccess).toHaveBeenCalledWith({
        email: 'test@example.com',
        requiresApproval: expect.any(Boolean),
      });
    }, { timeout: 2000 });
  });

  it('calls onBack when back button is clicked', () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const backButton = screen.getByText('Back to search');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onSwitchToLogin when login link is clicked', () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const loginLink = screen.getByText('Sign in here');
    fireEvent.click(loginLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });

  it('formats phone number automatically', async () => {
    renderWithRouter(
      <PatientRegistration
        workspace={mockWorkspace}
        onBack={mockOnBack}
        onRegistrationSuccess={mockOnRegistrationSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const phoneInput = screen.getByLabelText('Phone Number') as HTMLInputElement;
    
    fireEvent.change(phoneInput, { target: { value: '8012345678' } });
    
    expect(phoneInput.value).toBe('08012345678');
  });

  // Helper function to fill form with valid data
  async function fillValidForm() {
    const firstNameInput = screen.getByLabelText('First Name');
    const lastNameInput = screen.getByLabelText('Last Name');
    const emailInput = screen.getByLabelText('Email Address');
    const phoneInput = screen.getByLabelText('Phone Number');
    const dobInput = screen.getByLabelText('Date of Birth');
    const genderSelect = screen.getByLabelText('Gender');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '08012345678' } });
    fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    fireEvent.change(genderSelect, { target: { value: 'male' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
  }
});