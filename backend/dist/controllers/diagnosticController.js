"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareDiagnosticHistories = exports.generateReferralDocument = exports.exportDiagnosticHistoryPDF = exports.getDiagnosticReferrals = exports.getAllDiagnosticCases = exports.getDiagnosticAnalytics = exports.addDiagnosticHistoryNote = exports.getPatientDiagnosticHistory = exports.saveDiagnosticNotes = exports.debugDatabaseCounts = exports.testAIConnection = exports.checkDrugInteractions = exports.getDiagnosticCase = exports.getDiagnosticHistory = exports.saveDiagnosticDecision = exports.generateDiagnosticAnalysis = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const DiagnosticCase_1 = __importDefault(require("../models/DiagnosticCase"));
const DiagnosticHistory_1 = __importDefault(require("../models/DiagnosticHistory"));
const Patient_1 = __importDefault(require("../models/Patient"));
const openRouterService_1 = __importDefault(require("../services/openRouterService"));
const logger_1 = __importDefault(require("../utils/logger"));
const responseHelpers_1 = require("../utils/responseHelpers");
const aiAnalysisHelpers_1 = require("../utils/aiAnalysisHelpers");
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
        const cleanedAnalysis = (0, aiAnalysisHelpers_1.cleanAIAnalysis)({
            ...aiResult.analysis,
            processingTime: aiResult.processingTime,
        });
        const validation = (0, aiAnalysisHelpers_1.validateAIAnalysis)(cleanedAnalysis);
        if (!validation.isValid) {
            logger_1.default.warn('AI analysis validation failed', {
                errors: validation.errors,
                patientId,
                pharmacistId: userId,
            });
        }
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
            aiAnalysis: cleanedAnalysis,
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
            status: 'pending_review',
        });
        await diagnosticCase.save();
        const diagnosticHistory = new DiagnosticHistory_1.default({
            patientId,
            caseId: diagnosticCase.caseId,
            diagnosticCaseId: diagnosticCase._id,
            pharmacistId: userId,
            workplaceId,
            analysisSnapshot: cleanedAnalysis,
            clinicalContext: {
                symptoms,
                vitalSigns,
                currentMedications,
                labResults,
            },
            notes: [],
            followUp: {
                required: false,
                completed: false,
            },
            exports: [],
            auditTrail: {
                viewedBy: [userId],
                lastViewed: new Date(),
                modifiedBy: [userId],
                lastModified: new Date(),
                accessLog: [
                    {
                        userId,
                        action: 'view',
                        timestamp: new Date(),
                        ipAddress: req.ip,
                    },
                ],
            },
            status: 'active',
        });
        if (cleanedAnalysis.referralRecommendation?.recommended) {
            diagnosticHistory.referral = {
                generated: true,
                generatedAt: new Date(),
                specialty: cleanedAnalysis.referralRecommendation.specialty || 'general_medicine',
                urgency: cleanedAnalysis.referralRecommendation.urgency || 'routine',
                status: 'pending',
            };
        }
        await diagnosticHistory.save();
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
            confidenceScore: cleanedAnalysis.confidenceScore,
            summary: (0, aiAnalysisHelpers_1.generateAnalysisSummary)(cleanedAnalysis),
        });
        res.status(200).json({
            success: true,
            data: {
                caseId: diagnosticCase.caseId,
                analysis: cleanedAnalysis,
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
const debugDatabaseCounts = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'development') {
            res.status(404).json({
                success: false,
                message: 'Endpoint not available in production',
            });
            return;
        }
        const workplaceId = req.user.workplaceId;
        const diagnosticCasesCount = await DiagnosticCase_1.default.countDocuments({ workplaceId });
        const diagnosticHistoryCount = await DiagnosticHistory_1.default.countDocuments({ workplaceId });
        const activeHistoryCount = await DiagnosticHistory_1.default.countDocuments({
            workplaceId,
            status: 'active'
        });
        const sampleCase = await DiagnosticCase_1.default.findOne({ workplaceId }).select('caseId status createdAt');
        const sampleHistory = await DiagnosticHistory_1.default.findOne({ workplaceId }).select('caseId status createdAt');
        res.status(200).json({
            success: true,
            data: {
                counts: {
                    diagnosticCases: diagnosticCasesCount,
                    diagnosticHistory: diagnosticHistoryCount,
                    activeHistory: activeHistoryCount,
                },
                samples: {
                    case: sampleCase,
                    history: sampleHistory,
                },
                workplaceId: workplaceId.toString(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Debug database counts failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Debug failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
exports.debugDatabaseCounts = debugDatabaseCounts;
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
const getPatientDiagnosticHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { page = 1, limit = 10, includeArchived = false } = req.query;
        const workplaceId = req.user.workplaceId;
        const userId = req.user._id;
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
        const statusFilter = includeArchived === 'true'
            ? { status: { $in: ['active', 'archived'] } }
            : { status: 'active' };
        const history = await DiagnosticHistory_1.default.find({
            patientId,
            workplaceId,
            ...statusFilter,
        })
            .populate('pharmacistId', 'firstName lastName')
            .populate('notes.addedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const total = await DiagnosticHistory_1.default.countDocuments({
            patientId,
            workplaceId,
            ...statusFilter,
        });
        await DiagnosticHistory_1.default.updateMany({ patientId, workplaceId, ...statusFilter }, {
            $addToSet: { 'auditTrail.viewedBy': userId },
            $set: { 'auditTrail.lastViewed': new Date() },
            $push: {
                'auditTrail.accessLog': {
                    userId,
                    action: 'view',
                    timestamp: new Date(),
                    ipAddress: req.ip,
                },
            },
        });
        res.status(200).json({
            success: true,
            data: {
                history,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / Number(limit)),
                    count: history.length,
                    totalRecords: total,
                },
                patient: {
                    id: patient._id,
                    name: `${patient.firstName} ${patient.lastName}`,
                    age: patient.age,
                    gender: patient.gender,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get patient diagnostic history', {
            error: error instanceof Error ? error.message : 'Unknown error',
            patientId: req.params.patientId,
            userId: req.user?._id,
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
exports.getPatientDiagnosticHistory = getPatientDiagnosticHistory;
const addDiagnosticHistoryNote = async (req, res) => {
    try {
        const { historyId } = req.params;
        const { content, type = 'general' } = req.body;
        const userId = req.user._id;
        const workplaceId = req.user.workplaceId;
        if (!content || typeof content !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Note content is required',
            });
            return;
        }
        const history = await DiagnosticHistory_1.default.findOne({
            _id: historyId,
            workplaceId,
            status: 'active',
        });
        if (!history) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic history not found or access denied',
            });
            return;
        }
        history.notes.push({
            content,
            addedBy: userId,
            addedAt: new Date(),
            type,
        });
        history.auditTrail.modifiedBy.push(userId);
        history.auditTrail.lastModified = new Date();
        history.auditTrail.accessLog.push({
            userId,
            action: 'edit',
            timestamp: new Date(),
            ipAddress: req.ip,
        });
        await history.save();
        const lastNote = history.notes[history.notes.length - 1];
        res.status(200).json({
            success: true,
            message: 'Note added successfully',
            data: {
                noteId: lastNote._id?.toString() || 'generated',
                addedAt: lastNote.addedAt,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to add diagnostic history note', {
            error: error instanceof Error ? error.message : 'Unknown error',
            historyId: req.params.historyId,
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to add note',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.addDiagnosticHistoryNote = addDiagnosticHistoryNote;
const getDiagnosticAnalytics = async (req, res) => {
    try {
        const { dateFrom, dateTo, patientId } = req.query;
        const workplaceId = req.user.workplaceId;
        const dateFilter = {};
        if (dateFrom) {
            dateFilter.$gte = new Date(dateFrom);
        }
        if (dateTo) {
            dateFilter.$lte = new Date(dateTo);
        }
        const matchFilter = {
            workplaceId,
        };
        if (Object.keys(dateFilter).length > 0) {
            matchFilter.createdAt = dateFilter;
        }
        if (patientId) {
            matchFilter.patientId = new mongoose_1.default.Types.ObjectId(patientId);
        }
        let analytics = [];
        let topDiagnoses = [];
        let completionTrends = [];
        const historyCount = await DiagnosticHistory_1.default.countDocuments({
            ...matchFilter,
            status: 'active',
        });
        if (historyCount > 0) {
            const historyMatchFilter = { ...matchFilter, status: 'active' };
            analytics = await DiagnosticHistory_1.default.aggregate([
                { $match: historyMatchFilter },
                {
                    $group: {
                        _id: null,
                        totalCases: { $sum: 1 },
                        averageConfidence: { $avg: '$analysisSnapshot.confidenceScore' },
                        averageProcessingTime: { $avg: '$analysisSnapshot.processingTime' },
                        completedCases: {
                            $sum: {
                                $cond: [{ $eq: ['$followUp.completed', true] }, 1, 0],
                            },
                        },
                        pendingFollowUps: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $eq: ['$followUp.required', true] },
                                            { $eq: ['$followUp.completed', false] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                        referralsGenerated: {
                            $sum: {
                                $cond: [{ $eq: ['$referral.generated', true] }, 1, 0],
                            },
                        },
                    },
                },
            ]);
            topDiagnoses = await DiagnosticHistory_1.default.aggregate([
                { $match: historyMatchFilter },
                { $unwind: '$analysisSnapshot.differentialDiagnoses' },
                {
                    $group: {
                        _id: '$analysisSnapshot.differentialDiagnoses.condition',
                        count: { $sum: 1 },
                        averageConfidence: {
                            $avg: '$analysisSnapshot.differentialDiagnoses.probability',
                        },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        condition: '$_id',
                        count: 1,
                        averageConfidence: { $round: ['$averageConfidence', 2] },
                        _id: 0,
                    },
                },
            ]);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            completionTrends = await DiagnosticHistory_1.default.aggregate([
                {
                    $match: {
                        ...historyMatchFilter,
                        createdAt: { $gte: thirtyDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        casesCreated: { $sum: 1 },
                        casesCompleted: {
                            $sum: {
                                $cond: [{ $eq: ['$followUp.completed', true] }, 1, 0],
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]);
        }
        else {
            logger_1.default.info('No DiagnosticHistory records found, using DiagnosticCase data for analytics');
            analytics = await DiagnosticCase_1.default.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: null,
                        totalCases: { $sum: 1 },
                        averageConfidence: { $avg: '$aiAnalysis.confidenceScore' },
                        averageProcessingTime: { $avg: '$aiRequestData.processingTime' },
                        completedCases: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                            },
                        },
                        pendingFollowUps: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$pharmacistDecision.followUpRequired', true] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        referralsGenerated: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$aiAnalysis.referralRecommendation.recommended', true] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);
            topDiagnoses = await DiagnosticCase_1.default.aggregate([
                { $match: matchFilter },
                { $unwind: '$aiAnalysis.differentialDiagnoses' },
                {
                    $group: {
                        _id: '$aiAnalysis.differentialDiagnoses.condition',
                        count: { $sum: 1 },
                        averageConfidence: {
                            $avg: '$aiAnalysis.differentialDiagnoses.probability',
                        },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $project: {
                        condition: '$_id',
                        count: 1,
                        averageConfidence: { $round: ['$averageConfidence', 2] },
                        _id: 0,
                    },
                },
            ]);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            completionTrends = await DiagnosticCase_1.default.aggregate([
                {
                    $match: {
                        ...matchFilter,
                        createdAt: { $gte: thirtyDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                        },
                        casesCreated: { $sum: 1 },
                        casesCompleted: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]);
        }
        const result = {
            summary: analytics[0] || {
                totalCases: 0,
                averageConfidence: 0,
                averageProcessingTime: 0,
                completedCases: 0,
                pendingFollowUps: 0,
                referralsGenerated: 0,
            },
            topDiagnoses: topDiagnoses || [],
            completionTrends: completionTrends || [],
            dateRange: {
                from: dateFrom || null,
                to: dateTo || null,
            },
        };
        logger_1.default.info('Diagnostic analytics generated', {
            historyRecords: historyCount,
            totalCases: result.summary.totalCases,
            topDiagnosesCount: result.topDiagnoses.length,
            trendsCount: result.completionTrends.length,
        });
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic analytics', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get analytics',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.getDiagnosticAnalytics = getDiagnosticAnalytics;
const getAllDiagnosticCases = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, patientId, search, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
        const workplaceId = req.user.workplaceId;
        const skip = (Number(page) - 1) * Number(limit);
        const filter = { workplaceId };
        if (status) {
            filter.status = status;
        }
        if (patientId) {
            filter.patientId = patientId;
        }
        let searchFilter = {};
        if (search) {
            searchFilter = {
                $or: [
                    { caseId: { $regex: search, $options: 'i' } },
                    { 'symptoms.subjective': { $regex: search, $options: 'i' } },
                    { 'symptoms.objective': { $regex: search, $options: 'i' } },
                ],
            };
        }
        const finalFilter = { ...filter, ...searchFilter };
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const cases = await DiagnosticCase_1.default.find(finalFilter)
            .populate('patientId', 'firstName lastName age gender')
            .populate('pharmacistId', 'firstName lastName')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .select('-aiRequestData');
        const total = await DiagnosticCase_1.default.countDocuments(finalFilter);
        res.status(200).json({
            success: true,
            data: {
                cases,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / Number(limit)),
                    count: cases.length,
                    totalCases: total,
                },
                filters: {
                    status,
                    patientId,
                    search,
                    sortBy,
                    sortOrder,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get all diagnostic cases', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get diagnostic cases',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.getAllDiagnosticCases = getAllDiagnosticCases;
const getDiagnosticReferrals = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, specialty } = req.query;
        const workplaceId = req.user.workplaceId;
        const skip = (Number(page) - 1) * Number(limit);
        const filter = {
            workplaceId,
            'referral.generated': true,
            status: 'active',
        };
        if (status) {
            filter['referral.status'] = status;
        }
        if (specialty) {
            filter['referral.specialty'] = { $regex: specialty, $options: 'i' };
        }
        const referrals = await DiagnosticHistory_1.default.find(filter)
            .populate('patientId', 'firstName lastName age gender')
            .populate('pharmacistId', 'firstName lastName')
            .sort({ 'referral.generatedAt': -1 })
            .skip(skip)
            .limit(Number(limit))
            .select('patientId pharmacistId caseId referral analysisSnapshot.referralRecommendation createdAt');
        const total = await DiagnosticHistory_1.default.countDocuments(filter);
        const stats = await DiagnosticHistory_1.default.aggregate([
            { $match: { workplaceId, 'referral.generated': true, status: 'active' } },
            {
                $group: {
                    _id: '$referral.status',
                    count: { $sum: 1 },
                },
            },
        ]);
        const referralStats = {
            pending: 0,
            sent: 0,
            acknowledged: 0,
            completed: 0,
        };
        stats.forEach((stat) => {
            if (stat._id in referralStats) {
                referralStats[stat._id] = stat.count;
            }
        });
        res.status(200).json({
            success: true,
            data: {
                referrals,
                pagination: {
                    current: Number(page),
                    total: Math.ceil(total / Number(limit)),
                    count: referrals.length,
                    totalReferrals: total,
                },
                statistics: referralStats,
                filters: {
                    status,
                    specialty,
                },
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to get diagnostic referrals', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to get referrals',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.getDiagnosticReferrals = getDiagnosticReferrals;
const exportDiagnosticHistoryPDF = async (req, res) => {
    try {
        const { historyId } = req.params;
        const { purpose = 'patient_record' } = req.query;
        const workplaceId = req.user.workplaceId;
        const userId = req.user._id;
        const history = await DiagnosticHistory_1.default.findOne({
            _id: historyId,
            workplaceId,
            status: 'active',
        })
            .populate('patientId', 'firstName lastName age gender dateOfBirth')
            .populate('pharmacistId', 'firstName lastName');
        if (!history) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic history not found or access denied',
            });
            return;
        }
        history.auditTrail.accessLog.push({
            userId,
            action: 'export',
            timestamp: new Date(),
            ipAddress: req.ip,
        });
        history.exports.push({
            exportedBy: userId,
            exportedAt: new Date(),
            format: 'pdf',
            purpose: purpose,
        });
        await history.save();
        res.status(200).json({
            success: true,
            message: 'PDF export functionality will be implemented with a PDF generation library',
            data: {
                historyId,
                purpose,
                exportedAt: new Date(),
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to export diagnostic history as PDF', {
            error: error instanceof Error ? error.message : 'Unknown error',
            historyId: req.params.historyId,
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to export PDF',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.exportDiagnosticHistoryPDF = exportDiagnosticHistoryPDF;
const generateReferralDocument = async (req, res) => {
    try {
        const { historyId } = req.params;
        const workplaceId = req.user.workplaceId;
        const userId = req.user._id;
        const history = await DiagnosticHistory_1.default.findOne({
            _id: historyId,
            workplaceId,
            status: 'active',
        })
            .populate('patientId', 'firstName lastName age gender dateOfBirth')
            .populate('pharmacistId', 'firstName lastName');
        if (!history) {
            res.status(404).json({
                success: false,
                message: 'Diagnostic history not found or access denied',
            });
            return;
        }
        if (!history.analysisSnapshot.referralRecommendation?.recommended) {
            res.status(400).json({
                success: false,
                message: 'No referral recommendation found for this case',
            });
            return;
        }
        if (!history.referral) {
            history.referral = {
                generated: true,
                generatedAt: new Date(),
                specialty: history.analysisSnapshot.referralRecommendation.specialty,
                urgency: history.analysisSnapshot.referralRecommendation.urgency,
                status: 'pending',
            };
        }
        const referralId = `REF-${Date.now().toString(36).toUpperCase()}`;
        history.auditTrail.accessLog.push({
            userId,
            action: 'referral_generated',
            timestamp: new Date(),
            ipAddress: req.ip,
        });
        await history.save();
        res.status(200).json({
            success: true,
            message: 'Referral document generated successfully',
            data: {
                referralId,
                documentUrl: `/api/diagnostics/referrals/${referralId}/document`,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to generate referral document', {
            error: error instanceof Error ? error.message : 'Unknown error',
            historyId: req.params.historyId,
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to generate referral document',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.generateReferralDocument = generateReferralDocument;
const compareDiagnosticHistories = async (req, res) => {
    try {
        const { historyId1, historyId2 } = req.body;
        const workplaceId = req.user.workplaceId;
        if (!historyId1 || !historyId2) {
            res.status(400).json({
                success: false,
                message: 'Two history IDs are required for comparison',
            });
            return;
        }
        const [history1, history2] = await Promise.all([
            DiagnosticHistory_1.default.findOne({
                _id: historyId1,
                workplaceId,
                status: 'active',
            }),
            DiagnosticHistory_1.default.findOne({
                _id: historyId2,
                workplaceId,
                status: 'active',
            }),
        ]);
        if (!history1 || !history2) {
            res.status(404).json({
                success: false,
                message: 'One or both diagnostic histories not found',
            });
            return;
        }
        if (history1.patientId.toString() !== history2.patientId.toString()) {
            res.status(400).json({
                success: false,
                message: 'Cannot compare histories from different patients',
            });
            return;
        }
        const comparison = {
            diagnosisChanges: [],
            confidenceChange: history2.analysisSnapshot.confidenceScore - history1.analysisSnapshot.confidenceScore,
            newSymptoms: [],
            resolvedSymptoms: [],
            medicationChanges: [],
            improvementScore: 0,
        };
        const oldDiagnoses = history1.analysisSnapshot.differentialDiagnoses.map(d => d.condition);
        const newDiagnoses = history2.analysisSnapshot.differentialDiagnoses.map(d => d.condition);
        comparison.diagnosisChanges = [
            ...newDiagnoses.filter(d => !oldDiagnoses.includes(d)).map(d => `Added: ${d}`),
            ...oldDiagnoses.filter(d => !newDiagnoses.includes(d)).map(d => `Removed: ${d}`),
        ];
        const oldSymptoms = [...history1.clinicalContext.symptoms.subjective, ...history1.clinicalContext.symptoms.objective];
        const newSymptoms = [...history2.clinicalContext.symptoms.subjective, ...history2.clinicalContext.symptoms.objective];
        comparison.newSymptoms = newSymptoms.filter(s => !oldSymptoms.includes(s));
        comparison.resolvedSymptoms = oldSymptoms.filter(s => !newSymptoms.includes(s));
        const oldMeds = history1.clinicalContext.currentMedications?.map(m => m.name) || [];
        const newMeds = history2.clinicalContext.currentMedications?.map(m => m.name) || [];
        comparison.medicationChanges = [
            ...newMeds.filter(m => !oldMeds.includes(m)).map(m => `Added: ${m}`),
            ...oldMeds.filter(m => !newMeds.includes(m)).map(m => `Discontinued: ${m}`),
        ];
        comparison.improvementScore = Math.round((comparison.confidenceChange * 0.4) +
            (comparison.resolvedSymptoms.length * 10) -
            (comparison.newSymptoms.length * 5));
        const recommendations = [];
        if (comparison.confidenceChange > 10) {
            recommendations.push('Diagnostic confidence has improved significantly');
        }
        if (comparison.resolvedSymptoms.length > 0) {
            recommendations.push('Patient shows symptom improvement');
        }
        if (comparison.newSymptoms.length > 0) {
            recommendations.push('Monitor new symptoms closely');
        }
        if (comparison.medicationChanges.length > 0) {
            recommendations.push('Review medication changes and their effects');
        }
        res.status(200).json({
            success: true,
            data: {
                comparison,
                recommendations,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Failed to compare diagnostic histories', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Failed to compare histories',
            error: process.env.NODE_ENV === 'development'
                ? error instanceof Error
                    ? error.message
                    : 'Unknown error'
                : 'Internal server error',
        });
    }
};
exports.compareDiagnosticHistories = compareDiagnosticHistories;
//# sourceMappingURL=diagnosticController.js.map