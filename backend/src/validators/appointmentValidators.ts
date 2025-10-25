import { z } from 'zod';

/**
 * Appointment Management Validation Schemas
 * Comprehensive Zod schemas for all Appointment Management API endpoints
 */

// Common validation patterns
const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format

// Appointment types enum
export const APPOINTMENT_TYPES = [
  'mtm_session',
  'chronic_disease_review',
  'new_medication_consultation',
  'vaccination',
  'health_check',
  'smoking_cessation',
  'general_followup',
] as const;

// Appointment status enum
export const APPOINTMENT_STATUS = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled',
] as const;

// Recurrence frequency enum
export const RECURRENCE_FREQUENCY = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
] as const;

// ===============================
// APPOINTMENT SCHEMAS
// ===============================

export const createAppointmentSchema = z.object({
  patientId: mongoIdSchema,
  type: z.enum(APPOINTMENT_TYPES),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  duration: z.number().int().min(5).max(120),
  assignedTo: mongoIdSchema.optional(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  locationId: z.string().max(100).optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrencePattern: z
    .object({
      frequency: z.enum(RECURRENCE_FREQUENCY),
      interval: z.number().int().min(1).max(12),
      endDate: z.string().datetime().optional(),
      endAfterOccurrences: z.number().int().min(1).max(100).optional(),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
    })
    .optional(),
  patientPreferences: z
    .object({
      preferredChannel: z.enum(['email', 'sms', 'whatsapp', 'phone']).optional(),
      language: z.string().max(10).optional(),
      specialRequirements: z.string().max(500).optional(),
    })
    .optional(),
});

export const updateAppointmentSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().regex(timeRegex, 'Time must be in HH:mm format').optional(),
  duration: z.number().int().min(5).max(120).optional(),
  assignedTo: mongoIdSchema.optional(),
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  updateType: z.enum(['this_only', 'this_and_future']).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUS),
  reason: z.string().min(1).max(500).trim().optional(),
  outcome: z
    .object({
      status: z.enum(['successful', 'partially_successful', 'unsuccessful']),
      notes: z.string().max(2000).trim(),
      nextActions: z.array(z.string().max(200)).optional(),
      visitCreated: z.boolean().optional(),
      visitId: mongoIdSchema.optional(),
    })
    .optional(),
});

export const rescheduleAppointmentSchema = z.object({
  newDate: z.string().datetime(),
  newTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  reason: z.string().min(1).max(500).trim(),
  notifyPatient: z.boolean().optional().default(true),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(1).max(500).trim(),
  notifyPatient: z.boolean().optional().default(true),
  cancelType: z.enum(['this_only', 'all_future']).optional().default('this_only'),
});

export const confirmAppointmentSchema = z.object({
  confirmationToken: z.string().optional(),
});

export const appointmentParamsSchema = z.object({
  id: mongoIdSchema,
});

export const appointmentQuerySchema = z.object({
  view: z.enum(['day', 'week', 'month']).optional(),
  date: z.string().datetime().optional(),
  pharmacistId: mongoIdSchema.optional(),
  locationId: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUS).optional(),
  type: z.enum(APPOINTMENT_TYPES).optional(),
  patientId: mongoIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val) || 50))),
  cursor: z.string().optional(),
});

export const availableSlotsQuerySchema = z.object({
  date: z.string().datetime(),
  pharmacistId: mongoIdSchema.optional(),
  duration: z
    .string()
    .optional()
    .default('30')
    .transform((val) => parseInt(val) || 30),
  type: z.enum(APPOINTMENT_TYPES).optional(),
  locationId: z.string().optional(),
});

export const upcomingAppointmentsQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .default('7')
    .transform((val) => Math.min(30, Math.max(1, parseInt(val) || 7))),
  pharmacistId: mongoIdSchema.optional(),
  locationId: z.string().optional(),
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
