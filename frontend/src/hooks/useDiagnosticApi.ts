import { useState } from 'react';
import { useErrorHandler } from './useErrorHandler';

// Define form data type inline to avoid circular dependency
export interface CaseFormData {
    patientId: string;
    patientName?: string;
    symptoms: {
        subjective: string;
        duration: string;
        severity: 'mild' | 'moderate' | 'severe';
        onset: 'sudden' | 'gradual' | 'intermittent';
        aggravatingFactors?: string;
        relievingFactors?: string;
    };
    currentMedications: Array<{
        name?: string;
        dosage?: string;
        frequency?: string;
    }>;
    allergies: string[];
    medicalConditions: {
        chronicIllnesses?: string;
        pastSurgeries?: string;
        familyHistory?: string;
        lifestyleFactors?: string;
    };
}

interface UseDiagnosticApiProps {
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
}

export const useDiagnosticApi = ({ onSuccess, onError }: UseDiagnosticApiProps = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { handleErrorByStatus } = useErrorHandler();

    // Create diagnostic case
    const createDiagnosticCase = async (data: CaseFormData) => {
        setIsLoading(true);
        try {
            // Mock API call - replace with actual implementation
            console.log('Creating diagnostic case:', data);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock response
            const response = {
                data: {
                    _id: 'case-' + Date.now(),
                    ...data,
                    createdAt: new Date().toISOString(),
                    status: 'pending',
                },
            };

            onSuccess?.(response);
            return response;
        } catch (error: any) {
            handleErrorByStatus(error);
            onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Get diagnostic case
    const getDiagnosticCase = async (id: string) => {
        setIsLoading(true);
        try {
            // Mock API call - replace with actual implementation
            console.log('Getting diagnostic case:', id);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock response
            const response = {
                data: {
                    _id: id,
                    patientId: 'patient-123',
                    patientName: 'John Doe',
                    symptoms: {
                        subjective: 'Headache and fever',
                        duration: '3 days',
                        severity: 'moderate',
                        onset: 'gradual',
                    },
                    createdAt: new Date().toISOString(),
                    status: 'completed',
                },
            };

            return response;
        } catch (error: any) {
            handleErrorByStatus(error);
            onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Update diagnostic case
    const updateDiagnosticCase = async (id: string, data: Partial<CaseFormData>) => {
        setIsLoading(true);
        try {
            // Mock API call - replace with actual implementation
            console.log('Updating diagnostic case:', id, data);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock response
            const response = {
                data: {
                    _id: id,
                    ...data,
                    updatedAt: new Date().toISOString(),
                },
            };

            onSuccess?.(response);
            return response;
        } catch (error: any) {
            handleErrorByStatus(error);
            onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Delete diagnostic case
    const deleteDiagnosticCase = async (id: string) => {
        setIsLoading(true);
        try {
            // Mock API call - replace with actual implementation
            console.log('Deleting diagnostic case:', id);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            onSuccess?.({ success: true });
            return { success: true };
        } catch (error: any) {
            handleErrorByStatus(error);
            onError?.(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        createDiagnosticCase,
        getDiagnosticCase,
        updateDiagnosticCase,
        deleteDiagnosticCase,
    };
};