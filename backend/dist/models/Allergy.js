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
const allergySchema = new mongoose_1.Schema({
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
    substance: {
        type: String,
        required: [true, 'Allergy substance is required'],
        trim: true,
        maxlength: [100, 'Substance name cannot exceed 100 characters'],
    },
    reaction: {
        type: String,
        trim: true,
        maxlength: [200, 'Reaction description cannot exceed 200 characters'],
    },
    severity: {
        type: String,
        enum: tenancyGuard_1.SEVERITY_LEVELS,
        default: 'mild',
    },
    notedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(allergySchema);
allergySchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
allergySchema.index({ pharmacyId: 1, patientId: 1 });
allergySchema.index({ pharmacyId: 1, substance: 1 });
allergySchema.index({ pharmacyId: 1, isDeleted: 1 });
allergySchema.index({ severity: 1 });
allergySchema.index({ createdAt: -1 });
allergySchema.index({ pharmacyId: 1, patientId: 1, substance: 1 }, { unique: true, partialFilterExpression: { isDeleted: { $ne: true } } });
allergySchema.virtual('patient', {
    ref: 'Patient',
    localField: 'patientId',
    foreignField: '_id',
    justOne: true,
});
allergySchema.pre('save', function () {
    if (!this.notedAt) {
        this.notedAt = new Date();
    }
    if (this.substance) {
        this.substance = this.substance.trim();
    }
});
allergySchema.statics.findByPatient = function (patientId, pharmacyId) {
    const query = { patientId };
    if (pharmacyId) {
        return this.find(query).setOptions({ pharmacyId });
    }
    return this.find(query);
};
allergySchema.statics.findBySubstance = function (substance, pharmacyId) {
    const query = {
        substance: new RegExp(substance, 'i'),
    };
    if (pharmacyId) {
        return this.find(query).setOptions({ pharmacyId });
    }
    return this.find(query);
};
allergySchema.methods.isCritical = function () {
    return this.severity === 'severe';
};
exports.default = mongoose_1.default.model('Allergy', allergySchema);
//# sourceMappingURL=Allergy.js.map