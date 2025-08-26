import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { queryKeys } from '../lib/queryClient';
import { useUIStore } from '../stores';
import type {
  Patient,
  Allergy,
  Condition,
  MedicationRecord,
  ClinicalAssessment,
  DrugTherapyProblem,
  CarePlan,
  Visit,
  PatientSummary,
  PatientSearchParams,
  AllergySearchParams,
  MedicationSearchParams,
  DTPSearchParams,
  CreatePatientData,
  UpdatePatientData,
  CreateAllergyData,
  UpdateAllergyData,
  CreateConditionData,
  UpdateConditionData,
  CreateMedicationData,
  UpdateMedicationData,
  CreateAssessmentData,
  UpdateAssessmentData,
  CreateDTPData,
  UpdateDTPData,
  CreateCarePlanData,
  UpdateCarePlanData,
  CreateVisitData,
  UpdateVisitData,
} from '../types/patientManagement';

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
    mutationFn: ({
      patientId,
      patientData,
    }: {
      patientId: string;
      patientData: any;
    }) => patientService.updatePatient(patientId, patientData),
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
      queryClient.removeQueries({
        queryKey: queryKeys.patients.detail(patientId),
      });

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

// =======================
// ALLERGY MANAGEMENT HOOKS
// =======================

export const usePatientAllergies = (
  patientId: string,
  params?: AllergySearchParams
) => {
  return useQuery({
    queryKey: queryKeys.allergies.byPatient(patientId),
    queryFn: () => patientService.getPatientAllergies(patientId, params),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useAllergy = (allergyId: string) => {
  return useQuery({
    queryKey: queryKeys.allergies.detail(allergyId),
    queryFn: () => patientService.getAllergyById(allergyId),
    enabled: !!allergyId,
    select: (data) => data.data || data,
  });
};

export const useCreateAllergy = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      patientId,
      allergyData,
    }: {
      patientId: string;
      allergyData: CreateAllergyData;
    }) => patientService.createAllergy(patientId, allergyData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.allergies.byPatient(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.patientId),
      });

      addNotification({
        type: 'success',
        title: 'Allergy Added',
        message: 'Patient allergy has been successfully recorded.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Add Allergy',
        message: error.message || 'Unable to record allergy. Please try again.',
        duration: 5000,
      });
    },
  });
};

export const useUpdateAllergy = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      allergyId,
      allergyData,
    }: {
      allergyId: string;
      allergyData: UpdateAllergyData;
    }) => patientService.updateAllergy(allergyId, allergyData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.allergies.detail(variables.allergyId),
        data
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.allergies.lists() });

      addNotification({
        type: 'success',
        title: 'Allergy Updated',
        message: 'Allergy information has been updated.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update allergy.',
        duration: 5000,
      });
    },
  });
};

export const useDeleteAllergy = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: patientService.deleteAllergy,
    onSuccess: (data, allergyId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.allergies.detail(allergyId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.allergies.lists() });

      addNotification({
        type: 'success',
        title: 'Allergy Deleted',
        message: 'Allergy record has been removed.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete allergy.',
        duration: 5000,
      });
    },
  });
};

// ========================
// CONDITION MANAGEMENT HOOKS
// ========================

export const usePatientConditions = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.conditions.byPatient(patientId),
    queryFn: () => patientService.getPatientConditions(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useCondition = (conditionId: string) => {
  return useQuery({
    queryKey: queryKeys.conditions.detail(conditionId),
    queryFn: () => patientService.getConditionById(conditionId),
    enabled: !!conditionId,
    select: (data) => data.data || data,
  });
};

export const useCreateCondition = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      patientId,
      conditionData,
    }: {
      patientId: string;
      conditionData: CreateConditionData;
    }) => patientService.createCondition(patientId, conditionData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conditions.byPatient(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.patientId),
      });

      addNotification({
        type: 'success',
        title: 'Condition Added',
        message: 'Patient condition has been recorded.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Add Condition',
        message: error.message || 'Unable to record condition.',
        duration: 5000,
      });
    },
  });
};

export const useUpdateCondition = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      conditionId,
      conditionData,
    }: {
      conditionId: string;
      conditionData: UpdateConditionData;
    }) => patientService.updateCondition(conditionId, conditionData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.conditions.detail(variables.conditionId),
        data
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.conditions.lists() });

      addNotification({
        type: 'success',
        title: 'Condition Updated',
        message: 'Condition information has been updated.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update condition.',
        duration: 5000,
      });
    },
  });
};

export const useDeleteCondition = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: patientService.deleteCondition,
    onSuccess: (data, conditionId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.conditions.detail(conditionId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.conditions.lists() });

      addNotification({
        type: 'success',
        title: 'Condition Deleted',
        message: 'Condition record has been removed.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete condition.',
        duration: 5000,
      });
    },
  });
};

// ==========================
// MEDICATION MANAGEMENT HOOKS
// ==========================

export const useCurrentMedications = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.medications.current(patientId),
    queryFn: () =>
      patientService.getPatientMedications(patientId, { phase: 'current' }),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const usePastMedications = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.medications.past(patientId),
    queryFn: () =>
      patientService.getPatientMedications(patientId, { phase: 'past' }),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useMedication = (medicationId: string) => {
  return useQuery({
    queryKey: queryKeys.medications.detail(medicationId),
    queryFn: () => patientService.getMedicationById(medicationId),
    enabled: !!medicationId,
    select: (data) => data.data || data,
  });
};

export const useCreateMedication = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      patientId,
      medicationData,
    }: {
      patientId: string;
      medicationData: CreateMedicationData;
    }) => patientService.createMedication(patientId, medicationData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.medications.byPatient(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.patientId),
      });

      addNotification({
        type: 'success',
        title: 'Medication Added',
        message: 'Medication record has been created.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Add Medication',
        message: error.message || 'Unable to add medication.',
        duration: 5000,
      });
    },
  });
};

export const useUpdateMedication = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      medicationId,
      medicationData,
    }: {
      medicationId: string;
      medicationData: UpdateMedicationData;
    }) => patientService.updateMedication(medicationId, medicationData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.medications.detail(variables.medicationId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.medications.lists(),
      });

      addNotification({
        type: 'success',
        title: 'Medication Updated',
        message: 'Medication information has been updated.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update medication.',
        duration: 5000,
      });
    },
  });
};

export const useDeleteMedication = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: patientService.deleteMedication,
    onSuccess: (data, medicationId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.medications.detail(medicationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.medications.lists(),
      });

      addNotification({
        type: 'success',
        title: 'Medication Deleted',
        message: 'Medication record has been removed.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.message || 'Failed to delete medication.',
        duration: 5000,
      });
    },
  });
};

// =========================
// PATIENT SUMMARY HOOKS
// =========================

export const usePatientSummary = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.patients.summary(patientId),
    queryFn: () => patientService.getPatientSummary(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
    staleTime: 2 * 60 * 1000, // 2 minutes - summary data can be slightly stale
  });
};
