"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAuditData = exports.getComplianceReport = exports.getInterventionAuditTrail = exports.syncWithMTR = exports.getInterventionsForMTR = exports.getMTRReference = exports.createInterventionsFromMTR = exports.handleClinicalInterventionError = exports.sendInterventionNotifications = exports.linkToMTR = exports.getStrategyRecommendations = exports.exportInterventionData = exports.exportInterventionsReport = exports.getCostSavingsReport = exports.getOutcomeReports = exports.getInterventionTrends = exports.getInterventionAnalytics = exports.getAssignedInterventions = exports.getPatientInterventions = exports.searchClinicalInterventions = exports.scheduleFollowUp = exports.recordOutcome = exports.updateAssignment = exports.assignTeamMember = exports.updateInterventionStrategy = exports.addInterventionStrategy = exports.deleteClinicalIntervention = exports.updateClinicalIntervention = exports.getClinicalIntervention = exports.createClinicalIntervention = exports.getClinicalInterventions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const clinicalInterventionService_1 = __importDefault(require("../services/clinicalInterventionService"));
const responseHelpers_1 = require("../utils/responseHelpers");
const logger_1 = __importDefault(require("../utils/logger"));
const validateObjectId = (id, fieldName) => {
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)(`Invalid ${fieldName} format`);
    }
    return new mongoose_1.default.Types.ObjectId(id);
};
const getValidatedContext = (req) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!context.userId || !context.workplaceId) {
        throw (0, responseHelpers_1.createValidationError)('Missing user or workplace context');
    }
    return {
        ...context,
        userIdObj: new mongoose_1.default.Types.ObjectId(context.userId),
        workplaceIdObj: new mongoose_1.default.Types.ObjectId(context.workplaceId)
    };
};
exports.getClinicalInterventions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { page = 1, limit = 20, patientId, category, priority, status, identifiedBy, assignedTo, dateFrom, dateTo, search, sortBy = 'identifiedDate', sortOrder = 'desc' } = req.query;
    const filters = {
        workplaceId: context.workplaceIdObj,
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(50, Math.max(1, parseInt(limit) || 20)),
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
    };
    if (patientId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            throw (0, responseHelpers_1.createValidationError)('Invalid patient ID format');
        }
        filters.patientId = new mongoose_1.default.Types.ObjectId(patientId);
    }
    if (category)
        filters.category = category;
    if (priority)
        filters.priority = priority;
    if (status)
        filters.status = status;
    if (search)
        filters.search = search;
    if (identifiedBy) {
        if (!mongoose_1.default.Types.ObjectId.isValid(identifiedBy)) {
            throw (0, responseHelpers_1.createValidationError)('Invalid identifiedBy ID format');
        }
        filters.identifiedBy = new mongoose_1.default.Types.ObjectId(identifiedBy);
    }
    if (assignedTo) {
        if (!mongoose_1.default.Types.ObjectId.isValid(assignedTo)) {
            throw (0, responseHelpers_1.createValidationError)('Invalid assignedTo ID format');
        }
        filters.assignedTo = new mongoose_1.default.Types.ObjectId(assignedTo);
    }
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateFrom format');
        }
        filters.dateFrom = fromDate;
    }
    if (dateTo) {
        const toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateTo format');
        }
        filters.dateTo = toDate;
    }
    const result = await clinicalInterventionService_1.default.getInterventions(filters);
    (0, responseHelpers_1.sendSuccess)(res, {
        interventions: result.data,
        pagination: result.pagination
    }, 'Interventions retrieved successfully');
});
exports.createClinicalIntervention = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { patientId, category, priority, issueDescription, strategies, estimatedDuration, relatedMTRId, relatedDTPIds } = req.body;
    if (!patientId || !category || !priority || !issueDescription) {
        throw (0, responseHelpers_1.createValidationError)('Missing required fields: patientId, category, priority, issueDescription');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(patientId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid patient ID format');
    }
    if (relatedMTRId && !mongoose_1.default.Types.ObjectId.isValid(relatedMTRId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid MTR ID format');
    }
    if (relatedDTPIds && Array.isArray(relatedDTPIds)) {
        for (const dtpId of relatedDTPIds) {
            if (!mongoose_1.default.Types.ObjectId.isValid(dtpId)) {
                throw (0, responseHelpers_1.createValidationError)('Invalid DTP ID format');
            }
        }
    }
    const interventionData = {
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
        category,
        priority,
        issueDescription,
        identifiedBy: context.userIdObj,
        workplaceId: context.workplaceIdObj,
        strategies: strategies || [],
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        relatedMTRId: relatedMTRId ? new mongoose_1.default.Types.ObjectId(relatedMTRId) : undefined,
        relatedDTPIds: relatedDTPIds ? relatedDTPIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) : []
    };
    const intervention = await clinicalInterventionService_1.default.createIntervention(interventionData);
    await clinicalInterventionService_1.default.logInterventionAccess(intervention._id.toString(), context.userIdObj, context.workplaceIdObj, 'create', req, { category: interventionData.category, priority: interventionData.priority });
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Clinical intervention created successfully', 201);
});
exports.getClinicalIntervention = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { id } = req.params;
    const interventionId = validateObjectId(id, 'intervention ID');
    const workplaceId = validateObjectId(context.workplaceId, 'workplace ID');
    const intervention = await clinicalInterventionService_1.default.getInterventionById(interventionId.toString(), workplaceId);
    await clinicalInterventionService_1.default.logActivity('VIEW_INTERVENTION', id || '', new mongoose_1.default.Types.ObjectId(context.userId), new mongoose_1.default.Types.ObjectId(context.workplaceId), {
        interventionNumber: intervention.interventionNumber,
        status: intervention.status,
        category: intervention.category
    }, req);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Intervention retrieved successfully');
});
exports.updateClinicalIntervention = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    const updates = {};
    const { category, priority, issueDescription, status, implementationNotes, estimatedDuration, outcomes, followUp } = req.body;
    if (category !== undefined)
        updates.category = category;
    if (priority !== undefined)
        updates.priority = priority;
    if (issueDescription !== undefined)
        updates.issueDescription = issueDescription;
    if (status !== undefined)
        updates.status = status;
    if (implementationNotes !== undefined)
        updates.implementationNotes = implementationNotes;
    if (estimatedDuration !== undefined)
        updates.estimatedDuration = parseInt(estimatedDuration);
    if (outcomes !== undefined)
        updates.outcomes = outcomes;
    if (followUp !== undefined)
        updates.followUp = followUp;
    if (Object.keys(updates).length === 0) {
        throw (0, responseHelpers_1.createValidationError)('No valid fields provided for update');
    }
    const intervention = await clinicalInterventionService_1.default.updateIntervention(id, updates, context.userIdObj, context.workplaceIdObj);
    await clinicalInterventionService_1.default.logActivity('UPDATE_INTERVENTION', id, context.userIdObj, context.workplaceIdObj, {
        updatedFields: Object.keys(updates),
        statusChange: updates.status ? { to: updates.status } : undefined
    });
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Intervention updated successfully');
});
exports.deleteClinicalIntervention = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    const success = await clinicalInterventionService_1.default.deleteIntervention(id, context.userIdObj, context.workplaceIdObj);
    if (!success) {
        throw (0, responseHelpers_1.createNotFoundError)('Intervention not found or could not be deleted');
    }
    await clinicalInterventionService_1.default.logActivity('DELETE_INTERVENTION', id, context.userIdObj, context.workplaceIdObj, { reason: 'soft_delete' }, req);
    (0, responseHelpers_1.sendSuccess)(res, {
        deleted: true
    }, 'Intervention deleted successfully');
});
exports.addInterventionStrategy = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    const { type, description, rationale, expectedOutcome, priority = 'secondary' } = req.body;
    if (!type || !description || !rationale || !expectedOutcome) {
        throw (0, responseHelpers_1.createValidationError)('Missing required strategy fields: type, description, rationale, expectedOutcome');
    }
    const strategy = {
        type,
        description,
        rationale,
        expectedOutcome,
        priority
    };
    const intervention = await clinicalInterventionService_1.default.addStrategy(id, strategy, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Strategy added successfully');
});
exports.updateInterventionStrategy = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id, strategyId } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    if (!strategyId || !mongoose_1.default.Types.ObjectId.isValid(strategyId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid strategy ID format');
    }
    const { type, description, rationale, expectedOutcome, priority } = req.body;
    const updates = {};
    if (type !== undefined)
        updates.type = type;
    if (description !== undefined)
        updates.description = description;
    if (rationale !== undefined)
        updates.rationale = rationale;
    if (expectedOutcome !== undefined)
        updates.expectedOutcome = expectedOutcome;
    if (priority !== undefined)
        updates.priority = priority;
    if (Object.keys(updates).length === 0) {
        throw (0, responseHelpers_1.createValidationError)('No valid fields provided for strategy update');
    }
    const intervention = await clinicalInterventionService_1.default.updateStrategy(id, strategyId, updates, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Strategy updated successfully');
});
exports.assignTeamMember = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    const { userId, role, task, notes } = req.body;
    if (!userId || !role || !task) {
        throw (0, responseHelpers_1.createValidationError)('Missing required assignment fields: userId, role, task');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid user ID format');
    }
    const assignment = {
        userId: new mongoose_1.default.Types.ObjectId(userId),
        role,
        task,
        status: 'pending',
        notes
    };
    const intervention = await clinicalInterventionService_1.default.assignTeamMember(id, assignment, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Team member assigned successfully');
});
exports.updateAssignment = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id, assignmentId } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    if (!assignmentId || !mongoose_1.default.Types.ObjectId.isValid(assignmentId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid assignment ID format');
    }
    const { status, notes } = req.body;
    if (!status) {
        throw (0, responseHelpers_1.createValidationError)('Status is required for assignment update');
    }
    const intervention = await clinicalInterventionService_1.default.updateAssignmentStatus(id, new mongoose_1.default.Types.ObjectId(assignmentId), status, notes, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Assignment updated successfully');
});
exports.recordOutcome = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    const { patientResponse, clinicalParameters, adverseEffects, additionalIssues, successMetrics } = req.body;
    if (!patientResponse) {
        throw (0, responseHelpers_1.createValidationError)('Patient response is required');
    }
    const outcome = {
        patientResponse,
        clinicalParameters: clinicalParameters || [],
        adverseEffects,
        additionalIssues,
        successMetrics: successMetrics || {}
    };
    const intervention = await clinicalInterventionService_1.default.recordOutcome(id, outcome, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Outcome recorded successfully');
});
exports.scheduleFollowUp = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    const { required, scheduledDate, notes, nextReviewDate } = req.body;
    if (required === undefined) {
        throw (0, responseHelpers_1.createValidationError)('Follow-up required flag must be specified');
    }
    let parsedScheduledDate;
    let parsedNextReviewDate;
    if (scheduledDate) {
        parsedScheduledDate = new Date(scheduledDate);
        if (isNaN(parsedScheduledDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid scheduled date format');
        }
    }
    if (nextReviewDate) {
        parsedNextReviewDate = new Date(nextReviewDate);
        if (isNaN(parsedNextReviewDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid next review date format');
        }
    }
    const followUp = {
        required,
        scheduledDate: parsedScheduledDate,
        notes,
        nextReviewDate: parsedNextReviewDate
    };
    const intervention = await clinicalInterventionService_1.default.scheduleFollowUp(id, followUp, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Follow-up scheduled successfully');
});
exports.searchClinicalInterventions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { q, patientName, interventionNumber, categories, priorities, statuses, assignedUsers, dateRange, outcomeTypes, page = 1, limit = 20, sortBy = 'identifiedDate', sortOrder = 'desc' } = req.query;
    const filters = {
        workplaceId: context.workplaceIdObj,
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(50, Math.max(1, parseInt(limit) || 20)),
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
    };
    if (q) {
        filters.search = q;
    }
    if (categories) {
        const categoryArray = Array.isArray(categories) ? categories : [categories];
        filters.category = categoryArray.length === 1 ? categoryArray[0] : { $in: categoryArray };
    }
    if (priorities) {
        const priorityArray = Array.isArray(priorities) ? priorities : [priorities];
        filters.priority = priorityArray.length === 1 ? priorityArray[0] : { $in: priorityArray };
    }
    if (statuses) {
        const statusArray = Array.isArray(statuses) ? statuses : [statuses];
        filters.status = statusArray.length === 1 ? statusArray[0] : { $in: statusArray };
    }
    if (dateRange) {
        try {
            const range = typeof dateRange === 'string' ? JSON.parse(dateRange) : dateRange;
            if (range.from) {
                filters.dateFrom = new Date(range.from);
            }
            if (range.to) {
                filters.dateTo = new Date(range.to);
            }
        }
        catch (error) {
            throw (0, responseHelpers_1.createValidationError)('Invalid date range format');
        }
    }
    const result = await clinicalInterventionService_1.default.advancedSearch(filters, {
        patientName,
        interventionNumber,
        assignedUsers: assignedUsers ? (Array.isArray(assignedUsers) ? assignedUsers : [assignedUsers]) : undefined,
        outcomeTypes: outcomeTypes ? (Array.isArray(outcomeTypes) ? outcomeTypes : [outcomeTypes]) : undefined
    });
    (0, responseHelpers_1.sendSuccess)(res, {
        interventions: result.data,
        pagination: result.pagination,
        searchCriteria: {
            query: q,
            patientName,
            interventionNumber,
            categories,
            priorities,
            statuses,
            assignedUsers,
            dateRange,
            outcomeTypes
        }
    }, 'Advanced search completed successfully');
});
exports.getPatientInterventions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { patientId } = req.params;
    if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid patient ID format');
    }
    const { page = 1, limit = 20, status, category, sortBy = 'identifiedDate', sortOrder = 'desc' } = req.query;
    const filters = {
        workplaceId: context.workplaceIdObj,
        patientId: new mongoose_1.default.Types.ObjectId(patientId),
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(50, Math.max(1, parseInt(limit) || 20)),
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
    };
    if (status)
        filters.status = status;
    if (category)
        filters.category = category;
    const result = await clinicalInterventionService_1.default.getInterventions(filters);
    const summary = await clinicalInterventionService_1.default.getPatientInterventionSummary(new mongoose_1.default.Types.ObjectId(patientId), context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        interventions: result.data,
        pagination: result.pagination,
        summary
    }, 'Patient interventions retrieved successfully');
});
exports.getAssignedInterventions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { page = 1, limit = 20, status, priority, sortBy = 'identifiedDate', sortOrder = 'desc' } = req.query;
    const filters = {
        workplaceId: context.workplaceIdObj,
        assignedTo: context.userIdObj,
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(50, Math.max(1, parseInt(limit) || 20)),
        sortBy,
        sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
    };
    if (status)
        filters.status = status;
    if (priority)
        filters.priority = priority;
    const result = await clinicalInterventionService_1.default.getUserAssignments(context.userIdObj, context.workplaceIdObj, status ? [status] : undefined);
    const stats = await clinicalInterventionService_1.default.getUserAssignmentStats(context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        interventions: result,
        stats
    }, 'Assigned interventions retrieved successfully');
});
exports.getInterventionAnalytics = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { dateFrom, dateTo, period = 'month' } = req.query;
    let fromDate;
    let toDate;
    if (dateFrom) {
        fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateFrom format');
        }
    }
    if (dateTo) {
        toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateTo format');
        }
    }
    if (!fromDate && !toDate) {
        const now = new Date();
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    const metrics = await clinicalInterventionService_1.default.getDashboardMetrics(context.workplaceIdObj, { from: fromDate, to: toDate });
    (0, responseHelpers_1.sendSuccess)(res, {
        metrics,
        dateRange: {
            from: fromDate,
            to: toDate,
            period
        }
    }, 'Analytics retrieved successfully');
});
exports.getInterventionTrends = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { period = 'month', groupBy = 'category', dateFrom, dateTo } = req.query;
    let fromDate;
    let toDate;
    if (dateFrom && dateTo) {
        fromDate = new Date(dateFrom);
        toDate = new Date(dateTo);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid date format');
        }
    }
    else {
        toDate = new Date();
        fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 6);
    }
    const trends = await clinicalInterventionService_1.default.getTrendAnalysis(context.workplaceIdObj, { from: fromDate, to: toDate, period, groupBy });
    (0, responseHelpers_1.sendSuccess)(res, {
        trends,
        parameters: {
            period,
            groupBy,
            dateRange: { from: fromDate, to: toDate }
        }
    }, 'Trend analysis retrieved successfully');
});
exports.getOutcomeReports = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { dateFrom, dateTo, category, priority, outcome, pharmacist, includeDetails = false } = req.query;
    let fromDate;
    let toDate;
    if (dateFrom) {
        fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateFrom format');
        }
    }
    if (dateTo) {
        toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateTo format');
        }
    }
    const filters = {
        dateFrom: fromDate,
        dateTo: toDate,
        category,
        priority,
        outcome,
        pharmacist
    };
    const report = await clinicalInterventionService_1.default.generateOutcomeReport(context.workplaceIdObj, filters);
    (0, responseHelpers_1.sendSuccess)(res, {
        report
    }, 'Outcome report generated successfully');
});
exports.getCostSavingsReport = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { dateFrom, dateTo, adverseEventCost, hospitalAdmissionCost, medicationWasteCost, pharmacistHourlyCost } = req.query;
    let fromDate;
    let toDate;
    if (dateFrom) {
        fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateFrom format');
        }
    }
    if (dateTo) {
        toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateTo format');
        }
    }
    const query = {
        workplaceId: context.workplaceIdObj,
        isDeleted: { $ne: true },
        status: 'completed'
    };
    if (fromDate || toDate) {
        query.completedAt = {};
        if (fromDate)
            query.completedAt.$gte = fromDate;
        if (toDate)
            query.completedAt.$lte = toDate;
    }
    const interventions = await clinicalInterventionService_1.default.getInterventions({
        workplaceId: context.workplaceIdObj,
        dateFrom: fromDate,
        dateTo: toDate,
        status: 'completed',
        limit: 1000
    });
    const costSavingsParameters = {
        adverseEventCost: adverseEventCost ? parseFloat(adverseEventCost) : undefined,
        hospitalAdmissionCost: hospitalAdmissionCost ? parseFloat(hospitalAdmissionCost) : undefined,
        medicationWasteCost: medicationWasteCost ? parseFloat(medicationWasteCost) : undefined,
        pharmacistHourlyCost: pharmacistHourlyCost ? parseFloat(pharmacistHourlyCost) : undefined
    };
    const costSavings = await clinicalInterventionService_1.default.calculateCostSavings(interventions.data, costSavingsParameters);
    (0, responseHelpers_1.sendSuccess)(res, {
        costSavings,
        parameters: costSavingsParameters,
        interventionCount: interventions.data.length,
        dateRange: { from: fromDate, to: toDate }
    }, 'Cost savings calculated successfully');
});
exports.exportInterventionsReport = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { format = 'excel', dateFrom, dateTo, category, priority, status, includeOutcomes = true } = req.query;
    if (!['excel', 'csv', 'pdf'].includes(format)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid export format. Supported formats: excel, csv, pdf');
    }
    let fromDate;
    let toDate;
    if (dateFrom) {
        fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateFrom format');
        }
    }
    if (dateTo) {
        toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateTo format');
        }
    }
    const validatedContext = getValidatedContext(req);
    const filters = {
        workplaceId: validatedContext.workplaceIdObj,
        dateFrom: fromDate,
        dateTo: toDate,
        category,
        priority,
        status,
        limit: 10000
    };
    const result = await clinicalInterventionService_1.default.getInterventions(filters);
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            format,
            filters,
            totalRecords: result.data.length
        },
        data: result.data.map(intervention => ({
            interventionNumber: intervention.interventionNumber,
            patientName: intervention.patientId ?
                `${intervention.patientId.firstName} ${intervention.patientId.lastName}` :
                'Unknown',
            category: intervention.category,
            priority: intervention.priority,
            status: intervention.status,
            issueDescription: intervention.issueDescription,
            identifiedDate: intervention.identifiedDate,
            identifiedBy: intervention.identifiedBy ?
                `${intervention.identifiedBy.firstName} ${intervention.identifiedBy.lastName}` :
                'Unknown',
            completedDate: intervention.completedAt,
            resolutionTime: intervention.completedAt && intervention.startedAt ?
                Math.ceil((intervention.completedAt.getTime() - intervention.startedAt.getTime()) / (1000 * 60 * 60 * 24)) : null,
            ...(includeOutcomes && intervention.outcomes ? {
                patientResponse: intervention.outcomes.patientResponse,
                costSavings: intervention.outcomes.successMetrics?.costSavings,
                problemResolved: intervention.outcomes.successMetrics?.problemResolved,
                medicationOptimized: intervention.outcomes.successMetrics?.medicationOptimized
            } : {})
        }))
    };
    const filename = `clinical-interventions-${format}-${new Date().toISOString().split('T')[0]}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.setHeader('Content-Type', 'application/json');
    (0, responseHelpers_1.sendSuccess)(res, exportData, `Data exported successfully as ${format}`);
});
exports.exportInterventionData = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { format = 'csv', dateFrom, dateTo, category, priority, status, includeOutcomes = true } = req.query;
    if (!['csv', 'excel', 'pdf'].includes(format)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid export format. Supported formats: csv, excel, pdf');
    }
    let fromDate;
    let toDate;
    if (dateFrom) {
        fromDate = new Date(dateFrom);
        if (isNaN(fromDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateFrom format');
        }
    }
    if (dateTo) {
        toDate = new Date(dateTo);
        if (isNaN(toDate.getTime())) {
            throw (0, responseHelpers_1.createValidationError)('Invalid dateTo format');
        }
    }
    const exportFilters = {
        workplaceId: context.workplaceIdObj,
        dateFrom: fromDate,
        dateTo: toDate,
        category,
        priority,
        status,
        includeOutcomes: includeOutcomes === 'true'
    };
    const exportData = await clinicalInterventionService_1.default.exportData(exportFilters, format);
    switch (format) {
        case 'csv':
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="interventions.csv"');
            break;
        case 'excel':
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="interventions.xlsx"');
            break;
        case 'pdf':
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="interventions.pdf"');
            break;
    }
    res.send(exportData);
});
exports.getStrategyRecommendations = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { category } = req.params;
    const { priority, issueDescription } = req.query;
    if (!category) {
        throw (0, responseHelpers_1.createValidationError)('Category is required');
    }
    const recommendations = clinicalInterventionService_1.default.getRecommendedStrategies(category);
    let enhancedRecommendations = recommendations;
    if (priority && issueDescription) {
        enhancedRecommendations = clinicalInterventionService_1.default.generateRecommendations(category, priority, issueDescription);
    }
    (0, responseHelpers_1.sendSuccess)(res, {
        category,
        recommendations: enhancedRecommendations,
        totalCount: enhancedRecommendations.length
    }, 'Strategy recommendations retrieved successfully');
});
exports.linkToMTR = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    const { mtrId } = req.body;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    if (!mtrId || !mongoose_1.default.Types.ObjectId.isValid(mtrId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid MTR ID format');
    }
    const intervention = await clinicalInterventionService_1.default.linkToMTR(id, mtrId, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        intervention
    }, 'Intervention linked to MTR successfully');
});
exports.sendInterventionNotifications = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    const { notificationType, recipients, message, urgency = 'normal' } = req.body;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    if (!notificationType || !recipients) {
        throw (0, responseHelpers_1.createValidationError)('Notification type and recipients are required');
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
        throw (0, responseHelpers_1.createValidationError)('Recipients must be a non-empty array');
    }
    for (const recipientId of recipients) {
        if (!mongoose_1.default.Types.ObjectId.isValid(recipientId)) {
            throw (0, responseHelpers_1.createValidationError)(`Invalid recipient ID format: ${recipientId}`);
        }
    }
    const result = await clinicalInterventionService_1.default.sendNotifications(id, {
        type: notificationType,
        recipients: recipients.map((id) => new mongoose_1.default.Types.ObjectId(id)),
        message,
        urgency,
        sentBy: context.userId
    }, context.userIdObj, context.workplaceIdObj);
    (0, responseHelpers_1.sendSuccess)(res, {
        notificationsSent: result.sent,
        failedNotifications: result.failed,
        totalRecipients: recipients.length
    }, 'Notifications sent successfully');
});
const handleClinicalInterventionError = (error, req, res, next) => {
    logger_1.default.error('Clinical Intervention Controller Error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        workplaceId: req.user?.workplaceId
    });
    if (error instanceof responseHelpers_1.PatientManagementError) {
        return (0, responseHelpers_1.sendError)(res, error.code, error.message, error.statusCode || 400);
    }
    if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err) => ({
            field: err.path,
            message: err.message
        }));
        return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Validation failed', 400, {
            errors: validationErrors
        });
    }
    if (error.name === 'CastError') {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Invalid ID format', 400);
    }
    if (error.code === 11000) {
        return (0, responseHelpers_1.sendError)(res, 'DUPLICATE_RESOURCE', 'Duplicate entry detected', 409);
    }
    (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Internal server error', 500);
};
exports.handleClinicalInterventionError = handleClinicalInterventionError;
exports.createInterventionsFromMTR = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { mtrId, problemIds, priority, estimatedDuration } = req.body;
    if (!mtrId || !problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
        throw (0, responseHelpers_1.createValidationError)('MTR ID and problem IDs are required');
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(mtrId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid MTR ID format');
    }
    for (const problemId of problemIds) {
        if (!mongoose_1.default.Types.ObjectId.isValid(problemId)) {
            throw (0, responseHelpers_1.createValidationError)(`Invalid problem ID format: ${problemId}`);
        }
    }
    try {
        const interventions = await clinicalInterventionService_1.default.createInterventionFromMTR(mtrId, problemIds, context.userIdObj, context.workplaceIdObj, { priority, estimatedDuration });
        (0, responseHelpers_1.sendSuccess)(res, {
            interventions,
            count: interventions.length,
            mtrId
        }, `Created ${interventions.length} interventions from MTR problems`, 201);
    }
    catch (error) {
        logger_1.default.error('Error creating interventions from MTR:', error);
        throw error;
    }
});
exports.getMTRReference = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    try {
        const intervention = await clinicalInterventionService_1.default.getInterventionById(id, context.workplaceIdObj);
        if (!intervention.relatedMTRId) {
            return (0, responseHelpers_1.sendSuccess)(res, { mtrReference: null }, 'No MTR linked to this intervention');
        }
        const mtrReference = await clinicalInterventionService_1.default.getMTRReferenceData(intervention.relatedMTRId.toString(), context.workplaceIdObj);
        (0, responseHelpers_1.sendSuccess)(res, { mtrReference }, 'MTR reference data retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting MTR reference:', error);
        throw error;
    }
});
exports.getInterventionsForMTR = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = getValidatedContext(req);
    const { mtrId } = req.params;
    if (!mtrId || !mongoose_1.default.Types.ObjectId.isValid(mtrId)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid MTR ID format');
    }
    try {
        const interventions = await clinicalInterventionService_1.default.getInterventionsForMTR(mtrId, new mongoose_1.default.Types.ObjectId(context.workplaceId));
        (0, responseHelpers_1.sendSuccess)(res, {
            interventions,
            count: interventions.length,
            mtrId
        }, `Found ${interventions.length} interventions for MTR`);
    }
    catch (error) {
        logger_1.default.error('Error getting interventions for MTR:', error);
        throw error;
    }
});
exports.syncWithMTR = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { id } = req.params;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    try {
        await clinicalInterventionService_1.default.syncWithMTR(id, new mongoose_1.default.Types.ObjectId(context.workplaceId));
        (0, responseHelpers_1.sendSuccess)(res, null, 'Intervention synced with MTR successfully');
    }
    catch (error) {
        logger_1.default.error('Error syncing intervention with MTR:', error);
        throw error;
    }
});
exports.getInterventionAuditTrail = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { id } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, responseHelpers_1.createValidationError)('Invalid intervention ID format');
    }
    try {
        const intervention = await clinicalInterventionService_1.default.getInterventionById(id, new mongoose_1.default.Types.ObjectId(context.workplaceId));
        const options = {
            page: Math.max(1, parseInt(page) || 1),
            limit: Math.min(100, Math.max(1, parseInt(limit) || 50)),
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };
        const auditTrail = await clinicalInterventionService_1.default.getInterventionAuditTrail(id, new mongoose_1.default.Types.ObjectId(context.workplaceId), options);
        (0, responseHelpers_1.sendSuccess)(res, auditTrail, 'Intervention audit trail retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Error getting intervention audit trail:', error);
        throw error;
    }
});
exports.getComplianceReport = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { startDate, endDate, includeDetails = false, interventionIds } = req.query;
    if (!startDate || !endDate) {
        throw (0, responseHelpers_1.createValidationError)('Start date and end date are required');
    }
    const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
    };
    if (dateRange.start >= dateRange.end) {
        throw (0, responseHelpers_1.createValidationError)('Start date must be before end date');
    }
    const maxRange = 365 * 24 * 60 * 60 * 1000;
    if (dateRange.end.getTime() - dateRange.start.getTime() > maxRange) {
        throw (0, responseHelpers_1.createValidationError)('Date range cannot exceed 1 year');
    }
    try {
        const options = {
            includeDetails: includeDetails === 'true',
            interventionIds: interventionIds ? interventionIds.split(',') : undefined,
        };
        const complianceReport = await clinicalInterventionService_1.default.generateComplianceReport(new mongoose_1.default.Types.ObjectId(context.workplaceId), dateRange, options);
        await clinicalInterventionService_1.default.logActivity('GENERATE_COMPLIANCE_REPORT', 'system', context.userId, new mongoose_1.default.Types.ObjectId(context.workplaceId), {
            dateRange,
            interventionCount: complianceReport.summary.totalInterventions,
            complianceScore: complianceReport.summary.complianceScore,
        }, req);
        (0, responseHelpers_1.sendSuccess)(res, complianceReport, 'Compliance report generated successfully');
    }
    catch (error) {
        logger_1.default.error('Error generating compliance report:', error);
        throw error;
    }
});
exports.exportAuditData = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { format = 'json', startDate, endDate, interventionIds, includeDetails = false } = req.query;
    if (!startDate || !endDate) {
        throw (0, responseHelpers_1.createValidationError)('Start date and end date are required');
    }
    if (!['json', 'csv', 'pdf'].includes(format)) {
        throw (0, responseHelpers_1.createValidationError)('Format must be json, csv, or pdf');
    }
    try {
        const dateRange = {
            start: new Date(startDate),
            end: new Date(endDate),
        };
        const filters = {
            resourceType: 'ClinicalIntervention',
            startDate: dateRange.start,
            endDate: dateRange.end,
            ...(interventionIds && {
                resourceId: { $in: interventionIds.split(',').map((id) => new mongoose_1.default.Types.ObjectId(id)) }
            }),
        };
        const exportOptions = {
            format,
            dateRange,
            filters,
            includeDetails: includeDetails === 'true',
            includeSensitiveData: false,
        };
        const AuditService = require('../services/auditService').default;
        const exportResult = await AuditService.exportAuditData(context.workplaceId, exportOptions);
        await clinicalInterventionService_1.default.logActivity('EXPORT_AUDIT_DATA', 'system', context.userId, new mongoose_1.default.Types.ObjectId(context.workplaceId), {
            format,
            dateRange,
            recordCount: Array.isArray(exportResult.data) ? exportResult.data.length : 'unknown',
        }, req);
        res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
        res.setHeader('Content-Type', exportResult.contentType);
        if (format === 'json') {
            res.json(JSON.parse(exportResult.data));
        }
        else {
            res.send(exportResult.data);
        }
    }
    catch (error) {
        logger_1.default.error('Error exporting audit data:', error);
        throw error;
    }
});
//# sourceMappingURL=clinicalInterventionController.js.map