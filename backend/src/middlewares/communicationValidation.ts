import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/auth';
import logger from '../utils/logger';

/**
 * Communication Hub Validation Middleware
 * Comprehensive validation for all communication-related operations
 */

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

export class CommunicationValidationError extends Error {
    public errors: ValidationError[];
    public statusCode: number;

    constructor(errors: ValidationError[], message = 'Validation failed') {
        super(message);
        this.name = 'CommunicationValidationError';
        this.errors = errors;
        this.statusCode = 400;
    }
}

/**
 * Handle validation results and format errors
 */
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors: ValidationError[] = errors.array().map(error => ({
            field: error.type === 'field' ? (error as any).path : 'unknown',
            message: error.msg,
            value: error.type === 'field' ? (error as any).value : undefined,
        }));

        logger.warn('Communication validation failed', {
            errors: formattedErrors,
            path: req.path,
            method: req.method,
            userId: (req as AuthRequest).user?._id,
        });

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors,
        });
        return;
    }

    next();
};

/**
 * Custom validators
 */
export const customValidators = {
    isObjectId: (value: string) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid ObjectId format');
        }
        return true;
    },

    isObjectIdArray: (value: string[]) => {
        if (!Array.isArray(value)) {
            throw new Error('Must be an array');
        }

        for (const id of value) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`Invalid ObjectId format: ${id}`);
            }
        }
        return true;
    },

    isValidMessageType: (value: string) => {
        const validTypes = ['text', 'file', 'image', 'clinical_note', 'system', 'voice_note'];
        if (!validTypes.includes(value)) {
            throw new Error(`Invalid message type. Must be one of: ${validTypes.join(', ')}`);
        }
        return true;
    },

    isValidConversationType: (value: string) => {
        const validTypes = ['direct', 'group', 'patient_query', 'clinical_consultation'];
        if (!validTypes.includes(value)) {
            throw new Error(`Invalid conversation type. Must be one of: ${validTypes.join(', ')}`);
        }
        return true;
    },

    isValidPriority: (value: string) => {
        const validPriorities = ['low', 'normal', 'high', 'urgent', 'critical'];
        if (!validPriorities.includes(value)) {
            throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
        }
        return true;
    },

    isValidStatus: (value: string, validStatuses: string[]) => {
        if (!validStatuses.includes(value)) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        return true;
    },

    isValidEmoji: (value: string) => {
        const allowedEmojis = [
            '👍', '👎', '❤️', '😊', '😢', '😮', '😡', '🤔',
            '✅', '❌', '⚠️', '🚨', '📋', '💊', '🩺', '📊'
        ];
        if (!allowedEmojis.includes(value)) {
            throw new Error(`Invalid emoji. Must be one of the allowed healthcare emojis`);
        }
        return true;
    },

    isValidFileType: (mimeType: string) => {
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

        if (!allowedTypes.includes(mimeType)) {
            throw new Error('File type not allowed for healthcare communication');
        }
        return true;
    },

    isValidUrl: (value: string) => {
        try {
            new URL(value);
            return true;
        } catch {
            throw new Error('Invalid URL format');
        }
    },

    isValidDateRange: (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid date format');
        }

        if (start >= end) {
            throw new Error('Start date must be before end date');
        }

        // Limit date range to prevent performance issues
        const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
        if (end.getTime() - start.getTime() > maxRangeMs) {
            throw new Error('Date range cannot exceed 1 year');
        }

        return true;
    },
};

/**
 * Conversation validation rules
 */
