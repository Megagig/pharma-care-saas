"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientDiagnosticSummary = exports.getPatientDiagnosticHistory = exports.searchPatientsWithInterventions = exports.getPatientInterventions = exports.getPatientSummary = exports.searchPatients = exports.deletePatient = exports.updatePatient = exports.createPatient = exports.getPatient = exports.getPatients = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Allergy_1 = __importDefault(require("../models/Allergy"));
const Condition_1 = __importDefault(require("../models/Condition"));
const MedicationRecord_1 = __importDefault(require("../models/MedicationRecord"));
const ClinicalAssessment_1 = __importDefault(require("../models/ClinicalAssessment"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const CarePlan_1 = __importDefault(require("../models/CarePlan"));
const Visit_1 = __importDefault(require("../models/Visit"));
const responseHelpers_1 = require("../utils/responseHelpers");
const cursorPagination_1 = require("../utils/cursorPagination");
exports.getPatients = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { cursor, limit = 20, sortField = 'createdAt', sortOrder = 'desc', q, name, mrn, phone, state, bloodGroup, genotype, page, useCursor = 'true', } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    console.log('🔍 GET /api/patients - Request Context:', {
        userId: context.userId,
        userRole: context.userRole,
        workplaceId: context.workplaceId,
        isAdmin: context.isAdmin,
        isSuperAdmin: context.isSuperAdmin,
        requestUser: {
            id: req.user?._id,
            email: req.user?.email,
            role: req.user?.role,
        }
    });
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));
    const filters = {};
    filters.isDeleted = { $ne: true };
    if (!context.isAdmin) {
        filters.workplaceId = context.workplaceId;
        console.log('🔒 Applying workspace filter:', context.workplaceId);
    }
    else {
        console.log('🔓 Super admin access - NO workspace filter applied');
    }
    if (q) {
        const searchRegex = new RegExp(q, 'i');
        filters.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { otherNames: searchRegex },
            { mrn: searchRegex },
            { phone: searchRegex },
            { email: searchRegex },
        ];
    }
    if (name) {
        const nameRegex = new RegExp(name, 'i');
        filters.$or = [
            { firstName: nameRegex },
            { lastName: nameRegex },
            { otherNames: nameRegex },
        ];
    }
    if (mrn)
        filters.mrn = new RegExp(mrn, 'i');
    if (phone)
        filters.phone = new RegExp(phone.replace('+', '\\+'), 'i');
    if (state)
        filters.state = state;
    if (bloodGroup)
        filters.bloodGroup = bloodGroup;
    if (genotype)
        filters.genotype = genotype;
    if (useCursor === 'true' && !page) {
        console.log('📄 Using cursor-based pagination with filters:', JSON.stringify(filters));
        const result = await cursorPagination_1.CursorPagination.paginate(Patient_1.default, {
            limit: parsedLimit,
            cursor,
            sortField,
            sortOrder: sortOrder,
            filters,
        });
        console.log('📊 Cursor Query Results:', {
            patientsFound: result.items.length,
            totalCount: result.totalCount,
            hasNextPage: result.pageInfo.hasNextPage
        });
        const response = cursorPagination_1.CursorPagination.createPaginatedResponse(result, `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`, { limit: parsedLimit, sortField, sortOrder, ...req.query });
        return (0, responseHelpers_1.sendSuccess)(res, { results: response.data }, `Found ${response.data.length} patients`, 200, {
            total: response.pagination.totalCount,
            limit: parsedLimit,
            hasNext: response.pagination.pageInfo.hasNextPage,
            nextCursor: response.pagination.cursors.next,
        });
    }
    else {
        const parsedPage = Math.max(1, parseInt(page) || 1);
        const [patients, total] = await Promise.all([
            Patient_1.default.find(filters)
                .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
                .limit(parsedLimit)
                .skip((parsedPage - 1) * parsedLimit)
                .select('-__v')
                .lean(),
            Patient_1.default.countDocuments(filters),
        ]);
        console.log('📊 Query Results:', {
            filters: JSON.stringify(filters),
            patientsFound: patients.length,
            totalCount: total,
            page: parsedPage,
            limit: parsedLimit
        });
        (0, responseHelpers_1.respondWithPaginatedResults)(res, patients, total, parsedPage, parsedLimit, `Found ${total} patients`);
    }
});
exports.getPatient = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(id)
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', id);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const responseData = {
        patient: {
            ...patient.toObject(),
            age: patient.getAge(),
            displayName: patient.getDisplayName(),
        },
    };
    (0, responseHelpers_1.sendSuccess)(res, responseData, 'Patient details retrieved successfully');
});
exports.createPatient = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { allergies, conditions, medications, assessment, dtps, carePlan, ...patientData } = req.body;
    responseHelpers_1.validateBusinessRules.validatePatientAge(patientData.dob, patientData.age);
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const workplaceCode = 'GEN';
        const mrn = await Patient_1.default.generateNextMRN(context.workplaceId, workplaceCode);
        const patient = new Patient_1.default({
            ...patientData,
            mrn,
            workplaceId: context.workplaceId,
            createdBy: context.userId,
            isDeleted: false,
        });
        await patient.save({ session });
        const relatedData = {};
        if (allergies?.length) {
            const allergyDocs = allergies.map((allergy) => ({
                ...allergy,
                patientId: patient._id,
                workplaceId: context.workplaceId,
                createdBy: context.userId,
            }));
            relatedData.allergies = await Allergy_1.default.insertMany(allergyDocs, {
                session,
            });
        }
        if (conditions?.length) {
            const conditionDocs = conditions.map((condition) => ({
                ...condition,
                patientId: patient._id,
                workplaceId: context.workplaceId,
                createdBy: context.userId,
            }));
            relatedData.conditions = await Condition_1.default.insertMany(conditionDocs, {
                session,
            });
        }
        if (medications?.length) {
            const medicationDocs = medications.map((medication) => ({
                ...medication,
                patientId: patient._id,
                workplaceId: context.workplaceId,
                createdBy: context.userId,
            }));
            relatedData.medications = await MedicationRecord_1.default.insertMany(medicationDocs, { session });
        }
        if (assessment?.vitals || assessment?.labs) {
            const assessmentDoc = new ClinicalAssessment_1.default({
                ...assessment,
                patientId: patient._id,
                workplaceId: context.workplaceId,
                createdBy: context.userId,
            });
            await assessmentDoc.save({ session });
            relatedData.assessment = assessmentDoc;
            if (assessment.vitals) {
                patient.latestVitals = {
                    ...assessment.vitals,
                    recordedAt: assessment.recordedAt || new Date(),
                };
                await patient.save({ session });
            }
        }
        if (dtps?.length) {
            const dtpDocs = dtps.map((dtp) => ({
                ...dtp,
                patientId: patient._id,
                workplaceId: context.workplaceId,
                createdBy: context.userId,
            }));
            const createdDTPs = await DrugTherapyProblem_1.default.insertMany(dtpDocs, {
                session,
            });
            relatedData.dtps = createdDTPs;
            const hasUnresolvedDTPs = createdDTPs.some((dtp) => dtp.status === 'unresolved');
            if (hasUnresolvedDTPs) {
                patient.hasActiveDTP = true;
                await patient.save({ session });
            }
        }
        if (carePlan) {
            const carePlanDoc = new CarePlan_1.default({
                ...carePlan,
                patientId: patient._id,
                workplaceId: context.workplaceId,
                createdBy: context.userId,
            });
            await carePlanDoc.save({ session });
            relatedData.carePlan = carePlanDoc;
        }
        await session.commitTransaction();
        console.log('Patient created:', (0, responseHelpers_1.createAuditLog)('CREATE_PATIENT', 'Patient', patient._id.toString(), context, { mrn: patient.mrn, name: patient.getDisplayName() }));
        (0, responseHelpers_1.sendSuccess)(res, {
            patient: {
                ...patient.toObject(),
                age: patient.getAge(),
                displayName: patient.getDisplayName(),
            },
            related: relatedData,
        }, 'Patient created successfully', 201);
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
exports.updatePatient = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const updates = req.body;
    const patient = await Patient_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', id);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (updates.dob || updates.age) {
        responseHelpers_1.validateBusinessRules.validatePatientAge(updates.dob || patient.dob, updates.age || patient.age);
    }
    Object.assign(patient, updates, {
        updatedBy: context.userId,
        updatedAt: new Date(),
    });
    await patient.save();
    console.log('Patient updated:', (0, responseHelpers_1.createAuditLog)('UPDATE_PATIENT', 'Patient', patient._id.toString(), context, { updates }));
    (0, responseHelpers_1.respondWithPatient)(res, patient, 'Patient updated successfully');
});
exports.deletePatient = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', id);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    patient.isDeleted = true;
    patient.updatedBy = context.userId;
    await patient.save();
    console.log('Patient deleted:', (0, responseHelpers_1.createAuditLog)('DELETE_PATIENT', 'Patient', patient._id.toString(), context, { mrn: patient.mrn, name: patient.getDisplayName() }));
    (0, responseHelpers_1.sendSuccess)(res, null, 'Patient deleted successfully');
});
exports.searchPatients = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { q, limit = 10 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!q) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Search query is required', 400);
    }
    const searchRegex = new RegExp(q, 'i');
    const query = {
        $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { otherNames: searchRegex },
            { mrn: searchRegex },
            { phone: searchRegex },
        ],
    };
    if (!context.isAdmin) {
        query.workplaceId = context.workplaceId;
    }
    const patients = await Patient_1.default.find(query)
        .select('_id firstName lastName otherNames mrn phone dob bloodGroup latestVitals')
        .limit(Math.min(parseInt(limit), 50))
        .sort('lastName firstName')
        .lean();
    console.log('🔍 Backend - Raw patients from DB:', patients.map(p => ({
        _id: p._id,
        hasId: !!p._id,
        idType: typeof p._id,
        firstName: p.firstName,
        mrn: p.mrn,
    })));
    const enrichedPatients = patients.map((patient) => {
        console.log('🔍 Backend - Raw patient from DB:', {
            _id: patient._id,
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            mrn: patient.mrn,
            keys: Object.keys(patient),
        });
        const enrichedPatient = {
            _id: patient._id?.toString() || patient._id || patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            otherNames: patient.otherNames,
            mrn: patient.mrn,
            phone: patient.phone,
            dob: patient.dob,
            bloodGroup: patient.bloodGroup,
            latestVitals: patient.latestVitals,
            displayName: `${patient.firstName} ${patient.lastName}`,
            age: patient.dob
                ? Math.floor((Date.now() - patient.dob.getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25))
                : null,
        };
        if (!enrichedPatient._id) {
            console.error('❌ Backend - Patient missing _id after enrichment:', patient);
            enrichedPatient._id = patient.mrn;
        }
        return enrichedPatient;
    });
    console.log('🔍 Backend - Enriched patients being sent:', enrichedPatients.map(p => ({
        _id: p._id,
        firstName: p.firstName,
        lastName: p.lastName,
        mrn: p.mrn,
    })));
    (0, responseHelpers_1.sendSuccess)(res, {
        patients: enrichedPatients,
        total: enrichedPatients.length,
        query: q,
    }, `Found ${enrichedPatients.length} patients`);
});
exports.getPatientSummary = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', id);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const [allergyCount, conditionCount, medicationCount, visitCount, interventionCount, activeInterventionCount] = await Promise.all([
        Allergy_1.default.countDocuments({ patientId: id, isDeleted: false }),
        Condition_1.default.countDocuments({ patientId: id, isDeleted: false }),
        MedicationRecord_1.default.countDocuments({
            patientId: id,
            isDeleted: false,
            phase: 'current',
        }),
        Visit_1.default.countDocuments({ patientId: id, isDeleted: false }),
        patient.getInterventionCount(),
        patient.getActiveInterventionCount(),
    ]);
    const summary = {
        patient: {
            id: patient._id,
            name: `${patient.firstName} ${patient.lastName}`,
            mrn: patient.mrn,
            age: patient.dob
                ? Math.floor((Date.now() - patient.dob.getTime()) /
                    (1000 * 60 * 60 * 24 * 365.25))
                : null,
            latestVitals: patient.latestVitals,
        },
        counts: {
            allergies: allergyCount,
            conditions: conditionCount,
            currentMedications: medicationCount,
            visits: visitCount,
            interventions: interventionCount,
            activeInterventions: activeInterventionCount,
            hasActiveDTP: patient.hasActiveDTP,
            hasActiveInterventions: patient.hasActiveInterventions,
        },
    };
    (0, responseHelpers_1.sendSuccess)(res, summary, 'Patient summary retrieved successfully');
});
exports.getPatientInterventions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, status, category } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', id);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const query = {
        patientId: id,
        isDeleted: false,
    };
    if (status) {
        query.status = status;
    }
    if (category) {
        query.category = category;
    }
    const ClinicalIntervention = mongoose_1.default.model('ClinicalIntervention');
    const [interventions, total] = await Promise.all([
        ClinicalIntervention.find(query)
            .populate('identifiedBy', 'firstName lastName')
            .populate('assignments.userId', 'firstName lastName role')
            .sort({ identifiedDate: -1 })
            .limit(parsedLimit)
            .skip((parsedPage - 1) * parsedLimit)
            .lean(),
        ClinicalIntervention.countDocuments(query),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, interventions, total, parsedPage, parsedLimit, `Found ${total} interventions for patient`);
});
exports.searchPatientsWithInterventions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { q, limit = 10 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!q) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Search query is required', 400);
    }
    const ClinicalInterventionService = require('../services/clinicalInterventionService').default;
    const patients = await ClinicalInterventionService.searchPatientsWithInterventions(q, context.workplaceId, Math.min(parseInt(limit), 50));
    (0, responseHelpers_1.sendSuccess)(res, {
        patients,
        total: patients.length,
        query: q,
    }, `Found ${patients.length} patients with intervention context`);
});
exports.getPatientDiagnosticHistory = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, includeArchived = false } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', id);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const DiagnosticHistory = mongoose_1.default.model('DiagnosticHistory');
    const skip = (Number(page) - 1) * Number(limit);
    const statusFilter = includeArchived === 'true'
        ? { status: { $in: ['active', 'archived'] } }
        : { status: 'active' };
    const history = await DiagnosticHistory.find({
        patientId: patient._id,
        workplaceId: context.workplaceId,
        ...statusFilter,
    })
        .populate('pharmacistId', 'firstName lastName')
        .populate('notes.addedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
    const total = await DiagnosticHistory.countDocuments({
        patientId: patient._id,
        workplaceId: context.workplaceId,
        ...statusFilter,
    });
    (0, responseHelpers_1.createAuditLog)('VIEW_PATIENT_DIAGNOSTIC_HISTORY', 'Patient', patient._id.toString(), context);
    (0, responseHelpers_1.sendSuccess)(res, {
        history,
        pagination: {
            current: Number(page),
            total: Math.ceil(total / Number(limit)),
            count: history.length,
            totalRecords: total,
        },
        patient: {
            id: patient._id,
            name: patient.getDisplayName(),
            age: patient.getAge(),
            gender: patient.gender,
        },
    });
});
exports.getPatientDiagnosticSummary = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(id);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', id);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const diagnosticHistoryCount = await patient.getDiagnosticHistoryCount();
    const latestDiagnosticHistory = await patient.getLatestDiagnosticHistory();
    const DiagnosticHistory = mongoose_1.default.model('DiagnosticHistory');
    const pendingFollowUps = await DiagnosticHistory.countDocuments({
        patientId: patient._id,
        workplaceId: context.workplaceId,
        status: 'active',
        'followUp.required': true,
        'followUp.completed': false,
    });
    const referralsCount = await DiagnosticHistory.countDocuments({
        patientId: patient._id,
        workplaceId: context.workplaceId,
        status: 'active',
        'referral.generated': true,
    });
    (0, responseHelpers_1.sendSuccess)(res, {
        patient: {
            id: patient._id,
            name: patient.getDisplayName(),
            age: patient.getAge(),
            gender: patient.gender,
        },
        diagnosticSummary: {
            totalCases: diagnosticHistoryCount,
            pendingFollowUps,
            referralsGenerated: referralsCount,
            latestCase: latestDiagnosticHistory ? {
                id: latestDiagnosticHistory._id,
                caseId: latestDiagnosticHistory.caseId,
                createdAt: latestDiagnosticHistory.createdAt,
                pharmacist: latestDiagnosticHistory.pharmacistId,
                confidenceScore: latestDiagnosticHistory.analysisSnapshot?.confidenceScore,
            } : null,
        },
    });
});
//# sourceMappingURL=patientController.js.map