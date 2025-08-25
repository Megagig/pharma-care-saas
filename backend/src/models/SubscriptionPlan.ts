import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  priceNGN: number;
  billingInterval: 'monthly' | 'yearly';
  tier: 'free_trial' | 'basic' | 'pro' | 'enterprise';
  trialDuration?: number;
  popularPlan: boolean;
  features: {
    patientLimit: number | null;
    reminderSmsMonthlyLimit: number | null;
    reportsExport: boolean;
    careNoteExport: boolean;
    adrModule: boolean;
    multiUserSupport: boolean;
    teamSize: number | null;
    apiAccess: boolean;
    auditLogs: boolean;
    dataBackup: boolean;
    clinicalNotesLimit: number | null;
    patientRecordsLimit?: number | null;
    prioritySupport: boolean;
    emailReminders: boolean;
    smsReminders: boolean;
    advancedReports: boolean;
    drugTherapyManagement: boolean;
    teamManagement: boolean;
    dedicatedSupport: boolean;
    integrations?: boolean;
    customIntegrations?: boolean;
  };
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    priceNGN: {
      type: Number,
      required: [true, 'Price in NGN is required'],
      min: 0,
    },
    billingInterval: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    tier: {
      type: String,
      enum: ['free_trial', 'basic', 'pro', 'enterprise'],
      required: true,
    },
    trialDuration: {
      type: Number,
      default: null,
    },
    popularPlan: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: {
      patientLimit: {
        type: Number,
        default: null, // null means unlimited
      },
      reminderSmsMonthlyLimit: {
        type: Number,
        default: null, // null means unlimited
      },
      reportsExport: {
        type: Boolean,
        default: false,
      },
      careNoteExport: {
        type: Boolean,
        default: false,
      },
      adrModule: {
        type: Boolean,
        default: false,
      },
      multiUserSupport: {
        type: Boolean,
        default: false,
      },
      teamSize: {
        type: Number,
        default: 1,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      auditLogs: {
        type: Boolean,
        default: false,
      },
      dataBackup: {
        type: Boolean,
        default: false,
      },
      clinicalNotesLimit: {
        type: Number,
        default: null,
      },
      patientRecordsLimit: {
        type: Number,
        default: null,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      emailReminders: {
        type: Boolean,
        default: true,
      },
      smsReminders: {
        type: Boolean,
        default: false,
      },
      advancedReports: {
        type: Boolean,
        default: false,
      },
      drugTherapyManagement: {
        type: Boolean,
        default: false,
      },
      teamManagement: {
        type: Boolean,
        default: false,
      },
      dedicatedSupport: {
        type: Boolean,
        default: false,
      },
      integrations: {
        type: Boolean,
        default: false,
      },
      customIntegrations: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
