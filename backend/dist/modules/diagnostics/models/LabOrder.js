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
const labTestSchema = new mongoose_1.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'Test code cannot exceed 20 characters'],
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Test name cannot exceed 200 characters'],
        index: true
    },
    loincCode: {
        type: String,
        trim: true,
        maxlength: [20, 'LOINC code cannot exceed 20 characters'],
        index: true,
        sparse: true
    },
    indication: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Indication cannot exceed 500 characters']
    },
    priority: {
        type: String,
        enum: ['stat', 'urgent', 'routine'],
        required: true,
        index: true
    },
    category: {
        type: String,
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters'],
        index: true
    },
    specimen: {
        type: String,
        trim: true,
        maxlength: [100, 'Specimen type cannot exceed 100 characters']
    },
    expectedTurnaround: {
        type: String,
        trim: true,
        maxlength: [50, 'Expected turnaround cannot exceed 50 characters']
    },
    estimatedCost: {
        type: Number,
        min: [0, 'Estimated cost cannot be negative']
    },
    clinicalNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Clinical notes cannot exceed 500 characters']
    }
}, { _id: false });
const notificationsSchema = new mongoose_1.Schema({
    ordered: {
        type: Boolean,
        default: false
    },
    collected: {
        type: Boolean,
        default: false
    },
    processing: {
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { _id: false });
const labOrderSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    orderedBy: {
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
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'Order number cannot exceed 20 characters'],
        index: true
    },
    tests: {
        type: [labTestSchema],
        required: true,
        validate: {
            validator: function (tests) {
                return tests.length > 0;
            },
            message: 'At least one test is required'
        }
    },
    status: {
        type: String,
        enum: ['ordered', 'collected', 'processing', 'completed', 'cancelled', 'rejected'],
        default: 'ordered',
        required: true,
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
        index: true
    },
    completedDate: {
        type: Date,
        index: true
    },
    clinicalIndication: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Clinical indication cannot exceed 1000 characters']
    },
    urgentReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Urgent reason cannot exceed 500 characters']
    },
    patientInstructions: {
        type: String,
        trim: true,
        maxlength: [1000, 'Patient instructions cannot exceed 1000 characters']
    },
    labInstructions: {
        type: String,
        trim: true,
        maxlength: [1000, 'Lab instructions cannot exceed 1000 characters']
    },
    collectionDate: {
        type: Date,
        index: true
    },
    collectedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    collectionNotes: {
        type: String,
        trim: true,
        maxlength: [500, 'Collection notes cannot exceed 500 characters']
    },
    specimenType: {
        type: String,
        trim: true,
        maxlength: [100, 'Specimen type cannot exceed 100 characters']
    },
    collectionSite: {
        type: String,
        trim: true,
        maxlength: [100, 'Collection site cannot exceed 100 characters']
    },
    externalOrderId: {
        type: String,
        trim: true,
        maxlength: [100, 'External order ID cannot exceed 100 characters'],
        index: true,
        sparse: true
    },
    fhirReference: {
        type: String,
        trim: true,
        maxlength: [200, 'FHIR reference cannot exceed 200 characters']
    },
    labSystemId: {
        type: String,
        trim: true,
        maxlength: [100, 'Lab system ID cannot exceed 100 characters'],
        index: true,
        sparse: true
    },
    trackingNumber: {
        type: String,
        trim: true,
        maxlength: [50, 'Tracking number cannot exceed 50 characters'],
        index: true,
        sparse: true
    },
    notificationsSent: {
        type: notificationsSchema,
        default: () => ({})
    },
    validationFlags: {
        type: [String],
        default: []
    },
    rejectionReason: {
        type: String,
        trim: true,
        maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    },
    totalEstimatedCost: {
        type: Number,
        min: [0, 'Total estimated cost cannot be negative']
    },
    insurancePreAuth: {
        type: Boolean,
        default: false
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'authorized', 'paid', 'rejected'],
        default: 'pending',
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(labOrderSchema);
labOrderSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
labOrderSchema.index({ workplaceId: 1, patientId: 1, orderDate: -1 });
labOrderSchema.index({ workplaceId: 1, status: 1, orderDate: -1 });
labOrderSchema.index({ workplaceId: 1, orderedBy: 1, orderDate: -1 });
labOrderSchema.index({ workplaceId: 1, locationId: 1, status: 1 }, { sparse: true });
labOrderSchema.index({ workplaceId: 1, 'tests.priority': 1, orderDate: -1 });
labOrderSchema.index({ workplaceId: 1, expectedDate: 1, status: 1 });
labOrderSchema.index({ workplaceId: 1, isDeleted: 1, orderDate: -1 });
labOrderSchema.index({
    orderNumber: 'text',
    clinicalIndication: 'text',
    'tests.name': 'text',
    'tests.indication': 'text'
});
labOrderSchema.virtual('isActive').get(function () {
    return ['ordered', 'collected', 'processing'].includes(this.status);
});
labOrderSchema.virtual('daysSinceOrder').get(function () {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.orderDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
labOrderSchema.methods.updateStatus = async function (status, updatedBy) {
    this.status = status;
    if (status === 'completed' && !this.completedDate) {
        this.completedDate = new Date();
    }
    if (updatedBy) {
        this.updatedBy = updatedBy;
    }
    await this.save();
};
labOrderSchema.methods.markAsCollected = async function (collectedBy, notes) {
    this.status = 'collected';
    this.collectionDate = new Date();
    this.collectedBy = collectedBy;
    this.updatedBy = collectedBy;
    if (notes) {
        this.collectionNotes = notes;
    }
    await this.save();
};
labOrderSchema.methods.markAsCompleted = async function () {
    this.status = 'completed';
    this.completedDate = new Date();
    await this.save();
};
labOrderSchema.methods.cancel = async function (reason, cancelledBy) {
    this.status = 'cancelled';
    this.rejectionReason = reason;
    this.updatedBy = cancelledBy;
    await this.save();
};
labOrderSchema.methods.calculateTotalCost = function () {
    return this.tests.reduce((total, test) => {
        return total + (test.estimatedCost || 0);
    }, 0);
};
labOrderSchema.methods.getHighestPriority = function () {
    const priorityOrder = { stat: 3, urgent: 2, routine: 1 };
    return this.tests.reduce((highest, test) => {
        return priorityOrder[test.priority] > priorityOrder[highest] ? test.priority : highest;
    }, 'routine');
};
labOrderSchema.methods.isOverdue = function () {
    if (!this.expectedDate || this.status === 'completed')
        return false;
    return new Date() > this.expectedDate;
};
labOrderSchema.methods.canBeModified = function () {
    return ['ordered'].includes(this.status);
};
labOrderSchema.pre('save', function () {
    if (!this.totalEstimatedCost) {
        this.totalEstimatedCost = this.calculateTotalCost();
    }
    if (!this.expectedDate && this.isNew) {
        const priority = this.getHighestPriority();
        const daysToAdd = priority === 'stat' ? 1 : priority === 'urgent' ? 2 : 7;
        this.expectedDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    }
});
labOrderSchema.statics.generateOrderNumber = async function (workplaceId) {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lastOrder = await this.findOne({
        workplaceId,
        orderNumber: { $regex: `^LAB${datePrefix}` }
    }, { orderNumber: 1 }, { sort: { createdAt: -1 } });
    let sequence = 1;
    if (lastOrder?.orderNumber) {
        const match = lastOrder.orderNumber.match(/(\d+)$/);
        if (match) {
            sequence = parseInt(match[1], 10) + 1;
        }
    }
    return `LAB${datePrefix}${sequence.toString().padStart(3, '0')}`;
};
labOrderSchema.statics.findActiveOrders = function (workplaceId) {
    return this.find({
        workplaceId,
        status: { $in: ['ordered', 'collected', 'processing'] },
        isDeleted: false
    }).sort({ orderDate: -1 });
};
labOrderSchema.statics.findOverdueOrders = function (workplaceId) {
    return this.find({
        workplaceId,
        expectedDate: { $lt: new Date() },
        status: { $in: ['ordered', 'collected', 'processing'] },
        isDeleted: false
    }).sort({ expectedDate: 1 });
};
labOrderSchema.statics.findByPatient = function (workplaceId, patientId) {
    return this.find({
        workplaceId,
        patientId,
        isDeleted: false
    }).sort({ orderDate: -1 });
};
labOrderSchema.statics.findByPriority = function (workplaceId, priority) {
    return this.find({
        workplaceId,
        'tests.priority': priority,
        status: { $in: ['ordered', 'collected', 'processing'] },
        isDeleted: false
    }).sort({ orderDate: -1 });
};
exports.default = mongoose_1.default.model('LabOrder', labOrderSchema);
//# sourceMappingURL=LabOrder.js.map