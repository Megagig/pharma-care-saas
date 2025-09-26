import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';
import { toast } from 'react-hot-toast';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock toast
vi.mock('react-hot-toast');
const mockedToast = toast as any;

describe('useErrorHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle API errors with message', () => {
        const { result } = renderHook(() => useErrorHandler());
        const error = {
            response: {
                data: {
                    message: 'Test error message',
                },
            },
        };

        act(() => {
            const errorMessage = result.current.handleApiError(error);
            expect(errorMessage).toBe('Test error message');
            expect(mockedToast.error).toHaveBeenCalledWith('Test error message');
        });
    });

    it('should handle API errors with fallback message', () => {
        const { result } = renderHook(() => useErrorHandler());
        const error = {
            message: 'Direct error message',
        };

        act(() => {
            const errorMessage = result.current.handleApiError(error, 'Fallback message');
            expect(errorMessage).toBe('Direct error message');
            expect(mockedToast.error).toHaveBeenCalledWith('Direct error message');
        });
    });

    it('should handle API errors without message', () => {
        const { result } = renderHook(() => useErrorHandler());
        const error = {};

        act(() => {
            const errorMessage = result.current.handleApiError(error, 'Fallback message');
            expect(errorMessage).toBe('Fallback message');
            expect(mockedToast.error).toHaveBeenCalledWith('Fallback message');
        });
    });

    it('should handle form errors', () => {
        const { result } = renderHook(() => useErrorHandler());
        const errors = {
            patientId: {
                message: 'Patient is required',
            },
        };

        act(() => {
            const errorMessage = result.current.handleFormError(errors);
            expect(errorMessage).toBe('Patient is required');
            expect(mockedToast.error).toHaveBeenCalledWith('Patient is required');
        });
    });

    it('should handle form errors with specific field names', () => {
        const { result } = renderHook(() => useErrorHandler());
        const errors = {
            patientId: {
                message: 'Patient is required',
            },
            symptoms: {
                message: 'Symptoms are required',
            },
        };

        act(() => {
            const errorMessage = result.current.handleFormError(errors, ['symptoms']);
            expect(errorMessage).toBe('Symptoms are required');
            expect(mockedToast.error).toHaveBeenCalledWith('Symptoms are required');
        });
    });

    it('should handle validation errors', () => {
        const { result } = renderHook(() => useErrorHandler());
        const error = {
            response: {
                data: {
                    errors: {
                        patientId: ['Patient is required'],
                        symptoms: ['Symptoms are required'],
                    },
                },
            },
        };

        act(() => {
            const resultError = result.current.handleValidationError(error);
            expect(resultError).toEqual({
                general: 'Patient is required',
                fields: {
                    patientId: ['Patient is required'],
                    symptoms: ['Symptoms are required'],
                },
            });
            expect(mockedToast.error).toHaveBeenCalledWith('Patient is required');
        });
    });

    it('should handle network errors', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            const errorMessage = result.current.handleNetworkError();
            expect(errorMessage).toBe('Network error. Please check your connection and try again.');
            expect(mockedToast.error).toHaveBeenCalledWith('Network error. Please check your connection and try again.');
        });
    });

    it('should handle auth errors', () => {
        const { result } = renderHook(() => useErrorHandler());

        // Mock window.location.href
        const originalLocation = window.location;
        delete (window as any).location;
        window.location = { ...originalLocation, href: '' } as any;

        act(() => {
            const errorMessage = result.current.handleAuthError();
            expect(errorMessage).toBe('Authentication error. Please log in again.');
            expect(mockedToast.error).toHaveBeenCalledWith('Authentication error. Please log in again.');
            expect(window.location.href).toBe('/login');
        });

        // Restore window.location
        (window as any).location = originalLocation;
    });

    it('should handle permission errors', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            const errorMessage = result.current.handlePermissionError();
            expect(errorMessage).toBe('You do not have permission to perform this action.');
            expect(mockedToast.error).toHaveBeenCalledWith('You do not have permission to perform this action.');
        });
    });

    it('should handle server errors', () => {
        const { result } = renderHook(() => useErrorHandler());

        act(() => {
            const errorMessage = result.current.handleServerError();
            expect(errorMessage).toBe('Server error. Please try again later.');
            expect(mockedToast.error).toHaveBeenCalledWith('Server error. Please try again later.');
        });
    });

    it('should handle errors by status code', () => {
        const { result } = renderHook(() => useErrorHandler());

        // Test 400 error
        act(() => {
            const error400 = {
                response: {
                    status: 400,
                    data: {
                        errors: {
                            field: ['Field is invalid'],
                        },
                    },
                },
            };
            result.current.handleErrorByStatus(error400);
            expect(mockedToast.error).toHaveBeenCalledWith('Field is invalid');
        });

        // Test 401 error
        mockedToast.error.mockClear();
        const originalLocation = window.location;
        delete (window as any).location;
        window.location = { ...originalLocation, href: '' } as any;

        act(() => {
            const error401 = {
                response: {
                    status: 401,
                },
            };
            result.current.handleErrorByStatus(error401);
            expect(mockedToast.error).toHaveBeenCalledWith('Authentication error. Please log in again.');
            expect(window.location.href).toBe('/login');
        });

        // Restore window.location
        (window as any).location = originalLocation;
        mockedToast.error.mockClear();

        // Test 403 error
        act(() => {
            const error403 = {
                response: {
                    status: 403,
                },
            };
            result.current.handleErrorByStatus(error403);
            expect(mockedToast.error).toHaveBeenCalledWith('You do not have permission to perform this action.');
        });

        // Test 404 error
        mockedToast.error.mockClear();
        act(() => {
            const error404 = {
                response: {
                    status: 404,
                },
            };
            result.current.handleErrorByStatus(error404);
            expect(mockedToast.error).toHaveBeenCalledWith('Resource not found');
        });

        // Test 500 error
        mockedToast.error.mockClear();
        act(() => {
            const error500 = {
                response: {
                    status: 500,
                },
            };
            result.current.handleErrorByStatus(error500);
            expect(mockedToast.error).toHaveBeenCalledWith('Server error. Please try again later.');
        });

        // Test unknown status
        mockedToast.error.mockClear();
        act(() => {
            const errorUnknown = {
                response: {
                    status: 999,
                },
            };
            result.current.handleErrorByStatus(errorUnknown);
            expect(mockedToast.error).toHaveBeenCalledWith('An error occurred');
        });
    });
});