"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDiagnosticNotes = exports.testAIConnection = exports.checkDrugInteractions = exports.getDiagnosticCase = exports.getDiagnosticHistory = exports.saveDiagnosticDecision = exports.generateDiagnosticAnalysis = void 0;
const express_validator_1 = require("express-validator");
const DiagnosticCase_1 = __importDefault(require("../models/DiagnosticCase"));
const Patient_1 = __importDefault(require("../models/Patient"));
const openRouterService_1 = __importDefault(require("../services/openRouterService"));
const logger_1 = __importDefault(require("../utils/logger"));
const responseHelpers_1 = require("../utils/responseHelpers");
const generateDiagnosticAnalysis = async (req, res) => {
    try {
        logger_1.default.info('Diagnostic analysis request received:', {
            body: req.body,
            userId: req.user?._id,
            contentType: req.headers['content-type']
        });
        const userId = req.user._id;
        const workplaceId = req.user.workplaceId;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            logger_1.default.error('Diagnostic validation failed:', {
                errors: errors.array(),
                body: req.body,
                userId
            });
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        const { patientId, symptoms, labResults, currentMedications, vitalSigns, patientConsent, } = req.body;
        if (!workplaceId) {
            res.status(400).json({
                success: false,
                message: 'User workplace is required for diagnostic analysis',
            });
            return;
        }
        if (!patientConsent?.provided) {
            res.status(400).json({
                success: false,
                message: 'Patient consent is required for AI diagnostic analysis',
            });
            return;
        }
        const patient = await Patient_1.default.findOne({
            _id: patientId,
            workplaceId: workplaceId,
        });
        if (!patient) {
            res.status(404).json({
                success: false,
                message: 'Patient not found or access denied',
            });
            return;
        }
        const diagnosticInput = {
            symptoms,
            labResults,
            currentMedications,
            vitalSigns,
            patientAge: patient.age,
            patientGender: patient.gender,
            allergies: patient.allergies?.map((allergy) => allergy.allergen) ||
                [],
            medicalHistory: patient.conditions?.map((condition) => condition.name) ||
                [],
        };
        logger_1.default.info('Starting AI diagnostic analysis', {
            patientId,
            pharmacistId: userId,
            workplaceId,
            symptomsCount: symptoms.subjective.length + symptoms.objective.length,
        });
        const aiResult = await openRouterService_1.default.generateDiagnosticAnalysis(diagnosticInput);
        const drugInteractions = [];
        if (currentMedications && currentMedications.length > 1) {
            try {
            }
            catch (error) {
                logger_1.default.warn('Drug interaction check failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2);
        const caseId = `DX-${timestamp}-${random}`.toUpperCase();
        const diagnosticCase = new DiagnosticCase_1.default({
            caseId,
            patientId,
            pharmacistId: userId,
            workplaceId,
            symptoms,
            labResults,
            currentMedications,
            vitalSigns,
            aiAnalysis: {
                ...aiResult.analysis,
                processingTime: aiResult.processingTime,
            },
            drugInteractions,
            patientConsent: {
                provided: patientConsent.provided,
                consentDate: new Date(),
                consentMethod: patientConsent.method || 'electronic',
            },
            aiRequestData: {
                model: 'deepseek/deepseek-chat-v3.1:free',
                promptTokens: aiResult.usage.prompt_tokens,
                completionTokens: aiResult.usage.completion_tokens,
                totalTokens: aiResult.usage.total_tokens,
                requestId: aiResult.requestId,
                processingTime: aiResult.processingTime,
            },
            pharmacistDecision: {
                accepted: false,
                modifications: '',
                finalRecommendation: '',
                counselingPoints: [],
                followUpRequired: false,
            },
        });
        await diagnosticCase.save();
        const auditContext = {
            userId,
            userRole: req.user.role,
            workplaceId: workplaceId.toString(),
            isAdmin: req.isAdmin || false,
            isSuperAdmin: req.user.role === 'super_admin',
            canManage: req.canManage || false,
            timestamp: new Date().toISOString(),
        };
        (0, responseHelpers_1.createAuditLog)('AI_DIAGNOSTIC_ANALYSIS', 'DiagnosticCase', diagnosticCase._id.toString(), auditContext);
        logger_1.default.info('AI diagnostic analysis completed', {
            caseId: diagnosticCase.caseId,
            processingTime: aiResult.processingTime,
            confidenceScore: aiResult.analysis.confidenceScore,
        });
        res.status(200).json({
            success: true,
            data: {
                caseId: diagnosticCase.caseId,
                analysis: aiResult.analysis,
                drugInteractions,
                processingTime: aiResult.processingTime,
                tokensUsed: aiResult.usage.total_tokens,
            },
        });
    }
    catch (error) {
        logger_1.default.error('AI diagnostic analysis failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            patientId: req.body.patientId,
            pharmacistId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'AI diagnostic analysis failed',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.generateDiagnosticAnalysis = generateDiagnosticAnalysis;
const saveDiagnosticDecision = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        const { caseId } = req.params;
        const { accepted, modifications, finalRecommendation, counselingPoints, followUpRequired, followUpDate, } = req.body;
        const userId = req.user._id;
        const diagnosticCase = await DiagnosticCase_1.default.findOne({
            caseId,
            pharmacistId: userId,
        });
        if (!diagnosticCase) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic case not found or access denied',
            });
            return;
        }
        diagnosticCase.pharmacistDecision = {
            accepted,
            modifications: modifications || '',
            finalRecommendation,
            counselingPoints: counselingPoints || [],
            followUpRequired: followUpRequired || false,
            followUpDate: followUpRequired && followUpDate ? new Date(followUpDate) : undefined,
        };
        diagnosticCase.status = 'completed';
        diagnosticCase.completedAt = new Date();
        await diagnosticCase.save();
        const auditContext = {
            userId,
            userRole: req.user.role,
            workplaceId: diagnosticCase.workplaceId.toString(),
            isAdmin: req.isAdmin || false,
            isSuperAdmin: req.user.role === 'super_admin',
            canManage: req.canManage || false,
            timestamp: new Date().toISOString(),
        };
        (0, responseHelpers_1.createAuditLog)('DIAGNOSTIC_DECISION_SAVED', 'DiagnosticCase', diagnosticCase._id.toString(), auditContext);
        res.status(200).json({
            success: true,
            data: {
                caseId: diagnosticCase.caseId,
                status: diagnosticCase.status,
                completedAt: diagnosticCase.completedAt,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to save diagnostic decision', {
            error: error instanceof Error ? error.message : 'Unknown error',
            caseId: req.params.caseId,
            pharmacistId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to save diagnostic decision',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.saveDiagnosticDecision = saveDiagnosticDecision;
const getDiagnosticHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user._id;
        const workplaceId = req.user.workplaceId;
        const patient = await Patient_1.default.findOne({
            _id: patientId,
            workplaceId: workplaceId,
        });
        if (!patient) {
            res.status(404).json({
                success: false,
                message: 'Patient not found or access denied',
            });
            return;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const diagnosticCases = await DiagnosticCase_1.default.find({
            patientId,
            workplaceId,
        })
            .populate('pharmacistId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .select('-aiRequestData -pharmacistDecision.modifications');
        const total = await DiagnosticCase_1.default.countDocuments({
            patientId,
            workplaceId,
        });
        res.status(200).json({
            success: true,
            data: {
                cases: diagnosticCases,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / Number(limit)),
                    count: diagnosticCases.length,
                    totalCases: total,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic history', {
            error: error instanceof Error ? error.message : 'Unknown error',
            patientId: req.params.patientId,
            pharmacistId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get diagnostic history',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.getDiagnosticHistory = getDiagnosticHistory;
const getDiagnosticCase = async (req, res) => {
    try {
        const { caseId } = req.params;
        const workplaceId = req.user.workplaceId;
        const diagnosticCase = await DiagnosticCase_1.default.findOne({
            caseId,
            workplaceId,
        })
            .populate('patientId', 'firstName lastName age gender')
            .populate('pharmacistId', 'firstName lastName');
        if (!diagnosticCase) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic case not found or access denied',
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: diagnosticCase,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic case', {
            error: error instanceof Error ? error.message : 'Unknown error',
            caseId: req.params.caseId,
            pharmacistId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get diagnostic case',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.getDiagnosticCase = getDiagnosticCase;
const checkDrugInteractions = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array(),
            });
            return;
        }
        const { medications } = req.body;
        if (!medications || medications.length < 2) {
            res.status(400).json({
                success: false,
                message: 'At least two medications are required for interaction checking',
            });
            return;
        }
        const interactions = [];
        res.status(200).json({
            success: true,
            data: {
                interactions,
                medicationsChecked: medications.length,
                interactionsFound: interactions.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Drug interaction check failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            pharmacistId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Drug interaction check failed',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.checkDrugInteractions = checkDrugInteractions;
const testAIConnection = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: 'Access denied. Super admin required.',
            });
            return;
        }
        const isConnected = await openRouterService_1.default.testConnection();
        res.status(200).json({
            success: true,
            data: {
                connected: isConnected,
                service: 'OpenRouter API',
                model: 'deepseek/deepseek-chat-v3.1:free',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('AI connection test failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            pharmacistId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'AI connection test failed',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.testAIConnection = testAIConnection;
const saveDiagnosticNotes = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { notes } = req.body;
        const userId = req.user.id;
        const workplaceId = req.user.workplaceId;
        if (!notes || typeof notes !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Notes are required and must be a string',
            });
            return;
        }
        const diagnosticCase = await DiagnosticCase_1.default.findOne({
            caseId,
            workplaceId,
        });
        if (!diagnosticCase) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic case not found or access denied',
            });
            return;
        }
        if (!diagnosticCase.pharmacistDecision) {
            diagnosticCase.pharmacistDecision = {
                accepted: false,
                modifications: '',
                finalRecommendation: '',
                counselingPoints: [],
                followUpRequired: false,
            };
        }
        diagnosticCase.pharmacistDecision.notes = notes;
        diagnosticCase.pharmacistDecision.reviewedAt = new Date();
        diagnosticCase.pharmacistDecision.reviewedBy = userId;
        await diagnosticCase.save();
        const auditContext = {
            userId,
            userRole: req.user.role,
            workplaceId: workplaceId.toString(),
            isAdmin: req.isAdmin || false,
            isSuperAdmin: req.user.role === 'super_admin',
            canManage: req.canManage || false,
            timestamp: new Date().toISOString(),
        };
        (0, responseHelpers_1.createAuditLog)('DIAGNOSTIC_NOTES_SAVED', 'DiagnosticCase', diagnosticCase._id.toString(), auditContext);
        res.status(200).json({
            success: true,
            message: 'Notes saved successfully',
            data: {
                caseId: diagnosticCase.caseId,
                notes,
                reviewedAt: diagnosticCase.pharmacistDecision.reviewedAt,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to save diagnostic notes', {
            error: error instanceof Error ? error.message : 'Unknown error',
            caseId: req.params.caseId,
            userId: req.user?.id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to save notes',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.saveDiagnosticNotes = saveDiagnosticNotes;
exports.default = {
    generateDiagnosticAnalysis: exports.generateDiagnosticAnalysis,
    saveDiagnosticDecision: exports.saveDiagnosticDecision,
    getDiagnosticHistory: exports.getDiagnosticHistory,
    getDiagnosticCase: exports.getDiagnosticCase,
    checkDrugInteractions: exports.checkDrugInteractions,
    testAIConnection: exports.testAIConnection,
    saveDiagnosticNotes: exports.saveDiagnosticNotes,
};
//# sourceMappingURL=diagnosticController.js.map