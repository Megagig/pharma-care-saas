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
const vitalsSchema = new mongoose_1.Schema({
    bpSys: {
        type: Number,
        min: [50, 'Systolic BP too low'],
        max: [300, 'Systolic BP too high'],
    },
    bpDia: {
        type: Number,
        min: [30, 'Diastolic BP too low'],
        max: [200, 'Diastolic BP too high'],
    },
    rr: {
        type: Number,
        min: [8, 'Respiratory rate too low'],
        max: [60, 'Respiratory rate too high'],
    },
    tempC: {
        type: Number,
        min: [30, 'Temperature too low'],
        max: [45, 'Temperature too high'],
    },
    heartSounds: {
        type: String,
        trim: true,
        maxlength: [200, 'Heart sounds description too long'],
    },
    pallor: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe'],
    },
    dehydration: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe'],
    },
}, { _id: false });
const labsSchema = new mongoose_1.Schema({
    pcv: {
        type: Number,
        min: [10, 'PCV too low'],
        max: [60, 'PCV too high'],
    },
    mcs: {
        type: String,
        trim: true,
        maxlength: [500, 'MCS result too long'],
    },
    eucr: {
        type: String,
        trim: true,
        maxlength: [500, 'EUCr result too long'],
    },
    fbc: {
        type: String,
        trim: true,
        maxlength: [500, 'FBC result too long'],
    },
    fbs: {
        type: Number,
        min: [30, 'FBS too low'],
        max: [600, 'FBS too high'],
    },
    hba1c: {
        type: Number,
        min: [3.0, 'HbA1c too low'],
        max: [20.0, 'HbA1c too high'],
    },
    misc: {
        type: mongoose_1.Schema.Types.Mixed,
        validate: {
            validator: function (value) {
                if (value && typeof value === 'object') {
                    return Object.keys(value).every((key) => typeof key === 'string' &&
                        (typeof value[key] === 'string' ||
                            typeof value[key] === 'number'));
                }
                return true;
            },
            message: 'Misc labs must be an object with string keys and string/number values',
        },
    },
}, { _id: false });
const clinicalAssessmentSchema = new mongoose_1.Schema({
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
    visitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Visit',
        index: true,
    },
    vitals: vitalsSchema,
    labs: labsSchema,
    recordedAt: {
        type: Date,
        required: true,
        default: Date.now,
        validate: {
            validator: function (value) {
                const futureLimit = new Date();
                futureLimit.setDate(futureLimit.getDate() + 1);
                return value <= futureLimit;
            },
            message: 'Recorded date cannot be more than 1 day in the future',
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(clinicalAssessmentSchema);
clinicalAssessmentSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
clinicalAssessmentSchema.index({ pharmacyId: 1, patientId: 1, recordedAt: -1 });
clinicalAssessmentSchema.index({ pharmacyId: 1, visitId: 1 });
clinicalAssessmentSchema.index({ pharmacyId: 1, isDeleted: 1 });
clinicalAssessmentSchema.index({ recordedAt: -1 });
clinicalAssessmentSchema.index({ createdAt: -1 });
clinicalAssessmentSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
clinicalAssessmentSchema.virtual('visit', {
    ref: 'Visit',
    localField: 'visitId',
    foreignField: '_id',
    justOne: true,
});
clinicalAssessmentSchema
    .virtual('bloodPressure')
    .get(function () {
    if (this.vitals?.bpSys && this.vitals?.bpDia) {
        return `${this.vitals.bpSys}/${this.vitals.bpDia}`;
    }
    return null;
});
clinicalAssessmentSchema
    .virtual('tempF')
    .get(function () {
    if (this.vitals?.tempC) {
        return (this.vitals.tempC * 9) / 5 + 32;
    }
    return null;
});
clinicalAssessmentSchema.pre('save', function () {
    if (!this.vitals && !this.labs) {
        throw new Error('Either vitals or labs must be provided');
    }
    if (this.vitals?.bpSys && this.vitals?.bpDia) {
        if (this.vitals.bpSys <= this.vitals.bpDia) {
            throw new Error('Systolic BP must be higher than diastolic BP');
        }
    }
    if (this.vitals?.tempC) {
        this.vitals.tempC = Math.round(this.vitals.tempC * 10) / 10;
    }
    if (this.labs?.pcv) {
        this.labs.pcv = Math.round(this.labs.pcv * 10) / 10;
    }
    if (this.labs?.fbs) {
        this.labs.fbs = Math.round(this.labs.fbs);
    }
    if (this.labs?.hba1c) {
        this.labs.hba1c = Math.round(this.labs.hba1c * 10) / 10;
    }
});
clinicalAssessmentSchema.statics.findByPatient = function (patientId, limit, pharmacyId) {
    const query = { patientId };
    let baseQuery;
    if (pharmacyId) {
        baseQuery = this.find(query).setOptions({ pharmacyId });
    }
    else {
        baseQuery = this.find(query);
    }
    baseQuery = baseQuery.sort({ recordedAt: -1 });
    if (limit) {
        baseQuery = baseQuery.limit(limit);
    }
    return baseQuery;
};
clinicalAssessmentSchema.statics.findLatestByPatient = function (patientId, pharmacyId) {
    const query = { patientId };
    if (pharmacyId) {
        return this.findOne(query)
            .setOptions({ pharmacyId })
            .sort({ recordedAt: -1 });
    }
    return this.findOne(query).sort({ recordedAt: -1 });
};
clinicalAssessmentSchema.statics.findByVisit = function (visitId, pharmacyId) {
    const query = { visitId };
    if (pharmacyId) {
        return this.find(query).setOptions({ pharmacyId }).sort({ recordedAt: -1 });
    }
    return this.find(query).sort({ recordedAt: -1 });
};
clinicalAssessmentSchema.methods.hasVitals = function () {
    return !!(this.vitals && Object.keys(this.vitals).length > 0);
};
clinicalAssessmentSchema.methods.hasLabs = function () {
    return !!(this.labs && Object.keys(this.labs).length > 0);
};
clinicalAssessmentSchema.methods.getBPCategory = function () {
    if (this.vitals?.bpSys && this.vitals?.bpDia) {
        const sys = this.vitals.bpSys;
        const dia = this.vitals.bpDia;
        if (sys < 120 && dia < 80)
            return 'Normal';
        if (sys < 130 && dia < 80)
            return 'Elevated';
        if ((sys >= 130 && sys < 140) || (dia >= 80 && dia < 90))
            return 'Stage 1 Hypertension';
        if (sys >= 140 || dia >= 90)
            return 'Stage 2 Hypertension';
        if (sys >= 180 || dia >= 120)
            return 'Hypertensive Crisis';
    }
    return 'Unknown';
};
clinicalAssessmentSchema.methods.getDiabeticStatus = function () {
    if (this.labs?.fbs) {
        const fbs = this.labs.fbs;
        if (fbs < 100)
            return 'Normal';
        if (fbs >= 100 && fbs < 126)
            return 'Prediabetes';
        if (fbs >= 126)
            return 'Diabetes';
    }
    if (this.labs?.hba1c) {
        const hba1c = this.labs.hba1c;
        if (hba1c < 5.7)
            return 'Normal';
        if (hba1c >= 5.7 && hba1c < 6.5)
            return 'Prediabetes';
        if (hba1c >= 6.5)
            return 'Diabetes';
    }
    return 'Unknown';
};
exports.default = mongoose_1.default.model('ClinicalAssessment', clinicalAssessmentSchema);
//# sourceMappingURL=ClinicalAssessment.js.map