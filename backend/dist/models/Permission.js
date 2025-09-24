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
const permissionSchema = new mongoose_1.Schema({
    action: {
        type: String,
        required: [true, 'Permission action is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[a-z0-9_-]+:[a-z0-9_-]+$/,
            'Permission action must follow format "resource:action" (e.g., "patient:read")',
        ],
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        lowercase: true,
        index: true,
        enum: [
            'patient',
            'medication',
            'clinical',
            'reports',
            'administration',
            'billing',
            'inventory',
            'communication',
            'audit',
            'system',
            'workspace',
            'user_management',
            'subscription',
            'integration',
            'analytics',
            'compliance',
            'security',
        ],
    },
    requiredSubscriptionTier: {
        type: String,
        enum: ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'],
        index: true,
    },
    requiredPlanFeatures: [
        {
            type: String,
            trim: true,
        },
    ],
    dependencies: [
        {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (action) {
                    return /^[a-z0-9_-]+:[a-z0-9_-]+$/.test(action);
                },
                message: 'Dependency must follow format "resource:action"',
            },
        },
    ],
    conflicts: [
        {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function (action) {
                    return /^[a-z0-9_-]+:[a-z0-9_-]+$/.test(action);
                },
                message: 'Conflict must follow format "resource:action"',
            },
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    isSystemPermission: {
        type: Boolean,
        default: false,
        index: true,
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        default: 'low',
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    lastModifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    collection: 'permissions',
});
permissionSchema.index({ action: 1 }, { unique: true });
permissionSchema.index({ category: 1, isActive: 1 });
permissionSchema.index({ riskLevel: 1, isActive: 1 });
permissionSchema.index({ requiredSubscriptionTier: 1, isActive: 1 });
permissionSchema.index({ isSystemPermission: 1, isActive: 1 });
permissionSchema.index({ category: 1, riskLevel: 1, isActive: 1 });
permissionSchema.index({ requiredSubscriptionTier: 1, category: 1, isActive: 1 });
permissionSchema.index({
    action: 'text',
    displayName: 'text',
    description: 'text',
});
permissionSchema.pre('save', function (next) {
    this.dependencies = this.dependencies.filter(dep => dep !== this.action);
    this.conflicts = this.conflicts.filter(conflict => conflict !== this.action);
    const dependencySet = new Set(this.dependencies);
    const hasOverlap = this.conflicts.some(conflict => dependencySet.has(conflict));
    if (hasOverlap) {
        const error = new Error('Permission cannot have the same action in both dependencies and conflicts');
        return next(error);
    }
    next();
});
permissionSchema.pre('deleteOne', { document: true, query: false }, function (next) {
    const permission = this;
    if (permission.isSystemPermission) {
        const error = new Error('System permissions cannot be deleted');
        return next(error);
    }
    next();
});
permissionSchema.methods.checkSubscriptionRequirement = function (userSubscriptionTier, userPlanFeatures) {
    if (this.requiredSubscriptionTier) {
        const tierHierarchy = {
            free_trial: 0,
            basic: 1,
            pro: 2,
            pharmily: 3,
            network: 4,
            enterprise: 5,
        };
        const requiredLevel = tierHierarchy[this.requiredSubscriptionTier];
        const userLevel = tierHierarchy[userSubscriptionTier];
        if (userLevel < requiredLevel) {
            return false;
        }
    }
    if (this.requiredPlanFeatures && this.requiredPlanFeatures.length > 0) {
        const hasAllFeatures = this.requiredPlanFeatures.every((feature) => userPlanFeatures.includes(feature));
        if (!hasAllFeatures) {
            return false;
        }
    }
    return true;
};
permissionSchema.methods.validateDependencies = async function (grantedPermissions) {
    const missingDependencies = this.dependencies.filter((dep) => !grantedPermissions.includes(dep));
    return {
        valid: missingDependencies.length === 0,
        missingDependencies,
    };
};
permissionSchema.methods.validateConflicts = function (grantedPermissions) {
    const conflictingPermissions = this.conflicts.filter((conflict) => grantedPermissions.includes(conflict));
    return {
        valid: conflictingPermissions.length === 0,
        conflictingPermissions,
    };
};
permissionSchema.statics.getByCategory = function (category) {
    return this.find({ category, isActive: true }).sort({ displayName: 1 });
};
permissionSchema.statics.getSystemPermissions = function () {
    return this.find({ isSystemPermission: true, isActive: true }).sort({ action: 1 });
};
permissionSchema.statics.getByRiskLevel = function (riskLevel) {
    return this.find({ riskLevel, isActive: true }).sort({ action: 1 });
};
exports.default = mongoose_1.default.model('Permission', permissionSchema);
//# sourceMappingURL=Permission.js.map