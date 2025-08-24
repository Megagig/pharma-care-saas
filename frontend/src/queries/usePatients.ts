import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { queryKeys } from '../lib/queryClient';
import { useUIStore } from '../stores';

// Hook to fetch all patients with optional filters
export const usePatients = (filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: queryKeys.patients.list(filters),
    queryFn: () => patientService.getPatients(filters),
    select: (data) => data.data || data, // Handle different response structures
  });
};

// Hook to fetch a single patient by ID
export const usePatient = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => patientService.getPatientById(patientId),
    enabled: !!patientId, // Only run query if patientId exists
    select: (data) => data.data || data,
  });
};

// Hook to search patients
export const useSearchPatients = (searchQuery: string) => {
  return useQuery({
    queryKey: queryKeys.patients.search(searchQuery),
    queryFn: () => patientService.searchPatients(searchQuery),
    enabled: !!searchQuery && searchQuery.length >= 2, // Only search with 2+ characters
    select: (data) => data.data || data,
  });
};

// Hook to create a new patient
export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: (data) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Patient Created',
        message: `Patient ${data.firstName} ${data.lastName} has been successfully created.`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: error.message || 'Failed to create patient. Please try again.',
        duration: 5000,
      });
    },
  });
};

// Hook to update a patient
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({ patientId, patientData }: { patientId: string; patientData: any }) =>
      patientService.updatePatient(patientId, patientData),
    onSuccess: (data, variables) => {
      // Update the specific patient in cache
      queryClient.setQueryData(
        queryKeys.patients.detail(variables.patientId),
        data
      );
      
      // Invalidate patients list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Patient Updated',
        message: 'Patient information has been successfully updated.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update patient. Please try again.',
        duration: 5000,
      });
    },
  });
};

// Hook to delete a patient
export const useDeletePatient = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: patientService.deletePatient,
    onSuccess: (data, patientId) => {
      // Remove patient from cache
      queryClient.removeQueries({ queryKey: queryKeys.patients.detail(patientId) });
      
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.lists() });
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Patient Deleted',
        message: 'Patient has been successfully deleted.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Show error notification
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete patient. Please try again.',
        duration: 5000,
      });
    },
  });
};

// Hook to fetch patient medications
export const usePatientMedications = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.medications.byPatient(patientId),
    queryFn: () => patientService.getPatientMedications(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

// Hook to fetch patient clinical notes
export const usePatientNotes = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.clinicalNotes.byPatient(patientId),
    queryFn: () => patientService.getPatientNotes(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};