export const conversationValidation = {
    create: [
        body('type')
            .notEmpty()
            .withMessage('Conversation type is required')
            .custom(customValidators.isValidConversationType),

        body('title')
            .optional()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),

        body('participants')
            .isArray({ min: 1, max: 50 })
            .withMessage('Must have between 1 and 50 participants'),

        body('participants.*.userId')
            .custom(customValidators.isObjectId),

        body('participants.*.role')
            .isIn(['pharmacist', 'doctor', 'patient', 'pharmacy_team', 'intern_pharmacist'])
            .withMessage('Invalid participant role'),

        body('patientId')
            .optional()
            .custom(customValidators.isObjectId),

        body('priority')
            .optional()
            .custom(customValidators.isValidPriority),

        body('tags')
            .optional()
            .isArray({ max: 10 })
            .withMessage('Maximum 10 tags allowed'),

        body('tags.*')
            .optional()
            .isLength({ min: 1, max: 50 })
            .withMessage('Each tag must be between 1 and 50 characters')
            .trim(),

        body('metadata.clinicalContext.diagnosis')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Diagnosis cannot exceed 500 characters')
            .trim(),

        body('metadata.clinicalContext.medications')
            .optional()
            .custom(customValidators.isObjectIdArray),

        body('metadata.clinicalContext.interventionIds')
            .optional()
            .custom(customValidators.isObjectIdArray),
    ],

    update: [
        param('id').custom(customValidators.isObjectId),

        body('title')
            .optional()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),

        body('status')
            .optional()
            .custom((value) => customValidators.isValidStatus(value, ['active', 'archived', 'resolved', 'closed'])),

        body('priority')
            .optional()
            .custom(customValidators.isValidPriority),

        body('tags')
            .optional()
            .isArray({ max: 10 })
            .withMessage('Maximum 10 tags allowed'),
    ],

    addParticipant: [
        param('id').custom(customValidators.isObjectId),

        body('userId')
            .notEmpty()
            .custom(customValidators.isObjectId),

        body('role')
            .notEmpty()
            .isIn(['pharmacist', 'doctor', 'patient', 'pharmacy_team', 'intern_pharmacist'])
            .withMessage('Invalid participant role'),

        body('permissions')
            .optional()
            .isArray()
            .withMessage('Permissions must be an array'),
    ],

    removeParticipant: [
        param('id').custom(customValidators.isObjectId),
        param('userId').custom(customValidators.isObjectId),
    ],
};

/**
 * Message validation rules
 */
export const messageValidation = {
    send: [
        body('conversationId')
            .notEmpty()
            .custom(customValidators.isObjectId),

        body('content.type')
            .notEmpty()
            .custom(customValidators.isValidMessageType),

        body('content.text')
            .if(body('content.type').equals('text'))
            .notEmpty()
            .withMessage('Text content is required for text messages')
            .isLength({ min: 1, max: 10000 })
            .withMessage('Message content must be between 1 and 10,000 characters')
            .trim(),

        body('content.attachments')
            .optional()
            .isArray({ max: 10 })
            .withMessage('Maximum 10 attachments allowed'),

        body('content.attachments.*.fileName')
            .optional()
            .isLength({ min: 1, max: 255 })
            .withMessage('File name must be between 1 and 255 characters'),

        body('content.attachments.*.fileSize')
            .optional()
            .isInt({ min: 1, max: 100 * 1024 * 1024 })
            .withMessage('File size must be between 1 byte and 100MB'),

        body('content.attachments.*.mimeType')
            .optional()
            .custom(customValidators.isValidFileType),

        body('content.attachments.*.secureUrl')
            .optional()
            .custom(customValidators.isValidUrl),

        body('threadId')
            .optional()
            .custom(customValidators.isObjectId),

        body('parentMessageId')
            .optional()
            .custom(customValidators.isObjectId),

        body('mentions')
            .optional()
            .custom(customValidators.isObjectIdArray),

        body('priority')
            .optional()
            .isIn(['normal', 'high', 'urgent'])
            .withMessage('Invalid message priority'),
    ],

    edit: [
        param('id').custom(customValidators.isObjectId),

        body('content')
            .notEmpty()
            .isLength({ min: 1, max: 10000 })
            .withMessage('Message content must be between 1 and 10,000 characters')
            .trim(),

        body('reason')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Edit reason cannot exceed 200 characters')
            .trim(),
    ],

    addReaction: [
        param('id').custom(customValidators.isObjectId),

        body('emoji')
            .notEmpty()
            .custom(customValidators.isValidEmoji),
    ],

    markAsRead: [
        param('id').custom(customValidators.isObjectId),
    ],
};

/**
 * Notification validation rules
 */
