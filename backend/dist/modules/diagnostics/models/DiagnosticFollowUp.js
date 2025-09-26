"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const tenancyGuard_1 = require("../../../utils/tenancyGuard");
const followUpReminderSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['email', 'sms', 'push', 'system'],
        required: true
    },
    scheduledFor: {
        type: Date,
        required: true
    },
    sent: {
        type: Boolean,
        default: false
    },
    sentAt: Date,
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: String,
        trim: true,
        maxlength: [500, 'Reminder message cannot exceed 500 characters']
    },
    channel: {
        type: String,
        trim: true,
        maxlength: [50, 'Channel cannot exceed 50 characters']
    }
}, { _id: false });
const followUpOutcomeSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ['successful', 'partially_successful', 'unsuccessful', 'no_show'],
        required: true
    },
    notes: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Outcome notes cannot exceed 2000 characters']
    },
    nextActions: {
        type: [String],
        default: [],
        validate: {
            validator: function (actions) {
                return actions.every(action => action.trim().length > 0 && action.length <= 300);
            },
            message: 'Next actions must be non-empty and not exceed 300 characters each'
        }
    },
    nextFollowUpDate: Date,
    adherenceImproved: Boolean,
    symptomsResolved: {
        type: [String],
        default: []
    },
    newSymptomsIdentified: {
        type: [String],
        default: []
    },
    medicationChanges: [{
            action: {
                type: String,
                enum: ['started', 'stopped', 'modified', 'continued'],
                required: true
            },
            medication: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'Medication name cannot exceed 200 characters']
            },
            reason: {
                type: String,
                required: true,
                trim: true,
                maxlength: [300, 'Reason cannot exceed 300 characters']
            }
        }],
    vitalSigns: {
        bloodPressure: String,
        heartRate: Number,
        temperature: Number,
        bloodGlucose: Number,
        weight: Number
    },
    labResultsReviewed: {
        type: Boolean,
        default: false
    },
    referralMade: {
        specialty: {
            type: String,
            trim: true,
            maxlength: [100, 'Specialty cannot exceed 100 characters']
        },
        urgency: {
            type: String,
            enum: ['immediate', 'within_24h', 'within_week', 'routine']
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [500, 'Referral reason cannot exceed 500 characters']
        }
    }
}, { _id: false });
const diagnosticFollowUpSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    diagnosticRequestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'DiagnosticRequest',
        required: true,
        index: true
    },
    diagnosticResultId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'DiagnosticResult',
        required: true,
        index: true
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['symptom_check', 'medication_review', 'lab_review', 'adherence_check', 'outcome_assessment', 'referral_follow_up'],
        required: true,
        index: true
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
        required: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    objectives: {
        type: [String],
        default: [],
        validate: {
            validator: function (objectives) {
                return objectives.every(obj => obj.trim().length > 0 && obj.length <= 300);
            },
            message: 'Objectives must be non-empty and not exceed 300 characters each'
        }
    },
    scheduledDate: {
        type: Date,
        required: true,
        index: true,
        validate: {
            validator: function (value) {
                return value >= new Date(Date.now() - 60 * 60 * 1000);
            },
            message: 'Scheduled date cannot be more than 1 hour in the past'
        }
    },
    estimatedDuration: {
        type: Number,
        required: true,
        min: [5, 'Duration must be at least 5 minutes'],
        max: [480, 'Duration cannot exceed 8 hours'],
        default: 30
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'missed', 'rescheduled', 'cancelled'],
        default: 'scheduled',
        required: true,
        index: true
    },
    completedAt: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value && this.status === 'completed') {
                    return value >= this.scheduledDate;
                }
                return true;
            },
            message: 'Completion date cannot be before scheduled date'
        },
        index: true
    },
    rescheduledFrom: {
        type: Date,
        index: true
    },
    rescheduledReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Reschedule reason cannot exceed 500 characters']
    },
    reminders: {
        type: [followUpReminderSchema],
        default: []
    },
    outcome: followUpOutcomeSchema,
    relatedDiagnoses: {
        type: [String],
        default: []
    },
    relatedMedications: {
        type: [String],
        default: []
    },
    triggerConditions: [{
            condition: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'Condition cannot exceed 200 characters']
            },
            threshold: {
                type: String,
                required: true,
                trim: true,
                maxlength: [100, 'Threshold cannot exceed 100 characters']
            },
            action: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'Action cannot exceed 200 characters']
            }
        }],
    autoScheduled: {
        type: Boolean,
        default: false,
        index: true
    },
    schedulingRule: {
        basedOn: {
            type: String,
            enum: ['diagnosis_severity', 'medication_type', 'red_flags', 'patient_risk', 'manual']
        },
        interval: {
            type: Number,
            min: [1, 'Interval must be at least 1 day']
        },
        maxFollowUps: {
            type: Number,
            min: [1, 'Max follow-ups must be at least 1']
        },
        conditions: {
            type: [String],
            default: []
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(diagnosticFollowUpSchema);
diagnosticFollowUpSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId'
});
diagnosticFollowUpSchema.index({ workplaceId: 1, diagnosticRequestId: 1, status: 1 });
diagnosticFollowUpSchema.index({ workplaceId: 1, patientId: 1, scheduledDate: 1 });
diagnosticFollowUpSchema.index({ workplaceId: 1, assignedTo: 1, status: 1 });
diagnosticFollowUpSchema.index({ workplaceId: 1, type: 1, priority: 1 });
diagnosticFollowUpSchema.index({ workplaceId: 1, autoScheduled: 1 });
diagnosticFollowUpSchema.index({ workplaceId: 1, isDeleted: 1 });
diagnosticFollowUpSchema.index({ status: 1, scheduledDate: 1 });
diagnosticFollowUpSchema.index({ scheduledDate: 1, assignedTo: 1 });
diagnosticFollowUpSchema.index({ completedAt: -1 }, { sparse: true });
diagnosticFollowUpSchema.index({ createdAt: -1 });
diagnosticFollowUpSchema.index({ 'reminders.scheduledFor': 1, 'reminders.sent': 1 });
diagnosticFollowUpSchema.virtual('daysUntilFollowUp').get(function () {
    if (this.status === 'completed' || this.status === 'cancelled')
        return null;
    const diffTime = this.scheduledDate.getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
diagnosticFollowUpSchema.virtual('daysSinceScheduled').get(function () {
    const diffTime = Math.abs(Date.now() - this.scheduledDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
diagnosticFollowUpSchema.virtual('isOverdue').get(function () {
    if (['completed', 'cancelled'].includes(this.status))
        return false;
    return this.scheduledDate < new Date();
});
diagnosticFollowUpSchema.virtual('reminderStatus').get(function () {
    const totalReminders = this.reminders.length;
    const sentReminders = this.reminders.filter(r => r.sent).length;
    if (totalReminders === 0)
        return 'none';
    if (sentReminders === 0)
        return 'pending';
    if (sentReminders === totalReminders)
        return 'all_sent';
    return 'partial';
});
diagnosticFollowUpSchema.methods.markCompleted = async function (outcome) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.outcome = outcome;
    await this.save();
};
diagnosticFollowUpSchema.methods.scheduleReminder = function (type, scheduledFor) {
    this.reminders.push({
        type: type,
        scheduledFor,
        sent: false
    });
};
diagnosticFollowUpSchema.methods.canReschedule = function () {
    return ['scheduled', 'missed'].includes(this.status);
};
diagnosticFollowUpSchema.methods.reschedule = function (newDate, reason) {
    if (!this.canReschedule()) {
        throw new Error('Follow-up cannot be rescheduled in current status');
    }
    this.rescheduledFrom = this.scheduledDate;
    this.scheduledDate = newDate;
    this.status = 'scheduled';
    if (reason) {
        this.rescheduledReason = reason;
    }
    this.reminders = [];
    this.scheduleDefaultReminders();
};
diagnosticFollowUpSchema.methods.scheduleDefaultReminders = function () {
    const reminderTimes = [
        { days: 1, type: 'system' },
        { hours: 2, type: 'email' }
    ];
    reminderTimes.forEach(({ days, hours, type }) => {
        const reminderTime = new Date(this.scheduledDate);
        if (days) {
            reminderTime.setDate(reminderTime.getDate() - days);
        }
        else if (hours) {
            reminderTime.setHours(reminderTime.getHours() - hours);
        }
        if (reminderTime > new Date()) {
            this.scheduleReminder(type, reminderTime);
        }
    });
};
diagnosticFollowUpSchema.methods.calculateNextFollowUp = function () {
    if (!this.schedulingRule || !this.outcome)
        return null;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + this.schedulingRule.interval);
    if (this.schedulingRule.maxFollowUps) {
    }
    return nextDate;
};
diagnosticFollowUpSchema.pre('save', function () {
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    if (this.isModified('status') && this.status !== 'completed') {
        this.completedAt = undefined;
    }
    if (this.status === 'completed' && (!this.outcome || !this.outcome.status)) {
        throw new Error('Outcome is required when follow-up is completed');
    }
    if (this.isNew && this.status === 'scheduled' && this.reminders.length === 0) {
        this.scheduleDefaultReminders();
    }
    if (this.priority === 'high' && this.objectives.length === 0) {
        throw new Error('High priority follow-ups must have at least one objective');
    }
});
diagnosticFollowUpSchema.statics.findByDiagnosticRequest = function (diagnosticRequestId, workplaceId) {
    const query = { diagnosticRequestId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1 });
};
diagnosticFollowUpSchema.statics.findByPatient = function (patientId, workplaceId) {
    const query = { patientId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: -1 });
};
diagnosticFollowUpSchema.statics.findScheduled = function (workplaceId, dateRange) {
    const query = { status: 'scheduled' };
    if (dateRange) {
        query.scheduledDate = {
            $gte: dateRange.start,
            $lte: dateRange.end
        };
    }
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1, priority: 1 });
};
diagnosticFollowUpSchema.statics.findOverdue = function (workplaceId) {
    const query = {
        status: { $in: ['scheduled', 'in_progress'] },
        scheduledDate: { $lt: new Date() }
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1, priority: 1 });
};
diagnosticFollowUpSchema.statics.findByAssignee = function (assignedTo, workplaceId, status) {
    const query = { assignedTo };
    if (status) {
        query.status = status;
    }
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1, priority: 1 });
};
exports.default = mongoose_1.default.model('DiagnosticFollowUp', diagnosticFollowUpSchema);
//# sourceMappingURL=DiagnosticFollowUp.js.map