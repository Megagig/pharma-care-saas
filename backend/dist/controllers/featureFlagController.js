"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeatureFlagsByTier = exports.getFeatureFlagsByCategory = exports.toggleFeatureFlagStatus = exports.deleteFeatureFlag = exports.updateFeatureFlag = exports.createFeatureFlag = exports.getFeatureFlagById = exports.getAllFeatureFlags = void 0;
const FeatureFlag_1 = require("../models/FeatureFlag");
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const getAllFeatureFlags = async (req, res) => {
    try {
        const user = req.user;
        let query = { isActive: true };
        if (user && user.role === 'super_admin') {
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
        if (!user || user.role !== 'super_admin') {
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
exports.default = {
    getAllFeatureFlags: exports.getAllFeatureFlags,
    getFeatureFlagById: exports.getFeatureFlagById,
    createFeatureFlag: exports.createFeatureFlag,
    updateFeatureFlag: exports.updateFeatureFlag,
    deleteFeatureFlag: exports.deleteFeatureFlag,
    toggleFeatureFlagStatus: exports.toggleFeatureFlagStatus,
    getFeatureFlagsByCategory: exports.getFeatureFlagsByCategory,
    getFeatureFlagsByTier: exports.getFeatureFlagsByTier,
};
//# sourceMappingURL=featureFlagController.js.map