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
const tenancyGuard_1 = require("../utils/tenancyGuard");
const mtrFollowUpSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    reviewId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MedicationTherapyReview',
        required: true,
        index: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: ['phone_call', 'appointment', 'lab_review', 'adherence_check', 'outcome_assessment'],
        required: true,
        index: true,
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Follow-up description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    objectives: [
        {
            type: String,
            trim: true,
            maxlength: [300, 'Objective cannot exceed 300 characters'],
        },
    ],
    scheduledDate: {
        type: Date,
        required: true,
        index: true,
        validate: {
            validator: function (value) {
                return value >= new Date(Date.now() - 60 * 60 * 1000);
            },
            message: 'Scheduled date cannot be in the past',
        },
    },
    estimatedDuration: {
        type: Number,
        required: true,
        min: [5, 'Duration must be at least 5 minutes'],
        max: [480, 'Duration cannot exceed 8 hours'],
        default: 30,
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'missed', 'rescheduled', 'cancelled'],
        default: 'scheduled',
        required: true,
        index: true,
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
            message: 'Completion date cannot be before scheduled date',
        },
        index: true,
    },
    rescheduledFrom: {
        type: Date,
        index: true,
    },
    rescheduledReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Reschedule reason cannot exceed 500 characters'],
    },
    reminders: [
        {
            type: {
                type: String,
                enum: ['email', 'sms', 'push', 'system'],
                required: true,
            },
            scheduledFor: {
                type: Date,
                required: true,
            },
            sent: {
                type: Boolean,
                default: false,
            },
            sentAt: Date,
            recipientId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            message: {
                type: String,
                trim: true,
                maxlength: [500, 'Reminder message cannot exceed 500 characters'],
            },
        },
    ],
    outcome: {
        status: {
            type: String,
            enum: ['successful', 'partially_successful', 'unsuccessful'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [2000, 'Outcome notes cannot exceed 2000 characters'],
        },
        nextActions: [
            {
                type: String,
                trim: true,
                maxlength: [300, 'Next action cannot exceed 300 characters'],
            },
        ],
        nextFollowUpDate: Date,
        adherenceImproved: Boolean,
        problemsResolved: [
            {
                type: String,
                trim: true,
                maxlength: [200, 'Problem description cannot exceed 200 characters'],
            },
        ],
        newProblemsIdentified: [
            {
                type: String,
                trim: true,
                maxlength: [200, 'Problem description cannot exceed 200 characters'],
            },
        ],
    },
    relatedInterventions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'MTRIntervention',
            index: true,
        },
    ],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(mtrFollowUpSchema);
mtrFollowUpSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId',
});
mtrFollowUpSchema.index({ workplaceId: 1, reviewId: 1, status: 1 });
mtrFollowUpSchema.index({ workplaceId: 1, patientId: 1, scheduledDate: 1 });
mtrFollowUpSchema.index({ workplaceId: 1, assignedTo: 1, status: 1 });
mtrFollowUpSchema.index({ workplaceId: 1, type: 1 });
mtrFollowUpSchema.index({ workplaceId: 1, priority: 1 });
mtrFollowUpSchema.index({ workplaceId: 1, isDeleted: 1 });
mtrFollowUpSchema.index({ status: 1, scheduledDate: 1 });
mtrFollowUpSchema.index({ scheduledDate: 1, assignedTo: 1 });
mtrFollowUpSchema.index({ completedAt: -1 }, { sparse: true });
mtrFollowUpSchema.index({ createdAt: -1 });
mtrFollowUpSchema.index({ 'reminders.scheduledFor': 1, 'reminders.sent': 1 });
mtrFollowUpSchema.virtual('daysUntilFollowUp').get(function () {
    if (this.status === 'completed' || this.status === 'cancelled')
        return null;
    const diffTime = this.scheduledDate.getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
mtrFollowUpSchema.virtual('daysSinceScheduled').get(function () {
    const diffTime = Math.abs(Date.now() - this.scheduledDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
mtrFollowUpSchema.virtual('overdueStatus').get(function () {
    if (['completed', 'cancelled'].includes(this.status))
        return false;
    return this.scheduledDate < new Date();
});
mtrFollowUpSchema.virtual('reminderStatus').get(function () {
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
mtrFollowUpSchema.methods.isOverdue = function () {
    if (['completed', 'cancelled'].includes(this.status))
        return false;
    return this.scheduledDate < new Date();
};
mtrFollowUpSchema.methods.canReschedule = function () {
    return ['scheduled', 'missed'].includes(this.status);
};
mtrFollowUpSchema.methods.markCompleted = function (outcome) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.outcome = outcome;
};
mtrFollowUpSchema.methods.scheduleReminder = function (type, scheduledFor) {
    this.reminders.push({
        type: type,
        scheduledFor,
        sent: false,
    });
};
mtrFollowUpSchema.methods.reschedule = function (newDate, reason) {
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
mtrFollowUpSchema.methods.scheduleDefaultReminders = function () {
    const reminderTimes = [
        { days: 1, type: 'system' },
        { hours: 2, type: 'email' },
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
mtrFollowUpSchema.pre('save', function () {
    if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    if (this.isModified('status') && this.status !== 'completed') {
        this.completedAt = undefined;
    }
    if (this.status === 'completed' && !this.outcome) {
        throw new Error('Outcome is required when follow-up is completed');
    }
    if (this.isNew && this.status === 'scheduled' && this.reminders.length === 0) {
        this.scheduleDefaultReminders();
    }
    if (this.priority === 'high' && this.objectives.length === 0) {
        throw new Error('High priority follow-ups must have at least one objective');
    }
});
mtrFollowUpSchema.statics.findByReview = function (reviewId, workplaceId) {
    const query = { reviewId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1 });
};
mtrFollowUpSchema.statics.findByPatient = function (patientId, workplaceId) {
    const query = { patientId };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: -1 });
};
mtrFollowUpSchema.statics.findScheduled = function (workplaceId, dateRange) {
    const query = { status: 'scheduled' };
    if (dateRange) {
        query.scheduledDate = {
            $gte: dateRange.start,
            $lte: dateRange.end,
        };
    }
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1, priority: 1 });
};
mtrFollowUpSchema.statics.findOverdue = function (workplaceId) {
    const query = {
        status: { $in: ['scheduled', 'in_progress'] },
        scheduledDate: { $lt: new Date() },
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1, priority: 1 });
};
mtrFollowUpSchema.statics.findByAssignee = function (assignedTo, workplaceId, status) {
    const query = { assignedTo };
    if (status) {
        query.status = status;
    }
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ scheduledDate: 1, priority: 1 });
};
mtrFollowUpSchema.statics.findPendingReminders = function (workplaceId) {
    const query = {
        'reminders.sent': false,
        'reminders.scheduledFor': { $lte: new Date() },
        status: { $in: ['scheduled', 'in_progress'] },
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ 'reminders.scheduledFor': 1 });
};
mtrFollowUpSchema.statics.getStatistics = async function (workplaceId, dateRange) {
    const matchStage = {};
    if (workplaceId) {
        matchStage.workplaceId = workplaceId;
    }
    if (dateRange) {
        matchStage.scheduledDate = {
            $gte: dateRange.start,
            $lte: dateRange.end,
        };
    }
    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalFollowUps: { $sum: 1 },
                scheduledFollowUps: {
                    $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] },
                },
                completedFollowUps: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                missedFollowUps: {
                    $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] },
                },
                overdueFollowUps: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $in: ['$status', ['scheduled', 'in_progress']] },
                                    { $lt: ['$scheduledDate', new Date()] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                followUpsByType: {
                    $push: {
                        type: '$type',
                        status: '$status',
                        priority: '$priority',
                    },
                },
                avgDurationMinutes: { $avg: '$estimatedDuration' },
            },
        },
        {
            $project: {
                _id: 0,
                totalFollowUps: 1,
                scheduledFollowUps: 1,
                completedFollowUps: 1,
                missedFollowUps: 1,
                overdueFollowUps: 1,
                completionRate: {
                    $cond: [
                        { $gt: ['$totalFollowUps', 0] },
                        { $multiply: [{ $divide: ['$completedFollowUps', '$totalFollowUps'] }, 100] },
                        0,
                    ],
                },
                followUpsByType: 1,
                avgDurationMinutes: { $round: ['$avgDurationMinutes', 1] },
            },
        },
    ];
    const result = await this.aggregate(pipeline);
    return (result[0] || {
        totalFollowUps: 0,
        scheduledFollowUps: 0,
        completedFollowUps: 0,
        missedFollowUps: 0,
        overdueFollowUps: 0,
        completionRate: 0,
        followUpsByType: [],
        avgDurationMinutes: 0,
    });
};
exports.default = mongoose_1.default.model('MTRFollowUp', mtrFollowUpSchema);
//# sourceMappingURL=MTRFollowUp.js.map