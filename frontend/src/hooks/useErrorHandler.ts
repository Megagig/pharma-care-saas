import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface ApiError {
    response?: {
        data?: {
            message?: string;
            errors?: Record<string, string[]>;
        };
        status?: number;
    };
    message?: string;
}

export const useErrorHandler = () => {
    const handleApiError = useCallback((error: ApiError, fallbackMessage = 'An error occurred') => {
        // Extract error message from API response
        const errorMessage = error.response?.data?.message ||
            error.message ||
            fallbackMessage;

        // Display error toast
        toast.error(errorMessage);

        // Log error for debugging
        console.error('API Error:', error);

        return errorMessage;
    }, []);

    const handleFormError = useCallback((errors: Record<string, any>, fieldNames?: string[]) => {
        // If specific field names are provided, only show errors for those fields
        const fieldsToCheck = fieldNames || Object.keys(errors);

        // Find the first error message
        for (const fieldName of fieldsToCheck) {
            if (errors[fieldName]) {
                const fieldError = errors[fieldName];
                const errorMessage = typeof fieldError === 'object' && fieldError.message
                    ? fieldError.message
                    : typeof fieldError === 'string'
                        ? fieldError
                        : `Invalid ${fieldName}`;

                // Display error toast
                toast.error(errorMessage);

                // Return the first error found
                return errorMessage;
            }
        }

        return null;
    }, []);

    const handleValidationError = useCallback((error: ApiError) => {
        // Extract validation errors from API response
        const validationErrors = error.response?.data?.errors;

        if (validationErrors && typeof validationErrors === 'object') {
            // Convert errors object to array of messages
            const errorMessages = Object.values(validationErrors)
                .flat()
                .filter(Boolean);

            if (errorMessages.length > 0) {
                // Display the first validation error
                toast.error(errorMessages[0]);

                // Return all validation errors
                return {
                    general: errorMessages[0],
                    fields: validationErrors,
                };
            }
        }

        // Fallback to generic error handling
        return handleApiError(error, 'Validation failed');
    }, [handleApiError]);

    const handleNetworkError = useCallback(() => {
        const errorMessage = 'Network error. Please check your connection and try again.';
        toast.error(errorMessage);
        return errorMessage;
    }, []);

    const handleAuthError = useCallback(() => {
        const errorMessage = 'Authentication error. Please log in again.';
        toast.error(errorMessage);

        // Redirect to login page
        window.location.href = '/login';

        return errorMessage;
    }, []);

    const handlePermissionError = useCallback(() => {
        const errorMessage = 'You do not have permission to perform this action.';
        toast.error(errorMessage);
        return errorMessage;
    }, []);

    const handleServerError = useCallback(() => {
        const errorMessage = 'Server error. Please try again later.';
        toast.error(errorMessage);
        return errorMessage;
    }, []);

    const handleErrorByStatus = useCallback((error: ApiError) => {
        const status = error.response?.status;

        switch (status) {
            case 400:
                return handleValidationError(error);
            case 401:
                return handleAuthError();
            case 403:
                return handlePermissionError();
            case 404:
                return handleApiError(error, 'Resource not found');
            case 500:
                return handleServerError();
            default:
                return handleApiError(error);
        }
    }, [
        handleValidationError,
        handleAuthError,
        handlePermissionError,
        handleServerError,
        handleApiError
    ]);

    return {
        handleApiError,
        handleFormError,
        handleValidationError,
        handleNetworkError,
        handleAuthError,
        handlePermissionError,
        handleServerError,
        handleErrorByStatus,
    };
};