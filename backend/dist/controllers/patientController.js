"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPatientsWithInterventions = exports.getPatientInterventions = exports.getPatientSummary = exports.searchPatients = exports.deletePatient = exports.updatePatient = exports.createPatient = exports.getPatient = exports.getPatients = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Allergy_1 = __importDefault(require("../models/Allergy"));
const Condition_1 = __importDefault(require("../models/Condition"));
const MedicationRecord_1 = __importDefault(require("../models/MedicationRecord"));
const ClinicalAssessment_1 = __importDefault(require("../models/ClinicalAssessment"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const CarePlan_1 = __importDefault(require("../models/CarePlan"));
const Visit_1 = __importDefault(require("../models/Visit"));
const tenancyGuard_1 = require("../utils/tenancyGuard");
const responseHelpers_1 = require("../utils/responseHelpers");
exports.getPatients = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 10, q, name, mrn, phone, state, bloodGroup, genotype, sort, } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const query = {};
    if (!context.isAdmin) {
        query.workplaceId = context.workplaceId;
    }
    if (q) {
        const searchRegex = new RegExp(q, 'i');
        query.$or = [
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
        query.$or = [
            { firstName: nameRegex },
            { lastName: nameRegex },
            { otherNames: nameRegex },
        ];
    }
    if (mrn)
        query.mrn = new RegExp(mrn, 'i');
    if (phone)
        query.phone = new RegExp(phone.replace('+', '\\+'), 'i');
    if (state)
        query.state = state;
    if (bloodGroup)
        query.bloodGroup = bloodGroup;
    if (genotype)
        query.genotype = genotype;
    const [patients, total] = await Promise.all([
        Patient_1.default.find(query)
            .sort(sort || '-createdAt')
            .limit(parsedLimit)
            .skip((parsedPage - 1) * parsedLimit)
            .select('-__v')
            .lean(),
        Patient_1.default.countDocuments(query),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, patients, total, parsedPage, parsedLimit, `Found ${total} patients`);
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
        const patientCount = await Patient_1.default.countDocuments({
            workplaceId: context.workplaceId,
        });
        const mrn = (0, tenancyGuard_1.generateMRN)(workplaceCode, patientCount + 1);
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
        .select('firstName lastName otherNames mrn phone dob bloodGroup latestVitals')
        .limit(Math.min(parseInt(limit), 50))
        .sort('lastName firstName')
        .lean();
    const enrichedPatients = patients.map((patient) => ({
        ...patient,
        displayName: `${patient.firstName} ${patient.lastName}`,
        age: patient.dob
            ? Math.floor((Date.now() - patient.dob.getTime()) /
                (1000 * 60 * 60 * 24 * 365.25))
            : null,
    }));
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
//# sourceMappingURL=patientController.js.map