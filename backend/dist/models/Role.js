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
const roleSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[a-z0-9_-]+$/,
            'Role name can only contain lowercase letters, numbers, underscores, and hyphens',
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
        enum: ['system', 'workplace', 'custom'],
        required: true,
        default: 'custom',
        index: true,
    },
    parentRole: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Role',
        index: true,
        validate: {
            validator: async function (parentRoleId) {
                if (!parentRoleId)
                    return true;
                if (parentRoleId.equals(this._id)) {
                    return false;
                }
                const parentRole = await mongoose_1.default.model('Role').findById(parentRoleId);
                return !!parentRole;
            },
            message: 'Invalid parent role reference',
        },
    },
    childRoles: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Role',
        },
    ],
    hierarchyLevel: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 10,
        index: true,
    },
    permissions: [
        {
            type: String,
            trim: true,
            index: true,
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    isSystemRole: {
        type: Boolean,
        default: false,
        index: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
        index: true,
    },
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        index: true,
        sparse: true,
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
    collection: 'roles',
});
roleSchema.index({ name: 1 }, { unique: true });
roleSchema.index({ category: 1, isActive: 1 });
roleSchema.index({ workspaceId: 1, isActive: 1 });
roleSchema.index({ parentRole: 1 });
roleSchema.index({ hierarchyLevel: 1 });
roleSchema.index({ isSystemRole: 1, isActive: 1 });
roleSchema.index({ isDefault: 1, isActive: 1 });
roleSchema.index({ category: 1, workspaceId: 1, isActive: 1 });
roleSchema.index({ parentRole: 1, isActive: 1 });
roleSchema.index({ hierarchyLevel: 1, isActive: 1 });
roleSchema.pre('save', async function (next) {
    if (this.isModified('parentRole') || this.isNew) {
        if (this.parentRole) {
            const parentRole = await mongoose_1.default.model('Role').findById(this.parentRole);
            if (parentRole) {
                this.hierarchyLevel = parentRole.hierarchyLevel + 1;
            }
        }
        else {
            this.hierarchyLevel = 0;
        }
    }
    next();
});
roleSchema.pre('save', async function (next) {
    if (this.parentRole && this.isModified('parentRole')) {
        const visited = new Set();
        let currentRoleId = this.parentRole;
        while (currentRoleId) {
            const currentRoleIdStr = currentRoleId.toString();
            if (visited.has(currentRoleIdStr) || currentRoleIdStr === this._id.toString()) {
                const error = new Error('Circular dependency detected in role hierarchy');
                return next(error);
            }
            visited.add(currentRoleIdStr);
            const currentRole = await mongoose_1.default.model('Role').findById(currentRoleId);
            if (!currentRole)
                break;
            currentRoleId = currentRole.parentRole;
        }
    }
    next();
});
roleSchema.post('save', async function (doc) {
    if (doc.parentRole) {
        await mongoose_1.default.model('Role').findByIdAndUpdate(doc.parentRole, { $addToSet: { childRoles: doc._id } }, { new: true });
    }
});
roleSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    const role = this;
    if (role.isSystemRole) {
        const error = new Error('System roles cannot be deleted');
        return next(error);
    }
    if (role.childRoles && role.childRoles.length > 0) {
        const error = new Error('Cannot delete role with child roles. Remove child roles first.');
        return next(error);
    }
    if (role.parentRole) {
        await mongoose_1.default.model('Role').findByIdAndUpdate(role.parentRole, { $pull: { childRoles: role._id } }, { new: true });
    }
    next();
});
roleSchema.methods.getAllPermissions = async function () {
    const allPermissions = new Set(this.permissions);
    if (this.parentRole) {
        const parentRole = await mongoose_1.default.model('Role').findById(this.parentRole);
        if (parentRole && typeof parentRole.getAllPermissions === 'function') {
            const parentPermissions = await parentRole.getAllPermissions();
            parentPermissions.forEach((permission) => allPermissions.add(permission));
        }
    }
    return Array.from(allPermissions);
};
roleSchema.methods.hasPermission = function (permission) {
    return this.permissions.includes(permission);
};
roleSchema.methods.getHierarchyPath = async function () {
    const path = [this];
    let currentRole = this;
    while (currentRole.parentRole) {
        const parentRole = await mongoose_1.default.model('Role').findById(currentRole.parentRole);
        if (!parentRole)
            break;
        path.unshift(parentRole);
        currentRole = parentRole;
    }
    return path;
};
exports.default = mongoose_1.default.model('Role', roleSchema);
//# sourceMappingURL=Role.js.map