import { z } from 'zod';

/**
 * Follow-up Task Management Validation Schemas
 * Comprehensive Zod schemas for all Follow-up Task API endpoints
 */

// Common validation patterns
const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// Follow-up task types enum
export const FOLLOWUP_TYPES = [
  'medication_start_followup',
  'lab_result_review',
  'hospital_discharge_followup',
  'medication_change_followup',
  'chronic_disease_monitoring',
  'adherence_check',
  'refill_reminder',
  'preventive_care',
  'general_followup',
] as const;

// Priority levels enum
export const PRIORITY_LEVELS = [
  'low',
  'medium',
  'high',
  'urgent',
  'critical',
] as const;

// Follow-up status enum
export const FOLLOWUP_STATUS = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'overdue',
  'converted_to_appointment',
] as const;

// Trigger types enum
export const TRIGGER_TYPES = [
  'manual',
  'medication_start',
  'lab_result',
  'hospital_discharge',
  'medication_change',
  'scheduled_monitoring',
  'missed_appointment',
  'system_rule',
] as const;

// ===============================
// FOLLOW-UP TASK SCHEMAS
// ===============================

export const createFollowUpSchema = z.object({
  patientId: mongoIdSchema,
  type: z.enum(FOLLOWUP_TYPES),
  title: z.string().min(1).max(200).trim(),
  description: z.string().min(1).max(2000).trim(),
  objectives: z.array(z.string().max(200)).optional(),
  priority: z.enum(PRIORITY_LEVELS),
  dueDate: z.string().datetime(),
  estimatedDuration: z.number().int().min(5).max(120).optional(),
  assignedTo: mongoIdSchema.optional(),
  trigger: z.object({
    type: z.enum(TRIGGER_TYPES),
    sourceId: mongoIdSchema.optional(),
    sourceType: z.string().max(50).optional(),
    triggerDate: z.string().datetime().optional(),
    triggerDetails: z.record(z.any()).optional(),
  }),
  relatedRecords: z
    .object({
      medicationId: mongoIdSchema.optional(),
      labResultId: mongoIdSchema.optional(),
      clinicalInterventionId: mongoIdSchema.optional(),
      mtrSessionId: mongoIdSchema.optional(),
      appointmentId: mongoIdSchema.optional(),
    })
    .optional(),
});

export const updateFollowUpSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().min(1).max(2000).trim().optional(),
  objectives: z.array(z.string().max(200)).optional(),
  priority: z.enum(PRIORITY_LEVELS).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedDuration: z.number().int().min(5).max(120).optional(),
  assignedTo: mongoIdSchema.optional(),
  status: z.enum(FOLLOWUP_STATUS).optional(),
});

export const completeFollowUpSchema = z.object({
  outcome: z.object({
    status: z.enum(['successful', 'partially_successful', 'unsuccessful']),
    notes: z.string().min(1).max(2000).trim(),
    nextActions: z.array(z.string().max(200)).optional(),
    appointmentCreated: z.boolean().optional(),
    appointmentId: mongoIdSchema.optional(),
  }),
});

export const convertToAppointmentSchema = z.object({
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format'),
  duration: z.number().int().min(5).max(120),
  type: z.enum([
    'mtm_session',
    'chronic_disease_review',
    'new_medication_consultation',
    'vaccination',
    'health_check',
    'smoking_cessation',
    'general_followup',
  ]),
  description: z.string().max(1000).trim().optional(),
});

export const escalateFollowUpSchema = z.object({
  newPriority: z.enum(PRIORITY_LEVELS),
  reason: z.string().min(1).max(500).trim(),
});

export const followUpParamsSchema = z.object({
  id: mongoIdSchema,
});

export const followUpQuerySchema = z.object({
  status: z.enum(FOLLOWUP_STATUS).optional(),
  priority: z.enum(PRIORITY_LEVELS).optional(),
  type: z.enum(FOLLOWUP_TYPES).optional(),
  assignedTo: mongoIdSchema.optional(),
  patientId: mongoIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  overdue: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val) || 50))),
  cursor: z.string().optional(),
});

/**
 * Validation middleware factory
 */
export const validateRequest = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(data);
      
      // Replace the original data with validated data
      if (source === 'body') req.body = validated;
      else if (source === 'query') req.query = validated;
      else req.params = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
