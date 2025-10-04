import mongoose, { Document, Schema } from 'mongoose';

export interface IRuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
}

export interface INotificationAction {
  channel: 'email' | 'sms' | 'push' | 'whatsapp' | 'inApp';
  templateId: mongoose.Types.ObjectId;
  delay: number; // in minutes
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipients: {
    type: 'user' | 'role' | 'workspace' | 'custom';
    values: string[];
  };
}

export interface INotificationRule extends Document {
  name: string;
  description?: string;
  workspaceId?: mongoose.Types.ObjectId;
  trigger: string; // Event that triggers the rule
  conditions: IRuleCondition[];
  actions: INotificationAction[];
  isActive: boolean;
  priority: number; // Higher number = higher priority
  cooldownPeriod: number; // in minutes, prevents spam
  maxExecutionsPerDay: number;
  executionCount: {
    today: number;
    lastReset: Date;
  };
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy: mongoose.Types.ObjectId;
  lastExecuted?: Date;
  executionHistory: {
    executedAt: Date;
    success: boolean;
    errorMessage?: string;
    recipientCount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ruleConditionSchema = new Schema<IRuleCondition>({
  field: {
    type: String,
    required: true,
  },
  operator: {
    type: String,
    enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in'],
    required: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'date', 'array'],
    required: true,
  },
}, { _id: false });

const notificationActionSchema = new Schema<INotificationAction>({
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'whatsapp', 'inApp'],
    required: true,
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'NotificationTemplate',
    required: true,
  },
  delay: {
    type: Number,
    required: true,
    min: 0,
    max: 10080, // 7 days in minutes
    default: 0,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    required: true,
    default: 'medium',
  },
  recipients: {
    type: {
      type: String,
      enum: ['user', 'role', 'workspace', 'custom'],
      required: true,
    },
    values: [{
      type: String,
      required: true,
    }],
  },
}, { _id: false });

