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
const featureFlagSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: /^[a-z_]+$/,
        index: true
    },
    description: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    allowedTiers: [{
            type: String,
            enum: ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'],
            index: true
        }],
    allowedRoles: [{
            type: String,
            enum: ['pharmacist', 'pharmacy_team', 'pharmacy_outlet', 'intern_pharmacist', 'super_admin', 'owner'],
            index: true
        }],
    customRules: {
        maxUsers: {
            type: Number,
            min: 1
        },
        requiredLicense: {
            type: Boolean,
            default: false
        },
        customLogic: {
            type: String
        }
    },
    metadata: {
        category: {
            type: String,
            required: true,
            enum: ['core', 'analytics', 'collaboration', 'integration', 'reporting', 'compliance', 'administration'],
            index: true
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        tags: [String]
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });
featureFlagSchema.index({ isActive: 1, allowedTiers: 1 });
featureFlagSchema.index({ isActive: 1, allowedRoles: 1 });
featureFlagSchema.index({ 'metadata.category': 1, isActive: 1 });
exports.default = mongoose_1.default.model('FeatureFlag', featureFlagSchema);
//# sourceMappingURL=FeatureFlag.js.map