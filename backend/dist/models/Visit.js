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
const attachmentSchema = new mongoose_1.Schema({
    kind: {
        type: String,
        enum: ['lab', 'image', 'audio', 'other'],
        required: true,
    },
    url: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                try {
                    new URL(value);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: 'Invalid URL format',
        },
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    fileName: {
        type: String,
        trim: true,
        maxlength: [255, 'File name too long'],
    },
    fileSize: {
        type: Number,
        min: [0, 'File size cannot be negative'],
        max: [100 * 1024 * 1024, 'File size cannot exceed 100MB'],
    },
    mimeType: {
        type: String,
        trim: true,
        maxlength: [100, 'MIME type too long'],
    },
}, { _id: false });
const soapSchema = new mongoose_1.Schema({
    subjective: {
        type: String,
        trim: true,
        maxlength: [2000, 'Subjective section cannot exceed 2000 characters'],
    },
    objective: {
        type: String,
        trim: true,
        maxlength: [2000, 'Objective section cannot exceed 2000 characters'],
    },
    assessment: {
        type: String,
        trim: true,
        maxlength: [2000, 'Assessment section cannot exceed 2000 characters'],
    },
    plan: {
        type: String,
        trim: true,
        maxlength: [2000, 'Plan section cannot exceed 2000 characters'],
    },
}, { _id: false });
const visitSchema = new mongoose_1.Schema({
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
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
        validate: {
            validator: function (value) {
                const futureLimit = new Date();
                futureLimit.setDate(futureLimit.getDate() + 1);
                return value <= futureLimit;
            },
            message: 'Visit date cannot be more than 1 day in the future',
        },
        index: true,
    },
    soap: {
        type: soapSchema,
        required: true,
        validate: {
            validator: function (soap) {
                return !!(soap.subjective ||
                    soap.objective ||
                    soap.assessment ||
                    soap.plan);
            },
            message: 'At least one SOAP section (Subjective, Objective, Assessment, or Plan) must have content',
        },
    },
    attachments: {
        type: [attachmentSchema],
        default: [],
        validate: {
            validator: function (attachments) {
                return attachments.length <= 10;
            },
            message: 'Maximum 10 attachments allowed per visit',
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(visitSchema);
visitSchema.plugin(tenancyGuard_1.tenancyGuardPlugin, { pharmacyIdField: 'workplaceId' });
visitSchema.index({ workplaceId: 1, patientId: 1, date: -1 });
visitSchema.index({ workplaceId: 1, date: -1 });
visitSchema.index({ workplaceId: 1, isDeleted: 1 });
visitSchema.index({ workplaceId: 1, locationId: 1 }, { sparse: true });
visitSchema.index({ createdAt: -1 });
visitSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
visitSchema.virtual('visitDate').get(function () {
    return this.date.toISOString().split('T')[0];
});
visitSchema.virtual('soapCompleteness').get(function () {
    let completedSections = 0;
    const totalSections = 4;
    if (this.soap.subjective && this.soap.subjective.trim().length > 0)
        completedSections++;
    if (this.soap.objective && this.soap.objective.trim().length > 0)
        completedSections++;
    if (this.soap.assessment && this.soap.assessment.trim().length > 0)
        completedSections++;
    if (this.soap.plan && this.soap.plan.trim().length > 0)
        completedSections++;
    return Math.round((completedSections / totalSections) * 100);
});
visitSchema.virtual('attachmentSummary').get(function () {
    if (!this.attachments || this.attachments.length === 0) {
        return null;
    }
    const summary = {
        total: this.attachments.length,
        byType: {},
    };
    this.attachments.forEach((attachment) => {
        summary.byType[attachment.kind] =
            (summary.byType[attachment.kind] || 0) + 1;
    });
    return summary;
});
visitSchema.virtual('totalAttachmentSize').get(function () {
    if (!this.attachments || this.attachments.length === 0) {
        return 0;
    }
    return this.attachments.reduce((total, attachment) => {
        return total + (attachment.fileSize || 0);
    }, 0);
});
visitSchema.pre('save', function () {
    const hasContent = !!((this.soap.subjective && this.soap.subjective.trim().length > 5) ||
        (this.soap.objective && this.soap.objective.trim().length > 5) ||
        (this.soap.assessment && this.soap.assessment.trim().length > 5) ||
        (this.soap.plan && this.soap.plan.trim().length > 5));
    if (!hasContent) {
        throw new Error('At least one SOAP section must have meaningful content (minimum 5 characters)');
    }
    if (this.soap.subjective)
        this.soap.subjective = this.soap.subjective.trim();
    if (this.soap.objective)
        this.soap.objective = this.soap.objective.trim();
    if (this.soap.assessment)
        this.soap.assessment = this.soap.assessment.trim();
    if (this.soap.plan)
        this.soap.plan = this.soap.plan.trim();
    if (this.attachments && this.attachments.length > 0) {
        this.attachments.forEach((attachment, index) => {
            if (!attachment.uploadedAt) {
                attachment.uploadedAt = new Date();
            }
            if (attachment.fileSize) {
                const maxSizes = {
                    image: 10 * 1024 * 1024,
                    audio: 50 * 1024 * 1024,
                    lab: 5 * 1024 * 1024,
                    other: 20 * 1024 * 1024,
                };
                const maxSize = maxSizes[attachment.kind] || maxSizes['other'];
                if (attachment.fileSize > maxSize) {
                    throw new Error(`Attachment ${index + 1} exceeds maximum size for ${attachment.kind} files`);
                }
            }
        });
    }
});
visitSchema.statics.findByPatient = function (patientId, limit, workplaceId) {
    const query = { patientId };
    let baseQuery;
    if (workplaceId) {
        baseQuery = this.find(query).setOptions({ workplaceId });
    }
    else {
        baseQuery = this.find(query);
    }
    baseQuery = baseQuery.sort({ date: -1 });
    if (limit) {
        baseQuery = baseQuery.limit(limit);
    }
    return baseQuery;
};
visitSchema.statics.findByDateRange = function (startDate, endDate, workplaceId) {
    const query = {
        date: {
            $gte: startDate,
            $lte: endDate,
        },
    };
    if (workplaceId) {
        return this.find(query).setOptions({ workplaceId }).sort({ date: -1 });
    }
    return this.find(query).sort({ date: -1 });
};
visitSchema.statics.findRecent = function (days = 7, workplaceId) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const query = {
        date: {
            $gte: startDate,
            $lte: new Date(),
        },
    };
    if (workplaceId) {
        return this.find(query).setOptions({ workplaceId }).sort({ date: -1 });
    }
    return this.find(query).sort({ date: -1 });
};
visitSchema.statics.searchByContent = function (searchTerm, workplaceId) {
    const regex = new RegExp(searchTerm, 'i');
    const query = {
        $or: [
            { 'soap.subjective': regex },
            { 'soap.objective': regex },
            { 'soap.assessment': regex },
            { 'soap.plan': regex },
        ],
    };
    if (workplaceId) {
        return this.find(query).setOptions({ workplaceId }).sort({ date: -1 });
    }
    return this.find(query).sort({ date: -1 });
};
visitSchema.methods.addAttachment = function (attachment) {
    if (!this.attachments) {
        this.attachments = [];
    }
    if (this.attachments.length >= 10) {
        throw new Error('Maximum 10 attachments allowed per visit');
    }
    this.attachments.push({
        ...attachment,
        uploadedAt: new Date(),
    });
};
visitSchema.methods.removeAttachment = function (index) {
    if (this.attachments && index >= 0 && index < this.attachments.length) {
        this.attachments.splice(index, 1);
        return true;
    }
    return false;
};
visitSchema.methods.updateSOAPSection = function (section, content) {
    if (!this.soap) {
        this.soap = {};
    }
    const trimmedContent = content.trim();
    if (trimmedContent.length > 2000) {
        throw new Error(`${section} section cannot exceed 2000 characters`);
    }
    this.soap[section] = trimmedContent;
};
visitSchema.methods.isComplete = function () {
    return this.get('soapCompleteness') === 100;
};
visitSchema.methods.hasAttachments = function () {
    return !!(this.attachments && this.attachments.length > 0);
};
visitSchema.methods.getAttachmentsByType = function (type) {
    if (!this.attachments) {
        return [];
    }
    return this.attachments.filter((attachment) => attachment.kind === type);
};
visitSchema.methods.getFormattedDate = function () {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
visitSchema.methods.getSummary = function () {
    const parts = [];
    if (this.soap.subjective) {
        const summary = this.soap.subjective.slice(0, 100);
        parts.push(`S: ${summary}${this.soap.subjective.length > 100 ? '...' : ''}`);
    }
    if (this.soap.assessment) {
        const summary = this.soap.assessment.slice(0, 100);
        parts.push(`A: ${summary}${this.soap.assessment.length > 100 ? '...' : ''}`);
    }
    return parts.join(' | ') || 'No summary available';
};
exports.default = mongoose_1.default.model('Visit', visitSchema);
//# sourceMappingURL=Visit.js.map