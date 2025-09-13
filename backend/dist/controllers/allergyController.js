"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAllergies = exports.getCriticalAllergies = exports.deleteAllergy = exports.updateAllergy = exports.getAllergy = exports.getAllergies = exports.createAllergy = void 0;
const Allergy_1 = __importDefault(require("../models/Allergy"));
const Patient_1 = __importDefault(require("../models/Patient"));
const responseHelpers_1 = require("../utils/responseHelpers");
exports.createAllergy = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const allergyData = req.body;
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const existingAllergy = await Allergy_1.default.findOne({
        patientId,
        substance: allergyData.substance,
        isDeleted: false,
    });
    if (existingAllergy) {
        throw (0, responseHelpers_1.createDuplicateError)('Allergy', 'substance');
    }
    const allergy = new Allergy_1.default({
        ...allergyData,
        patientId,
        workplaceId: patient.workplaceId,
        createdBy: context.userId,
        isDeleted: false,
    });
    await allergy.save();
    console.log('Allergy created:', (0, responseHelpers_1.createAuditLog)('CREATE_ALLERGY', 'Allergy', allergy._id.toString(), context, { patientId, substance: allergy.substance, severity: allergy.severity }));
    (0, responseHelpers_1.sendSuccess)(res, { allergy }, 'Allergy added successfully', 201);
});
exports.getAllergies = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const { page = 1, limit = 20, severity } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const query = { patientId };
    if (severity) {
        query.severity = severity;
    }
    const [allergies, total] = await Promise.all([
        Allergy_1.default.find(query)
            .sort('-notedAt -createdAt')
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('createdBy', 'firstName lastName')
            .populate('updatedBy', 'firstName lastName'),
        Allergy_1.default.countDocuments(query),
    ]);
    const summary = {
        total,
        bySeverity: {
            severe: allergies.filter((a) => a.severity === 'severe').length,
            moderate: allergies.filter((a) => a.severity === 'moderate').length,
            mild: allergies.filter((a) => a.severity === 'mild').length,
        },
        criticalAllergies: allergies
            .filter((a) => a.severity === 'severe')
            .map((a) => a.substance),
    };
    const meta = (0, responseHelpers_1.createPaginationMeta)(total, page, limit);
    (0, responseHelpers_1.sendSuccess)(res, {
        results: allergies,
        summary,
    }, `Found ${total} allergies for patient`, 200, meta);
});
exports.getAllergy = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { allergyId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const allergy = await Allergy_1.default.findById(allergyId)
        .populate('patientId', 'firstName lastName mrn')
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName');
    (0, responseHelpers_1.ensureResourceExists)(allergy, 'Allergy', allergyId);
    (0, responseHelpers_1.checkTenantAccess)(allergy.workplaceId.toString(), context.workplaceId, context.isAdmin);
    (0, responseHelpers_1.sendSuccess)(res, { allergy }, 'Allergy details retrieved successfully');
});
exports.updateAllergy = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { allergyId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const updates = req.body;
    const allergy = await Allergy_1.default.findById(allergyId);
    (0, responseHelpers_1.ensureResourceExists)(allergy, 'Allergy', allergyId);
    (0, responseHelpers_1.checkTenantAccess)(allergy.workplaceId.toString(), context.workplaceId, context.isAdmin);
    if (updates.substance && updates.substance !== allergy.substance) {
        const existingAllergy = await Allergy_1.default.findOne({
            patientId: allergy.patientId,
            substance: updates.substance,
            isDeleted: false,
            _id: { $ne: allergyId },
        });
        if (existingAllergy) {
            throw (0, responseHelpers_1.createDuplicateError)('Allergy', 'substance');
        }
    }
    const originalData = allergy.toObject();
    Object.assign(allergy, updates, {
        updatedBy: context.userId,
        updatedAt: new Date(),
    });
    await allergy.save();
    console.log('Allergy updated:', (0, responseHelpers_1.createAuditLog)('UPDATE_ALLERGY', 'Allergy', allergy._id.toString(), context, { original: originalData, updates }));
    (0, responseHelpers_1.sendSuccess)(res, { allergy }, 'Allergy updated successfully');
});
exports.deleteAllergy = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { allergyId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const allergy = await Allergy_1.default.findById(allergyId);
    (0, responseHelpers_1.ensureResourceExists)(allergy, 'Allergy', allergyId);
    (0, responseHelpers_1.checkTenantAccess)(allergy.workplaceId.toString(), context.workplaceId, context.isAdmin);
    allergy.isDeleted = true;
    allergy.updatedBy = context.userId;
    await allergy.save();
    console.log('Allergy deleted:', (0, responseHelpers_1.createAuditLog)('DELETE_ALLERGY', 'Allergy', allergy._id.toString(), context, { substance: allergy.substance, patientId: allergy.patientId }));
    (0, responseHelpers_1.sendSuccess)(res, null, 'Allergy deleted successfully');
});
exports.getCriticalAllergies = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id: patientId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const patient = await Patient_1.default.findById(patientId);
    (0, responseHelpers_1.ensureResourceExists)(patient, 'Patient', patientId);
    (0, responseHelpers_1.checkTenantAccess)(patient.workplaceId.toString(), context.workplaceId, context.isAdmin);
    const criticalAllergies = await Allergy_1.default.find({
        patientId,
        severity: 'severe',
        isDeleted: false,
    }).sort('-notedAt');
    const summary = {
        total: criticalAllergies.length,
        substances: criticalAllergies.map((a) => a.substance),
        hasLifeThreatening: criticalAllergies.some((a) => a.reaction?.toLowerCase().includes('anaphylaxis') ||
            a.reaction?.toLowerCase().includes('anaphylactic')),
    };
    (0, responseHelpers_1.sendSuccess)(res, {
        allergies: criticalAllergies,
        summary,
    }, `Found ${criticalAllergies.length} critical allergies`);
});
exports.searchAllergies = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { substance, limit = 10 } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (!substance) {
        return (0, responseHelpers_1.sendError)(res, 'BAD_REQUEST', 'Substance parameter is required', 400);
    }
    const searchRegex = new RegExp(substance, 'i');
    const query = {
        substance: searchRegex,
    };
    if (!context.isAdmin) {
        query.workplaceId = context.workplaceId;
    }
    const allergies = await Allergy_1.default.find(query)
        .populate('patientId', 'firstName lastName mrn')
        .sort('substance')
        .limit(Math.min(parseInt(limit), 50));
    const groupedResults = allergies.reduce((acc, allergy) => {
        const substance = allergy.substance.toLowerCase();
        if (!acc[substance]) {
            acc[substance] = {
                substance: allergy.substance,
                patients: [],
                severityCounts: { mild: 0, moderate: 0, severe: 0 },
            };
        }
        acc[substance].patients.push({
            patientId: allergy.patientId._id,
            patientName: `${allergy.patientId.firstName} ${allergy.patientId.lastName}`,
            mrn: allergy.patientId.mrn,
            severity: allergy.severity,
            reaction: allergy.reaction,
        });
        acc[substance].severityCounts[allergy.severity || 'mild']++;
        return acc;
    }, {});
    (0, responseHelpers_1.sendSuccess)(res, {
        results: Object.values(groupedResults),
        total: Object.keys(groupedResults).length,
        searchTerm: substance,
    }, `Found ${allergies.length} allergies matching "${substance}"`);
});
//# sourceMappingURL=allergyController.js.map