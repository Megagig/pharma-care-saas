"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateLocations = exports.getLocationStats = exports.setPrimaryLocation = exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getLocationById = exports.getWorkspaceLocations = void 0;
const Workplace_1 = __importDefault(require("../models/Workplace"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const getWorkspaceLocations = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const workspace = req.workspaceContext.workspace;
        res.json({
            success: true,
            data: {
                locations: workspace.locations || [],
                totalLocations: workspace.locations?.length || 0,
                primaryLocation: workspace.locations?.find(loc => loc.isPrimary) || null
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting workspace locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve locations'
        });
    }
};
exports.getWorkspaceLocations = getWorkspaceLocations;
const getLocationById = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const workspace = req.workspaceContext.workspace;
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        res.json({
            success: true,
            data: location
        });
    }
    catch (error) {
        logger_1.default.error('Error getting location by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location'
        });
    }
};
exports.getLocationById = getLocationById;
const createLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { name, address, metadata = {} } = req.body;
        if (!name || !address) {
            res.status(400).json({
                success: false,
                message: 'Name and address are required'
            });
            return;
        }
        const workspace = req.workspaceContext.workspace;
        const plan = req.workspaceContext?.plan;
        const hasMultiLocationFeature = plan?.features
            ? (Array.isArray(plan.features)
                ? plan.features.includes('multiLocationDashboard') || plan.features.includes('multi_location_dashboard')
                : plan.features.multiLocationDashboard === true)
            : false;
        if (!plan || !hasMultiLocationFeature) {
            res.status(403).json({
                success: false,
                message: 'Multi-location feature not available in your current plan',
                upgradeRequired: true
            });
            return;
        }
        const currentLocationCount = workspace.locations?.length || 0;
        const locationLimit = req.workspaceContext.limits?.locations;
        if (locationLimit && currentLocationCount >= locationLimit) {
            res.status(409).json({
                success: false,
                message: `Location limit reached (${locationLimit}). Upgrade your plan to add more locations.`,
                currentCount: currentLocationCount,
                limit: locationLimit,
                upgradeRequired: true
            });
            return;
        }
        const newLocation = {
            id: new mongoose_1.default.Types.ObjectId().toString(),
            name: name.trim(),
            address: address.trim(),
            isPrimary: false,
            metadata: metadata || {}
        };
        const updatedWorkspace = await Workplace_1.default.findByIdAndUpdate(workspace._id, {
            $push: { locations: newLocation }
        }, { new: true, runValidators: true });
        if (!updatedWorkspace) {
            res.status(500).json({
                success: false,
                message: 'Failed to create location'
            });
            return;
        }
        logger_1.default.info(`Location created: ${newLocation.name} for workspace ${workspace.name}`);
        res.status(201).json({
            success: true,
            message: 'Location created successfully',
            data: newLocation
        });
    }
    catch (error) {
        logger_1.default.error('Error creating location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create location'
        });
    }
};
exports.createLocation = createLocation;
const updateLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const { name, address, metadata } = req.body;
        const workspace = req.workspaceContext.workspace;
        const locationIndex = workspace.locations?.findIndex(loc => loc.id === locationId);
        if (locationIndex === -1 || locationIndex === undefined) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const updateData = {};
        if (name !== undefined)
            updateData[`locations.${locationIndex}.name`] = name.trim();
        if (address !== undefined)
            updateData[`locations.${locationIndex}.address`] = address.trim();
        if (metadata !== undefined)
            updateData[`locations.${locationIndex}.metadata`] = metadata;
        const updatedWorkspace = await Workplace_1.default.findByIdAndUpdate(workspace._id, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedWorkspace) {
            res.status(500).json({
                success: false,
                message: 'Failed to update location'
            });
            return;
        }
        const updatedLocation = updatedWorkspace.locations?.[locationIndex];
        logger_1.default.info(`Location updated: ${locationId} for workspace ${workspace.name}`);
        res.json({
            success: true,
            message: 'Location updated successfully',
            data: updatedLocation
        });
    }
    catch (error) {
        logger_1.default.error('Error updating location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update location'
        });
    }
};
exports.updateLocation = updateLocation;
const deleteLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const workspace = req.workspaceContext.workspace;
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        if (location.isPrimary) {
            res.status(400).json({
                success: false,
                message: 'Cannot delete primary location. Set another location as primary first.'
            });
            return;
        }
        const updatedWorkspace = await Workplace_1.default.findByIdAndUpdate(workspace._id, {
            $pull: { locations: { id: locationId } }
        }, { new: true });
        if (!updatedWorkspace) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete location'
            });
            return;
        }
        logger_1.default.info(`Location deleted: ${locationId} for workspace ${workspace.name}`);
        res.json({
            success: true,
            message: 'Location deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error deleting location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete location'
        });
    }
};
exports.deleteLocation = deleteLocation;
const setPrimaryLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const workspace = req.workspaceContext.workspace;
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const updateOperations = workspace.locations?.map((loc, index) => ({
            [`locations.${index}.isPrimary`]: loc.id === locationId
        })) || [];
        const updateData = Object.assign({}, ...updateOperations);
        const updatedWorkspace = await Workplace_1.default.findByIdAndUpdate(workspace._id, { $set: updateData }, { new: true });
        if (!updatedWorkspace) {
            res.status(500).json({
                success: false,
                message: 'Failed to set primary location'
            });
            return;
        }
        logger_1.default.info(`Primary location set: ${locationId} for workspace ${workspace.name}`);
        res.json({
            success: true,
            message: 'Primary location updated successfully',
            data: {
                primaryLocationId: locationId,
                locations: updatedWorkspace.locations
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error setting primary location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set primary location'
        });
    }
};
exports.setPrimaryLocation = setPrimaryLocation;
const getLocationStats = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const workspace = req.workspaceContext.workspace;
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const stats = {
            location,
            statistics: {
                totalPatients: 0,
                activePatients: 0,
                totalUsers: 0,
                totalVisits: 0,
                lastActivity: null
            }
        };
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        logger_1.default.error('Error getting location stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location statistics'
        });
    }
};
exports.getLocationStats = getLocationStats;
const bulkUpdateLocations = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locations } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!Array.isArray(locations)) {
            res.status(400).json({
                success: false,
                message: 'Locations must be an array'
            });
            return;
        }
        const existingLocationIds = workspace.locations?.map(loc => loc.id) || [];
        const updateLocationIds = locations.map(loc => loc.id);
        const invalidIds = updateLocationIds.filter(id => !existingLocationIds.includes(id));
        if (invalidIds.length > 0) {
            res.status(400).json({
                success: false,
                message: `Invalid location IDs: ${invalidIds.join(', ')}`
            });
            return;
        }
        const primaryLocations = locations.filter(loc => loc.isPrimary);
        if (primaryLocations.length > 1) {
            res.status(400).json({
                success: false,
                message: 'Only one location can be set as primary'
            });
            return;
        }
        const updatedLocations = workspace.locations?.map(existingLoc => {
            const updateData = locations.find(loc => loc.id === existingLoc.id);
            if (updateData) {
                return {
                    ...existingLoc,
                    name: updateData.name || existingLoc.name,
                    address: updateData.address || existingLoc.address,
                    isPrimary: updateData.isPrimary !== undefined ? updateData.isPrimary : existingLoc.isPrimary,
                    metadata: updateData.metadata || existingLoc.metadata
                };
            }
            return existingLoc;
        }) || [];
        const updatedWorkspace = await Workplace_1.default.findByIdAndUpdate(workspace._id, { locations: updatedLocations }, { new: true, runValidators: true });
        if (!updatedWorkspace) {
            res.status(500).json({
                success: false,
                message: 'Failed to update locations'
            });
            return;
        }
        logger_1.default.info(`Bulk location update completed for workspace ${workspace.name}`);
        res.json({
            success: true,
            message: 'Locations updated successfully',
            data: {
                locations: updatedWorkspace.locations,
                updatedCount: locations.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error bulk updating locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update locations'
        });
    }
};
exports.bulkUpdateLocations = bulkUpdateLocations;
//# sourceMappingURL=locationController.js.map