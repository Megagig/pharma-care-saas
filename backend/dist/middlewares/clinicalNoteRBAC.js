"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logNoteAccess = exports.canModifyNote = exports.enforceTenancyIsolation = exports.validateBulkNoteAccess = exports.validatePatientAccess = exports.validateNoteAccess = exports.canAccessConfidentialNotes = exports.canExportClinicalNotes = exports.canDeleteClinicalNote = exports.canUpdateClinicalNote = exports.canReadClinicalNote = exports.canCreateClinicalNote = void 0;
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
const Patient_1 = __importDefault(require("../models/Patient"));
const auditLogging_1 = require("./auditLogging");
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = __importDefault(require("mongoose"));
const mapSystemRoleToWorkplaceRole = (systemRole) => {
    switch (systemRole) {
        case 'pharmacy_outlet':
            return 'Owner';
        case 'pharmacist':
        case 'pharmacy_team':
            return 'Pharmacist';
        case 'intern_pharmacist':
            return 'Technician';
        default:
            return null;
    }
};
const canCreateClinicalNote = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        let userWorkplaceRole = req.user.workplaceRole;
        if (!userWorkplaceRole && req.user.role) {
            const mappedRole = mapSystemRoleToWorkplaceRole(req.user.role);
            if (mappedRole) {
                userWorkplaceRole = mappedRole;
            }
        }
        const allowedRoles = ['Owner', 'Pharmacist'];
        if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions to create clinical notes',
                requiredRoles: allowedRoles,
                userRole: req.user.role,
                userWorkplaceRole: userWorkplaceRole,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking clinical note creation permission:', error);
        res.status(500).json({
            success: false,
            message: 'Permission check failed',
        });
    }
};
exports.canCreateClinicalNote = canCreateClinicalNote;
const canReadClinicalNote = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        let userWorkplaceRole = req.user.workplaceRole;
        if (!userWorkplaceRole && req.user.role) {
            const mappedRole = mapSystemRoleToWorkplaceRole(req.user.role);
            if (mappedRole) {
                userWorkplaceRole = mappedRole;
            }
        }
        const allowedRoles = ['Owner', 'Pharmacist', 'Technician'];
        if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions to read clinical notes',
                requiredRoles: allowedRoles,
                userRole: req.user.role,
                userWorkplaceRole: userWorkplaceRole,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking clinical note read permission:', error);
        res.status(500).json({
            success: false,
            message: 'Permission check failed',
        });
    }
};
exports.canReadClinicalNote = canReadClinicalNote;
const canUpdateClinicalNote = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        let userWorkplaceRole = req.user.workplaceRole;
        if (!userWorkplaceRole && req.user.role) {
            const mappedRole = mapSystemRoleToWorkplaceRole(req.user.role);
            if (mappedRole) {
                userWorkplaceRole = mappedRole;
            }
        }
        const allowedRoles = ['Owner', 'Pharmacist'];
        if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions to update clinical notes',
                requiredRoles: allowedRoles,
                userRole: req.user.role,
                userWorkplaceRole: userWorkplaceRole,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking clinical note update permission:', error);
        res.status(500).json({
            success: false,
            message: 'Permission check failed',
        });
    }
};
exports.canUpdateClinicalNote = canUpdateClinicalNote;
const canDeleteClinicalNote = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        let userWorkplaceRole = req.user.workplaceRole;
        if (!userWorkplaceRole && req.user.role) {
            const mappedRole = mapSystemRoleToWorkplaceRole(req.user.role);
            if (mappedRole) {
                userWorkplaceRole = mappedRole;
            }
        }
        const allowedRoles = ['Owner', 'Pharmacist'];
        if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions to delete clinical notes',
                requiredRoles: allowedRoles,
                userRole: req.user.role,
                userWorkplaceRole: userWorkplaceRole,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking clinical note delete permission:', error);
        res.status(500).json({
            success: false,
            message: 'Permission check failed',
        });
    }
};
exports.canDeleteClinicalNote = canDeleteClinicalNote;
const canExportClinicalNotes = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        let userWorkplaceRole = req.user.workplaceRole;
        if (!userWorkplaceRole && req.user.role) {
            const mappedRole = mapSystemRoleToWorkplaceRole(req.user.role);
            if (mappedRole) {
                userWorkplaceRole = mappedRole;
            }
        }
        const allowedRoles = ['Owner', 'Pharmacist'];
        if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions to export clinical notes',
                requiredRoles: allowedRoles,
                userRole: req.user.role,
                userWorkplaceRole: userWorkplaceRole,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking clinical note export permission:', error);
        res.status(500).json({
            success: false,
            message: 'Permission check failed',
        });
    }
};
exports.canExportClinicalNotes = canExportClinicalNotes;
const canAccessConfidentialNotes = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required',
        });
        return;
    }
    const allowedRoles = ['Owner', 'Pharmacist'];
    const userWorkplaceRole = req.user.workplaceRole;
    if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
        res.status(403).json({
            success: false,
            message: 'Insufficient permissions to access confidential notes',
            requiredRoles: allowedRoles,
            userRole: userWorkplaceRole,
        });
        return;
    }
    next();
};
exports.canAccessConfidentialNotes = canAccessConfidentialNotes;
const validateNoteAccess = async (req, res, next) => {
    try {
        const requestPath = req.originalUrl || req.path || req.url;
        console.log(`Validating note access for path: ${requestPath}`);
        const noteId = req.params.id;
        console.log(`Note ID from params: ${noteId}`);
        if (!noteId) {
            console.log('No ID found in params, checking path extraction');
            const pathParts = requestPath.split('/');
            const potentialId = pathParts[pathParts.length - 1];
            if (potentialId && potentialId.length >= 24) {
                console.log(`Found potential ID in URL path: ${potentialId}`);
                req.params.id = potentialId;
            }
        }
        const workplaceId = req.user?.workplaceId || req.workspaceContext?.workspace?._id;
        if (!noteId) {
            res.status(400).json({
                success: false,
                message: 'Note ID is required',
            });
            return;
        }
        console.log(`Looking up note with ID: ${noteId}`);
        let queryId = noteId;
        if (noteId.length === 24) {
            try {
                new mongoose_1.default.Types.ObjectId(noteId);
                queryId = noteId;
                console.log(`Note ID is a valid ObjectId: ${queryId}`);
            }
            catch (err) {
                console.log(`Note ID couldn't be converted to ObjectId: ${noteId}`);
            }
        }
        if (!workplaceId) {
            res.status(403).json({
                success: false,
                message: 'No workplace context available',
            });
            return;
        }
        const query = {
            deletedAt: { $exists: false },
        };
        if (req.user?.role !== 'super_admin') {
            query.workplaceId = workplaceId;
            console.log(`Adding workplaceId filter: ${workplaceId}`);
        }
        else {
            console.log('Super admin access - not filtering by workplace');
        }
        try {
            if (mongoose_1.default.Types.ObjectId.isValid(queryId)) {
                console.log(`Trying direct ObjectId lookup with: ${queryId}`);
                const directNote = await ClinicalNote_1.default.findOne({
                    _id: queryId,
                    ...query,
                }).populate('patient', 'firstName lastName mrn workplaceId');
                if (directNote) {
                    req.clinicalNote = directNote;
                    console.log('Found note with direct ObjectId lookup');
                    return next();
                }
            }
            console.log('Direct lookup failed, trying multi-field lookup');
            query.$or = [
                { _id: queryId },
                { customId: queryId },
                { legacyId: queryId },
                { _id: queryId.toLowerCase() },
                { _id: queryId.toUpperCase() },
            ];
        }
        catch (err) {
            console.error('Error building query:', err);
            delete query.$or;
            query._id = queryId;
        }
        if (!req.clinicalNote) {
            console.log(`Executing query: ${JSON.stringify(query)}`);
            const note = await ClinicalNote_1.default.findOne(query).populate('patient', 'firstName lastName mrn workplaceId');
            if (note) {
                console.log(`Found note with ID: ${note._id}`);
                req.clinicalNote = note;
                return next();
            }
        }
        if (!req.clinicalNote) {
            console.log('Last attempt: finding all notes and checking string match');
            const baseQuery = req.user?.role === 'super_admin'
                ? { deletedAt: { $exists: false } }
                : { deletedAt: { $exists: false }, workplaceId };
            const recentNotes = await ClinicalNote_1.default.find(baseQuery)
                .sort({ createdAt: -1 })
                .limit(100);
            const matchingNote = recentNotes.find((n) => {
                const noteIdStr = noteId.toString().toLowerCase();
                const idMatch = n._id.toString().toLowerCase().includes(noteIdStr);
                const customIdMatch = n.get('customId')
                    ? n.get('customId').toLowerCase().includes(noteIdStr)
                    : false;
                const legacyIdMatch = n.get('legacyId')
                    ? n.get('legacyId').toLowerCase().includes(noteIdStr)
                    : false;
                return idMatch || customIdMatch || legacyIdMatch;
            });
            if (matchingNote) {
                console.log(`Found matching note with partial string match: ${matchingNote._id}`);
                await matchingNote.populate('patient', 'firstName lastName mrn workplaceId');
                req.clinicalNote = matchingNote;
                return next();
            }
        }
        if (!req.clinicalNote) {
            console.log(`Note still not found for ID: ${noteId}`);
            await auditLogging_1.auditOperations.unauthorizedAccess(req, 'clinical_note', noteId, 'Note not found or access denied');
            res.status(404).json({
                success: false,
                message: 'Clinical note not found or access denied',
            });
            return;
        }
        const note = req.clinicalNote;
        if (note.isConfidential) {
            const allowedRoles = ['Owner', 'Pharmacist'];
            const userWorkplaceRole = req.user?.workplaceRole;
            if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
                await auditLogging_1.auditOperations.unauthorizedAccess(req, 'clinical_note', noteId, 'Attempted access to confidential note without sufficient permissions');
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to access confidential note',
                    requiredRoles: allowedRoles,
                });
                return;
            }
        }
        req.clinicalNote = note;
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating note access:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating note access',
        });
    }
};
exports.validateNoteAccess = validateNoteAccess;
const validatePatientAccess = async (req, res, next) => {
    try {
        if (req.user?.role === 'super_admin') {
            const patientId = req.body.patient || req.params.patientId;
            if (patientId && mongoose_1.default.Types.ObjectId.isValid(patientId)) {
                const patient = await Patient_1.default.findById(patientId);
                if (patient) {
                    req.patient = patient;
                }
            }
            return next();
        }
        const patientId = req.body.patient || req.params.patientId;
        const workplaceId = req.user?.workplaceId || req.workspaceContext?.workspace?._id;
        if (!patientId || !mongoose_1.default.Types.ObjectId.isValid(patientId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid patient ID',
            });
            return;
        }
        if (!workplaceId) {
            res.status(403).json({
                success: false,
                message: 'No workplace context available',
            });
            return;
        }
        const patient = await Patient_1.default.findOne({
            _id: patientId,
            workplaceId: workplaceId,
        });
        if (!patient) {
            await auditLogging_1.auditOperations.unauthorizedAccess(req, 'patient', patientId, 'Patient not found or access denied for clinical note operation');
            res.status(404).json({
                success: false,
                message: 'Patient not found or access denied',
            });
            return;
        }
        req.patient = patient;
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating patient access:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating patient access',
        });
    }
};
exports.validatePatientAccess = validatePatientAccess;
const validateBulkNoteAccess = async (req, res, next) => {
    try {
        const { noteIds } = req.body;
        const workplaceId = req.user?.workplaceId || req.workspaceContext?.workspace?._id;
        if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Note IDs array is required',
            });
            return;
        }
        if (!workplaceId) {
            res.status(403).json({
                success: false,
                message: 'No workplace context available',
            });
            return;
        }
        const processedIds = noteIds.map((id) => {
            if (mongoose_1.default.Types.ObjectId.isValid(id)) {
                return id;
            }
            else if (id && id.length === 24) {
                try {
                    return new mongoose_1.default.Types.ObjectId(id).toString();
                }
                catch (err) {
                    return id;
                }
            }
            return id;
        });
        const query = {
            deletedAt: { $exists: false },
            workplaceId: workplaceId,
            $or: [
                {
                    _id: {
                        $in: processedIds.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id)),
                    },
                },
            ],
        };
        const nonObjectIds = processedIds.filter((id) => !mongoose_1.default.Types.ObjectId.isValid(id));
        if (nonObjectIds.length > 0) {
            query.$or.push({ customId: { $in: nonObjectIds } });
            query.$or.push({ legacyId: { $in: nonObjectIds } });
        }
        const notes = await ClinicalNote_1.default.find(query);
        if (notes.length !== noteIds.length) {
            await auditLogging_1.auditOperations.unauthorizedAccess(req, 'clinical_note', noteIds.join(','), `Bulk operation attempted on notes not accessible to user. Found: ${notes.length}, Requested: ${noteIds.length}`);
            res.status(404).json({
                success: false,
                message: 'Some notes not found or access denied',
                found: notes.length,
                requested: noteIds.length,
            });
            return;
        }
        const confidentialNotes = notes.filter((note) => note.isConfidential);
        if (confidentialNotes.length > 0) {
            const allowedRoles = ['Owner', 'Pharmacist'];
            const userWorkplaceRole = req.user?.workplaceRole;
            if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
                await auditLogging_1.auditOperations.unauthorizedAccess(req, 'clinical_note', confidentialNotes.map((n) => n._id.toString()).join(','), 'Bulk operation attempted on confidential notes without sufficient permissions');
                res.status(403).json({
                    success: false,
                    message: 'Bulk operation includes confidential notes that require higher permissions',
                    confidentialNoteCount: confidentialNotes.length,
                    requiredRoles: allowedRoles,
                });
                return;
            }
        }
        req.clinicalNotes = notes;
        next();
    }
    catch (error) {
        logger_1.default.error('Error validating bulk note access:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating bulk note access',
        });
    }
};
exports.validateBulkNoteAccess = validateBulkNoteAccess;
const enforceTenancyIsolation = (req, res, next) => {
    if (req.user?.role === 'super_admin') {
        req.tenancyFilter = {
            deletedAt: { $exists: false },
        };
        next();
        return;
    }
    const workplaceId = req.user?.workplaceId || req.workspaceContext?.workspace?._id;
    if (!workplaceId) {
        res.status(403).json({
            success: false,
            message: 'No workplace context available for tenancy isolation',
        });
        return;
    }
    req.tenancyFilter = {
        workplaceId: workplaceId,
        deletedAt: { $exists: false },
    };
    next();
};
exports.enforceTenancyIsolation = enforceTenancyIsolation;
const canModifyNote = async (req, res, next) => {
    try {
        const note = req.clinicalNote;
        const user = req.user;
        if (!note || !user) {
            res.status(400).json({
                success: false,
                message: 'Note or user context not available',
            });
            return;
        }
        if (user.role === 'super_admin') {
            return next();
        }
        if (user.workplaceRole === 'Owner') {
            return next();
        }
        if (user.workplaceRole === 'Pharmacist') {
            if (note.pharmacist.toString() === user._id.toString()) {
                return next();
            }
            return next();
        }
        res.status(403).json({
            success: false,
            message: 'Insufficient permissions to modify this note',
            noteCreator: note.pharmacist.toString(),
            currentUser: user._id.toString(),
        });
    }
    catch (error) {
        logger_1.default.error('Error checking note modification permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking modification permissions',
        });
    }
};
exports.canModifyNote = canModifyNote;
const logNoteAccess = async (req, res, next) => {
    try {
        const note = req.clinicalNote;
        const action = determineActionFromRequest(req);
        if (note && req.user) {
            await auditLogging_1.auditOperations.noteAccess(req, note._id, action, {
                noteTitle: note.title,
                noteType: note.type,
                patientId: note.patient?._id || note.patient || null,
                isConfidential: note.isConfidential,
            });
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error logging note access:', error);
        next();
    }
};
exports.logNoteAccess = logNoteAccess;
function determineActionFromRequest(req) {
    const method = req.method;
    const path = req.path;
    if (method === 'GET') {
        if (path.includes('/attachments/') && path.includes('/download')) {
            return 'DOWNLOAD_ATTACHMENT';
        }
        return 'VIEW_NOTE';
    }
    if (method === 'POST') {
        if (path.includes('/attachments')) {
            return 'UPLOAD_ATTACHMENT';
        }
        if (path.includes('/bulk')) {
            return 'BULK_CREATE_NOTES';
        }
        return 'CREATE_NOTE';
    }
    if (method === 'PUT') {
        if (path.includes('/bulk')) {
            return 'BULK_UPDATE_NOTES';
        }
        return 'UPDATE_NOTE';
    }
    if (method === 'DELETE') {
        if (path.includes('/attachments/')) {
            return 'DELETE_ATTACHMENT';
        }
        if (path.includes('/bulk')) {
            return 'BULK_DELETE_NOTES';
        }
        return 'DELETE_NOTE';
    }
    return `${method}_NOTE`;
}
exports.default = {
    canCreateClinicalNote: exports.canCreateClinicalNote,
    canReadClinicalNote: exports.canReadClinicalNote,
    canUpdateClinicalNote: exports.canUpdateClinicalNote,
    canDeleteClinicalNote: exports.canDeleteClinicalNote,
    canExportClinicalNotes: exports.canExportClinicalNotes,
    canAccessConfidentialNotes: exports.canAccessConfidentialNotes,
    validateNoteAccess: exports.validateNoteAccess,
    validatePatientAccess: exports.validatePatientAccess,
    validateBulkNoteAccess: exports.validateBulkNoteAccess,
    enforceTenancyIsolation: exports.enforceTenancyIsolation,
    canModifyNote: exports.canModifyNote,
    logNoteAccess: exports.logNoteAccess,
};
//# sourceMappingURL=clinicalNoteRBAC.js.map