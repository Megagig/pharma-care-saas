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
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        index: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email',
        ],
    },
    phone: {
        type: String,
        index: true,
        sparse: true,
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    role: {
        type: String,
        enum: [
            'pharmacist',
            'pharmacy_team',
            'pharmacy_outlet',
            'intern_pharmacist',
            'super_admin',
            'owner',
        ],
        default: 'pharmacist',
        index: true,
    },
    status: {
        type: String,
        enum: [
            'pending',
            'active',
            'suspended',
            'license_pending',
            'license_rejected',
        ],
        default: 'pending',
        index: true,
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
        index: { expires: '24h' },
    },
    verificationCode: {
        type: String,
        index: { expires: '24h' },
    },
    resetToken: {
        type: String,
        index: { expires: '1h' },
    },
    workplaceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Workplace',
        index: true,
    },
    workplaceRole: {
        type: String,
        enum: [
            'Owner',
            'Staff',
            'Pharmacist',
            'Cashier',
            'Technician',
            'Assistant',
        ],
        index: true,
    },
    currentPlanId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
    },
    planOverride: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    currentSubscriptionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Subscription',
        index: true,
    },
    lastLoginAt: Date,
    licenseNumber: {
        type: String,
        sparse: true,
        index: true,
    },
    licenseDocument: {
        fileName: String,
        filePath: String,
        uploadedAt: Date,
        fileSize: Number,
        mimeType: String,
    },
    licenseStatus: {
        type: String,
        enum: ['not_required', 'pending', 'approved', 'rejected'],
        default: 'not_required',
        index: true,
    },
    licenseVerifiedAt: Date,
    licenseVerifiedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    licenseRejectionReason: String,
    licenseExpirationDate: Date,
    suspensionReason: String,
    suspendedAt: Date,
    suspendedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    reactivatedAt: Date,
    reactivatedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    parentUserId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    teamMembers: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    permissions: [
        {
            type: String,
            index: true,
        },
    ],
    assignedRoles: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Role',
            index: true,
        },
    ],
    directPermissions: [
        {
            type: String,
            index: true,
        },
    ],
    deniedPermissions: [
        {
            type: String,
            index: true,
        },
    ],
    cachedPermissions: {
        permissions: [String],
        lastUpdated: {
            type: Date,
            index: true,
        },
        expiresAt: {
            type: Date,
            index: true,
        },
        workspaceId: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Workplace',
        },
    },
    roleLastModifiedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    roleLastModifiedAt: {
        type: Date,
        index: true,
    },
    lastPermissionCheck: {
        type: Date,
        index: true,
    },
    subscriptionTier: {
        type: String,
        enum: ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'],
        default: 'free_trial',
        index: true,
    },
    trialStartDate: Date,
    trialEndDate: Date,
    features: [
        {
            type: String,
            index: true,
        },
    ],
    stripeCustomerId: {
        type: String,
        sparse: true,
        index: true,
    },
    notificationPreferences: {
        email: {
            type: Boolean,
            default: true,
        },
        sms: {
            type: Boolean,
            default: false,
        },
        push: {
            type: Boolean,
            default: true,
        },
        followUpReminders: {
            type: Boolean,
            default: true,
        },
        criticalAlerts: {
            type: Boolean,
            default: true,
        },
        dailyDigest: {
            type: Boolean,
            default: false,
        },
        weeklyReport: {
            type: Boolean,
            default: false,
        },
    },
    themePreference: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
    },
}, { timestamps: true });
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash'))
        return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
});
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};
userSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    return token;
};
userSchema.methods.generateVerificationCode = function () {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = crypto
        .createHash('sha256')
        .update(code)
        .digest('hex');
    return code;
};
userSchema.methods.generateResetToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetToken = crypto.createHash('sha256').update(token).digest('hex');
    return token;
};
userSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission) || this.role === 'super_admin';
};
userSchema.methods.hasFeature = function (feature) {
    return this.features.includes(feature) || this.role === 'super_admin';
};
userSchema.methods.getAllRoles = async function (workspaceId) {
    const UserRole = mongoose_1.default.model('UserRole');
    const query = {
        userId: this._id,
        isActive: true,
        $or: [
            { isTemporary: false },
            { isTemporary: true, expiresAt: { $gt: new Date() } },
        ],
    };
    if (workspaceId) {
        query.workspaceId = workspaceId;
    }
    const userRoles = await UserRole.find(query).populate('roleId');
    return userRoles.map((ur) => ur.roleId).filter(Boolean);
};
userSchema.methods.getAllPermissions = async function (workspaceId, useCache = true) {
    if (useCache &&
        this.cachedPermissions &&
        this.cachedPermissions.lastUpdated > new Date(Date.now() - 5 * 60 * 1000) &&
        (!workspaceId || this.cachedPermissions.workspaceId?.equals(workspaceId))) {
        return this.cachedPermissions.permissions;
    }
    const allPermissions = new Set();
    this.permissions.forEach((permission) => allPermissions.add(permission));
    this.directPermissions.forEach((permission) => allPermissions.add(permission));
    const roles = await this.getAllRoles(workspaceId);
    for (const role of roles) {
        const rolePermissions = await role.getAllPermissions();
        rolePermissions.forEach((permission) => allPermissions.add(permission));
    }
    this.deniedPermissions.forEach((permission) => allPermissions.delete(permission));
    const finalPermissions = Array.from(allPermissions);
    this.cachedPermissions = {
        permissions: finalPermissions,
        lastUpdated: new Date(),
        workspaceId: workspaceId,
    };
    return finalPermissions;
};
userSchema.methods.hasRolePermission = async function (permission, workspaceId) {
    if (this.deniedPermissions.includes(permission)) {
        return false;
    }
    if (this.directPermissions.includes(permission)) {
        return true;
    }
    if (this.permissions.includes(permission)) {
        return true;
    }
    const allPermissions = await this.getAllPermissions(workspaceId, true);
    return allPermissions.includes(permission);
};
userSchema.methods.assignRole = async function (roleId, assignedBy, workspaceId, options) {
    const UserRole = mongoose_1.default.model('UserRole');
    const existingAssignment = await UserRole.findOne({
        userId: this._id,
        roleId: roleId,
        workspaceId: workspaceId,
        isActive: true,
    });
    if (existingAssignment) {
        throw new Error('Role is already assigned to this user');
    }
    const userRole = new UserRole({
        userId: this._id,
        roleId: roleId,
        workspaceId: workspaceId,
        assignedBy: assignedBy,
        lastModifiedBy: assignedBy,
        isTemporary: options?.isTemporary || false,
        expiresAt: options?.expiresAt,
        assignmentReason: options?.reason,
    });
    await userRole.save();
    if (!this.assignedRoles.includes(roleId)) {
        this.assignedRoles.push(roleId);
    }
    this.roleLastModifiedBy = assignedBy;
    this.roleLastModifiedAt = new Date();
    this.cachedPermissions = undefined;
    await this.save();
    return userRole;
};
userSchema.methods.revokeRole = async function (roleId, revokedBy, workspaceId, reason) {
    const UserRole = mongoose_1.default.model('UserRole');
    const userRole = await UserRole.findOne({
        userId: this._id,
        roleId: roleId,
        workspaceId: workspaceId,
        isActive: true,
    });
    if (!userRole) {
        throw new Error('Role assignment not found');
    }
    userRole.revoke(revokedBy, reason);
    await userRole.save();
    const otherAssignments = await UserRole.findOne({
        userId: this._id,
        roleId: roleId,
        isActive: true,
        _id: { $ne: userRole._id },
    });
    if (!otherAssignments) {
        this.assignedRoles = this.assignedRoles.filter((id) => !id.equals(roleId));
    }
    this.roleLastModifiedBy = revokedBy;
    this.roleLastModifiedAt = new Date();
    this.cachedPermissions = undefined;
    await this.save();
};
userSchema.methods.grantDirectPermission = function (permission, grantedBy) {
    if (!this.directPermissions.includes(permission)) {
        this.directPermissions.push(permission);
    }
    this.deniedPermissions = this.deniedPermissions.filter((p) => p !== permission);
    this.roleLastModifiedBy = grantedBy;
    this.roleLastModifiedAt = new Date();
    this.cachedPermissions = undefined;
};
userSchema.methods.denyDirectPermission = function (permission, deniedBy) {
    if (!this.deniedPermissions.includes(permission)) {
        this.deniedPermissions.push(permission);
    }
    this.directPermissions = this.directPermissions.filter((p) => p !== permission);
    this.roleLastModifiedBy = deniedBy;
    this.roleLastModifiedAt = new Date();
    this.cachedPermissions = undefined;
};
userSchema.methods.clearPermissionCache = function () {
    this.cachedPermissions = undefined;
};
userSchema.index({ assignedRoles: 1 });
userSchema.index({ directPermissions: 1 });
userSchema.index({ deniedPermissions: 1 });
userSchema.index({ roleLastModifiedAt: -1 });
userSchema.index({ 'cachedPermissions.lastUpdated': -1 });
userSchema.index({ 'cachedPermissions.workspaceId': 1 });
userSchema.pre('save', function (next) {
    if (this.isNew || this.isModified('role')) {
        if (this.role === 'pharmacist' || this.role === 'intern_pharmacist') {
            this.licenseStatus =
                this.licenseStatus === 'not_required' ? 'pending' : this.licenseStatus;
        }
        else {
            this.licenseStatus = 'not_required';
        }
        if (this.isNew && this.subscriptionTier === 'free_trial') {
            this.trialStartDate = new Date();
            this.trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        }
    }
    next();
});
userSchema.pre('save', function (next) {
    if (this.isModified('assignedRoles') ||
        this.isModified('directPermissions') ||
        this.isModified('deniedPermissions')) {
        this.cachedPermissions = undefined;
        this.roleLastModifiedAt = new Date();
    }
    next();
});
exports.default = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map