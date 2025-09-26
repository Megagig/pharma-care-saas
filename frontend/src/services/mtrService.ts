import axios from 'axios';
// ===============================
// ERROR HANDLING TYPES
// ===============================

export interface MTRServiceError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class MTRValidationError extends Error implements MTRServiceError {
  code = 'MTR_VALIDATION_ERROR';
  status = 400;
  details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'MTRValidationError';
    this.details = details;
  }
}

export class MTRNotFoundError extends Error implements MTRServiceError {
  code = 'MTR_NOT_FOUND';
  status = 404;

  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'MTRNotFoundError';
  }
}

export class MTRPermissionError extends Error implements MTRServiceError {
  code = 'MTR_PERMISSION_DENIED';
  status = 403;

  constructor(action: string) {
    super(`Permission denied for action: ${action}`);
    this.name = 'MTRPermissionError';
  }
}

// ===============================
// DATA TRANSFORMATION UTILITIES
// ===============================

// Type definitions for better type safety
interface DateTransformable {
  steps?: Record<
    string,
    { completedAt?: string | Date;[key: string]: unknown }
  >;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  completedAt?: string | Date;
  scheduledAt?: string | Date;
  dueDate?: string | Date;
  implementedAt?: string | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  identifiedAt?: string | Date;
  data?: unknown;
  [key: string]: unknown;
}

/**
 * Utility function to safely handle API responses with proper typing
 * This helps extract data from nested response structures and apply transformations
 */
export function handleApiResponse<T>(
  // Using a more specific type for Axios responses
  response: { data?: { data?: unknown } } | null | undefined,
  extractPath?: string[]
): T {
  if (!response || !response.data) {
    throw new Error('Invalid response structure: missing data');
  }

  // Navigate through the nested path (e.g., ['data', 'intervention'])
  let result = response.data;

  if (extractPath && extractPath.length > 0) {
    for (const key of extractPath) {
      if (
        result &&
        typeof result === 'object' &&
        key in (result as Record<string, unknown>)
      ) {
        result = (result as Record<string, unknown>)[key];
      } else {
        throw new Error(`Invalid response structure: missing ${key}`);
      }
    }
  }

  return result as T;
}

// Define session data type
interface MTRSessionData {
  review: MedicationTherapyReview;
}

type SearchParamsType = Record<
  string,
  string | number | boolean | string[] | undefined
>;

// Utility functions for date transformations

/**
 * Transform date strings to Date objects for frontend use
 */
function _transformDatesForFrontend(obj: unknown): unknown {
  // Return early for null/undefined or non-objects
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Common date fields to transform
  const dateFields = [
    'createdAt',
    'updatedAt',
    'completedAt',
    'scheduledAt',
    'dueDate',
    'implementedAt',
    'startDate',
    'endDate',
    'identifiedAt',
  ];
  // Create a copy to safely modify
  const transformed = { ...obj } as Record<string, unknown>;

  dateFields.forEach((field) => {
    if (field in transformed && typeof transformed[field] === 'string') {
      try {
        transformed[field] = new Date(
          transformed[field] as string
        ).toISOString();
      } catch (error) {
        console.warn(`Failed to transform date field ${field}:`, error);
      }
    }
  });

  // Transform nested step dates if they exist
  if (
    'steps' in transformed &&
    transformed.steps &&
    typeof transformed.steps === 'object'
  ) {
    Object.keys(transformed.steps).forEach((stepKey) => {
      const step = (
        transformed.steps as Record<string, Record<string, unknown>>
      )[stepKey];
      if (step?.completedAt && typeof step.completedAt === 'string') {
        try {
          step.completedAt = new Date(step.completedAt).toISOString();
        } catch (error) {
          console.warn(`Failed to transform step completedAt date:`, error);
        }
      }
    });
  }

  return transformed;
}

/**
 * Transform data for API submission (dates to ISO strings)
 */
function _transformDatesForAPI(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const transformed = { ...obj } as Record<string, unknown>;

    const value = transformed[key];
    if (value instanceof Date) {
      transformed[key] = value.toISOString();
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Prevent infinite recursion by checking if value is actually an object with properties
      const objValue = value as Record<string, unknown>;
      if (Object.keys(objValue).length > 0) {
        transformed[key] = _transformDatesForAPI(objValue);
      }
    }
  });

  return transformed;
}

// Export typed wrapper functions
export const transformDatesForFrontend = <T>(obj: unknown): T =>
  _transformDatesForFrontend(obj) as T;

export const transformDatesForAPI = <T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> => _transformDatesForAPI(obj);

/**
 * Validate medication entry data
 */
export const validateMedicationEntry = (
  medication: Partial<MTRMedicationEntry>
): string[] => {
  const errors: string[] = [];

  if (!medication.drugName?.trim()) {
    errors.push('Drug name is required');
  }

  if (!medication.strength?.value || medication.strength.value <= 0) {
    errors.push('Valid strength value is required');
  }

  if (!medication.strength?.unit?.trim()) {
    errors.push('Strength unit is required');
  }

  if (!medication.dosageForm?.trim()) {
    errors.push('Dosage form is required');
  }

  if (!medication.instructions?.dose?.trim()) {
    errors.push('Dose instructions are required');
  }

  if (!medication.instructions?.frequency?.trim()) {
    errors.push('Frequency instructions are required');
  }

  if (!medication.instructions?.route?.trim()) {
    errors.push('Route of administration is required');
  }

  if (!medication.category) {
    errors.push('Medication category is required');
  }

  if (!medication.startDate) {
    errors.push('Start date is required');
  }

  if (!medication.indication?.trim()) {
    errors.push('Indication is required');
  }

  return errors;
};

