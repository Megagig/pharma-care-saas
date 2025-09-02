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
const patientSchema = new mongoose_1.Schema({
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    locationId: {
        type: String,
        index: true,
        sparse: true,
    },
    mrn: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    otherNames: {
        type: String,
        trim: true,
        maxlength: [100, 'Other names cannot exceed 100 characters'],
    },
    dob: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value) {
                    const now = new Date();
                    const age = now.getFullYear() - value.getFullYear();
                    return age >= 0 && age <= 150;
                }
                return true;
            },
            message: 'Invalid date of birth',
        },
    },
    age: {
        type: Number,
        min: [0, 'Age cannot be negative'],
        max: [150, 'Age cannot exceed 150'],
    },
    gender: {
        type: String,
        enum: tenancyGuard_1.GENDERS,
    },
    phone: {
        type: String,
        validate: {
            validator: function (value) {
                if (value) {
                    return /^\+234[789][01]\d{8}$/.test(value);
                }
                return true;
            },
            message: 'Phone must be in E.164 format (+234...)',
        },
    },
    email: {
        type: String,
        lowercase: true,
        validate: {
            validator: function (value) {
                if (value) {
                    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
                }
                return true;
            },
            message: 'Please enter a valid email',
        },
    },
    address: {
        type: String,
        maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    state: {
        type: String,
        enum: tenancyGuard_1.NIGERIAN_STATES,
    },
    lga: {
        type: String,
        maxlength: [50, 'LGA cannot exceed 50 characters'],
    },
    maritalStatus: {
        type: String,
        enum: tenancyGuard_1.MARITAL_STATUS,
    },
    bloodGroup: {
        type: String,
        enum: tenancyGuard_1.BLOOD_GROUPS,
    },
    genotype: {
        type: String,
        enum: tenancyGuard_1.GENOTYPES,
    },
    weightKg: {
        type: Number,
        min: [0, 'Weight cannot be negative'],
        max: [1000, 'Weight seems unrealistic'],
    },
    latestVitals: {
        bpSystolic: {
            type: Number,
            min: [50, 'Systolic BP too low'],
            max: [300, 'Systolic BP too high'],
        },
        bpDiastolic: {
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
            maxlength: [100, 'Heart sounds description too long'],
        },
        pallor: {
            type: String,
            enum: ['none', 'mild', 'moderate', 'severe'],
        },
        dehydration: {
            type: String,
            enum: ['none', 'mild', 'moderate', 'severe'],
        },
        recordedAt: Date,
    },
    metadata: {
        sharedAccess: {
            patientId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Patient',
            },
            sharedWithLocations: [{
                    type: String,
                }],
            sharedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            sharedAt: Date,
            accessLevel: {
                type: String,
                enum: ['read', 'write', 'full'],
                default: 'read',
            },
            expiresAt: Date,
        },
        transferWorkflow: {
            transferId: String,
            patientId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Patient',
            },
            fromLocationId: String,
            toLocationId: String,
            transferredBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            transferReason: String,
            status: {
                type: String,
                enum: ['pending', 'approved', 'completed'],
                default: 'pending',
            },
            createdAt: Date,
            completedAt: Date,
            completedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            steps: [{
                    step: String,
                    completedAt: Date,
                    completedBy: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                }],
        },
    },
    hasActiveDTP: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(patientSchema);
patientSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
patientSchema.index({ workplaceId: 1, mrn: 1 }, { unique: true });
patientSchema.index({ workplaceId: 1, lastName: 1, firstName: 1 });
patientSchema.index({ workplaceId: 1, isDeleted: 1 });
patientSchema.index({ workplaceId: 1, phone: 1 }, { sparse: true });
patientSchema.index({ workplaceId: 1, email: 1 }, { sparse: true });
patientSchema.index({ workplaceId: 1, locationId: 1 }, { sparse: true });
patientSchema.index({ workplaceId: 1, 'metadata.sharedAccess.sharedWithLocations': 1 }, { sparse: true });
patientSchema.index({ hasActiveDTP: 1 });
patientSchema.index({ createdAt: -1 });
patientSchema.virtual('computedAge').get(function () {
    if (this.dob) {
        const now = new Date();
        const age = now.getFullYear() - this.dob.getFullYear();
        const monthDiff = now.getMonth() - this.dob.getMonth();
        if (monthDiff < 0 ||
            (monthDiff === 0 && now.getDate() < this.dob.getDate())) {
            return age - 1;
        }
        return age;
    }
    return this.age;
});
patientSchema.methods.getAge = function () {
    if (this.dob) {
        const now = new Date();
        const age = now.getFullYear() - this.dob.getFullYear();
        const monthDiff = now.getMonth() - this.dob.getMonth();
        if (monthDiff < 0 ||
            (monthDiff === 0 && now.getDate() < this.dob.getDate())) {
            return age - 1;
        }
        return age;
    }
    return this.age || 0;
};
patientSchema.methods.getDisplayName = function () {
    const names = [this.firstName];
    if (this.otherNames)
        names.push(this.otherNames);
    names.push(this.lastName);
    return names.join(' ');
};
patientSchema.methods.updateLatestVitals = function (vitals) {
    this.latestVitals = {
        ...vitals,
        recordedAt: new Date(),
    };
};
patientSchema.pre('save', function () {
    if (!this.dob && !this.age) {
        throw new Error('Either date of birth or age must be provided');
    }
    if (this.dob) {
        this.age = this.getAge();
    }
});
patientSchema.statics.generateNextMRN = async function (workplaceId, workplaceCode) {
    const lastPatient = await this.findOne({ workplaceId }, {}, { sort: { createdAt: -1 }, bypassTenancyGuard: true });
    let sequence = 1;
    if (lastPatient?.mrn) {
        const match = lastPatient.mrn.match(/-(\d+)$/);
        if (match) {
            sequence = parseInt(match[1]) + 1;
        }
    }
    return `${workplaceCode}-${sequence.toString().padStart(4, '0')}`;
};
exports.default = mongoose_1.default.model('Patient', patientSchema);
//# sourceMappingURL=Patient.js.map