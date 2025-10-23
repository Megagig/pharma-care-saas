"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdvancedFeatureAccess = exports.getMarketingFeatures = exports.getFeatureFlagMetrics = exports.updateTargetingRules = exports.updateTierFeatures = exports.getFeatureFlagsByTier = exports.getFeatureFlagsByCategory = exports.toggleFeatureFlagStatus = exports.deleteFeatureFlag = exports.updateFeatureFlag = exports.createFeatureFlag = exports.getFeatureFlagById = exports.getAllFeatureFlags = void 0;
const FeatureFlag_1 = require("../models/FeatureFlag");
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../types/auth");
const enhancedFeatureFlagService_1 = __importDefault(require("../services/enhancedFeatureFlagService"));
const AVAILABLE_TIERS = ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'];
const getAllFeatureFlags = async (req, res) => {
    try {
        const user = req.user;
        let query = { isActive: true };
        if (user && (0, auth_1.isExtendedUser)(user) && user.role === 'super_admin') {
            query = {};
        }
        const featureFlags = await FeatureFlag_1.FeatureFlag.find(query).sort({
            'metadata.category': 1,
            name: 1,
        });
        return res.status(200).json({
            success: true,
            count: featureFlags.length,
            data: featureFlags,
        });
    }
    catch (error) {
        console.error('Error fetching feature flags:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getAllFeatureFlags = getAllFeatureFlags;
const getFeatureFlagById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Feature flag ID is required',
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feature flag ID',
            });
        }
        const query = {
            _id: new mongoose_1.default.Types.ObjectId(id),
        };
        if (!user || !(0, auth_1.isExtendedUser)(user) || user.role !== 'super_admin') {
            query.isActive = true;
        }
        const featureFlag = await FeatureFlag_1.FeatureFlag.findOne(query);
        if (!featureFlag) {
            return res.status(404).json({
                success: false,
                message: 'Feature flag not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: featureFlag,
        });
    }
    catch (error) {
        console.error('Error fetching feature flag:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getFeatureFlagById = getFeatureFlagById;
const createFeatureFlag = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    try {
        const { name, key, description, isActive = true, allowedTiers = [], allowedRoles = [], customRules = {}, metadata = {
            category: 'core',
            priority: 'medium',
            tags: [],
        }, } = req.body;
        const existingFlag = await FeatureFlag_1.FeatureFlag.findOne({ key: key.toLowerCase() });
        if (existingFlag) {
            return res.status(400).json({
                success: false,
                message: `Feature flag with key '${key}' already exists`,
            });
        }
        const featureFlag = new FeatureFlag_1.FeatureFlag({
            name,
            key: key.toLowerCase(),
            description,
            isActive,
            allowedTiers,
            allowedRoles,
            customRules,
            metadata,
        });
        await featureFlag.save();
        return res.status(201).json({
            success: true,
            message: 'Feature flag created successfully',
            data: featureFlag,
        });
    }
    catch (error) {
        console.error('Error creating feature flag:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.createFeatureFlag = createFeatureFlag;
const updateFeatureFlag = async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Feature flag ID is required',
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feature flag ID',
            });
        }
        const { name, description, isActive, allowedTiers, allowedRoles, customRules, metadata, } = req.body;
        if (req.body.key) {
            delete req.body.key;
        }
        const featureFlag = await FeatureFlag_1.FeatureFlag.findById(id);
        if (!featureFlag) {
            return res.status(404).json({
                success: false,
                message: 'Feature flag not found',
            });
        }
        if (name)
            featureFlag.name = name;
        if (description !== undefined)
            featureFlag.description = description;
        if (isActive !== undefined)
            featureFlag.isActive = isActive;
        if (allowedTiers)
            featureFlag.allowedTiers = allowedTiers;
        if (allowedRoles)
            featureFlag.allowedRoles = allowedRoles;
        if (customRules)
            featureFlag.customRules = customRules;
        if (metadata)
            featureFlag.metadata = metadata;
        await featureFlag.save();
        return res.status(200).json({
            success: true,
            message: 'Feature flag updated successfully',
            data: featureFlag,
        });
    }
    catch (error) {
        console.error('Error updating feature flag:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.updateFeatureFlag = updateFeatureFlag;
const deleteFeatureFlag = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Feature flag ID is required',
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feature flag ID',
            });
        }
        const featureFlag = await FeatureFlag_1.FeatureFlag.findByIdAndDelete(id);
        if (!featureFlag) {
            return res.status(404).json({
                success: false,
                message: 'Feature flag not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Feature flag deleted successfully',
            data: {},
        });
    }
    catch (error) {
        console.error('Error deleting feature flag:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.deleteFeatureFlag = deleteFeatureFlag;
const toggleFeatureFlagStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Feature flag ID is required',
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feature flag ID',
            });
        }
        const featureFlag = await FeatureFlag_1.FeatureFlag.findById(id);
        if (!featureFlag) {
            return res.status(404).json({
                success: false,
                message: 'Feature flag not found',
            });
        }
        featureFlag.isActive = !featureFlag.isActive;
        await featureFlag.save();
        return res.status(200).json({
            success: true,
            message: `Feature flag ${featureFlag.isActive ? 'enabled' : 'disabled'} successfully`,
            data: featureFlag,
        });
    }
    catch (error) {
        console.error('Error toggling feature flag status:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.toggleFeatureFlagStatus = toggleFeatureFlagStatus;
const getFeatureFlagsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const featureFlags = await FeatureFlag_1.FeatureFlag.find({
            'metadata.category': category,
        }).sort({ name: 1 });
        return res.status(200).json({
            success: true,
            count: featureFlags.length,
            data: featureFlags,
        });
    }
    catch (error) {
        console.error('Error fetching feature flags by category:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getFeatureFlagsByCategory = getFeatureFlagsByCategory;
const getFeatureFlagsByTier = async (req, res) => {
    try {
        const { tier } = req.params;
        const featureFlags = await FeatureFlag_1.FeatureFlag.find({
            allowedTiers: tier,
        }).sort({ 'metadata.category': 1, name: 1 });
        return res.status(200).json({
            success: true,
            count: featureFlags.length,
            data: featureFlags,
        });
    }
    catch (error) {
        console.error('Error fetching feature flags by tier:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getFeatureFlagsByTier = getFeatureFlagsByTier;
const updateTierFeatures = async (req, res) => {
    try {
        const { tier } = req.params;
        const { featureKeys, action } = req.body;
        if (!tier || !AVAILABLE_TIERS.includes(tier)) {
            return res.status(400).json({
                success: false,
                message: `Invalid tier. Must be one of: ${AVAILABLE_TIERS.join(', ')}`,
            });
        }
        if (!action || !['add', 'remove'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be either "add" or "remove"',
            });
        }
        if (!featureKeys || !Array.isArray(featureKeys) || featureKeys.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'featureKeys must be a non-empty array',
            });
        }
        let result;
        if (action === 'add') {
            result = await FeatureFlag_1.FeatureFlag.updateMany({ key: { $in: featureKeys } }, { $addToSet: { allowedTiers: tier } });
        }
        else {
            result = await FeatureFlag_1.FeatureFlag.updateMany({ key: { $in: featureKeys } }, { $pull: { allowedTiers: tier } });
        }
        return res.status(200).json({
            success: true,
            message: `Successfully ${action === 'add' ? 'added' : 'removed'} tier "${tier}" ${action === 'add' ? 'to' : 'from'} ${result.modifiedCount} feature(s)`,
            data: {
                tier,
                action,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            },
        });
    }
    catch (error) {
        console.error('Error updating tier features:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.updateTierFeatures = updateTierFeatures;
const updateTargetingRules = async (req, res) => {
    try {
        const { id } = req.params;
        const { targetingRules } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feature flag ID',
            });
        }
        const validation = enhancedFeatureFlagService_1.default.validateTargetingRules(targetingRules);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: validation.error,
            });
        }
        const featureFlag = await FeatureFlag_1.FeatureFlag.findByIdAndUpdate(id, {
            $set: {
                targetingRules,
                updatedBy: req.user?._id,
                updatedAt: new Date(),
            },
        }, { new: true });
        if (!featureFlag) {
            return res.status(404).json({
                success: false,
                message: 'Feature flag not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Targeting rules updated successfully',
            data: featureFlag,
        });
    }
    catch (error) {
        console.error('Error updating targeting rules:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.updateTargetingRules = updateTargetingRules;
const getFeatureFlagMetrics = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feature flag ID',
            });
        }
        const featureFlag = await FeatureFlag_1.FeatureFlag.findById(id);
        if (!featureFlag) {
            return res.status(404).json({
                success: false,
                message: 'Feature flag not found',
            });
        }
        const metrics = await enhancedFeatureFlagService_1.default.calculateUsageMetrics(featureFlag.key);
        return res.status(200).json({
            success: true,
            data: {
                featureFlag: {
                    id: featureFlag._id,
                    key: featureFlag.key,
                    name: featureFlag.name,
                },
                metrics,
            },
        });
    }
    catch (error) {
        console.error('Error fetching feature flag metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getFeatureFlagMetrics = getFeatureFlagMetrics;
const getMarketingFeatures = async (req, res) => {
    try {
        const { tier } = req.query;
        const features = await enhancedFeatureFlagService_1.default.getMarketingFeatures(tier);
        return res.status(200).json({
            success: true,
            count: features.length,
            data: features,
        });
    }
    catch (error) {
        console.error('Error fetching marketing features:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.getMarketingFeatures = getMarketingFeatures;
const checkAdvancedFeatureAccess = async (req, res) => {
    try {
        const { featureKey, workspaceId } = req.body;
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }
        if (!featureKey) {
            return res.status(400).json({
                success: false,
                message: 'Feature key is required',
            });
        }
        const accessResult = await enhancedFeatureFlagService_1.default.hasAdvancedFeatureAccess(userId.toString(), featureKey, workspaceId);
        return res.status(200).json({
            success: true,
            data: accessResult,
        });
    }
    catch (error) {
        console.error('Error checking advanced feature access:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.checkAdvancedFeatureAccess = checkAdvancedFeatureAccess;
exports.default = {
    getAllFeatureFlags: exports.getAllFeatureFlags,
    getFeatureFlagById: exports.getFeatureFlagById,
    createFeatureFlag: exports.createFeatureFlag,
    updateFeatureFlag: exports.updateFeatureFlag,
    deleteFeatureFlag: exports.deleteFeatureFlag,
    toggleFeatureFlagStatus: exports.toggleFeatureFlagStatus,
    getFeatureFlagsByCategory: exports.getFeatureFlagsByCategory,
    getFeatureFlagsByTier: exports.getFeatureFlagsByTier,
    updateTierFeatures: exports.updateTierFeatures,
    updateTargetingRules: exports.updateTargetingRules,
    getFeatureFlagMetrics: exports.getFeatureFlagMetrics,
    getMarketingFeatures: exports.getMarketingFeatures,
    checkAdvancedFeatureAccess: exports.checkAdvancedFeatureAccess,
};
//# sourceMappingURL=featureFlagController.js.map