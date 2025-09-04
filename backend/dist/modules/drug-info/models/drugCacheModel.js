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
exports.TherapyPlan = exports.DrugSearchHistory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const drugSearchHistorySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    searchTerm: {
        type: String,
        required: true,
        trim: true
    },
    searchResults: {
        type: mongoose_1.default.Schema.Types.Mixed,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const drugSchema = new mongoose_1.Schema({
    rxCui: String,
    name: {
        type: String,
        required: true
    },
    dosage: String,
    frequency: String,
    route: String,
    notes: String,
    monograph: mongoose_1.default.Schema.Types.Mixed,
    interactions: mongoose_1.default.Schema.Types.Mixed,
    adverseEffects: mongoose_1.default.Schema.Types.Mixed,
    formularyInfo: mongoose_1.default.Schema.Types.Mixed
});
const therapyPlanSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planName: {
        type: String,
        required: true,
        trim: true
    },
    drugs: [drugSchema],
    guidelines: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
exports.DrugSearchHistory = mongoose_1.default.model('DrugSearchHistory', drugSearchHistorySchema);
exports.TherapyPlan = mongoose_1.default.model('TherapyPlan', therapyPlanSchema);
//# sourceMappingURL=drugCacheModel.js.map