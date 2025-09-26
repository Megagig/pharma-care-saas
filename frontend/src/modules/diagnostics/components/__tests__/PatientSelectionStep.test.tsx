import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import PatientSelectionStep from '../PatientSelectionStep';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
    useForm: vi.fn(),
    Controller: ({ render }: any) => render({ field: { onChange: vi.fn(), value: '' } }),
    useFieldArray: () => ({
        fields: [],
        append: vi.fn(),
        remove: vi.fn(),
    }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    PlusIcon: () => <div>PlusIcon</div>,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}));

vi.mock('@/components/ui/select', () => ({
    Select: ({ children, onValueChange, value, disabled }: any) => (
        <div data-testid="select" data-value={value} data-disabled={disabled}>
            {children}
        </div>
    ),
    SelectTrigger: ({ children }: any) => (
        <div data-testid="select-trigger">{children}</div>
    ),
    SelectValue: ({ placeholder }: any) => (
        <div data-testid="select-value">{placeholder}</div>
    ),
    SelectContent: ({ children }: any) => (
        <div data-testid="select-content">{children}</div>
    ),
    SelectItem: ({ children, value }: any) => (
        <div data-testid="select-item" data-value={value}>
            {children}
        </div>
    ),
}));

describe('PatientSelectionStep', () => {
    const mockPatients = [
        { _id: 'patient-1', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01' },
        { _id: 'patient-2', firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1985-05-15' },
    ];

    const mockOnRefreshPatients = vi.fn();
    const mockOnViewPatientsClick = vi.fn();
    const mockOnCreatePatientClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render patient selection step', () => {
        render(
            <PatientSelectionStep
                patients={mockPatients}
                loading={false}
                onRefreshPatients={mockOnRefreshPatients}
                onViewPatientsClick={mockOnViewPatientsClick}
                onCreatePatientClick={mockOnCreatePatientClick}
            />
        );

        expect(screen.getByText('Select Patient')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
        expect(screen.getByText('Select from Patients')).toBeInTheDocument();
        expect(screen.getByText('New Patient')).toBeInTheDocument();
    });

    it('should show loading state', () => {
        render(
            <PatientSelectionStep
                patients={mockPatients}
                loading={true}
                onRefreshPatients={mockOnRefreshPatients}
                onViewPatientsClick={mockOnViewPatientsClick}
                onCreatePatientClick={mockOnCreatePatientClick}
            />
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show no patients message', () => {
        render(
            <PatientSelectionStep
                patients={[]}
                loading={false}
                onRefreshPatients={mockOnRefreshPatients}
                onViewPatientsClick={mockOnViewPatientsClick}
                onCreatePatientClick={mockOnCreatePatientClick}
            />
        );

        expect(screen.getByText('No patients found. Please add patients first.')).toBeInTheDocument();
    });

    it('should call refresh patients when refresh button is clicked', () => {
        render(
            <PatientSelectionStep
                patients={mockPatients}
                loading={false}
                onRefreshPatients={mockOnRefreshPatients}
                onViewPatientsClick={mockOnViewPatientsClick}
                onCreatePatientClick={mockOnCreatePatientClick}
            />
        );

        fireEvent.click(screen.getByText('Refresh'));
        expect(mockOnRefreshPatients).toHaveBeenCalled();
    });

    it('should call view patients when select from patients button is clicked', () => {
        render(
            <PatientSelectionStep
                patients={mockPatients}
                loading={false}
                onRefreshPatients={mockOnRefreshPatients}
                onViewPatientsClick={mockOnViewPatientsClick}
                onCreatePatientClick={mockOnCreatePatientClick}
            />
        );

        fireEvent.click(screen.getByText('Select from Patients'));
        expect(mockOnViewPatientsClick).toHaveBeenCalled();
    });

    it('should call create patient when new patient button is clicked', () => {
        render(
            <PatientSelectionStep
                patients={mockPatients}
                loading={false}
                onRefreshPatients={mockOnRefreshPatients}
                onViewPatientsClick={mockOnViewPatientsClick}
                onCreatePatientClick={mockOnCreatePatientClick}
            />
        );

        fireEvent.click(screen.getByText('New Patient'));
        expect(mockOnCreatePatientClick).toHaveBeenCalled();
    });
});