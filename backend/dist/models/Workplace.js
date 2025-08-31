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
    next();
});
workplaceSchema.index({ ownerId: 1 });
workplaceSchema.index({ inviteCode: 1 }, { unique: true });
workplaceSchema.index({ name: 'text', type: 'text' });
exports.default = mongoose_1.default.model('Workplace', workplaceSchema);
//# sourceMappingURL=Workplace.js.map