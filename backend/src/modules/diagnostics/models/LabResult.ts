import mongoose, { Document, Schema } from 'mongoose';
import { tenancyGuardPlugin, addAuditFields } from '../../../utils/tenancyGuard';

export interface IReferenceRange {
    low?: number;
    high?: number;
    text?: string;
}

export interface ILabResult extends Document {
    _id: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;

    testCode: string;
    testName: string;
    value: string;
    unit?: string;
    referenceRange: IReferenceRange;

    interpretation: 'low' | 'normal' | 'high' | 'critical' | 'abnormal';
    flags?: string[];

    source: 'manual' | 'fhir' | 'lis' | 'external';
    performedAt: Date;
    recordedAt: Date;
    recordedBy: mongoose.Types.ObjectId;

    // External Integration
    externalResultId?: string;
    fhirReference?: string;
    loincCode?: string;

    // Audit Fields
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    isDeleted: boolean;
}

const referenceRangeSchema = new Schema({
    low: {
        type: Number,
        validate: {
            validator: function (this: IReferenceRange, value: number) {
                return !this.high || !value || value <= this.high;
            },
            message: 'Low reference value cannot be greater than high value'
        }
    },
    high: {
        type: Number,
        validate: {
            validator: function (this: IReferenceRange, value: number) {
                return !this.low || !value || value >= this.low;
            },
            message: 'High reference value cannot be less than low value'
        }
    },
    text: {
        type: String,
        trim: true,
        maxlength: [200, 'Reference range text cannot exceed 200 characters']
    }
});

const labResultSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'LabOrder',
        index: true,
        sparse: true
    },
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    workplaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },

    testCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        index: true
    },
    testName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    value: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String,
        trim: true,
        maxlength: [20, 'Unit cannot exceed 20 characters']
    },
    referenceRange: {
        type: referenceRangeSchema,
        required: true
    },

    interpretation: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical', 'abnormal'],
        required: true,
        index: true
    },
    flags: {
        type: [String],
        default: [],
        validate: {
            validator: (arr: string[]) => arr.length <= 10,
            message: 'Cannot have more than 10 flags'
        }
    },

    source: {
        type: String,
        enum: ['manual', 'fhir', 'lis', 'external'],
        required: true,
        default: 'manual',
        index: true
    },

    performedAt: {
        type: Date,
        required: true,
        index: true,
        validate: {
            validator: (value: Date) => value <= new Date(),
            message: 'Performed date cannot be in the future'
        }
    },
    recordedAt: {
        type: Date,
        required: true,
        default: Date.now,
        validate: {
            validator: function (this: ILabResult, value: Date) {
                return value >= this.performedAt;
            },
            message: 'Recorded date cannot be before performed date'
        }
    },
    recordedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // External Integration
    externalResultId: {
        type: String,
        trim: true,
        sparse: true,
        index: true
    },
    fhirReference: {
        type: String,
        trim: true,
        sparse: true
    },
    loincCode: {
        type: String,
        trim: true,
        sparse: true,
        validate: {
            validator: (v: string) => !v || /^\d{4,5}-\d$/.test(v),
            message: 'LOINC code must be in format "12345-6"'
        }
    }
}, {
    timestamps: true
});

// Add audit fields (createdBy, updatedBy, isDeleted)
addAuditFields(labResultSchema);

// Apply tenancy guard plugin
labResultSchema.plugin(tenancyGuardPlugin);

// Compound indexes for efficient querying
labResultSchema.index({ workplaceId: 1, patientId: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, testCode: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, interpretation: 1, performedAt: -1 });
labResultSchema.index({ workplaceId: 1, source: 1, recordedAt: -1 });

// Index for external integration
labResultSchema.index({ externalResultId: 1 }, { sparse: true });

// Text index for searching
labResultSchema.index({ testName: 'text', testCode: 'text' });

// Pre-save middleware for automatic interpretation
labResultSchema.pre('save', function (this: ILabResult) {
    // Auto-interpret numeric values if not manually set
    if (this.isNew || this.isModified('value') || this.isModified('referenceRange')) {
        const numericValue = parseFloat(this.value);

        if (!isNaN(numericValue) && this.referenceRange) {
            const { low, high } = this.referenceRange;

            if (low !== undefined && numericValue < low) {
                this.interpretation = 'low';
            } else if (high !== undefined && numericValue > high) {
                this.interpretation = 'high';
            } else if (low !== undefined && high !== undefined &&
                numericValue >= low && numericValue <= high) {
                this.interpretation = 'normal';
            }

            // Check for critical values (example thresholds)
            if (this.testCode === 'GLU' && (numericValue < 50 || numericValue > 400)) {
                this.interpretation = 'critical';
            } else if (this.testCode === 'K' && (numericValue < 2.5 || numericValue > 6.0)) {
                this.interpretation = 'critical';
            }
        }
    }
});

// Instance methods
labResultSchema.methods.isCritical = function (this: ILabResult): boolean {
    return this.interpretation === 'critical';
};

labResultSchema.methods.isAbnormal = function (this: ILabResult): boolean {
    return ['low', 'high', 'critical', 'abnormal'].includes(this.interpretation);
};

labResultSchema.methods.getNumericValue = function (this: ILabResult): number | null {
    const numericValue = parseFloat(this.value);
    return isNaN(numericValue) ? null : numericValue;
};

labResultSchema.methods.addFlag = function (this: ILabResult, flag: string) {
    if (!this.flags.includes(flag)) {
        this.flags.push(flag);
    }
    return this.save();
};

labResultSchema.methods.removeFlag = function (this: ILabResult, flag: string) {
    this.flags = this.flags.filter(f => f !== flag);
    return this.save();
};

// Virtual for checking if result is within normal range
labResultSchema.virtual('isNormal').get(function (this: ILabResult) {
    return this.interpretation === 'normal';
});

// Virtual for getting display value with unit
labResultSchema.virtual('displayValue').get(function (this: ILabResult) {
    return this.unit ? `${this.value} ${this.unit}` : this.value;
});

// Static methods
labResultSchema.statics.findCriticalResults = function (workplaceId?: string) {
    const query: any = {
        interpretation: 'critical',
        isDeleted: false
    };

    if (workplaceId) {
        query.workplaceId = workplaceId;
    }

    return this.find(query).sort({ performedAt: -1 });
};

labResultSchema.statics.findAbnormalResults = function (
    patientId: string,
    days: number = 30
) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.find({
        patientId,
        interpretation: { $in: ['low', 'high', 'critical', 'abnormal'] },
        performedAt: { $gte: cutoffDate },
        isDeleted: false
    }).sort({ performedAt: -1 });
};

labResultSchema.statics.getTrendData = function (
    patientId: string,
    testCode: string,
    days: number = 90
) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.find({
        patientId,
        testCode,
        performedAt: { $gte: cutoffDate },
        isDeleted: false
    }).sort({ performedAt: 1 });
};

labResultSchema.statics.findByDateRange = function (
    patientId: string,
    startDate: Date,
    endDate: Date
) {
    return this.find({
        patientId,
        performedAt: {
            $gte: startDate,
            $lte: endDate
        },
        isDeleted: false
    }).sort({ performedAt: -1 });
};

export default mongoose.model<ILabResult>('LabResult', labResultSchema);