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
const messageAttachmentSchema = new mongoose_1.Schema({
    fileId: {
        type: String,
        required: true,
        index: true,
    },
    fileName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    fileSize: {
        type: Number,
        required: true,
        min: [0, 'File size cannot be negative'],
        max: [100 * 1024 * 1024, 'File size cannot exceed 100MB'],
    },
    mimeType: {
        type: String,
        required: true,
        validate: {
            validator: function (mimeType) {
                const allowedTypes = [
                    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                    'application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain', 'text/csv',
                    'audio/mpeg', 'audio/wav', 'audio/ogg',
                    'video/mp4', 'video/webm'
                ];
                return allowedTypes.includes(mimeType);
            },
            message: 'File type not allowed for healthcare communication',
        },
    },
    secureUrl: {
        type: String,
        required: true,
        validate: {
            validator: function (url) {
                return /^https?:\/\/.+/.test(url);
            },
            message: 'Invalid secure URL format',
        },
    },
    thumbnailUrl: {
        type: String,
        validate: {
            validator: function (url) {
                return !url || /^https?:\/\/.+/.test(url);
            },
            message: 'Invalid thumbnail URL format',
        },
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, { _id: false });
const messageReactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    emoji: {
        type: String,
        required: true,
        validate: {
            validator: function (emoji) {
                const allowedEmojis = [
                    '👍', '👎', '❤️', '😊', '😢', '😮', '😡', '🤔',
                    '✅', '❌', '⚠️', '🚨', '📋', '💊', '🩺', '📊'
                ];
                return allowedEmojis.includes(emoji);
            },
            message: 'Emoji not allowed in healthcare communication',
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, { _id: false });
const messageReadReceiptSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    readAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, { _id: false });
const messageEditHistorySchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: true,
    },
    editedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    editedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    reason: {
        type: String,
        trim: true,
        maxlength: [200, 'Edit reason cannot exceed 200 characters'],
    },
}, { _id: false });
const messageSchema = new mongoose_1.Schema({
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    content: {
        text: {
            type: String,
            trim: true,
            maxlength: [10000, 'Message content cannot exceed 10,000 characters'],
            validate: {
                validator: function (text) {
                    if (this.content.type === 'text') {
                        return !!text && text.length > 0;
                    }
                    return true;
                },
                message: 'Text content is required for text messages',
            },
        },
        type: {
            type: String,
            enum: ['text', 'file', 'image', 'clinical_note', 'system', 'voice_note'],
            required: true,
            index: true,
        },
        attachments: [messageAttachmentSchema],
        metadata: {
            originalText: String,
            clinicalData: {
                patientId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Patient',
                },
                interventionId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'ClinicalIntervention',
                },
                medicationId: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Medication',
                },
            },
            systemAction: {
                action: {
                    type: String,
                    enum: [
                        'participant_added', 'participant_removed', 'conversation_created',
                        'conversation_archived', 'conversation_resolved', 'priority_changed',
                        'clinical_context_updated', 'file_shared', 'intervention_linked'
                    ],
                },
                performedBy: {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'User',
                },
                timestamp: Date,
            },
        },
    },
    threadId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        index: true,
    },
    parentMessageId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        index: true,
    },
    mentions: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        }],
    reactions: [messageReactionSchema],
    status: {
        type: String,
        enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
        default: 'sent',
        required: true,
        index: true,
    },
    priority: {
        type: String,
        enum: ['normal', 'high', 'urgent'],
        default: 'normal',
        required: true,
        index: true,
    },
    readBy: [messageReadReceiptSchema],
    editHistory: [messageEditHistorySchema],
    isEncrypted: {
        type: Boolean,
        default: true,
        required: true,
    },
    encryptionKeyId: {
        type: String,
        index: true,
    },
    deletedAt: {
        type: Date,
        index: true,
    },
    deletedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(messageSchema);
messageSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, threadId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ workplaceId: 1, createdAt: -1 });
messageSchema.index({ mentions: 1, createdAt: -1 });
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ priority: 1, createdAt: -1 });
messageSchema.index({ 'content.type': 1, conversationId: 1 });
messageSchema.index({ parentMessageId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, status: 1, createdAt: -1 });
messageSchema.index({ workplaceId: 1, senderId: 1, createdAt: -1 });
messageSchema.index({ workplaceId: 1, 'content.type': 1, createdAt: -1 });
messageSchema.index({
    'content.text': 'text',
    'content.metadata.originalText': 'text'
});
messageSchema.virtual('replyCount', {
    ref: 'Message',
    localField: '_id',
    foreignField: 'parentMessageId',
    count: true,
});
messageSchema.virtual('attachmentCount').get(function () {
    return this.content.attachments?.length || 0;
});
messageSchema.virtual('readCount').get(function () {
    return this.readBy.length;
});
messageSchema.methods.addReaction = function (userId, emoji) {
    this.reactions = this.reactions.filter(r => !(r.userId.toString() === userId.toString() && r.emoji === emoji));
    this.reactions.push({
        userId,
        emoji,
        createdAt: new Date(),
    });
};
messageSchema.methods.removeReaction = function (userId, emoji) {
    this.reactions = this.reactions.filter(r => !(r.userId.toString() === userId.toString() && r.emoji === emoji));
};
messageSchema.methods.markAsRead = function (userId) {
    const existingRead = this.readBy.find(r => r.userId.toString() === userId.toString());
    if (!existingRead) {
        this.readBy.push({
            userId,
            readAt: new Date(),
        });
    }
};
messageSchema.methods.isReadBy = function (userId) {
    return this.readBy.some(r => r.userId.toString() === userId.toString());
};
messageSchema.methods.addEdit = function (content, editedBy, reason) {
    if (this.content.text) {
        this.editHistory.push({
            content: this.content.text,
            editedAt: new Date(),
            editedBy,
            reason,
        });
    }
    this.content.text = content;
    this.updatedBy = editedBy;
};
messageSchema.methods.getMentionedUsers = function () {
    return this.mentions;
};
messageSchema.methods.hasAttachments = function () {
    return !!(this.content.attachments && this.content.attachments.length > 0);
};
messageSchema.methods.getAttachmentCount = function () {
    return this.content.attachments?.length || 0;
};
messageSchema.pre('save', function () {
    if (this.isEncrypted && !this.encryptionKeyId) {
        this.encryptionKeyId = `msg_${this._id}_${Date.now()}`;
    }
    if (['file', 'image'].includes(this.content.type)) {
        if (!this.content.attachments || this.content.attachments.length === 0) {
            throw new Error(`${this.content.type} messages must have attachments`);
        }
    }
    if (this.content.type === 'system') {
        if (!this.content.metadata?.systemAction) {
            throw new Error('System messages must have system action metadata');
        }
    }
    if (!this.createdBy) {
        this.createdBy = this.senderId;
    }
});
messageSchema.post('save', async function () {
    try {
        const Conversation = mongoose_1.default.model('Conversation');
        await Conversation.findByIdAndUpdate(this.conversationId, {
            lastMessageAt: this.createdAt,
            lastMessageId: this._id,
            $inc: {
                [`unreadCount.${this.senderId}`]: 0,
            },
        });
        const conversation = await Conversation.findById(this.conversationId);
        if (conversation) {
            conversation.incrementUnreadCount(this.senderId);
            await conversation.save();
        }
    }
    catch (error) {
        console.error('Error updating conversation after message save:', error);
    }
});
messageSchema.statics.findByConversation = function (conversationId, options = {}) {
    const { limit = 50, before, after, threadId } = options;
    const query = { conversationId };
    if (threadId) {
        query.threadId = threadId;
    }
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }
    if (after) {
        query.createdAt = { $gt: new Date(after) };
    }
    return this.find(query)
        .populate('senderId', 'firstName lastName role')
        .populate('mentions', 'firstName lastName role')
        .populate('readBy.userId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit);
};
messageSchema.statics.searchMessages = function (workplaceId, searchQuery, options = {}) {
    const { conversationId, senderId, type, limit = 50 } = options;
    const query = {
        workplaceId,
        $text: { $search: searchQuery },
    };
    if (conversationId) {
        query.conversationId = conversationId;
    }
    if (senderId) {
        query.senderId = senderId;
    }
    if (type) {
        query['content.type'] = type;
    }
    return this.find(query, { score: { $meta: 'textScore' } })
        .populate('senderId', 'firstName lastName role')
        .populate('conversationId', 'title type')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .limit(limit);
};
exports.default = mongoose_1.default.model('Message', messageSchema);
//# sourceMappingURL=Message.js.map