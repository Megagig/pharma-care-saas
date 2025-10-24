import mongoose, { Document, Schema } from 'mongoose';
import { tenancyGuardPlugin, addAuditFields } from '../utils/tenancyGuard';

export interface IFollowUpTask extends Document {
  _id: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId;
  locationId?: string;
  
  // Patient and assignment
  patientId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  
  // Task details
  type: 'medication_start_followup' | 'lab_result_review' | 'hospital_discharge_followup' |
        'medication_change_followup' | 'chronic_disease_monitoring' | 'adherence_check' |
        'refill_reminder' | 'preventive_care' | 'general_followup';
  title: string;
  description: string;
  objectives: string[];
  
  // Priority and scheduling
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  dueDate: Date;
  estimatedDuration?: number;
  
  // Status tracking
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue' | 'converted_to_appointment';
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  
  // Outcome
  outcome?: {
    status: 'successful' | 'partially_successful' | 'unsuccessful';
    notes: string;
    nextActions: string[];
    appointmentCreated: boolean;
    appointmentId?: mongoose.Types.ObjectId;
  };
  
  // Trigger information
  trigger: {
    type: 'manual' | 'medication_start' | 'lab_result' | 'hospital_discharge' |
          'medication_change' | 'scheduled_monitoring' | 'missed_appointment' | 'system_rule';
    sourceId?: mongoose.Types.ObjectId;
    sourceType?: string;
    triggerDate: Date;
    triggerDetails?: Record<string, any>;
  };
  
  // Related records
  relatedRecords: {
    medicationId?: mongoose.Types.ObjectId;
    labResultId?: mongoose.Types.ObjectId;
    clinicalInterventionId?: mongoose.Types.ObjectId;
    mtrSessionId?: mongoose.Types.ObjectId;
    appointmentId?: mongoose.Types.ObjectId;
  };
  
  // Escalation tracking
  escalationHistory: Array<{
    escalatedAt: Date;
    escalatedBy: mongoose.Types.ObjectId;
    fromPriority: string;
    toPriority: string;
    reason: string;
  }>;
  
  // Reminders
  remindersSent: Array<{
    sentAt: Date;
    channel: 'email' | 'sms' | 'push' | 'system';
    recipientId: mongoose.Types.ObjectId;
  }>;
  
  // Audit fields
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  escalate(
    newPriority: IFollowUpTask['priority'],
    reason: string,
    escalatedBy: mongoose.Types.ObjectId
  ): void;
  complete(
    outcome: IFollowUpTask['outcome'],
    completedBy: mongoose.Types.ObjectId
  ): void;
  convertToAppointment(appointmentId: mongoose.Types.ObjectId): void;
  addReminder(
    channel: 'email' | 'sms' | 'push' | 'system',
    recipientId: mongoose.Types.ObjectId
  ): void;
  isCriticallyOverdue(days?: number): boolean;
}

