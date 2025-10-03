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
exports.Workplace = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const nigerianStates = [
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'FCT',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
];
const workplaceSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Workplace name is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: [
            'Community',
            'Hospital',
            'Academia',
            'Industry',
            'Regulatory Body',
            'Other',
        ],
        required: [true, 'Workplace type is required'],
    },
    licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: [true, 'Workplace email is required'],
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email',
        ],
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    state: {
        type: String,
        enum: nigerianStates,
    },
    lga: {
        type: String,
        trim: true,
    },
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified',
    },
    documents: [
        {
            kind: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    logoUrl: String,
    inviteCode: {
        type: String,
        unique: true,
        index: true,
    },
    teamMembers: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    currentSubscriptionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Subscription',
        index: true,
    },
    currentPlanId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        index: true,
    },
    subscriptionStatus: {
        type: String,
        enum: ['trial', 'active', 'past_due', 'expired', 'canceled'],
        default: 'trial',
        index: true,
    },
    trialStartDate: {
        type: Date,
        index: true,
    },
    trialEndDate: {
        type: Date,
        index: true,
    },
    stats: {
        patientsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        usersCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    locations: [
        {
            id: {
                type: String,
                required: true,
            },
            name: {
                type: String,
                required: true,
                trim: true,
            },
            address: {
                type: String,
                required: true,
                trim: true,
            },
            isPrimary: {
                type: Boolean,
                default: false,
            },
            metadata: {
                type: mongoose_1.default.Schema.Types.Mixed,
                default: {},
            },
        },
    ],
    settings: {
        maxPendingInvites: {
            type: Number,
            default: 20,
            min: 1,
            max: 100,
        },
        allowSharedPatients: {
            type: Boolean,
            default: false,
        },
    },
}, { timestamps: true });
workplaceSchema.pre('save', async function (next) {
    if (this.isNew && !this.inviteCode) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            result = '';
            for (let i = 0; i < 6; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            const existing = await this.constructor.findOne({
                inviteCode: result,
            });
            if (!existing) {
                this.inviteCode = result;
                break;
            }
            attempts++;
        }
        if (!this.inviteCode) {
            this.inviteCode = 'WRK' + Date.now().toString().slice(-6);
        }
    }
    if (this.isNew && !this.trialStartDate) {
        const now = new Date();
        this.trialStartDate = now;
        this.trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        this.subscriptionStatus = 'trial';
    }
    if (this.isNew && !this.stats) {
        this.stats = {
            patientsCount: 0,
            usersCount: 1,
            lastUpdated: new Date(),
        };
    }
    if (this.isNew && !this.settings) {
        this.settings = {
            maxPendingInvites: 20,
            allowSharedPatients: false,
        };
    }
    if (this.isNew && (!this.locations || this.locations.length === 0)) {
        this.locations = [
            {
                id: 'primary',
                name: this.name,
                address: this.address || 'Main Location',
                isPrimary: true,
                metadata: {},
            },
        ];
    }
    next();
});
workplaceSchema.index({ ownerId: 1 });
workplaceSchema.index({ inviteCode: 1 }, { unique: true });
workplaceSchema.index({ name: 'text', type: 'text' });
workplaceSchema.index({ currentSubscriptionId: 1 });
workplaceSchema.index({ subscriptionStatus: 1 });
workplaceSchema.index({ trialEndDate: 1 });
workplaceSchema.index({ 'stats.lastUpdated': 1 });
workplaceSchema.virtual('subscriptionId').get(function () {
    return this.currentSubscriptionId;
});
workplaceSchema.virtual('subscriptionId').set(function (value) {
    this.currentSubscriptionId = value;
});
workplaceSchema.set('toJSON', { virtuals: true });
workplaceSchema.set('toObject', { virtuals: true });
const Workplace = mongoose_1.default.model('Workplace', workplaceSchema);
exports.Workplace = Workplace;
exports.default = Workplace;
//# sourceMappingURL=Workplace.js.map