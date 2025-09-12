import mongoose, { Document, Schema } from 'mongoose';
import { tenancyGuardPlugin, addAuditFields } from '../../../utils/tenancyGuard';

export interface ILabTest {
    code: string;
    name: string;
    loincCode?: string;
    indication: string;
    priority: 'stat' | 'urgent' | 'routine';
}

export interface ILabOrder extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    orderedBy: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    locationId?: string;

    tests: ILabTest[];
    status: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
    orderDate: Date;
    expectedDate?: Date;

    // External Integration
    externalOrderId?: string;
    fhirReference?: string;

    // Audit Fields
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    isDeleted: boolean;
}

const labTestSchema = new Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    loincCode: {
        type: String,
        trim: true,
        sparse: true,
        validate: {
            validator: (v: string) => !v || /^\d{4,5}-\d$/.test(v),
            message: 'LOINC code must be in format "12345-6"'
        }
    },
    indication: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        enum: ['stat', 'urgent', 'routine'],
        required: true,
        default: 'routine'
    }
});

const labOrderSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    orderedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workplaceId: {
        type: Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true
    },
    locationId: {
        type: String,
        index: true,
        sparse: true
    },

    tests: {
        type: [labTestSchema],
        required: true,
        validate: {
            validator: (arr: ILabTest[]) => arr.length > 0,
            message: 'At least one test must be ordered'
        }
    },

    status: {
        type: String,
        enum: ['ordered', 'collected', 'processing', 'completed', 'cancelled'],
        default: 'ordered',
        index: true
    },

    orderDate: {
        type: Date,
        required: true,
        default: Date.now,
        index: true
    },

    expectedDate: {
        type: Date,
        validate: {
            validator: function (this: ILabOrder, value: Date) {
                return !value || value >= this.orderDate;
            },
            message: 'Expected date cannot be before order date'
        }
    },

    // External Integration
    externalOrderId: {
        type: String,
        trim: true,
        sparse: true,
        index: true
    },
    fhirReference: {
        type: String,
        trim: true,
        sparse: true
    }
}, {
    timestamps: true
});

// Add audit fields (createdBy, updatedBy, isDeleted)
addAuditFields(labOrderSchema);

// Apply tenancy guard plugin
labOrderSchema.plugin(tenancyGuardPlugin);

// Compound indexes for efficient querying
labOrderSchema.index({ workplaceId: 1, patientId: 1, orderDate: -1 });
labOrderSchema.index({ workplaceId: 1, status: 1, orderDate: -1 });
labOrderSchema.index({ workplaceId: 1, locationId: 1, status: 1 }, { sparse: true });
labOrderSchema.index({ workplaceId: 1, orderedBy: 1, orderDate: -1 });

// Index for external integration
labOrderSchema.index({ externalOrderId: 1 }, { sparse: true });

// Pre-save middleware
labOrderSchema.pre('save', function (this: ILabOrder) {
    // Set expected date based on priority if not provided
    if (!this.expectedDate && this.isNew) {
        const now = new Date();
        const hasStatOrUrgent = this.tests.some(test =>
            test.priority === 'stat' || test.priority === 'urgent'
        );

        if (hasStatOrUrgent) {
            // Stat/Urgent: same day or next day
            this.expectedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else {
            // Routine: 2-3 days
            this.expectedDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        }
    }
});

// Instance methods
labOrderSchema.methods.updateStatus = function (
    this: ILabOrder,
    newStatus: ILabOrder['status']
) {
    this.status = newStatus;
    return this.save();
};

labOrderSchema.methods.addTest = function (
    this: ILabOrder,
    test: ILabTest
) {
    this.tests.push(test);
    return this.save();
};

labOrderSchema.methods.removeTest = function (
    this: ILabOrder,
    testCode: string
) {
    this.tests = this.tests.filter(test => test.code !== testCode);
    return this.save();
};

labOrderSchema.methods.cancel = function (this: ILabOrder) {
    this.status = 'cancelled';
    return this.save();
};

labOrderSchema.methods.getHighestPriority = function (this: ILabOrder): string {
    const priorities = ['stat', 'urgent', 'routine'];
    const testPriorities = this.tests.map(test => test.priority);

    for (const priority of priorities) {
        if (testPriorities.includes(priority as any)) {
            return priority;
        }
    }

    return 'routine';
};

// Virtual for checking if order is overdue
labOrderSchema.virtual('isOverdue').get(function (this: ILabOrder) {
    if (!this.expectedDate || this.status === 'completed' || this.status === 'cancelled') {
        return false;
    }
    return new Date() > this.expectedDate;
});

// Virtual for days until expected
labOrderSchema.virtual('daysUntilExpected').get(function (this: ILabOrder) {
    if (!this.expectedDate) return null;

    const now = new Date();
    const diffTime = this.expectedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
});

// Static methods
labOrderSchema.statics.findOverdue = function () {
    const now = new Date();
    return this.find({
        expectedDate: { $lt: now },
        status: { $nin: ['completed', 'cancelled'] },
        isDeleted: false
    });
};

labOrderSchema.statics.findByPriority = function (priority: string) {
    return this.find({
        'tests.priority': priority,
        isDeleted: false
    });
};

labOrderSchema.statics.findPendingForPatient = function (patientId: string) {
    return this.find({
        patientId,
        status: { $nin: ['completed', 'cancelled'] },
        isDeleted: false
    }).sort({ orderDate: -1 });
};

export default mongoose.model<ILabOrder>('LabOrder', labOrderSchema);