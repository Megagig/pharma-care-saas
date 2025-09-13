"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAlert = exports.acknowledgeAlert = exports.getPatientsWithPoorAdherence = exports.generateAdherenceReport = exports.addIntervention = exports.assessPatientAdherence = exports.updateMedicationAdherence = exports.addRefill = exports.getPatientAdherenceTracking = exports.createAdherenceTracking = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const adherenceService_1 = __importDefault(require("../services/adherenceService"));
const AdherenceTracking_1 = __importDefault(require("../models/AdherenceTracking"));
const createAdherenceTracking = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const trackingData = req.body;
        if (!trackingData.patientId || !trackingData.medications || trackingData.medications.length === 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required fields',
                    details: 'patientId and medications array are required'
                }
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(trackingData.patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid patient ID'
                }
            });
            return;
        }
        if (trackingData.diagnosticRequestId && !mongoose_1.default.Types.ObjectId.isValid(trackingData.diagnosticRequestId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid diagnostic request ID'
                }
            });
            return;
        }
        if (trackingData.diagnosticResultId && !mongoose_1.default.Types.ObjectId.isValid(trackingData.diagnosticResultId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid diagnostic result ID'
                }
            });
            return;
        }
        for (const medication of trackingData.medications) {
            if (!medication.medicationName || !medication.dosage || !medication.frequency || !medication.prescribedDate) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid medication data',
                        details: 'Each medication must have medicationName, dosage, frequency, and prescribedDate'
                    }
                });
                return;
            }
        }
        const adherenceTracking = await adherenceService_1.default.createAdherenceTracking(new mongoose_1.default.Types.ObjectId(workplaceId), trackingData, new mongoose_1.default.Types.ObjectId(userId));
        res.status(201).json({
            success: true,
            data: {
                adherenceTracking
            },
            message: 'Adherence tracking created successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error creating adherence tracking:', error);
        if (error.message.includes('already exists')) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: error.message
                }
            });
            return;
        }
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to create adherence tracking',
                details: error.message
            }
        });
    }
};
exports.createAdherenceTracking = createAdherenceTracking;
const getPatientAdherenceTracking = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { patientId } = req.params;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        const adherenceTracking = await AdherenceTracking_1.default.findByPatient(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId));
        if (!adherenceTracking) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Adherence tracking not found for patient'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: {
                adherenceTracking
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting patient adherence tracking:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get adherence tracking',
                details: error.message
            }
        });
    }
};
exports.getPatientAdherenceTracking = getPatientAdherenceTracking;
const addRefill = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { patientId } = req.params;
        const refillData = req.body;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        if (!refillData.medicationName || !refillData.date || !refillData.daysSupply || !refillData.source) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required refill fields',
                    details: 'medicationName, date, daysSupply, and source are required'
                }
            });
            return;
        }
        if (refillData.daysSupply < 1 || refillData.daysSupply > 365) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid days supply',
                    details: 'Days supply must be between 1 and 365'
                }
            });
            return;
        }
        const validSources = ['pharmacy', 'patient_report', 'system_estimate'];
        if (!validSources.includes(refillData.source)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid source',
                    details: `Source must be one of: ${validSources.join(', ')}`
                }
            });
            return;
        }
        const adherenceTracking = await adherenceService_1.default.addRefill(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId), refillData);
        res.json({
            success: true,
            data: {
                adherenceTracking
            },
            message: 'Refill added successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error adding refill:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to add refill',
                details: error.message
            }
        });
    }
};
exports.addRefill = addRefill;
const updateMedicationAdherence = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { patientId, medicationName } = req.params;
        const adherenceData = req.body;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        if (!medicationName) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Medication name is required'
                }
            });
            return;
        }
        if (adherenceData.adherenceScore !== undefined) {
            if (typeof adherenceData.adherenceScore !== 'number' ||
                adherenceData.adherenceScore < 0 ||
                adherenceData.adherenceScore > 100) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid adherence score',
                        details: 'Adherence score must be a number between 0 and 100'
                    }
                });
                return;
            }
        }
        const adherenceTracking = await adherenceService_1.default.updateMedicationAdherence(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId), decodeURIComponent(medicationName), adherenceData);
        res.json({
            success: true,
            data: {
                adherenceTracking
            },
            message: 'Medication adherence updated successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error updating medication adherence:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update medication adherence',
                details: error.message
            }
        });
    }
};
exports.updateMedicationAdherence = updateMedicationAdherence;
const assessPatientAdherence = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { patientId } = req.params;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        const assessment = await adherenceService_1.default.assessPatientAdherence(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId));
        res.json({
            success: true,
            data: {
                assessment
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error assessing patient adherence:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to assess patient adherence',
                details: error.message
            }
        });
    }
};
exports.assessPatientAdherence = assessPatientAdherence;
const addIntervention = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { patientId } = req.params;
        const intervention = req.body;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        if (!intervention.type || !intervention.description || !intervention.expectedOutcome) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required intervention fields',
                    details: 'type, description, and expectedOutcome are required'
                }
            });
            return;
        }
        const validTypes = ['counseling', 'reminder_system', 'dose_adjustment', 'medication_change', 'follow_up_scheduled'];
        if (!validTypes.includes(intervention.type)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid intervention type',
                    details: `Type must be one of: ${validTypes.join(', ')}`
                }
            });
            return;
        }
        const adherenceTracking = await adherenceService_1.default.addIntervention(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId), {
            ...intervention,
            implementedBy: new mongoose_1.default.Types.ObjectId(userId)
        }, new mongoose_1.default.Types.ObjectId(userId));
        res.json({
            success: true,
            data: {
                adherenceTracking
            },
            message: 'Intervention added successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error adding intervention:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to add intervention',
                details: error.message
            }
        });
    }
};
exports.addIntervention = addIntervention;
const generateAdherenceReport = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { patientId } = req.params;
        const { startDate, endDate } = req.query;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        if (!startDate || !endDate) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Missing required query parameters',
                    details: 'startDate and endDate are required'
                }
            });
            return;
        }
        const reportPeriod = {
            start: new Date(startDate),
            end: new Date(endDate)
        };
        if (reportPeriod.start >= reportPeriod.end) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid date range',
                    details: 'Start date must be before end date'
                }
            });
            return;
        }
        const report = await adherenceService_1.default.generateAdherenceReport(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId), reportPeriod);
        res.json({
            success: true,
            data: {
                report
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error generating adherence report:', error);
        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: error.message
                }
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to generate adherence report',
                details: error.message
            }
        });
    }
};
exports.generateAdherenceReport = generateAdherenceReport;
const getPatientsWithPoorAdherence = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { threshold } = req.query;
        let adherenceThreshold = 70;
        if (threshold) {
            adherenceThreshold = parseInt(threshold);
            if (isNaN(adherenceThreshold) || adherenceThreshold < 0 || adherenceThreshold > 100) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid threshold',
                        details: 'Threshold must be a number between 0 and 100'
                    }
                });
                return;
            }
        }
        const patients = await adherenceService_1.default.getPatientsWithPoorAdherence(new mongoose_1.default.Types.ObjectId(workplaceId), adherenceThreshold);
        res.json({
            success: true,
            data: {
                patients,
                count: patients.length,
                threshold: adherenceThreshold
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error getting patients with poor adherence:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get patients with poor adherence',
                details: error.message
            }
        });
    }
};
exports.getPatientsWithPoorAdherence = getPatientsWithPoorAdherence;
const acknowledgeAlert = async (req, res) => {
    try {
        const { workplaceId, _id: userId } = req.user;
        const { patientId, alertIndex } = req.params;
        const { actionTaken } = req.body;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        const alertIdx = parseInt(alertIndex);
        if (isNaN(alertIdx) || alertIdx < 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid alert index'
                }
            });
            return;
        }
        const adherenceTracking = await AdherenceTracking_1.default.findByPatient(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId));
        if (!adherenceTracking) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Adherence tracking not found for patient'
                }
            });
            return;
        }
        if (alertIdx >= adherenceTracking.alerts.length) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Alert not found'
                }
            });
            return;
        }
        adherenceTracking.acknowledgeAlert(alertIdx, new mongoose_1.default.Types.ObjectId(userId), actionTaken);
        await adherenceTracking.save();
        res.json({
            success: true,
            data: {
                adherenceTracking
            },
            message: 'Alert acknowledged successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to acknowledge alert',
                details: error.message
            }
        });
    }
};
exports.acknowledgeAlert = acknowledgeAlert;
const resolveAlert = async (req, res) => {
    try {
        const { workplaceId } = req.user;
        const { patientId, alertIndex } = req.params;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid or missing patient ID'
                }
            });
            return;
        }
        const alertIdx = parseInt(alertIndex);
        if (isNaN(alertIdx) || alertIdx < 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid alert index'
                }
            });
            return;
        }
        const adherenceTracking = await AdherenceTracking_1.default.findByPatient(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(workplaceId));
        if (!adherenceTracking) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Adherence tracking not found for patient'
                }
            });
            return;
        }
        if (alertIdx >= adherenceTracking.alerts.length) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Alert not found'
                }
            });
            return;
        }
        adherenceTracking.resolveAlert(alertIdx);
        await adherenceTracking.save();
        res.json({
            success: true,
            data: {
                adherenceTracking
            },
            message: 'Alert resolved successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Error resolving alert:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to resolve alert',
                details: error.message
            }
        });
    }
};
exports.resolveAlert = resolveAlert;
//# sourceMappingURL=adherenceController.js.map