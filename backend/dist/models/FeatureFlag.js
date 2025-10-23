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
exports.FeatureFlag = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const FeatureFlagSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    allowedTiers: [{
            type: String,
            trim: true,
        }],
    allowedRoles: [{
            type: String,
            trim: true,
        }],
    customRules: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    metadata: {
        category: {
            type: String,
            default: 'core',
        },
        priority: {
            type: String,
            default: 'medium',
        },
        tags: [{
                type: String,
                trim: true,
            }],
        displayOrder: {
            type: Number,
            default: 0,
        },
        marketingDescription: {
            type: String,
            trim: true,
        },
        isMarketingFeature: {
            type: Boolean,
            default: false,
        },
        icon: {
            type: String,
            trim: true,
        },
    },
    targetingRules: {
        pharmacies: [{
                type: String,
                trim: true,
            }],
        userGroups: [{
                type: String,
                trim: true,
            }],
        percentage: {
            type: Number,
            min: 0,
            max: 100,
        },
        conditions: {
            dateRange: {
                startDate: {
                    type: Date,
                },
                endDate: {
                    type: Date,
                },
            },
            userAttributes: {
                type: mongoose_1.Schema.Types.Mixed,
            },
            workspaceAttributes: {
                type: mongoose_1.Schema.Types.Mixed,
            },
        },
    },
    usageMetrics: {
        totalUsers: {
            type: Number,
            default: 0,
        },
        activeUsers: {
            type: Number,
            default: 0,
        },
        usagePercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        lastUsed: {
            type: Date,
        },
        usageByPlan: [{
                plan: String,
                userCount: Number,
                percentage: Number,
            }],
        usageByWorkspace: [{
                workspaceId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Workplace',
                },
                workspaceName: String,
                userCount: Number,
            }],
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
FeatureFlagSchema.index({ key: 1, isActive: 1 });
FeatureFlagSchema.index({ 'metadata.category': 1, isActive: 1 });
FeatureFlagSchema.index({ allowedTiers: 1, isActive: 1 });
FeatureFlagSchema.index({ 'metadata.isMarketingFeature': 1, isActive: 1 });
FeatureFlagSchema.index({ 'metadata.displayOrder': 1 });
FeatureFlagSchema.index({ 'targetingRules.pharmacies': 1 });
FeatureFlagSchema.index({ 'targetingRules.userGroups': 1 });
FeatureFlagSchema.index({ 'usageMetrics.lastUsed': -1 });
FeatureFlagSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
const FeatureFlag = mongoose_1.default.model('FeatureFlag', FeatureFlagSchema);
exports.FeatureFlag = FeatureFlag;
exports.default = FeatureFlag;
//# sourceMappingURL=FeatureFlag.js.map