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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        index: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        index: true,
        sparse: true
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['pharmacist', 'technician', 'owner', 'admin'],
        default: 'pharmacist',
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending',
        index: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String,
        index: { expires: '24h' }
    },
    verificationCode: {
        type: String,
        index: { expires: '24h' }
    },
    resetToken: {
        type: String,
        index: { expires: '1h' }
    },
    pharmacyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        index: true
    },
    currentPlanId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    },
    planOverride: {
        type: mongoose_1.Schema.Types.Mixed
    },
    currentSubscriptionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Subscription',
        index: true
    },
    lastLoginAt: Date
}, { timestamps: true });
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash'))
        return next();
    this.passwordHash = await bcryptjs_1.default.hash(this.passwordHash, 12);
    next();
});
userSchema.methods.comparePassword = async function (password) {
    return await bcryptjs_1.default.compare(password, this.passwordHash);
};
userSchema.methods.generateVerificationToken = function () {
    const token = crypto_1.default.randomBytes(32).toString('hex');
    this.verificationToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
    return token;
};
userSchema.methods.generateVerificationCode = function () {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCode = crypto_1.default.createHash('sha256').update(code).digest('hex');
    return code;
};
userSchema.methods.generateResetToken = function () {
    const token = crypto_1.default.randomBytes(32).toString('hex');
    this.resetToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
    return token;
};
exports.default = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map