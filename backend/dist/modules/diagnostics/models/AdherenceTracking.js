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
const medicationAdherenceSchema = new mongoose_1.Schema({
    medicationName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Medication name cannot exceed 200 characters']
    },
    rxcui: {
        type: String,
        trim: true,
        maxlength: [20, 'RxCUI cannot exceed 20 characters']
    },
    dosage: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Dosage cannot exceed 100 characters']
    },
    frequency: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Frequency cannot exceed 100 characters']
    },
    prescribedDate: {
        type: Date,
        required: true
    },
    expectedRefillDate: Date,
    lastRefillDate: Date,
    daysSupply: {
        type: Number,
        min: [1, 'Days supply must be at least 1'],
        max: [365, 'Days supply cannot exceed 365']
    },
    adherenceScore: {
        type: Number,
        required: true,
        min: [0, 'Adherence score cannot be negative'],
        max: [100, 'Adherence score cannot exceed 100'],
        default: 0
    },
    adherenceStatus: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'unknown'],
        required: true,
        default: 'unknown'
    },
    missedDoses: {
        type: Number,
        min: [0, 'Missed doses cannot be negative'],
        default: 0
    },
    totalDoses: {
        type: Number,
        min: [0, 'Total doses cannot be negative'],
        default: 0
    },
    refillHistory: [{
            date: {
                type: Date,
                required: true
            },
            daysSupply: {
                type: Number,
                required: true,
                min: [1, 'Days supply must be at least 1']
            },
            source: {
                type: String,
                enum: ['pharmacy', 'patient_report', 'system_estimate'],
                required: true
            },
            notes: {
                type: String,
                trim: true,
                maxlength: [500, 'Notes cannot exceed 500 characters']
            }
        }]
}, { _id: false });
const adherenceAlertSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['missed_refill', 'low_adherence', 'medication_gap', 'overdue_follow_up', 'side_effects'],
        required: true,
        index: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Alert message cannot exceed 500 characters']
    },
    triggeredAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    acknowledged: {
        type: Boolean,
        default: false,
        index: true
    },
    acknowledgedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    acknowledgedAt: Date,
    actionTaken: {
        type: String,
        trim: true,
        maxlength: [500, 'Action taken cannot exceed 500 characters']
    },
    resolved: {
        type: Boolean,
        default: false,
        index: true
    },
    resolvedAt: Date
}, { _id: false });
const adherenceInterventionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['counseling', 'reminder_system', 'dose_adjustment', 'medication_change', 'follow_up_scheduled'],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    implementedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    implementedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    expectedOutcome: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Expected outcome cannot exceed 500 characters']
    },
    actualOutcome: {
        type: String,
        trim: true,
        maxlength: [500, 'Actual outcome cannot exceed 500 characters']
    },
    effectiveness: {
        type: String,
        enum: ['very_effective', 'effective', 'somewhat_effective', 'not_effective']
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, { _id: false });
const adherenceTrackingSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    diagnosticRequestId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'DiagnosticRequest',
        index: true
    },
    diagnosticResultId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'DiagnosticResult',
        index: true
    },
    medications: {
        type: [medicationAdherenceSchema],
        default: [],
        validate: {
            validator: function (medications) {
                return medications.length > 0;
            },
            message: 'At least one medication must be tracked'
        }
    },
    overallAdherenceScore: {
        type: Number,
        required: true,
        min: [0, 'Overall adherence score cannot be negative'],
        max: [100, 'Overall adherence score cannot exceed 100'],
        default: 0,
        index: true
    },
    adherenceCategory: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor'],
        required: true,
        default: 'poor',
        index: true
    },
    lastAssessmentDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    nextAssessmentDate: {
        type: Date,
        required: true,
        index: true
    },
    monitoringActive: {
        type: Boolean,
        default: true,
        index: true
    },
    monitoringStartDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    monitoringEndDate: Date,
    monitoringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly',
        required: true
    },
    alerts: {
        type: [adherenceAlertSchema],
        default: []
    },
    alertPreferences: {
        enableRefillReminders: {
            type: Boolean,
            default: true
        },
        enableAdherenceAlerts: {
            type: Boolean,
            default: true
        },
        reminderDaysBefore: {
            type: Number,
            default: 7,
            min: [1, 'Reminder days must be at least 1'],
            max: [30, 'Reminder days cannot exceed 30']
        },
        escalationThreshold: {
            type: Number,
            default: 3,
            min: [1, 'Escalation threshold must be at least 1'],
            max: [14, 'Escalation threshold cannot exceed 14 days']
        }
    },
    interventions: {
        type: [adherenceInterventionSchema],
        default: []
    },
    patientReportedAdherence: {
        lastReportDate: Date,
        selfReportedScore: {
            type: Number,
            min: [0, 'Self-reported score cannot be negative'],
            max: [100, 'Self-reported score cannot exceed 100']
        },
        reportingMethod: {
            type: String,
            enum: ['phone', 'app', 'in_person', 'survey']
        },
        barriers: {
            type: [String],
            default: []
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Notes cannot exceed 1000 characters']
        }
    },
    clinicalOutcomes: {
        symptomsImproved: Boolean,
        vitalSignsImproved: Boolean,
        labValuesImproved: Boolean,
        qualityOfLifeScore: {
            type: Number,
            min: [0, 'Quality of life score cannot be negative'],
            max: [100, 'Quality of life score cannot exceed 100']
        },
        sideEffectsReported: {
            type: [String],
            default: []
        },
        hospitalizations: {
            type: Number,
            min: [0, 'Hospitalizations cannot be negative'],
            default: 0
        },
        emergencyVisits: {
            type: Number,
            min: [0, 'Emergency visits cannot be negative'],
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(adherenceTrackingSchema);
adherenceTrackingSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, {
    pharmacyIdField: 'workplaceId'
});
adherenceTrackingSchema.index({ workplaceId: 1, patientId: 1 });
adherenceTrackingSchema.index({ workplaceId: 1, overallAdherenceScore: 1 });
adherenceTrackingSchema.index({ workplaceId: 1, adherenceCategory: 1 });
adherenceTrackingSchema.index({ workplaceId: 1, monitoringActive: 1 });
adherenceTrackingSchema.index({ workplaceId: 1, nextAssessmentDate: 1 });
adherenceTrackingSchema.index({ workplaceId: 1, 'alerts.acknowledged': 1, 'alerts.severity': 1 });
adherenceTrackingSchema.index({ workplaceId: 1, isDeleted: 1 });
adherenceTrackingSchema.index({ diagnosticRequestId: 1 }, { sparse: true });
adherenceTrackingSchema.index({ diagnosticResultId: 1 }, { sparse: true });
adherenceTrackingSchema.virtual('activeAlerts').get(function () {
    return this.alerts.filter(alert => !alert.acknowledged && !alert.resolved);
});
adherenceTrackingSchema.virtual('criticalAlerts').get(function () {
    return this.alerts.filter(alert => !alert.resolved &&
        (alert.severity === 'critical' || alert.severity === 'high'));
});
adherenceTrackingSchema.virtual('averageAdherence').get(function () {
    if (this.medications.length === 0)
        return 0;
    const total = this.medications.reduce((sum, med) => sum + med.adherenceScore, 0);
    return Math.round(total / this.medications.length);
});
adherenceTrackingSchema.virtual('medicationsAtRisk').get(function () {
    return this.medications.filter(med => med.adherenceScore < 80 ||
        med.adherenceStatus === 'poor' ||
        med.adherenceStatus === 'fair');
});
adherenceTrackingSchema.methods.calculateOverallAdherence = function () {
    if (this.medications.length === 0)
        return 0;
    const weightedSum = this.medications.reduce((sum, med) => {
        const weight = 1;
        return sum + (med.adherenceScore * weight);
    }, 0);
    const totalWeight = this.medications.length;
    const score = Math.round(weightedSum / totalWeight);
    if (score >= 90)
        this.adherenceCategory = 'excellent';
    else if (score >= 80)
        this.adherenceCategory = 'good';
    else if (score >= 60)
        this.adherenceCategory = 'fair';
    else
        this.adherenceCategory = 'poor';
    this.overallAdherenceScore = score;
    return score;
};
adherenceTrackingSchema.methods.addMedication = function (medication) {
    const newMedication = {
        ...medication,
        adherenceScore: 0,
        adherenceStatus: 'unknown',
        refillHistory: []
    };
    this.medications.push(newMedication);
    this.calculateOverallAdherence();
};
adherenceTrackingSchema.methods.updateMedicationAdherence = function (medicationName, adherenceData) {
    const medication = this.medications.find(med => med.medicationName === medicationName);
    if (!medication) {
        throw new Error(`Medication ${medicationName} not found`);
    }
    Object.assign(medication, adherenceData);
    if (medication.adherenceScore >= 90)
        medication.adherenceStatus = 'excellent';
    else if (medication.adherenceScore >= 80)
        medication.adherenceStatus = 'good';
    else if (medication.adherenceScore >= 60)
        medication.adherenceStatus = 'fair';
    else
        medication.adherenceStatus = 'poor';
    this.calculateOverallAdherence();
};
adherenceTrackingSchema.methods.addRefill = function (medicationName, refillData) {
    const medication = this.medications.find(med => med.medicationName === medicationName);
    if (!medication) {
        throw new Error(`Medication ${medicationName} not found`);
    }
    medication.refillHistory.push(refillData);
    medication.lastRefillDate = refillData.date;
    medication.daysSupply = refillData.daysSupply;
    if (medication.daysSupply) {
        const expectedRefill = new Date(refillData.date);
        expectedRefill.setDate(expectedRefill.getDate() + medication.daysSupply);
        medication.expectedRefillDate = expectedRefill;
    }
    this.calculateMedicationAdherence(medication);
};
adherenceTrackingSchema.methods.createAlert = function (alert) {
    const newAlert = {
        ...alert,
        triggeredAt: new Date(),
        acknowledged: false,
        resolved: false
    };
    this.alerts.push(newAlert);
};
adherenceTrackingSchema.methods.acknowledgeAlert = function (alertIndex, acknowledgedBy, actionTaken) {
    if (alertIndex < 0 || alertIndex >= this.alerts.length) {
        throw new Error('Invalid alert index');
    }
    const alert = this.alerts[alertIndex];
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    if (actionTaken) {
        alert.actionTaken = actionTaken;
    }
};
adherenceTrackingSchema.methods.resolveAlert = function (alertIndex) {
    if (alertIndex < 0 || alertIndex >= this.alerts.length) {
        throw new Error('Invalid alert index');
    }
    const alert = this.alerts[alertIndex];
    alert.resolved = true;
    alert.resolvedAt = new Date();
};
adherenceTrackingSchema.methods.addIntervention = function (intervention) {
    const newIntervention = {
        ...intervention,
        implementedAt: new Date()
    };
    this.interventions.push(newIntervention);
};
adherenceTrackingSchema.methods.assessAdherenceRisk = function () {
    const score = this.overallAdherenceScore;
    const activeAlerts = this.activeAlerts.length;
    const criticalAlerts = this.criticalAlerts.length;
    if (criticalAlerts > 0 || score < 50)
        return 'critical';
    if (score < 70 || activeAlerts > 2)
        return 'high';
    if (score < 85 || activeAlerts > 0)
        return 'medium';
    return 'low';
};
adherenceTrackingSchema.methods.generateAdherenceReport = function () {
    return {
        patientId: this.patientId,
        overallScore: this.overallAdherenceScore,
        category: this.adherenceCategory,
        riskLevel: this.assessAdherenceRisk(),
        medicationCount: this.medications.length,
        medicationsAtRisk: this.medicationsAtRisk.length,
        activeAlerts: this.activeAlerts.length,
        criticalAlerts: this.criticalAlerts.length,
        interventions: this.interventions.length,
        lastAssessment: this.lastAssessmentDate,
        nextAssessment: this.nextAssessmentDate,
        medications: this.medications.map(med => ({
            name: med.medicationName,
            adherenceScore: med.adherenceScore,
            status: med.adherenceStatus,
            lastRefill: med.lastRefillDate,
            expectedRefill: med.expectedRefillDate
        }))
    };
};
adherenceTrackingSchema.methods.calculateMedicationAdherence = function (medication) {
    if (medication.refillHistory.length < 2) {
        medication.adherenceScore = 0;
        medication.adherenceStatus = 'unknown';
        return;
    }
    const refills = medication.refillHistory.sort((a, b) => a.date.getTime() - b.date.getTime());
    let totalGaps = 0;
    let expectedGaps = 0;
    for (let i = 1; i < refills.length; i++) {
        const previousRefill = refills[i - 1];
        const currentRefill = refills[i];
        const daysBetween = Math.floor((currentRefill.date.getTime() - previousRefill.date.getTime()) / (1000 * 60 * 60 * 24));
        const expectedDays = previousRefill.daysSupply || 30;
        totalGaps += Math.max(0, daysBetween - expectedDays);
        expectedGaps += expectedDays;
    }
    const adherencePercentage = expectedGaps > 0
        ? Math.max(0, Math.min(100, ((expectedGaps - totalGaps) / expectedGaps) * 100))
        : 0;
    medication.adherenceScore = Math.round(adherencePercentage);
    if (medication.adherenceScore >= 90)
        medication.adherenceStatus = 'excellent';
    else if (medication.adherenceScore >= 80)
        medication.adherenceStatus = 'good';
    else if (medication.adherenceScore >= 60)
        medication.adherenceStatus = 'fair';
    else
        medication.adherenceStatus = 'poor';
};
adherenceTrackingSchema.pre('save', function () {
    if (this.isModified('medications')) {
        this.calculateOverallAdherence();
    }
    if (this.isModified('overallAdherenceScore')) {
        this.lastAssessmentDate = new Date();
    }
    if (this.isNew || this.isModified('monitoringFrequency')) {
        const nextDate = new Date();
        switch (this.monitoringFrequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'biweekly':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }
        this.nextAssessmentDate = nextDate;
    }
});
adherenceTrackingSchema.statics.findByPatient = function (patientId, workplaceId) {
    const query = { patientId };
    const baseQuery = workplaceId
        ? this.findOne(query).setOptions({ workplaceId })
        : this.findOne(query);
    return baseQuery;
};
adherenceTrackingSchema.statics.findPoorAdherence = function (workplaceId, threshold = 70) {
    const query = {
        overallAdherenceScore: { $lt: threshold },
        monitoringActive: true
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ overallAdherenceScore: 1 });
};
adherenceTrackingSchema.statics.findDueForAssessment = function (workplaceId) {
    const query = {
        nextAssessmentDate: { $lte: new Date() },
        monitoringActive: true
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ nextAssessmentDate: 1 });
};
adherenceTrackingSchema.statics.findWithActiveAlerts = function (workplaceId) {
    const query = {
        'alerts.acknowledged': false,
        'alerts.resolved': false,
        monitoringActive: true
    };
    const baseQuery = workplaceId
        ? this.find(query).setOptions({ workplaceId })
        : this.find(query);
    return baseQuery.sort({ 'alerts.severity': -1, 'alerts.triggeredAt': 1 });
};
exports.default = mongoose_1.default.model('AdherenceTracking', adherenceTrackingSchema);
//# sourceMappingURL=AdherenceTracking.js.map