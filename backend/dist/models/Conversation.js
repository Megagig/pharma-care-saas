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
const tenancyGuard_1 = require("../utils/tenancyGuard");
const conversationParticipantSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    role: {
        type: String,
        enum: ['pharmacist', 'doctor', 'patient', 'pharmacy_team', 'intern_pharmacist', 'pharmacy_outlet', 'nurse', 'admin'],
        required: true,
        index: true,
    },
    joinedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    leftAt: {
        type: Date,
        index: true,
    },
    permissions: [{
            type: String,
            enum: [
                'read_messages',
                'send_messages',
                'add_participants',
                'remove_participants',
                'edit_conversation',
                'delete_conversation',
                'upload_files',
                'view_patient_data',
                'manage_clinical_context'
            ],
        }],
    lastReadAt: {
        type: Date,
        index: true,
    },
}, { _id: false });
const conversationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        trim: true,
        maxlength: [200, 'Conversation title cannot exceed 200 characters'],
        index: 'text',
    },
    type: {
        type: String,
        enum: ['direct', 'group', 'patient_query', 'clinical_consultation'],
        required: true,
        index: true,
    },
    participants: {
        type: [conversationParticipantSchema],
        required: true,
        validate: {
            validator: function (participants) {
                return participants.length >= 1 && participants.length <= 50;
            },
            message: 'Conversation must have between 1 and 50 participants',
        },
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        index: true,
        validate: {
            validator: function (patientId) {
                if (['patient_query', 'clinical_consultation'].includes(this.type)) {
                    return !!patientId;
                }
                return true;
            },
            message: 'Patient ID is required for patient queries and clinical consultations',
        },
    },
    caseId: {
        type: String,
        trim: true,
        maxlength: [100, 'Case ID cannot exceed 100 characters'],
        index: true,
    },
    status: {
        type: String,
        enum: ['active', 'archived', 'resolved', 'closed'],
        default: 'active',
        required: true,
        index: true,
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        required: true,
        index: true,
    },
    tags: [{
            type: String,
            trim: true,
            maxlength: [50, 'Tag cannot exceed 50 characters'],
            index: true,
        }],
    lastMessageAt: {
        type: Date,
        default: Date.now,
        required: true,
        index: -1,
    },
    lastMessageId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        index: true,
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: new Map(),
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    metadata: {
        isEncrypted: {
            type: Boolean,
            default: true,
            required: true,
        },
        encryptionKeyId: {
            type: String,
            index: true,
        },
        clinicalContext: {
            diagnosis: {
                type: String,
                trim: true,
                maxlength: [500, 'Diagnosis cannot exceed 500 characters'],
            },
            medications: [{
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Medication',
                }],
            conditions: [{
                    type: String,
                    trim: true,
                    maxlength: [200, 'Condition cannot exceed 200 characters'],
                }],
            interventionIds: [{
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'ClinicalIntervention',
                }],
        },
    },
    deletedAt: {
        type: Date,
        index: true,
    },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(conversationSchema);
conversationSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
conversationSchema.index({ workplaceId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ workplaceId: 1, type: 1, status: 1 });
conversationSchema.index({ workplaceId: 1, patientId: 1, status: 1 });
conversationSchema.index({ workplaceId: 1, priority: 1, status: 1 });
conversationSchema.index({ 'participants.userId': 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ 'participants.userId': 1, workplaceId: 1 });
conversationSchema.index({ caseId: 1, workplaceId: 1 }, { sparse: true });
conversationSchema.index({ tags: 1, workplaceId: 1 });
conversationSchema.index({ createdBy: 1, workplaceId: 1 });
conversationSchema.index({ 'metadata.clinicalContext.interventionIds': 1 }, { sparse: true });
conversationSchema.index({
    title: 'text',
    'metadata.clinicalContext.diagnosis': 'text',
    'metadata.clinicalContext.conditions': 'text'
});
conversationSchema.virtual('activeParticipants').get(function () {
    return this.participants.filter(p => !p.leftAt);
});
conversationSchema.virtual('participantCount').get(function () {
    return this.participants.filter(p => !p.leftAt).length;
});
conversationSchema.methods.addParticipant = function (userId, role, permissions = ['read_messages', 'send_messages']) {
    const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString() && !p.leftAt);
    if (existingParticipant) {
        throw new Error('User is already a participant in this conversation');
    }
    this.participants.push({
        userId,
        role: role,
        joinedAt: new Date(),
        permissions,
    });
    this.unreadCount.set(userId.toString(), 0);
};
conversationSchema.methods.removeParticipant = function (userId) {
    const participant = this.participants.find(p => p.userId.toString() === userId.toString() && !p.leftAt);
    if (!participant) {
        throw new Error('User is not an active participant in this conversation');
    }
    participant.leftAt = new Date();
    this.unreadCount.delete(userId.toString());
};
conversationSchema.methods.updateLastMessage = function (messageId) {
    this.lastMessageAt = new Date();
    this.lastMessageId = messageId;
};
conversationSchema.methods.incrementUnreadCount = function (excludeUserId) {
    this.participants.forEach(participant => {
        if (!participant.leftAt &&
            (!excludeUserId || participant.userId.toString() !== excludeUserId.toString())) {
            const currentCount = this.unreadCount.get(participant.userId.toString()) || 0;
            this.unreadCount.set(participant.userId.toString(), currentCount + 1);
        }
    });
};
conversationSchema.methods.markAsRead = function (userId) {
    this.unreadCount.set(userId.toString(), 0);
    const participant = this.participants.find(p => p.userId.toString() === userId.toString() && !p.leftAt);
    if (participant) {
        participant.lastReadAt = new Date();
    }
};
conversationSchema.methods.hasParticipant = function (userId) {
    return this.participants.some(p => p.userId.toString() === userId.toString() && !p.leftAt);
};
conversationSchema.methods.getParticipantRole = function (userId) {
    const participant = this.participants.find(p => p.userId.toString() === userId.toString() && !p.leftAt);
    return participant ? participant.role : null;
};
conversationSchema.pre('save', function () {
    this.participants.forEach(participant => {
        if (!participant.permissions || participant.permissions.length === 0) {
            switch (participant.role) {
                case 'patient':
                    participant.permissions = ['read_messages', 'send_messages', 'upload_files'];
                    break;
                case 'pharmacist':
                case 'doctor':
                    participant.permissions = [
                        'read_messages', 'send_messages', 'upload_files',
                        'view_patient_data', 'manage_clinical_context'
                    ];
                    break;
                default:
                    participant.permissions = ['read_messages', 'send_messages'];
            }
        }
    });
    if (this.metadata.isEncrypted && !this.metadata.encryptionKeyId) {
        this.metadata.encryptionKeyId = `conv_${this._id}_${Date.now()}`;
    }
    if (!this.title) {
        switch (this.type) {
            case 'patient_query':
                this.title = 'Patient Query';
                break;
            case 'clinical_consultation':
                this.title = 'Clinical Consultation';
                break;
            case 'direct':
                this.title = 'Direct Message';
                break;
            case 'group':
                this.title = 'Group Discussion';
                break;
        }
    }
});
conversationSchema.statics.findByParticipant = function (userId, workplaceId, options = {}) {
    const query = {
        workplaceId,
        'participants.userId': userId,
        'participants.leftAt': { $exists: false },
        status: { $ne: 'closed' },
        ...options,
    };
    return this.find(query)
        .populate('participants.userId', 'firstName lastName role')
        .populate('patientId', 'firstName lastName mrn')
        .populate('lastMessageId', 'content.text senderId createdAt')
        .sort({ lastMessageAt: -1 });
};
conversationSchema.statics.findByPatient = function (patientId, workplaceId) {
    return this.find({
        workplaceId,
        patientId,
        status: { $ne: 'closed' },
    })
        .populate('participants.userId', 'firstName lastName role')
        .sort({ lastMessageAt: -1 });
};
exports.default = mongoose_1.default.model('Conversation', conversationSchema);
//# sourceMappingURL=Conversation.js.map