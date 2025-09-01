"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationFilterService = void 0;
const Patient_1 = __importDefault(require("../models/Patient"));
const Visit_1 = __importDefault(require("../models/Visit"));
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
const logger_1 = __importDefault(require("../utils/logger"));
class LocationFilterService {
    buildLocationFilter(options) {
        const filter = {
            workspaceId: options.workspaceId,
            isDeleted: { $ne: true }
        };
        if (options.locationId) {
            if (options.includeShared) {
                filter.$or = [
                    { locationId: options.locationId },
                    { locationId: { $exists: false } },
                    { locationId: null }
                ];
            }
            else {
                filter.locationId = options.locationId;
            }
        }
        else if (options.userLocationAccess && options.userLocationAccess.length > 0) {
            if (options.includeShared) {
                filter.$or = [
                    { locationId: { $in: options.userLocationAccess } },
                    { locationId: { $exists: false } },
                    { locationId: null }
                ];
            }
            else {
                filter.locationId = { $in: options.userLocationAccess };
            }
        }
        else if (!options.includeShared) {
            filter.locationId = { $exists: true, $ne: null };
        }
        return filter;
    }
    async getPatientsForLocation(options) {
        try {
            const filter = this.buildLocationFilter(options);
            const patients = await Patient_1.default.find(filter)
                .select('_id firstName lastName mrn locationId createdAt')
                .sort({ createdAt: -1 })
                .lean();
            return patients;
        }
        catch (error) {
            logger_1.default.error('Error getting patients for location:', error);
            throw error;
        }
    }
    async getVisitsForLocation(options) {
        try {
            const filter = this.buildLocationFilter(options);
            const visits = await Visit_1.default.find(filter)
                .select('_id patientId date soap locationId createdAt')
                .populate('patientId', 'firstName lastName mrn')
                .sort({ createdAt: -1 })
                .lean();
            return visits;
        }
        catch (error) {
            logger_1.default.error('Error getting visits for location:', error);
            throw error;
        }
    }
    async getClinicalNotesForLocation(options) {
        try {
            const filter = this.buildLocationFilter(options);
            const clinicalNotes = await ClinicalNote_1.default.find(filter)
                .select('_id patient pharmacist type title locationId createdAt')
                .populate('patient', 'firstName lastName mrn')
                .populate('pharmacist', 'firstName lastName')
                .sort({ createdAt: -1 })
                .lean();
            return clinicalNotes;
        }
        catch (error) {
            logger_1.default.error('Error getting clinical notes for location:', error);
            throw error;
        }
    }
    async getLocationAnalytics(workspaceId, locationId, locationName) {
        try {
            const filter = {
                workspaceId,
                locationId,
                isDeleted: { $ne: true }
            };
            const totalPatients = await Patient_1.default.countDocuments(filter);
            const visitFilter = { workspaceId, locationId };
            const totalVisits = await Visit_1.default.countDocuments(visitFilter);
            const clinicalNotesFilter = { workspaceId, locationId };
            const totalClinicalNotes = await ClinicalNote_1.default.countDocuments(clinicalNotesFilter);
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const newPatientsThisMonth = await Patient_1.default.countDocuments({
                ...filter,
                createdAt: { $gte: startOfMonth }
            });
            const visitsThisMonth = await Visit_1.default.countDocuments({
                ...visitFilter,
                createdAt: { $gte: startOfMonth }
            });
            const clinicalNotesThisMonth = await ClinicalNote_1.default.countDocuments({
                ...clinicalNotesFilter,
                createdAt: { $gte: startOfMonth }
            });
            const lastPatient = await Patient_1.default.findOne(filter)
                .sort({ createdAt: -1 })
                .select('createdAt')
                .lean();
            const lastVisit = await Visit_1.default.findOne(visitFilter)
                .sort({ createdAt: -1 })
                .select('createdAt')
                .lean();
            const lastClinicalNote = await ClinicalNote_1.default.findOne(clinicalNotesFilter)
                .sort({ createdAt: -1 })
                .select('createdAt')
                .lean();
            const activities = [
                lastPatient?.createdAt,
                lastVisit?.createdAt,
                lastClinicalNote?.createdAt
            ].filter(Boolean);
            const lastActivity = activities.length > 0
                ? new Date(Math.max(...activities.map(date => date.getTime())))
                : null;
            return {
                locationId,
                locationName,
                statistics: {
                    totalPatients,
                    activePatients: totalPatients,
                    newPatientsThisMonth,
                    totalVisits,
                    totalClinicalNotes,
                    visitsThisMonth,
                    clinicalNotesThisMonth,
                    lastActivity
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error getting location analytics:', error);
            throw error;
        }
    }
    async getWorkspaceLocationAnalytics(workspace) {
        try {
            const analytics = [];
            if (!workspace.locations || workspace.locations.length === 0) {
                return analytics;
            }
            for (const location of workspace.locations) {
                const locationAnalytics = await this.getLocationAnalytics(workspace._id, location.id, location.name);
                analytics.push(locationAnalytics);
            }
            return analytics;
        }
        catch (error) {
            logger_1.default.error('Error getting workspace location analytics:', error);
            throw error;
        }
    }
    async assignPatientToLocation(patientId, locationId, workspaceId) {
        try {
            const result = await Patient_1.default.findOneAndUpdate({
                _id: patientId,
                workspaceId,
                isDeleted: { $ne: true }
            }, { locationId }, { new: true });
            if (!result) {
                throw new Error('Patient not found or access denied');
            }
            logger_1.default.info(`Patient ${patientId} assigned to location ${locationId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error assigning patient to location:', error);
            throw error;
        }
    }
    async bulkAssignPatientsToLocation(patientIds, locationId, workspaceId) {
        try {
            const result = await Patient_1.default.updateMany({
                _id: { $in: patientIds },
                workspaceId,
                isDeleted: { $ne: true }
            }, { locationId });
            logger_1.default.info(`Bulk assigned ${result.modifiedCount} patients to location ${locationId}`);
            return {
                success: result.modifiedCount,
                failed: patientIds.length - result.modifiedCount
            };
        }
        catch (error) {
            logger_1.default.error('Error bulk assigning patients to location:', error);
            throw error;
        }
    }
    async removeLocationAssignment(patientIds, workspaceId) {
        try {
            const result = await Patient_1.default.updateMany({
                _id: { $in: patientIds },
                workspaceId,
                isDeleted: { $ne: true }
            }, { $unset: { locationId: 1 } });
            logger_1.default.info(`Removed location assignment from ${result.modifiedCount} patients`);
            return {
                success: result.modifiedCount,
                failed: patientIds.length - result.modifiedCount
            };
        }
        catch (error) {
            logger_1.default.error('Error removing location assignment:', error);
            throw error;
        }
    }
    async transferPatientsBetweenLocations(patientIds, fromLocationId, toLocationId, workspaceId) {
        try {
            const result = await Patient_1.default.updateMany({
                _id: { $in: patientIds },
                workspaceId,
                locationId: fromLocationId,
                isDeleted: { $ne: true }
            }, { locationId: toLocationId });
            logger_1.default.info(`Transferred ${result.modifiedCount} patients from ${fromLocationId} to ${toLocationId}`);
            return {
                success: result.modifiedCount,
                failed: patientIds.length - result.modifiedCount
            };
        }
        catch (error) {
            logger_1.default.error('Error transferring patients between locations:', error);
            throw error;
        }
    }
    async assignVisitToLocation(visitId, locationId, workspaceId) {
        try {
            const result = await Visit_1.default.findOneAndUpdate({
                _id: visitId,
                workspaceId,
                isDeleted: { $ne: true }
            }, { locationId }, { new: true });
            if (!result) {
                throw new Error('Visit not found or access denied');
            }
            logger_1.default.info(`Visit ${visitId} assigned to location ${locationId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error assigning visit to location:', error);
            throw error;
        }
    }
    async assignClinicalNoteToLocation(clinicalNoteId, locationId, workspaceId) {
        try {
            const result = await ClinicalNote_1.default.findOneAndUpdate({
                _id: clinicalNoteId,
                workspaceId
            }, { locationId }, { new: true });
            if (!result) {
                throw new Error('Clinical note not found or access denied');
            }
            logger_1.default.info(`Clinical note ${clinicalNoteId} assigned to location ${locationId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error assigning clinical note to location:', error);
            throw error;
        }
    }
    async getSharedPatients(workspaceId) {
        try {
            const filter = {
                workspaceId,
                isDeleted: { $ne: true },
                $or: [
                    { locationId: { $exists: false } },
                    { locationId: null }
                ]
            };
            const patients = await Patient_1.default.find(filter)
                .select('_id firstName lastName mrn createdAt')
                .sort({ createdAt: -1 })
                .lean();
            return patients;
        }
        catch (error) {
            logger_1.default.error('Error getting shared patients:', error);
            throw error;
        }
    }
    validateLocationAccess(requestedLocationId, userLocationAccess, allowSharedAccess = true) {
        if (!requestedLocationId) {
            return allowSharedAccess;
        }
        return userLocationAccess.includes(requestedLocationId);
    }
    async getLocationDistributionSummary(workspaceId) {
        try {
            const totalPatients = await Patient_1.default.countDocuments({
                workspaceId,
                isDeleted: { $ne: true }
            });
            const distribution = await Patient_1.default.aggregate([
                {
                    $match: {
                        workspaceId,
                        isDeleted: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: '$locationId',
                        count: { $sum: 1 }
                    }
                }
            ]);
            const locationDistribution = distribution
                .filter(item => item._id)
                .map(item => ({
                locationId: item._id,
                count: item.count,
                percentage: totalPatients > 0 ? Math.round((item.count / totalPatients) * 100) : 0
            }));
            const sharedPatients = distribution.find(item => !item._id)?.count || 0;
            return {
                totalPatients,
                locationDistribution,
                sharedPatients
            };
        }
        catch (error) {
            logger_1.default.error('Error getting location distribution summary:', error);
            throw error;
        }
    }
}
exports.LocationFilterService = LocationFilterService;
exports.default = new LocationFilterService();
//# sourceMappingURL=LocationFilterService.js.map