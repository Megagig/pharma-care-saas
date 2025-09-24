"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMessageRateLimit = exports.validateFileUpload = exports.validateMessageAccess = exports.validateConversationAccess = exports.validateAuditLog = exports.validateNotification = exports.validateMessage = exports.validateConversation = exports.auditLogValidationSchema = exports.notificationValidationSchema = exports.messageValidationSchema = exports.conversationValidationSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const joi_1 = __importDefault(require("joi"));
const logger_1 = __importDefault(require("../utils/logger"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
exports.conversationValidationSchema = joi_1.default.object({
    title: joi_1.default.string().trim().max(200).optional(),
    type: joi_1.default.string()
        .valid("direct", "group", "patient_query", "clinical_consultation")
        .required(),
    participants: joi_1.default.array()
        .items(joi_1.default.object({
        userId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required(),
        role: joi_1.default.string()
            .valid("pharmacist", "doctor", "patient", "pharmacy_team", "intern_pharmacist")
            .required(),
        permissions: joi_1.default.array()
            .items(joi_1.default.string().valid("read_messages", "send_messages", "add_participants", "remove_participants", "edit_conversation", "delete_conversation", "upload_files", "view_patient_data", "manage_clinical_context"))
            .optional(),
    }))
        .min(1)
        .max(50)
        .required(),
    patientId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional(),
    caseId: joi_1.default.string().trim().max(100).optional(),
    status: joi_1.default.string()
        .valid("active", "archived", "resolved", "closed")
        .optional(),
    priority: joi_1.default.string().valid("low", "normal", "high", "urgent").optional(),
    tags: joi_1.default.array().items(joi_1.default.string().trim().max(50)).optional(),
    metadata: joi_1.default.object({
        isEncrypted: joi_1.default.boolean().default(true),
        encryptionKeyId: joi_1.default.string().optional(),
        clinicalContext: joi_1.default.object({
            diagnosis: joi_1.default.string().trim().max(500).optional(),
            medications: joi_1.default.array()
                .items(joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/))
                .optional(),
            conditions: joi_1.default.array().items(joi_1.default.string().trim().max(200)).optional(),
            interventionIds: joi_1.default.array()
                .items(joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/))
                .optional(),
        }).optional(),
    }).optional(),
});
exports.messageValidationSchema = joi_1.default.object({
    conversationId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    content: joi_1.default.object({
        text: joi_1.default.string().trim().max(10000).when("type", {
            is: "text",
            then: joi_1.default.required(),
            otherwise: joi_1.default.optional(),
        }),
        type: joi_1.default.string()
            .valid("text", "file", "image", "clinical_note", "system", "voice_note")
            .required(),
        attachments: joi_1.default.array()
            .items(joi_1.default.object({
            fileId: joi_1.default.string().required(),
            fileName: joi_1.default.string().trim().max(255).required(),
            fileSize: joi_1.default.number()
                .min(0)
                .max(100 * 1024 * 1024)
                .required(),
            mimeType: joi_1.default.string()
                .valid("image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv", "audio/mpeg", "audio/wav", "audio/ogg", "video/mp4", "video/webm")
                .required(),
            secureUrl: joi_1.default.string().uri().required(),
            thumbnailUrl: joi_1.default.string().uri().optional(),
        }))
            .when("type", {
            is: joi_1.default.string().valid("file", "image"),
            then: joi_1.default.array().required().min(1),
            otherwise: joi_1.default.optional(),
        }),
        metadata: joi_1.default.object({
            originalText: joi_1.default.string().optional(),
            clinicalData: joi_1.default.object({
                patientId: joi_1.default.string()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .optional(),
                interventionId: joi_1.default.string()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .optional(),
                medicationId: joi_1.default.string()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .optional(),
            }).optional(),
            systemAction: joi_1.default.object({
                action: joi_1.default.string()
                    .valid("participant_added", "participant_removed", "conversation_created", "conversation_archived", "conversation_resolved", "priority_changed", "clinical_context_updated", "file_shared", "intervention_linked")
                    .required(),
                performedBy: joi_1.default.string()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .required(),
                timestamp: joi_1.default.date().required(),
            }).when("..type", {
                is: "system",
                then: joi_1.default.required(),
                otherwise: joi_1.default.optional(),
            }),
        }).optional(),
    }).required(),
    threadId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional(),
    parentMessageId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional(),
    mentions: joi_1.default.array()
        .items(joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/))
        .optional(),
    priority: joi_1.default.string().valid("normal", "high", "urgent").optional(),
});
exports.notificationValidationSchema = joi_1.default.object({
    userId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    type: joi_1.default.string()
        .valid("new_message", "mention", "therapy_update", "clinical_alert", "conversation_invite", "file_shared", "intervention_assigned", "patient_query", "urgent_message", "system_notification")
        .required(),
    title: joi_1.default.string().trim().max(200).required(),
    content: joi_1.default.string().trim().max(1000).required(),
    data: joi_1.default.object({
        conversationId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        messageId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        senderId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        patientId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        interventionId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        actionUrl: joi_1.default.string().uri({ relativeOnly: true }).optional(),
        metadata: joi_1.default.object().optional(),
    }).required(),
    priority: joi_1.default.string()
        .valid("low", "normal", "high", "urgent", "critical")
        .optional(),
    deliveryChannels: joi_1.default.object({
        inApp: joi_1.default.boolean().default(true),
        email: joi_1.default.boolean().default(false),
        sms: joi_1.default.boolean().default(false),
        push: joi_1.default.boolean().default(true),
    }).required(),
    scheduledFor: joi_1.default.date().min("now").optional(),
    expiresAt: joi_1.default.date().greater("now").optional(),
    groupKey: joi_1.default.string().max(100).optional(),
    batchId: joi_1.default.string().max(100).optional(),
});
exports.auditLogValidationSchema = joi_1.default.object({
    action: joi_1.default.string()
        .valid("message_sent", "message_read", "message_edited", "message_deleted", "conversation_created", "conversation_updated", "conversation_archived", "participant_added", "participant_removed", "participant_left", "file_uploaded", "file_downloaded", "file_deleted", "notification_sent", "notification_read", "encryption_key_rotated", "conversation_exported", "bulk_message_delete", "conversation_search", "message_search", "clinical_context_updated", "priority_changed")
        .required(),
    targetId: joi_1.default.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required(),
    targetType: joi_1.default.string()
        .valid("conversation", "message", "user", "file", "notification")
        .required(),
    details: joi_1.default.object({
        conversationId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        messageId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        patientId: joi_1.default.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .optional(),
        participantIds: joi_1.default.array()
            .items(joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/))
            .optional(),
        fileId: joi_1.default.string().optional(),
        fileName: joi_1.default.string().max(255).optional(),
        oldValues: joi_1.default.object().optional(),
        newValues: joi_1.default.object().optional(),
        metadata: joi_1.default.object().optional(),
    }).required(),
    riskLevel: joi_1.default.string().valid("low", "medium", "high", "critical").optional(),
    complianceCategory: joi_1.default.string()
        .valid("communication_security", "data_access", "patient_privacy", "message_integrity", "file_security", "audit_trail", "encryption_compliance", "notification_delivery")
        .optional(),
    success: joi_1.default.boolean().default(true),
    errorMessage: joi_1.default.string().max(1000).optional(),
    duration: joi_1.default.number().min(0).max(300000).optional(),
});
const validateConversation = (req, res, next) => {
    const { error } = exports.conversationValidationSchema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            })),
        });
        return;
    }
    const { type, patientId, participants } = req.body;
    if (["patient_query", "clinical_consultation"].includes(type) && !patientId) {
        res.status(400).json({
            success: false,
            message: "Patient ID is required for patient queries and clinical consultations",
        });
        return;
    }
    if (type === "patient_query") {
        const hasPatient = participants.some((p) => p.role === "patient");
        const hasHealthcareProvider = participants.some((p) => ["pharmacist", "doctor"].includes(p.role));
        if (!hasPatient || !hasHealthcareProvider) {
            res.status(400).json({
                success: false,
                message: "Patient queries must include both a patient and a healthcare provider",
            });
            return;
        }
    }
    next();
};
exports.validateConversation = validateConversation;
const validateMessage = (req, res, next) => {
    const { error } = exports.messageValidationSchema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            })),
        });
        return;
    }
    const { mentions, content } = req.body;
    if (mentions && mentions.length > 0) {
        if (content.type === "text" && content.text) {
            const mentionPattern = /@\w+/g;
            const textMentions = content.text.match(mentionPattern) || [];
            if (textMentions.length !== mentions.length) {
                res.status(400).json({
                    success: false,
                    message: "Number of @mentions in text must match mentions array",
                });
                return;
            }
        }
    }
    next();
};
exports.validateMessage = validateMessage;
const validateNotification = (req, res, next) => {
    const { error } = exports.notificationValidationSchema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            })),
        });
        return;
    }
    const { deliveryChannels } = req.body;
    const hasEnabledChannel = Object.values(deliveryChannels).some((enabled) => enabled);
    if (!hasEnabledChannel) {
        res.status(400).json({
            success: false,
            message: "At least one delivery channel must be enabled",
        });
        return;
    }
    next();
};
exports.validateNotification = validateNotification;
const validateAuditLog = (req, res, next) => {
    const { error } = exports.auditLogValidationSchema.validate(req.body, {
        abortEarly: false,
    });
    if (error) {
        res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            })),
        });
        return;
    }
    next();
};
exports.validateAuditLog = validateAuditLog;
const validateConversationAccess = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?.id;
        const workplaceId = req.user?.workplaceId;
        if (!userId || !workplaceId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        if (!conversationId || !mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
            });
            return;
        }
        const conversation = await Conversation_1.default.findOne({
            _id: conversationId,
            workplaceId,
            "participants.userId": userId,
            "participants.leftAt": { $exists: false },
        });
        if (!conversation) {
            res.status(404).json({
                success: false,
                message: "Conversation not found or access denied",
            });
            return;
        }
        req.conversation = conversation;
        next();
    }
    catch (error) {
        logger_1.default.error("Conversation access validation error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.validateConversationAccess = validateConversationAccess;
const validateMessageAccess = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const userId = req.user?.id;
        const workplaceId = req.user?.workplaceId;
        if (!userId || !workplaceId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        if (!messageId || !mongoose_1.default.Types.ObjectId.isValid(messageId)) {
            res.status(400).json({
                success: false,
                message: "Invalid message ID",
            });
            return;
        }
        const message = await Message_1.default.findById(messageId).populate("conversationId");
        if (!message) {
            res.status(404).json({
                success: false,
                message: "Message not found",
            });
            return;
        }
        const conversation = await Conversation_1.default.findOne({
            _id: message.conversationId,
            workplaceId,
            "participants.userId": userId,
            "participants.leftAt": { $exists: false },
        });
        if (!conversation) {
            res.status(403).json({
                success: false,
                message: "Access denied to this message",
            });
            return;
        }
        req.message = message;
        req.conversation = conversation;
        next();
    }
    catch (error) {
        logger_1.default.error("Message access validation error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.validateMessageAccess = validateMessageAccess;
const validateFileUpload = (req, res, next) => {
    try {
        const files = req.files;
        const file = req.file;
        if (!files && !file) {
            res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
            return;
        }
        const filesToValidate = files || (file ? [file] : []);
        for (const uploadedFile of filesToValidate) {
            if (uploadedFile.size > 100 * 1024 * 1024) {
                res.status(400).json({
                    success: false,
                    message: `File ${uploadedFile.originalname} exceeds maximum size of 100MB`,
                });
                return;
            }
            const allowedMimeTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/plain",
                "text/csv",
                "audio/mpeg",
                "audio/wav",
                "audio/ogg",
                "video/mp4",
                "video/webm",
            ];
            if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
                res.status(400).json({
                    success: false,
                    message: `File type ${uploadedFile.mimetype} is not allowed`,
                });
                return;
            }
            if (uploadedFile.originalname.length > 255) {
                res.status(400).json({
                    success: false,
                    message: `Filename ${uploadedFile.originalname} is too long`,
                });
                return;
            }
            const dangerousExtensions = [
                ".exe",
                ".bat",
                ".cmd",
                ".scr",
                ".pif",
                ".com",
            ];
            const fileExtension = uploadedFile.originalname
                .toLowerCase()
                .substr(uploadedFile.originalname.lastIndexOf("."));
            if (dangerousExtensions.includes(fileExtension)) {
                res.status(400).json({
                    success: false,
                    message: `File extension ${fileExtension} is not allowed`,
                });
                return;
            }
        }
        next();
    }
    catch (error) {
        logger_1.default.error("File upload validation error:", error);
        res.status(500).json({
            success: false,
            message: "File validation failed",
        });
    }
};
exports.validateFileUpload = validateFileUpload;
const validateMessageRateLimit = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const workplaceId = req.user?.workplaceId;
        if (!userId || !workplaceId) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const messageCount = await Message_1.default.countDocuments({
            senderId: userId,
            workplaceId,
            createdAt: { $gte: oneMinuteAgo },
        });
        if (messageCount >= 30) {
            res.status(429).json({
                success: false,
                message: "Rate limit exceeded. Please wait before sending more messages.",
                retryAfter: 60,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error("Message rate limit validation error:", error);
        res.status(500).json({
            success: false,
            message: "Rate limit validation failed",
        });
    }
};
exports.validateMessageRateLimit = validateMessageRateLimit;
//# sourceMappingURL=communicationValidation.js.map