import { renderHook, act } from '@testing-library/react';
import { useDiagnosticForm } from '../useDiagnosticForm';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock toast
vi.mock('react-hot-toast');

describe('useDiagnosticForm', () => {
    const mockPatients = [
        { _id: 'patient-1', firstName: 'John', lastName: 'Doe' },
        { _id: 'patient-2', firstName: 'Jane', lastName: 'Smith' },
    ];

    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        expect(result.current.activeStep).toBe(0);
        expect(result.current.selectedPatient).toBe(null);
        expect(result.current.patientName).toBe('');
        expect(result.current.medicationFields).toEqual([]);
    });

    it('should handle patient selection', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        act(() => {
            result.current.setValue('patientId', 'patient-1');
        });

        expect(result.current.selectedPatient).toEqual(mockPatients[0]);
        expect(result.current.patientName).toBe('John Doe');
    });

    it('should handle URL patient parameter', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
                urlPatientId: 'patient-2',
            })
        );

        expect(result.current.selectedPatient).toEqual(mockPatients[1]);
        expect(result.current.patientName).toBe('Jane Smith');
    });

    it('should handle patient creation', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        const newPatient = { _id: 'patient-3', firstName: 'Bob', lastName: 'Johnson' };

        act(() => {
            result.current.handlePatientCreated(newPatient);
        });

        expect(result.current.selectedPatient).toEqual(newPatient);
        expect(result.current.patientName).toBe('Bob Johnson');
    });

    it('should handle step navigation', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        // Set patient to enable step navigation
        act(() => {
            result.current.setValue('patientId', 'patient-1');
            result.current.setValue('symptoms.subjective', 'Headache');
            result.current.setValue('symptoms.duration', '3 days');
        });

        // Move to next step
        act(() => {
            result.current.handleNext();
        });

        expect(result.current.activeStep).toBe(1);

        // Move to next step again
        act(() => {
            result.current.handleNext();
        });

        expect(result.current.activeStep).toBe(2);

        // Move back
        act(() => {
            result.current.handleBack();
        });

        expect(result.current.activeStep).toBe(1);
    });

    it('should validate step before proceeding', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        // Try to move to next step without selecting patient
        act(() => {
            result.current.handleNext();
        });

        expect(result.current.activeStep).toBe(0);

        // Set patient and try again
        act(() => {
            result.current.setValue('patientId', 'patient-1');
            result.current.handleNext();
        });

        expect(result.current.activeStep).toBe(1);

        // Try to move to next step without symptoms
        act(() => {
            result.current.handleNext();
        });

        expect(result.current.activeStep).toBe(1);

        // Set symptoms and try again
        act(() => {
            result.current.setValue('symptoms.subjective', 'Headache');
            result.current.setValue('symptoms.duration', '3 days');
            result.current.handleNext();
        });

        expect(result.current.activeStep).toBe(2);
    });

    it('should check step validity', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        // Check step 0 validity without patient
        expect(result.current.isStepValid()).toBe(false);

        // Set patient and check again
        act(() => {
            result.current.setValue('patientId', 'patient-1');
        });

        expect(result.current.isStepValid()).toBe(true);

        // Move to step 1 and check validity
        act(() => {
            result.current.handleNext();
        });

        expect(result.current.isStepValid()).toBe(false);

        // Set symptoms and check again
        act(() => {
            result.current.setValue('symptoms.subjective', 'Headache');
            result.current.setValue('symptoms.duration', '3 days');
        });

        expect(result.current.isStepValid()).toBe(true);
    });

    it('should handle medication management', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        // Add medication
        act(() => {
            result.current.addMedication();
        });

        expect(result.current.medicationFields).toHaveLength(1);

        // Remove medication
        act(() => {
            result.current.removeMedication(0);
        });

        expect(result.current.medicationFields).toHaveLength(0);
    });

    it('should handle allergy management', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        // Add allergy
        act(() => {
            result.current.addAllergy('Peanuts', []);
        });

        const allergies = result.current.watch('allergies');
        expect(allergies).toContain('Peanuts');

        // Remove allergy
        act(() => {
            result.current.removeAllergy(0, allergies);
        });

        const updatedAllergies = result.current.watch('allergies');
        expect(updatedAllergies).not.toContain('Peanuts');
    });

    it('should handle form submission', () => {
        const { result } = renderHook(() =>
            useDiagnosticForm({
                onSubmit: mockOnSubmit,
                patients: mockPatients,
            })
        );

        // Set form values
        act(() => {
            result.current.setValue('patientId', 'patient-1');
            result.current.setValue('symptoms.subjective', 'Headache');
            result.current.setValue('symptoms.duration', '3 days');
        });

        // Submit form
        act(() => {
            result.current.handleSubmitForm(result.current.watch());
        });

        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: 'patient-1',
                symptoms: expect.objectContaining({
                    subjective: 'Headache',
                    duration: '3 days',
                }),
            })
        );
    });
});