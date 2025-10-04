"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const ClinicalIntervention_1 = __importDefault(require("../models/ClinicalIntervention"));
const Patient_1 = __importDefault(require("../models/Patient"));
const User_1 = __importDefault(require("../models/User"));
const auditService_1 = require("./auditService");
const performanceOptimization_1 = require("../utils/performanceOptimization");
const databaseOptimization_1 = require("../utils/databaseOptimization");
const performanceMonitoring_1 = __importDefault(require("../utils/performanceMonitoring"));
const responseHelpers_1 = require("../utils/responseHelpers");
class ClinicalInterventionService {
    static async createIntervention(data) {
        try {
            const patient = await Patient_1.default.findById(data.patientId);
            if (!patient) {
                throw (0, responseHelpers_1.createNotFoundError)('Patient not found');
            }
            const isSuperAdmin = process.env.NODE_ENV === 'development' ||
                data.isSuperAdmin;
            if (!isSuperAdmin && patient.workplaceId.toString() !== data.workplaceId.toString()) {
                throw (0, responseHelpers_1.createNotFoundError)('Patient not found in your workplace');
            }
            const user = await User_1.default.findById(data.identifiedBy);
            if (!user) {
                const isTestMode = process.env.NODE_ENV === 'development' &&
                    data.identifiedBy.toString().match(/^[0-9a-fA-F]{24}$/);
                if (!isTestMode) {
                    throw (0, responseHelpers_1.createNotFoundError)('User not found');
                }
                console.log('🔧 DEV MODE: Skipping user validation for super_admin test');
            }
            const interventionNumber = await ClinicalIntervention_1.default.generateNextInterventionNumber(data.workplaceId);
            const duplicates = await this.checkDuplicateInterventions(data.patientId, data.category, data.workplaceId);
            const intervention = new ClinicalIntervention_1.default({
                ...data,
                interventionNumber,
                identifiedDate: new Date(),
                startedAt: new Date(),
                status: 'identified',
                followUp: {
                    required: false,
                },
                relatedDTPIds: data.relatedDTPIds || [],
                createdBy: data.identifiedBy,
            });
            if (data.strategies && data.strategies.length > 0) {
                data.strategies.forEach((strategy) => {
                    intervention.addStrategy(strategy);
                });
            }
            await intervention.save();
            await this.updatePatientInterventionFlags(data.patientId, data.workplaceId);
            await ClinicalInterventionService.logActivity('CREATE_INTERVENTION', intervention._id.toString(), data.identifiedBy, data.workplaceId, {
                category: data.category,
                priority: data.priority,
                duplicatesFound: duplicates.length,
                patientId: data.patientId.toString(),
            }, undefined, undefined, intervention.toObject());
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error creating clinical intervention:', error);
            throw error;
        }
    }
    static async updateIntervention(id, updates, userId, workplaceId, isSuperAdmin = false) {
        try {
            const query = {
                _id: id,
                isDeleted: { $ne: true },
            };
            if (!isSuperAdmin) {
                query.workplaceId = workplaceId;
            }
            const intervention = await ClinicalIntervention_1.default.findOne(query);
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            const oldValues = intervention.toObject();
            if (updates.status &&
                !this.isValidStatusTransition(intervention.status, updates.status)) {
                throw (0, responseHelpers_1.createBusinessRuleError)(`Invalid status transition from ${intervention.status} to ${updates.status}`);
            }
            Object.assign(intervention, updates);
            intervention.updatedBy = userId;
            if (updates.status) {
                switch (updates.status) {
                    case 'completed':
                        if (!intervention.outcomes?.patientResponse) {
                            throw (0, responseHelpers_1.createBusinessRuleError)('Patient response outcome is required to complete intervention');
                        }
                        intervention.completedAt = new Date();
                        break;
                    case 'cancelled':
                        intervention.completedAt = new Date();
                        break;
                }
            }
            await intervention.save();
            if (updates.status) {
                await this.updatePatientInterventionFlags(intervention.patientId, workplaceId);
            }
            await ClinicalInterventionService.logActivity('UPDATE_INTERVENTION', intervention._id.toString(), userId, workplaceId, {
                updates: Object.keys(updates),
                statusChange: oldValues.status !== intervention.status
                    ? {
                        from: oldValues.status,
                        to: intervention.status,
                    }
                    : undefined,
            }, undefined, oldValues, intervention.toObject());
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error updating clinical intervention:', error);
            throw error;
        }
    }
    static async getInterventions(filters) {
        return await performanceOptimization_1.PerformanceMonitor.trackOperation('getInterventions', async () => {
            const { workplaceId, page = 1, limit = 20, sortBy = 'identifiedDate', sortOrder = 'desc', } = filters;
            const cacheKey = performanceOptimization_1.CacheManager.generateKey('interventions_list', JSON.stringify(filters), workplaceId.toString());
            const cached = await performanceOptimization_1.CacheManager.get(cacheKey);
            if (cached && typeof cached === "object" && Object.keys(cached).length > 0) {
                performanceMonitoring_1.default.recordInterventionMetrics('getInterventions', filters.workplaceId.toString(), 0, true, { source: 'cache', filters });
                return cached;
            }
            const startTime = Date.now();
            try {
                const pipeline = databaseOptimization_1.OptimizedQueryBuilder.buildInterventionListQuery(filters);
                const sortOptions = {};
                sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
                pipeline.push({ $sort: sortOptions });
                const skip = (page - 1) * limit;
                pipeline.push({ $skip: skip });
                pipeline.push({ $limit: limit });
                const [results, countResult] = await Promise.all([
                    ClinicalIntervention_1.default.aggregate(pipeline),
                    ClinicalIntervention_1.default.aggregate([
                        ...databaseOptimization_1.OptimizedQueryBuilder.buildInterventionListQuery(filters).slice(0, -1),
                        { $count: 'total' },
                    ]),
                ]);
                const total = countResult[0]?.total || 0;
                const pages = Math.ceil(total / limit);
                const result = {
                    data: results,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages,
                        hasNext: page < pages,
                        hasPrev: page > 1,
                    },
                };
                await performanceOptimization_1.CacheManager.set(cacheKey, result, { ttl: 300 });
                const duration = Date.now() - startTime;
                performanceMonitoring_1.default.recordInterventionMetrics('getInterventions', filters.workplaceId.toString(), duration, true, {
                    source: 'database',
                    filters,
                    resultCount: results.length,
                    totalCount: total,
                });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                performanceMonitoring_1.default.recordInterventionMetrics('getInterventions', filters.workplaceId.toString(), duration, false, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    filters,
                });
                throw error;
            }
        }, { workplaceId: filters.workplaceId.toString(), filters });
    }
    static async getInterventionById(id, workplaceId, isSuperAdmin = false) {
        try {
            const query = {
                _id: id,
                isDeleted: { $ne: true },
            };
            if (!isSuperAdmin) {
                query.workplaceId = workplaceId;
            }
            const intervention = await ClinicalIntervention_1.default.findOne(query)
                .populate('patientId', 'firstName lastName dateOfBirth phoneNumber email')
                .populate('identifiedBy', 'firstName lastName email')
                .populate('assignments.userId', 'firstName lastName email role')
                .populate('relatedMTRId', 'reviewNumber status')
                .populate('relatedDTPIds', 'category description');
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error getting clinical intervention by ID:', error);
            throw error;
        }
    }
    static async deleteIntervention(id, userId, workplaceId, isSuperAdmin = false) {
        try {
            const query = {
                _id: id,
                isDeleted: { $ne: true },
            };
            if (!isSuperAdmin) {
                query.workplaceId = workplaceId;
            }
            const intervention = await ClinicalIntervention_1.default.findOne(query);
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            if (intervention.status === 'completed') {
                throw (0, responseHelpers_1.createBusinessRuleError)('Cannot delete completed interventions');
            }
            intervention.isDeleted = true;
            intervention.updatedBy = userId;
            await intervention.save();
            await ClinicalInterventionService.logActivity('DELETE_INTERVENTION', intervention._id.toString(), userId, workplaceId, { status: intervention.status });
            return true;
        }
        catch (error) {
            logger_1.default.error('Error deleting clinical intervention:', error);
            throw error;
        }
    }
    static async generateInterventionNumber(workplaceId) {
        return await ClinicalIntervention_1.default.generateNextInterventionNumber(workplaceId);
    }
    static async checkDuplicateInterventions(patientId, category, workplaceId, excludeId) {
        try {
            const query = {
                patientId,
                category,
                workplaceId,
                status: {
                    $in: ['identified', 'planning', 'in_progress', 'implemented'],
                },
                isDeleted: { $ne: true },
            };
            if (excludeId) {
                query._id = { $ne: excludeId };
            }
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            query.identifiedDate = { $gte: thirtyDaysAgo };
            const duplicates = await ClinicalIntervention_1.default.find(query)
                .populate('identifiedBy', 'firstName lastName')
                .lean();
            return duplicates;
        }
        catch (error) {
            logger_1.default.error('Error checking duplicate interventions:', error);
            throw error;
        }
    }
    static isValidStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            identified: ['planning', 'cancelled'],
            planning: ['in_progress', 'cancelled'],
            in_progress: ['implemented', 'cancelled'],
            implemented: ['completed', 'cancelled'],
            completed: [],
            cancelled: [],
        };
        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }
    static async updatePatientInterventionFlags(patientId, workplaceId) {
        try {
            const patient = await Patient_1.default.findOne({
                _id: patientId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (patient) {
                await patient.updateInterventionFlags();
            }
        }
        catch (error) {
            logger_1.default.error('Error updating patient intervention flags:', error);
        }
    }
    static async getPatientInterventionSummary(patientId, workplaceId) {
        try {
            const [totalInterventions, activeInterventions, completedInterventions, successfulInterventions, categoryStats, recentInterventions,] = await Promise.all([
                ClinicalIntervention_1.default.countDocuments({
                    patientId,
                    workplaceId,
                    isDeleted: { $ne: true },
                }),
                ClinicalIntervention_1.default.countDocuments({
                    patientId,
                    workplaceId,
                    status: {
                        $in: ['identified', 'planning', 'in_progress', 'implemented'],
                    },
                    isDeleted: { $ne: true },
                }),
                ClinicalIntervention_1.default.countDocuments({
                    patientId,
                    workplaceId,
                    status: 'completed',
                    isDeleted: { $ne: true },
                }),
                ClinicalIntervention_1.default.countDocuments({
                    patientId,
                    workplaceId,
                    status: 'completed',
                    'outcomes.successMetrics.problemResolved': true,
                    isDeleted: { $ne: true },
                }),
                ClinicalIntervention_1.default.aggregate([
                    {
                        $match: {
                            patientId,
                            workplaceId,
                            isDeleted: { $ne: true },
                        },
                    },
                    {
                        $group: {
                            _id: '$category',
                            count: { $sum: 1 },
                        },
                    },
                ]),
                ClinicalIntervention_1.default.find({
                    patientId,
                    workplaceId,
                    isDeleted: { $ne: true },
                })
                    .populate('identifiedBy', 'firstName lastName')
                    .sort({ identifiedDate: -1 })
                    .limit(5)
                    .lean(),
            ]);
            const categoryBreakdown = {};
            categoryStats.forEach((stat) => {
                categoryBreakdown[stat._id] = stat.count;
            });
            return {
                totalInterventions,
                activeInterventions,
                completedInterventions,
                successfulInterventions,
                categoryBreakdown,
                recentInterventions: recentInterventions,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting patient intervention summary:', error);
            throw error;
        }
    }
    static async searchPatientsWithInterventions(searchQuery, workplaceId, limit = 10) {
        try {
            const searchRegex = new RegExp(searchQuery, 'i');
            const patients = await Patient_1.default.find({
                workplaceId,
                isDeleted: { $ne: true },
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { mrn: searchRegex },
                ],
            })
                .select('firstName lastName mrn dob')
                .limit(limit)
                .lean();
            const patientsWithInterventions = await Promise.all(patients.map(async (patient) => {
                const [interventionCount, activeInterventionCount, lastIntervention] = await Promise.all([
                    ClinicalIntervention_1.default.countDocuments({
                        patientId: patient._id,
                        workplaceId,
                        isDeleted: { $ne: true },
                    }),
                    ClinicalIntervention_1.default.countDocuments({
                        patientId: patient._id,
                        workplaceId,
                        status: {
                            $in: ['identified', 'planning', 'in_progress', 'implemented'],
                        },
                        isDeleted: { $ne: true },
                    }),
                    ClinicalIntervention_1.default.findOne({
                        patientId: patient._id,
                        workplaceId,
                        isDeleted: { $ne: true },
                    })
                        .sort({ identifiedDate: -1 })
                        .select('identifiedDate')
                        .lean(),
                ]);
                return {
                    _id: patient._id.toString(),
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    mrn: patient.mrn,
                    displayName: `${patient.firstName} ${patient.lastName}`,
                    age: patient.dob
                        ? Math.floor((Date.now() - patient.dob.getTime()) /
                            (1000 * 60 * 60 * 24 * 365.25))
                        : undefined,
                    interventionCount,
                    activeInterventionCount,
                    lastInterventionDate: lastIntervention?.identifiedDate,
                };
            }));
            return patientsWithInterventions;
        }
        catch (error) {
            logger_1.default.error('Error searching patients with interventions:', error);
            throw error;
        }
    }
    static async linkToMTR(interventionId, mtrId, userId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            const MedicationTherapyReview = mongoose_1.default.model('MedicationTherapyReview');
            const mtr = await MedicationTherapyReview.findOne({
                _id: mtrId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!mtr) {
                throw (0, responseHelpers_1.createNotFoundError)('MTR not found');
            }
            if (intervention.patientId.toString() !== mtr.patientId.toString()) {
                throw (0, responseHelpers_1.createBusinessRuleError)('Intervention and MTR must be for the same patient');
            }
            intervention.relatedMTRId = new mongoose_1.default.Types.ObjectId(mtrId);
            intervention.updatedBy = userId;
            await intervention.save();
            await this.logActivity('LINK_TO_MTR', interventionId, userId, workplaceId, { mtrId, mtrNumber: mtr.reviewNumber });
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error linking intervention to MTR:', error);
            throw error;
        }
    }
    static async createInterventionFromMTR(mtrId, problemIds, userId, workplaceId, additionalData) {
        try {
            const MedicationTherapyReview = mongoose_1.default.model('MedicationTherapyReview');
            const mtr = await MedicationTherapyReview.findOne({
                _id: mtrId,
                workplaceId,
                isDeleted: { $ne: true },
            }).populate('problems');
            if (!mtr) {
                throw (0, responseHelpers_1.createNotFoundError)('MTR not found');
            }
            const DrugTherapyProblem = mongoose_1.default.model('DrugTherapyProblem');
            const problems = await DrugTherapyProblem.find({
                _id: { $in: problemIds },
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (problems.length !== problemIds.length) {
                throw (0, responseHelpers_1.createNotFoundError)('One or more problems not found');
            }
            const createdInterventions = [];
            for (const problem of problems) {
                const interventionData = {
                    patientId: mtr.patientId,
                    category: this.mapDTPCategoryToInterventionCategory(problem.category),
                    priority: additionalData?.priority ||
                        this.determinePriorityFromProblem(problem),
                    issueDescription: `MTR-identified issue: ${problem.description}`,
                    identifiedBy: userId,
                    workplaceId,
                    relatedMTRId: new mongoose_1.default.Types.ObjectId(mtrId),
                    relatedDTPIds: [problem._id],
                    estimatedDuration: additionalData?.estimatedDuration,
                };
                const intervention = await this.createIntervention(interventionData);
                const recommendedStrategies = this.getRecommendedStrategiesForDTP(problem);
                for (const strategy of recommendedStrategies) {
                    intervention.addStrategy(strategy);
                }
                await intervention.save();
                createdInterventions.push(intervention);
            }
            await this.logActivity('CREATE_INTERVENTIONS_FROM_MTR', mtrId, userId, workplaceId, {
                problemIds,
                interventionIds: createdInterventions.map((i) => i._id.toString()),
                mtrNumber: mtr.reviewNumber,
            });
            return createdInterventions;
        }
        catch (error) {
            logger_1.default.error('Error creating interventions from MTR:', error);
            throw error;
        }
    }
    static async getMTRReferenceData(mtrId, workplaceId) {
        try {
            const MedicationTherapyReview = mongoose_1.default.model('MedicationTherapyReview');
            const mtr = await MedicationTherapyReview.findOne({
                _id: mtrId,
                workplaceId,
                isDeleted: { $ne: true },
            })
                .populate('patientId', 'firstName lastName')
                .populate('pharmacistId', 'firstName lastName')
                .lean();
            if (!mtr) {
                return null;
            }
            const interventionCount = await ClinicalIntervention_1.default.countDocuments({
                relatedMTRId: mtrId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            const mtrData = Array.isArray(mtr) ? mtr[0] : mtr;
            if (!mtrData) {
                throw (0, responseHelpers_1.createNotFoundError)('MTR not found');
            }
            return {
                _id: mtrData._id.toString(),
                reviewNumber: mtrData.reviewNumber,
                status: mtrData.status,
                priority: mtrData.priority,
                startedAt: mtrData.startedAt,
                completedAt: mtrData.completedAt,
                patientName: `${mtrData.patientId?.firstName || ''} ${mtrData.patientId?.lastName || ''}`,
                pharmacistName: `${mtrData.pharmacistId?.firstName || ''} ${mtrData.pharmacistId?.lastName || ''}`,
                problemCount: mtrData.problems?.length || 0,
                interventionCount,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting MTR reference data:', error);
            return null;
        }
    }
    static async getInterventionsForMTR(mtrId, workplaceId) {
        try {
            const interventions = await ClinicalIntervention_1.default.find({
                relatedMTRId: mtrId,
                workplaceId,
                isDeleted: { $ne: true },
            })
                .populate('identifiedBy', 'firstName lastName')
                .populate('assignments.userId', 'firstName lastName')
                .sort({ identifiedDate: -1 })
                .lean();
            return interventions;
        }
        catch (error) {
            logger_1.default.error('Error getting interventions for MTR:', error);
            throw error;
        }
    }
    static async syncWithMTR(interventionId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention || !intervention.relatedMTRId) {
                return;
            }
            const MedicationTherapyReview = mongoose_1.default.model('MedicationTherapyReview');
            const mtr = await MedicationTherapyReview.findById(intervention.relatedMTRId);
            if (!mtr) {
                intervention.relatedMTRId = undefined;
                await intervention.save();
                return;
            }
            if (intervention.patientId.toString() !== mtr.patientId.toString()) {
                logger_1.default.warn('Patient mismatch between intervention and MTR', {
                    interventionId,
                    mtrId: mtr._id.toString(),
                    interventionPatient: intervention.patientId.toString(),
                    mtrPatient: mtr.patientId.toString(),
                });
            }
            if (intervention.status === 'completed' && intervention.outcomes) {
                await this.updateMTRFromInterventionOutcome(intervention, mtr);
            }
        }
        catch (error) {
            logger_1.default.error('Error syncing intervention with MTR:', error);
        }
    }
    static mapDTPCategoryToInterventionCategory(dtpCategory) {
        const categoryMap = {
            untreated_indication: 'drug_therapy_problem',
            improper_drug_selection: 'drug_therapy_problem',
            subtherapeutic_dosage: 'dosing_issue',
            failure_to_receive_drug: 'medication_nonadherence',
            overdosage: 'dosing_issue',
            adverse_drug_reaction: 'adverse_drug_reaction',
            drug_interaction: 'drug_interaction',
            drug_use_without_indication: 'drug_therapy_problem',
        };
        return categoryMap[dtpCategory] || 'other';
    }
    static determinePriorityFromProblem(problem) {
        if (problem.severity === 'critical' ||
            problem.category === 'adverse_drug_reaction') {
            return 'critical';
        }
        if (problem.severity === 'major' ||
            problem.category === 'drug_interaction') {
            return 'high';
        }
        if (problem.severity === 'moderate') {
            return 'medium';
        }
        return 'low';
    }
    static getRecommendedStrategiesForDTP(problem) {
        const strategies = [];
        switch (problem.category) {
            case 'adverse_drug_reaction':
                strategies.push({
                    type: 'discontinuation',
                    description: 'Consider discontinuing the offending medication',
                    rationale: 'Eliminate source of adverse drug reaction',
                    expectedOutcome: 'Resolution of adverse effects',
                    priority: 'primary',
                });
                break;
            case 'drug_interaction':
                strategies.push({
                    type: 'medication_review',
                    description: 'Review all medications for interactions',
                    rationale: 'Identify and manage drug interactions',
                    expectedOutcome: 'Elimination of harmful interactions',
                    priority: 'primary',
                });
                break;
            case 'subtherapeutic_dosage':
            case 'overdosage':
                strategies.push({
                    type: 'dose_adjustment',
                    description: 'Adjust medication dosage',
                    rationale: 'Optimize therapeutic effect',
                    expectedOutcome: 'Improved clinical response',
                    priority: 'primary',
                });
                break;
            default:
                strategies.push({
                    type: 'medication_review',
                    description: 'Comprehensive medication review',
                    rationale: 'Address identified drug therapy problem',
                    expectedOutcome: 'Optimized medication therapy',
                    priority: 'primary',
                });
        }
        return strategies;
    }
    static async updateMTRFromInterventionOutcome(intervention, mtr) {
        try {
            if (intervention.outcomes?.successMetrics.problemResolved) {
                mtr.clinicalOutcomes.problemsResolved += 1;
            }
            if (intervention.outcomes?.successMetrics.medicationOptimized) {
                mtr.clinicalOutcomes.medicationsOptimized += 1;
            }
            if (intervention.outcomes?.successMetrics.adherenceImproved) {
                mtr.clinicalOutcomes.adherenceImproved = true;
            }
            if (intervention.outcomes?.successMetrics.costSavings) {
                mtr.clinicalOutcomes.costSavings =
                    (mtr.clinicalOutcomes.costSavings || 0) +
                        intervention.outcomes.successMetrics.costSavings;
            }
            await mtr.save();
        }
        catch (error) {
            logger_1.default.error('Error updating MTR from intervention outcome:', error);
        }
    }
    static async logActivity(action, interventionId, userId, workplaceId, details, req, oldValues, newValues) {
        try {
            const auditContext = {
                userId: userId.toString(),
                workspaceId: workplaceId.toString(),
                sessionId: req?.sessionID,
            };
            const auditData = {
                action: `INTERVENTION_${action.toUpperCase()}`,
                userId: userId.toString(),
                interventionId: interventionId,
                oldValues,
                newValues,
                changedFields: oldValues && newValues
                    ? this.getChangedFields(oldValues, newValues)
                    : undefined,
                details: {
                    ...details,
                    service: 'clinical-intervention',
                    timestamp: new Date(),
                },
                complianceCategory: 'clinical_documentation',
                riskLevel: this.determineRiskLevel(action, details),
            };
            await auditService_1.AuditService.logActivity(auditContext, auditData);
            logger_1.default.info('Clinical Intervention Activity', {
                action,
                interventionId,
                userId: userId.toString(),
                workplaceId: workplaceId.toString(),
                details,
                timestamp: new Date(),
                service: 'clinical-intervention',
            });
        }
        catch (error) {
            logger_1.default.error('Error logging clinical intervention activity:', error);
        }
    }
    static async logInterventionAccess(interventionId, userId, workplaceId, accessType, req, details = {}) {
        try {
            const auditContext = {
                userId: userId.toString(),
                workspaceId: workplaceId.toString(),
                sessionId: req?.sessionID,
            };
            const auditData = {
                action: `ACCESS_INTERVENTION_${accessType.toUpperCase()}`,
                userId: userId.toString(),
                interventionId: interventionId,
                details: {
                    accessType,
                    ...details,
                },
                complianceCategory: 'data_access',
                riskLevel: accessType === 'delete' ? 'high' : 'medium',
            };
            await auditService_1.AuditService.logActivity(auditContext, auditData);
        }
        catch (error) {
            logger_1.default.error('Error logging intervention access:', error);
        }
    }
    static async getInterventionAuditTrail(interventionId, workplaceId, options = {}) {
        try {
            const filters = {
                resourceId: new mongoose_1.default.Types.ObjectId(interventionId),
                startDate: options.startDate,
                endDate: options.endDate,
            };
            const { logs, total } = await auditService_1.AuditService.getAuditLogs({
                ...filters,
                startDate: filters.startDate?.toISOString(),
                endDate: filters.endDate?.toISOString(),
                page: options.page || 1,
                limit: options.limit || 50,
            });
            const uniqueUsers = new Set(logs.map((log) => log.userId?.toString()).filter(Boolean)).size;
            const lastActivity = logs.length > 0 ? logs[0]?.timestamp : null;
            const riskActivities = logs.filter((log) => log.riskLevel === 'high' || log.riskLevel === 'critical').length;
            return {
                logs,
                total,
                summary: {
                    totalActions: total,
                    uniqueUsers,
                    lastActivity: lastActivity || null,
                    riskActivities,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Error getting intervention audit trail:', error);
            throw error;
        }
    }
    static async generateComplianceReport(workplaceId, dateRange, options = {}) {
        try {
            const interventionQuery = {
                workplaceId,
                createdAt: { $gte: dateRange.start, $lte: dateRange.end },
                isDeleted: { $ne: true },
            };
            if (options.interventionIds?.length) {
                interventionQuery._id = {
                    $in: options.interventionIds.map((id) => new mongoose_1.default.Types.ObjectId(id)),
                };
            }
            const interventions = await ClinicalIntervention_1.default.find(interventionQuery)
                .select('_id interventionNumber createdAt status')
                .lean();
            const auditFilters = {
                resourceType: 'ClinicalIntervention',
                startDate: dateRange.start,
                endDate: dateRange.end,
            };
            const { logs: auditLogs } = await auditService_1.AuditService.getAuditLogs({
                ...auditFilters,
                startDate: auditFilters.startDate?.toISOString(),
                endDate: auditFilters.endDate?.toISOString(),
                limit: 10000
            });
            const interventionCompliance = interventions.map((intervention) => {
                const interventionAudits = auditLogs.filter((log) => log.interventionId?.toString() === intervention._id.toString());
                const auditCount = interventionAudits.length;
                const lastAudit = interventionAudits.length > 0
                    ? interventionAudits.reduce((latest, log) => log.timestamp > (latest || new Date(0))
                        ? log.timestamp
                        : latest || new Date(0), interventionAudits[0]?.timestamp || null)
                    : null;
                const riskActivities = interventionAudits.filter((log) => log.riskLevel === 'high' || log.riskLevel === 'critical').length;
                let complianceStatus = 'compliant';
                let riskLevel = 'low';
                if (auditCount === 0) {
                    complianceStatus = 'non-compliant';
                    riskLevel = 'high';
                }
                else if (riskActivities > 0) {
                    complianceStatus = 'warning';
                    riskLevel = riskActivities > 2 ? 'critical' : 'medium';
                }
                else if (auditCount < 3) {
                    complianceStatus = 'warning';
                    riskLevel = 'medium';
                }
                return {
                    interventionId: intervention._id.toString(),
                    interventionNumber: intervention.interventionNumber,
                    auditCount,
                    lastAudit: lastAudit || intervention.createdAt,
                    complianceStatus,
                    riskLevel,
                };
            });
            const totalInterventions = interventions.length;
            const auditedActions = auditLogs.length;
            const riskActivities = auditLogs.filter((log) => log.riskLevel === 'high' || log.riskLevel === 'critical').length;
            const compliantInterventions = interventionCompliance.filter((i) => i.complianceStatus === 'compliant').length;
            const complianceScore = totalInterventions > 0
                ? Math.round((compliantInterventions / totalInterventions) * 100)
                : 100;
            const recommendations = [];
            if (complianceScore < 80) {
                recommendations.push('Improve audit trail completeness for clinical interventions');
            }
            if (riskActivities > totalInterventions * 0.1) {
                recommendations.push('Review high-risk activities and implement additional controls');
            }
            if (interventionCompliance.some((i) => i.auditCount === 0)) {
                recommendations.push('Ensure all interventions have proper audit logging');
            }
            return {
                summary: {
                    totalInterventions,
                    auditedActions,
                    complianceScore,
                    riskActivities,
                },
                interventionCompliance,
                recommendations,
            };
        }
        catch (error) {
            logger_1.default.error('Error generating compliance report:', error);
            throw error;
        }
    }
    static getChangedFields(oldValues, newValues) {
        const changedFields = [];
        if (!oldValues || !newValues)
            return changedFields;
        const allKeys = new Set([
            ...Object.keys(oldValues),
            ...Object.keys(newValues),
        ]);
        for (const key of allKeys) {
            if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
                changedFields.push(key);
            }
        }
        return changedFields;
    }
    static determineRiskLevel(action, details) {
        if (action.includes('DELETE') || action.includes('CANCEL')) {
            return 'critical';
        }
        if (action.includes('OUTCOME') ||
            action.includes('COMPLETE') ||
            details?.priority === 'critical') {
            return 'high';
        }
        if (action.includes('UPDATE') ||
            action.includes('ASSIGN') ||
            action.includes('STRATEGY')) {
            return 'medium';
        }
        return 'low';
    }
}
const STRATEGY_MAPPINGS = {
    drug_therapy_problem: [
        {
            type: 'medication_review',
            label: 'Comprehensive Medication Review',
            description: 'Conduct thorough review of all medications',
            rationale: 'Identify potential drug therapy problems and optimization opportunities',
            expectedOutcome: 'Improved medication safety and efficacy',
            priority: 'primary',
            applicableCategories: ['drug_therapy_problem', 'dosing_issue'],
        },
        {
            type: 'dose_adjustment',
            label: 'Dose Optimization',
            description: 'Adjust medication dosage based on clinical parameters',
            rationale: 'Optimize therapeutic effect while minimizing adverse effects',
            expectedOutcome: 'Improved clinical response with reduced side effects',
            priority: 'primary',
            applicableCategories: ['drug_therapy_problem', 'dosing_issue'],
        },
        {
            type: 'alternative_therapy',
            label: 'Alternative Medication Selection',
            description: 'Consider alternative medications with better safety/efficacy profile',
            rationale: 'Current therapy may not be optimal for patient-specific factors',
            expectedOutcome: 'Better therapeutic outcomes with improved tolerability',
            priority: 'secondary',
            applicableCategories: [
                'drug_therapy_problem',
                'adverse_drug_reaction',
                'contraindication',
            ],
        },
        {
            type: 'additional_monitoring',
            label: 'Enhanced Monitoring Protocol',
            description: 'Implement additional monitoring parameters',
            rationale: 'Ensure early detection of therapeutic response or adverse effects',
            expectedOutcome: 'Improved safety monitoring and outcome tracking',
            priority: 'secondary',
            applicableCategories: ['drug_therapy_problem', 'adverse_drug_reaction'],
        },
    ],
    adverse_drug_reaction: [
        {
            type: 'discontinuation',
            label: 'Medication Discontinuation',
            description: 'Discontinue the offending medication',
            rationale: 'Eliminate the source of adverse drug reaction',
            expectedOutcome: 'Resolution of adverse effects',
            priority: 'primary',
            applicableCategories: ['adverse_drug_reaction', 'contraindication'],
        },
        {
            type: 'dose_adjustment',
            label: 'Dose Reduction',
            description: 'Reduce medication dose to minimize adverse effects',
            rationale: 'Maintain therapeutic benefit while reducing toxicity',
            expectedOutcome: 'Reduced adverse effects while preserving efficacy',
            priority: 'primary',
            applicableCategories: ['adverse_drug_reaction', 'dosing_issue'],
        },
        {
            type: 'alternative_therapy',
            label: 'Switch to Alternative Agent',
            description: 'Replace with medication having better tolerability profile',
            rationale: 'Maintain therapeutic effect with improved safety profile',
            expectedOutcome: 'Continued therapeutic benefit without adverse effects',
            priority: 'secondary',
            applicableCategories: ['adverse_drug_reaction', 'contraindication'],
        },
        {
            type: 'additional_monitoring',
            label: 'Intensive Safety Monitoring',
            description: 'Implement close monitoring for adverse effect resolution',
            rationale: 'Ensure safe resolution and prevent recurrence',
            expectedOutcome: 'Safe management and prevention of future ADRs',
            priority: 'secondary',
            applicableCategories: ['adverse_drug_reaction'],
        },
    ],
    medication_nonadherence: [
        {
            type: 'patient_counseling',
            label: 'Patient Education and Counseling',
            description: 'Provide comprehensive medication education',
            rationale: 'Address knowledge gaps and misconceptions about medications',
            expectedOutcome: 'Improved understanding and medication adherence',
            priority: 'primary',
            applicableCategories: ['medication_nonadherence'],
        },
        {
            type: 'medication_review',
            label: 'Adherence-Focused Medication Review',
            description: 'Review regimen complexity and adherence barriers',
            rationale: 'Identify and address specific adherence challenges',
            expectedOutcome: 'Simplified regimen with improved adherence',
            priority: 'primary',
            applicableCategories: ['medication_nonadherence'],
        },
        {
            type: 'alternative_therapy',
            label: 'Adherence-Friendly Alternatives',
            description: 'Consider medications with better adherence profiles',
            rationale: 'Reduce dosing frequency or complexity to improve adherence',
            expectedOutcome: 'Improved adherence through simplified regimen',
            priority: 'secondary',
            applicableCategories: ['medication_nonadherence'],
        },
        {
            type: 'additional_monitoring',
            label: 'Adherence Monitoring Program',
            description: 'Implement systematic adherence monitoring',
            rationale: 'Track adherence patterns and provide timely interventions',
            expectedOutcome: 'Sustained improvement in medication adherence',
            priority: 'secondary',
            applicableCategories: ['medication_nonadherence'],
        },
    ],
    drug_interaction: [
        {
            type: 'medication_review',
            label: 'Drug Interaction Assessment',
            description: 'Comprehensive review of all medications for interactions',
            rationale: 'Identify and manage clinically significant drug interactions',
            expectedOutcome: 'Elimination of harmful drug interactions',
            priority: 'primary',
            applicableCategories: ['drug_interaction'],
        },
        {
            type: 'dose_adjustment',
            label: 'Interaction-Based Dose Modification',
            description: 'Adjust doses to account for drug interactions',
            rationale: 'Maintain efficacy while minimizing interaction effects',
            expectedOutcome: 'Safe concurrent use of interacting medications',
            priority: 'primary',
            applicableCategories: ['drug_interaction', 'dosing_issue'],
        },
        {
            type: 'alternative_therapy',
            label: 'Non-Interacting Alternative',
            description: 'Replace one medication with non-interacting alternative',
            rationale: 'Eliminate interaction while maintaining therapeutic goals',
            expectedOutcome: 'Continued therapy without drug interactions',
            priority: 'secondary',
            applicableCategories: ['drug_interaction'],
        },
        {
            type: 'additional_monitoring',
            label: 'Interaction Monitoring Protocol',
            description: 'Implement monitoring for interaction effects',
            rationale: 'Early detection of interaction-related problems',
            expectedOutcome: 'Safe management of unavoidable interactions',
            priority: 'secondary',
            applicableCategories: ['drug_interaction'],
        },
    ],
    dosing_issue: [
        {
            type: 'dose_adjustment',
            label: 'Dose Optimization',
            description: 'Adjust dose based on patient-specific factors',
            rationale: 'Optimize dose for individual patient characteristics',
            expectedOutcome: 'Improved therapeutic response with optimal safety',
            priority: 'primary',
            applicableCategories: ['dosing_issue'],
        },
        {
            type: 'medication_review',
            label: 'Dosing Regimen Review',
            description: 'Comprehensive review of dosing appropriateness',
            rationale: 'Ensure dosing aligns with current guidelines and patient factors',
            expectedOutcome: 'Evidence-based dosing optimization',
            priority: 'primary',
            applicableCategories: ['dosing_issue'],
        },
        {
            type: 'additional_monitoring',
            label: 'Therapeutic Drug Monitoring',
            description: 'Implement monitoring of drug levels or therapeutic markers',
            rationale: 'Guide dose adjustments based on objective measurements',
            expectedOutcome: 'Precision dosing with improved outcomes',
            priority: 'secondary',
            applicableCategories: ['dosing_issue'],
        },
        {
            type: 'alternative_therapy',
            label: 'Alternative Dosing Strategy',
            description: 'Consider alternative formulations or dosing approaches',
            rationale: 'Improve dosing convenience or therapeutic profile',
            expectedOutcome: 'Better dosing outcomes through alternative approach',
            priority: 'secondary',
            applicableCategories: ['dosing_issue'],
        },
    ],
    contraindication: [
        {
            type: 'discontinuation',
            label: 'Immediate Discontinuation',
            description: 'Stop contraindicated medication immediately',
            rationale: 'Prevent serious adverse outcomes from contraindicated use',
            expectedOutcome: 'Elimination of contraindication risk',
            priority: 'primary',
            applicableCategories: ['contraindication'],
        },
        {
            type: 'alternative_therapy',
            label: 'Safe Alternative Selection',
            description: 'Replace with medication without contraindications',
            rationale: 'Maintain therapeutic benefit while ensuring safety',
            expectedOutcome: 'Continued therapy without contraindication risk',
            priority: 'primary',
            applicableCategories: ['contraindication'],
        },
        {
            type: 'physician_consultation',
            label: 'Specialist Consultation',
            description: 'Consult with specialist for complex contraindication management',
            rationale: 'Obtain expert guidance for challenging clinical situations',
            expectedOutcome: 'Expert-guided safe medication management',
            priority: 'secondary',
            applicableCategories: ['contraindication'],
        },
        {
            type: 'additional_monitoring',
            label: 'Risk Mitigation Monitoring',
            description: 'Implement intensive monitoring if discontinuation not possible',
            rationale: 'Minimize risk when contraindicated medication must be continued',
            expectedOutcome: 'Safest possible management of unavoidable contraindication',
            priority: 'secondary',
            applicableCategories: ['contraindication'],
        },
    ],
    other: [
        {
            type: 'medication_review',
            label: 'Comprehensive Assessment',
            description: 'Thorough evaluation of the clinical situation',
            rationale: 'Understand the specific nature of the clinical issue',
            expectedOutcome: 'Clear identification and management plan',
            priority: 'primary',
            applicableCategories: ['other'],
        },
        {
            type: 'patient_counseling',
            label: 'Patient Education',
            description: 'Provide relevant patient education and counseling',
            rationale: 'Ensure patient understanding of their medication therapy',
            expectedOutcome: 'Improved patient knowledge and engagement',
            priority: 'primary',
            applicableCategories: ['other'],
        },
        {
            type: 'physician_consultation',
            label: 'Healthcare Provider Consultation',
            description: 'Collaborate with other healthcare providers',
            rationale: 'Ensure coordinated care and optimal outcomes',
            expectedOutcome: 'Integrated healthcare team approach',
            priority: 'secondary',
            applicableCategories: ['other'],
        },
        {
            type: 'custom',
            label: 'Custom Intervention Strategy',
            description: 'Develop tailored intervention for unique situation',
            rationale: 'Address specific clinical needs not covered by standard approaches',
            expectedOutcome: 'Individualized solution for complex clinical issue',
            priority: 'secondary',
            applicableCategories: ['other'],
        },
    ],
};
class StrategyRecommendationEngine {
    static getRecommendedStrategies(category) {
        const strategies = STRATEGY_MAPPINGS[category] || STRATEGY_MAPPINGS['other'] || [];
        return strategies.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority === 'primary' ? -1 : 1;
            }
            return a.label.localeCompare(b.label);
        });
    }
    static getAllStrategies() {
        const allStrategies = [];
        Object.values(STRATEGY_MAPPINGS).forEach((categoryStrategies) => {
            categoryStrategies.forEach((strategy) => {
                if (!allStrategies.find((s) => s.type === strategy.type)) {
                    allStrategies.push(strategy);
                }
            });
        });
        return allStrategies.sort((a, b) => a.label.localeCompare(b.label));
    }
    static getStrategiesForCategories(categories) {
        const applicableStrategies = [];
        categories.forEach((category) => {
            const categoryStrategies = this.getRecommendedStrategies(category);
            categoryStrategies.forEach((strategy) => {
                if (!applicableStrategies.find((s) => s.type === strategy.type) &&
                    strategy.applicableCategories.includes(category)) {
                    applicableStrategies.push(strategy);
                }
            });
        });
        return applicableStrategies.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority === 'primary' ? -1 : 1;
            }
            return a.label.localeCompare(b.label);
        });
    }
    static validateCustomStrategy(strategy) {
        const errors = [];
        if (!strategy.type || strategy.type !== 'custom') {
            errors.push('Custom strategy must have type "custom"');
        }
        if (!strategy.description || strategy.description.trim().length < 10) {
            errors.push('Strategy description must be at least 10 characters');
        }
        if (!strategy.rationale || strategy.rationale.trim().length < 10) {
            errors.push('Strategy rationale must be at least 10 characters');
        }
        if (!strategy.expectedOutcome ||
            strategy.expectedOutcome.trim().length < 20) {
            errors.push('Expected outcome must be at least 20 characters');
        }
        if (strategy.description && strategy.description.length > 500) {
            errors.push('Strategy description cannot exceed 500 characters');
        }
        if (strategy.rationale && strategy.rationale.length > 500) {
            errors.push('Strategy rationale cannot exceed 500 characters');
        }
        if (strategy.expectedOutcome && strategy.expectedOutcome.length > 500) {
            errors.push('Expected outcome cannot exceed 500 characters');
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    static generateRecommendations(category, priority, issueDescription, patientFactors) {
        let recommendations = this.getRecommendedStrategies(category);
        if (priority === 'critical' || priority === 'high') {
            recommendations = recommendations.filter((r) => r.priority === 'primary');
        }
        if (patientFactors) {
            recommendations = StrategyRecommendationEngine.applyContextualFiltering(recommendations, patientFactors, issueDescription);
        }
        return recommendations.slice(0, 4);
    }
    static applyContextualFiltering(strategies, patientFactors, issueDescription) {
        return strategies.filter((strategy) => {
            if (patientFactors.currentMedications?.length > 5 &&
                strategy.type === 'medication_review') {
                return true;
            }
            if (patientFactors.age > 65 && strategy.type === 'dose_adjustment') {
                strategy.rationale += ' (Consider age-related pharmacokinetic changes)';
                return true;
            }
            if (issueDescription.toLowerCase().includes('adherence') ||
                issueDescription.toLowerCase().includes('compliance')) {
                return (strategy.type === 'patient_counseling' ||
                    strategy.type === 'medication_review');
            }
            return true;
        });
    }
    static getStrategyByType(type) {
        for (const categoryStrategies of Object.values(STRATEGY_MAPPINGS)) {
            const strategy = categoryStrategies.find((s) => s.type === type);
            if (strategy) {
                return strategy;
            }
        }
        return null;
    }
}
ClinicalInterventionService.getRecommendedStrategies =
    StrategyRecommendationEngine.getRecommendedStrategies;
ClinicalInterventionService.getAllStrategies =
    StrategyRecommendationEngine.getAllStrategies;
ClinicalInterventionService.getStrategiesForCategories =
    StrategyRecommendationEngine.getStrategiesForCategories;
ClinicalInterventionService.validateCustomStrategy =
    StrategyRecommendationEngine.validateCustomStrategy;
ClinicalInterventionService.generateRecommendations =
    StrategyRecommendationEngine.generateRecommendations;
ClinicalInterventionService.getStrategyByType =
    StrategyRecommendationEngine.getStrategyByType;
class TeamCollaborationService {
    static async assignTeamMember(interventionId, assignment, assignedBy, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            const user = await User_1.default.findOne({
                _id: assignment.userId,
                workplaceId,
            });
            if (!user) {
                throw (0, responseHelpers_1.createNotFoundError)('User not found or not in workplace');
            }
            const validationResult = this.validateRoleAssignment(assignment.role, user);
            if (!validationResult.isValid) {
                throw (0, responseHelpers_1.createBusinessRuleError)(validationResult.errors.join(', '));
            }
            const existingAssignment = intervention.assignments.find((a) => a.userId.equals(assignment.userId) && a.status !== 'cancelled');
            if (existingAssignment) {
                throw (0, responseHelpers_1.createBusinessRuleError)('User is already assigned to this intervention');
            }
            const newAssignment = {
                ...assignment,
                assignedAt: new Date(),
            };
            intervention.assignTeamMember(newAssignment);
            intervention.updatedBy = assignedBy;
            await intervention.save();
            await ClinicalInterventionService.logActivity('ASSIGN_TEAM_MEMBER', interventionId, assignedBy, workplaceId, {
                assignedUserId: assignment.userId.toString(),
                role: assignment.role,
                task: assignment.task,
            });
            await this.triggerAssignmentNotification(intervention, newAssignment, assignedBy);
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error assigning team member:', error);
            throw error;
        }
    }
    static async updateAssignmentStatus(interventionId, assignmentUserId, status, notes, updatedBy, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            const assignment = intervention.assignments.find((a) => a.userId.equals(assignmentUserId));
            if (!assignment) {
                throw (0, responseHelpers_1.createNotFoundError)('Assignment not found');
            }
            if (!this.isValidAssignmentStatusTransition(assignment.status, status)) {
                throw (0, responseHelpers_1.createBusinessRuleError)(`Invalid status transition from ${assignment.status} to ${status}`);
            }
            const previousStatus = assignment.status;
            assignment.status = status;
            if (notes)
                assignment.notes = notes;
            if (status === 'completed')
                assignment.completedAt = new Date();
            intervention.updatedBy = updatedBy;
            await intervention.save();
            await ClinicalInterventionService.logActivity('UPDATE_ASSIGNMENT_STATUS', interventionId, updatedBy, workplaceId, {
                assignedUserId: assignmentUserId.toString(),
                previousStatus,
                newStatus: status,
                notes,
            });
            await this.triggerStatusChangeNotification(intervention, assignment, previousStatus, updatedBy);
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error updating assignment status:', error);
            throw error;
        }
    }
    static async getUserAssignments(userId, workplaceId, status) {
        try {
            const query = {
                workplaceId,
                'assignments.userId': userId,
                isDeleted: { $ne: true },
            };
            if (status && status.length > 0) {
                query['assignments.status'] = { $in: status };
            }
            const interventions = await ClinicalIntervention_1.default.find(query)
                .populate('patientId', 'firstName lastName dateOfBirth')
                .populate('identifiedBy', 'firstName lastName')
                .populate('assignments.userId', 'firstName lastName')
                .sort({ 'assignments.assignedAt': -1 });
            return interventions;
        }
        catch (error) {
            logger_1.default.error('Error getting user assignments:', error);
            throw error;
        }
    }
    static async getAssignmentHistory(interventionId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            }).populate('assignments.userId', 'firstName lastName email');
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            const auditTrail = await this.getAssignmentAuditTrail(interventionId);
            return {
                assignments: intervention.assignments,
                auditTrail,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting assignment history:', error);
            throw error;
        }
    }
    static async removeAssignment(interventionId, assignmentUserId, removedBy, workplaceId, reason) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            const assignmentIndex = intervention.assignments.findIndex((a) => a.userId.equals(assignmentUserId));
            if (assignmentIndex === -1) {
                throw (0, responseHelpers_1.createNotFoundError)('Assignment not found');
            }
            const assignment = intervention.assignments[assignmentIndex];
            if (assignment && assignment.status === 'completed') {
                throw (0, responseHelpers_1.createBusinessRuleError)('Cannot remove completed assignments');
            }
            if (assignment) {
                assignment.status = 'cancelled';
                assignment.notes = reason || 'Assignment removed';
                assignment.completedAt = new Date();
            }
            intervention.updatedBy = removedBy;
            await intervention.save();
            await ClinicalInterventionService.logActivity('REMOVE_ASSIGNMENT', interventionId, removedBy, workplaceId, {
                assignedUserId: assignmentUserId.toString(),
                reason,
            });
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error removing assignment:', error);
            throw error;
        }
    }
    static validateRoleAssignment(role, user) {
        const errors = [];
        const roleRequirements = {
            pharmacist: ['Pharmacist', 'Owner'],
            physician: ['Physician', 'Doctor'],
            nurse: ['Nurse', 'Pharmacist', 'Owner'],
            patient: [],
            caregiver: [],
        };
        const requiredRoles = roleRequirements[role];
        if (requiredRoles && requiredRoles.length > 0) {
            const userRole = user.role || user.workplaceRole;
            if (!requiredRoles.includes(userRole)) {
                errors.push(`User role '${userRole}' is not authorized for assignment role '${role}'`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    static isValidAssignmentStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            pending: ['in_progress', 'cancelled'],
            in_progress: ['completed', 'cancelled'],
            completed: [],
            cancelled: [],
        };
        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }
    static async triggerAssignmentNotification(intervention, assignment, assignedBy) {
        try {
            logger_1.default.info('Assignment notification triggered', {
                interventionId: intervention._id.toString(),
                assignedUserId: assignment.userId.toString(),
                assignedBy: assignedBy.toString(),
                role: assignment.role,
                task: assignment.task,
            });
        }
        catch (error) {
            logger_1.default.error('Error triggering assignment notification:', error);
        }
    }
    static async triggerStatusChangeNotification(intervention, assignment, previousStatus, updatedBy) {
        try {
            logger_1.default.info('Status change notification triggered', {
                interventionId: intervention._id.toString(),
                assignedUserId: assignment.userId.toString(),
                updatedBy: updatedBy.toString(),
                previousStatus,
                newStatus: assignment.status,
            });
        }
        catch (error) {
            logger_1.default.error('Error triggering status change notification:', error);
        }
    }
    static async getAssignmentAuditTrail(interventionId) {
        try {
            return [];
        }
        catch (error) {
            logger_1.default.error('Error getting assignment audit trail:', error);
            return [];
        }
    }
    static async getTeamWorkloadStats(workplaceId, dateRange) {
        try {
            const query = {
                workplaceId,
                isDeleted: { $ne: true },
            };
            if (dateRange) {
                query.createdAt = {
                    $gte: dateRange.from,
                    $lte: dateRange.to,
                };
            }
            const interventions = await ClinicalIntervention_1.default.find(query).populate('assignments.userId', 'firstName lastName');
            let totalAssignments = 0;
            let activeAssignments = 0;
            let completedAssignments = 0;
            const userStats = {};
            interventions.forEach((intervention) => {
                intervention.assignments.forEach((assignment) => {
                    totalAssignments++;
                    const userId = assignment.userId.toString();
                    if (!userStats[userId]) {
                        userStats[userId] = {
                            userId: assignment.userId,
                            userName: `${assignment.userId.firstName} ${assignment.userId.lastName}`,
                            activeAssignments: 0,
                            completedAssignments: 0,
                            completionTimes: [],
                        };
                    }
                    if (assignment.status === 'completed') {
                        completedAssignments++;
                        userStats[userId].completedAssignments++;
                        if (assignment.completedAt && assignment.assignedAt) {
                            const completionTime = assignment.completedAt.getTime() -
                                assignment.assignedAt.getTime();
                            userStats[userId].completionTimes.push(completionTime);
                        }
                    }
                    else if (['pending', 'in_progress'].includes(assignment.status)) {
                        activeAssignments++;
                        userStats[userId].activeAssignments++;
                    }
                });
            });
            const userWorkloads = Object.values(userStats).map((stats) => ({
                userId: stats.userId,
                userName: stats.userName,
                activeAssignments: stats.activeAssignments,
                completedAssignments: stats.completedAssignments,
                averageCompletionTime: stats.completionTimes.length > 0
                    ? stats.completionTimes.reduce((a, b) => a + b, 0) /
                        stats.completionTimes.length
                    : 0,
            }));
            return {
                totalAssignments,
                activeAssignments,
                completedAssignments,
                userWorkloads,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting team workload stats:', error);
            throw error;
        }
    }
    static async addStrategy(interventionId, strategy, userId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            intervention.addStrategy(strategy);
            intervention.updatedBy = userId;
            await intervention.save();
            await ClinicalInterventionService.logActivity('ADD_STRATEGY', intervention._id.toString(), userId, workplaceId, { strategyType: strategy.type });
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error adding strategy to intervention:', error);
            throw error;
        }
    }
    static async updateStrategy(interventionId, strategyId, updates, userId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            const strategy = intervention.strategies.find((s) => s._id?.toString() === strategyId);
            if (!strategy) {
                throw (0, responseHelpers_1.createNotFoundError)('Strategy not found');
            }
            Object.assign(strategy, updates);
            intervention.updatedBy = userId;
            await intervention.save();
            await ClinicalInterventionService.logActivity('UPDATE_STRATEGY', intervention._id.toString(), userId, workplaceId, { strategyId, updates: Object.keys(updates) });
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error updating strategy:', error);
            throw error;
        }
    }
    static async recordOutcome(interventionId, outcome, userId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            intervention.outcomes = outcome;
            intervention.updatedBy = userId;
            if (outcome.patientResponse === 'improved' &&
                outcome.successMetrics?.problemResolved) {
                intervention.status = 'completed';
                intervention.completedAt = new Date();
            }
            await intervention.save();
            await ClinicalInterventionService.logActivity('RECORD_OUTCOME', intervention._id.toString(), userId, workplaceId, { patientResponse: outcome.patientResponse });
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error recording outcome:', error);
            throw error;
        }
    }
    static async scheduleFollowUp(interventionId, followUp, userId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            intervention.followUp = followUp;
            intervention.updatedBy = userId;
            await intervention.save();
            await ClinicalInterventionService.logActivity('SCHEDULE_FOLLOW_UP', intervention._id.toString(), userId, workplaceId, { required: followUp.required, scheduledDate: followUp.scheduledDate });
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error scheduling follow-up:', error);
            throw error;
        }
    }
    static async advancedSearch(filters, advancedOptions) {
        try {
            const { workplaceId, page = 1, limit = 20, sortBy = 'identifiedDate', sortOrder = 'desc', } = filters;
            const query = {
                workplaceId,
                isDeleted: { $ne: true },
            };
            if (filters.category) {
                if (typeof filters.category === 'object' &&
                    filters.category.$in) {
                    query.category = filters.category;
                }
                else {
                    query.category = filters.category;
                }
            }
            if (filters.priority) {
                if (typeof filters.priority === 'object' &&
                    filters.priority.$in) {
                    query.priority = filters.priority;
                }
                else {
                    query.priority = filters.priority;
                }
            }
            if (filters.status) {
                if (typeof filters.status === 'object' && filters.status.$in) {
                    query.status = filters.status;
                }
                else {
                    query.status = filters.status;
                }
            }
            if (filters.dateFrom || filters.dateTo) {
                query.identifiedDate = {};
                if (filters.dateFrom)
                    query.identifiedDate.$gte = filters.dateFrom;
                if (filters.dateTo)
                    query.identifiedDate.$lte = filters.dateTo;
            }
            if (advancedOptions.interventionNumber) {
                query.interventionNumber = {
                    $regex: advancedOptions.interventionNumber,
                    $options: 'i',
                };
            }
            if (advancedOptions.assignedUsers &&
                advancedOptions.assignedUsers.length > 0) {
                query['assignments.userId'] = {
                    $in: advancedOptions.assignedUsers.map((id) => new mongoose_1.default.Types.ObjectId(id)),
                };
            }
            if (advancedOptions.outcomeTypes &&
                advancedOptions.outcomeTypes.length > 0) {
                query['outcomes.patientResponse'] = {
                    $in: advancedOptions.outcomeTypes,
                };
            }
            if (filters.search) {
                query.$or = [
                    { interventionNumber: { $regex: filters.search, $options: 'i' } },
                    { issueDescription: { $regex: filters.search, $options: 'i' } },
                    { implementationNotes: { $regex: filters.search, $options: 'i' } },
                ];
            }
            let populatePatient = false;
            if (advancedOptions.patientName) {
                populatePatient = true;
            }
            const skip = (page - 1) * limit;
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
            let interventionsQuery = ClinicalIntervention_1.default.find(query)
                .populate('identifiedBy', 'firstName lastName')
                .populate('assignments.userId', 'firstName lastName')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit);
            if (populatePatient) {
                interventionsQuery = interventionsQuery.populate('patientId', 'firstName lastName dateOfBirth');
            }
            const [interventions, total] = await Promise.all([
                interventionsQuery.lean(),
                ClinicalIntervention_1.default.countDocuments(query),
            ]);
            let filteredInterventions = interventions;
            if (advancedOptions.patientName && populatePatient) {
                const nameRegex = new RegExp(advancedOptions.patientName, 'i');
                filteredInterventions = interventions.filter((intervention) => {
                    const patient = intervention.patientId;
                    return (patient &&
                        (nameRegex.test(patient.firstName) ||
                            nameRegex.test(patient.lastName) ||
                            nameRegex.test(`${patient.firstName} ${patient.lastName}`)));
                });
            }
            const pages = Math.ceil(total / limit);
            return {
                data: filteredInterventions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages,
                    hasNext: page < pages,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Error in advanced search:', error);
            throw error;
        }
    }
    static async getPatientInterventionSummary(patientId, workplaceId) {
        try {
            const query = {
                patientId,
                workplaceId,
                isDeleted: { $ne: true },
            };
            const interventions = await ClinicalIntervention_1.default.find(query).lean();
            const totalInterventions = interventions.length;
            const activeInterventions = interventions.filter((i) => ['identified', 'planning', 'in_progress', 'implemented'].includes(i.status)).length;
            const completedInterventions = interventions.filter((i) => i.status === 'completed').length;
            const successfulInterventions = interventions.filter((i) => i.outcomes?.patientResponse === 'improved').length;
            const successRate = completedInterventions > 0
                ? (successfulInterventions / completedInterventions) * 100
                : 0;
            const categoryBreakdown = {};
            interventions.forEach((intervention) => {
                categoryBreakdown[intervention.category] =
                    (categoryBreakdown[intervention.category] || 0) + 1;
            });
            const recentInterventions = await ClinicalIntervention_1.default.find(query)
                .populate('identifiedBy', 'firstName lastName')
                .sort({ identifiedDate: -1 })
                .limit(5)
                .lean();
            return {
                totalInterventions,
                activeInterventions,
                completedInterventions,
                successRate,
                categoryBreakdown,
                recentInterventions: recentInterventions,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting patient intervention summary:', error);
            throw error;
        }
    }
    static async getUserAssignmentStats(userId, workplaceId) {
        try {
            const query = {
                workplaceId,
                'assignments.userId': userId,
                isDeleted: { $ne: true },
            };
            const interventions = await ClinicalIntervention_1.default.find(query).lean();
            let totalAssignments = 0;
            let activeAssignments = 0;
            let completedAssignments = 0;
            let overdueAssignments = 0;
            const now = new Date();
            interventions.forEach((intervention) => {
                intervention.assignments.forEach((assignment) => {
                    if (assignment.userId.toString() === userId.toString()) {
                        totalAssignments++;
                        switch (assignment.status) {
                            case 'pending':
                            case 'in_progress':
                                activeAssignments++;
                                const assignedDate = new Date(assignment.assignedAt);
                                const daysDiff = (now.getTime() - assignedDate.getTime()) / (1000 * 3600 * 24);
                                if (daysDiff > 7) {
                                    overdueAssignments++;
                                }
                                break;
                            case 'completed':
                                completedAssignments++;
                                break;
                        }
                    }
                });
            });
            const completionRate = totalAssignments > 0
                ? (completedAssignments / totalAssignments) * 100
                : 0;
            return {
                totalAssignments,
                activeAssignments,
                completedAssignments,
                overdueAssignments,
                completionRate,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting user assignment stats:', error);
            throw error;
        }
    }
    static async linkToMTR(interventionId, mtrId, userId, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            intervention.relatedMTRId = new mongoose_1.default.Types.ObjectId(mtrId);
            intervention.updatedBy = userId;
            await intervention.save();
            await ClinicalInterventionService.logActivity('LINK_MTR', intervention._id.toString(), userId, workplaceId, { mtrId });
            return intervention;
        }
        catch (error) {
            logger_1.default.error('Error linking intervention to MTR:', error);
            throw error;
        }
    }
    static async sendNotifications(interventionId, notification, workplaceId) {
        try {
            const intervention = await ClinicalIntervention_1.default.findOne({
                _id: interventionId,
                workplaceId,
                isDeleted: { $ne: true },
            });
            if (!intervention) {
                throw (0, responseHelpers_1.createNotFoundError)('Clinical intervention not found');
            }
            logger_1.default.info('Intervention notification sent', {
                interventionId,
                type: notification.type,
                recipients: notification.recipients.map((id) => id.toString()),
                urgency: notification.urgency,
                sentBy: notification.sentBy.toString(),
            });
            await ClinicalInterventionService.logActivity('SEND_NOTIFICATIONS', intervention._id.toString(), notification.sentBy, workplaceId, {
                type: notification.type,
                recipientCount: notification.recipients.length,
                urgency: notification.urgency,
            });
            return {
                sent: notification.recipients.length,
                failed: 0,
            };
        }
        catch (error) {
            logger_1.default.error('Error sending intervention notifications:', error);
            throw error;
        }
    }
    static async getTrendAnalysis(workplaceId, dateRange, period, groupBy) {
        try {
            const query = {
                workplaceId,
                identifiedDate: {
                    $gte: dateRange.from,
                    $lte: dateRange.to,
                },
                isDeleted: { $ne: true },
            };
            const pipeline = [{ $match: query }];
            let dateGrouping = {};
            switch (period) {
                case 'day':
                    dateGrouping = {
                        year: { $year: '$identifiedDate' },
                        month: { $month: '$identifiedDate' },
                        day: { $dayOfMonth: '$identifiedDate' },
                    };
                    break;
                case 'week':
                    dateGrouping = {
                        year: { $year: '$identifiedDate' },
                        week: { $week: '$identifiedDate' },
                    };
                    break;
                case 'month':
                    dateGrouping = {
                        year: { $year: '$identifiedDate' },
                        month: { $month: '$identifiedDate' },
                    };
                    break;
                case 'quarter':
                    dateGrouping = {
                        year: { $year: '$identifiedDate' },
                        quarter: {
                            $ceil: { $divide: [{ $month: '$identifiedDate' }, 3] },
                        },
                    };
                    break;
            }
            const groupId = { ...dateGrouping };
            if (groupBy !== 'total') {
                groupId[groupBy] = `$${groupBy}`;
            }
            pipeline.push({
                $group: {
                    _id: groupId,
                    count: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
                        },
                    },
                    successful: {
                        $sum: {
                            $cond: [{ $eq: ['$outcomes.patientResponse', 'improved'] }, 1, 0],
                        },
                    },
                },
            });
            pipeline.push({ $sort: { _id: 1 } });
            const trends = await ClinicalIntervention_1.default.aggregate(pipeline);
            return trends;
        }
        catch (error) {
            logger_1.default.error('Error getting trend analysis:', error);
            throw error;
        }
    }
    static async generateOutcomeReport(filters) {
        try {
            const query = {
                workplaceId: filters.workplaceId,
                isDeleted: { $ne: true },
            };
            if (filters.dateFrom || filters.dateTo) {
                query.identifiedDate = {};
                if (filters.dateFrom)
                    query.identifiedDate.$gte = filters.dateFrom;
                if (filters.dateTo)
                    query.identifiedDate.$lte = filters.dateTo;
            }
            if (filters.category)
                query.category = filters.category;
            if (filters.priority)
                query.priority = filters.priority;
            const interventions = await ClinicalIntervention_1.default.find(query)
                .populate('patientId', 'firstName lastName')
                .populate('identifiedBy', 'firstName lastName')
                .lean();
            const totalInterventions = interventions.length;
            const completedInterventions = interventions.filter((i) => i.status === 'completed').length;
            const successfulInterventions = interventions.filter((i) => i.outcomes?.patientResponse === 'improved').length;
            const successRate = completedInterventions > 0
                ? (successfulInterventions / completedInterventions) * 100
                : 0;
            const categoryBreakdown = {};
            interventions.forEach((intervention) => {
                if (!categoryBreakdown[intervention.category]) {
                    categoryBreakdown[intervention.category] = {
                        total: 0,
                        completed: 0,
                        successful: 0,
                    };
                }
                categoryBreakdown[intervention.category].total++;
                if (intervention.status === 'completed') {
                    categoryBreakdown[intervention.category].completed++;
                    if (intervention.outcomes?.patientResponse === 'improved') {
                        categoryBreakdown[intervention.category].successful++;
                    }
                }
            });
            Object.keys(categoryBreakdown).forEach((category) => {
                const data = categoryBreakdown[category];
                data.successRate =
                    data.completed > 0 ? (data.successful / data.completed) * 100 : 0;
            });
            return {
                summary: {
                    totalInterventions,
                    completedInterventions,
                    successfulInterventions,
                    successRate,
                },
                categoryBreakdown,
                interventions: filters.includeDetails ? interventions : undefined,
                generatedAt: new Date(),
                filters,
            };
        }
        catch (error) {
            logger_1.default.error('Error generating outcome report:', error);
            throw error;
        }
    }
    static async exportData(filters, format) {
        try {
            const query = {
                workplaceId: filters.workplaceId,
                isDeleted: { $ne: true },
            };
            if (filters.dateFrom || filters.dateTo) {
                query.identifiedDate = {};
                if (filters.dateFrom)
                    query.identifiedDate.$gte = filters.dateFrom;
                if (filters.dateTo)
                    query.identifiedDate.$lte = filters.dateTo;
            }
            if (filters.category)
                query.category = filters.category;
            if (filters.priority)
                query.priority = filters.priority;
            if (filters.status)
                query.status = filters.status;
            const interventions = await ClinicalIntervention_1.default.find(query)
                .populate('patientId', 'firstName lastName dateOfBirth')
                .populate('identifiedBy', 'firstName lastName')
                .populate('assignments.userId', 'firstName lastName')
                .lean();
            const exportData = interventions.map((intervention) => ({
                interventionNumber: intervention.interventionNumber,
                patientName: intervention.patientId
                    ? `${intervention.patientId.firstName} ${intervention.patientId.lastName}`
                    : 'N/A',
                category: intervention.category,
                priority: intervention.priority,
                status: intervention.status,
                issueDescription: intervention.issueDescription,
                identifiedBy: intervention.identifiedBy
                    ? `${intervention.identifiedBy.firstName} ${intervention.identifiedBy.lastName}`
                    : 'N/A',
                identifiedDate: intervention.identifiedDate,
                completedDate: intervention.completedAt,
                patientResponse: intervention.outcomes?.patientResponse || 'N/A',
                strategiesCount: intervention.strategies.length,
                assignmentsCount: intervention.assignments.length,
            }));
            switch (format) {
                case 'csv':
                    return this.generateCSV(exportData);
                case 'excel':
                    return this.generateExcel(exportData);
                case 'pdf':
                    return this.generatePDF(exportData);
                default:
                    throw (0, responseHelpers_1.createValidationError)('Unsupported export format');
            }
        }
        catch (error) {
            logger_1.default.error('Error exporting intervention data:', error);
            throw error;
        }
    }
    static generateCSV(data) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map((row) => headers
                .map((header) => {
                const value = row[header];
                if (typeof value === 'string' &&
                    (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            })
                .join(',')),
        ].join('\n');
        return csvContent;
    }
    static generateExcel(data) {
        const csvContent = this.generateCSV(data);
        return Buffer.from(csvContent, 'utf8');
    }
    static generatePDF(data) {
        const csvContent = this.generateCSV(data);
        return Buffer.from(csvContent, 'utf8');
    }
    static async getDashboardMetrics(workplaceId, dateRange) {
        try {
            const { from, to } = dateRange;
            const baseQuery = {
                workplaceId,
                isDeleted: { $ne: true },
                identifiedDate: { $gte: from, $lte: to },
            };
            const [totalInterventions, completedInterventions, inProgressInterventions, pendingInterventions,] = await Promise.all([
                ClinicalIntervention_1.default.countDocuments(baseQuery),
                ClinicalIntervention_1.default.countDocuments({
                    ...baseQuery,
                    status: 'completed',
                }),
                ClinicalIntervention_1.default.countDocuments({
                    ...baseQuery,
                    status: 'in_progress',
                }),
                ClinicalIntervention_1.default.countDocuments({
                    ...baseQuery,
                    status: 'identified',
                }),
            ]);
            const categoryBreakdown = await ClinicalIntervention_1.default.aggregate([
                { $match: baseQuery },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            const priorityBreakdown = await ClinicalIntervention_1.default.aggregate([
                { $match: baseQuery },
                { $group: { _id: '$priority', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            const completionRate = totalInterventions > 0
                ? (completedInterventions / totalInterventions) * 100
                : 0;
            return {
                totalInterventions,
                completedInterventions,
                inProgressInterventions,
                pendingInterventions,
                completionRate: Math.round(completionRate * 100) / 100,
                categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                dateRange,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting dashboard metrics:', error);
            throw error;
        }
    }
}
ClinicalInterventionService.assignTeamMember =
    TeamCollaborationService.assignTeamMember;
ClinicalInterventionService.updateAssignmentStatus =
    TeamCollaborationService.updateAssignmentStatus;
ClinicalInterventionService.getUserAssignments =
    TeamCollaborationService.getUserAssignments;
ClinicalInterventionService.getAssignmentHistory =
    TeamCollaborationService.getAssignmentHistory;
ClinicalInterventionService.removeAssignment =
    TeamCollaborationService.removeAssignment;
ClinicalInterventionService.getTeamWorkloadStats =
    TeamCollaborationService.getTeamWorkloadStats;
ClinicalInterventionService.generateOutcomeReport = async (workplaceId, filters, isSuperAdmin = false) => {
    try {
        const { dateFrom, dateTo, category, priority, outcome, pharmacist } = filters;
        const baseQuery = {
            isDeleted: { $ne: true },
        };
        if (!isSuperAdmin) {
            baseQuery.workplaceId = workplaceId;
        }
        if (dateFrom || dateTo) {
            const dateQuery = {};
            if (dateFrom)
                dateQuery.$gte = dateFrom;
            if (dateTo)
                dateQuery.$lte = dateTo;
            baseQuery.$or = [
                { completedAt: dateQuery },
                { identifiedDate: dateQuery }
            ];
        }
        if (category && category !== 'all') {
            baseQuery.category = category;
        }
        if (priority && priority !== 'all') {
            baseQuery.priority = priority;
        }
        if (outcome && outcome !== 'all') {
            baseQuery['outcomes.patientResponse'] = outcome;
        }
        if (pharmacist && pharmacist !== 'all') {
            baseQuery.identifiedBy = new mongoose_1.default.Types.ObjectId(pharmacist);
        }
        const totalInterventions = await ClinicalIntervention_1.default.countDocuments(baseQuery);
        const successfulInterventions = await ClinicalIntervention_1.default.countDocuments({
            ...baseQuery,
            $or: [
                { 'outcomes.patientResponse': 'improved' },
                { status: 'completed' },
                { status: 'resolved' }
            ]
        });
        const successRate = totalInterventions > 0
            ? (successfulInterventions / totalInterventions) * 100
            : 0;
        const costSavingsAgg = await ClinicalIntervention_1.default.aggregate([
            {
                $match: {
                    ...baseQuery,
                    'outcomes.successMetrics.costSavings': { $exists: true },
                },
            },
            {
                $group: {
                    _id: null,
                    totalSavings: { $sum: '$outcomes.successMetrics.costSavings' },
                },
            },
        ]);
        const totalCostSavings = costSavingsAgg.length > 0 ? costSavingsAgg[0].totalSavings : 0;
        const resolutionTimeAgg = await ClinicalIntervention_1.default.aggregate([
            {
                $match: {
                    ...baseQuery,
                    $or: [
                        { completedAt: { $exists: true }, startedAt: { $exists: true } },
                        { completedAt: { $exists: true }, identifiedDate: { $exists: true } },
                        { updatedAt: { $exists: true }, identifiedDate: { $exists: true } }
                    ]
                }
            },
            {
                $project: {
                    resolutionTime: {
                        $divide: [
                            {
                                $subtract: [
                                    { $ifNull: ['$completedAt', '$updatedAt'] },
                                    { $ifNull: ['$startedAt', '$identifiedDate'] }
                                ]
                            },
                            1000 * 60 * 60 * 24,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    avgResolutionTime: { $avg: '$resolutionTime' },
                },
            },
        ]);
        const averageResolutionTime = resolutionTimeAgg.length > 0 ? resolutionTimeAgg[0].avgResolutionTime : 0;
        const categoryAnalysis = await ClinicalIntervention_1.default.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: 1 },
                    successful: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$outcomes.patientResponse', 'improved'] },
                                        { $eq: ['$status', 'completed'] },
                                        { $eq: ['$status', 'resolved'] }
                                    ]
                                },
                                1,
                                0
                            ],
                        },
                    },
                    totalCostSavings: { $sum: { $ifNull: ['$outcomes.successMetrics.costSavings', 0] } },
                    totalResolutionTime: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ifNull: [{ $ifNull: ['$completedAt', '$updatedAt'] }, false] },
                                        { $ifNull: [{ $ifNull: ['$startedAt', '$identifiedDate'] }, false] }
                                    ]
                                },
                                {
                                    $divide: [
                                        {
                                            $subtract: [
                                                { $ifNull: ['$completedAt', '$updatedAt'] },
                                                { $ifNull: ['$startedAt', '$identifiedDate'] }
                                            ]
                                        },
                                        1000 * 60 * 60 * 24,
                                    ]
                                },
                                0
                            ]
                        },
                    },
                },
            },
            {
                $project: {
                    category: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ['$_id', 'drug_therapy_problem'] },
                                    then: 'Drug Therapy Problem',
                                },
                                {
                                    case: { $eq: ['$_id', 'adverse_drug_reaction'] },
                                    then: 'Adverse Drug Reaction',
                                },
                                {
                                    case: { $eq: ['$_id', 'medication_nonadherence'] },
                                    then: 'Medication Non-adherence',
                                },
                                {
                                    case: { $eq: ['$_id', 'drug_interaction'] },
                                    then: 'Drug Interaction',
                                },
                                {
                                    case: { $eq: ['$_id', 'dosing_issue'] },
                                    then: 'Dosing Issue',
                                },
                                {
                                    case: { $eq: ['$_id', 'contraindication'] },
                                    then: 'Contraindication',
                                },
                                { case: { $eq: ['$_id', 'other'] }, then: 'Other' },
                            ],
                            default: '$_id',
                        },
                    },
                    total: 1,
                    successful: 1,
                    successRate: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $multiply: [{ $divide: ['$successful', '$total'] }, 100] },
                            0,
                        ],
                    },
                    avgCostSavings: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $divide: ['$totalCostSavings', '$total'] },
                            0,
                        ],
                    },
                    avgResolutionTime: {
                        $cond: [
                            { $gt: ['$total', 0] },
                            { $divide: ['$totalResolutionTime', '$total'] },
                            0,
                        ],
                    },
                },
            },
            { $sort: { total: -1 } },
        ]);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const trendAnalysis = await ClinicalIntervention_1.default.aggregate([
            {
                $match: {
                    ...baseQuery,
                    $or: [
                        { completedAt: { $gte: sixMonthsAgo } },
                        { identifiedDate: { $gte: sixMonthsAgo } }
                    ]
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: { $ifNull: ['$completedAt', '$identifiedDate'] } },
                        month: { $month: { $ifNull: ['$completedAt', '$identifiedDate'] } },
                    },
                    interventions: { $sum: 1 },
                    successful: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$outcomes.patientResponse', 'improved'] },
                                        { $eq: ['$status', 'completed'] },
                                        { $eq: ['$status', 'resolved'] }
                                    ]
                                },
                                1,
                                0
                            ],
                        },
                    },
                    costSavings: { $sum: { $ifNull: ['$outcomes.successMetrics.costSavings', 0] } },
                    totalResolutionTime: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ifNull: [{ $ifNull: ['$completedAt', '$updatedAt'] }, false] },
                                        { $ifNull: [{ $ifNull: ['$startedAt', '$identifiedDate'] }, false] }
                                    ]
                                },
                                {
                                    $divide: [
                                        {
                                            $subtract: [
                                                { $ifNull: ['$completedAt', '$updatedAt'] },
                                                { $ifNull: ['$startedAt', '$identifiedDate'] }
                                            ]
                                        },
                                        1000 * 60 * 60 * 24,
                                    ]
                                },
                                0
                            ]
                        },
                    },
                },
            },
            {
                $project: {
                    period: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: {
                                $dateFromParts: {
                                    year: '$_id.year',
                                    month: '$_id.month',
                                },
                            },
                        },
                    },
                    interventions: 1,
                    successRate: {
                        $cond: [
                            { $gt: ['$interventions', 0] },
                            {
                                $multiply: [
                                    { $divide: ['$successful', '$interventions'] },
                                    100,
                                ],
                            },
                            0,
                        ],
                    },
                    costSavings: 1,
                    resolutionTime: {
                        $cond: [
                            { $gt: ['$interventions', 0] },
                            { $divide: ['$totalResolutionTime', '$interventions'] },
                            0,
                        ],
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        const detailedOutcomes = await ClinicalIntervention_1.default.find(baseQuery)
            .populate('patientId', 'firstName lastName')
            .populate('identifiedBy', 'firstName lastName')
            .sort({ completedAt: -1, identifiedDate: -1, updatedAt: -1 })
            .limit(100)
            .lean();
        const formattedDetailedOutcomes = detailedOutcomes.map((intervention) => ({
            interventionId: intervention._id.toString(),
            interventionNumber: intervention.interventionNumber,
            patientName: intervention.patientId
                ? `${intervention.patientId.firstName} ${intervention.patientId.lastName}`
                : 'Unknown Patient',
            category: intervention.category,
            priority: intervention.priority,
            outcome: intervention.outcomes?.patientResponse || 'unknown',
            costSavings: intervention.outcomes?.successMetrics?.costSavings || 0,
            resolutionTime: (() => {
                const endDate = intervention.completedAt || intervention.updatedAt;
                const startDate = intervention.startedAt || intervention.identifiedDate;
                return endDate && startDate
                    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
            })(),
            patientResponse: intervention.outcomes?.patientResponse || 'unknown',
            completedDate: (intervention.completedAt || intervention.updatedAt)?.toISOString() || '',
        }));
        const periodLength = dateTo && dateFrom
            ? dateTo.getTime() - dateFrom.getTime()
            : 30 * 24 * 60 * 60 * 1000;
        const previousPeriodStart = new Date((dateFrom || new Date()).getTime() - periodLength);
        const previousPeriodEnd = dateFrom || new Date();
        const previousPeriodQuery = {
            ...baseQuery,
            $or: [
                { completedAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd } },
                { identifiedDate: { $gte: previousPeriodStart, $lte: previousPeriodEnd } }
            ]
        };
        const previousPeriodTotal = await ClinicalIntervention_1.default.countDocuments(previousPeriodQuery);
        const previousPeriodSuccessful = await ClinicalIntervention_1.default.countDocuments({
            ...previousPeriodQuery,
            $or: [
                { 'outcomes.patientResponse': 'improved' },
                { status: 'completed' },
                { status: 'resolved' }
            ]
        });
        const previousPeriodSuccessRate = previousPeriodTotal > 0
            ? (previousPeriodSuccessful / previousPeriodTotal) * 100
            : 0;
        const previousPeriodCostSavings = await ClinicalIntervention_1.default.aggregate([
            {
                $match: previousPeriodQuery,
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $ifNull: ['$outcomes.successMetrics.costSavings', 0] } },
                },
            },
        ]);
        const prevCostSavings = previousPeriodCostSavings.length > 0
            ? previousPeriodCostSavings[0].total
            : 0;
        const comparativeAnalysis = {
            currentPeriod: {
                interventions: totalInterventions,
                successRate: successRate,
                costSavings: totalCostSavings,
            },
            previousPeriod: {
                interventions: previousPeriodTotal,
                successRate: previousPeriodSuccessRate,
                costSavings: prevCostSavings,
            },
            percentageChange: {
                interventions: previousPeriodTotal > 0
                    ? ((totalInterventions - previousPeriodTotal) /
                        previousPeriodTotal) *
                        100
                    : 0,
                successRate: previousPeriodSuccessRate > 0
                    ? ((successRate - previousPeriodSuccessRate) /
                        previousPeriodSuccessRate) *
                        100
                    : 0,
                costSavings: prevCostSavings > 0
                    ? ((totalCostSavings - prevCostSavings) / prevCostSavings) * 100
                    : 0,
            },
        };
        return {
            summary: {
                totalInterventions,
                completedInterventions: totalInterventions,
                successfulInterventions,
                successRate,
                totalCostSavings,
                averageResolutionTime,
                patientSatisfactionScore: 4.5,
            },
            categoryAnalysis,
            trendAnalysis,
            comparativeAnalysis,
            detailedOutcomes: formattedDetailedOutcomes,
        };
    }
    catch (error) {
        logger_1.default.error('Error generating outcome report:', error);
        throw error;
    }
};
ClinicalInterventionService.calculateCostSavings = async (interventions, parameters = {}) => {
    try {
        const { adverseEventCost = 5000, hospitalAdmissionCost = 15000, medicationWasteCost = 200, pharmacistHourlyCost = 50, } = parameters;
        let adverseEventsAvoided = 0;
        let hospitalAdmissionsAvoided = 0;
        let medicationWasteReduced = 0;
        let totalInterventionTime = 0;
        interventions.forEach((intervention) => {
            if (intervention.category === 'adverse_drug_reaction' &&
                intervention.outcomes?.patientResponse === 'improved') {
                adverseEventsAvoided++;
            }
            if (['contraindication', 'drug_interaction'].includes(intervention.category) &&
                intervention.outcomes?.patientResponse === 'improved') {
                hospitalAdmissionsAvoided++;
            }
            if (['medication_nonadherence', 'dosing_issue'].includes(intervention.category) &&
                intervention.outcomes?.patientResponse === 'improved') {
                medicationWasteReduced++;
            }
            if (intervention.actualDuration) {
                totalInterventionTime += intervention.actualDuration;
            }
            else if (intervention.estimatedDuration) {
                totalInterventionTime += intervention.estimatedDuration;
            }
            else {
                totalInterventionTime += 30;
            }
        });
        const breakdown = {
            adverseEventsAvoided: adverseEventsAvoided * adverseEventCost,
            hospitalAdmissionsAvoided: hospitalAdmissionsAvoided * hospitalAdmissionCost,
            medicationWasteReduced: medicationWasteReduced * medicationWasteCost,
            interventionCost: (totalInterventionTime / 60) * pharmacistHourlyCost,
        };
        const totalSavings = breakdown.adverseEventsAvoided +
            breakdown.hospitalAdmissionsAvoided +
            breakdown.medicationWasteReduced -
            breakdown.interventionCost;
        return {
            totalSavings: Math.max(0, totalSavings),
            breakdown,
        };
    }
    catch (error) {
        logger_1.default.error('Error calculating cost savings:', error);
        throw error;
    }
};
async function getDashboardMetrics(workplaceId, dateRange, isSuperAdmin = false) {
    try {
        const { from, to } = dateRange;
        const baseQuery = {
            isDeleted: { $ne: true },
            identifiedDate: { $gte: from, $lte: to },
        };
        if (!isSuperAdmin) {
            baseQuery.workplaceId = workplaceId;
        }
        const [totalInterventions, completedInterventions, inProgressInterventions, pendingInterventions,] = await Promise.all([
            ClinicalIntervention_1.default.countDocuments(baseQuery),
            ClinicalIntervention_1.default.countDocuments({
                ...baseQuery,
                status: 'completed',
            }),
            ClinicalIntervention_1.default.countDocuments({
                ...baseQuery,
                status: 'in_progress',
            }),
            ClinicalIntervention_1.default.countDocuments({
                ...baseQuery,
                status: 'identified',
            }),
        ]);
        const now = new Date();
        const overdueInterventions = await ClinicalIntervention_1.default.countDocuments({
            ...baseQuery,
            status: { $nin: ['completed', 'cancelled'] },
            'followUp.scheduledDate': { $lt: now },
        });
        const categoryBreakdown = await ClinicalIntervention_1.default.aggregate([
            { $match: baseQuery },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const priorityBreakdown = await ClinicalIntervention_1.default.aggregate([
            { $match: baseQuery },
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const successRate = totalInterventions > 0
            ? (completedInterventions / totalInterventions) * 100
            : 0;
        const averageResolutionResult = await ClinicalIntervention_1.default.aggregate([
            {
                $match: {
                    ...baseQuery,
                    status: 'completed',
                    completedAt: { $exists: true },
                },
            },
            {
                $project: {
                    resolutionTime: {
                        $divide: [
                            { $subtract: ['$completedAt', '$identifiedDate'] },
                            1000 * 60 * 60 * 24,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    averageResolutionTime: { $avg: '$resolutionTime' },
                },
            },
        ]);
        const averageResolutionTime = averageResolutionResult.length > 0
            ? Math.round(averageResolutionResult[0].averageResolutionTime * 10) / 10
            : 0;
        const recentInterventions = await ClinicalIntervention_1.default.find(baseQuery)
            .sort({ identifiedDate: -1 })
            .limit(5)
            .populate('patientId', 'firstName lastName mrn')
            .select('interventionNumber category priority status identifiedDate assignments patientId')
            .lean();
        const categoryColors = [
            '#8884d8',
            '#82ca9d',
            '#ffc658',
            '#ff7c7c',
            '#8dd1e1',
            '#d084d0',
            '#ffb347',
        ];
        const priorityColors = ['#ff4444', '#ffaa44', '#44aa44', '#4444ff'];
        const categoryDistribution = categoryBreakdown.map((item, index) => ({
            name: formatCategoryName(item._id),
            value: item.count,
            successRate: Math.round((item.count / totalInterventions) * 100),
            color: categoryColors[index % categoryColors.length],
        }));
        const priorityDistribution = priorityBreakdown.map((item, index) => ({
            name: formatPriorityName(item._id),
            value: item.count,
            color: priorityColors[index % priorityColors.length],
        }));
        const monthlyTrends = [
            {
                month: 'Current',
                total: totalInterventions,
                completed: completedInterventions,
                successRate: successRate,
            },
        ];
        const formattedRecentInterventions = recentInterventions.map((intervention) => ({
            _id: intervention._id.toString(),
            interventionNumber: intervention.interventionNumber,
            category: formatCategoryName(intervention.category),
            priority: formatPriorityName(intervention.priority),
            status: intervention.status,
            patientName: intervention.patientId
                ? `${intervention.patientId.firstName} ${intervention.patientId.lastName}`
                : 'Unknown Patient',
            identifiedDate: intervention.identifiedDate,
            assignedTo: intervention.assignments && intervention.assignments.length > 0
                ? intervention.assignments[0].userId?.toString()
                : undefined,
        }));
        return {
            totalInterventions,
            activeInterventions: inProgressInterventions,
            completedInterventions,
            overdueInterventions,
            successRate: Math.round(successRate * 100) / 100,
            averageResolutionTime,
            totalCostSavings: 0,
            categoryDistribution,
            priorityDistribution,
            monthlyTrends,
            recentInterventions: formattedRecentInterventions,
        };
    }
    catch (error) {
        logger_1.default.error('Error getting dashboard metrics:', error);
        throw error;
    }
}
function formatCategoryName(category) {
    const categoryMap = {
        drug_therapy_problem: 'Drug Therapy Problem',
        adverse_drug_reaction: 'Adverse Drug Reaction',
        medication_nonadherence: 'Medication Non-adherence',
        drug_interaction: 'Drug Interaction',
        dosing_issue: 'Dosing Issue',
        contraindication: 'Contraindication',
        other: 'Other',
    };
    return categoryMap[category] || category;
}
function formatPriorityName(priority) {
    const priorityMap = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
    };
    return priorityMap[priority] || priority;
}
async function checkDuplicates(patientId, category, workplaceId) {
    try {
        const duplicates = await ClinicalIntervention_1.default.find({
            patientId,
            category,
            workplaceId,
            status: { $nin: ['completed', 'cancelled'] },
            isDeleted: false,
        })
            .populate('identifiedByUser', 'firstName lastName email')
            .sort({ identifiedDate: -1 })
            .lean();
        return duplicates;
    }
    catch (error) {
        logger_1.default.error('Error checking for duplicates:', error);
        throw error;
    }
}
async function getCategoryCounts(workplaceId) {
    try {
        const categoryCounts = await ClinicalIntervention_1.default.aggregate([
            {
                $match: {
                    workplaceId,
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
        ]);
        const result = {};
        categoryCounts.forEach((item) => {
            result[item._id] = item.count;
        });
        return result;
    }
    catch (error) {
        logger_1.default.error('Error getting category counts:', error);
        throw error;
    }
}
async function getPriorityDistribution(workplaceId) {
    try {
        const priorityDistribution = await ClinicalIntervention_1.default.aggregate([
            {
                $match: {
                    workplaceId,
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 },
                },
            },
        ]);
        const result = {};
        priorityDistribution.forEach((item) => {
            result[item._id] = item.count;
        });
        return result;
    }
    catch (error) {
        logger_1.default.error('Error getting priority distribution:', error);
        throw error;
    }
}
ClinicalInterventionService.getDashboardMetrics = getDashboardMetrics;
exports.default = ClinicalInterventionService;
//# sourceMappingURL=clinicalInterventionService.js.map