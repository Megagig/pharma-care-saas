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
const drugCacheSchema = new mongoose_1.Schema({
    rxcui: {
        type: String,
        index: true,
        sparse: true
    },
    drugName: {
        type: String,
        required: [true, 'Drug name is required'],
        trim: true,
        index: true
    },
    genericName: {
        type: String,
        trim: true,
        index: true
    },
    brandNames: [String],
    strength: String,
    dosageForm: String,
    manufacturer: String,
    apiSource: {
        type: String,
        enum: ['rxnorm', 'dailymed', 'openfda', 'rxnav'],
        required: true,
        index: true
    },
    apiResponseData: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    },
    searchTerms: [{
            type: String,
            index: true
        }],
    lastUpdated: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    therapeuticClass: String,
    dea: String,
    ndc: [String]
}, { timestamps: true });
drugCacheSchema.index({ drugName: 'text', genericName: 'text', searchTerms: 'text' });
drugCacheSchema.index({ apiSource: 1, rxcui: 1 });
drugCacheSchema.index({ isActive: 1, expiresAt: 1 });
exports.default = mongoose_1.default.model('DrugCache', drugCacheSchema);
//# sourceMappingURL=DrugCache.js.map