/**
 * Validate therapy plan data
 */
export const validateTherapyPlan = (plan: Partial<TherapyPlan>, strict: boolean = false): string[] => {
  const errors: string[] = [];

  // Only enforce strict validation when explicitly requested (e.g., when completing the plan step)
  if (strict) {
    if (!plan.problems || plan.problems.length === 0) {
      errors.push(
        'At least one problem must be associated with the therapy plan'
      );
    }

    if (!plan.recommendations || plan.recommendations.length === 0) {
      errors.push('At least one recommendation is required');
    }

    if (!plan.timeline?.trim()) {
      errors.push('Timeline is required');
    }
  }

  // Always validate recommendation structure if recommendations exist
  plan.recommendations?.forEach((rec, index) => {
    if (rec.type && !rec.rationale?.trim()) {
      errors.push(`Recommendation ${index + 1}: Rationale is required when type is specified`);
    }
    if (rec.rationale && !rec.type) {
      errors.push(`Recommendation ${index + 1}: Type is required when rationale is provided`);
    }
    if ((rec.type || rec.rationale) && !rec.priority) {
      errors.push(`Recommendation ${index + 1}: Priority is required for complete recommendations`);
    }
  });

  return errors;
};

/**
 * Calculate MTR completion percentage
 */
export const calculateCompletionPercentage = (
  mtr: MedicationTherapyReview
): number => {
  // Check if MTR object exists
  if (!mtr) {
    console.warn('MTR object is undefined or null, returning 0% completion');
    return 0;
  }

  // Check if steps object exists and is not null
  if (!mtr.steps) {
    console.warn(
      'MTR steps object is undefined or null, returning 0% completion'
    );
    return 0;
  }

  try {
    const steps = Object.values(mtr.steps);

    // Additional safety check for steps array
    if (!Array.isArray(steps) || steps.length === 0) {
      console.warn(
        'MTR steps array is empty or invalid, returning 0% completion'
      );
      return 0;
    }

    const completedSteps = steps.filter(
      (step) => step && typeof step === 'object' && step.completed === true
    ).length;

    return Math.round((completedSteps / steps.length) * 100);
  } catch (error) {
    console.error('Error calculating completion percentage:', error);
    return 0; // Return 0% completion on error
  }
};

/**
 * Check if MTR is overdue
 */
export const isOverdue = (mtr: MedicationTherapyReview): boolean => {
  try {
    if (!mtr || !mtr.status) {
      return false;
    }

    if (mtr.status === 'completed' || mtr.status === 'cancelled') {
      return false;
    }

    const now = new Date();
    const startDate = new Date(mtr.startedAt);
    const daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Consider overdue if in progress for more than 7 days for routine, 3 days for urgent, 1 day for high_risk
    const overdueThresholds: Record<string, number> = {
      routine: 7,
      urgent: 3,
      high_risk: 1,
    };

    return daysSinceStart > (overdueThresholds[mtr.priority] || 7);
  } catch (error) {
    console.error('Error checking if MTR is overdue:', error);
    return false; // Return not overdue on error
  }
};

/**
 * Format search parameters for API calls
 */
export const formatSearchParams = (
  params: SearchParamsType
): URLSearchParams => {
  const searchParams = new URLSearchParams();

    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, item.toString()));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });

  return searchParams;
};

/**
 * Handle API errors with proper typing and context
 */
export const handleMTRError = (error: unknown, context: string): never => {
  console.error(`MTR Service Error in ${context}:`, error);

  const apiError = error as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        details?: Record<string, unknown>;
        id?: string;
        code?: string;
      };
    };
    message?: string;
  };

  if (apiError.response?.status === 400) {
    throw new MTRValidationError(
      apiError.response.data?.message || 'Validation failed',
      apiError.response.data?.details || {}
    );
  }

  if (apiError.response?.status === 404) {
    throw new MTRNotFoundError(
      context,
      apiError.response.data?.id || 'unknown'
    );
  }

  if (apiError.response?.status === 403) {
    throw new MTRPermissionError(context);
  }

  // Generic error
  const serviceError = new Error(
    apiError.response?.data?.message ||
    apiError.message ||
    'An unexpected error occurred'
  ) as MTRServiceError;

  serviceError.code = apiError.response?.data?.code || 'MTR_SERVICE_ERROR';
  serviceError.status = apiError.response?.status || 500;
  serviceError.details = apiError.response?.data?.details || {};

  throw serviceError;
};

/**
 * MTR Service - Handles all MTR-related API calls with comprehensive error handling and data transformation
 */
