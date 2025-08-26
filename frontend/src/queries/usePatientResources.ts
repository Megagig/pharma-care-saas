import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/patientService';
import { queryKeys } from '../lib/queryClient';
import { useUIStore } from '../stores';
import type {
  ClinicalAssessment,
  DrugTherapyProblem,
  CarePlan,
  Visit,
  PatientSummary,
  DTPSearchParams,
  CreateAssessmentData,
  UpdateAssessmentData,
  CreateDTPData,
  UpdateDTPData,
  CreateCarePlanData,
  UpdateCarePlanData,
  CreateVisitData,
  UpdateVisitData,
  VisitAttachment,
} from '../types/patientManagement';

// ================================
// CLINICAL ASSESSMENT HOOKS
// ================================

export const usePatientAssessments = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.byPatient(patientId),
    queryFn: () => patientService.getPatientAssessments(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useLatestAssessment = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.latest(patientId),
    queryFn: () => patientService.getLatestAssessment(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useAssessment = (assessmentId: string) => {
  return useQuery({
    queryKey: queryKeys.assessments.detail(assessmentId),
    queryFn: () => patientService.getAssessmentById(assessmentId),
    enabled: !!assessmentId,
    select: (data) => data.data || data,
  });
};

export const useCreateAssessment = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      patientId,
      assessmentData,
    }: {
      patientId: string;
      assessmentData: CreateAssessmentData;
    }) => patientService.createAssessment(patientId, assessmentData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessments.byPatient(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.patientId),
      });

      addNotification({
        type: 'success',
        title: 'Assessment Recorded',
        message: 'Clinical assessment has been successfully recorded.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Assessment Failed',
        message: error.message || 'Unable to record assessment.',
        duration: 5000,
      });
    },
  });
};

export const useUpdateAssessment = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      assessmentId,
      assessmentData,
    }: {
      assessmentId: string;
      assessmentData: UpdateAssessmentData;
    }) => patientService.updateAssessment(assessmentId, assessmentData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.assessments.detail(variables.assessmentId),
        data
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.assessments.lists(),
      });

      addNotification({
        type: 'success',
        title: 'Assessment Updated',
        message: 'Clinical assessment has been updated.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update assessment.',
        duration: 5000,
      });
    },
  });
};

// ================================
// DRUG THERAPY PROBLEM (DTP) HOOKS
// ================================

export const usePatientDTPs = (patientId: string, params?: DTPSearchParams) => {
  return useQuery({
    queryKey: queryKeys.dtps.byPatient(patientId),
    queryFn: () => patientService.getPatientDTPs(patientId, params),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useActiveDTPs = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.dtps.active(patientId),
    queryFn: () =>
      patientService.getPatientDTPs(patientId, { status: 'unresolved' }),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useDTP = (dtpId: string) => {
  return useQuery({
    queryKey: queryKeys.dtps.detail(dtpId),
    queryFn: () => patientService.getDTPById(dtpId),
    enabled: !!dtpId,
    select: (data) => data.data || data,
  });
};

export const useCreateDTP = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      patientId,
      dtpData,
    }: {
      patientId: string;
      dtpData: CreateDTPData;
    }) => patientService.createDTP(patientId, dtpData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dtps.byPatient(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.patientId),
      });

      addNotification({
        type: 'warning',
        title: 'DTP Identified',
        message:
          'Drug therapy problem has been documented and requires attention.',
        duration: 6000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to Record DTP',
        message: error.message || 'Unable to document drug therapy problem.',
        duration: 5000,
      });
    },
  });
};

export const useUpdateDTP = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      dtpId,
      dtpData,
    }: {
      dtpId: string;
      dtpData: UpdateDTPData;
    }) => patientService.updateDTP(dtpId, dtpData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.dtps.detail(variables.dtpId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.dtps.lists() });

      const isResolved = (data as any)?.status === 'resolved';
      addNotification({
        type: isResolved ? 'success' : 'info',
        title: isResolved ? 'DTP Resolved' : 'DTP Updated',
        message: isResolved
          ? 'Drug therapy problem has been successfully resolved.'
          : 'DTP information has been updated.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update DTP.',
        duration: 5000,
      });
    },
  });
};

// ========================
// CARE PLAN HOOKS
// ========================

export const usePatientCarePlans = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.carePlans.byPatient(patientId),
    queryFn: () => patientService.getPatientCarePlans(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useLatestCarePlan = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.carePlans.latest(patientId),
    queryFn: () => patientService.getLatestCarePlan(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useCarePlan = (carePlanId: string) => {
  return useQuery({
    queryKey: queryKeys.carePlans.detail(carePlanId),
    queryFn: () => patientService.getCarePlanById(carePlanId),
    enabled: !!carePlanId,
    select: (data) => data.data || data,
  });
};

export const useCreateCarePlan = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      patientId,
      carePlanData,
    }: {
      patientId: string;
      carePlanData: CreateCarePlanData;
    }) => patientService.createCarePlan(patientId, carePlanData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.carePlans.byPatient(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.patientId),
      });

      addNotification({
        type: 'success',
        title: 'Care Plan Created',
        message: 'Patient care plan has been successfully developed.',
        duration: 5000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Care Plan Failed',
        message: error.message || 'Unable to create care plan.',
        duration: 5000,
      });
    },
  });
};

