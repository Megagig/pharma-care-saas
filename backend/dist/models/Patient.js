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
exports.Patient = void 0;
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
    allergies: [
        {
            allergen: {
                type: String,
                required: [true, 'Allergen name is required'],
                trim: true,
                maxlength: [100, 'Allergen name cannot exceed 100 characters'],
            },
            reaction: {
                type: String,
                required: [true, 'Reaction description is required'],
                trim: true,
                maxlength: [500, 'Reaction description cannot exceed 500 characters'],
            },
            severity: {
                type: String,
                enum: {
                    values: ['mild', 'moderate', 'severe'],
                    message: 'Severity must be mild, moderate, or severe',
                },
                required: [true, 'Severity level is required'],
            },
            recordedDate: {
                type: Date,
                required: [true, 'Recorded date is required'],
                default: Date.now,
            },
            recordedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            notes: {
                type: String,
                trim: true,
                maxlength: [1000, 'Notes cannot exceed 1000 characters'],
            },
        },
    ],
    chronicConditions: [
        {
            condition: {
                type: String,
                required: [true, 'Condition name is required'],
                trim: true,
                maxlength: [200, 'Condition name cannot exceed 200 characters'],
            },
            diagnosedDate: {
                type: Date,
                required: [true, 'Diagnosed date is required'],
                validate: {
                    validator: function (value) {
                        return value <= new Date();
                    },
                    message: 'Diagnosed date cannot be in the future',
                },
            },
            managementPlan: {
                type: String,
                trim: true,
                maxlength: [2000, 'Management plan cannot exceed 2000 characters'],
            },
            status: {
                type: String,
                enum: {
                    values: ['active', 'managed', 'resolved'],
                    message: 'Status must be active, managed, or resolved',
                },
                default: 'active',
                required: true,
            },
            recordedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            notes: {
                type: String,
                trim: true,
                maxlength: [1000, 'Notes cannot exceed 1000 characters'],
            },
        },
    ],
    enhancedEmergencyContacts: [
        {
            name: {
                type: String,
                required: [true, 'Emergency contact name is required'],
                trim: true,
                maxlength: [100, 'Name cannot exceed 100 characters'],
            },
            relationship: {
                type: String,
                required: [true, 'Relationship is required'],
                trim: true,
                maxlength: [50, 'Relationship cannot exceed 50 characters'],
            },
            phone: {
                type: String,
                required: [true, 'Phone number is required'],
                validate: {
                    validator: function (phone) {
                        return /^\+234[0-9]{10}$/.test(phone);
                    },
                    message: 'Phone must be in Nigerian format (+234XXXXXXXXXX)',
                },
            },
            email: {
                type: String,
                lowercase: true,
                validate: {
                    validator: function (email) {
                        if (!email)
                            return true;
                        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
                    },
                    message: 'Please enter a valid email',
                },
            },
            isPrimary: {
                type: Boolean,
                default: false,
            },
            priority: {
                type: Number,
                required: [true, 'Priority is required'],
                min: [1, 'Priority must be at least 1'],
                max: [10, 'Priority cannot exceed 10'],
            },
        },
    ],
    insuranceInfo: {
        provider: {
            type: String,
            trim: true,
            maxlength: [100, 'Insurance provider name cannot exceed 100 characters'],
        },
        policyNumber: {
            type: String,
            trim: true,
            maxlength: [50, 'Policy number cannot exceed 50 characters'],
        },
        expiryDate: {
            type: Date,
            validate: {
                validator: function (value) {
                    if (!value)
                        return true;
                    return value > new Date();
                },
                message: 'Insurance expiry date must be in the future',
            },
        },
        coverageDetails: {
            type: String,
            trim: true,
            maxlength: [1000, 'Coverage details cannot exceed 1000 characters'],
        },
        copayAmount: {
            type: Number,
            min: [0, 'Copay amount cannot be negative'],
            max: [1000000, 'Copay amount seems unrealistic'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    patientLoggedVitals: [
        {
            recordedDate: {
                type: Date,
                required: [true, 'Recorded date is required'],
                default: Date.now,
            },
            appointmentId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'Appointment',
                required: false,
            },
            bloodPressure: {
                systolic: {
                    type: Number,
                    min: [50, 'Systolic BP too low'],
                    max: [300, 'Systolic BP too high'],
                },
                diastolic: {
                    type: Number,
                    min: [30, 'Diastolic BP too low'],
                    max: [200, 'Diastolic BP too high'],
                },
            },
            heartRate: {
                type: Number,
                min: [30, 'Heart rate too low'],
                max: [250, 'Heart rate too high'],
            },
            temperature: {
                type: Number,
                min: [30, 'Temperature too low'],
                max: [45, 'Temperature too high'],
            },
            weight: {
                type: Number,
                min: [0, 'Weight cannot be negative'],
                max: [1000, 'Weight seems unrealistic'],
            },
            glucose: {
                type: Number,
                min: [20, 'Glucose level too low'],
                max: [800, 'Glucose level too high'],
            },
            oxygenSaturation: {
                type: Number,
                min: [50, 'Oxygen saturation too low'],
                max: [100, 'Oxygen saturation cannot exceed 100%'],
            },
            notes: {
                type: String,
                trim: true,
                maxlength: [500, 'Notes cannot exceed 500 characters'],
            },
            source: {
                type: String,
                enum: ['patient_portal'],
                default: 'patient_portal',
                required: true,
            },
            verifiedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            isVerified: {
                type: Boolean,
                default: false,
            },
        },
    ],
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
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        resultNotifications: { type: Boolean, default: true },
        orderReminders: { type: Boolean, default: true },
    },
    appointmentPreferences: {
        preferredDays: {
            type: [Number],
            validate: {
                validator: function (days) {
                    return days.every((day) => day >= 0 && day <= 6);
                },
                message: 'Preferred days must be between 0 (Sunday) and 6 (Saturday)',
            },
        },
        preferredTimeSlots: [
            {
                start: {
                    type: String,
                    validate: {
                        validator: function (time) {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
                        },
                        message: 'Time must be in HH:mm format',
                    },
                },
                end: {
                    type: String,
                    validate: {
                        validator: function (time) {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
                        },
                        message: 'Time must be in HH:mm format',
                    },
                },
            },
        ],
        preferredPharmacist: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
        reminderPreferences: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: false },
        },
        language: {
            type: String,
            enum: ['en', 'yo', 'ig', 'ha'],
            default: 'en',
        },
        timezone: {
            type: String,
            default: 'Africa/Lagos',
        },
    },
    engagementMetrics: {
        totalAppointments: { type: Number, default: 0 },
        completedAppointments: { type: Number, default: 0 },
        cancelledAppointments: { type: Number, default: 0 },
        noShowAppointments: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },
        totalFollowUps: { type: Number, default: 0 },
        completedFollowUps: { type: Number, default: 0 },
        overdueFollowUps: { type: Number, default: 0 },
        followUpCompletionRate: { type: Number, default: 0 },
        averageResponseTime: { type: Number, default: 0 },
        lastEngagementDate: Date,
        engagementScore: { type: Number, default: 0 },
        lastUpdated: Date,
    },
    metadata: {
        sharedAccess: {
            patientId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Patient',
            },
            sharedWithLocations: [
                {
                    type: String,
                },
            ],
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
            steps: [
                {
                    step: String,
                    completedAt: Date,
                    completedBy: {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: 'User',
                    },
                },
            ],
        },
    },
    hasActiveDTP: {
        type: Boolean,
        default: false,
    },
    hasActiveInterventions: {
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
patientSchema.index({ 'allergies.allergen': 1 });
patientSchema.index({ 'allergies.severity': 1 });
patientSchema.index({ 'chronicConditions.condition': 1 });
patientSchema.index({ 'chronicConditions.status': 1 });
patientSchema.index({ 'enhancedEmergencyContacts.isPrimary': 1 });
patientSchema.index({ 'insuranceInfo.provider': 1 });
patientSchema.index({ 'insuranceInfo.isActive': 1 });
patientSchema.index({ 'patientLoggedVitals.recordedDate': -1 });
patientSchema.index({ 'patientLoggedVitals.isVerified': 1 });
patientSchema.virtual('name').get(function () {
    const parts = [this.firstName, this.otherNames, this.lastName].filter(Boolean);
    return parts.join(' ');
});
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
patientSchema.virtual('dateOfBirth').get(function () {
    return this.dob;
});
patientSchema.virtual('dateOfBirth').set(function (value) {
    this.dob = value;
});
patientSchema.virtual('upcomingAppointments', {
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'patientId',
    count: true,
    match: {
        status: { $in: ['scheduled', 'confirmed'] },
        scheduledDate: { $gte: new Date() },
        isDeleted: false,
    },
});
patientSchema.virtual('lastAppointmentDate').get(async function () {
    try {
        const Appointment = mongoose_1.default.model('Appointment');
        const lastAppointment = await Appointment.findOne({
            patientId: this._id,
            status: 'completed',
            isDeleted: false,
        })
            .sort({ scheduledDate: -1 })
            .select('scheduledDate');
        return lastAppointment?.scheduledDate;
    }
    catch (error) {
        return undefined;
    }
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
patientSchema.methods.getInterventionCount = async function () {
    const ClinicalIntervention = mongoose_1.default.model('ClinicalIntervention');
    return await ClinicalIntervention.countDocuments({
        patientId: this._id,
        isDeleted: false,
    });
};
patientSchema.methods.getActiveInterventionCount = async function () {
    const ClinicalIntervention = mongoose_1.default.model('ClinicalIntervention');
    return await ClinicalIntervention.countDocuments({
        patientId: this._id,
        status: { $in: ['identified', 'planning', 'in_progress', 'implemented'] },
        isDeleted: false,
    });
};
patientSchema.methods.updateInterventionFlags = async function () {
    const activeCount = await this.getActiveInterventionCount();
    this.hasActiveInterventions = activeCount > 0;
    await this.save();
};
patientSchema.methods.getDiagnosticHistoryCount = async function () {
    const DiagnosticHistory = mongoose_1.default.model('DiagnosticHistory');
    return await DiagnosticHistory.countDocuments({
        patientId: this._id,
        status: 'active',
    });
};
patientSchema.methods.getLatestDiagnosticHistory = async function () {
    const DiagnosticHistory = mongoose_1.default.model('DiagnosticHistory');
    return await DiagnosticHistory.findOne({
        patientId: this._id,
        status: 'active',
    })
        .populate('pharmacistId', 'firstName lastName')
        .sort({ createdAt: -1 });
};
patientSchema.methods.addAllergy = function (allergyData, recordedBy) {
    const allergy = {
        ...allergyData,
        recordedDate: new Date(),
        recordedBy,
    };
    this.allergies.push(allergy);
};
patientSchema.methods.removeAllergy = function (allergyId) {
    const initialLength = this.allergies.length;
    this.allergies = this.allergies.filter(allergy => allergy._id?.toString() !== allergyId);
    return this.allergies.length < initialLength;
};
patientSchema.methods.updateAllergy = function (allergyId, updates) {
    const allergy = this.allergies.find(allergy => allergy._id?.toString() === allergyId);
    if (allergy) {
        Object.assign(allergy, updates);
        return true;
    }
    return false;
};
patientSchema.methods.addChronicCondition = function (conditionData, recordedBy) {
    const condition = {
        ...conditionData,
        recordedBy,
    };
    this.chronicConditions.push(condition);
};
patientSchema.methods.removeChronicCondition = function (conditionId) {
    const initialLength = this.chronicConditions.length;
    this.chronicConditions = this.chronicConditions.filter(condition => condition._id?.toString() !== conditionId);
    return this.chronicConditions.length < initialLength;
};
patientSchema.methods.updateChronicCondition = function (conditionId, updates) {
    const condition = this.chronicConditions.find(condition => condition._id?.toString() === conditionId);
    if (condition) {
        Object.assign(condition, updates);
        return true;
    }
    return false;
};
patientSchema.methods.addEmergencyContact = function (contactData) {
    if (contactData.isPrimary) {
        this.enhancedEmergencyContacts.forEach(contact => {
            contact.isPrimary = false;
        });
    }
    this.enhancedEmergencyContacts.push(contactData);
    this.enhancedEmergencyContacts.sort((a, b) => a.priority - b.priority);
};
patientSchema.methods.removeEmergencyContact = function (contactId) {
    const initialLength = this.enhancedEmergencyContacts.length;
    this.enhancedEmergencyContacts = this.enhancedEmergencyContacts.filter(contact => contact._id?.toString() !== contactId);
    return this.enhancedEmergencyContacts.length < initialLength;
};
patientSchema.methods.updateEmergencyContact = function (contactId, updates) {
    const contact = this.enhancedEmergencyContacts.find(contact => contact._id?.toString() === contactId);
    if (contact) {
        if (updates.isPrimary) {
            this.enhancedEmergencyContacts.forEach(c => {
                if (c._id?.toString() !== contactId) {
                    c.isPrimary = false;
                }
            });
        }
        Object.assign(contact, updates);
        if (updates.priority !== undefined) {
            this.enhancedEmergencyContacts.sort((a, b) => a.priority - b.priority);
        }
        return true;
    }
    return false;
};
patientSchema.methods.setPrimaryEmergencyContact = function (contactId) {
    let found = false;
    this.enhancedEmergencyContacts.forEach(contact => {
        if (contact._id?.toString() === contactId) {
            contact.isPrimary = true;
            found = true;
        }
        else {
            contact.isPrimary = false;
        }
    });
    return found;
};
patientSchema.methods.updateInsuranceInfo = function (insuranceData) {
    this.insuranceInfo = { ...this.insuranceInfo, ...insuranceData };
};
patientSchema.methods.logVitals = function (vitalsData) {
    const vitals = {
        ...vitalsData,
        recordedDate: new Date(),
        source: 'patient_portal',
        isVerified: false,
    };
    this.patientLoggedVitals.push(vitals);
    if (this.patientLoggedVitals.length > 100) {
        this.patientLoggedVitals = this.patientLoggedVitals
            .sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime())
            .slice(0, 100);
    }
};
patientSchema.methods.getVitalsHistory = function (limit = 20) {
    return this.patientLoggedVitals
        .sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime())
        .slice(0, limit);
};
patientSchema.methods.getLatestVitals = function () {
    if (this.patientLoggedVitals.length === 0)
        return null;
    return this.patientLoggedVitals
        .sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime())[0];
};
patientSchema.methods.verifyVitals = function (vitalsId, verifiedBy) {
    const vitals = this.patientLoggedVitals.find(vitals => vitals._id?.toString() === vitalsId);
    if (vitals) {
        vitals.isVerified = true;
        vitals.verifiedBy = verifiedBy;
        return true;
    }
    return false;
};
patientSchema.methods.unverifyVitals = function (vitalsId) {
    const vitals = this.patientLoggedVitals.find(vitals => vitals._id?.toString() === vitalsId);
    if (vitals) {
        vitals.isVerified = false;
        vitals.verifiedBy = undefined;
        return true;
    }
    return false;
};
patientSchema.methods.getUnverifiedVitals = function () {
    return this.patientLoggedVitals
        .filter(vitals => !vitals.isVerified)
        .sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime());
};
patientSchema.methods.getVerifiedVitals = function (limit = 20) {
    return this.patientLoggedVitals
        .filter(vitals => vitals.isVerified)
        .sort((a, b) => b.recordedDate.getTime() - a.recordedDate.getTime())
        .slice(0, limit);
};
patientSchema.pre('save', function () {
    if (!this.dob && !this.age) {
        throw new Error('Either date of birth or age must be provided');
    }
    if (this.dob) {
        this.age = this.getAge();
    }
    const primaryContacts = this.enhancedEmergencyContacts.filter(contact => contact.isPrimary);
    if (primaryContacts.length > 1) {
        throw new Error('Only one emergency contact can be set as primary');
    }
    const priorities = this.enhancedEmergencyContacts.map(contact => contact.priority);
    const uniquePriorities = new Set(priorities);
    if (priorities.length !== uniquePriorities.size) {
        throw new Error('Emergency contact priorities must be unique');
    }
    for (const condition of this.chronicConditions) {
        if (condition.diagnosedDate > new Date()) {
            throw new Error('Chronic condition diagnosed date cannot be in the future');
        }
    }
    for (const vitals of this.patientLoggedVitals) {
        if (vitals.bloodPressure) {
            const { systolic, diastolic } = vitals.bloodPressure;
            if (systolic && diastolic && systolic <= diastolic) {
                throw new Error('Systolic blood pressure must be higher than diastolic');
            }
        }
    }
});
patientSchema.statics.generateNextMRN = async function (workplaceId, workplaceCode) {
    const lastPatient = await this.findOne({ workplaceId }, { mrn: 1 }, { sort: { createdAt: -1 }, bypassTenancyGuard: true });
    let sequence = 1;
    if (lastPatient?.mrn) {
        const match = lastPatient.mrn.match(/-(\d+)$/);
        if (match) {
            sequence = parseInt(match[1], 10) + 1;
        }
    }
    return (0, tenancyGuard_1.generateMRN)(workplaceCode, sequence);
};
const Patient = mongoose_1.default.model('Patient', patientSchema);
exports.Patient = Patient;
exports.default = Patient;
//# sourceMappingURL=Patient.js.map