import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { auth } from '../middlewares/auth';
import communicationController from '../controllers/communicationController';
import { uploadMiddleware } from '../services/fileUploadService';
import {
    auditMessage,
    auditConversation,
    auditFile,
    auditSearch,
    auditPatientCommunicationAccess,
    auditBulkOperation,
    auditHighRiskOperation,
} from '../middlewares/communicationAuditMiddleware';
import {
    encryptMessageContent,
    decryptMessageContent,
    validateEncryptionCompliance,
} from '../middlewares/encryptionMiddleware';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array(),
        });
        return;
    }
    next();
};

// Conversation routes

/**
 * @route   GET /api/communication/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get(
    '/conversations',
    auth,
    [
        query('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
        query('type').optional().isIn(['direct', 'group', 'patient_query', 'clinical_consultation']),
        query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
        query('patientId').optional().isMongoId(),
        query('search').optional().isString().trim(),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    handleValidationErrors,
    communicationController.getConversations
);

/**
 * @route   POST /api/communication/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post(
    '/conversations',
    auth,
    [
        body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
        body('type').isIn(['direct', 'group', 'patient_query', 'clinical_consultation']),
        body('participants').isArray({ min: 1, max: 50 }),
        body('participants.*').isMongoId(),
        body('patientId').optional().isMongoId(),
        body('caseId').optional().isString().trim().isLength({ max: 100 }),
        body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
        body('tags').optional().isArray(),
        body('tags.*').isString().trim().isLength({ max: 50 }),
    ],
    handleValidationErrors,
    ...auditConversation('conversation_created'),
    communicationController.createConversation
);

/**
 * @route   GET /api/communication/conversations/:id
 * @desc    Get conversation details
 * @access  Private
 */
router.get(
    '/conversations/:id',
    auth,
    [param('id').isMongoId()],
    handleValidationErrors,
    communicationController.getConversation
);

/**
 * @route   PUT /api/communication/conversations/:id
 * @desc    Update conversation
 * @access  Private
 */
