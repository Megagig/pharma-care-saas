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
const rolePermissionSchema = new mongoose_1.Schema({
    roleId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Role',
        required: [true, 'Role ID is required'],
        index: true,
    },
    permissionAction: {
        type: String,
        required: [true, 'Permission action is required'],
        trim: true,
        lowercase: true,
        index: true,
        match: [
            /^[a-z0-9_-]+:[a-z0-9_-]+$/,
            'Permission action must follow format "resource:action"',
        ],
    },
    granted: {
        type: Boolean,
        required: true,
        default: true,
        index: true,
    },
    conditions: {
        timeRestrictions: {
            allowedHours: [
                {
                    start: {
                        type: Number,
                        min: 0,
                        max: 23,
                    },
                    end: {
                        type: Number,
                        min: 0,
                        max: 23,
                    },
                },
            ],
            allowedDays: [
                {
                    type: Number,
                    min: 0,
                    max: 6,
                },
            ],
            timezone: {
                type: String,
                default: 'UTC',
            },
        },
        ipRestrictions: {
            allowedIPs: [String],
            blockedIPs: [String],
            allowedNetworks: [
                {
                    type: String,
                    validate: {
                        validator: function (network) {
                            return /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(network);
                        },
                        message: 'Invalid CIDR notation for network',
                    },
                },
            ],
        },
        contextRestrictions: {
            workspaceOnly: {
                type: Boolean,
                default: false,
            },
            departmentIds: [
                {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Department',
                },
            ],
            resourceIds: [
                {
                    type: mongoose_1.Schema.Types.ObjectId,
                },
            ],
        },
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    priority: {
        type: Number,
        default: 0,
        index: true,
    },
    grantedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Granted by user ID is required'],
    },
    grantedAt: {
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
    collection: 'role_permissions',
});
rolePermissionSchema.index({ roleId: 1, permissionAction: 1 }, { unique: true });
rolePermissionSchema.index({ roleId: 1, granted: 1, isActive: 1 });
rolePermissionSchema.index({ permissionAction: 1, granted: 1, isActive: 1 });
rolePermissionSchema.index({ priority: -1, isActive: 1 });
rolePermissionSchema.index({ grantedBy: 1, grantedAt: -1 });
rolePermissionSchema.index({ revokedBy: 1, revokedAt: -1 });
rolePermissionSchema.index({ grantedAt: -1 });
rolePermissionSchema.pre('save', async function (next) {
    const roleExists = await mongoose_1.default.model('Role').findById(this.roleId);
    if (!roleExists) {
        return next(new Error('Referenced role does not exist'));
    }
    const permissionExists = await mongoose_1.default.model('Permission').findOne({
        action: this.permissionAction,
    });
    if (!permissionExists) {
        console.warn(`Permission '${this.permissionAction}' not found in Permission model`);
    }
    if (this.isModified('isActive') && !this.isActive && !this.revokedAt) {
        this.revokedAt = new Date();
        this.revokedBy = this.lastModifiedBy;
    }
    next();
});
rolePermissionSchema.methods.checkTimeRestrictions = function (currentTime) {
    if (!this.conditions?.timeRestrictions) {
        return true;
    }
    const now = currentTime || new Date();
    const timeRestrictions = this.conditions.timeRestrictions;
    if (timeRestrictions.allowedHours && timeRestrictions.allowedHours.length > 0) {
        const currentHour = now.getHours();
        const isAllowedHour = timeRestrictions.allowedHours.some((timeRange) => {
            if (timeRange.start <= timeRange.end) {
                return currentHour >= timeRange.start && currentHour <= timeRange.end;
            }
            else {
                return currentHour >= timeRange.start || currentHour <= timeRange.end;
            }
        });
        if (!isAllowedHour) {
            return false;
        }
    }
    if (timeRestrictions.allowedDays && timeRestrictions.allowedDays.length > 0) {
        const currentDay = now.getDay();
        if (!timeRestrictions.allowedDays.includes(currentDay)) {
            return false;
        }
    }
    return true;
};
rolePermissionSchema.methods.checkIPRestrictions = function (clientIP) {
    if (!this.conditions?.ipRestrictions) {
        return true;
    }
    const ipRestrictions = this.conditions.ipRestrictions;
    if (ipRestrictions.blockedIPs && ipRestrictions.blockedIPs.includes(clientIP)) {
        return false;
    }
    if (ipRestrictions.allowedIPs && ipRestrictions.allowedIPs.length > 0) {
        if (!ipRestrictions.allowedIPs.includes(clientIP)) {
            return false;
        }
    }
    if (ipRestrictions.allowedNetworks && ipRestrictions.allowedNetworks.length > 0) {
        const isInAllowedNetwork = ipRestrictions.allowedNetworks.some((network) => {
            const networkPrefix = network.split('/')[0];
            if (!networkPrefix)
                return false;
            const lastDotIndex = networkPrefix.lastIndexOf('.');
            if (lastDotIndex === -1)
                return false;
            return clientIP.startsWith(networkPrefix.substring(0, lastDotIndex));
        });
        if (!isInAllowedNetwork) {
            return false;
        }
    }
    return true;
};
rolePermissionSchema.methods.checkContextRestrictions = function (context) {
    if (!this.conditions?.contextRestrictions) {
        return true;
    }
    const contextRestrictions = this.conditions.contextRestrictions;
    if (contextRestrictions.workspaceOnly && !context.workspaceId) {
        return false;
    }
    if (contextRestrictions.departmentIds && contextRestrictions.departmentIds.length > 0) {
        if (!context.departmentId ||
            !contextRestrictions.departmentIds.some((id) => id.equals(context.departmentId))) {
            return false;
        }
    }
    if (contextRestrictions.resourceIds && contextRestrictions.resourceIds.length > 0) {
        if (!context.resourceId ||
            !contextRestrictions.resourceIds.some((id) => id.equals(context.resourceId))) {
            return false;
        }
    }
    return true;
};
rolePermissionSchema.methods.evaluatePermission = function (context = {}) {
    if (!this.isActive) {
        return false;
    }
    if (!this.granted) {
        return false;
    }
    const timeAllowed = this.checkTimeRestrictions(context.currentTime);
    const ipAllowed = context.clientIP ? this.checkIPRestrictions(context.clientIP) : true;
    const contextAllowed = this.checkContextRestrictions({
        workspaceId: context.workspaceId,
        departmentId: context.departmentId,
        resourceId: context.resourceId,
    });
    return timeAllowed && ipAllowed && contextAllowed;
};
rolePermissionSchema.methods.revoke = function (revokedBy, reason) {
    this.isActive = false;
    this.revokedBy = revokedBy;
    this.revokedAt = new Date();
    this.lastModifiedBy = revokedBy;
    if (reason) {
        this.revocationReason = reason;
    }
};
rolePermissionSchema.statics.findByRole = function (roleId, activeOnly = true) {
    const query = { roleId };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).sort({ priority: -1, permissionAction: 1 });
};
rolePermissionSchema.statics.findByPermission = function (permissionAction, activeOnly = true) {
    const query = { permissionAction };
    if (activeOnly) {
        query.isActive = true;
    }
    return this.find(query).populate('roleId').sort({ priority: -1 });
};
rolePermissionSchema.statics.resolvePermissionConflicts = function (rolePermissions) {
    if (rolePermissions.length === 0) {
        return false;
    }
    const sortedPermissions = rolePermissions.sort((a, b) => b.priority - a.priority);
    return sortedPermissions[0]?.granted || false;
};
exports.default = mongoose_1.default.model('RolePermission', rolePermissionSchema);
//# sourceMappingURL=RolePermission.js.map