const executionHistorySchema = new Schema({
  executedAt: {
    type: Date,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
  },
  recipientCount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const notificationRuleSchema = new Schema<INotificationRule>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workplace',
      index: true,
    },
    trigger: {
      type: String,
      required: true,
      index: true,
    },
    conditions: [ruleConditionSchema],
    actions: {
      type: [notificationActionSchema],
      validate: {
        validator: function(actions: INotificationAction[]) {
          return actions.length > 0;
        },
        message: 'At least one action is required',
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 50,
    },
    cooldownPeriod: {
      type: Number,
      required: true,
      min: 0,
      max: 1440, // 24 hours in minutes
      default: 0,
    },
    maxExecutionsPerDay: {
      type: Number,
      required: true,
      min: 1,
      max: 10000,
      default: 100,
    },
    executionCount: {
      today: {
        type: Number,
        required: true,
        default: 0,
      },
      lastReset: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
    tags: [{
      type: String,
      trim: true,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastExecuted: {
      type: Date,
    },
    executionHistory: {
      type: [executionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'notificationrules',
  }
);

// Compound indexes
notificationRuleSchema.index({ trigger: 1, isActive: 1 });
notificationRuleSchema.index({ workspaceId: 1, isActive: 1 });
notificationRuleSchema.index({ priority: -1, isActive: 1 });
notificationRuleSchema.index({ tags: 1, isActive: 1 });
notificationRuleSchema.index({ createdBy: 1, updatedAt: -1 });

// Methods
notificationRuleSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

notificationRuleSchema.methods.canExecute = function (): { canExecute: boolean; reason?: string } {
  if (!this.isActive) {
    return { canExecute: false, reason: 'Rule is inactive' };
  }

  // Check daily execution limit
  const today = new Date();
  const lastReset = new Date(this.executionCount.lastReset);
  
  // Reset counter if it's a new day
  if (today.toDateString() !== lastReset.toDateString()) {
    this.executionCount.today = 0;
    this.executionCount.lastReset = today;
  }

  if (this.executionCount.today >= this.maxExecutionsPerDay) {
    return { canExecute: false, reason: 'Daily execution limit reached' };
  }

  // Check cooldown period
  if (this.lastExecuted && this.cooldownPeriod > 0) {
    const timeSinceLastExecution = (Date.now() - this.lastExecuted.getTime()) / (1000 * 60); // in minutes
    if (timeSinceLastExecution < this.cooldownPeriod) {
      return { canExecute: false, reason: 'Still in cooldown period' };
    }
  }

  return { canExecute: true };
};

notificationRuleSchema.methods.evaluateConditions = function (eventData: Record<string, any>): boolean {
  if (this.conditions.length === 0) return true;

  return this.conditions.every((condition: IRuleCondition) => {
    const fieldValue = this.getNestedValue(eventData, condition.field);
    return this.evaluateCondition(fieldValue, condition);
  });
};

notificationRuleSchema.methods.getNestedValue = function (obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

notificationRuleSchema.methods.evaluateCondition = function (fieldValue: any, condition: IRuleCondition): boolean {
  const { operator, value, dataType } = condition;

  // Type conversion based on dataType
  let convertedFieldValue = fieldValue;
  let convertedConditionValue = value;

  switch (dataType) {
    case 'number':
      convertedFieldValue = Number(fieldValue);
      convertedConditionValue = Number(value);
      break;
    case 'boolean':
      convertedFieldValue = Boolean(fieldValue);
      convertedConditionValue = Boolean(value);
      break;
    case 'date':
      convertedFieldValue = new Date(fieldValue);
      convertedConditionValue = new Date(value);
      break;
  }

  switch (operator) {
    case 'equals':
      return convertedFieldValue === convertedConditionValue;
    case 'not_equals':
      return convertedFieldValue !== convertedConditionValue;
    case 'contains':
      return String(convertedFieldValue).includes(String(convertedConditionValue));
    case 'not_contains':
      return !String(convertedFieldValue).includes(String(convertedConditionValue));
    case 'greater_than':
      return convertedFieldValue > convertedConditionValue;
    case 'less_than':
      return convertedFieldValue < convertedConditionValue;
    case 'in':
      return Array.isArray(convertedConditionValue) && convertedConditionValue.includes(convertedFieldValue);
    case 'not_in':
      return Array.isArray(convertedConditionValue) && !convertedConditionValue.includes(convertedFieldValue);
    default:
      return false;
  }
};

notificationRuleSchema.methods.recordExecution = function (success: boolean, recipientCount: number, errorMessage?: string): void {
  this.lastExecuted = new Date();
  this.executionCount.today += 1;
  
  // Keep only last 100 execution records
  if (this.executionHistory.length >= 100) {
    this.executionHistory = this.executionHistory.slice(-99);
  }
  
  this.executionHistory.push({
    executedAt: new Date(),
    success,
    errorMessage,
    recipientCount,
  });
};

notificationRuleSchema.methods.getSuccessRate = function (days: number = 30): number {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recentExecutions = this.executionHistory.filter(
    (execution: any) => execution.executedAt >= cutoffDate
  );
  
  if (recentExecutions.length === 0) return 0;
  
  const successfulExecutions = recentExecutions.filter((execution: any) => execution.success);
  return (successfulExecutions.length / recentExecutions.length) * 100;
};

// Static methods
notificationRuleSchema.statics.findActiveRulesForTrigger = function (trigger: string, workspaceId?: mongoose.Types.ObjectId) {
  const query: any = { trigger, isActive: true };
  if (workspaceId) {
    query.$or = [{ workspaceId }, { workspaceId: null }]; // Include global rules
  } else {
    query.workspaceId = null; // Only global rules
  }
  
  return this.find(query).sort({ priority: -1 });
};

notificationRuleSchema.statics.findRulesByTag = function (tags: string[], workspaceId?: mongoose.Types.ObjectId) {
  const query: any = { tags: { $in: tags }, isActive: true };
  if (workspaceId) {
    query.workspaceId = workspaceId;
  }
  
  return this.find(query).sort({ priority: -1 });
};

notificationRuleSchema.statics.getExecutionStats = function (workspaceId?: mongoose.Types.ObjectId, days: number = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const matchQuery: any = { updatedAt: { $gte: cutoffDate } };
  if (workspaceId) {
    matchQuery.workspaceId = workspaceId;
  }

  return this.aggregate([
    { $match: matchQuery },
    { $unwind: '$executionHistory' },
    { $match: { 'executionHistory.executedAt': { $gte: cutoffDate } } },
    {
      $group: {
        _id: null,
        totalExecutions: { $sum: 1 },
        successfulExecutions: { $sum: { $cond: ['$executionHistory.success', 1, 0] } },
        totalRecipients: { $sum: '$executionHistory.recipientCount' },
        averageRecipientsPerExecution: { $avg: '$executionHistory.recipientCount' },
      },
    },
  ]);
};

export const NotificationRule = mongoose.model<INotificationRule>('NotificationRule', notificationRuleSchema);