export const mtrService = {
  // ===============================
  // MEDICATION THERAPY REVIEW CRUD
  // ===============================

  /**
   * Get all MTR sessions with optional filtering
   */
  async getMTRSessions(params: TypedMTRSearchParams = {}): Promise<{
    results: MedicationTherapyReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr${queryString ? `?${queryString}` : ''}`;

      // Use a specific response type for reviews
      const response = await apiHelpers.get<{
        results: MedicationTherapyReview[];
        total: number;
        page: number;
        limit: number;
      }>(url);

      if (!response?.data?.data) {
        throw new Error('Invalid response structure');
      }

      const responseData = response.data.data;
      if (!responseData.results || !Array.isArray(responseData.results)) {
        throw new Error('Invalid response: missing results array');
      }

      // Transform dates and add computed fields
      const transformedResults = responseData.results.map(
        (mtr: MedicationTherapyReview) => {
          const transformed =
            transformDatesForFrontend<MedicationTherapyReview>(mtr);
          return {
            ...transformed,
            completionPercentage: calculateCompletionPercentage(transformed),
            isOverdue: isOverdue(transformed),
          } as MedicationTherapyReview;
        }
      );

      return {
        results: transformedResults,
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 10,
      };
    } catch (error) {
      return handleMTRError(error, 'getMTRSessions');
    }
  },

  /**
   * Get a single MTR session by ID
   */
  async getMTRSession(sessionId: string): Promise<MTRSessionData> {
    try {
      if (!sessionId?.trim()) {
        throw new MTRValidationError('Session ID is required');
      }

      const response = await apiHelpers.get<MedicationTherapyReview>(
        `/mtr/${sessionId}`
      );

      if (!response?.data?.data?.review) {
        throw new Error('Invalid response structure');
      }

      // Extract the review data directly from the response structure
      const reviewData = response.data.data.review;

      // Transform dates
      const transformed =
        transformDatesForFrontend<MedicationTherapyReview>(reviewData);

      // Add computed fields
      const enhancedReview = {
        ...transformed,
        completionPercentage: calculateCompletionPercentage(transformed),
        isOverdue: isOverdue(transformed),
      };

      return {
        review: enhancedReview,
      };
    } catch (error) {
      return handleMTRError(error, 'getMTRSession');
    }
  },

  /**
   * Create a new MTR session
   */
  async createMTRSession(
    sessionData: TypedCreateMTRData
  ): Promise<MTRSessionData> {
    try {
      // Validate required fields
      if (!sessionData.patientId?.trim()) {
        throw new MTRValidationError('Patient ID is required');
      }

      // Transform data for API
      const transformedData = transformDatesForAPI(
        sessionData as unknown as Record<string, unknown>
      );

      const response = await apiHelpers.post<MedicationTherapyReview>(
        '/mtr',
        transformedData
      );

      if (!response.data?.data?.review) {
        console.error('Invalid response structure - expected review in data.data:', {
          hasData: !!response.data,
          hasDataData: !!response.data?.data,
          hasReview: !!response.data?.data?.review,
          responseKeys: Object.keys(response),
          dataKeys: response.data ? Object.keys(response.data) : [],
          dataDataKeys: response.data?.data ? Object.keys(response.data.data) : [],
          fullResponse: response
        });
        throw new Error('Invalid response structure');
      }

      // Transform response dates
      const transformed = transformDatesForFrontend(
        response.data.data.review as unknown as DateTransformable
      ) as MedicationTherapyReview;

      // Validate that the transformed object has the required structure
      if (!transformed) {
        throw new Error('Failed to transform MTR data');
      }

      // Initialize steps if not present (for new MTR sessions)
      if (!transformed.steps) {
        console.warn('MTR steps not initialized, creating default structure');
        transformed.steps = {
          patientSelection: { completed: false, completedAt: null, data: {} },
          medicationHistory: { completed: false, completedAt: null, data: {} },
          therapyAssessment: { completed: false, completedAt: null, data: {} },
          planDevelopment: { completed: false, completedAt: null, data: {} },
          interventions: { completed: false, completedAt: null, data: {} },
          followUp: { completed: false, completedAt: null, data: {} },
        };
      }

      const enhancedReview = {
        ...transformed,
        completionPercentage: calculateCompletionPercentage(transformed),
        isOverdue: isOverdue(transformed),
      } as MedicationTherapyReview;

      return {
        review: enhancedReview,
      };
    } catch (error) {
      return handleMTRError(error, 'createMTRSession');
    }
  },

  /**
   * Update an MTR session
   */
  async updateMTRSession(
    sessionId: string,
    sessionData: TypedUpdateMTRData
  ): Promise<MTRSessionData> {
    try {
      console.log(`Updating MTR session, ID: "${sessionId}"`);

      if (!sessionId) {
        console.error('MTR update failed: session ID is undefined or null');
        throw new MTRValidationError('Session ID is required');
      }

      if (!sessionId.trim()) {
        console.error('MTR update failed: session ID is empty string');
        throw new MTRValidationError(
          'Session ID is required (empty string provided)'
        );
      }

      // Validate medications if provided
      if (sessionData.medications) {
        const medicationErrors: string[] = [];
        sessionData.medications.forEach((med, index) => {
          const errors = validateMedicationEntry(med);
          if (errors.length > 0) {
            medicationErrors.push(
              `Medication ${index + 1}: ${errors.join(', ')}`
            );
          }
        });

        if (medicationErrors.length > 0) {
          throw new MTRValidationError('Medication validation failed', {
            medications: medicationErrors}
        }
      }

      // Validate therapy plan if provided (non-strict for regular updates)
      if (sessionData.plan) {
        const planErrors = validateTherapyPlan(sessionData.plan, false);
        if (planErrors.length > 0) {
          throw new MTRValidationError('Therapy plan validation failed', {
            plan: planErrors}
        }
      }

      // Transform data for API
      const transformedData = transformDatesForAPI(
        sessionData as Record<string, unknown>
      );

      const response = await apiHelpers.put<MedicationTherapyReview>(
        `/mtr/${sessionId}`,
        transformedData
      );

      if (!response.data?.data?.review) {
        throw new Error('Invalid response structure');
      }

      // Transform response dates
      const transformed = transformDatesForFrontend(
        response.data.data.review as unknown as DateTransformable
      ) as MedicationTherapyReview;
      const enhancedReview = {
        ...transformed,
        completionPercentage: calculateCompletionPercentage(transformed),
        isOverdue: isOverdue(transformed),
      } as MedicationTherapyReview;

      return {
        review: enhancedReview,
      };
    } catch (error) {
      return handleMTRError(error, 'updateMTRSession');
    }
  },

  /**
   * Delete an MTR session
   */
  async deleteMTRSession(
    sessionId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!sessionId?.trim()) {
        throw new MTRValidationError('Session ID is required');
      }

      const response = await apiHelpers.delete<Record<string, never>>(
        `/mtr/${sessionId}`
      );
      return { success: true, message: 'MTR session deleted successfully' };
    } catch (error) {
      return handleMTRError(error, 'deleteMTRSession');
    }
  },

  /**
   * Complete an MTR workflow step
   */
  async completeWorkflowStep(
    sessionId: string,
    stepName: string,
    stepData?: Record<string, unknown>
  ): Promise<MTRSessionData> {
    try {
      if (!sessionId?.trim()) {
        throw new MTRValidationError('Session ID is required');
      }

      if (!stepName?.trim()) {
        throw new MTRValidationError('Step name is required');
      }

      const validSteps = [
        'patientSelection',
        'medicationHistory',
        'therapyAssessment',
        'planDevelopment',
        'interventions',
        'followUp',
      ];
      if (!validSteps.includes(stepName)) {
        throw new MTRValidationError(
          `Invalid step name: ${stepName}. Valid steps: ${validSteps.join(
            ', '
          )}`
        );
      }

      // Special validation for plan development step
      if (stepName === 'planDevelopment' && stepData?.plan) {
        const planErrors = validateTherapyPlan(stepData.plan as Partial<TherapyPlan>, true);
        if (planErrors.length > 0) {
          throw new MTRValidationError('Cannot complete plan development - validation failed', {
            plan: planErrors}
        }
      }

      // Transform step data for API
      const transformedStepData = stepData
        ? transformDatesForAPI(stepData)
        : undefined;

      const response = await apiHelpers.post<MedicationTherapyReview>(
        `/mtr/${sessionId}/steps/${stepName}/complete`,
        { data: transformedStepData }
      );

      if (!response.data?.review) {
        throw new Error('Invalid response structure');
      }

      // Transform response dates
      const transformed = transformDatesForFrontend(
        response.data.review as unknown as DateTransformable
      ) as MedicationTherapyReview;
      const enhancedReview = {
        ...transformed,
        completionPercentage: calculateCompletionPercentage(transformed),
        isOverdue: isOverdue(transformed),
      } as MedicationTherapyReview;

      return {
        review: enhancedReview,
      };
    } catch (error) {
      return handleMTRError(error, 'completeWorkflowStep');
    }
  },

  /**
   * Get MTR workflow steps configuration
   */
  async getWorkflowSteps(): Promise<Record<string, unknown>> {
    try {
      const response = await apiHelpers.get<{
        steps: Record<
          string,
          {
            title: string;
            description: string;
            order: number;
            requiredFields?: string[];
          }
        >;
      }>('/mtr/workflow/steps');

      // Extract and convert to Record<string, unknown>
      const result = response.data?.data || response.data;
      return result as Record<string, unknown>;
    } catch (error) {
      return handleMTRError(error, 'getWorkflowSteps') as Record<
        string,
        unknown
      >;
    }
  },

  /**
   * Validate workflow step
   */
  async validateWorkflowStep(
    sessionId: string,
    stepName: string,
    data?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      const response = await apiHelpers.post<Record<string, unknown>>(
        `/mtr/${sessionId}/steps/${stepName}/validate`,
        { data }
      );
      if (response?.data?.data) {
        return response.data.data as Record<string, unknown>;
      } else if (response?.data) {
        return response.data as unknown as Record<string, unknown>;
      }
      return {};
    } catch (error) {
      return handleMTRError(error, 'validateWorkflowStep') as Record<
        string,
        unknown
      >;
    }
  },

  /**
   * Check drug interactions for medications
   */
  async checkDrugInteractions(
    sessionId: string
  ): Promise<Record<string, unknown>> {
    try {
      const response = await apiHelpers.post<Record<string, unknown>>(
        `/mtr/${sessionId}/interactions/check`
      );
      if (response?.data?.data) {
        return response.data.data as Record<string, unknown>;
      } else if (response?.data) {
        return response.data as unknown as Record<string, unknown>;
      }
      return {};
    } catch (error) {
      return handleMTRError(error, 'checkDrugInteractions') as Record<
        string,
        unknown
      >;
    }
  },

  // ===============================
  // DRUG THERAPY PROBLEMS CRUD
  // ===============================

  /**
   * Get drug therapy problems with optional filtering
   */
  async getDrugTherapyProblems(params: TypedDTPSearchParams = {}): Promise<{
    results: DrugTherapyProblem[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/problems${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get<{
        results: DrugTherapyProblem[];
        total: number;
        page: number;
        limit: number;
      }>(url);

      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }

      // Transform dates in results
      const transformedResults = response.data.data.results.map(
        (problem: DrugTherapyProblem) =>
          transformDatesForFrontend(
            problem as unknown as DateTransformable
          ) as DrugTherapyProblem
      );

      return {
        ...response.data.data,
        results: transformedResults,
      };
    } catch (error) {
      return handleMTRError(error, 'getDrugTherapyProblems');
    }
  },

  /**
   * Get a single drug therapy problem by ID
   */
  async getDrugTherapyProblem(
    problemId: string
  ): Promise<{ problem: DrugTherapyProblem }> {
    try {
      const response = await apiHelpers.get<DrugTherapyProblem>(
        `/mtr/problems/${problemId}`
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { problem: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'getDrugTherapyProblem');
    }
  },

  /**
   * Create a new drug therapy problem
   */
  async createDrugTherapyProblem(
    problemData: TypedCreateDTPData
  ): Promise<{ problem: DrugTherapyProblem }> {
    try {
      // Validate required fields
      if (!problemData.patientId?.trim()) {
        throw new MTRValidationError('Patient ID is required');
      }

      if (!problemData.category?.trim()) {
        throw new MTRValidationError('Problem category is required');
      }

      if (!problemData.description?.trim()) {
        throw new MTRValidationError('Problem description is required');
      }

      if (!problemData.clinicalSignificance?.trim()) {
        throw new MTRValidationError('Clinical significance is required');
      }

      if (
        !problemData.affectedMedications ||
        problemData.affectedMedications.length === 0
      ) {
        throw new MTRValidationError(
          'At least one affected medication is required'
        );
      }

      // Transform data for API
      const transformedData = transformDatesForAPI(
        problemData as unknown as Record<string, unknown>
      );

      const response = await apiHelpers.post<DrugTherapyProblem>(
        '/mtr/problems',
        transformedData
      );

      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }

      // Transform response dates
      const transformed = transformDatesForFrontend(
        response.data.data as unknown as DateTransformable
      ) as DrugTherapyProblem;

      return {
        problem: transformed,
      };
    } catch (error) {
      return handleMTRError(error, 'createDrugTherapyProblem');
    }
  },

  /**
   * Update a drug therapy problem
   */
  async updateDrugTherapyProblem(
    problemId: string,
    problemData: TypedUpdateDTPData
  ): Promise<{ problem: DrugTherapyProblem }> {
    try {
      const response = await apiHelpers.put<DrugTherapyProblem>(
        `/mtr/problems/${problemId}`,
        problemData
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { problem: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'updateDrugTherapyProblem');
    }
  },

  /**
   * Delete a drug therapy problem
   */
  async deleteDrugTherapyProblem(
    problemId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiHelpers.delete(`/mtr/problems/${problemId}`);
      return {
        success: true,
        message: 'Drug therapy problem deleted successfully',
      };
    } catch (error) {
      return handleMTRError(error, 'deleteDrugTherapyProblem');
    }
  },

  /**
   * Resolve a drug therapy problem
   */
  async resolveDrugTherapyProblem(
    problemId: string,
    resolution: { action: string; outcome: string }
  ): Promise<{ problem: DrugTherapyProblem }> {
    try {
      const response = await apiHelpers.post<DrugTherapyProblem>(
        `/mtr/problems/${problemId}/resolve`,
        resolution
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { problem: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'resolveDrugTherapyProblem');
    }
  },

  /**
   * Reopen a resolved drug therapy problem
   */
  async reopenDrugTherapyProblem(
    problemId: string
  ): Promise<{ problem: DrugTherapyProblem }> {
    try {
      const response = await apiHelpers.post<DrugTherapyProblem>(
        `/mtr/problems/${problemId}/reopen`
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { problem: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'reopenDrugTherapyProblem');
    }
  },

  // ===============================
  // MTR INTERVENTIONS CRUD
  // ===============================

  /**
   * Get MTR interventions with optional filtering
   */
  async getInterventions(params: TypedInterventionSearchParams = {}): Promise<{
    results: MTRIntervention[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      const queryString = searchParams.toString();
      const url = `/mtr/interventions${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get<{
        results: MTRIntervention[];
        total: number;
        page: number;
        limit: number;
      }>(url);
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return response.data.data;
    } catch (error) {
      return handleMTRError(error, 'getInterventions');
    }
  },

  /**
   * Get a single intervention by ID
   */
  async getIntervention(
    interventionId: string
  ): Promise<{ intervention: MTRIntervention }> {
    try {
      if (!interventionId?.trim()) {
        throw new MTRValidationError('Intervention ID is required');
      }

      const response = await apiHelpers.get<MTRIntervention>(
        `/mtr/interventions/${interventionId}`
      );

      if (!response.data?.data) {
        throw new Error('Missing intervention data in response');
      }

      // Transform dates and return the intervention object
      const transformed = transformDatesForFrontend<MTRIntervention>(
        response.data.data
      );

      return { intervention: transformed };
    } catch (error) {
      return handleMTRError(error, 'getIntervention');
    }
  },

  /**
   * Create a new intervention
   */
  async createIntervention(
    interventionData: TypedCreateInterventionData
  ): Promise<{ intervention: MTRIntervention }> {
    try {
      // Validate required fields
      if (!interventionData.reviewId?.trim()) {
        throw new MTRValidationError('Review ID is required');
      }

      if (!interventionData.patientId?.trim()) {
        throw new MTRValidationError('Patient ID is required');
      }

      if (!interventionData.description?.trim()) {
        throw new MTRValidationError('Intervention description is required');
      }

      if (!interventionData.rationale?.trim()) {
        throw new MTRValidationError('Intervention rationale is required');
      }

      if (!interventionData.documentation?.trim()) {
        throw new MTRValidationError('Intervention documentation is required');
      }

      // Transform data for API
      const transformedData = transformDatesForAPI(
        interventionData as unknown as Record<string, unknown>
      );

      const response = await apiHelpers.post<MTRIntervention>(
        '/mtr/interventions',
        transformedData
      );

      if (!response.data?.data) {
        throw new Error('Missing intervention data in response');
      }

      // Transform dates
      const transformed = transformDatesForFrontend<MTRIntervention>(
        response.data.data
      );

      return { intervention: transformed };
    } catch (error) {
      return handleMTRError(error, 'createIntervention');
    }
  },

  /**
   * Update an intervention
   */
  async updateIntervention(
    interventionId: string,
    interventionData: TypedUpdateInterventionData
  ): Promise<{ intervention: MTRIntervention }> {
    try {
      if (!interventionId?.trim()) {
        throw new MTRValidationError('Intervention ID is required');
      }

      // Validate intervention data
      if (Object.keys(interventionData).length === 0) {
        throw new MTRValidationError('No data provided for update');
      }

      const response = await apiHelpers.put<MTRIntervention>(
        `/mtr/interventions/${interventionId}`,
        interventionData
      );

      if (!response.data?.data) {
        throw new Error('Missing intervention data in response');
      }

      // Transform dates and return
      const transformed = transformDatesForFrontend<MTRIntervention>(
        response.data.data
      );

      return { intervention: transformed };
    } catch (error) {
      return handleMTRError(error, 'updateIntervention');
    }
  },

  /**
   * Delete an intervention
   */
  async deleteIntervention(
    interventionId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (!interventionId?.trim()) {
        throw new MTRValidationError('Intervention ID is required');
      }

      const response = await apiHelpers.delete<Record<string, never>>(
        `/mtr/interventions/${interventionId}`
      );

      return {
        success: true,
        message: 'Intervention deleted successfully',
      };
    } catch (error) {
      return handleMTRError(error, 'deleteIntervention');
    }
  },

  /**
   * Mark intervention as completed
   */
  async completeIntervention(
    interventionId: string,
    outcome: string,
    details?: string
  ): Promise<{ intervention: MTRIntervention }> {
    try {
      const response = await apiHelpers.post<MTRIntervention>(
        `/mtr/interventions/${interventionId}/complete`,
        { outcome, details }
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { intervention: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'completeIntervention');
    }
  },

  // ===============================
  // MTR FOLLOW-UPS CRUD
  // ===============================

  /**
   * Get MTR follow-ups with optional filtering
   */
  async getFollowUps(params: TypedFollowUpSearchParams = {}): Promise<{
    results: MTRFollowUp[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });

      const queryString = searchParams.toString();
      const url = `/mtr/followups${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get<{
        results: MTRFollowUp[];
        total: number;
        page: number;
        limit: number;
      }>(url);
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return response.data.data;
    } catch (error) {
      return handleMTRError(error, 'getFollowUps');
    }
  },

  /**
   * Get a single follow-up by ID
   */
  async getFollowUp(followUpId: string): Promise<{ followUp: MTRFollowUp }> {
    try {
      const response = await apiHelpers.get<MTRFollowUp>(
        `/mtr/followups/${followUpId}`
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { followUp: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'getFollowUp');
    }
  },

  /**
   * Create a new follow-up
   */
  async createFollowUp(
    followUpData: TypedCreateFollowUpData
  ): Promise<{ followUp: MTRFollowUp }> {
    try {
      const response = await apiHelpers.post<MTRFollowUp>(
        '/mtr/followups',
        followUpData
      );
      if (!response.data?.followUp) {
        throw new Error('Invalid response structure');
      }
      return { followUp: response.data.followUp };
    } catch (error) {
      return handleMTRError(error, 'createFollowUp');
    }
  },

  /**
   * Update a follow-up
   */
  async updateFollowUp(
    followUpId: string,
    followUpData: TypedUpdateFollowUpData
  ): Promise<{ followUp: MTRFollowUp }> {
    try {
      const response = await apiHelpers.put<MTRFollowUp>(
        `/mtr/followups/${followUpId}`,
        followUpData
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { followUp: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'updateFollowUp');
    }
  },

  /**
   * Delete a follow-up
   */
  async deleteFollowUp(
    followUpId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiHelpers.delete(`/mtr/followups/${followUpId}`);
      return { success: true, message: 'Follow-up deleted successfully' };
    } catch (error) {
      return handleMTRError(error, 'deleteFollowUp');
    }
  },

  /**
   * Complete a follow-up
   */
  async completeFollowUp(
    followUpId: string,
    outcome: {
      status: 'successful' | 'partially_successful' | 'unsuccessful';
      notes: string;
      nextActions: string[];
      nextFollowUpDate?: string;
      adherenceImproved?: boolean;
      problemsResolved?: string[];
      newProblemsIdentified?: string[];
    }
  ): Promise<{ followUp: MTRFollowUp }> {
    try {
      const response = await apiHelpers.post<MTRFollowUp>(
        `/mtr/followups/${followUpId}/complete`,
        { outcome }
      );
      if (!response.data?.data) {
        throw new Error('Invalid response structure');
      }
      return { followUp: response.data.data };
    } catch (error) {
      return handleMTRError(error, 'completeFollowUp');
    }
  },

  /**
   * Reschedule a follow-up
   */
  async rescheduleFollowUp(
    followUpId: string,
    newDate: string,
    reason?: string
  ): Promise<{ followUp: MTRFollowUp }> {
    try {
      const response = await apiHelpers.post<MTRFollowUp>(
        `/mtr/followups/${followUpId}/reschedule`,
        { newDate, reason }
      );
      if (!response.data?.followUp) {
        throw new Error('Invalid response structure');
      }
      return { followUp: response.data.followUp };
    } catch (error) {
      return handleMTRError(error, 'rescheduleFollowUp');
    }
  },

  // ===============================
  // SPECIALIZED QUERIES
  // ===============================

  /**
   * Get MTR sessions by patient
   */
  async getMTRSessionsByPatient(
    patientId: string,
    params: Omit<TypedMTRSearchParams, 'patientId'> = {}
  ) {
    return this.getMTRSessions({ ...params, patientId });
  },

  /**
   * Get active MTR sessions
   */
  async getActiveMTRSessions(
    params: Omit<TypedMTRSearchParams, 'status'> = {}
  ) {
    return this.getMTRSessions({ ...params, status: 'in_progress' });
  },

  /**
   * Get overdue MTR sessions
   */
  async getOverdueMTRSessions(): Promise<unknown> {
    try {
      const response = await apiHelpers.get('/mtr/overdue');
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getOverdueMTRSessions');
    }
  },

  /**
   * Get drug therapy problems by patient
   */
  async getDrugTherapyProblemsByPatient(
    patientId: string,
    params: Omit<TypedDTPSearchParams, 'patientId'> = {}
  ) {
    return this.getDrugTherapyProblems({ ...params, patientId });
  },

  /**
   * Get active drug therapy problems
   */
  async getActiveDrugTherapyProblems(
    params: Omit<TypedDTPSearchParams, 'status'> = {}
  ) {
    return this.getDrugTherapyProblems({ 
      ...params,
      status: 'identified,addressed,monitoring'}
    });
  },

  /**
   * Get interventions by review
   */
  async getInterventionsByReview(
    reviewId: string,
    params: Omit<TypedInterventionSearchParams, 'reviewId'> = {}
  ) {
    return this.getInterventions({ ...params, reviewId });
  },

  /**
   * Get pending interventions
   */
  async getPendingInterventions(
    params: Omit<TypedInterventionSearchParams, 'outcome'> = {}
  ) {
    return this.getInterventions({ ...params, outcome: 'pending' });
  },

  /**
   * Get overdue follow-ups
   */
  async getOverdueFollowUps(): Promise<unknown> {
    try {
      const response = await apiHelpers.get('/mtr/followups/overdue');
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getOverdueFollowUps');
    }
  },

  /**
   * Get follow-ups by review
   */
  async getFollowUpsByReview(
    reviewId: string,
    params: Omit<TypedFollowUpSearchParams, 'reviewId'> = {}
  ) {
    return this.getFollowUps({ ...params, reviewId });
  },

  /**
   * Get scheduled follow-ups
   */
  async getScheduledFollowUps(
    params: Omit<TypedFollowUpSearchParams, 'status'> = {}
  ) {
    return this.getFollowUps({ ...params, status: 'scheduled' });
  },

  // ===============================
  // STATISTICS AND REPORTING
  // ===============================

  /**
   * Get MTR statistics
   */
  async getMTRStatistics(dateRange?: {
    start: string;
    end: string;
  }): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }

      const queryString = params.toString();
      const url = `/mtr/statistics${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getMTRStatistics');
    }
  },

  /**
   * Get drug therapy problem statistics
   */
  async getDTPStatistics(dateRange?: {
    start: string;
    end: string;
  }): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }

      const queryString = params.toString();
      const url = `/mtr/problems/statistics${queryString ? `?${queryString}` : ''
        }`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getDTPStatistics');
    }
  },

  /**
   * Get intervention statistics
   */
  async getInterventionStatistics(dateRange?: {
    start: string;
    end: string;
  }): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }

      const queryString = params.toString();
      const url = `/mtr/interventions/statistics${queryString ? `?${queryString}` : ''
        }`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getInterventionStatistics');
    }
  },

  /**
   * Get follow-up statistics
   */
  async getFollowUpStatistics(dateRange?: {
    start: string;
    end: string;
  }): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }

      const queryString = params.toString();
      const url = `/mtr/followups/statistics${queryString ? `?${queryString}` : ''
        }`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getFollowUpStatistics');
    }
  },

  // ===============================
  // AUDIT AND COMPLIANCE
  // ===============================

  /**
   * Get MTR audit logs
   */
  async getAuditLogs(
    params: {
      resourceType?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<unknown> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/audit${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getAuditLogs');
    }
  },

  // ===============================
  // ADDITIONAL UTILITY METHODS
  // ===============================

  /**
   * Validate MTR session data before submission
   */
  validateMTRSession(sessionData: Partial<MedicationTherapyReview>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!sessionData.patientId?.trim()) {
      errors.push('Patient ID is required');
    }

    if (sessionData.medications) {
      sessionData.medications.forEach((med, index) => {
        const medErrors = validateMedicationEntry(med);
        if (medErrors.length > 0) {
          errors.push(`Medication ${index + 1}: ${medErrors.join(', ')}`);
        }
      });
    }

    if (sessionData.plan) {
      const planErrors = validateTherapyPlan(sessionData.plan, false);
      errors.push(...planErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get MTR session summary for dashboard display
   */
  async getMTRSummary(sessionId: string): Promise<{
    session: MedicationTherapyReview;
    problemsCount: number;
    interventionsCount: number;
    followUpsCount: number;
    completionPercentage: number;
    isOverdue: boolean;
  }> {
    try {
      const [session, problems, interventions, followUps] = await Promise.all([
        this.getMTRSession(sessionId),
        this.getDrugTherapyProblems({ reviewId: sessionId }),
        this.getInterventions({ reviewId: sessionId }),
        this.getFollowUps({ reviewId: sessionId }),
      ]);

      return {
        session: session.review,
        problemsCount: problems.total || 0,
        interventionsCount: interventions.total || 0,
        followUpsCount: followUps.total || 0,
        completionPercentage: calculateCompletionPercentage(session.review),
        isOverdue: isOverdue(session.review),
      };
    } catch (error) {
      return handleMTRError(error, 'getMTRSummary');
    }
  },

  /**
   * Bulk update MTR sessions status
   */
  async bulkUpdateMTRStatus(
    sessionIds: string[],
    status: MedicationTherapyReview['status']
  ): Promise<{ updated: number; failed: string[] }> {
    try {
      if (!sessionIds || sessionIds.length === 0) {
        throw new MTRValidationError('Session IDs are required');
      }

      const validStatuses = [
        'in_progress',
        'completed',
        'cancelled',
        'on_hold',
      ];
      if (!validStatuses.includes(status)) {
        throw new MTRValidationError(
          `Invalid status: ${status}. Valid statuses: ${validStatuses.join(
            ', '
          )}`
        );
      }

      const response = await apiHelpers.post('/mtr/bulk-update-status', {
        sessionIds,
        status}

      return response.data.data as { updated: number; failed: string[] };
    } catch (error) {
      return handleMTRError(error, 'bulkUpdateMTRStatus');
    }
  },

  // ===============================
  // REPORTS AND ANALYTICS
  // ===============================

  /**
   * Get MTR summary report
   */
  async getMTRSummaryReport(
    params: {
      startDate?: string;
      endDate?: string;
      pharmacistId?: string;
      reviewType?: string;
      priority?: string;
    } = {}
  ): Promise<unknown> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/reports/summary${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getMTRSummaryReport');
    }
  },

  /**
   * Get intervention effectiveness report
   */
  async getInterventionEffectivenessReport(
    params: {
      startDate?: string;
      endDate?: string;
      pharmacistId?: string;
      interventionType?: string;
    } = {}
  ): Promise<unknown> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/reports/interventions${queryString ? `?${queryString}` : ''
        }`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getInterventionEffectivenessReport');
    }
  },

  /**
   * Get pharmacist performance report
   */
  async getPharmacistPerformanceReport(
    params: {
      startDate?: string;
      endDate?: string;
      pharmacistId?: string;
    } = {}
  ): Promise<unknown> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/reports/pharmacists${queryString ? `?${queryString}` : ''
        }`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getPharmacistPerformanceReport');
    }
  },

  /**
   * Get quality assurance report
   */
  async getQualityAssuranceReport(
    params: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<unknown> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/reports/quality${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get(url);
      return response.data?.data || response.data;
    } catch (error) {
      return handleMTRError(error, 'getQualityAssuranceReport');
    }
  },

  /**
   * Get outcome metrics report
   */
  async getOutcomeMetricsReport(
    params: {
      startDate?: string;
      endDate?: string;
      reviewType?: string;
    } = {}
  ): Promise<Record<string, unknown>> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/reports/outcomes${queryString ? `?${queryString}` : ''
        }`;

      const response = await apiHelpers.get(url);
      const responseData = response.data?.data || response.data || {};
      return responseData as Record<string, unknown>;
    } catch (error) {
      return handleMTRError(error, 'getOutcomeMetricsReport');
    }
  },

  /**
   * Export MTR data for reporting
   */
  async exportMTRData(params: {
    sessionIds?: string[];
    dateRange?: { start: string; end: string };
    format?: 'json' | 'csv' | 'pdf';
    includeAuditLog?: boolean;
  }): Promise<Blob> {
    try {
      const searchParams = formatSearchParams(params as SearchParamsType);
      const queryString = searchParams.toString();
      const url = `/mtr/export${queryString ? `?${queryString}` : ''}`;

      const response = await apiHelpers.get(url);

      // Handle blob response for file downloads
      if (response.data instanceof Blob) {
        return response.data;
      }

      // Convert JSON response to blob if needed
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'}

      return blob;
    } catch (error) {
      return handleMTRError(error, 'exportMTRData');
    }
  },

  /**
   * Check system health for MTR module
   */
  async checkMTRHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    try {
      const response = await apiHelpers.get('/mtr/health');
      return response.data.data as {
        status: 'healthy' | 'degraded' | 'unhealthy';
        checks: Record<string, boolean>;
        timestamp: string;
      };
    } catch (error) {
      return handleMTRError(error, 'checkMTRHealth');
    }
  },
};

export default mtrService;
