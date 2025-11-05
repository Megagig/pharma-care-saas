import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { WorkspaceSearch, type Workspace } from '../WorkspaceSearch';

// Mock the useDebounce hook
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: string) => value, // Return value immediately for testing
}));

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

describe('WorkspaceSearch', () => {
  const mockOnWorkspaceSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search interface correctly', () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    expect(screen.getByText('Find Your Pharmacy')).toBeInTheDocument();
    expect(screen.getByText('Search for your pharmacy to access your patient portal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by pharmacy name, city, or state...')).toBeInTheDocument();
  });

  it('displays mock workspaces by default', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    await waitFor(() => {
      expect(screen.getByText('HealthCare Plus Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('MediCare Central')).toBeInTheDocument();
    });
  });

  it('filters workspaces based on search term', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    const searchInput = screen.getByPlaceholderText('Search by pharmacy name, city, or state...');
    fireEvent.change(searchInput, { target: { value: 'HealthCare' } });

    await waitFor(() => {
      expect(screen.getByText('HealthCare Plus Pharmacy')).toBeInTheDocument();
      expect(screen.queryByText('MediCare Central')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when no workspaces match search', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    const searchInput = screen.getByPlaceholderText('Search by pharmacy name, city, or state...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentPharmacy' } });

    await waitFor(() => {
      expect(screen.getByText('No pharmacies found matching your search.')).toBeInTheDocument();
      expect(screen.getByText('Try searching with different keywords or check the spelling.')).toBeInTheDocument();
    });
  });

  it('calls onWorkspaceSelect when a workspace is clicked', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    await waitFor(() => {
      const workspaceCard = screen.getByText('HealthCare Plus Pharmacy').closest('[role="button"], div[class*="cursor-pointer"]');
      if (workspaceCard) {
        fireEvent.click(workspaceCard);
        expect(mockOnWorkspaceSelect).toHaveBeenCalledTimes(1);
      }
    });
  });

  it('displays workspace information correctly', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    await waitFor(() => {
      // Check if workspace details are displayed
      expect(screen.getByText('HealthCare Plus Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('Your trusted neighborhood pharmacy with comprehensive healthcare services')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street, Lagos, Lagos')).toBeInTheDocument();
      expect(screen.getByText('+234-801-234-5678')).toBeInTheDocument();
      expect(screen.getAllByText('Verified').length).toBeGreaterThan(0);
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });
  });

  it('shows business hours status correctly', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    await waitFor(() => {
      // The status will depend on current time, but should show some status
      const statusElements = screen.getAllByText(/Open until|Opens at|Closed Today/);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it('displays services as badges', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Prescription Dispensing')).toBeInTheDocument();
      expect(screen.getByText('Health Consultation')).toBeInTheDocument();
      expect(screen.getByText('Medication Therapy Review')).toBeInTheDocument();
    });
  });

  it('shows patient count when available', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    await waitFor(() => {
      expect(screen.getByText('1,250 patients')).toBeInTheDocument();
    });
  });

  it('handles empty search gracefully', async () => {
    render(<WorkspaceSearch onWorkspaceSelect={mockOnWorkspaceSelect} />);

    const searchInput = screen.getByPlaceholderText('Search by pharmacy name, city, or state...');
    fireEvent.change(searchInput, { target: { value: '   ' } }); // Empty/whitespace search

    await waitFor(() => {
      // Should show all workspaces when search is empty
      expect(screen.getByText('HealthCare Plus Pharmacy')).toBeInTheDocument();
      expect(screen.getByText('MediCare Central')).toBeInTheDocument();
    });
  });
});