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
const medicationHistorySchema = new mongoose_1.Schema({
    name: { type: String },
    dosage: { type: String },
    frequency: { type: String },
    route: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    indication: { type: String },
    prescriber: { type: String },
    cost: { type: Number },
    sellingPrice: { type: Number },
    status: {
        type: String,
        enum: ['active', 'archived', 'cancelled'],
    },
    updatedAt: { type: Date, required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
});
const medicationManagementSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true,
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    dosage: {
        type: String,
        required: true,
        trim: true,
    },
    frequency: {
        type: String,
        required: true,
        trim: true,
    },
    route: {
        type: String,
        required: true,
        trim: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    indication: {
        type: String,
        trim: true,
    },
    prescriber: {
        type: String,
        trim: true,
    },
    cost: {
        type: Number,
        min: 0,
    },
    sellingPrice: {
        type: Number,
        min: 0,
    },
    allergyCheck: {
        status: {
            type: Boolean,
            default: false,
        },
        details: {
            type: String,
            trim: true,
        },
    },
    interactionCheck: {
        status: {
            type: Boolean,
            default: false,
        },
        details: {
            type: String,
            trim: true,
        },
        severity: {
            type: String,
            enum: ['minor', 'moderate', 'severe'],
        },
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'cancelled'],
        default: 'active',
    },
    history: [medicationHistorySchema],
}, {
    timestamps: true,
});
(0, tenancyGuard_1.addAuditFields)(medicationManagementSchema);
medicationManagementSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
medicationManagementSchema.index({ patientId: 1, status: 1 });
exports.default = mongoose_1.default.model('MedicationManagement', medicationManagementSchema);
//# sourceMappingURL=MedicationManagement.js.map