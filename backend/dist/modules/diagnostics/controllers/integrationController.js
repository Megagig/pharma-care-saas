"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntegrationOptions = exports.crossReferenceWithExistingRecords = exports.getUnifiedPatientTimeline = exports.createMTRFromDiagnostic = exports.addDiagnosticDataToMTR = exports.createClinicalNoteFromDiagnostic = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const integrationService_1 = __importDefault(require("../services/integrationService"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const createClinicalNoteFromDiagnostic = async (req, res) => {
    try {
        const { diagnosticRequestId, diagnosticResultId, patientId } = req.body;
        const { noteData } = req.body;
        if (!diagnosticRequestId || !patientId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'diagnosticRequestId and patientId are required',
                },
            });
            return;
        }
        if (!(0, responseHelpers_1.validateObjectId)(diagnosticRequestId) || !(0, responseHelpers_1.validateObjectId)(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid ObjectId format',
                },
            });
            return;
        }
        if (diagnosticResultId && !(0, responseHelpers_1.validateObjectId)(diagnosticResultId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid diagnosticResultId format',
                },
            });
            return;
        }
        const integrationData = {
            diagnosticRequestId: new mongoose_1.default.Types.ObjectId(diagnosticRequestId),
            diagnosticResultId: diagnosticResultId ? new mongoose_1.default.Types.ObjectId(diagnosticResultId) : undefined,
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            pharmacistId: new mongoose_1.default.Types.ObjectId(req.user._id),
            workplaceId: new mongoose_1.default.Types.ObjectId(req.user.workplaceId),
            locationId: req.user.locationId,
        };
        const clinicalNote = await integrationService_1.default.createClinicalNoteFromDiagnostic(integrationData, noteData);
        res.status(201).json({
            success: true,
            data: {
                clinicalNote,
                message: 'Clinical note created successfully from diagnostic results',
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error creating clinical note from diagnostic', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            body: req.body,
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'CLINICAL_NOTE_CREATION_FAILED',
                message: error instanceof Error ? error.message : 'Failed to create clinical note',
            },
        });
    }
};
exports.createClinicalNoteFromDiagnostic = createClinicalNoteFromDiagnostic;
const addDiagnosticDataToMTR = async (req, res) => {
    try {
        const { mtrId } = req.params;
        const { diagnosticRequestId, diagnosticResultId, patientId } = req.body;
        if (!mtrId || !diagnosticRequestId || !patientId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'mtrId, diagnosticRequestId, and patientId are required',
                },
            });
            return;
        }
        if (!(0, responseHelpers_1.validateObjectId)(mtrId) || !(0, responseHelpers_1.validateObjectId)(diagnosticRequestId) || !(0, responseHelpers_1.validateObjectId)(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid ObjectId format',
                },
            });
            return;
        }
        if (diagnosticResultId && !(0, responseHelpers_1.validateObjectId)(diagnosticResultId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid diagnosticResultId format',
                },
            });
            return;
        }
        const integrationData = {
            diagnosticRequestId: new mongoose_1.default.Types.ObjectId(diagnosticRequestId),
            diagnosticResultId: diagnosticResultId ? new mongoose_1.default.Types.ObjectId(diagnosticResultId) : undefined,
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            pharmacistId: new mongoose_1.default.Types.ObjectId(req.user._id),
            workplaceId: new mongoose_1.default.Types.ObjectId(req.user.workplaceId),
            locationId: req.user.locationId,
        };
        const mtr = await integrationService_1.default.addDiagnosticDataToMTR(new mongoose_1.default.Types.ObjectId(mtrId), integrationData);
        res.status(200).json({
            success: true,
            data: {
                mtr,
                message: 'MTR enriched successfully with diagnostic data',
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error adding diagnostic data to MTR', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            mtrId: req.params.mtrId,
            body: req.body,
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'MTR_ENRICHMENT_FAILED',
                message: error instanceof Error ? error.message : 'Failed to add diagnostic data to MTR',
            },
        });
    }
};
exports.addDiagnosticDataToMTR = addDiagnosticDataToMTR;
const createMTRFromDiagnostic = async (req, res) => {
    try {
        const { diagnosticRequestId, diagnosticResultId, patientId } = req.body;
        const { mtrData } = req.body;
        if (!diagnosticRequestId || !patientId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'diagnosticRequestId and patientId are required',
                },
            });
            return;
        }
        if (!(0, responseHelpers_1.validateObjectId)(diagnosticRequestId) || !(0, responseHelpers_1.validateObjectId)(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid ObjectId format',
                },
            });
            return;
        }
        if (diagnosticResultId && !(0, responseHelpers_1.validateObjectId)(diagnosticResultId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid diagnosticResultId format',
                },
            });
            return;
        }
        const integrationData = {
            diagnosticRequestId: new mongoose_1.default.Types.ObjectId(diagnosticRequestId),
            diagnosticResultId: diagnosticResultId ? new mongoose_1.default.Types.ObjectId(diagnosticResultId) : undefined,
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            pharmacistId: new mongoose_1.default.Types.ObjectId(req.user._id),
            workplaceId: new mongoose_1.default.Types.ObjectId(req.user.workplaceId),
            locationId: req.user.locationId,
        };
        const mtr = await integrationService_1.default.createMTRFromDiagnostic(integrationData, mtrData);
        res.status(201).json({
            success: true,
            data: {
                mtr,
                message: 'MTR created successfully from diagnostic results',
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error creating MTR from diagnostic', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            body: req.body,
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'MTR_CREATION_FAILED',
                message: error instanceof Error ? error.message : 'Failed to create MTR from diagnostic',
            },
        });
    }
};
exports.createMTRFromDiagnostic = createMTRFromDiagnostic;
const getUnifiedPatientTimeline = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { startDate, endDate, limit } = req.query;
        if (!patientId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'patientId is required',
                },
            });
            return;
        }
        if (!(0, responseHelpers_1.validateObjectId)(patientId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid patientId format',
                },
            });
            return;
        }
        const options = {};
        if (startDate) {
            options.startDate = new Date(startDate);
        }
        if (endDate) {
            options.endDate = new Date(endDate);
        }
        if (limit) {
            options.limit = parseInt(limit, 10);
        }
        const timeline = await integrationService_1.default.getUnifiedPatientTimeline(new mongoose_1.default.Types.ObjectId(patientId), new mongoose_1.default.Types.ObjectId(req.user.workplaceId), options);
        res.status(200).json({
            success: true,
            data: {
                timeline,
                count: timeline.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error getting unified patient timeline', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            patientId: req.params.patientId,
            query: req.query,
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'TIMELINE_RETRIEVAL_FAILED',
                message: error instanceof Error ? error.message : 'Failed to retrieve patient timeline',
            },
        });
    }
};
exports.getUnifiedPatientTimeline = getUnifiedPatientTimeline;
const crossReferenceWithExistingRecords = async (req, res) => {
    try {
        const { diagnosticRequestId } = req.params;
        if (!diagnosticRequestId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'diagnosticRequestId is required',
                },
            });
            return;
        }
        if (!(0, responseHelpers_1.validateObjectId)(diagnosticRequestId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid diagnosticRequestId format',
                },
            });
            return;
        }
        const crossReference = await integrationService_1.default.crossReferenceWithExistingRecords(new mongoose_1.default.Types.ObjectId(diagnosticRequestId));
        res.status(200).json({
            success: true,
            data: crossReference,
        });
    }
    catch (error) {
        logger_1.default.error('Error cross-referencing diagnostic data', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            diagnosticRequestId: req.params.diagnosticRequestId,
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'CROSS_REFERENCE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to cross-reference diagnostic data',
            },
        });
    }
};
exports.crossReferenceWithExistingRecords = crossReferenceWithExistingRecords;
const getIntegrationOptions = async (req, res) => {
    try {
        const { diagnosticRequestId } = req.params;
        if (!(0, responseHelpers_1.validateObjectId)(diagnosticRequestId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_OBJECT_ID',
                    message: 'Invalid diagnosticRequestId format',
                },
            });
            return;
        }
        const crossReference = await integrationService_1.default.crossReferenceWithExistingRecords(new mongoose_1.default.Types.ObjectId(diagnosticRequestId));
        const integrationOptions = {
            canCreateClinicalNote: true,
            canCreateMTR: true,
            existingMTRs: crossReference.relatedMTRs.map(mtr => ({
                id: mtr._id,
                reviewNumber: mtr.reviewNumber,
                status: mtr.status,
                priority: mtr.priority,
                canEnrich: mtr.status === 'in_progress',
            })),
            correlations: crossReference.correlations,
            recommendations: [
                ...(crossReference.correlations.some(c => c.type === 'medication_match')
                    ? ['Consider enriching existing MTR with diagnostic findings']
                    : []),
                ...(crossReference.correlations.some(c => c.type === 'symptom_match')
                    ? ['Review previous clinical notes for symptom progression']
                    : []),
                'Create comprehensive clinical note documenting diagnostic assessment',
                ...(crossReference.relatedMTRs.length === 0
                    ? ['Consider initiating MTR based on diagnostic findings']
                    : []),
            ],
        };
        res.status(200).json({
            success: true,
            data: integrationOptions,
        });
    }
    catch (error) {
        logger_1.default.error('Error getting integration options', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
            diagnosticRequestId: req.params.diagnosticRequestId,
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTEGRATION_OPTIONS_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get integration options',
            },
        });
    }
};
exports.getIntegrationOptions = getIntegrationOptions;
//# sourceMappingURL=integrationController.js.map