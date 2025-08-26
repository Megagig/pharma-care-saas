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
const conditionSchema = new mongoose_1.Schema({
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
    name: {
        type: String,
        required: [true, 'Condition name is required'],
        trim: true,
        maxlength: [100, 'Condition name cannot exceed 100 characters'],
    },
    snomedId: {
        type: String,
        trim: true,
        validate: {
            validator: function (value) {
                if (value) {
                    return /^\d{6,18}$/.test(value);
                }
                return true;
            },
            message: 'Invalid SNOMED CT identifier format',
        },
        index: true,
    },
    onsetDate: {
        type: Date,
        validate: {
            validator: function (value) {
                if (value) {
                    return value <= new Date();
                }
                return true;
            },
            message: 'Onset date cannot be in the future',
        },
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'remission'],
        default: 'active',
        index: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(conditionSchema);
conditionSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
conditionSchema.index({ pharmacyId: 1, patientId: 1 });
conditionSchema.index({ pharmacyId: 1, name: 1 });
conditionSchema.index({ pharmacyId: 1, status: 1 });
conditionSchema.index({ pharmacyId: 1, isDeleted: 1 });
conditionSchema.index({ snomedId: 1 }, { sparse: true });
conditionSchema.index({ onsetDate: -1 });
conditionSchema.index({ createdAt: -1 });
conditionSchema.index({ pharmacyId: 1, patientId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } });
conditionSchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
conditionSchema.pre('save', function () {
    if (this.name) {
        this.name = this.name.trim();
    }
    if ((this.status === 'resolved' || this.status === 'remission') &&
        !this.onsetDate) {
        this.onsetDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
});
conditionSchema.statics.findByPatient = function (patientId, status, pharmacyId) {
    const query = { patientId };
    if (status) {
        query.status = status;
    }
    if (pharmacyId) {
        return this.find(query).setOptions({ pharmacyId }).sort({ onsetDate: -1 });
    }
    return this.find(query).sort({ onsetDate: -1 });
};
conditionSchema.statics.findActiveConditions = function (pharmacyId) {
    const query = { status: 'active' };
    if (pharmacyId) {
        return this.find(query).setOptions({ pharmacyId }).sort({ createdAt: -1 });
    }
    return this.find(query).sort({ createdAt: -1 });
};
conditionSchema.statics.searchByName = function (searchTerm, pharmacyId) {
    const query = {
        name: new RegExp(searchTerm, 'i'),
    };
    if (pharmacyId) {
        return this.find(query).setOptions({ pharmacyId }).sort({ name: 1 });
    }
    return this.find(query).sort({ name: 1 });
};
conditionSchema.methods.isActive = function () {
    return this.status === 'active';
};
conditionSchema.methods.resolve = function (notes) {
    this.status = 'resolved';
    if (notes) {
        this.notes = notes;
    }
};
conditionSchema.methods.setRemission = function (notes) {
    this.status = 'remission';
    if (notes) {
        this.notes = notes;
    }
};
conditionSchema.virtual('duration').get(function () {
    if (this.onsetDate && this.status === 'resolved') {
        const endDate = this.updatedAt || new Date();
        const diffTime = Math.abs(endDate.getTime() - this.onsetDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    return null;
});
exports.default = mongoose_1.default.model('Condition', conditionSchema);
//# sourceMappingURL=Condition.js.map