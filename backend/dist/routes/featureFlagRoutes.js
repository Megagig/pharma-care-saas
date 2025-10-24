"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const featureFlagController_1 = __importDefault(require("../controllers/featureFlagController"));
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.get('/', auth_1.auth, featureFlagController_1.default.getAllFeatureFlags);
router.get('/:id', auth_1.auth, featureFlagController_1.default.getFeatureFlagById);
router.get('/:id/metrics', auth_1.auth, featureFlagController_1.default.getFeatureFlagMetrics);
router.use(auth_1.auth);
router.use(auth_1.requireSuperAdmin);
router.post('/', [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Feature name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Feature name must be between 3 and 100 characters'),
    (0, express_validator_1.body)('key')
        .notEmpty()
        .withMessage('Feature key is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Feature key must be between 3 and 50 characters')
        .matches(/^[a-z0-9_]+$/)
        .withMessage('Feature key must contain only lowercase letters, numbers, and underscores'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    (0, express_validator_1.body)('allowedTiers')
        .optional()
        .isArray()
        .withMessage('allowedTiers must be an array'),
    (0, express_validator_1.body)('allowedRoles')
        .optional()
        .isArray()
        .withMessage('allowedRoles must be an array'),
    (0, express_validator_1.body)('metadata.category')
        .optional()
        .isString()
        .withMessage('Category must be a string'),
    (0, express_validator_1.body)('metadata.priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Priority must be one of: low, medium, high, critical'),
    (0, express_validator_1.body)('metadata.tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
], featureFlagController_1.default.createFeatureFlag);
router.put('/:id', [
    (0, express_validator_1.body)('name')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Feature name must be between 3 and 100 characters'),
    (0, express_validator_1.body)('description').optional(),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    (0, express_validator_1.body)('allowedTiers')
        .optional()
        .isArray()
        .withMessage('allowedTiers must be an array'),
    (0, express_validator_1.body)('allowedRoles')
        .optional()
        .isArray()
        .withMessage('allowedRoles must be an array'),
    (0, express_validator_1.body)('metadata.category')
        .optional()
        .isString()
        .withMessage('Category must be a string'),
    (0, express_validator_1.body)('metadata.priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Priority must be one of: low, medium, high, critical'),
    (0, express_validator_1.body)('metadata.tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
], featureFlagController_1.default.updateFeatureFlag);
router.delete('/:id', featureFlagController_1.default.deleteFeatureFlag);
router.patch('/:id/toggle', featureFlagController_1.default.toggleFeatureFlagStatus);
router.get('/category/:category', featureFlagController_1.default.getFeatureFlagsByCategory);
router.get('/tier/:tier', featureFlagController_1.default.getFeatureFlagsByTier);
router.post('/tier/:tier/features', [
    (0, express_validator_1.body)('featureKeys')
        .isArray({ min: 1 })
        .withMessage('featureKeys must be a non-empty array'),
    (0, express_validator_1.body)('action')
        .isIn(['add', 'remove'])
        .withMessage('action must be either "add" or "remove"'),
], featureFlagController_1.default.updateTierFeatures);
router.post('/sync-subscriptions', featureFlagController_1.default.syncSubscriptionFeatures);
router.put('/:id/targeting', [
    (0, express_validator_1.body)('targetingRules').isObject().withMessage('targetingRules must be an object'),
    (0, express_validator_1.body)('targetingRules.pharmacies')
        .optional()
        .isArray()
        .withMessage('pharmacies must be an array'),
    (0, express_validator_1.body)('targetingRules.userGroups')
        .optional()
        .isArray()
        .withMessage('userGroups must be an array'),
    (0, express_validator_1.body)('targetingRules.percentage')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('percentage must be between 0 and 100'),
], featureFlagController_1.default.updateTargetingRules);
router.get('/public/marketing', featureFlagController_1.default.getMarketingFeatures);
router.post('/check-access', auth_1.auth, [
    (0, express_validator_1.body)('featureKey')
        .notEmpty()
        .withMessage('featureKey is required'),
    (0, express_validator_1.body)('workspaceId')
        .optional()
        .isMongoId()
        .withMessage('workspaceId must be a valid MongoDB ObjectId'),
], featureFlagController_1.default.checkAdvancedFeatureAccess);
exports.default = router;
//# sourceMappingURL=featureFlagRoutes.js.map