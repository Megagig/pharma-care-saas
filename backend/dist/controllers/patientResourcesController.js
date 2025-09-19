"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addVisitAttachment = exports.updateVisit = exports.getVisit = exports.getVisits = exports.createVisit = exports.updateCarePlan = exports.getCarePlans = exports.createCarePlan = exports.updateDTP = exports.getDTPs = exports.createDTP = exports.updateAssessment = exports.getAssessments = exports.createAssessment = exports.deleteMedication = exports.updateMedication = exports.getMedications = exports.createMedication = exports.deleteCondition = exports.updateCondition = exports.getConditions = exports.createCondition = void 0;
const Patient_1 = __importDefault(require("../models/Patient"));
const Condition_1 = __importDefault(require("../models/Condition"));
const MedicationRecord_1 = __importDefault(require("../models/MedicationRecord"));
const ClinicalAssessment_1 = __importDefault(require("../models/ClinicalAssessment"));
const DrugTherapyProblem_1 = __importDefault(require("../models/DrugTherapyProblem"));
const CarePlan_1 = __importDefault(require("../models/CarePlan"));
const Visit_1 = __importDefault(require("../models/Visit"));
const responseHelpers_1 = require("../utils/responseHelpers");
exports.createCondition = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const existingCondition = await Condition_1.default.findOne({
        patientId,
        name: req.body.name,
        isDeleted: false,
    });
    if (existingCondition) {
        throw (0, responseHelpers_1.createDuplicateError)('Condition', 'name');
    }
    const condition = new Condition_1.default({
        ...req.body,
        patientId,
        workplaceId: patient.workplaceId,
        createdBy: context.userId,
    });
    await condition.save();
    (0, responseHelpers_1.sendSuccess)(res, { condition }, 'Condition added successfully', 201);
});
exports.getConditions = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const query = { patientId };
    if (status)
        query.status = status;
    const [conditions, total] = await Promise.all([
        Condition_1.default.find(query)
            .sort('-onsetDate -createdAt')
            .limit(limit)
            .skip((page - 1) * limit),
        Condition_1.default.countDocuments(query),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, conditions, total, page, limit);
});
exports.updateCondition = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { conditionId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const condition = await Condition_1.default.findById(conditionId);
    (0, responseHelpers_1.ensureResourceExists)(condition, 'Condition', conditionId);
    (0, responseHelpers_1.checkTenantAccess)(condition.workplaceId.toString(), context.workplaceId, context.isAdmin);
    Object.assign(condition, req.body, { updatedBy: context.userId });
    await condition.save();
    (0, responseHelpers_1.sendSuccess)(res, { condition }, 'Condition updated successfully');
});
exports.deleteCondition = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { conditionId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const condition = await Condition_1.default.findById(conditionId);
    (0, responseHelpers_1.ensureResourceExists)(condition, 'Condition', conditionId);
    (0, responseHelpers_1.checkTenantAccess)(condition.workplaceId.toString(), context.workplaceId, context.isAdmin);
    condition.isDeleted = true;
    condition.updatedBy = context.userId;
    await condition.save();
    (0, responseHelpers_1.sendSuccess)(res, null, 'Condition deleted successfully');
});
exports.createMedication = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    responseHelpers_1.validateBusinessRules.validateMedicationDates(req.body.startDate, req.body.endDate);
    const medication = new MedicationRecord_1.default({
        ...req.body,
        patientId,
        workplaceId: patient.workplaceId,
        createdBy: context.userId,
    });
    await medication.save();
    (0, responseHelpers_1.sendSuccess)(res, { medication }, 'Medication added successfully', 201);
});
exports.getMedications = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const { page = 1, limit = 20, phase } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const query = { patientId };
    if (phase)
        query.phase = phase;
    const [medications, total] = await Promise.all([
        MedicationRecord_1.default.find(query)
            .sort({ phase: 1, startDate: -1 })
            .limit(limit)
            .skip((page - 1) * limit),
        MedicationRecord_1.default.countDocuments(query),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, medications, total, page, limit);
});
exports.updateMedication = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { medId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const medication = await MedicationRecord_1.default.findById(medId);
    (0, responseHelpers_1.ensureResourceExists)(medication, 'Medication', medId);
    (0, responseHelpers_1.checkTenantAccess)(medication.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (req.body.startDate || req.body.endDate) {
        responseHelpers_1.validateBusinessRules.validateMedicationDates(req.body.startDate || medication.startDate, req.body.endDate || medication.endDate);
    }
    Object.assign(medication, req.body, { updatedBy: context.userId });
    await medication.save();
    (0, responseHelpers_1.sendSuccess)(res, { medication }, 'Medication updated successfully');
});
exports.deleteMedication = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { medId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const medication = await MedicationRecord_1.default.findById(medId);
    (0, responseHelpers_1.ensureResourceExists)(medication, 'Medication', medId);
    (0, responseHelpers_1.checkTenantAccess)(medication.workplaceId.toString(), context.workplaceId, context.isAdmin);
    medication.isDeleted = true;
    medication.updatedBy = context.userId;
    await medication.save();
    (0, responseHelpers_1.sendSuccess)(res, null, 'Medication deleted successfully');
});
exports.createAssessment = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (req.body.vitals?.bpSys && req.body.vitals?.bpDia) {
        responseHelpers_1.validateBusinessRules.validateBloodPressure(req.body.vitals.bpSys, req.body.vitals.bpDia);
    }
    const assessment = new ClinicalAssessment_1.default({
        ...req.body,
        patientId,
        workplaceId: patient.workplaceId,
        createdBy: context.userId,
    });
    await assessment.save();
    if (req.body.vitals) {
        patient.latestVitals = {
            ...req.body.vitals,
            recordedAt: req.body.recordedAt || new Date(),
        };
        await patient.save();
    }
    (0, responseHelpers_1.sendSuccess)(res, { assessment }, 'Clinical assessment added successfully', 201);
});
exports.getAssessments = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const [assessments, total] = await Promise.all([
        ClinicalAssessment_1.default.find({ patientId })
            .sort('-recordedAt')
            .limit(limit)
            .skip((page - 1) * limit),
        ClinicalAssessment_1.default.countDocuments({ patientId }),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, assessments, total, page, limit);
});
exports.updateAssessment = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { assessmentId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const assessment = await ClinicalAssessment_1.default.findById(assessmentId);
    (0, responseHelpers_1.ensureResourceExists)(assessment, 'Assessment', assessmentId);
    (0, responseHelpers_1.checkTenantAccess)(assessment.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (req.body.vitals?.bpSys && req.body.vitals?.bpDia) {
        responseHelpers_1.validateBusinessRules.validateBloodPressure(req.body.vitals.bpSys, req.body.vitals.bpDia);
    }
    Object.assign(assessment, req.body, { updatedBy: context.userId });
    await assessment.save();
    (0, responseHelpers_1.sendSuccess)(res, { assessment }, 'Assessment updated successfully');
});
exports.createDTP = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const dtp = new DrugTherapyProblem_1.default({
        ...req.body,
        patientId,
        workplaceId: patient.workplaceId,
        createdBy: context.userId,
    });
    await dtp.save();
    if (dtp.status === 'identified') {
        patient.hasActiveDTP = true;
        await patient.save();
    }
    (0, responseHelpers_1.sendSuccess)(res, { dtp }, 'DTP added successfully', 201);
});
exports.getDTPs = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const query = { patientId };
    if (status)
        query.status = status;
    const [dtps, total] = await Promise.all([
        DrugTherapyProblem_1.default.find(query)
            .sort('-createdAt')
            .limit(limit)
            .skip((page - 1) * limit),
        DrugTherapyProblem_1.default.countDocuments(query),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, dtps, total, page, limit);
});
exports.updateDTP = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { dtpId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const dtp = await DrugTherapyProblem_1.default.findById(dtpId);
    (0, responseHelpers_1.ensureResourceExists)(dtp, 'DTP', dtpId);
    (0, responseHelpers_1.checkTenantAccess)(dtp.workplaceId.toString(), context.workplaceId, context.isAdmin);
    Object.assign(dtp, req.body, { updatedBy: context.userId });
    await dtp.save();
    if (req.body.status === 'resolved') {
        const unresolvedCount = await DrugTherapyProblem_1.default.countDocuments({
            patientId: dtp.patientId,
            status: 'unresolved',
        });
        if (unresolvedCount === 0) {
            await Patient_1.default.findByIdAndUpdate(dtp.patientId, {
                hasActiveDTP: false,
            });
        }
    }
    (0, responseHelpers_1.sendSuccess)(res, { dtp }, 'DTP updated successfully');
});
exports.createCarePlan = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (req.body.followUpDate) {
        responseHelpers_1.validateBusinessRules.validateFollowUpDate(new Date(req.body.followUpDate));
    }
    const carePlan = new CarePlan_1.default({
        ...req.body,
        patientId,
        workplaceId: patient.workplaceId,
        createdBy: context.userId,
    });
    await carePlan.save();
    (0, responseHelpers_1.sendSuccess)(res, { carePlan }, 'Care plan created successfully', 201);
});
exports.getCarePlans = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const [carePlans, total] = await Promise.all([
        CarePlan_1.default.find({ patientId })
            .sort('-createdAt')
            .limit(limit)
            .skip((page - 1) * limit),
        CarePlan_1.default.countDocuments({ patientId }),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, carePlans, total, page, limit);
});
exports.updateCarePlan = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { carePlanId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const carePlan = await CarePlan_1.default.findById(carePlanId);
    (0, responseHelpers_1.ensureResourceExists)(carePlan, 'CarePlan', carePlanId);
    (0, responseHelpers_1.checkTenantAccess)(carePlan.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (req.body.followUpDate) {
        responseHelpers_1.validateBusinessRules.validateFollowUpDate(new Date(req.body.followUpDate));
    }
    Object.assign(carePlan, req.body, { updatedBy: context.userId });
    await carePlan.save();
    (0, responseHelpers_1.sendSuccess)(res, { carePlan }, 'Care plan updated successfully');
});
exports.createVisit = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const visit = new Visit_1.default({
        ...req.body,
        patientId,
        workplaceId: patient.workplaceId,
        createdBy: context.userId,
    });
    await visit.save();
    (0, responseHelpers_1.sendSuccess)(res, { visit }, 'Visit created successfully', 201);
});
exports.getVisits = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const [visits, total] = await Promise.all([
        Visit_1.default.find({ patientId })
            .sort('-date')
            .limit(limit)
            .skip((page - 1) * limit),
        Visit_1.default.countDocuments({ patientId }),
    ]);
    (0, responseHelpers_1.respondWithPaginatedResults)(res, visits, total, page, limit);
});
exports.getVisit = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { visitId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const visit = await Visit_1.default.findById(visitId).populate('patientId', 'firstName lastName mrn');
    (0, responseHelpers_1.ensureResourceExists)(visit, 'Visit', visitId);
    (0, responseHelpers_1.checkTenantAccess)(visit.workplaceId.toString(), context.workplaceId, context.isAdmin);
    (0, responseHelpers_1.sendSuccess)(res, { visit }, 'Visit details retrieved successfully');
});
exports.updateVisit = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { visitId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const visit = await Visit_1.default.findById(visitId);
    (0, responseHelpers_1.ensureResourceExists)(visit, 'Visit', visitId);
    (0, responseHelpers_1.checkTenantAccess)(visit.workplaceId.toString(), context.workplaceId, context.isAdmin);
    Object.assign(visit, req.body, { updatedBy: context.userId });
    await visit.save();
    (0, responseHelpers_1.sendSuccess)(res, { visit }, 'Visit updated successfully');
});
exports.addVisitAttachment = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { visitId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const visit = await Visit_1.default.findById(visitId);
    (0, responseHelpers_1.ensureResourceExists)(visit, 'Visit', visitId);
    (0, responseHelpers_1.checkTenantAccess)(visit.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (!visit.attachments)
        visit.attachments = [];
    if (visit.attachments.length >= 10) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Maximum 10 attachments allowed per visit', 400);
    }
    visit.attachments.push({
        ...req.body,
        uploadedAt: new Date(),
    });
    await visit.save();
    (0, responseHelpers_1.sendSuccess)(res, { visit }, 'Attachment added successfully');
});
//# sourceMappingURL=patientResourcesController.js.map