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
const medicationRecordSchema = new mongoose_1.Schema({
    pharmacyId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
        index: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    phase: {
        type: String,
        enum: ['past', 'current'],
        required: [true, 'Phase is required'],
        index: true,
    },
    medicationName: {
        type: String,
        required: [true, 'Medication name is required'],
        trim: true,
        maxlength: [100, 'Medication name cannot exceed 100 characters'],
    },
    purposeIndication: {
        type: String,
        trim: true,
        maxlength: [200, 'Purpose/indication cannot exceed 200 characters'],
    },
    dose: {
        type: String,
        trim: true,
        maxlength: [50, 'Dose cannot exceed 50 characters'],
        validate: {
            validator: function (value) {
                if (value) {
                    const dosePattern = /^\d+(\.\d+)?\s*(mg|g|ml|mcg|units?|tablets?|capsules?|drops?|puffs?|sachets?)$/i;
                    return dosePattern.test(value) || value.length <= 50;
                }
                return true;
            },
            message: 'Invalid dose format',
        },
    },
    frequency: {
        type: String,
        trim: true,
        maxlength: [50, 'Frequency cannot exceed 50 characters'],
        validate: {
            validator: function (value) {
                if (value) {
                    const freqPattern = /^(od|bd|tid|qid|q[1-9]h|q[1-2][0-9]h|prn|stat|sos|nocte|mane|as needed|once daily|twice daily|three times daily|four times daily)$/i;
                    return freqPattern.test(value) || value.length <= 50;
                }
                return true;
            },
            message: 'Invalid frequency format',
        },
    },
    route: {
        type: String,
        trim: true,
        maxlength: [20, 'Route cannot exceed 20 characters'],
        validate: {
            validator: function (value) {
                if (value) {
                    const routePattern = /^(PO|IV|IM|SC|SL|PR|PV|topical|inhalation|nasal|ophthalmic|otic|rectal|vaginal|transdermal)$/i;
                    return routePattern.test(value) || value.length <= 20;
                }
                return true;
            },
            message: 'Invalid route format',
        },
    },
    duration: {
        type: String,
        trim: true,
        maxlength: [50, 'Duration cannot exceed 50 characters'],
    },
    startDate: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value) {
                    const futureLimit = new Date();
                    futureLimit.setDate(futureLimit.getDate() + 7);
                    return value <= futureLimit;
                }
                return true;
            },
            message: 'Start date cannot be more than 7 days in the future',
        },
    },
    endDate: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value && this.startDate) {
                    return value >= this.startDate;
                }
                return true;
            },
            message: 'End date must be after start date',
        },
    },
    adherence: {
        type: String,
        enum: ['good', 'poor', 'unknown'],
        default: 'unknown',
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(medicationRecordSchema);
medicationRecordSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
medicationRecordSchema.index({ pharmacyId: 1, patientId: 1, phase: 1 });
medicationRecordSchema.index({ pharmacyId: 1, medicationName: 1 });
medicationRecordSchema.index({ pharmacyId: 1, isDeleted: 1 });
medicationRecordSchema.index({ phase: 1, startDate: -1 });
medicationRecordSchema.index({ adherence: 1 });
medicationRecordSchema.index({ createdAt: -1 });
medicationRecordSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
medicationRecordSchema
    .virtual('status')
    .get(function () {
    if (this.phase === 'past') {
        return 'completed';
    }
    if (this.endDate) {
        const now = new Date();
        if (now > this.endDate) {
            return 'expired';
        }
    }
    return 'active';
});
medicationRecordSchema
    .virtual('treatmentDurationDays')
    .get(function () {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
});
medicationRecordSchema.pre('save', function () {
    if (this.medicationName) {
        this.medicationName = this.medicationName.trim();
    }
    if (this.endDate && this.endDate < new Date()) {
        this.phase = 'past';
    }
    if (this.phase === 'current' && !this.startDate) {
        this.startDate = new Date();
    }
});
medicationRecordSchema.statics.findByPatient = function (patientId, phase, pharmacyId) {
    const query = { patientId };
    if (phase) {
        query.phase = phase;
    }
    const baseQuery = pharmacyId
        ? this.find(query).setOptions({ pharmacyId })
        : this.find(query);
    return baseQuery.sort({ phase: 1, startDate: -1 });
};
medicationRecordSchema.statics.findCurrentMedications = function (pharmacyId) {
    const query = { phase: 'current' };
    const baseQuery = pharmacyId
        ? this.find(query).setOptions({ pharmacyId })
        : this.find(query);
    return baseQuery.sort({ startDate: -1 });
};
medicationRecordSchema.statics.searchByName = function (searchTerm, pharmacyId) {
    const query = {
        medicationName: new RegExp(searchTerm, 'i'),
    };
    const baseQuery = pharmacyId
        ? this.find(query).setOptions({ pharmacyId })
        : this.find(query);
    return baseQuery.sort({ medicationName: 1 });
};
medicationRecordSchema.methods.isCurrent = function () {
    return (this.phase === 'current' && (!this.endDate || this.endDate >= new Date()));
};
medicationRecordSchema.methods.markAsCompleted = function (endDate) {
    this.phase = 'past';
    this.endDate = endDate || new Date();
};
medicationRecordSchema.methods.extendTreatment = function (newEndDate) {
    if (this.phase === 'current') {
        this.endDate = newEndDate;
    }
};
medicationRecordSchema.methods.updateAdherence = function (adherence, notes) {
    this.adherence = adherence;
    if (notes) {
        this.notes = notes;
    }
};
medicationRecordSchema.methods.getFormattedDosing = function () {
    const parts = [];
    if (this.dose)
        parts.push(this.dose);
    if (this.frequency)
        parts.push(this.frequency);
    if (this.route)
        parts.push(this.route);
    return parts.join(' ');
};
exports.default = mongoose_1.default.model('MedicationRecord', medicationRecordSchema);
//# sourceMappingURL=MedicationRecord.js.map