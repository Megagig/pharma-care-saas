"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPatientAccess = exports.getLocationAccessSummary = exports.completePatientTransfer = exports.createPatientTransferWorkflow = exports.getPatientsAccessibleFromLocation = exports.revokeSharedPatientAccess = exports.sharePatientWithLocations = exports.assignClinicalNoteToLocation = exports.assignVisitToLocation = exports.getLocationClinicalNotes = exports.getLocationVisits = exports.getLocationDistribution = exports.removeLocationAssignment = exports.transferPatientsBetweenLocations = exports.bulkAssignPatientsToLocation = exports.assignPatientToLocation = exports.getLocationAnalytics = exports.getSharedPatients = exports.getLocationPatients = void 0;
const LocationFilterService_1 = __importDefault(require("../services/LocationFilterService"));
const SharedPatientService_1 = __importDefault(require("../services/SharedPatientService"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const getLocationPatients = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const { includeShared = false } = req.query;
        const workspace = req.workspaceContext.workspace;
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const patients = await LocationFilterService_1.default.getPatientsForLocation({
            workspaceId: workspace._id,
            locationId,
            includeShared: includeShared === 'true'
        });
        res.json({
            success: true,
            data: {
                location: {
                    id: location.id,
                    name: location.name
                },
                patients,
                totalCount: patients.length,
                includeShared: includeShared === 'true'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting location patients:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location patients'
        });
    }
};
exports.getLocationPatients = getLocationPatients;
const getSharedPatients = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const workspace = req.workspaceContext.workspace;
        const patients = await LocationFilterService_1.default.getSharedPatients(workspace._id);
        res.json({
            success: true,
            data: {
                patients,
                totalCount: patients.length
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting shared patients:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve shared patients'
        });
    }
};
exports.getSharedPatients = getSharedPatients;
const getLocationAnalytics = async (req, res) => {
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
        if (locationId) {
            const location = workspace.locations?.find(loc => loc.id === locationId);
            if (!location) {
                res.status(404).json({
                    success: false,
                    message: 'Location not found'
                });
                return;
            }
            const analytics = await LocationFilterService_1.default.getLocationAnalytics(workspace._id, location.id, location.name);
            res.json({
                success: true,
                data: analytics
            });
        }
        else {
            const analytics = await LocationFilterService_1.default.getWorkspaceLocationAnalytics(workspace);
            res.json({
                success: true,
                data: {
                    locations: analytics,
                    totalLocations: analytics.length
                }
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error getting location analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location analytics'
        });
    }
};
exports.getLocationAnalytics = getLocationAnalytics;
const assignPatientToLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientId, locationId } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!patientId || !locationId) {
            res.status(400).json({
                success: false,
                message: 'Patient ID and Location ID are required'
            });
            return;
        }
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        await LocationFilterService_1.default.assignPatientToLocation(new mongoose_1.default.Types.ObjectId(patientId), locationId, workspace._id);
        res.json({
            success: true,
            message: 'Patient assigned to location successfully',
            data: {
                patientId,
                locationId,
                locationName: location.name
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error assigning patient to location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign patient to location'
        });
    }
};
exports.assignPatientToLocation = assignPatientToLocation;
const bulkAssignPatientsToLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientIds, locationId } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!Array.isArray(patientIds) || patientIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Patient IDs array is required'
            });
            return;
        }
        if (!locationId) {
            res.status(400).json({
                success: false,
                message: 'Location ID is required'
            });
            return;
        }
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const objectIds = patientIds.map(id => new mongoose_1.default.Types.ObjectId(id));
        const result = await LocationFilterService_1.default.bulkAssignPatientsToLocation(objectIds, locationId, workspace._id);
        res.json({
            success: true,
            message: 'Bulk assignment completed',
            data: {
                locationId,
                locationName: location.name,
                totalRequested: patientIds.length,
                successful: result.success,
                failed: result.failed
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error bulk assigning patients to location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk assign patients to location'
        });
    }
};
exports.bulkAssignPatientsToLocation = bulkAssignPatientsToLocation;
const transferPatientsBetweenLocations = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientIds, fromLocationId, toLocationId } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!Array.isArray(patientIds) || patientIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Patient IDs array is required'
            });
            return;
        }
        if (!fromLocationId || !toLocationId) {
            res.status(400).json({
                success: false,
                message: 'From and To Location IDs are required'
            });
            return;
        }
        const fromLocation = workspace.locations?.find(loc => loc.id === fromLocationId);
        const toLocation = workspace.locations?.find(loc => loc.id === toLocationId);
        if (!fromLocation || !toLocation) {
            res.status(404).json({
                success: false,
                message: 'One or both locations not found'
            });
            return;
        }
        const objectIds = patientIds.map(id => new mongoose_1.default.Types.ObjectId(id));
        const result = await LocationFilterService_1.default.transferPatientsBetweenLocations(objectIds, fromLocationId, toLocationId, workspace._id);
        res.json({
            success: true,
            message: 'Patient transfer completed',
            data: {
                fromLocation: {
                    id: fromLocationId,
                    name: fromLocation.name
                },
                toLocation: {
                    id: toLocationId,
                    name: toLocation.name
                },
                totalRequested: patientIds.length,
                successful: result.success,
                failed: result.failed
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error transferring patients between locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to transfer patients between locations'
        });
    }
};
exports.transferPatientsBetweenLocations = transferPatientsBetweenLocations;
const removeLocationAssignment = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientIds } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!Array.isArray(patientIds) || patientIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Patient IDs array is required'
            });
            return;
        }
        const objectIds = patientIds.map(id => new mongoose_1.default.Types.ObjectId(id));
        const result = await LocationFilterService_1.default.removeLocationAssignment(objectIds, workspace._id);
        res.json({
            success: true,
            message: 'Location assignment removed successfully',
            data: {
                totalRequested: patientIds.length,
                successful: result.success,
                failed: result.failed
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error removing location assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove location assignment'
        });
    }
};
exports.removeLocationAssignment = removeLocationAssignment;
const getLocationDistribution = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const workspace = req.workspaceContext.workspace;
        const distribution = await LocationFilterService_1.default.getLocationDistributionSummary(workspace._id);
        const enrichedDistribution = distribution.locationDistribution.map(item => {
            const location = workspace.locations?.find(loc => loc.id === item.locationId);
            return {
                ...item,
                locationName: location?.name || 'Unknown Location'
            };
        });
        res.json({
            success: true,
            data: {
                totalPatients: distribution.totalPatients,
                sharedPatients: distribution.sharedPatients,
                locationDistribution: enrichedDistribution,
                summary: {
                    totalLocations: workspace.locations?.length || 0,
                    locationsWithPatients: enrichedDistribution.length,
                    sharedPatientsPercentage: distribution.totalPatients > 0
                        ? Math.round((distribution.sharedPatients / distribution.totalPatients) * 100)
                        : 0
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting location distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location distribution'
        });
    }
};
exports.getLocationDistribution = getLocationDistribution;
const getLocationVisits = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const { includeShared = false } = req.query;
        const workspace = req.workspaceContext.workspace;
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const visits = await LocationFilterService_1.default.getVisitsForLocation({
            workspaceId: workspace._id,
            locationId,
            includeShared: includeShared === 'true'
        });
        res.json({
            success: true,
            data: {
                location: {
                    id: location.id,
                    name: location.name
                },
                visits,
                totalCount: visits.length,
                includeShared: includeShared === 'true'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting location visits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location visits'
        });
    }
};
exports.getLocationVisits = getLocationVisits;
const getLocationClinicalNotes = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const { includeShared = false } = req.query;
        const workspace = req.workspaceContext.workspace;
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const clinicalNotes = await LocationFilterService_1.default.getClinicalNotesForLocation({
            workspaceId: workspace._id,
            locationId,
            includeShared: includeShared === 'true'
        });
        res.json({
            success: true,
            data: {
                location: {
                    id: location.id,
                    name: location.name
                },
                clinicalNotes,
                totalCount: clinicalNotes.length,
                includeShared: includeShared === 'true'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting location clinical notes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location clinical notes'
        });
    }
};
exports.getLocationClinicalNotes = getLocationClinicalNotes;
const assignVisitToLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { visitId, locationId } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!visitId || !locationId) {
            res.status(400).json({
                success: false,
                message: 'Visit ID and Location ID are required'
            });
            return;
        }
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        await LocationFilterService_1.default.assignVisitToLocation(new mongoose_1.default.Types.ObjectId(visitId), locationId, workspace._id);
        res.json({
            success: true,
            message: 'Visit assigned to location successfully',
            data: {
                visitId,
                locationId,
                locationName: location.name
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error assigning visit to location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign visit to location'
        });
    }
};
exports.assignVisitToLocation = assignVisitToLocation;
const assignClinicalNoteToLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { clinicalNoteId, locationId } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!clinicalNoteId || !locationId) {
            res.status(400).json({
                success: false,
                message: 'Clinical Note ID and Location ID are required'
            });
            return;
        }
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        await LocationFilterService_1.default.assignClinicalNoteToLocation(new mongoose_1.default.Types.ObjectId(clinicalNoteId), locationId, workspace._id);
        res.json({
            success: true,
            message: 'Clinical note assigned to location successfully',
            data: {
                clinicalNoteId,
                locationId,
                locationName: location.name
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error assigning clinical note to location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign clinical note to location'
        });
    }
};
exports.assignClinicalNoteToLocation = assignClinicalNoteToLocation;
const sharePatientWithLocations = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientId, fromLocationId, toLocationIds, accessLevel = 'read', expiresAt } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!patientId || !fromLocationId || !Array.isArray(toLocationIds) || toLocationIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Patient ID, from location ID, and to location IDs are required'
            });
            return;
        }
        const fromLocation = workspace.locations?.find(loc => loc.id === fromLocationId);
        if (!fromLocation) {
            res.status(404).json({
                success: false,
                message: 'From location not found'
            });
            return;
        }
        const invalidLocationIds = toLocationIds.filter(locId => !workspace.locations?.find(loc => loc.id === locId));
        if (invalidLocationIds.length > 0) {
            res.status(404).json({
                success: false,
                message: `Invalid location IDs: ${invalidLocationIds.join(', ')}`
            });
            return;
        }
        await SharedPatientService_1.default.sharePatientWithLocations({
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            fromLocationId,
            toLocationIds,
            accessLevel,
            sharedBy: req.user._id,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined
        });
        res.json({
            success: true,
            message: 'Patient shared successfully',
            data: {
                patientId,
                fromLocationId,
                toLocationIds,
                accessLevel,
                expiresAt
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error sharing patient with locations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share patient with locations'
        });
    }
};
exports.sharePatientWithLocations = sharePatientWithLocations;
const revokeSharedPatientAccess = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientId, locationIds } = req.body;
        if (!patientId) {
            res.status(400).json({
                success: false,
                message: 'Patient ID is required'
            });
            return;
        }
        await SharedPatientService_1.default.revokeSharedAccess(new mongoose_1.default.Types.ObjectId(patientId), locationIds);
        res.json({
            success: true,
            message: 'Shared access revoked successfully',
            data: {
                patientId,
                revokedFromLocations: locationIds || 'all'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error revoking shared patient access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke shared patient access'
        });
    }
};
exports.revokeSharedPatientAccess = revokeSharedPatientAccess;
const getPatientsAccessibleFromLocation = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { locationId } = req.params;
        const { includeShared = true } = req.query;
        const workspace = req.workspaceContext.workspace;
        if (!locationId) {
            res.status(400).json({
                success: false,
                message: 'Location ID is required'
            });
            return;
        }
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const patients = await SharedPatientService_1.default.getPatientsAccessibleFromLocation(workspace._id, locationId, includeShared === 'true');
        res.json({
            success: true,
            data: {
                location: {
                    id: location.id,
                    name: location.name
                },
                patients,
                totalCount: patients.length,
                includeShared: includeShared === 'true'
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting patients accessible from location:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve patients accessible from location'
        });
    }
};
exports.getPatientsAccessibleFromLocation = getPatientsAccessibleFromLocation;
const createPatientTransferWorkflow = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientId, fromLocationId, toLocationId, transferReason } = req.body;
        const workspace = req.workspaceContext.workspace;
        if (!patientId || !fromLocationId || !toLocationId) {
            res.status(400).json({
                success: false,
                message: 'Patient ID, from location ID, and to location ID are required'
            });
            return;
        }
        const fromLocation = workspace.locations?.find(loc => loc.id === fromLocationId);
        const toLocation = workspace.locations?.find(loc => loc.id === toLocationId);
        if (!fromLocation || !toLocation) {
            res.status(404).json({
                success: false,
                message: 'One or both locations not found'
            });
            return;
        }
        const result = await SharedPatientService_1.default.createTransferWorkflow(new mongoose_1.default.Types.ObjectId(patientId), fromLocationId, toLocationId, req.user._id, transferReason);
        res.json({
            success: true,
            message: 'Patient transfer workflow created successfully',
            data: {
                transferId: result.transferId,
                status: result.status,
                fromLocation: {
                    id: fromLocationId,
                    name: fromLocation.name
                },
                toLocation: {
                    id: toLocationId,
                    name: toLocation.name
                }
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error creating patient transfer workflow:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create patient transfer workflow'
        });
    }
};
exports.createPatientTransferWorkflow = createPatientTransferWorkflow;
const completePatientTransfer = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientId, transferId } = req.body;
        if (!patientId || !transferId) {
            res.status(400).json({
                success: false,
                message: 'Patient ID and transfer ID are required'
            });
            return;
        }
        await SharedPatientService_1.default.completePatientTransfer(new mongoose_1.default.Types.ObjectId(patientId), transferId, req.user._id);
        res.json({
            success: true,
            message: 'Patient transfer completed successfully',
            data: {
                patientId,
                transferId
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error completing patient transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete patient transfer'
        });
    }
};
exports.completePatientTransfer = completePatientTransfer;
const getLocationAccessSummary = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const workspace = req.workspaceContext.workspace;
        const summary = await SharedPatientService_1.default.getLocationAccessSummary(workspace._id, workspace);
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger_1.default.error('Error getting location access summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve location access summary'
        });
    }
};
exports.getLocationAccessSummary = getLocationAccessSummary;
const checkPatientAccess = async (req, res) => {
    try {
        if (!req.workspaceContext?.workspace) {
            res.status(400).json({
                success: false,
                message: 'Workspace context not found'
            });
            return;
        }
        const { patientId, locationId } = req.params;
        const workspace = req.workspaceContext.workspace;
        if (!patientId || !locationId) {
            res.status(400).json({
                success: false,
                message: 'Patient ID and location ID are required'
            });
            return;
        }
        const location = workspace.locations?.find(loc => loc.id === locationId);
        if (!location) {
            res.status(404).json({
                success: false,
                message: 'Location not found'
            });
            return;
        }
        const accessInfo = await SharedPatientService_1.default.checkPatientAccess(new mongoose_1.default.Types.ObjectId(patientId), locationId, workspace._id);
        res.json({
            success: true,
            data: {
                patientId,
                locationId,
                locationName: location.name,
                ...accessInfo
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error checking patient access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check patient access'
        });
    }
};
exports.checkPatientAccess = checkPatientAccess;
//# sourceMappingURL=locationDataController.js.map