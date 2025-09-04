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
const attachmentSchema = new mongoose_1.Schema({
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});
const labResultSchema = new mongoose_1.Schema({
    test: {
        type: String,
        required: true
    },
    result: {
        type: String,
        required: true
    },
    normalRange: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['normal', 'abnormal', 'critical'],
        default: 'normal'
    }
});
const vitalSignsSchema = new mongoose_1.Schema({
    bloodPressure: {
        systolic: Number,
        diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    recordedAt: {
        type: Date,
        default: Date.now
    }
});
const clinicalNoteSchema = new mongoose_1.Schema({
    patient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    pharmacist: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    locationId: {
        type: String,
        index: true,
        sparse: true
    },
    type: {
        type: String,
        enum: ['consultation', 'medication_review', 'follow_up', 'adverse_event', 'other'],
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Note title is required'],
        trim: true,
        index: 'text'
    },
    content: {
        subjective: {
            type: String,
            index: 'text'
        },
        objective: {
            type: String,
            index: 'text'
        },
        assessment: {
            type: String,
            index: 'text'
        },
        plan: {
            type: String,
            index: 'text'
        }
    },
    medications: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Medication'
        }],
    vitalSigns: vitalSignsSchema,
    laborResults: [labResultSchema],
    recommendations: {
        type: [String],
        index: 'text'
    },
    followUpRequired: {
        type: Boolean,
        default: false,
        index: true
    },
    followUpDate: {
        type: Date,
        index: true
    },
    attachments: [attachmentSchema],
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        index: true
    },
    isConfidential: {
        type: Boolean,
        default: false,
        index: true
    },
    tags: {
        type: [String],
        index: true
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deletedAt: {
        type: Date,
        index: true,
        sparse: true
    },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            'title': 'text',
            'content.subjective': 'text',
            'content.objective': 'text',
            'content.assessment': 'text',
            'content.plan': 'text',
            'recommendations': 'text',
            'tags': 'text'
        }
    ]
});
clinicalNoteSchema.index({ workplaceId: 1, patient: 1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, pharmacist: 1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, type: 1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, priority: 1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, isConfidential: 1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, followUpRequired: 1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, locationId: 1, deletedAt: 1 }, { sparse: true });
clinicalNoteSchema.index({ workplaceId: 1, createdAt: -1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, updatedAt: -1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, tags: 1, deletedAt: 1 });
clinicalNoteSchema.index({ workplaceId: 1, 'laborResults.status': 1, deletedAt: 1 });
clinicalNoteSchema.pre('save', function (next) {
    if (this.isNew) {
        this.createdBy = this.createdBy || this.pharmacist;
        this.lastModifiedBy = this.lastModifiedBy || this.pharmacist;
    }
    else {
        this.lastModifiedBy = this.lastModifiedBy || this.pharmacist;
    }
    next();
});
clinicalNoteSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
    const update = this.getUpdate();
    if (update && !update.lastModifiedBy) {
        update.lastModifiedBy = update.pharmacist;
        update.updatedAt = new Date();
    }
    next();
});
clinicalNoteSchema.virtual('isDeleted').get(function () {
    return !!this.deletedAt;
});
clinicalNoteSchema.methods.softDelete = function (deletedBy) {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.lastModifiedBy = deletedBy;
    return this.save();
};
clinicalNoteSchema.methods.restore = function (restoredBy) {
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    this.lastModifiedBy = restoredBy;
    return this.save();
};
clinicalNoteSchema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, deletedAt: { $exists: false } });
};
clinicalNoteSchema.statics.findDeleted = function (filter = {}) {
    return this.find({ ...filter, deletedAt: { $exists: true } });
};
exports.default = mongoose_1.default.model('ClinicalNote', clinicalNoteSchema);
//# sourceMappingURL=ClinicalNote.js.map