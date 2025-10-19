"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestNotification = exports.updatePatientMedicationSettings = exports.getPatientMedicationSettings = exports.getRecentPatientsWithMedications = exports.getMedicationAdherenceTrends = exports.getMedicationDashboardStats = exports.checkInteractions = exports.getAdherenceLogs = exports.logAdherence = exports.archiveMedication = exports.updateMedication = exports.getMedicationById = exports.getMedicationsByPatient = exports.createMedication = void 0;
const MedicationManagement_1 = __importDefault(require("../models/MedicationManagement"));
const AdherenceLog_1 = __importDefault(require("../models/AdherenceLog"));
const Patient_1 = __importDefault(require("../models/Patient"));
const MedicationSettings_1 = __importDefault(require("../models/MedicationSettings"));
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const checkPatientExists = async (patientId) => {
    try {
        const patient = await Patient_1.default.findById(patientId);
        return !!patient;
    }
    catch (error) {
        return false;
    }
};
const createMedication = async (req, res) => {
    try {
        const { patientId } = req.body;
        const patientExists = await checkPatientExists(patientId);
        if (!patientExists) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const workplaceId = req.user?.workplaceId;
        const medication = new MedicationManagement_1.default({
            ...req.body,
            workplaceId,
            createdBy: req.user?._id,
            updatedBy: req.user?._id,
        });
        const savedMedication = await medication.save();
        res.status(201).json({
            success: true,
            data: savedMedication,
        });
        return;
    }
    catch (error) {
        logger_1.default.error('Error creating medication:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating medication',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
    }
};
exports.createMedication = createMedication;
const getMedicationsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { status = 'active' } = req.query;
        let statusFilter = {};
        if (status !== 'all') {
            statusFilter = { status };
        }
        const patientExists = await checkPatientExists(patientId);
        if (!patientExists) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const medications = await MedicationManagement_1.default.find({
            patientId,
            workplaceId: req.user?.workplaceId,
            ...statusFilter,
        }).sort({ updatedAt: -1 });
        res.json({
            success: true,
            count: medications.length,
            data: medications,
        });
        return;
    }
    catch (error) {
        logger_1.default.error('Error fetching medications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medications',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
    }
};
exports.getMedicationsByPatient = getMedicationsByPatient;
const getMedicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const medication = await MedicationManagement_1.default.findOne({
            _id: id,
            workplaceId: req.user?.workplaceId,
        });
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }
        res.json({
            success: true,
            data: medication,
        });
        return;
    }
    catch (error) {
        logger_1.default.error('Error fetching medication:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medication',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
    }
};
exports.getMedicationById = getMedicationById;
const updateMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const currentMedication = await MedicationManagement_1.default.findOne({
            _id: id,
            workplaceId: req.user?.workplaceId,
        });
        if (!currentMedication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }
        const historyEntry = {
            name: currentMedication.name,
            dosage: currentMedication.dosage,
            frequency: currentMedication.frequency,
            route: currentMedication.route,
            startDate: currentMedication.startDate,
            endDate: currentMedication.endDate,
            indication: currentMedication.indication,
            prescriber: currentMedication.prescriber,
            status: currentMedication.status,
            updatedAt: new Date(),
            updatedBy: req.user?._id,
            notes: updateData.historyNotes || 'Updated medication',
        };
        const updatedMedication = await MedicationManagement_1.default.findByIdAndUpdate(id, {
            ...updateData,
            updatedBy: req.user?._id,
            $push: { history: historyEntry },
        }, { new: true, runValidators: true });
        res.json({
            success: true,
            data: updatedMedication,
        });
        return;
    }
    catch (error) {
        logger_1.default.error('Error updating medication:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating medication',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
    }
};
exports.updateMedication = updateMedication;
const archiveMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const currentMedication = await MedicationManagement_1.default.findOne({
            _id: id,
            workplaceId: req.user?.workplaceId,
        });
        if (!currentMedication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found',
            });
        }
        const historyEntry = {
            name: currentMedication.name,
            dosage: currentMedication.dosage,
            frequency: currentMedication.frequency,
            route: currentMedication.route,
            startDate: currentMedication.startDate,
            endDate: currentMedication.endDate,
            indication: currentMedication.indication,
            prescriber: currentMedication.prescriber,
            status: currentMedication.status,
            updatedAt: new Date(),
            updatedBy: req.user?._id,
            notes: reason || 'Medication archived',
        };
        const archivedMedication = await MedicationManagement_1.default.findByIdAndUpdate(id, {
            status: 'archived',
            updatedBy: req.user?._id,
            $push: { history: historyEntry },
        }, { new: true });
        res.json({
            success: true,
            data: archivedMedication,
        });
        return;
    }
    catch (error) {
        logger_1.default.error('Error archiving medication:', error);
        res.status(500).json({
            success: false,
            message: 'Error archiving medication',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
    }
};
exports.archiveMedication = archiveMedication;
const logAdherence = async (req, res) => {
    try {
        const { medicationId, patientId, refillDate, adherenceScore, pillCount, notes, } = req.body;
        const medication = await MedicationManagement_1.default.findOne({
            _id: medicationId,
            patientId,
            workplaceId: req.user?.workplaceId,
        });
        if (!medication) {
            return res.status(404).json({
                success: false,
                message: 'Medication not found or does not belong to the patient',
            });
        }
        const adherenceLog = new AdherenceLog_1.default({
            medicationId,
            patientId,
            workplaceId: req.user?.workplaceId,
            refillDate: refillDate || new Date(),
            adherenceScore,
            pillCount,
            notes,
            createdBy: req.user?._id,
            updatedBy: req.user?._id,
        });
        const savedLog = await adherenceLog.save();
        res.status(201).json({
            success: true,
            data: savedLog,
        });
        return;
    }
    catch (error) {
        logger_1.default.error('Error logging adherence:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging adherence',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return;
    }
};
exports.logAdherence = logAdherence;
const getAdherenceLogs = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { startDate, endDate } = req.query;
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                refillDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };
        }
        const adherenceLogs = await AdherenceLog_1.default.find({
            patientId,
            workplaceId: req.user?.workplaceId,
            ...dateFilter,
        })
            .populate('medicationId', 'name dosage frequency')
            .sort({ refillDate: -1 });
        res.json({
            success: true,
            count: adherenceLogs.length,
            data: adherenceLogs,
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching adherence logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching adherence logs',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getAdherenceLogs = getAdherenceLogs;
const checkInteractions = async (req, res) => {
    try {
        const { medications } = req.body;
        const mockInteractions = [
            {
                drugPair: [medications[0]?.name, medications[1]?.name].filter(Boolean),
                severity: 'moderate',
                description: 'These medications may interact. Monitor patient closely.',
            },
        ];
        res.json({
            success: true,
            data: mockInteractions,
        });
    }
    catch (error) {
        logger_1.default.error('Error checking interactions:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking medication interactions',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.checkInteractions = checkInteractions;
const getMedicationDashboardStats = async (req, res) => {
    try {
        const workplaceId = req.user?.workplaceId;
        const activeMedicationsCount = await MedicationManagement_1.default.countDocuments({
            workplaceId,
            status: 'active',
        });
        const adherenceLogs = await AdherenceLog_1.default.find({
            workplaceId,
            refillDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        });
        let averageAdherence = 0;
        if (adherenceLogs.length > 0) {
            const totalAdherence = adherenceLogs.reduce((sum, log) => sum + (log.adherenceScore || 0), 0);
            const validScores = adherenceLogs
                .map((log) => log.adherenceScore)
                .filter((score) => score !== undefined && score !== null);
            const isDecimal = validScores.length > 0 && validScores.every((score) => score <= 1);
            averageAdherence = Math.round(isDecimal
                ? (totalAdherence / adherenceLogs.length) * 100
                : totalAdherence / adherenceLogs.length);
        }
        const medicationsWithMultiplePrescribers = await MedicationManagement_1.default.aggregate([
            {
                $match: {
                    workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                    status: 'active',
                },
            },
            {
                $group: {
                    _id: '$patientId',
                    medications: { $push: '$prescriber' },
                    count: { $sum: 1 },
                },
            },
            { $match: { count: { $gt: 1 } } },
            {
                $addFields: {
                    uniquePrescribers: { $size: { $setUnion: ['$medications'] } },
                },
            },
            { $match: { uniquePrescribers: { $gt: 1 } } },
        ]);
        const interactionsCount = medicationsWithMultiplePrescribers.length;
        res.json({
            success: true,
            data: {
                activeMedications: activeMedicationsCount,
                averageAdherence,
                interactionAlerts: interactionsCount,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting medication dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving medication dashboard statistics',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getMedicationDashboardStats = getMedicationDashboardStats;
const getMedicationAdherenceTrends = async (req, res) => {
    try {
        const workplaceId = req.user?.workplaceId;
        const { period = 'monthly' } = req.query;
        let startDate;
        const now = new Date();
        switch (period) {
            case 'weekly':
                startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
                break;
            case 'quarterly':
                startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
            default:
                startDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
                break;
        }
        const adherenceLogs = await AdherenceLog_1.default.find({
            workplaceId,
            refillDate: { $gte: startDate },
        }).sort({ refillDate: 1 });
        let chartData = [];
        if (period === 'weekly') {
            const weeklyData = {};
            for (const log of adherenceLogs) {
                const date = new Date(log.refillDate);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().substring(0, 10);
                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = [];
                }
                if (log.adherenceScore) {
                    weeklyData[weekKey].push(log.adherenceScore);
                }
            }
            chartData = Object.keys(weeklyData)
                .sort()
                .map((week) => {
                const scores = weeklyData[week] || [];
                const totalScore = scores.reduce((sum, score) => sum + score, 0);
                const validScores = scores.filter((score) => score !== undefined && score !== null);
                const isDecimal = validScores.length > 0 &&
                    validScores.every((score) => score <= 1);
                const averageScore = scores.length
                    ? Math.round(isDecimal
                        ? (totalScore / scores.length) * 100
                        : totalScore / scores.length)
                    : 0;
                const weekDate = new Date(week);
                const weekEnd = new Date(weekDate);
                weekEnd.setDate(weekDate.getDate() + 6);
                const monthName = weekDate.toLocaleString('default', {
                    month: 'short',
                });
                const weekRange = `${monthName} ${weekDate.getDate()}-${weekEnd.getDate()}`;
                return {
                    name: weekRange,
                    adherence: averageScore,
                };
            });
        }
        else if (period === 'quarterly') {
            const quarterlyData = {};
            for (const log of adherenceLogs) {
                const date = new Date(log.refillDate);
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                const year = date.getFullYear();
                const quarterKey = `Q${quarter} ${year}`;
                if (!quarterlyData[quarterKey]) {
                    quarterlyData[quarterKey] = [];
                }
                if (log.adherenceScore) {
                    quarterlyData[quarterKey].push(log.adherenceScore);
                }
            }
            chartData = Object.keys(quarterlyData)
                .sort()
                .map((quarter) => {
                const scores = quarterlyData[quarter] || [];
                const totalScore = scores.reduce((sum, score) => sum + score, 0);
                const validScores = scores.filter((score) => score !== undefined && score !== null);
                const isDecimal = validScores.length > 0 &&
                    validScores.every((score) => score <= 1);
                const averageScore = scores.length
                    ? Math.round(isDecimal
                        ? (totalScore / scores.length) * 100
                        : totalScore / scores.length)
                    : 0;
                return {
                    name: quarter,
                    adherence: averageScore,
                };
            });
        }
        else {
            const monthlyData = {};
            for (const log of adherenceLogs) {
                const date = new Date(log.refillDate);
                const month = date.getMonth();
                const year = date.getFullYear();
                const monthNames = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                ];
                const monthKey = `${monthNames[month]} ${year}`;
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = [];
                }
                if (log.adherenceScore) {
                    monthlyData[monthKey].push(log.adherenceScore);
                }
            }
            chartData = Object.keys(monthlyData)
                .sort((a, b) => {
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                if (yearA !== yearB)
                    return parseInt(yearA || '0') - parseInt(yearB || '0');
                const monthNames = [
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                ];
                return (monthNames.indexOf(monthA || '') - monthNames.indexOf(monthB || ''));
            })
                .map((month) => {
                const scores = monthlyData[month] || [];
                const totalScore = scores.reduce((sum, score) => sum + score, 0);
                const validScores = scores.filter((score) => score !== undefined && score !== null);
                const isDecimal = validScores.length > 0 &&
                    validScores.every((score) => score <= 1);
                const averageScore = scores.length
                    ? Math.round(isDecimal
                        ? (totalScore / scores.length) * 100
                        : totalScore / scores.length)
                    : 0;
                return {
                    name: month,
                    adherence: averageScore,
                };
            });
        }
        if (chartData.length === 0) {
            if (period === 'weekly') {
                chartData = [
                    { name: 'Jul 1-7', adherence: 82 },
                    { name: 'Jul 8-14', adherence: 85 },
                    { name: 'Jul 15-21', adherence: 80 },
                    { name: 'Jul 22-28', adherence: 84 },
                    { name: 'Aug 1-7', adherence: 87 },
                    { name: 'Aug 8-14', adherence: 83 },
                ];
            }
            else if (period === 'quarterly') {
                chartData = [
                    { name: 'Q1 2025', adherence: 78 },
                    { name: 'Q2 2025', adherence: 82 },
                    { name: 'Q3 2025', adherence: 85 },
                    { name: 'Q4 2025', adherence: 84 },
                ];
            }
            else {
                chartData = [
                    { name: 'Apr 2025', adherence: 78 },
                    { name: 'May 2025', adherence: 80 },
                    { name: 'Jun 2025', adherence: 84 },
                    { name: 'Jul 2025', adherence: 82 },
                    { name: 'Aug 2025', adherence: 85 },
                    { name: 'Sep 2025', adherence: 84 },
                ];
            }
        }
        res.json({
            success: true,
            data: chartData,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting medication adherence trends:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving medication adherence trends',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getMedicationAdherenceTrends = getMedicationAdherenceTrends;
const getRecentPatientsWithMedications = async (req, res) => {
    try {
        const workplaceId = req.user?.workplaceId;
        const { limit = 3 } = req.query;
        const recentPatients = await MedicationManagement_1.default.aggregate([
            {
                $match: {
                    workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                    status: 'active',
                },
            },
            {
                $group: {
                    _id: '$patientId',
                    medicationCount: { $sum: 1 },
                    lastUpdate: { $max: '$updatedAt' },
                },
            },
            { $sort: { lastUpdate: -1 } },
            { $limit: parseInt(limit) || 3 },
        ]);
        const patientDetails = await Promise.all(recentPatients.map(async (item) => {
            const patient = await Patient_1.default.findById(item._id).select('firstName lastName');
            if (!patient) {
                return null;
            }
            const lastUpdateDate = new Date(item.lastUpdate);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastUpdateDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            let timeAgo;
            if (diffDays === 0) {
                timeAgo = 'Today';
            }
            else if (diffDays === 1) {
                timeAgo = 'Yesterday';
            }
            else if (diffDays < 7) {
                timeAgo = `${diffDays} days ago`;
            }
            else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                timeAgo = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
            }
            else {
                const months = Math.floor(diffDays / 30);
                timeAgo = `${months} ${months === 1 ? 'month' : 'months'} ago`;
            }
            return {
                id: item._id,
                name: `${patient.firstName} ${patient.lastName}`,
                medicationCount: item.medicationCount,
                lastUpdate: timeAgo,
            };
        }));
        const filteredPatients = patientDetails.filter((p) => p !== null);
        res.json({
            success: true,
            data: filteredPatients,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting recent patients with medications:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving recent patients with medications',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getRecentPatientsWithMedications = getRecentPatientsWithMedications;
const getPatientMedicationSettings = async (req, res) => {
    try {
        const { patientId } = req.params;
        const workplaceId = req.user?.workplaceId;
        if (patientId !== 'system') {
            const patientExists = await checkPatientExists(patientId);
            if (!patientExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
        }
        const query = patientId === 'system'
            ? { patientId: 'system', workplaceId }
            : { patientId, workplaceId };
        let settings = await MedicationSettings_1.default.findOne(query);
        if (!settings) {
            settings = new MedicationSettings_1.default({
                patientId,
                workplaceId,
                createdBy: req.user?._id ? new mongoose_1.default.Types.ObjectId(req.user._id) : undefined,
                updatedBy: req.user?._id ? new mongoose_1.default.Types.ObjectId(req.user._id) : undefined,
            });
            await settings.save();
        }
        res.json({
            success: true,
            data: {
                reminderSettings: settings.reminderSettings,
                monitoringSettings: settings.monitoringSettings,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting patient medication settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving medication settings',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.getPatientMedicationSettings = getPatientMedicationSettings;
const updatePatientMedicationSettings = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { reminderSettings, monitoringSettings } = req.body;
        const workplaceId = req.user?.workplaceId;
        if (patientId !== 'system') {
            const patientExists = await checkPatientExists(patientId);
            if (!patientExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found'
                });
            }
        }
        const query = patientId === 'system'
            ? { patientId: 'system', workplaceId }
            : { patientId, workplaceId };
        let settings = await MedicationSettings_1.default.findOne(query);
        if (!settings) {
            settings = new MedicationSettings_1.default({
                patientId,
                workplaceId,
                createdBy: req.user?._id ? new mongoose_1.default.Types.ObjectId(req.user._id) : undefined,
                updatedBy: req.user?._id ? new mongoose_1.default.Types.ObjectId(req.user._id) : undefined,
            });
        }
        else {
            settings.updatedBy = req.user?._id ? new mongoose_1.default.Types.ObjectId(req.user._id) : undefined;
        }
        if (reminderSettings) {
            settings.reminderSettings = {
                ...settings.reminderSettings,
                ...reminderSettings,
            };
        }
        if (monitoringSettings) {
            settings.monitoringSettings = {
                ...settings.monitoringSettings,
                ...monitoringSettings,
            };
        }
        await settings.save();
        res.json({
            success: true,
            data: {
                reminderSettings: settings.reminderSettings,
                monitoringSettings: settings.monitoringSettings,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error updating patient medication settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating medication settings',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.updatePatientMedicationSettings = updatePatientMedicationSettings;
const sendTestNotification = async (req, res) => {
    try {
        res.json({
            success: false,
            message: 'Test notifications have been removed from this version',
            details: 'Please use the production notification system for testing',
        });
    }
    catch (error) {
        logger_1.default.error('Error in test notification endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Test notification feature is not available',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.sendTestNotification = sendTestNotification;
//# sourceMappingURL=medicationManagementController.js.map