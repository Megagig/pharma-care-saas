"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middlewares/auth");
const communicationController_1 = __importDefault(require("../controllers/communicationController"));
const fileUploadService_1 = require("../services/fileUploadService");
const communicationAuditMiddleware_1 = require("../middlewares/communicationAuditMiddleware");
const encryptionMiddleware_1 = require("../middlewares/encryptionMiddleware");
const router = express_1.default.Router();
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
router.get('/conversations', auth_1.auth, [
    (0, express_validator_1.query)('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
    (0, express_validator_1.query)('type').optional().isIn(['direct', 'group', 'patient_query', 'clinical_consultation']),
    (0, express_validator_1.query)('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    (0, express_validator_1.query)('patientId').optional().isMongoId(),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, communicationController_1.default.getConversations);
router.post('/conversations', auth_1.auth, [
    (0, express_validator_1.body)('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('type').isIn(['direct', 'group', 'patient_query', 'clinical_consultation']),
    (0, express_validator_1.body)('participants').isArray({ min: 1, max: 50 }),
    (0, express_validator_1.body)('participants.*').isMongoId(),
    (0, express_validator_1.body)('patientId').optional().isMongoId(),
    (0, express_validator_1.body)('caseId').optional().isString().trim().isLength({ max: 100 }),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    (0, express_validator_1.body)('tags').optional().isArray(),
    (0, express_validator_1.body)('tags.*').isString().trim().isLength({ max: 50 }),
], handleValidationErrors, ...(0, communicationAuditMiddleware_1.auditConversation)('conversation_created'), communicationController_1.default.createConversation);
router.get('/conversations/:id', auth_1.auth, [(0, express_validator_1.param)('id').isMongoId()], handleValidationErrors, communicationController_1.default.getConversation);
router.put('/conversations/:id', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    (0, express_validator_1.body)('tags').optional().isArray(),
    (0, express_validator_1.body)('tags.*').isString().trim().isLength({ max: 50 }),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
], handleValidationErrors, communicationController_1.default.updateConversation);
router.post('/conversations/:id/participants', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('userId').isMongoId(),
    (0, express_validator_1.body)('role').isIn(['pharmacist', 'doctor', 'patient', 'pharmacy_team', 'intern_pharmacist']),
], handleValidationErrors, ...(0, communicationAuditMiddleware_1.auditConversation)('participant_added'), communicationController_1.default.addParticipant);
router.delete('/conversations/:id/participants/:userId', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.param)('userId').isMongoId(),
], handleValidationErrors, ...(0, communicationAuditMiddleware_1.auditConversation)('participant_removed'), communicationController_1.default.removeParticipant);
router.get('/conversations/:id/messages', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.query)('type').optional().isIn(['text', 'file', 'image', 'clinical_note', 'system', 'voice_note']),
    (0, express_validator_1.query)('senderId').optional().isMongoId(),
    (0, express_validator_1.query)('mentions').optional().isMongoId(),
    (0, express_validator_1.query)('priority').optional().isIn(['normal', 'high', 'urgent']),
    (0, express_validator_1.query)('before').optional().isISO8601(),
    (0, express_validator_1.query)('after').optional().isISO8601(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, encryptionMiddleware_1.decryptMessageContent, communicationController_1.default.getMessages);
router.post('/conversations/:id/messages', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('content.text').optional().isString().trim().isLength({ min: 1, max: 10000 }),
    (0, express_validator_1.body)('content.type').isIn(['text', 'file', 'image', 'clinical_note', 'voice_note']),
    (0, express_validator_1.body)('content.attachments').optional().isArray(),
    (0, express_validator_1.body)('threadId').optional().isMongoId(),
    (0, express_validator_1.body)('parentMessageId').optional().isMongoId(),
    (0, express_validator_1.body)('mentions').optional().isArray(),
    (0, express_validator_1.body)('mentions.*').isMongoId(),
    (0, express_validator_1.body)('priority').optional().isIn(['normal', 'high', 'urgent']),
], handleValidationErrors, encryptionMiddleware_1.encryptMessageContent, encryptionMiddleware_1.validateEncryptionCompliance, ...(0, communicationAuditMiddleware_1.auditMessage)('message_sent'), communicationController_1.default.sendMessage);
router.put('/messages/:id/read', auth_1.auth, [(0, express_validator_1.param)('id').isMongoId()], handleValidationErrors, ...(0, communicationAuditMiddleware_1.auditMessage)('message_read'), communicationController_1.default.markMessageAsRead);
router.post('/messages/:id/reactions', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('emoji').isString().isIn([
        '👍', '👎', '❤️', '😊', '😢', '😮', '😡', '🤔',
        '✅', '❌', '⚠️', '🚨', '📋', '💊', '🩺', '📊'
    ]),
], handleValidationErrors, communicationController_1.default.addReaction);
router.delete('/messages/:id/reactions/:emoji', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.param)('emoji').isString(),
], handleValidationErrors, communicationController_1.default.removeReaction);
router.put('/messages/:id', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.body)('content').isString().trim().isLength({ min: 1, max: 10000 }),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 200 }),
], handleValidationErrors, communicationController_1.default.editMessage);
router.get('/search/messages', auth_1.auth, [
    (0, express_validator_1.query)('q').isString().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.query)('conversationId').optional().isMongoId(),
    (0, express_validator_1.query)('senderId').optional().isMongoId(),
    (0, express_validator_1.query)('type').optional().isIn(['text', 'file', 'image', 'clinical_note', 'system', 'voice_note']),
    (0, express_validator_1.query)('priority').optional().isIn(['normal', 'high', 'urgent']),
    (0, express_validator_1.query)('dateFrom').optional().isISO8601(),
    (0, express_validator_1.query)('dateTo').optional().isISO8601(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidationErrors, encryptionMiddleware_1.decryptMessageContent, ...(0, communicationAuditMiddleware_1.auditSearch)('message_search'), communicationController_1.default.searchMessages);
router.get('/search/conversations', auth_1.auth, [
    (0, express_validator_1.query)('q').isString().trim().isLength({ min: 1, max: 100 }),
    (0, express_validator_1.query)('type').optional().isIn(['direct', 'group', 'patient_query', 'clinical_consultation']),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
    (0, express_validator_1.query)('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    (0, express_validator_1.query)('patientId').optional().isMongoId(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidationErrors, communicationController_1.default.searchConversations);
router.get('/patients/:patientId/conversations', auth_1.auth, [
    (0, express_validator_1.param)('patientId').isMongoId(),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'archived', 'resolved', 'closed']),
    (0, express_validator_1.query)('type').optional().isIn(['patient_query', 'clinical_consultation']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
], handleValidationErrors, encryptionMiddleware_1.decryptMessageContent, communicationAuditMiddleware_1.auditPatientCommunicationAccess, communicationController_1.default.getPatientConversations);
router.post('/patients/:patientId/queries', auth_1.auth, [
    (0, express_validator_1.param)('patientId').isMongoId(),
    (0, express_validator_1.body)('title').optional().isString().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('message').isString().trim().isLength({ min: 1, max: 10000 }),
    (0, express_validator_1.body)('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    (0, express_validator_1.body)('tags').optional().isArray(),
    (0, express_validator_1.body)('tags.*').isString().trim().isLength({ max: 50 }),
], handleValidationErrors, encryptionMiddleware_1.encryptMessageContent, encryptionMiddleware_1.validateEncryptionCompliance, communicationAuditMiddleware_1.auditPatientCommunicationAccess, ...(0, communicationAuditMiddleware_1.auditConversation)('conversation_created'), communicationController_1.default.createPatientQuery);
router.get('/analytics/summary', auth_1.auth, [
    (0, express_validator_1.query)('dateFrom').optional().isISO8601(),
    (0, express_validator_1.query)('dateTo').optional().isISO8601(),
    (0, express_validator_1.query)('patientId').optional().isMongoId(),
], handleValidationErrors, communicationController_1.default.getAnalyticsSummary);
router.post('/upload', auth_1.auth, fileUploadService_1.uploadMiddleware.array('files', 10), [
    (0, express_validator_1.body)('conversationId').optional().isMongoId(),
    (0, express_validator_1.body)('messageType').optional().isIn(['file', 'image', 'voice_note']),
], handleValidationErrors, ...(0, communicationAuditMiddleware_1.auditFile)('file_uploaded'), communicationController_1.default.uploadFiles);
router.get('/files/:fileId', auth_1.auth, [(0, express_validator_1.param)('fileId').isString().trim()], handleValidationErrors, communicationController_1.default.getFile);
router.delete('/files/:fileId', auth_1.auth, [(0, express_validator_1.param)('fileId').isString().trim()], handleValidationErrors, communicationController_1.default.deleteFile);
router.get('/conversations/:id/files', auth_1.auth, [
    (0, express_validator_1.param)('id').isMongoId(),
    (0, express_validator_1.query)('type').optional().isIn(['file', 'image', 'voice_note']),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }),
], handleValidationErrors, communicationController_1.default.getConversationFiles);
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
exports.default = router;
//# sourceMappingURL=communicationRoutes.js.map