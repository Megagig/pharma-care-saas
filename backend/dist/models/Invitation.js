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
const invitationSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email',
        ],
        index: true,
    },
    code: {
        type: String,
        unique: true,
        length: 8,
        uppercase: true,
        index: true,
    },
    workspaceId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    invitedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        enum: ['Owner', 'Pharmacist', 'Technician', 'Intern'],
        required: [true, 'Role is required'],
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'used', 'canceled'],
        default: 'active',
        index: true,
    },
    expiresAt: {
        type: Date,
        index: true,
    },
    usedAt: {
        type: Date,
    },
    usedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    metadata: {
        inviterName: {
            type: String,
            required: true,
            trim: true,
        },
        workspaceName: {
            type: String,
            required: true,
            trim: true,
        },
        customMessage: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
}, { timestamps: true });
invitationSchema.pre('save', async function (next) {
    if (this.isNew && !this.code) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            result = '';
            for (let i = 0; i < 8; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            const existing = await this.constructor.findOne({
                code: result,
            });
            if (!existing) {
                this.code = result;
                break;
            }
            attempts++;
        }
        if (!this.code) {
            this.code = 'INV' + Date.now().toString().slice(-5);
        }
    }
    if (this.isNew && !this.expiresAt) {
        this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    next();
});
invitationSchema.index({ email: 1, workspaceId: 1 });
invitationSchema.index({ workspaceId: 1, status: 1 });
invitationSchema.index({ code: 1 }, { unique: true });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
invitationSchema.methods.isExpired = function () {
    return this.expiresAt < new Date() || this.status === 'expired';
};
invitationSchema.methods.canBeUsed = function () {
    return this.status === 'active' && !this.isExpired();
};
invitationSchema.methods.markAsUsed = function (userId) {
    this.status = 'used';
    this.usedAt = new Date();
    this.usedBy = userId;
};
invitationSchema.methods.cancel = function () {
    this.status = 'canceled';
};
invitationSchema.statics.findActiveByCode = function (code) {
    return this.findOne({ code, status: 'active' });
};
invitationSchema.statics.countPendingForWorkspace = function (workspaceId) {
    return this.countDocuments({ workspaceId, status: 'active' });
};
invitationSchema.statics.expireOldInvitations = async function () {
    const now = new Date();
    const result = await this.updateMany({
        status: 'active',
        expiresAt: { $lt: now }
    }, {
        $set: { status: 'expired' }
    });
    return result;
};
exports.default = mongoose_1.default.model('Invitation', invitationSchema);
//# sourceMappingURL=Invitation.js.map