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
const pharmacySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Pharmacy name is required'],
        trim: true
    },
    licenseNumber: {
        type: String,
        required: [true, 'PCN license number is required'],
        unique: true,
        sparse: true,
        index: true
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    state: {
        type: String,
        required: [true, 'State is required']
    },
    lga: {
        type: String,
        required: [true, 'Local Government Area is required']
    },
    ownerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
    },
    documents: [{
            kind: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
    logoUrl: String
}, { timestamps: true });
pharmacySchema.index({ licenseNumber: 1 }, { unique: true, sparse: true });
pharmacySchema.index({ ownerId: 1 });
exports.default = mongoose_1.default.model('Pharmacy', pharmacySchema);
//# sourceMappingURL=Pharmacy.js.map