router.put(
    '/conversations/:id',
    auth,
    [
        param('id').isMongoId(),
        body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
        body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
        body('tags').optional().isArray(),
        body('tags.*').isString().trim().isLength({ max: 50 }),
        body('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
    ],
    handleValidationErrors,
    communicationController.updateConversation
);

/**
 * @route   POST /api/communication/conversations/:id/participants
 * @desc    Add participant to conversation
 * @access  Private
 */
router.post(
    '/conversations/:id/participants',
    auth,
    [
        param('id').isMongoId(),
        body('userId').isMongoId(),
        body('role').isIn(['pharmacist', 'doctor', 'patient', 'pharmacy_team', 'intern_pharmacist']),
    ],
    handleValidationErrors,
    ...auditConversation('participant_added'),
    communicationController.addParticipant
);

/**
 * @route   DELETE /api/communication/conversations/:id/participants/:userId
 * @desc    Remove participant from conversation
 * @access  Private
 */
router.delete(
    '/conversations/:id/participants/:userId',
    auth,
    [
        param('id').isMongoId(),
        param('userId').isMongoId(),
    ],
    handleValidationErrors,
    ...auditConversation('participant_removed'),
    communicationController.removeParticipant
);

// Message routes

/**
 * @route   GET /api/communication/conversations/:id/messages
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get(
    '/conversations/:id/messages',
    auth,
    [
        param('id').isMongoId(),
        query('type').optional().isIn(['text', 'file', 'image', 'clinical_note', 'system', 'voice_note']),
        query('senderId').optional().isMongoId(),
        query('mentions').optional().isMongoId(),
        query('priority').optional().isIn(['normal', 'high', 'urgent']),
        query('before').optional().isISO8601(),
        query('after').optional().isISO8601(),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    handleValidationErrors,
    decryptMessageContent,
    communicationController.getMessages
);

/**
 * @route   POST /api/communication/conversations/:id/messages
 * @desc    Send a message
 * @access  Private
 */
router.post(
    '/conversations/:id/messages',
    auth,
    [
        param('id').isMongoId(),
        body('content.text').optional().isString().trim().isLength({ min: 1, max: 10000 }),
        body('content.type').isIn(['text', 'file', 'image', 'clinical_note', 'voice_note']),
        body('content.attachments').optional().isArray(),
        body('threadId').optional().isMongoId(),
        body('parentMessageId').optional().isMongoId(),
        body('mentions').optional().isArray(),
        body('mentions.*').isMongoId(),
        body('priority').optional().isIn(['normal', 'high', 'urgent']),
    ],
    handleValidationErrors,
    encryptMessageContent,
    validateEncryptionCompliance,
    ...auditMessage('message_sent'),
    communicationController.sendMessage
);

/**
 * @route   PUT /api/communication/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put(
    '/messages/:id/read',
    auth,
    [param('id').isMongoId()],
    handleValidationErrors,
    ...auditMessage('message_read'),
    communicationController.markMessageAsRead
);

/**
 * @route   POST /api/communication/messages/:id/reactions
 * @desc    Add reaction to message
 * @access  Private
 */
router.post(
    '/messages/:id/reactions',
    auth,
    [
        param('id').isMongoId(),
        body('emoji').isString().isIn([
            '👍', '👎', '❤️', '😊', '😢', '😮', '😡', '🤔',
            '✅', '❌', '⚠️', '🚨', '📋', '💊', '🩺', '📊'
        ]),
    ],
    handleValidationErrors,
    communicationController.addReaction
);

/**
 * @route   DELETE /api/communication/messages/:id/reactions/:emoji
 * @desc    Remove reaction from message
 * @access  Private
 */
router.delete(
    '/messages/:id/reactions/:emoji',
    auth,
    [
        param('id').isMongoId(),
        param('emoji').isString(),
    ],
    handleValidationErrors,
    communicationController.removeReaction
);

/**
 * @route   PUT /api/communication/messages/:id
 * @desc    Edit message
 * @access  Private
 */
router.put(
    '/messages/:id',
    auth,
    [
        param('id').isMongoId(),
        body('content').isString().trim().isLength({ min: 1, max: 10000 }),
        body('reason').optional().isString().trim().isLength({ max: 200 }),
    ],
    handleValidationErrors,
    communicationController.editMessage
);

// Search routes

/**
 * @route   GET /api/communication/search/messages
 * @desc    Enhanced message search with advanced filtering
 * @access  Private
 */
router.get(
    '/search/messages',
    auth,
    [
        query('q').isString().trim().isLength({ min: 1, max: 100 }),
        query('conversationId').optional().isMongoId(),
        query('senderId').optional().isMongoId(),
        query('participantId').optional().isMongoId(),
        query('type').optional().isIn(['text', 'file', 'image', 'clinical_note', 'system', 'voice_note']),
        query('fileType').optional().isString().trim(),
        query('priority').optional().isIn(['normal', 'high', 'urgent']),
        query('hasAttachments').optional().isBoolean(),
        query('hasMentions').optional().isBoolean(),
        query('dateFrom').optional().isISO8601(),
        query('dateTo').optional().isISO8601(),
        query('tags').optional().isArray(),
        query('tags.*').optional().isString().trim(),
        query('sortBy').optional().isIn(['relevance', 'date', 'sender']),
        query('sortOrder').optional().isIn(['asc', 'desc']),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    handleValidationErrors,
    decryptMessageContent,
    ...auditSearch('message_search'),
    communicationController.searchMessages
);

/**
 * @route   GET /api/communication/search/conversations
 * @desc    Search conversations
 * @access  Private
 */
router.get(
    '/search/conversations',
    auth,
    [
        query('q').isString().trim().isLength({ min: 1, max: 100 }),
        query('type').optional().isIn(['direct', 'group', 'patient_query', 'clinical_consultation']),
        query('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
        query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
        query('patientId').optional().isMongoId(),
        query('tags').optional().isArray(),
        query('tags.*').optional().isString().trim(),
        query('dateFrom').optional().isISO8601(),
        query('dateTo').optional().isISO8601(),
        query('sortBy').optional().isIn(['relevance', 'date']),
        query('sortOrder').optional().isIn(['asc', 'desc']),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    handleValidationErrors,
    communicationController.searchConversations
);

/**
 * @route   GET /api/communication/search/suggestions
 * @desc    Get search suggestions
 * @access  Private
 */
router.get(
    '/search/suggestions',
    auth,
    [
        query('q').optional().isString().trim().isLength({ max: 100 }),
    ],
    handleValidationErrors,
    communicationController.getSearchSuggestions
);

/**
 * @route   GET /api/communication/search/history
 * @desc    Get user's search history
 * @access  Private
 */
router.get(
    '/search/history',
    auth,
    [
        query('type').optional().isIn(['message', 'conversation']),
        query('limit').optional().isInt({ min: 1, max: 50 }),
    ],
    handleValidationErrors,
    communicationController.getSearchHistory
);

/**
 * @route   GET /api/communication/search/popular
 * @desc    Get popular searches in workplace
 * @access  Private
 */
router.get(
    '/search/popular',
    auth,
    [
        query('type').optional().isIn(['message', 'conversation']),
        query('limit').optional().isInt({ min: 1, max: 20 }),
    ],
    handleValidationErrors,
    communicationController.getPopularSearches
);

/**
 * @route   POST /api/communication/search/save
 * @desc    Save a search for future use
 * @access  Private
 */
router.post(
    '/search/save',
    auth,
    [
        body('name').isString().trim().isLength({ min: 1, max: 100 }),
        body('description').optional().isString().trim().isLength({ max: 500 }),
        body('query').isString().trim().isLength({ min: 1, max: 500 }),
        body('filters').optional().isObject(),
        body('searchType').isIn(['message', 'conversation']),
        body('isPublic').optional().isBoolean(),
    ],
    handleValidationErrors,
    communicationController.saveSearch
);

/**
 * @route   GET /api/communication/search/saved
 * @desc    Get user's saved searches
 * @access  Private
 */
router.get(
    '/search/saved',
    auth,
    [
        query('type').optional().isIn(['message', 'conversation']),
        query('includePublic').optional().isBoolean(),
    ],
    handleValidationErrors,
    communicationController.getSavedSearches
);

/**
 * @route   POST /api/communication/search/saved/:searchId/use
 * @desc    Use a saved search (increment use count)
 * @access  Private
 */
router.post(
    '/search/saved/:searchId/use',
    auth,
    [
        param('searchId').isMongoId(),
    ],
    handleValidationErrors,
    communicationController.useSavedSearch
);

/**
 * @route   DELETE /api/communication/search/saved/:searchId
 * @desc    Delete a saved search
 * @access  Private
 */
router.delete(
    '/search/saved/:searchId',
    auth,
    [
        param('searchId').isMongoId(),
    ],
    handleValidationErrors,
    communicationController.deleteSavedSearch
);

// Patient-specific routes

/**
 * @route   GET /api/communication/patients/:patientId/conversations
 * @desc    Get conversations for a specific patient
 * @access  Private
 */
router.get(
    '/patients/:patientId/conversations',
    auth,
    [
        param('patientId').isMongoId(),
        query('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
        query('type').optional().isIn(['patient_query', 'clinical_consultation']),
        query('limit').optional().isInt({ min: 1, max: 100 }),
    ],
    handleValidationErrors,
    decryptMessageContent,
    auditPatientCommunicationAccess,
    communicationController.getPatientConversations
);

/**
 * @route   POST /api/communication/patients/:patientId/queries
 * @desc    Create a patient query conversation
 * @access  Private
 */
router.post(
    '/patients/:patientId/queries',
    auth,
    [
        param('patientId').isMongoId(),
        body('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
        body('message').isString().trim().isLength({ min: 1, max: 10000 }),
        body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
        body('tags').optional().isArray(),
        body('tags.*').isString().trim().isLength({ max: 50 }),
    ],
    handleValidationErrors,
    encryptMessageContent,
    validateEncryptionCompliance,
    auditPatientCommunicationAccess,
    ...auditConversation('conversation_created'),
    communicationController.createPatientQuery
);

// Analytics and reporting routes

/**
 * @route   GET /api/communication/analytics/summary
 * @desc    Get communication analytics summary
 * @access  Private
 */
router.get(
    '/analytics/summary',
    auth,
    [
        query('dateFrom').optional().isISO8601(),
        query('dateTo').optional().isISO8601(),
        query('patientId').optional().isMongoId(),
    ],
    handleValidationErrors,
    communicationController.getAnalyticsSummary
);

// File upload routes

/**
 * @route   POST /api/communication/upload
 * @desc    Upload files for communication
 * @access  Private
 */
router.post(
    '/upload',
    auth,
    uploadMiddleware.array('files', 10), // Allow up to 10 files
    [
        body('conversationId').optional().isMongoId(),
        body('messageType').optional().isIn(['file', 'image', 'voice_note']),
    ],
    handleValidationErrors,
    ...auditFile('file_uploaded'),
    communicationController.uploadFiles
);

/**
 * @route   GET /api/communication/files/:fileId
 * @desc    Get file details and secure download URL
 * @access  Private
 */
router.get(
    '/files/:fileId',
    auth,
    [param('fileId').isString().trim()],
    handleValidationErrors,
    communicationController.getFile
);

/**
 * @route   DELETE /api/communication/files/:fileId
 * @desc    Delete uploaded file
 * @access  Private
 */
router.delete(
    '/files/:fileId',
    auth,
    [param('fileId').isString().trim()],
    handleValidationErrors,
    communicationController.deleteFile
);

/**
 * @route   GET /api/communication/conversations/:id/files
 * @desc    Get all files shared in a conversation
 * @access  Private
 */
router.get(
    '/conversations/:id/files',
    auth,
    [
        param('id').isMongoId(),
        query('type').optional().isIn(['file', 'image', 'voice_note']),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
    ],
    handleValidationErrors,
    communicationController.getConversationFiles
);

/**
 * @route   GET /api/communication/health
 * @desc    Health check for communication module
 * @access  Public
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        module: 'communication-hub',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
            realTimeMessaging: true,
            fileSharing: true,
            encryption: true,
            notifications: true,
            search: true,
            analytics: true,
        },
    });
});

export default router;