"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateTherapies = exports.checkDrugInteractions = exports.getMTRAuditTrail = exports.getMTROutcomes = exports.getMTRReports = exports.updateMTRFollowUp = exports.createMTRFollowUp = exports.getMTRFollowUps = exports.updateMTRIntervention = exports.createMTRIntervention = exports.getMTRInterventions = exports.deleteMTRProblem = exports.updateMTRProblem = exports.createMTRProblem = exports.getMTRProblems = exports.createPatientMTRSession = exports.getPatientMTRHistory = exports.getMTRProgress = exports.updateMTRStep = exports.deleteMTRSession = exports.updateMTRSession = exports.createMTRSession = exports.getMTRSession = exports.getMTRSessions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MedicationTherapyReview_1 = __importDefault(require("../models/MedicationTherapyReview"));
const MTRIntervention_1 = __importDefault(require("../models/MTRIntervention"));
const MTRFollowUp_1 = __importDefault(require("../models/MTRFollowUp"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const Patient_1 = __importDefault(require("../models/Patient"));
const responseHelpers_1 = require("../utils/responseHelpers");
const auditService_1 = __importDefault(require("../services/auditService"));
exports.getMTRSessions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, status, priority, reviewType, pharmacistId, patientId, sort, } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const query = {};
    if (!context.isAdmin) {
        query.workplaceId = context.workplaceId;
    }
    if (status)
        query.status = status;
    if (priority)
        query.priority = priority;
    if (reviewType)
        query.reviewType = reviewType;
    if (pharmacistId)
        query.pharmacistId = pharmacistId;
    if (patientId)
        query.patientId = patientId;
    const [sessions, total] = await Promise.all([
        MedicationTherapyReview_1.default.find(query)
            .populate('patientId', 'firstName lastName mrn')
            .populate('pharmacistId', 'firstName lastName')
            .sort(sort || '-createdAt')
            .limit(parsedLimit)
            .skip((parsedPage - 1) * parsedLimit)
            .select('-__v')
            .lean(),
        MedicationTherapyReview_1.default.countDocuments(query),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, sessions, total, parsedPage, parsedLimit, `Found ${total} MTR sessions`);
});
exports.getMTRSession = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id)
        .populate('patientId', 'firstName lastName mrn dob phone')
        .populate('pharmacistId', 'firstName lastName')
        .populate('problems')
        .populate('interventions')
        .populate('followUps')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const responseData = {
        session: {
            ...session.toObject(),
            completionPercentage: session.getCompletionPercentage(),
            nextStep: session.getNextStep(),
            canComplete: session.canComplete(),
        },
    };
    (0, responseHelpers_1.sendSuccess)(res, responseData, 'MTR session retrieved successfully');
});
exports.createMTRSession = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { patientId, priority = 'routine', reviewType = 'initial', referralSource, reviewReason, patientConsent = false, confidentialityAgreed = false, } = req.body;
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const reviewNumber = await MedicationTherapyReview_1.default.generateNextReviewNumber(context.workplaceId);
    const session = new MedicationTherapyReview_1.default({
        workplaceId: context.workplaceId,
        patientId,
        pharmacistId: context.userId,
        reviewNumber,
        priority,
        reviewType,
        referralSource,
        reviewReason,
        patientConsent,
        confidentialityAgreed,
        createdBy: context.userId,
        clinicalOutcomes: {
            problemsResolved: 0,
            medicationsOptimized: 0,
            adherenceImproved: false,
            adverseEventsReduced: false,
        },
    });
    await session.save();
    session.markStepComplete('patientSelection', {
        patientId,
        selectedAt: new Date(),
    });
    await session.save();
    await auditService_1.default.logMTRActivity(auditService_1.default.createAuditContext(req), 'CREATE_MTR_SESSION', session);
    (0, responseHelpers_1.sendSuccess)(res, {
        session: {
            ...session.toObject(),
            completionPercentage: session.getCompletionPercentage(),
            nextStep: session.getNextStep(),
        },
    }, 'MTR session created successfully', 201);
});
exports.updateMTRSession = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const updates = req.body;
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (session.status === 'completed' && !context.isAdmin) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Cannot update completed MTR session', 403);
    }
    Object.assign(session, updates, {
        updatedBy: context.userId,
        updatedAt: new Date(),
    });
    await session.save();
    await auditService_1.default.logMTRActivity(auditService_1.default.createAuditContext(req), 'UPDATE_MTR_SESSION', session, session.toObject(), { ...session.toObject(), ...updates });
    (0, responseHelpers_1.sendSuccess)(res, {
        session: {
            ...session.toObject(),
            completionPercentage: session.getCompletionPercentage(),
            nextStep: session.getNextStep(),
        },
    }, 'MTR session updated successfully');
});
exports.deleteMTRSession = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (session.status === 'completed' && !context.isAdmin) {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Cannot delete completed MTR session', 403);
    }
    session.isDeleted = true;
    session.updatedBy = context.userId;
    await session.save();
    await auditService_1.default.logMTRActivity(auditService_1.default.createAuditContext(req), 'DELETE_MTR_SESSION', session);
    (0, responseHelpers_1.sendSuccess)(res, null, 'MTR session deleted successfully');
});
exports.updateMTRStep = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id, stepName } = req.params;
    const { completed, data } = req.body;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const validSteps = [
        'patientSelection',
        'medicationHistory',
        'therapyAssessment',
        'planDevelopment',
        'interventions',
        'followUp',
    ];
    if (!stepName || !validSteps.includes(stepName)) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid step name', 400);
    }
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (completed) {
        session.markStepComplete(stepName, data);
    }
    else {
        const steps = session.steps;
        const stepKey = stepName;
        const step = steps[stepKey];
        step.completed = false;
        step.completedAt = undefined;
        if (data !== undefined) {
            step.data = data;
        }
    }
    session.updatedBy = context.userId;
    await session.save();
    (0, responseHelpers_1.sendSuccess)(res, {
        session: {
            ...session.toObject(),
            completionPercentage: session.getCompletionPercentage(),
            nextStep: session.getNextStep(),
        },
    }, `Step ${stepName} updated successfully`);
});
exports.getMTRProgress = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const progress = {
        completionPercentage: session.getCompletionPercentage(),
        nextStep: session.getNextStep(),
        canComplete: session.canComplete(),
        steps: session.steps,
    };
    (0, responseHelpers_1.sendSuccess)(res, progress, 'MTR progress retrieved successfully');
});
exports.getPatientMTRHistory = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const [sessions, total] = await Promise.all([
        MedicationTherapyReview_1.default.find({ patientId })
            .populate('pharmacistId', 'firstName lastName')
            .sort('-createdAt')
            .limit(parsedLimit)
            .skip((parsedPage - 1) * parsedLimit)
            .select('-medications -plan -__v')
            .lean(),
        MedicationTherapyReview_1.default.countDocuments({ patientId }),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, sessions, total, parsedPage, parsedLimit, `Found ${total} MTR sessions for patient`);
});
exports.createPatientMTRSession = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const activeSession = await MedicationTherapyReview_1.default.findOne({
        patientId,
        status: { $in: ['in_progress', 'on_hold'] },
    });
    if (activeSession) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Patient already has an active MTR session', 409, { activeSessionId: activeSession._id });
    }
    const sessionData = {
        ...req.body,
        patientId,
        patientConsent: req.body.patientConsent || false,
        confidentialityAgreed: req.body.confidentialityAgreed || false,
    };
    const { priority = 'routine', reviewType = 'initial', referralSource, reviewReason, patientConsent = false, confidentialityAgreed = false, } = sessionData;
    const reviewNumber = await MedicationTherapyReview_1.default.generateNextReviewNumber(context.workplaceId);
    const session = new MedicationTherapyReview_1.default({
        workplaceId: context.workplaceId,
        patientId,
        pharmacistId: context.userId,
        reviewNumber,
        priority,
        reviewType,
        referralSource,
        reviewReason,
        patientConsent,
        confidentialityAgreed,
        createdBy: context.userId,
        clinicalOutcomes: {
            problemsResolved: 0,
            medicationsOptimized: 0,
            adherenceImproved: false,
            adverseEventsReduced: false,
        },
    });
    await session.save();
    session.markStepComplete('patientSelection', {
        patientId,
        selectedAt: new Date(),
    });
    await session.save();
    (0, responseHelpers_1.sendSuccess)(res, {
        session: {
            ...session.toObject(),
            completionPercentage: session.getCompletionPercentage(),
            nextStep: session.getNextStep(),
        },
    }, 'MTR session created successfully', 201);
});
exports.getMTRProblems = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const problems = await DrugTherapyProblem_1.default.find({ reviewId: id })
        .populate('identifiedBy', 'firstName lastName')
        .populate('resolution.resolvedBy', 'firstName lastName')
        .sort({ severity: 1, identifiedAt: -1 });
    (0, responseHelpers_1.sendSuccess)(res, { problems }, `Found ${problems.length} problems for MTR session`);
});
exports.createMTRProblem = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const problem = new DrugTherapyProblem_1.default({
        ...req.body,
        workplaceId: context.workplaceId,
        patientId: session.patientId,
        reviewId: id,
        identifiedBy: context.userId,
        createdBy: context.userId,
    });
    await problem.save();
    session.problems.push(problem._id);
    session.updatedBy = context.userId;
    await session.save();
    console.log('MTR problem created:', (0, responseHelpers_1.createAuditLog)('CREATE_MTR_PROBLEM', 'DrugTherapyProblem', problem._id.toString(), context, { reviewId: id, type: problem.type }));
    (0, responseHelpers_1.sendSuccess)(res, { problem }, 'Problem added to MTR session successfully', 201);
});
exports.updateMTRProblem = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id, problemId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const problem = await DrugTherapyProblem_1.default.findById(problemId);
    (0, responseHelpers_1.ensureResourceExists)(problem, 'Problem', problemId);
    if (problem.reviewId?.toString() !== id) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Problem does not belong to this MTR session', 400);
    }
    Object.assign(problem, req.body, {
        updatedBy: context.userId,
    });
    await problem.save();
    (0, responseHelpers_1.sendSuccess)(res, { problem }, 'Problem updated successfully');
});
exports.deleteMTRProblem = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id, problemId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const problem = await DrugTherapyProblem_1.default.findById(problemId);
    (0, responseHelpers_1.ensureResourceExists)(problem, 'Problem', problemId);
    if (problem.reviewId?.toString() !== id) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Problem does not belong to this MTR session', 400);
    }
    problem.isDeleted = true;
    problem.updatedBy = context.userId;
    await problem.save();
    session.problems = session.problems.filter((p) => p.toString() !== problemId);
    session.updatedBy = context.userId;
    await session.save();
    (0, responseHelpers_1.sendSuccess)(res, null, 'Problem deleted successfully');
});
exports.getMTRInterventions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const interventions = await MTRIntervention_1.default.find({ reviewId: id })
        .populate('pharmacistId', 'firstName lastName')
        .sort({ priority: 1, performedAt: -1 });
    (0, responseHelpers_1.sendSuccess)(res, { interventions }, `Found ${interventions.length} interventions for MTR session`);
});
exports.createMTRIntervention = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const intervention = new MTRIntervention_1.default({
        ...req.body,
        workplaceId: context.workplaceId,
        reviewId: id,
        patientId: session.patientId,
        pharmacistId: context.userId,
        createdBy: context.userId,
    });
    await intervention.save();
    session.interventions.push(intervention._id);
    session.updatedBy = context.userId;
    await session.save();
    console.log('MTR intervention created:', (0, responseHelpers_1.createAuditLog)('CREATE_MTR_INTERVENTION', 'MTRIntervention', intervention._id.toString(), context, { reviewId: id, type: intervention.type }));
    (0, responseHelpers_1.sendSuccess)(res, { intervention }, 'Intervention recorded successfully', 201);
});
exports.updateMTRIntervention = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id, interventionId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const intervention = await MTRIntervention_1.default.findById(interventionId);
    (0, responseHelpers_1.ensureResourceExists)(intervention, 'Intervention', interventionId);
    if (intervention.reviewId.toString() !== id) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Intervention does not belong to this MTR session', 400);
    }
    Object.assign(intervention, req.body, {
        updatedBy: context.userId,
    });
    await intervention.save();
    (0, responseHelpers_1.sendSuccess)(res, { intervention }, 'Intervention updated successfully');
});
exports.getMTRFollowUps = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const followUps = await MTRFollowUp_1.default.find({ reviewId: id })
        .populate('assignedTo', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .sort({ scheduledDate: 1 });
    (0, responseHelpers_1.sendSuccess)(res, { followUps }, `Found ${followUps.length} follow-ups for MTR session`);
});
exports.createMTRFollowUp = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const followUp = new MTRFollowUp_1.default({
        ...req.body,
        workplaceId: context.workplaceId,
        reviewId: id,
        patientId: session.patientId,
        assignedTo: req.body.assignedTo || context.userId,
        createdBy: context.userId,
    });
    await followUp.save();
    session.followUps.push(followUp._id);
    session.updatedBy = context.userId;
    await session.save();
    console.log('MTR follow-up created:', (0, responseHelpers_1.createAuditLog)('CREATE_MTR_FOLLOWUP', 'MTRFollowUp', followUp._id.toString(), context, { reviewId: id, type: followUp.type }));
    (0, responseHelpers_1.sendSuccess)(res, { followUp }, 'Follow-up scheduled successfully', 201);
});
exports.updateMTRFollowUp = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id, followupId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const session = await MedicationTherapyReview_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(session, 'MTR Session', id);
    (0, responseHelpers_1.checkTenantAccess)(session.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const followUp = await MTRFollowUp_1.default.findById(followupId);
    (0, responseHelpers_1.ensureResourceExists)(followUp, 'Follow-up', followupId);
    if (followUp.reviewId.toString() !== id) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Follow-up does not belong to this MTR session', 400);
    }
    Object.assign(followUp, req.body, {
        updatedBy: context.userId,
    });
    await followUp.save();
    (0, responseHelpers_1.sendSuccess)(res, { followUp }, 'Follow-up updated successfully');
});
exports.getMTRReports = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, pharmacistId } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate),
    } : undefined;
    const matchCriteria = {};
    if (!context.isAdmin) {
        matchCriteria.workplaceId = context.workplaceId;
    }
    if (pharmacistId) {
        matchCriteria.pharmacistId = new mongoose_1.default.Types.ObjectId(pharmacistId);
    }
    if (dateRange) {
        matchCriteria.createdAt = {
            $gte: dateRange.start,
            $lte: dateRange.end,
        };
    }
    const pipeline = [
        { $match: matchCriteria },
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                completedSessions: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                inProgressSessions: {
                    $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
                },
                avgCompletionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ['$status', 'completed'] },
                            {
                                $divide: [
                                    { $subtract: ['$completedAt', '$startedAt'] },
                                    1000 * 60 * 60 * 24,
                                ],
                            },
                            null,
                        ],
                    },
                },
                sessionsByType: {
                    $push: {
                        reviewType: '$reviewType',
                        status: '$status',
                        priority: '$priority',
                    },
                },
            },
        },
    ];
    const [stats] = await MedicationTherapyReview_1.default.aggregate(pipeline);
    const summary = stats || {
        totalSessions: 0,
        completedSessions: 0,
        inProgressSessions: 0,
        avgCompletionTime: 0,
        sessionsByType: [],
    };
    (0, responseHelpers_1.sendSuccess)(res, { summary }, 'MTR summary report generated successfully');
});
exports.getMTROutcomes = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const dateRange = startDate && endDate ? {
        start: new Date(startDate),
        end: new Date(endDate),
    } : undefined;
    const matchCriteria = { status: 'completed' };
    if (!context.isAdmin) {
        matchCriteria.workplaceId = context.workplaceId;
    }
    if (dateRange) {
        matchCriteria.completedAt = {
            $gte: dateRange.start,
            $lte: dateRange.end,
        };
    }
    const pipeline = [
        { $match: matchCriteria },
        {
            $group: {
                _id: null,
                totalCompletedSessions: { $sum: 1 },
                totalProblemsResolved: { $sum: '$clinicalOutcomes.problemsResolved' },
                totalMedicationsOptimized: { $sum: '$clinicalOutcomes.medicationsOptimized' },
                adherenceImprovedCount: {
                    $sum: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] },
                },
                adverseEventsReducedCount: {
                    $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] },
                },
                totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
            },
        },
    ];
    const [outcomes] = await MedicationTherapyReview_1.default.aggregate(pipeline);
    const analytics = outcomes || {
        totalCompletedSessions: 0,
        totalProblemsResolved: 0,
        totalMedicationsOptimized: 0,
        adherenceImprovedCount: 0,
        adverseEventsReducedCount: 0,
        totalCostSavings: 0,
    };
    (0, responseHelpers_1.sendSuccess)(res, { analytics }, 'Outcome analytics generated successfully');
});
exports.getMTRAuditTrail = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, sessionId, userId } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const query = {};
    if (!context.isAdmin) {
        query.workplaceId = context.workplaceId;
    }
    if (sessionId) {
        query._id = sessionId;
    }
    if (userId) {
        query.$or = [
            { createdBy: userId },
            { updatedBy: userId },
            { pharmacistId: userId },
        ];
    }
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }
    const auditTrail = await MedicationTherapyReview_1.default.find(query)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .populate('pharmacistId', 'firstName lastName')
        .select('reviewNumber status createdAt updatedAt createdBy updatedBy pharmacistId')
        .sort('-updatedAt')
        .limit(100);
    (0, responseHelpers_1.sendSuccess)(res, { auditTrail }, `Found ${auditTrail.length} audit trail entries`);
});
exports.checkDrugInteractions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { medications } = req.body;
    if (!medications || !Array.isArray(medications)) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Medications array is required', 400);
    }
    const interactions = [];
    for (let i = 0; i < medications.length; i++) {
        for (let j = i + 1; j < medications.length; j++) {
            const med1 = medications[i];
            const med2 = medications[j];
            if ((med1.drugName.toLowerCase().includes('warfarin') &&
                med2.drugName.toLowerCase().includes('aspirin')) ||
                (med1.drugName.toLowerCase().includes('digoxin') &&
                    med2.drugName.toLowerCase().includes('furosemide'))) {
                interactions.push({
                    medication1: med1.drugName,
                    medication2: med2.drugName,
                    severity: 'major',
                    description: `Potential interaction between ${med1.drugName} and ${med2.drugName}`,
                    clinicalSignificance: 'Monitor patient closely for adverse effects',
                    recommendation: 'Consider alternative therapy or adjust dosing',
                });
            }
        }
    }
    (0, responseHelpers_1.sendSuccess)(res, { interactions, checkedMedications: medications.length }, `Checked ${medications.length} medications for interactions`);
});
exports.checkDuplicateTherapies = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { medications } = req.body;
    if (!medications || !Array.isArray(medications)) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Medications array is required', 400);
    }
    const duplicates = [];
    const therapeuticClasses = {};
    medications.forEach((med, index) => {
        const drugName = med.drugName.toLowerCase();
        let therapeuticClass = 'other';
        if (drugName.includes('metformin') || drugName.includes('glipizide')) {
            therapeuticClass = 'antidiabetic';
        }
        else if (drugName.includes('lisinopril') || drugName.includes('amlodipine')) {
            therapeuticClass = 'antihypertensive';
        }
        else if (drugName.includes('atorvastatin') || drugName.includes('simvastatin')) {
            therapeuticClass = 'statin';
        }
        if (!therapeuticClasses[therapeuticClass]) {
            therapeuticClasses[therapeuticClass] = [];
        }
        therapeuticClasses[therapeuticClass].push(med.drugName);
    });
    Object.entries(therapeuticClasses).forEach(([className, meds]) => {
        if (meds.length > 1 && className !== 'other') {
            duplicates.push({
                therapeuticClass: className,
                medications: meds,
                severity: 'moderate',
                description: `Multiple medications in ${className} class`,
                recommendation: 'Review for therapeutic duplication',
            });
        }
    });
    (0, responseHelpers_1.sendSuccess)(res, { duplicates, checkedMedications: medications.length }, `Checked ${medications.length} medications for duplicates`);
});
//# sourceMappingURL=mtrController.js.map