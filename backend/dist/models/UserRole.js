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
const userRoleSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    roleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Role ID is required'],
        index: true,
    },
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        index: true,
        sparse: true,
    },
    isTemporary: {
        type: Boolean,
        default: false,
        index: true,
    },
    expiresAt: {
        type: Date,
        index: true,
        validate: {
            validator: function (expiresAt) {
                if (this.isTemporary) {
                    return expiresAt && expiresAt > new Date();
                }
                return !expiresAt;
            },
            message: 'Temporary assignments must have a future expiration date',
        },
    },
    assignmentReason: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    assignmentContext: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    assignedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Assigned by user ID is required'],
    },
    assignedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    lastModifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Last modified by user ID is required'],
    },
    revokedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    revokedAt: {
        type: Date,
    },
    revocationReason: {
        type: String,
        trim: true,
        maxlength: 500,
    },
}, {
    timestamps: true,
    collection: 'user_roles',
});
userRoleSchema.index({ userId: 1, roleId: 1, workspaceId: 1 }, { unique: true });
userRoleSchema.index({ userId: 1, isActive: 1 });
userRoleSchema.index({ roleId: 1, isActive: 1 });
userRoleSchema.index({ workspaceId: 1, isActive: 1 });
userRoleSchema.index({ userId: 1, workspaceId: 1, isActive: 1 });
userRoleSchema.index({ expiresAt: 1, isActive: 1 });
userRoleSchema.index({ isTemporary: 1, expiresAt: 1, isActive: 1 });
userRoleSchema.index({ assignedBy: 1, assignedAt: -1 });
userRoleSchema.index({ revokedBy: 1, revokedAt: -1 });
userRoleSchema.index({ assignedAt: -1 });
userRoleSchema.index({ expiresAt: 1 }, {
    expireAfterSeconds: 0,
    partialFilterExpression: {
        isTemporary: true,
        isActive: true,
    },
});
userRoleSchema.pre('save', async function (next) {
    const userExists = await mongoose_1.default.model('User').findById(this.userId);
    if (!userExists) {
        return next(new Error('Referenced user does not exist'));
    }
    const roleExists = await mongoose_1.default.model('Role').findById(this.roleId);
    if (!roleExists) {
        return next(new Error('Referenced role does not exist'));
    }
    if (this.workspaceId) {
        const workspaceExists = await mongoose_1.default.model('Workplace').findById(this.workspaceId);
        if (!workspaceExists) {
            return next(new Error('Referenced workspace does not exist'));
        }
    }
    if (this.isModified('isActive') && !this.isActive && !this.revokedAt) {
        this.revokedAt = new Date();
        this.revokedBy = this.lastModifiedBy;
    }
    next();
});
userRoleSchema.pre('save', function (next) {
    if (this.isTemporary && this.expiresAt && this.expiresAt <= new Date() && this.isActive) {
        this.isActive = false;
        this.revokedAt = new Date();
        this.revocationReason = 'Automatic expiration';
    }
    next();
});
userRoleSchema.methods.isExpired = function () {
    return this.isTemporary && this.expiresAt && this.expiresAt <= new Date();
};
userRoleSchema.methods.getRemainingTime = function () {
    if (!this.isTemporary || !this.expiresAt) {
        return null;
    }
    const now = new Date().getTime();
    const expiration = this.expiresAt.getTime();
    return Math.max(0, expiration - now);
};
userRoleSchema.methods.revoke = function (revokedBy, reason) {
    this.isActive = false;
    this.revokedBy = revokedBy;
    this.revokedAt = new Date();
    this.lastModifiedBy = revokedBy;
    if (reason) {
        this.revocationReason = reason;
    }
};
userRoleSchema.methods.extend = function (newExpirationDate, modifiedBy) {
    if (!this.isTemporary) {
        throw new Error('Cannot extend non-temporary role assignment');
    }
    if (newExpirationDate <= new Date()) {
        throw new Error('New expiration date must be in the future');
    }
    this.expiresAt = newExpirationDate;
    this.lastModifiedBy = modifiedBy;
};
userRoleSchema.statics.findActiveByUser = function (userId, workspaceId) {
    const query = {
        userId,
        isActive: true,
        $or: [
            { isTemporary: false },
            { isTemporary: true, expiresAt: { $gt: new Date() } },
        ],
    };
    if (workspaceId) {
        query.workspaceId = workspaceId;
    }
    return this.find(query).populate('roleId');
};
userRoleSchema.statics.findActiveByRole = function (roleId, workspaceId) {
    const query = {
        roleId,
        isActive: true,
        $or: [
            { isTemporary: false },
            { isTemporary: true, expiresAt: { $gt: new Date() } },
        ],
    };
    if (workspaceId) {
        query.workspaceId = workspaceId;
    }
    return this.find(query).populate('userId');
};
userRoleSchema.statics.findExpiringSoon = function (hoursAhead = 24) {
    const futureTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
    return this.find({
        isTemporary: true,
        isActive: true,
        expiresAt: {
            $gte: new Date(),
            $lte: futureTime,
        },
    }).populate(['userId', 'roleId']);
};
userRoleSchema.statics.cleanupExpired = function () {
    return this.updateMany({
        isTemporary: true,
        isActive: true,
        expiresAt: { $lte: new Date() },
    }, {
        $set: {
            isActive: false,
            revokedAt: new Date(),
            revocationReason: 'Automatic expiration cleanup',
        },
    });
};
exports.default = mongoose_1.default.model('UserRole', userRoleSchema);
//# sourceMappingURL=UserRole.js.map