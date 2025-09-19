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
const manualLabTestSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Test name is required'],
        trim: true,
        maxlength: [200, 'Test name cannot exceed 200 characters'],
        index: true
    },
    code: {
        type: String,
        required: [true, 'Test code is required'],
        trim: true,
        uppercase: true,
        maxlength: [20, 'Test code cannot exceed 20 characters'],
        index: true
    },
    loincCode: {
        type: String,
        trim: true,
        maxlength: [20, 'LOINC code cannot exceed 20 characters'],
        index: true,
        sparse: true
    },
    specimenType: {
        type: String,
        required: [true, 'Specimen type is required'],
        trim: true,
        maxlength: [100, 'Specimen type cannot exceed 100 characters']
    },
    unit: {
        type: String,
        trim: true,
        maxlength: [20, 'Unit cannot exceed 20 characters']
    },
    refRange: {
        type: String,
        trim: true,
        maxlength: [100, 'Reference range cannot exceed 100 characters']
    },
    category: {
        type: String,
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters'],
        index: true
    }
}, { _id: false });
const manualLabOrderSchema = new mongoose_1.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [20, 'Order ID cannot exceed 20 characters'],
        index: true
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
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
    orderedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tests: {
        type: [manualLabTestSchema],
        required: true,
        validate: {
            validator: function (tests) {
                return tests.length > 0;
            },
            message: 'At least one test is required'
        }
    },
    indication: {
        type: String,
        required: [true, 'Clinical indication is required'],
        trim: true,
        maxlength: [1000, 'Indication cannot exceed 1000 characters']
    },
    requisitionFormUrl: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Requisition form URL cannot exceed 500 characters']
    },
    barcodeData: {
        type: String,
        required: true,
        unique: true,
        index: true,
        maxlength: [500, 'Barcode data cannot exceed 500 characters']
    },
    status: {
        type: String,
        enum: ['requested', 'sample_collected', 'result_awaited', 'completed', 'referred'],
        default: 'requested',
        required: true,
        index: true
    },
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine',
        index: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    consentObtained: {
        type: Boolean,
        required: true,
        validate: {
            validator: function (consent) {
                return consent === true;
            },
            message: 'Patient consent is required for manual lab orders'
        }
    },
    consentTimestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    consentObtainedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
(0, tenancyGuard_1.addAuditFields)(manualLabOrderSchema);
manualLabOrderSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
manualLabOrderSchema.index({ workplaceId: 1, orderId: 1 }, { unique: true });
manualLabOrderSchema.index({ workplaceId: 1, patientId: 1, createdAt: -1 });
manualLabOrderSchema.index({ workplaceId: 1, status: 1, createdAt: -1 });
manualLabOrderSchema.index({ workplaceId: 1, orderedBy: 1, createdAt: -1 });
manualLabOrderSchema.index({ workplaceId: 1, locationId: 1, status: 1 }, { sparse: true });
manualLabOrderSchema.index({ workplaceId: 1, priority: 1, createdAt: -1 });
manualLabOrderSchema.index({ workplaceId: 1, isDeleted: 1, createdAt: -1 });
manualLabOrderSchema.index({ barcodeData: 1 }, { unique: true });
manualLabOrderSchema.index({ createdAt: -1 });
manualLabOrderSchema.index({
    orderId: 'text',
    indication: 'text',
    'tests.name': 'text',
    notes: 'text'
});
manualLabOrderSchema.virtual('isActiveOrder').get(function () {
    return ['requested', 'sample_collected', 'result_awaited'].includes(this.status);
});
manualLabOrderSchema.methods.updateStatus = async function (status, updatedBy) {
    this.status = status;
    if (updatedBy) {
        this.updatedBy = updatedBy;
    }
    await this.save();
};
manualLabOrderSchema.methods.canBeModified = function () {
    return this.status === 'requested';
};
manualLabOrderSchema.methods.isActive = function () {
    return ['requested', 'sample_collected', 'result_awaited'].includes(this.status);
};
manualLabOrderSchema.pre('save', function () {
    if (this.consentObtained && !this.consentTimestamp) {
        this.consentTimestamp = new Date();
    }
});
manualLabOrderSchema.statics.generateNextOrderId = async function (workplaceId) {
    const today = new Date();
    const year = today.getFullYear();
    const datePrefix = `LAB-${year}-`;
    const lastOrder = await this.findOne({
        workplaceId,
        orderId: { $regex: `^${datePrefix}` }
    }, { orderId: 1 }, { sort: { createdAt: -1 } });
    let sequence = 1;
    if (lastOrder?.orderId) {
        const match = lastOrder.orderId.match(/LAB-\d{4}-(\d+)$/);
        if (match) {
            sequence = parseInt(match[1], 10) + 1;
        }
    }
    return `${datePrefix}${sequence.toString().padStart(4, '0')}`;
};
manualLabOrderSchema.statics.findActiveOrders = function (workplaceId) {
    return this.find({
        workplaceId,
        status: { $in: ['requested', 'sample_collected', 'result_awaited'] },
        isDeleted: false
    }).sort({ createdAt: -1 });
};
manualLabOrderSchema.statics.findByPatient = function (workplaceId, patientId) {
    return this.find({
        workplaceId,
        patientId,
        isDeleted: false
    }).sort({ createdAt: -1 });
};
manualLabOrderSchema.statics.findByBarcodeData = function (barcodeData) {
    return this.findOne({
        barcodeData,
        isDeleted: false
    });
};
manualLabOrderSchema.statics.findByStatus = function (workplaceId, status) {
    return this.find({
        workplaceId,
        status,
        isDeleted: false
    }).sort({ createdAt: -1 });
};
exports.default = mongoose_1.default.model('ManualLabOrder', manualLabOrderSchema);
//# sourceMappingURL=ManualLabOrder.js.map