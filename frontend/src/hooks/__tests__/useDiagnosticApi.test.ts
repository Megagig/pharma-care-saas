import { renderHook, act } from '@testing-library/react';
import { useDiagnosticApi } from '../useDiagnosticApi';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock toast
vi.mock('react-hot-toast');

describe('useDiagnosticApi', () => {
    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const { result } = renderHook(() =>
            useDiagnosticApi({
                onSuccess: mockOnSuccess,
                onError: mockOnError,
            })
        );

        expect(result.current.isLoading).toBe(false);
    });

    it('should create diagnostic case', async () => {
        const { result } = renderHook(() =>
            useDiagnosticApi({
                onSuccess: mockOnSuccess,
                onError: mockOnError,
            })
        );

        const mockData = {
            patientId: 'patient-1',
            patientName: 'John Doe',
            symptoms: {
                subjective: 'Headache',
                duration: '3 days',
                severity: 'moderate' as const,
                onset: 'gradual' as const,
            },
            currentMedications: [],
            allergies: [],
            medicalConditions: {
                chronicIllnesses: '',
                pastSurgeries: '',
                familyHistory: '',
                lifestyleFactors: '',
            },
        };

        await act(async () => {
            await result.current.createDiagnosticCase(mockData);
        });

        expect(result.current.isLoading).toBe(false);
        expect(mockOnSuccess).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    patientId: 'patient-1',
                    patientName: 'John Doe',
                }),
                success: true,
                message: 'Case created successfully',
            })
        );
    });

    it('should get diagnostic case', async () => {
        const { result } = renderHook(() =>
            useDiagnosticApi({
                onSuccess: mockOnSuccess,
                onError: mockOnError,
            })
        );

        const caseId = 'case-123';

        await act(async () => {
            await result.current.getDiagnosticCase(caseId);
        });

        expect(result.current.isLoading).toBe(false);
        expect(mockOnSuccess).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    _id: caseId,
                    patientId: 'patient-123',
                    patientName: 'John Doe',
                }),
                success: true,
            })
        );
    });

    it('should update diagnostic case', async () => {
        const { result } = renderHook(() =>
            useDiagnosticApi({
                onSuccess: mockOnSuccess,
                onError: mockOnError,
            })
        );

        const caseId = 'case-123';
        const mockData = {
            symptoms: {
                subjective: 'Updated headache',
                duration: '5 days',
                severity: 'severe' as const,
                onset: 'sudden' as const,
            },
        };

        await act(async () => {
            await result.current.updateDiagnosticCase(caseId, mockData);
        });

        expect(result.current.isLoading).toBe(false);
        expect(mockOnSuccess).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    _id: caseId,
                    symptoms: expect.objectContaining({
                        subjective: 'Updated headache',
                        duration: '5 days',
                    }),
                }),
                success: true,
                message: 'Case updated successfully',
            })
        );
    });

    it('should delete diagnostic case', async () => {
        const { result } = renderHook(() =>
            useDiagnosticApi({
                onSuccess: mockOnSuccess,
                onError: mockOnError,
            })
        );

        const caseId = 'case-123';

        await act(async () => {
            await result.current.deleteDiagnosticCase(caseId);
        });

        expect(result.current.isLoading).toBe(false);
        expect(mockOnSuccess).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: 'Case deleted successfully',
            })
        );
    });

    it('should handle API errors', async () => {
        const { result } = renderHook(() =>
            useDiagnosticApi({
                onSuccess: mockOnSuccess,
                onError: mockOnError,
            })
        );

        const mockError = new Error('API Error');

        // Mock the API call to throw an error
        vi.spyOn(result.current, 'createDiagnosticCase').mockRejectedValueOnce(mockError);

        try {
            await act(async () => {
                await result.current.createDiagnosticCase({
                    patientId: 'patient-1',
                    patientName: 'John Doe',
                    symptoms: {
                        subjective: 'Headache',
                        duration: '3 days',
                        severity: 'moderate' as const,
                        onset: 'gradual' as const,
                    },
                    currentMedications: [],
                    allergies: [],
                    medicalConditions: {
                        chronicIllnesses: '',
                        pastSurgeries: '',
                        familyHistory: '',
                        lifestyleFactors: '',
                    },
                });
            });
        } catch (error) {
            expect(error).toBe(mockError);
            expect(mockOnError).toHaveBeenCalledWith(mockError);
        }
    });
});