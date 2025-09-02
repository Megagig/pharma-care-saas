"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedPatientService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Patient_1 = __importDefault(require("../models/Patient"));
const logger_1 = __importDefault(require("../utils/logger"));
class SharedPatientService {
    async sharePatientWithLocations(options) {
        try {
            const { patientId, fromLocationId, toLocationIds, accessLevel, sharedBy, expiresAt } = options;
            const patient = await Patient_1.default.findOne({
                _id: patientId,
                locationId: fromLocationId,
                isDeleted: { $ne: true }
            });
            if (!patient) {
                throw new Error('Patient not found or access denied');
            }
            const sharedAccess = {
                patientId,
                sharedWithLocations: toLocationIds,
                sharedBy,
                sharedAt: new Date(),
                accessLevel,
                expiresAt
            };
            const updatedPatient = await Patient_1.default.findByIdAndUpdate(patientId, {
                $set: {
                    'metadata.sharedAccess': sharedAccess
                }
            }, { new: true });
            if (!updatedPatient) {
                throw new Error('Failed to update patient sharing information');
            }
            logger_1.default.info(`Patient ${patientId} shared from location ${fromLocationId} to locations: ${toLocationIds.join(', ')}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error sharing patient with locations:', error);
            throw error;
        }
    }
    async revokeSharedAccess(patientId, locationIds) {
        try {
            const patient = await Patient_1.default.findById(patientId);
            if (!patient) {
                throw new Error('Patient not found');
            }
            if (locationIds && locationIds.length > 0) {
                const currentSharedAccess = patient.metadata?.sharedAccess;
                if (currentSharedAccess) {
                    const updatedSharedLocations = currentSharedAccess.sharedWithLocations.filter(locId => !locationIds.includes(locId));
                    if (updatedSharedLocations.length === 0) {
                        await Patient_1.default.findByIdAndUpdate(patientId, { $unset: { 'metadata.sharedAccess': 1 } });
                    }
                    else {
                        await Patient_1.default.findByIdAndUpdate(patientId, {
                            $set: {
                                'metadata.sharedAccess.sharedWithLocations': updatedSharedLocations
                            }
                        });
                    }
                }
            }
            else {
                await Patient_1.default.findByIdAndUpdate(patientId, { $unset: { 'metadata.sharedAccess': 1 } });
            }
            logger_1.default.info(`Shared access revoked for patient ${patientId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error revoking shared access:', error);
            throw error;
        }
    }
    async getPatientsAccessibleFromLocation(workspaceId, locationId, includeShared = true) {
        try {
            const query = {
                workspaceId,
                isDeleted: { $ne: true },
                $or: [
                    { locationId: locationId },
                ]
            };
            if (includeShared) {
                query.$or.push({ 'metadata.sharedAccess.sharedWithLocations': locationId }, { locationId: { $exists: false } }, { locationId: null });
            }
            const patients = await Patient_1.default.find(query)
                .select('_id firstName lastName mrn locationId metadata.sharedAccess createdAt')
                .sort({ createdAt: -1 })
                .lean();
            const enrichedPatients = patients.map(patient => {
                const sharedAccess = patient.metadata?.sharedAccess;
                let accessType = 'direct';
                let accessLevel = 'full';
                if (patient.locationId === locationId) {
                    accessType = 'direct';
                    accessLevel = 'full';
                }
                else if (sharedAccess?.sharedWithLocations?.includes(locationId)) {
                    accessType = 'shared';
                    accessLevel = sharedAccess.accessLevel;
                }
                else if (!patient.locationId) {
                    accessType = 'workspace_shared';
                    accessLevel = 'full';
                }
                return {
                    ...patient,
                    accessInfo: {
                        type: accessType,
                        level: accessLevel,
                        sharedAt: sharedAccess?.sharedAt,
                        expiresAt: sharedAccess?.expiresAt
                    }
                };
            });
            return enrichedPatients;
        }
        catch (error) {
            logger_1.default.error('Error getting patients accessible from location:', error);
            throw error;
        }
    }
    async getSharedPatientRecords(workspaceId) {
        try {
            const patients = await Patient_1.default.find({
                workspaceId,
                isDeleted: { $ne: true },
                'metadata.sharedAccess': { $exists: true }
            })
                .select('_id firstName lastName mrn locationId metadata.sharedAccess createdAt')
                .sort({ createdAt: -1 })
                .lean();
            return patients.map(patient => {
                const sharedAccess = patient.metadata?.sharedAccess;
                return {
                    ...patient,
                    sharedAccess
                };
            });
        }
        catch (error) {
            logger_1.default.error('Error getting shared patient records:', error);
            throw error;
        }
    }
    async checkPatientAccess(patientId, locationId, workspaceId) {
        try {
            const patient = await Patient_1.default.findOne({
                _id: patientId,
                workspaceId,
                isDeleted: { $ne: true }
            }).lean();
            if (!patient) {
                return { hasAccess: false, accessLevel: 'read', accessType: 'direct' };
            }
            if (patient.locationId === locationId) {
                return { hasAccess: true, accessLevel: 'full', accessType: 'direct' };
            }
            const sharedAccess = patient.metadata?.sharedAccess;
            if (sharedAccess?.sharedWithLocations?.includes(locationId)) {
                if (sharedAccess.expiresAt && new Date() > sharedAccess.expiresAt) {
                    return { hasAccess: false, accessLevel: 'read', accessType: 'shared' };
                }
                return {
                    hasAccess: true,
                    accessLevel: sharedAccess.accessLevel,
                    accessType: 'shared'
                };
            }
            if (!patient.locationId) {
                return { hasAccess: true, accessLevel: 'full', accessType: 'workspace_shared' };
            }
            return { hasAccess: false, accessLevel: 'read', accessType: 'direct' };
        }
        catch (error) {
            logger_1.default.error('Error checking patient access:', error);
            return { hasAccess: false, accessLevel: 'read', accessType: 'direct' };
        }
    }
    async createTransferWorkflow(patientId, fromLocationId, toLocationId, transferredBy, transferReason) {
        try {
            const transferId = new mongoose_1.default.Types.ObjectId().toString();
            const transferWorkflow = {
                transferId,
                patientId,
                fromLocationId,
                toLocationId,
                transferredBy,
                transferReason,
                status: 'pending',
                createdAt: new Date(),
                steps: [
                    {
                        step: 'initiated',
                        completedAt: new Date(),
                        completedBy: transferredBy
                    }
                ]
            };
            await Patient_1.default.findByIdAndUpdate(patientId, {
                $set: {
                    'metadata.transferWorkflow': transferWorkflow
                }
            });
            logger_1.default.info(`Transfer workflow created: ${transferId} for patient ${patientId}`);
            return {
                transferId,
                status: 'pending'
            };
        }
        catch (error) {
            logger_1.default.error('Error creating transfer workflow:', error);
            throw error;
        }
    }
    async completePatientTransfer(patientId, transferId, completedBy) {
        try {
            const patient = await Patient_1.default.findById(patientId);
            if (!patient) {
                throw new Error('Patient not found');
            }
            const transferWorkflow = patient.metadata?.transferWorkflow;
            if (!transferWorkflow || transferWorkflow.transferId !== transferId) {
                throw new Error('Transfer workflow not found');
            }
            await Patient_1.default.findByIdAndUpdate(patientId, {
                locationId: transferWorkflow.toLocationId,
                $set: {
                    'metadata.transferWorkflow.status': 'completed',
                    'metadata.transferWorkflow.completedAt': new Date(),
                    'metadata.transferWorkflow.completedBy': completedBy
                },
                $push: {
                    'metadata.transferWorkflow.steps': {
                        step: 'completed',
                        completedAt: new Date(),
                        completedBy: completedBy
                    }
                }
            });
            logger_1.default.info(`Patient transfer completed: ${transferId} for patient ${patientId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error completing patient transfer:', error);
            throw error;
        }
    }
    async getLocationAccessSummary(workspaceId, workspace) {
        try {
            const totalPatients = await Patient_1.default.countDocuments({
                workspaceId,
                isDeleted: { $ne: true }
            });
            const directlyAssigned = await Patient_1.default.countDocuments({
                workspaceId,
                isDeleted: { $ne: true },
                locationId: { $exists: true, $ne: null }
            });
            const sharedPatients = await Patient_1.default.countDocuments({
                workspaceId,
                isDeleted: { $ne: true },
                'metadata.sharedAccess': { $exists: true }
            });
            const workspaceShared = await Patient_1.default.countDocuments({
                workspaceId,
                isDeleted: { $ne: true },
                $or: [
                    { locationId: { $exists: false } },
                    { locationId: null }
                ]
            });
            const locationBreakdown = [];
            if (workspace.locations) {
                for (const location of workspace.locations) {
                    const directPatients = await Patient_1.default.countDocuments({
                        workspaceId,
                        isDeleted: { $ne: true },
                        locationId: location.id
                    });
                    const accessiblePatients = await Patient_1.default.countDocuments({
                        workspaceId,
                        isDeleted: { $ne: true },
                        $or: [
                            { locationId: location.id },
                            { 'metadata.sharedAccess.sharedWithLocations': location.id },
                            { locationId: { $exists: false } },
                            { locationId: null }
                        ]
                    });
                    locationBreakdown.push({
                        locationId: location.id,
                        locationName: location.name,
                        directPatients,
                        accessiblePatients
                    });
                }
            }
            return {
                totalPatients,
                directlyAssigned,
                sharedPatients,
                workspaceShared,
                locationBreakdown
            };
        }
        catch (error) {
            logger_1.default.error('Error getting location access summary:', error);
            throw error;
        }
    }
    async cleanupExpiredSharedAccess() {
        try {
            const result = await Patient_1.default.updateMany({
                'metadata.sharedAccess.expiresAt': { $lt: new Date() }
            }, {
                $unset: { 'metadata.sharedAccess': 1 }
            });
            logger_1.default.info(`Cleaned up ${result.modifiedCount} expired shared access records`);
            return result.modifiedCount;
        }
        catch (error) {
            logger_1.default.error('Error cleaning up expired shared access:', error);
            throw error;
        }
    }
}
exports.SharedPatientService = SharedPatientService;
exports.default = new SharedPatientService();
//# sourceMappingURL=SharedPatientService.js.map