export const useUpdateCarePlan = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      carePlanId,
      carePlanData,
    }: {
      carePlanId: string;
      carePlanData: UpdateCarePlanData;
    }) => patientService.updateCarePlan(carePlanId, carePlanData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.carePlans.detail(variables.carePlanId),
        data
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.carePlans.lists() });

      addNotification({
        type: 'success',
        title: 'Care Plan Updated',
        message: 'Patient care plan has been revised.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update care plan.',
        duration: 5000,
      });
    },
  });
};

// ====================
// VISIT MANAGEMENT HOOKS
// ====================

export const usePatientVisits = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.visits.byPatient(patientId),
    queryFn: () => patientService.getPatientVisits(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
};

export const useVisit = (visitId: string) => {
  return useQuery({
    queryKey: queryKeys.visits.detail(visitId),
    queryFn: () => patientService.getVisitById(visitId),
    enabled: !!visitId,
    select: (data) => data.data || data,
  });
};

export const useVisitAttachments = (visitId: string) => {
  return useQuery({
    queryKey: queryKeys.visits.attachments(visitId),
    queryFn: () => patientService.getVisitAttachments(visitId),
    enabled: !!visitId,
    select: (data) => data.data || data,
  });
};

export const useCreateVisit = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      patientId,
      visitData,
    }: {
      patientId: string;
      visitData: CreateVisitData;
    }) => patientService.createVisit(patientId, visitData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.visits.byPatient(variables.patientId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.detail(variables.patientId),
      });

      addNotification({
        type: 'success',
        title: 'Visit Recorded',
        message: 'Patient visit has been successfully documented.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Visit Recording Failed',
        message: error.message || 'Unable to record visit.',
        duration: 5000,
      });
    },
  });
};

export const useUpdateVisit = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({
      visitId,
      visitData,
    }: {
      visitId: string;
      visitData: UpdateVisitData;
    }) => patientService.updateVisit(visitId, visitData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.visits.detail(variables.visitId),
        data
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.lists() });

      addNotification({
        type: 'success',
        title: 'Visit Updated',
        message: 'Visit information has been updated.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update visit.',
        duration: 5000,
      });
    },
  });
};

export const useUploadVisitAttachment = () => {
  const queryClient = useQueryClient();
  const addNotification = useUIStore((state) => state.addNotification);

  return useMutation({
    mutationFn: ({ visitId, file }: { visitId: string; file: File }) =>
      patientService.uploadVisitAttachment(visitId, file),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.visits.attachments(variables.visitId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.visits.detail(variables.visitId),
      });

      addNotification({
        type: 'success',
        title: 'File Uploaded',
        message: 'Visit attachment has been uploaded successfully.',
        duration: 4000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload attachment.',
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

// Compound hook for comprehensive patient data
export const usePatientOverview = (patientId: string) => {
  const patient = useQuery({
    queryKey: queryKeys.patients.detail(patientId),
    queryFn: () => patientService.getPatientById(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });

  const allergies = usePatientAllergies(patientId);
  const conditions = usePatientConditions(patientId);
  const currentMedications = useCurrentMedications(patientId);
  const activeDTPs = useActiveDTPs(patientId);
  const latestAssessment = useLatestAssessment(patientId);
  const latestCarePlan = useLatestCarePlan(patientId);

  return {
    patient,
    allergies,
    conditions,
    currentMedications,
    activeDTPs,
    latestAssessment,
    latestCarePlan,
    isLoading:
      patient.isLoading ||
      allergies.isLoading ||
      conditions.isLoading ||
      currentMedications.isLoading,
    isError:
      patient.isError ||
      allergies.isError ||
      conditions.isError ||
      currentMedications.isError,
  };
};

// Helper hooks for patient allergies and conditions (internal use)
function usePatientAllergies(patientId: string) {
  return useQuery({
    queryKey: queryKeys.allergies.byPatient(patientId),
    queryFn: () => patientService.getPatientAllergies(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
}

function usePatientConditions(patientId: string) {
  return useQuery({
    queryKey: queryKeys.conditions.byPatient(patientId),
    queryFn: () => patientService.getPatientConditions(patientId),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
}

function useCurrentMedications(patientId: string) {
  return useQuery({
    queryKey: queryKeys.medications.current(patientId),
    queryFn: () =>
      patientService.getPatientMedications(patientId, { phase: 'current' }),
    enabled: !!patientId,
    select: (data) => data.data || data,
  });
}
