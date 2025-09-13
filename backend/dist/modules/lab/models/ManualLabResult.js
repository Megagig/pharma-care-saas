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
const manualLabResultValueSchema = new mongoose_1.Schema({
    testCode: {
        type: String,
        required: [true, 'Test code is required'],
        trim: true,
        uppercase: true,
        maxlength: [20, 'Test code cannot exceed 20 characters'],
        index: true
    },
    testName: {
        type: String,
        required: [true, 'Test name is required'],
        trim: true,
        maxlength: [200, 'Test name cannot exceed 200 characters']
    },
    numericValue: {
        type: Number,
        sparse: true,
        validate: {
            validator: function (value) {
                return value >= 0;
            },
            message: 'Numeric value cannot be negative'
        }
    },
    unit: {
        type: String,
        trim: true,
        maxlength: [20, 'Unit cannot exceed 20 characters']
    },
    stringValue: {
        type: String,
        trim: true,
        maxlength: [500, 'String value cannot exceed 500 characters']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    abnormalFlag: {
        type: Boolean,
        default: false,
        index: true
    }
}, { _id: false });
const manualLabResultInterpretationSchema = new mongoose_1.Schema({
    testCode: {
        type: String,
        required: [true, 'Test code is required'],
        trim: true,
        uppercase: true,
        maxlength: [20, 'Test code cannot exceed 20 characters'],
        index: true
    },
    interpretation: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical'],
        required: true,
        index: true
    },
    note: {
        type: String,
        trim: true,
        maxlength: [500, 'Interpretation note cannot exceed 500 characters']
    }
}, { _id: false });
const manualLabResultSchema = new mongoose_1.Schema({
    orderId: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'Order ID cannot exceed 20 characters'],
        index: true
    },
    enteredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    enteredAt: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },
    values: {
        type: [manualLabResultValueSchema],
        required: true,
        validate: {
            validator: function (values) {
                return values.length > 0;
            },
            message: 'At least one result value is required'
        }
    },
    interpretation: {
        type: [manualLabResultInterpretationSchema],
        default: []
    },
    aiProcessed: {
        type: Boolean,
        default: false,
        index: true
    },
    aiProcessedAt: {
        type: Date,
        index: true,
        sparse: true
    },
    diagnosticResultId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'DiagnosticResult',
        index: true,
        sparse: true
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        sparse: true
    },
    reviewedAt: {
        type: Date,
        index: true,
        sparse: true
    },
    reviewNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Review notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(manualLabResultSchema);
manualLabResultSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
manualLabResultSchema.index({ orderId: 1 }, { unique: true });
manualLabResultSchema.index({ enteredBy: 1, enteredAt: -1 });
manualLabResultSchema.index({ aiProcessed: 1, enteredAt: -1 });
manualLabResultSchema.index({ reviewedBy: 1, reviewedAt: -1 }, { sparse: true });
manualLabResultSchema.index({ 'values.testCode': 1, enteredAt: -1 });
manualLabResultSchema.index({ 'values.abnormalFlag': 1, enteredAt: -1 });
manualLabResultSchema.index({ 'interpretation.interpretation': 1, enteredAt: -1 });
manualLabResultSchema.index({ createdAt: -1 });
manualLabResultSchema.index({ isDeleted: 1, enteredAt: -1 });
manualLabResultSchema.index({
    orderId: 'text',
    'values.testName': 'text',
    'values.stringValue': 'text',
    'values.comment': 'text',
    reviewNotes: 'text'
});
manualLabResultSchema.virtual('isReviewed').get(function () {
    return !!this.reviewedBy && !!this.reviewedAt;
});
manualLabResultSchema.virtual('processingStatus').get(function () {
    if (this.aiProcessed)
        return 'ai_processed';
    if (this.reviewedBy && this.reviewedAt)
        return 'reviewed';
    return 'pending';
});
manualLabResultSchema.methods.addValue = function (testCode, testName, value, unit) {
    const resultValue = {
        testCode: testCode.toUpperCase(),
        testName,
        unit
    };
    if (typeof value === 'number') {
        resultValue.numericValue = value;
    }
    else {
        resultValue.stringValue = value;
    }
    this.values.push(resultValue);
};
manualLabResultSchema.methods.interpretValue = function (testCode, interpretation, note) {
    const existingIndex = this.interpretation.findIndex(interp => interp.testCode === testCode.toUpperCase());
    const interpretationData = {
        testCode: testCode.toUpperCase(),
        interpretation,
        note
    };
    if (existingIndex >= 0) {
        this.interpretation[existingIndex] = interpretationData;
    }
    else {
        this.interpretation.push(interpretationData);
    }
    const valueIndex = this.values.findIndex(val => val.testCode === testCode.toUpperCase());
    if (valueIndex >= 0 && this.values[valueIndex]) {
        this.values[valueIndex].abnormalFlag = ['low', 'high', 'critical'].includes(interpretation);
    }
};
manualLabResultSchema.methods.markAsAIProcessed = async function (diagnosticResultId) {
    this.aiProcessed = true;
    this.aiProcessedAt = new Date();
    this.diagnosticResultId = diagnosticResultId;
    await this.save();
};
manualLabResultSchema.methods.addReview = async function (reviewedBy, notes) {
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    this.reviewNotes = notes;
    this.updatedBy = reviewedBy;
    await this.save();
};
manualLabResultSchema.methods.hasAbnormalResults = function () {
    return this.values.some(value => value.abnormalFlag) ||
        this.interpretation.some(interp => ['low', 'high', 'critical'].includes(interp.interpretation));
};
manualLabResultSchema.methods.getCriticalResults = function () {
    const criticalTestCodes = this.interpretation
        .filter(interp => interp.interpretation === 'critical')
        .map(interp => interp.testCode);
    return this.values.filter(value => criticalTestCodes.includes(value.testCode));
};
manualLabResultSchema.pre('save', function () {
    for (const value of this.values) {
        if (value.numericValue === undefined && !value.stringValue) {
            throw new Error(`Test ${value.testCode} must have either numeric or string value`);
        }
    }
    for (const value of this.values) {
        const hasInterpretation = this.interpretation.some(interp => interp.testCode === value.testCode);
        if (!hasInterpretation) {
            this.interpretation.push({
                testCode: value.testCode,
                interpretation: 'normal'
            });
        }
    }
});
manualLabResultSchema.statics.findByOrderId = function (orderId) {
    return this.findOne({
        orderId: orderId.toUpperCase(),
        isDeleted: false
    });
};
manualLabResultSchema.statics.findPendingAIProcessing = function () {
    return this.find({
        aiProcessed: false,
        isDeleted: false
    }).sort({ enteredAt: 1 });
};
manualLabResultSchema.statics.findAbnormalResults = function () {
    return this.find({
        $or: [
            { 'values.abnormalFlag': true },
            { 'interpretation.interpretation': { $in: ['low', 'high', 'critical'] } }
        ],
        isDeleted: false
    }).sort({ enteredAt: -1 });
};
manualLabResultSchema.statics.findCriticalResults = function () {
    return this.find({
        'interpretation.interpretation': 'critical',
        isDeleted: false
    }).sort({ enteredAt: -1 });
};
manualLabResultSchema.statics.findPendingReview = function () {
    return this.find({
        reviewedBy: { $exists: false },
        isDeleted: false
    }).sort({ enteredAt: 1 });
};
manualLabResultSchema.statics.findByEnteredBy = function (enteredBy, fromDate, toDate) {
    const query = {
        enteredBy,
        isDeleted: false
    };
    if (fromDate || toDate) {
        query.enteredAt = {};
        if (fromDate)
            query.enteredAt.$gte = fromDate;
        if (toDate)
            query.enteredAt.$lte = toDate;
    }
    return this.find(query).sort({ enteredAt: -1 });
};
exports.default = mongoose_1.default.model('ManualLabResult', manualLabResultSchema);
//# sourceMappingURL=ManualLabResult.js.map