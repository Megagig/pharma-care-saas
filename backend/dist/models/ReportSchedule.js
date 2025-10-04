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
const ReportScheduleSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    reportType: {
        type: String,
        required: true,
        enum: [
            'patient-outcomes',
            'pharmacist-interventions',
            'therapy-effectiveness',
            'quality-improvement',
            'regulatory-compliance',
            'cost-effectiveness',
            'trend-forecasting',
            'operational-efficiency',
            'medication-inventory',
            'patient-demographics',
            'adverse-events',
            'custom'
        ],
        index: true
    },
    templateId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'ReportTemplate',
        index: true
    },
    filters: {
        dateRange: {
            type: {
                type: String,
                enum: ['relative', 'absolute'],
                default: 'relative'
            },
            startDate: { type: Date },
            endDate: { type: Date },
            relativePeriod: {
                type: String,
                enum: ['1d', '7d', '30d', '90d', '6m', '1y'],
                default: '30d'
            }
        },
        patientId: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Patient'
        },
        pharmacistId: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User'
        },
        therapyType: { type: String },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical']
        },
        location: { type: String },
        status: { type: String },
        customFilters: { type: mongoose_1.Schema.Types.Mixed }
    },
    frequency: {
        type: {
            type: String,
            required: true,
            enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
            default: 'monthly'
        },
        interval: {
            type: Number,
            min: 1,
            max: 365,
            default: 1
        },
        daysOfWeek: [{
                type: Number,
                min: 0,
                max: 6
            }],
        dayOfMonth: {
            type: Number,
            min: 1,
            max: 31
        },
        monthOfYear: {
            type: Number,
            min: 1,
            max: 12
        },
        time: {
            type: String,
            required: true,
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            default: '09:00'
        },
        timezone: {
            type: String,
            required: true,
            default: 'UTC'
        }
    },
    recipients: [{
            email: {
                type: String,
                required: true,
                match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            },
            name: { type: String, trim: true },
            role: { type: String, trim: true },
            notificationPreferences: {
                onSuccess: { type: Boolean, default: true },
                onFailure: { type: Boolean, default: true },
                onEmpty: { type: Boolean, default: false }
            }
        }],
    deliveryOptions: {
        formats: [{
                type: String,
                enum: ['pdf', 'csv', 'excel', 'json'],
                default: 'pdf'
            }],
        emailTemplate: {
            subject: {
                type: String,
                required: true,
                maxlength: 200,
                default: 'Scheduled Report: {{reportName}}'
            },
            body: {
                type: String,
                required: true,
                maxlength: 2000,
                default: 'Please find your scheduled report attached.'
            },
            includeCharts: { type: Boolean, default: true },
            includeSummary: { type: Boolean, default: true }
        },
        attachmentOptions: {
            compress: { type: Boolean, default: false },
            password: { type: String, select: false },
            watermark: { type: String }
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    nextRun: {
        type: Date,
        required: true,
        index: true
    },
    lastRun: {
        type: Date,
        index: true
    },
    lastRunStatus: {
        type: String,
        enum: ['success', 'failure', 'partial', 'cancelled'],
        index: true
    },
    lastRunDetails: {
        startTime: { type: Date },
        endTime: { type: Date },
        recordsProcessed: { type: Number, min: 0 },
        filesGenerated: [{ type: String }],
        emailsSent: { type: Number, min: 0 },
        errors: [{ type: String }]
    },
    executionHistory: [{
            runId: { type: String, required: true },
            startTime: { type: Date, required: true },
            endTime: { type: Date, required: true },
            status: {
                type: String,
                required: true,
                enum: ['success', 'failure', 'partial', 'cancelled']
            },
            recordsProcessed: { type: Number, min: 0, default: 0 },
            filesGenerated: [{ type: String }],
            emailsSent: { type: Number, min: 0, default: 0 },
            errors: [{ type: String }],
            duration: { type: Number, min: 0 }
        }],
    retryPolicy: {
        maxRetries: { type: Number, min: 0, max: 10, default: 3 },
        retryInterval: { type: Number, min: 1, max: 1440, default: 30 },
        backoffMultiplier: { type: Number, min: 1, max: 10, default: 2 }
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workplaceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    permissions: {
        view: [{ type: String }],
        edit: [{ type: String }],
        delete: [{ type: String }],
        execute: [{ type: String }]
    },
    tags: [{
            type: String,
            trim: true,
            maxlength: 50
        }],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true
    }
}, {
    timestamps: true,
    collection: 'reportschedules'
});
ReportScheduleSchema.index({ workplaceId: 1, isActive: 1 });
ReportScheduleSchema.index({ workplaceId: 1, reportType: 1, isActive: 1 });
ReportScheduleSchema.index({ nextRun: 1, isActive: 1 });
ReportScheduleSchema.index({ createdBy: 1, workplaceId: 1 });
ReportScheduleSchema.index({ lastRun: -1 });
ReportScheduleSchema.index({ lastRunStatus: 1, isActive: 1 });
ReportScheduleSchema.index({ priority: 1, nextRun: 1 });
ReportScheduleSchema.index({ tags: 1 });
ReportScheduleSchema.index({
    isActive: 1,
    nextRun: 1,
    priority: -1
});
ReportScheduleSchema.index({
    name: 'text',
    description: 'text',
    tags: 'text'
}, {
    weights: {
        name: 10,
        description: 5,
        tags: 3
    }
});
ReportScheduleSchema.virtual('nextRunDisplay').get(function () {
    return this.nextRun ? this.nextRun.toISOString() : null;
});
ReportScheduleSchema.virtual('successRate').get(function () {
    if (this.executionHistory.length === 0)
        return 0;
    const successCount = this.executionHistory.filter(h => h.status === 'success').length;
    return (successCount / this.executionHistory.length) * 100;
});
ReportScheduleSchema.pre('save', function (next) {
    if (!this.recipients || this.recipients.length === 0) {
        return next(new Error('At least one recipient is required'));
    }
    if (!this.deliveryOptions.formats || this.deliveryOptions.formats.length === 0) {
        return next(new Error('At least one delivery format is required'));
    }
    if (this.isNew || this.isModified('frequency')) {
        this.nextRun = this.calculateNextRun();
    }
    if (this.executionHistory.length > 100) {
        this.executionHistory = this.executionHistory.slice(-100);
    }
    next();
});
ReportScheduleSchema.methods.calculateNextRun = function () {
    const now = new Date();
    const [hours, minutes] = this.frequency.time.split(':').map(Number);
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);
    if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
    }
    switch (this.frequency.type) {
        case 'once':
            break;
        case 'daily':
            break;
        case 'weekly':
            if (this.frequency.daysOfWeek && this.frequency.daysOfWeek.length > 0) {
                const targetDays = this.frequency.daysOfWeek.sort();
                const currentDay = nextRun.getDay();
                let nextDay = targetDays.find(day => day > currentDay);
                if (!nextDay) {
                    nextDay = targetDays[0];
                    nextRun.setDate(nextRun.getDate() + 7);
                }
                const daysToAdd = (nextDay - currentDay + 7) % 7;
                nextRun.setDate(nextRun.getDate() + daysToAdd);
            }
            break;
        case 'monthly':
            if (this.frequency.dayOfMonth) {
                nextRun.setDate(this.frequency.dayOfMonth);
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
            }
            break;
        case 'quarterly':
            const currentQuarter = Math.floor(nextRun.getMonth() / 3);
            const nextQuarterMonth = (currentQuarter + 1) * 3;
            nextRun.setMonth(nextQuarterMonth % 12);
            if (nextQuarterMonth >= 12) {
                nextRun.setFullYear(nextRun.getFullYear() + 1);
            }
            nextRun.setDate(1);
            break;
        case 'yearly':
            if (this.frequency.monthOfYear && this.frequency.dayOfMonth) {
                nextRun.setMonth(this.frequency.monthOfYear - 1);
                nextRun.setDate(this.frequency.dayOfMonth);
                if (nextRun <= now) {
                    nextRun.setFullYear(nextRun.getFullYear() + 1);
                }
            }
            break;
        case 'custom':
            if (this.frequency.interval) {
                nextRun.setDate(nextRun.getDate() + this.frequency.interval);
            }
            break;
    }
    return nextRun;
};
ReportScheduleSchema.methods.addExecutionRecord = function (record) {
    this.executionHistory.push({
        ...record,
        runId: record.runId || new mongoose_1.default.Types.ObjectId().toString()
    });
    this.lastRun = record.endTime;
    this.lastRunStatus = record.status;
    this.lastRunDetails = {
        startTime: record.startTime,
        endTime: record.endTime,
        recordsProcessed: record.recordsProcessed || 0,
        filesGenerated: record.filesGenerated || [],
        emailsSent: record.emailsSent || 0,
        errors: record.errors || []
    };
    if (this.frequency.type !== 'once') {
        this.nextRun = this.calculateNextRun();
    }
    else {
        this.isActive = false;
    }
    return this.save();
};
ReportScheduleSchema.methods.pause = function () {
    this.isActive = false;
    return this.save();
};
ReportScheduleSchema.methods.resume = function () {
    this.isActive = true;
    this.nextRun = this.calculateNextRun();
    return this.save();
};
ReportScheduleSchema.methods.clone = function (newName, userId) {
    const cloned = new this.constructor({
        ...this.toObject(),
        _id: undefined,
        name: newName,
        createdBy: userId,
        nextRun: this.calculateNextRun(),
        lastRun: undefined,
        lastRunStatus: undefined,
        lastRunDetails: undefined,
        executionHistory: [],
        createdAt: undefined,
        updatedAt: undefined
    });
    return cloned;
};
ReportScheduleSchema.statics.findDueSchedules = function (limit = 50) {
    return this.find({
        isActive: true,
        nextRun: { $lte: new Date() }
    })
        .sort({ priority: -1, nextRun: 1 })
        .limit(limit)
        .populate('templateId', 'name reportType')
        .populate('createdBy', 'name email');
};
ReportScheduleSchema.statics.findByReportType = function (reportType, workplaceId) {
    return this.find({
        reportType,
        workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
        isActive: true
    }).sort({ nextRun: 1 });
};
ReportScheduleSchema.statics.getExecutionStats = function (workplaceId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        {
            $match: {
                workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                'executionHistory.startTime': { $gte: startDate }
            }
        },
        {
            $unwind: '$executionHistory'
        },
        {
            $match: {
                'executionHistory.startTime': { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$executionHistory.status',
                count: { $sum: 1 },
                avgDuration: { $avg: '$executionHistory.duration' },
                totalRecordsProcessed: { $sum: '$executionHistory.recordsProcessed' },
                totalEmailsSent: { $sum: '$executionHistory.emailsSent' }
            }
        }
    ]);
};
exports.default = mongoose_1.default.model('ReportSchedule', ReportScheduleSchema);
//# sourceMappingURL=ReportSchedule.js.map