"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const webhookController_1 = __importDefault(require("../controllers/webhookController"));
const auth_1 = require("../middlewares/auth");
const rbac_1 = require("../middlewares/rbac");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.use(rbac_1.requireSuperAdmin);
router.get('/', [
    (0, express_validator_1.query)('userId').optional().isMongoId(),
    (0, express_validator_1.query)('isActive').optional().isBoolean(),
    (0, express_validator_1.query)('events').optional(),
    (0, express_validator_1.query)('search').optional().isString().trim(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], webhookController_1.default.getWebhooks);
router.post('/', [
    (0, express_validator_1.body)('userId').notEmpty().isMongoId()
        .withMessage('Valid user ID is required'),
    (0, express_validator_1.body)('name').notEmpty().isString().trim()
        .isLength({ max: 200 }).withMessage('Name is required and must be less than 200 characters'),
    (0, express_validator_1.body)('description').optional().isString().trim()
        .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('url').notEmpty().isURL()
        .withMessage('Valid URL is required'),
    (0, express_validator_1.body)('events').notEmpty().isArray({ min: 1 })
        .withMessage('At least one event is required'),
    (0, express_validator_1.body)('events.*').isString().trim(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    (0, express_validator_1.body)('headers').optional().isObject(),
    (0, express_validator_1.body)('retryPolicy.maxRetries').optional().isInt({ min: 0, max: 10 }),
    (0, express_validator_1.body)('retryPolicy.retryDelay').optional().isInt({ min: 1, max: 3600 }),
    (0, express_validator_1.body)('retryPolicy.backoffMultiplier').optional().isFloat({ min: 1, max: 10 }),
    (0, express_validator_1.body)('timeout').optional().isInt({ min: 1000, max: 300000 }),
    (0, express_validator_1.body)('filters.conditions').optional().isArray(),
    (0, express_validator_1.body)('filters.conditions.*.field').optional().isString().trim(),
    (0, express_validator_1.body)('filters.conditions.*.operator').optional().isIn([
        'equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than'
    ]),
    (0, express_validator_1.body)('filters.logicalOperator').optional().isIn(['AND', 'OR'])
], webhookController_1.default.createWebhook);
router.put('/:id', [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Valid webhook ID is required'),
    (0, express_validator_1.body)('name').optional().isString().trim()
        .isLength({ max: 200 }).withMessage('Name must be less than 200 characters'),
    (0, express_validator_1.body)('description').optional().isString().trim()
        .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    (0, express_validator_1.body)('url').optional().isURL()
        .withMessage('Valid URL is required'),
    (0, express_validator_1.body)('events').optional().isArray({ min: 1 })
        .withMessage('At least one event is required'),
    (0, express_validator_1.body)('events.*').optional().isString().trim(),
    (0, express_validator_1.body)('isActive').optional().isBoolean(),
    (0, express_validator_1.body)('headers').optional().isObject(),
    (0, express_validator_1.body)('retryPolicy.maxRetries').optional().isInt({ min: 0, max: 10 }),
    (0, express_validator_1.body)('retryPolicy.retryDelay').optional().isInt({ min: 1, max: 3600 }),
    (0, express_validator_1.body)('retryPolicy.backoffMultiplier').optional().isFloat({ min: 1, max: 10 }),
    (0, express_validator_1.body)('timeout').optional().isInt({ min: 1000, max: 300000 }),
    (0, express_validator_1.body)('filters.conditions').optional().isArray(),
    (0, express_validator_1.body)('filters.logicalOperator').optional().isIn(['AND', 'OR'])
], webhookController_1.default.updateWebhook);
router.delete('/:id', [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Valid webhook ID is required')
], webhookController_1.default.deleteWebhook);
router.post('/:id/test', [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Valid webhook ID is required')
], webhookController_1.default.testWebhook);
router.post('/trigger', [
    (0, express_validator_1.body)('eventType').notEmpty().isString().trim()
        .withMessage('Event type is required'),
    (0, express_validator_1.body)('eventData').notEmpty()
        .withMessage('Event data is required'),
    (0, express_validator_1.body)('eventId').optional().isString().trim()
], webhookController_1.default.triggerWebhook);
router.get('/deliveries', [
    (0, express_validator_1.query)('webhookId').optional().isMongoId(),
    (0, express_validator_1.query)('eventType').optional().isString().trim(),
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'delivered', 'failed', 'cancelled']),
    (0, express_validator_1.query)('startDate').optional().isISO8601().toDate(),
    (0, express_validator_1.query)('endDate').optional().isISO8601().toDate(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], webhookController_1.default.getWebhookDeliveries);
router.get('/statistics', [
    (0, express_validator_1.query)('webhookId').optional().isMongoId(),
    (0, express_validator_1.query)('startDate').optional().isISO8601().toDate(),
    (0, express_validator_1.query)('endDate').optional().isISO8601().toDate()
], webhookController_1.default.getWebhookStatistics);
router.get('/events', webhookController_1.default.getAvailableEvents);
router.post('/process-retries', webhookController_1.default.processRetries);
exports.default = router;
//# sourceMappingURL=webhookRoutes.js.map