const followUpTaskSchema = new Schema(
  {
    workplaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workplace',
      required: [true, 'Workplace ID is required'],
      index: true,
    },
    locationId: {
      type: String,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned pharmacist is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'medication_start_followup',
        'lab_result_review',
        'hospital_discharge_followup',
        'medication_change_followup',
        'chronic_disease_monitoring',
        'adherence_check',
        'refill_reminder',
        'preventive_care',
        'general_followup',
      ],
      required: [true, 'Follow-up type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    objectives: {
      type: [String],
      validate: {
        validator: function (objectives: string[]) {
          return objectives && objectives.length > 0 && objectives.length <= 10;
        },
        message: 'Must have 1-10 objectives',
      },
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'critical'],
      default: 'medium',
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
      validate: {
        validator: function (value: Date) {
          return value instanceof Date && !isNaN(value.getTime());
        },
        message: 'Invalid due date',
      },
    },
    estimatedDuration: {
      type: Number,
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 8 hours'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled', 'overdue', 'converted_to_appointment'],
      default: 'pending',
      required: true,
      index: true,
    },
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    outcome: {
      status: {
        type: String,
        enum: ['successful', 'partially_successful', 'unsuccessful'],
      },
      notes: {
        type: String,
        maxlength: [2000, 'Outcome notes cannot exceed 2000 characters'],
      },
      nextActions: [String],
      appointmentCreated: {
        type: Boolean,
        default: false,
      },
      appointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment',
      },
    },
    trigger: {
      type: {
        type: String,
        enum: [
          'manual',
          'medication_start',
          'lab_result',
          'hospital_discharge',
          'medication_change',
          'scheduled_monitoring',
          'missed_appointment',
          'system_rule',
        ],
        required: true,
      },
      sourceId: {
        type: Schema.Types.ObjectId,
      },
      sourceType: String,
      triggerDate: {
        type: Date,
        required: true,
      },
      triggerDetails: Schema.Types.Mixed,
    },
    relatedRecords: {
      medicationId: {
        type: Schema.Types.ObjectId,
        ref: 'Medication',
      },
      labResultId: {
        type: Schema.Types.ObjectId,
      },
      clinicalInterventionId: {
        type: Schema.Types.ObjectId,
        ref: 'ClinicalIntervention',
      },
      mtrSessionId: {
        type: Schema.Types.ObjectId,
        ref: 'MedicationTherapyReview',
      },
      appointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment',
      },
    },
    escalationHistory: [
      {
        escalatedAt: {
          type: Date,
          required: true,
        },
        escalatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        fromPriority: {
          type: String,
          required: true,
        },
        toPriority: {
          type: String,
          required: true,
        },
        reason: {
          type: String,
          required: true,
          maxlength: [500, 'Escalation reason cannot exceed 500 characters'],
        },
      },
    ],
    remindersSent: [
      {
        sentAt: {
          type: Date,
          required: true,
        },
        channel: {
          type: String,
          enum: ['email', 'sms', 'push', 'system'],
          required: true,
        },
        recipientId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add audit fields
addAuditFields(followUpTaskSchema);

// Apply tenancy guard plugin
followUpTaskSchema.plugin(tenancyGuardPlugin, { pharmacyIdField: 'workplaceId' });

// Compound indexes for efficient querying
followUpTaskSchema.index({ workplaceId: 1, status: 1, dueDate: 1 });
followUpTaskSchema.index({ workplaceId: 1, patientId: 1, status: 1 });
followUpTaskSchema.index({ workplaceId: 1, assignedTo: 1, status: 1, priority: -1 });
followUpTaskSchema.index({ workplaceId: 1, type: 1, status: 1 });
followUpTaskSchema.index({ status: 1, dueDate: 1 });
followUpTaskSchema.index({ 'trigger.type': 1, 'trigger.sourceId': 1 });
followUpTaskSchema.index({ createdAt: -1 });

// Virtual for patient details
followUpTaskSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for assigned pharmacist details
followUpTaskSchema.virtual('pharmacist', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
});

// Virtual for is overdue
followUpTaskSchema.virtual('isOverdue').get(function (this: IFollowUpTask) {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  
  return this.dueDate < new Date();
});

// Virtual for days until due
followUpTaskSchema.virtual('daysUntilDue').get(function (this: IFollowUpTask) {
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for days overdue
followUpTaskSchema.virtual('daysOverdue').get(function (this: IFollowUpTask) {
  if (!this.get('isOverdue')) return 0;
  
  const now = new Date();
  const diffTime = now.getTime() - this.dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for escalation count
followUpTaskSchema.virtual('escalationCount').get(function (this: IFollowUpTask) {
  return this.escalationHistory?.length || 0;
});

// Virtual for has been escalated
followUpTaskSchema.virtual('hasBeenEscalated').get(function (this: IFollowUpTask) {
  return this.escalationHistory && this.escalationHistory.length > 0;
});

// Pre-save validation and auto-status update
followUpTaskSchema.pre('save', function (this: IFollowUpTask) {
  // Trim and filter empty objectives
  if (this.objectives) {
    this.objectives = this.objectives
      .map((obj) => obj.trim())
      .filter((obj) => obj.length > 0);
  }
  
  // Auto-update status to overdue if past due date
  if (
    this.status === 'pending' &&
    this.dueDate < new Date()
  ) {
    this.status = 'overdue';
  }
  
  // Validate outcome is provided when status is completed
  if (this.status === 'completed' && !this.outcome) {
    throw new Error('Outcome is required when marking task as completed');
  }
  
  // Validate objectives
  if (!this.objectives || this.objectives.length === 0) {
    throw new Error('At least one objective is required');
  }
});

// Static method to find tasks by patient
followUpTaskSchema.statics.findByPatient = function (
  patientId: mongoose.Types.ObjectId,
  options?: { status?: string; limit?: number; workplaceId?: mongoose.Types.ObjectId }
) {
  const query: any = { patientId };
  
  if (options?.status) {
    query.status = options.status;
  }
  
  let baseQuery;
  if (options?.workplaceId) {
    baseQuery = this.find(query).setOptions({ workplaceId: options.workplaceId });
  } else {
    baseQuery = this.find(query);
  }
  
  baseQuery = baseQuery.sort({ priority: -1, dueDate: 1 });
  
  if (options?.limit) {
    baseQuery = baseQuery.limit(options.limit);
  }
  
  return baseQuery;
};

// Static method to find tasks by pharmacist
followUpTaskSchema.statics.findByPharmacist = function (
  pharmacistId: mongoose.Types.ObjectId,
  options?: { status?: string; priority?: string; workplaceId?: mongoose.Types.ObjectId }
) {
  const query: any = { assignedTo: pharmacistId };
  
  if (options?.status) {
    query.status = options.status;
  }
  
  if (options?.priority) {
    query.priority = options.priority;
  }
  
  if (options?.workplaceId) {
    return this.find(query)
      .setOptions({ workplaceId: options.workplaceId })
      .sort({ priority: -1, dueDate: 1 });
  }
  
  return this.find(query).sort({ priority: -1, dueDate: 1 });
};

// Static method to find overdue tasks
followUpTaskSchema.statics.findOverdue = function (
  workplaceId?: mongoose.Types.ObjectId
) {
  const query = {
    dueDate: { $lt: new Date() },
    status: { $in: ['pending', 'in_progress', 'overdue'] },
  };
  
  if (workplaceId) {
    return this.find(query)
      .setOptions({ workplaceId })
      .sort({ priority: -1, dueDate: 1 });
  }
  
  return this.find(query).sort({ priority: -1, dueDate: 1 });
};

// Static method to find due soon tasks
followUpTaskSchema.statics.findDueSoon = function (
  days: number = 3,
  workplaceId?: mongoose.Types.ObjectId
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  futureDate.setHours(23, 59, 59, 999);
  
  const query = {
    dueDate: { $gte: today, $lte: futureDate },
    status: { $in: ['pending', 'in_progress'] },
  };
  
  if (workplaceId) {
    return this.find(query)
      .setOptions({ workplaceId })
      .sort({ priority: -1, dueDate: 1 });
  }
  
  return this.find(query).sort({ priority: -1, dueDate: 1 });
};

// Static method to find by trigger
followUpTaskSchema.statics.findByTrigger = function (
  triggerType: string,
  sourceId: mongoose.Types.ObjectId,
  workplaceId?: mongoose.Types.ObjectId
) {
  const query = {
    'trigger.type': triggerType,
    'trigger.sourceId': sourceId,
  };
  
  if (workplaceId) {
    return this.find(query).setOptions({ workplaceId });
  }
  
  return this.find(query);
};

// Instance method to escalate priority
followUpTaskSchema.methods.escalate = function (
  this: IFollowUpTask,
  newPriority: IFollowUpTask['priority'],
  reason: string,
  escalatedBy: mongoose.Types.ObjectId
) {
  const oldPriority = this.priority;
  
  this.escalationHistory.push({
    escalatedAt: new Date(),
    escalatedBy,
    fromPriority: oldPriority,
    toPriority: newPriority,
    reason,
  });
  
  this.priority = newPriority;
};

// Instance method to complete task
followUpTaskSchema.methods.complete = function (
  this: IFollowUpTask,
  outcome: IFollowUpTask['outcome'],
  completedBy: mongoose.Types.ObjectId
) {
  this.status = 'completed';
  this.outcome = outcome;
  this.completedAt = new Date();
  this.completedBy = completedBy;
};

// Instance method to convert to appointment
followUpTaskSchema.methods.convertToAppointment = function (
  this: IFollowUpTask,
  appointmentId: mongoose.Types.ObjectId
) {
  this.status = 'converted_to_appointment';
  
  if (!this.outcome) {
    this.outcome = {
      status: 'successful',
      notes: 'Converted to appointment',
      nextActions: [],
      appointmentCreated: true,
      appointmentId,
    };
  } else {
    this.outcome.appointmentCreated = true;
    this.outcome.appointmentId = appointmentId;
  }
  
  if (!this.relatedRecords) {
    this.relatedRecords = {};
  }
  this.relatedRecords.appointmentId = appointmentId;
};

// Instance method to add reminder
followUpTaskSchema.methods.addReminder = function (
  this: IFollowUpTask,
  channel: 'email' | 'sms' | 'push' | 'system',
  recipientId: mongoose.Types.ObjectId
) {
  this.remindersSent.push({
    sentAt: new Date(),
    channel,
    recipientId,
  });
};

// Instance method to check if critically overdue
followUpTaskSchema.methods.isCriticallyOverdue = function (
  this: IFollowUpTask,
  days: number = 7
): boolean {
  const daysOverdue = this.get('daysOverdue');
  return daysOverdue > days;
};

export default mongoose.model<IFollowUpTask>('FollowUpTask', followUpTaskSchema);
