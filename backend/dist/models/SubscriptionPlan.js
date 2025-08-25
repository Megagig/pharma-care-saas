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
const subscriptionPlanSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true,
    },
    priceNGN: {
        type: Number,
        required: [true, 'Price in NGN is required'],
        min: 0,
    },
    billingInterval: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true,
    },
    tier: {
        type: String,
        enum: ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'],
        required: true,
    },
    trialDuration: {
        type: Number,
        default: null,
    },
    popularPlan: {
        type: Boolean,
        default: false,
    },
    isContactSales: {
        type: Boolean,
        default: false,
    },
    whatsappNumber: {
        type: String,
        default: null,
    },
    description: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    features: {
        patientLimit: {
            type: Number,
            default: null,
        },
        reminderSmsMonthlyLimit: {
            type: Number,
            default: null,
        },
        reportsExport: {
            type: Boolean,
            default: false,
        },
        careNoteExport: {
            type: Boolean,
            default: false,
        },
        adrModule: {
            type: Boolean,
            default: false,
        },
        multiUserSupport: {
            type: Boolean,
            default: false,
        },
        teamSize: {
            type: Number,
            default: 1,
        },
        apiAccess: {
            type: Boolean,
            default: false,
        },
        auditLogs: {
            type: Boolean,
            default: false,
        },
        dataBackup: {
            type: Boolean,
            default: false,
        },
        clinicalNotesLimit: {
            type: Number,
            default: null,
        },
        patientRecordsLimit: {
            type: Number,
            default: null,
        },
        prioritySupport: {
            type: Boolean,
            default: false,
        },
        emailReminders: {
            type: Boolean,
            default: true,
        },
        smsReminders: {
            type: Boolean,
            default: false,
        },
        advancedReports: {
            type: Boolean,
            default: false,
        },
        drugTherapyManagement: {
            type: Boolean,
            default: false,
        },
        teamManagement: {
            type: Boolean,
            default: false,
        },
        dedicatedSupport: {
            type: Boolean,
            default: false,
        },
        integrations: {
            type: Boolean,
            default: false,
        },
        customIntegrations: {
            type: Boolean,
            default: false,
        },
        adrReporting: {
            type: Boolean,
            default: false,
        },
        drugInteractionChecker: {
            type: Boolean,
            default: false,
        },
        doseCalculator: {
            type: Boolean,
            default: false,
        },
        multiLocationDashboard: {
            type: Boolean,
            default: false,
        },
        sharedPatientRecords: {
            type: Boolean,
            default: false,
        },
        groupAnalytics: {
            type: Boolean,
            default: false,
        },
        cdss: {
            type: Boolean,
            default: false,
        },
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model('SubscriptionPlan', subscriptionPlanSchema);
//# sourceMappingURL=SubscriptionPlan.js.map