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
const adherenceLogSchema = new mongoose_1.Schema({
    medicationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'MedicationManagement',
        required: true,
        index: true,
    },
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
    refillDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    adherenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    pillCount: {
        type: Number,
        min: 0,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
(0, tenancyGuard_1.addAuditFields)(adherenceLogSchema);
adherenceLogSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
adherenceLogSchema.index({ medicationId: 1, refillDate: 1 });
adherenceLogSchema.index({ patientId: 1, refillDate: -1 });
exports.default = mongoose_1.default.model('AdherenceLog', adherenceLogSchema);
//# sourceMappingURL=AdherenceLog.js.map