export const notificationValidation = {
    create: [
        body('userId')
            .notEmpty()
            .custom(customValidators.isObjectId),

        body('type')
            .notEmpty()
            .isIn([
                'new_message', 'mention', 'therapy_update', 'clinical_alert',
                'conversation_invite', 'file_shared', 'intervention_assigned',
                'patient_query', 'urgent_message', 'system_notification'
            ])
            .withMessage('Invalid notification type'),

        body('title')
            .notEmpty()
            .isLength({ min: 1, max: 200 })
            .withMessage('Title must be between 1 and 200 characters')
            .trim(),

        body('content')
            .notEmpty()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Content must be between 1 and 1000 characters')
            .trim(),

        body('priority')
            .optional()
            .custom(customValidators.isValidPriority),

        body('data.conversationId')
            .optional()
            .custom(customValidators.isObjectId),

        body('data.messageId')
            .optional()
            .custom(customValidators.isObjectId),

        body('data.patientId')
            .optional()
            .custom(customValidators.isObjectId),

        body('data.actionUrl')
            .optional()
            .matches(/^\/|^https?:\/\//)
            .withMessage('Invalid action URL format'),

        body('deliveryChannels.inApp')
            .optional()
            .isBoolean()
            .withMessage('inApp delivery channel must be boolean'),

        body('deliveryChannels.email')
            .optional()
            .isBoolean()
            .withMessage('email delivery channel must be boolean'),

        body('deliveryChannels.sms')
            .optional()
            .isBoolean()
            .withMessage('sms delivery channel must be boolean'),

        body('scheduledFor')
            .optional()
            .isISO8601()
            .withMessage('Invalid scheduled date format')
            .custom((value) => {
                const scheduledDate = new Date(value);
                if (scheduledDate <= new Date()) {
                    throw new Error('Scheduled date must be in the future');
                }
                return true;
            }),
    ],

    updateStatus: [
        param('id').custom(customValidators.isObjectId),

        body('status')
            .notEmpty()
            .isIn(['unread', 'read', 'dismissed', 'archived'])
            .withMessage('Invalid notification status'),
    ],

    updateDeliveryStatus: [
        param('id').custom(customValidators.isObjectId),

        body('channel')
            .notEmpty()
            .isIn(['inApp', 'email', 'sms', 'push'])
            .withMessage('Invalid delivery channel'),

        body('status')
            .notEmpty()
            .isIn(['pending', 'sent', 'delivered', 'failed', 'bounced'])
            .withMessage('Invalid delivery status'),

        body('failureReason')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Failure reason cannot exceed 500 characters'),
    ],
};

/**
 * Search and query validation rules
 */
export const searchValidation = {
    messages: [
        query('q')
            .notEmpty()
            .isLength({ min: 1, max: 200 })
            .withMessage('Search query must be between 1 and 200 characters')
            .trim(),

        query('conversationId')
            .optional()
            .custom(customValidators.isObjectId),

        query('senderId')
            .optional()
            .custom(customValidators.isObjectId),

        query('type')
            .optional()
            .custom(customValidators.isValidMessageType),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),

        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format'),

        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),
    ],

    conversations: [
        query('status')
            .optional()
            .custom((value) => customValidators.isValidStatus(value, ['active', 'archived', 'resolved', 'closed'])),

        query('type')
            .optional()
            .custom(customValidators.isValidConversationType),

        query('patientId')
            .optional()
            .custom(customValidators.isObjectId),

        query('priority')
            .optional()
            .custom(customValidators.isValidPriority),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),

        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset must be non-negative'),
    ],
};

/**
 * Audit log validation rules
 */
export const auditValidation = {
    query: [
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid start date format'),

        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('Invalid end date format'),

        query('action')
            .optional()
            .isIn([
                'message_sent', 'message_read', 'message_edited', 'message_deleted',
                'conversation_created', 'conversation_updated', 'conversation_archived',
                'participant_added', 'participant_removed', 'participant_left',
                'file_uploaded', 'file_downloaded', 'file_deleted',
                'notification_sent', 'notification_read', 'encryption_key_rotated',
                'conversation_exported', 'bulk_message_delete', 'conversation_search',
                'message_search', 'clinical_context_updated', 'priority_changed'
            ])
            .withMessage('Invalid audit action'),

        query('userId')
            .optional()
            .custom(customValidators.isObjectId),

        query('riskLevel')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Invalid risk level'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Limit must be between 1 and 1000'),
    ],

    export: [
        body('startDate')
            .notEmpty()
            .isISO8601()
            .withMessage('Start date is required and must be valid ISO8601 format'),

        body('endDate')
            .notEmpty()
            .isISO8601()
            .withMessage('End date is required and must be valid ISO8601 format'),

        body('format')
            .optional()
            .isIn(['json', 'csv', 'pdf'])
            .withMessage('Invalid export format'),

        body('includeDetails')
            .optional()
            .isBoolean()
            .withMessage('includeDetails must be boolean'),
    ],
};

/**
 * Pagination validation middleware
 */
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'lastMessageAt', 'priority', 'status'])
        .withMessage('Invalid sort field'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
];

/**
 * File upload validation middleware
 */
export const fileUploadValidation = [
    body('fileName')
        .notEmpty()
        .isLength({ min: 1, max: 255 })
        .withMessage('File name must be between 1 and 255 characters'),

    body('fileSize')
        .notEmpty()
        .isInt({ min: 1, max: 100 * 1024 * 1024 })
        .withMessage('File size must be between 1 byte and 100MB'),

    body('mimeType')
        .notEmpty()
        .custom(customValidators.isValidFileType),

    body('conversationId')
        .notEmpty()
        .custom(customValidators.isObjectId),
];

export default {
    handleValidationErrors,
    customValidators,
    conversationValidation,
    messageValidation,
    notificationValidation,
    searchValidation,
    auditValidation,
    paginationValidation,
    fileUploadValidation,
};