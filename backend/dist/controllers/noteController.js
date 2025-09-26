"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteStatistics = exports.downloadAttachment = exports.deleteAttachment = exports.uploadAttachment = exports.bulkDeleteNotes = exports.bulkUpdateNotes = exports.getNotesWithFilters = exports.searchNotes = exports.getPatientNotes = exports.deleteNote = exports.updateNote = exports.createNote = exports.getNote = exports.getNotes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
const Patient_1 = __importDefault(require("../models/Patient"));
const auditService_1 = require("../services/auditService");
const confidentialNoteService_1 = __importDefault(require("../services/confidentialNoteService"));
const uploadService_1 = require("../utils/uploadService");
const auditLogging_1 = require("../middlewares/auditLogging");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getNotes = async (req, res) => {
    try {
        console.log('=== GET NOTES DEBUG ===');
        console.log('User role:', req.user?.role);
        console.log('User workplaceId:', req.user?.workplaceId);
        console.log('Tenancy filter from middleware:', req.tenancyFilter);
        const { page = 1, limit = 10, type, priority, patientId, clinicianId, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc', isConfidential, } = req.query;
        const query = { ...req.tenancyFilter };
        if (type)
            query.type = type;
        if (priority)
            query.priority = priority;
        if (patientId)
            query.patient = patientId;
        if (clinicianId)
            query.pharmacist = clinicianId;
        if (isConfidential !== undefined) {
            const canAccessConfidential = ['Owner', 'Pharmacist'].includes(req.user?.workplaceRole || '');
            if (isConfidential === 'true') {
                if (!canAccessConfidential) {
                    res.status(403).json({
                        success: false,
                        message: 'Insufficient permissions to access confidential notes',
                    });
                    return;
                }
                query.isConfidential = true;
            }
            else {
                query.isConfidential = { $ne: true };
            }
        }
        else {
            const canAccessConfidential = ['Owner', 'Pharmacist'].includes(req.user?.workplaceRole || '');
            if (!canAccessConfidential) {
                query.isConfidential = { $ne: true };
            }
        }
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom)
                query.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                query.createdAt.$lte = new Date(dateTo);
        }
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        console.log('Final query for getNotes:', JSON.stringify(query, null, 2));
        const notes = await ClinicalNote_1.default.find(query)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage')
            .sort(sortObj);
        const total = await ClinicalNote_1.default.countDocuments(query);
        console.log('GetNotes results count:', notes.length);
        console.log('Total documents matching query:', total);
        console.log('=== END GET NOTES DEBUG ===');
        try {
            await auditService_1.AuditService.createAuditLog({
                action: 'LIST_CLINICAL_NOTES',
                userId: req.user?.id || 'unknown',
                details: {
                    filters: {
                        type,
                        priority,
                        patientId,
                        clinicianId,
                        dateFrom,
                        dateTo,
                        isConfidential,
                    },
                    resultCount: notes.length,
                    page: Number(page),
                    limit: Number(limit),
                    confidentialNotesIncluded: query.isConfidential === true,
                },
                complianceCategory: 'data_access',
                riskLevel: query.isConfidential === true ? 'high' : 'low',
            });
        }
        catch (auditError) {
            console.error('Failed to create audit log for list notes:', auditError);
        }
        res.json({
            success: true,
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
            filters: {
                type,
                priority,
                patientId,
                clinicianId,
                dateFrom,
                dateTo,
                isConfidential,
            },
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getNotes = getNotes;
const getNote = async (req, res) => {
    try {
        console.log(`GET Note controller running for ID: ${req.params.id}`);
        let note = req.clinicalNote;
        if (!note && req.params.id) {
            console.log(`Note not found in request, attempting direct lookup with ID: ${req.params.id}`);
            const query = { deletedAt: { $exists: false } };
            if (req.user?.role !== 'super_admin' && req.user?.workplaceId) {
                query.workplaceId = req.user.workplaceId;
            }
            query.$or = [
                { _id: req.params.id },
                { customId: req.params.id },
                { legacyId: req.params.id },
            ];
            try {
                if (mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
                    const foundNote = await ClinicalNote_1.default.findById(req.params.id);
                    if (foundNote) {
                        console.log(`Found note directly by ID: ${foundNote._id}`);
                        req.clinicalNote = foundNote;
                    }
                }
                if (!req.clinicalNote) {
                    const foundNote = await ClinicalNote_1.default.findOne(query);
                    if (foundNote) {
                        console.log(`Found note using OR query: ${foundNote._id}`);
                        req.clinicalNote = foundNote;
                    }
                }
            }
            catch (lookupErr) {
                console.error(`Error in direct note lookup: ${lookupErr}`);
            }
        }
        if (!req.clinicalNote) {
            console.log(`Note still not found for ID: ${req.params.id}`);
            res.status(404).json({
                success: false,
                message: 'Clinical note not found',
            });
            return;
        }
        note = req.clinicalNote;
        await note.populate([
            { path: 'patient', select: 'firstName lastName mrn dateOfBirth' },
            { path: 'pharmacist', select: 'firstName lastName role' },
            { path: 'medications', select: 'name dosage strength' },
        ]);
        if (note.isConfidential) {
            await auditService_1.AuditService.createAuditLog({
                action: 'VIEW_CONFIDENTIAL_NOTE',
                userId: req.user?.id || 'unknown',
                resourceType: 'ClinicalNote',
                resourceId: note._id,
                patientId: note.patient._id || note.patient,
                details: {
                    noteTitle: note.title,
                    noteType: note.type,
                    confidentialityLevel: 'high',
                    accessJustification: 'Clinical care review',
                },
                complianceCategory: 'data_access',
                riskLevel: 'critical',
            });
        }
        res.json({
            success: true,
            note,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getNote = getNote;
const createNote = async (req, res) => {
    try {
        const { patient: patientId, type, title, content } = req.body;
        if (!patientId || !type || !title) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: patient, type, and title are required',
            });
            return;
        }
        const patient = req.patient;
        let workplaceId = req.workspaceContext?.workspace?._id;
        if (!workplaceId && req.user?.role === 'super_admin' && patient) {
            workplaceId = patient.workplaceId;
        }
        if (req.body.isConfidential) {
            const canCreateConfidential = ['Owner', 'Pharmacist'].includes(req.user?.workplaceRole || '');
            if (!canCreateConfidential) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to create confidential notes',
                    requiredRoles: ['Owner', 'Pharmacist'],
                });
                return;
            }
        }
        const noteData = {
            ...req.body,
            patient: patientId,
            pharmacist: req.user?.id,
            workplaceId: workplaceId,
            createdBy: req.user?.id,
            lastModifiedBy: req.user?.id,
        };
        const note = await ClinicalNote_1.default.create(noteData);
        const populatedNote = await ClinicalNote_1.default.findById(note._id)
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage');
        await auditService_1.AuditService.createAuditLog({
            action: req.body.isConfidential
                ? 'CREATE_CONFIDENTIAL_NOTE'
                : 'CREATE_CLINICAL_NOTE',
            userId: req.user?.id || 'unknown',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            newValues: {
                ...noteData,
                content: req.body.isConfidential
                    ? '[CONFIDENTIAL_CONTENT]'
                    : noteData.content,
            },
            details: {
                noteType: type,
                title,
                priority: req.body.priority || 'medium',
                isConfidential: req.body.isConfidential || false,
                patientMrn: patient.mrn,
                attachmentCount: req.body.attachments?.length || 0,
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: req.body.isConfidential ? 'critical' : 'medium',
        });
        res.status(201).json({
            success: true,
            note: populatedNote,
            message: 'Clinical note created successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.createNote = createNote;
const updateNote = async (req, res) => {
    try {
        console.log(`UPDATE Note controller running for ID: ${req.params.id}`);
        const existingNote = req.clinicalNote;
        if (!existingNote) {
            console.log(`Note not found in request, trying direct lookup with multiple strategies`);
            const noteId = req.params.id;
            const query = { deletedAt: { $exists: false } };
            if (req.user?.role !== 'super_admin') {
                query.workplaceId =
                    req.user?.workplaceId || req.workspaceContext?.workspace?._id;
            }
            if (noteId && mongoose_1.default.Types.ObjectId.isValid(noteId)) {
                const note = await ClinicalNote_1.default.findById(noteId);
                if (note) {
                    console.log(`Found note by direct ID: ${note._id}`);
                    req.clinicalNote = note;
                }
            }
            if (!req.clinicalNote) {
                query.$or = [
                    { _id: noteId },
                    { customId: noteId },
                    { legacyId: noteId },
                ];
                const note = await ClinicalNote_1.default.findOne(query);
                if (note) {
                    console.log(`Found note using OR query: ${note._id}`);
                    req.clinicalNote = note;
                }
            }
        }
        if (!req.clinicalNote) {
            console.log(`Note still not found for update, ID: ${req.params.id}`);
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        const noteToUpdate = req.clinicalNote;
        const oldValues = noteToUpdate.toObject();
        const updateData = {
            ...req.body,
            lastModifiedBy: req.user?.id,
            updatedAt: new Date(),
        };
        const note = await ClinicalNote_1.default.findOneAndUpdate({
            _id: req.params.id,
            workplaceId: req.user?.workplaceId || req.workspace?._id,
        }, updateData, { new: true, runValidators: true })
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage');
        if (!note) {
            res
                .status(404)
                .json({ message: 'Clinical note not found or access denied' });
            return;
        }
        await auditService_1.AuditService.createAuditLog({
            action: 'UPDATE_CLINICAL_NOTE',
            userId: req.user?.id || 'unknown',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            details: {
                noteId: note._id,
                patientId: note.patient._id,
                noteType: note.type,
                title: note.title,
                priority: note.priority,
                isConfidential: note.isConfidential,
            },
            oldValues,
            newValues: note.toObject(),
            changedFields: Object.keys(req.body),
            complianceCategory: 'clinical_documentation',
            riskLevel: note.isConfidential ? 'high' : 'medium',
        });
        res.json({ note });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateNote = updateNote;
const deleteNote = async (req, res) => {
    try {
        console.log(`DELETE Note controller running for ID: ${req.params.id}`);
        let note = req.clinicalNote;
        if (!note) {
            console.log(`Note not found in request for deletion, trying direct lookup`);
            const noteId = req.params.id;
            const query = { deletedAt: { $exists: false } };
            if (req.user?.role !== 'super_admin') {
                query.workplaceId =
                    req.user?.workplaceId || req.workspaceContext?.workspace?._id;
            }
            if (noteId && mongoose_1.default.Types.ObjectId.isValid(noteId)) {
                const foundNote = await ClinicalNote_1.default.findById(noteId);
                if (foundNote) {
                    console.log(`Found note by direct ID for deletion: ${foundNote._id}`);
                    note = foundNote;
                }
            }
            if (!note) {
                query.$or = [
                    { _id: noteId },
                    { customId: noteId },
                    { legacyId: noteId },
                ];
                const foundNote = await ClinicalNote_1.default.findOne(query);
                if (foundNote) {
                    console.log(`Found note using OR query for deletion: ${foundNote._id}`);
                    note = foundNote;
                }
            }
        }
        if (!note) {
            console.log(`Note still not found for deletion, ID: ${req.params.id}`);
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        const noteData = note.toObject();
        const deletedNote = await ClinicalNote_1.default.findOneAndUpdate({
            _id: note._id,
        }, {
            deletedAt: new Date(),
            deletedBy: req.user?.id,
            lastModifiedBy: req.user?.id,
        }, { new: true });
        if (!deletedNote) {
            res
                .status(404)
                .json({ message: 'Clinical note not found or access denied' });
            return;
        }
        if (note.attachments && note.attachments.length > 0) {
            for (const attachment of note.attachments) {
                try {
                    const filePath = path_1.default.join(process.cwd(), 'uploads', attachment.fileName);
                    if (fs_1.default.existsSync(filePath)) {
                        await (0, uploadService_1.deleteFile)(filePath);
                    }
                }
                catch (fileError) {
                    console.error('Error deleting attachment:', fileError);
                }
            }
        }
        await auditService_1.AuditService.createAuditLog({
            action: 'DELETE_CLINICAL_NOTE',
            userId: req.user?.id || 'unknown',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            details: {
                noteId: note._id,
                patientId: note.patient,
                noteType: note.type,
                title: note.title,
                priority: note.priority,
                isConfidential: note.isConfidential,
                attachmentCount: note.attachments?.length || 0,
            },
            oldValues: noteData,
            complianceCategory: 'clinical_documentation',
            riskLevel: 'critical',
        });
        res.json({ message: 'Clinical note deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteNote = deleteNote;
const getPatientNotes = async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'development') {
            console.log('GET PATIENT NOTES - User:', req.user?.role, 'Patient:', req.params.patientId);
        }
        const { page = 1, limit = 10, type, priority } = req.query;
        let patient;
        if (req.user?.role === 'super_admin') {
            patient = await Patient_1.default.findById(req.params.patientId);
        }
        else {
            patient = await Patient_1.default.findOne({
                _id: req.params.patientId,
                workplaceId: req.user?.workplaceId || req.workspace?._id,
            });
        }
        if (!patient) {
            res.status(404).json({ message: 'Patient not found or access denied' });
            return;
        }
        const workplaceId = req.user?.role === 'super_admin'
            ? patient.workplaceId
            : (req.user?.workplaceId || req.workspace?._id);
        const query = {
            patient: req.params.patientId,
            workplaceId: workplaceId,
            deletedAt: { $exists: false },
        };
        if (type)
            query.type = type;
        if (priority)
            query.priority = priority;
        const notes = await ClinicalNote_1.default.find(query)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage')
            .sort({ createdAt: -1 });
        const total = await ClinicalNote_1.default.countDocuments(query);
        await auditService_1.AuditService.createAuditLog({
            action: 'PATIENT_DATA_ACCESSED',
            userId: req.user?.id || 'unknown',
            details: {
                patientId: req.params.patientId,
                accessType: 'clinical_notes',
                resultCount: notes.length,
                noteCount: notes.length,
                filters: { type, priority },
            },
            complianceCategory: 'patient_privacy',
            riskLevel: 'medium',
        });
        res.json({
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
            patient: {
                _id: patient._id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                mrn: patient.mrn,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPatientNotes = getPatientNotes;
const searchNotes = async (req, res) => {
    try {
        console.log('=== SEARCH NOTES DEBUG ===');
        console.log('User role:', req.user?.role);
        console.log('User workplaceId:', req.user?.workplaceId);
        console.log('Tenancy filter from middleware:', req.tenancyFilter);
        const { query: searchQuery, page = 1, limit = 10, type, priority, patientId, dateFrom, dateTo, } = req.query;
        console.log('Search query:', searchQuery);
        console.log('Search filters:', {
            page,
            limit,
            type,
            priority,
            patientId,
            dateFrom,
            dateTo,
        });
        if (!searchQuery) {
            res.status(400).json({ message: 'Search query is required' });
            return;
        }
        const baseQuery = { ...req.tenancyFilter };
        if (type)
            baseQuery.type = type;
        if (priority)
            baseQuery.priority = priority;
        if (patientId)
            baseQuery.patient = patientId;
        if (dateFrom || dateTo) {
            baseQuery.createdAt = {};
            if (dateFrom)
                baseQuery.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                baseQuery.createdAt.$lte = new Date(dateTo);
        }
        const searchRegex = new RegExp(searchQuery, 'i');
        console.log('Search regex created:', searchRegex.source, 'flags:', searchRegex.flags);
        const searchConditions = {
            $or: [
                { title: searchRegex },
                { 'content.subjective': searchRegex },
                { 'content.objective': searchRegex },
                { 'content.assessment': searchRegex },
                { 'content.plan': searchRegex },
                { recommendations: { $elemMatch: { $regex: searchRegex } } },
                { tags: { $elemMatch: { $regex: searchRegex } } },
            ],
        };
        const finalQuery = { ...baseQuery, ...searchConditions };
        console.log('Final query for search:', JSON.stringify(finalQuery, (key, value) => {
            if (value instanceof RegExp) {
                return { $regex: value.source, $options: value.flags };
            }
            return value;
        }, 2));
        const notes = await ClinicalNote_1.default.find(finalQuery)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage')
            .sort({ createdAt: -1 });
        const total = await ClinicalNote_1.default.countDocuments(finalQuery);
        console.log('Search results count:', notes.length);
        console.log('Total documents matching query:', total);
        console.log('=== END SEARCH NOTES DEBUG ===');
        try {
            await auditService_1.AuditService.createAuditLog({
                action: 'SEARCH_CLINICAL_NOTES',
                userId: req.user?.id || 'unknown',
                resourceType: 'ClinicalNote',
                resourceId: new mongoose_1.default.Types.ObjectId(),
                details: {
                    searchQuery,
                    filters: { type, priority, patientId, dateFrom, dateTo },
                    resultCount: notes.length,
                    page: Number(page),
                    limit: Number(limit),
                },
                complianceCategory: 'data_access',
                riskLevel: 'medium',
            });
        }
        catch (auditError) {
            console.error('Failed to create audit log for search:', auditError);
        }
        res.json({
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
            searchQuery,
            filters: { type, priority, patientId, dateFrom, dateTo },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.searchNotes = searchNotes;
const getNotesWithFilters = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, priority, patientId, clinicianId, dateFrom, dateTo, isConfidential, followUpRequired, tags, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
        const query = {
            workplaceId: req.user?.workplaceId || req.workspace?._id,
            deletedAt: { $exists: false },
        };
        if (type)
            query.type = type;
        if (priority)
            query.priority = priority;
        if (patientId)
            query.patient = patientId;
        if (clinicianId)
            query.pharmacist = clinicianId;
        if (isConfidential !== undefined)
            query.isConfidential = isConfidential === 'true';
        if (followUpRequired !== undefined)
            query.followUpRequired = followUpRequired === 'true';
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
        }
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom)
                query.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                query.createdAt.$lte = new Date(dateTo);
        }
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const notes = await ClinicalNote_1.default.find(query)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage')
            .sort(sortObj);
        const total = await ClinicalNote_1.default.countDocuments(query);
        const auditContext = auditService_1.AuditService.createAuditContext(req);
        await auditService_1.AuditService.logActivity(auditContext, {
            action: 'FILTER_CLINICAL_NOTES',
            resourceType: 'ClinicalNote',
            resourceId: new mongoose_1.default.Types.ObjectId(),
            details: {
                filters: {
                    type,
                    priority,
                    patientId,
                    clinicianId,
                    dateFrom,
                    dateTo,
                    isConfidential,
                    followUpRequired,
                    tags,
                },
                resultCount: notes.length,
                sortBy,
                sortOrder,
            },
            complianceCategory: 'data_access',
            riskLevel: 'low',
        });
        res.json({
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
            appliedFilters: {
                type,
                priority,
                patientId,
                clinicianId,
                dateFrom,
                dateTo,
                isConfidential,
                followUpRequired,
                tags,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getNotesWithFilters = getNotesWithFilters;
const bulkUpdateNotes = async (req, res) => {
    try {
        const { noteIds, updates } = req.body;
        if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Note IDs array is required',
            });
            return;
        }
        if (!updates || Object.keys(updates).length === 0) {
            res.status(400).json({
                success: false,
                message: 'Updates object is required',
            });
            return;
        }
        const existingNotes = req.clinicalNotes;
        const confidentialNoteService = confidentialNoteService_1.default.getInstance();
        if (!existingNotes) {
            res.status(400).json({
                success: false,
                message: 'Clinical notes not found',
            });
            return;
        }
        const confidentialNotes = existingNotes.filter((note) => note.isConfidential);
        if (confidentialNotes.length > 0) {
            const canModifyConfidential = confidentialNotes.every((note) => confidentialNoteService.canModifyConfidentialNote(req.user, note));
            if (!canModifyConfidential) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to modify some confidential notes',
                    confidentialNoteCount: confidentialNotes.length,
                });
                return;
            }
        }
        if (updates.isConfidential === true) {
            if (!confidentialNoteService.canCreateConfidentialNotes(req.user)) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to mark notes as confidential',
                });
                return;
            }
        }
        const updateData = {
            ...updates,
            lastModifiedBy: req.user?.id,
            updatedAt: new Date(),
        };
        if (updates.isConfidential) {
            Object.assign(updateData, confidentialNoteService.applyConfidentialSecurity(updateData));
        }
        const result = await ClinicalNote_1.default.updateMany({
            _id: { $in: noteIds },
            ...req.tenancyFilter,
        }, updateData, { runValidators: true });
        const updatedNotes = await ClinicalNote_1.default.find({
            _id: { $in: noteIds },
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role');
        await auditLogging_1.auditOperations.bulkOperation(req, 'UPDATE_NOTES', 'ClinicalNote', noteIds, {
            updatedFields: Object.keys(updates),
            affectedCount: result.modifiedCount,
            confidentialNotesAffected: confidentialNotes.length,
            updates: confidentialNoteService.sanitizeForAudit(updates),
        });
        if (confidentialNotes.length > 0) {
            for (const note of confidentialNotes) {
                await confidentialNoteService.logConfidentialAccess(req, note._id.toString(), 'BULK_UPDATE', {
                    noteTitle: note.title,
                    noteType: note.type,
                    bulkOperation: true,
                });
            }
        }
        res.json({
            success: true,
            message: `Successfully updated ${result.modifiedCount} notes`,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            notes: updatedNotes,
            confidentialNotesAffected: confidentialNotes.length,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.bulkUpdateNotes = bulkUpdateNotes;
const bulkDeleteNotes = async (req, res) => {
    try {
        const { noteIds } = req.body;
        if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Note IDs array is required',
            });
            return;
        }
        const existingNotes = req.clinicalNotes;
        const confidentialNoteService = confidentialNoteService_1.default.getInstance();
        if (!existingNotes) {
            res.status(400).json({
                success: false,
                message: 'Clinical notes not found',
            });
            return;
        }
        const confidentialNotes = existingNotes.filter((note) => note.isConfidential);
        if (confidentialNotes.length > 0) {
            const canDeleteConfidential = confidentialNotes.every((note) => confidentialNoteService.canModifyConfidentialNote(req.user, note));
            if (!canDeleteConfidential) {
                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions to delete some confidential notes',
                    confidentialNoteCount: confidentialNotes.length,
                });
                return;
            }
        }
        const noteDetails = existingNotes.map((note) => ({
            id: note._id,
            title: note.title,
            type: note.type,
            patientId: note.patient,
            isConfidential: note.isConfidential,
            attachmentCount: note.attachments?.length || 0,
        }));
        const result = await ClinicalNote_1.default.updateMany({
            _id: { $in: noteIds },
            ...req.tenancyFilter,
        }, {
            deletedAt: new Date(),
            deletedBy: req.user?.id,
            lastModifiedBy: req.user?.id,
        });
        for (const note of existingNotes) {
            if (note.attachments && note.attachments.length > 0) {
                for (const attachment of note.attachments) {
                    try {
                        const filePath = path_1.default.join(process.cwd(), 'uploads', attachment.fileName);
                        if (fs_1.default.existsSync(filePath)) {
                            await (0, uploadService_1.deleteFile)(filePath);
                        }
                    }
                    catch (fileError) {
                        console.error('Error deleting attachment:', fileError);
                    }
                }
            }
        }
        await auditLogging_1.auditOperations.bulkOperation(req, 'DELETE_NOTES', 'ClinicalNote', noteIds, {
            deletedCount: result.modifiedCount,
            confidentialNotesDeleted: confidentialNotes.length,
            noteDetails: noteDetails.map((detail) => detail.isConfidential
                ? { ...detail, title: '[CONFIDENTIAL_NOTE]' }
                : detail),
            totalAttachmentsDeleted: noteDetails.reduce((sum, note) => sum + note.attachmentCount, 0),
        });
        if (confidentialNotes.length > 0) {
            for (const note of confidentialNotes) {
                await confidentialNoteService.logConfidentialAccess(req, note._id.toString(), 'BULK_DELETE', {
                    noteTitle: note.title,
                    noteType: note.type,
                    bulkOperation: true,
                    permanentDeletion: false,
                });
            }
        }
        res.json({
            success: true,
            message: `Successfully deleted ${result.modifiedCount} notes`,
            deletedCount: result.modifiedCount,
            confidentialNotesDeleted: confidentialNotes.length,
            attachmentsDeleted: noteDetails.reduce((sum, note) => sum + note.attachmentCount, 0),
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.bulkDeleteNotes = bulkDeleteNotes;
const uploadAttachment = async (req, res) => {
    try {
        const noteId = req.params.id;
        const note = await ClinicalNote_1.default.findOne({
            _id: noteId,
            workplaceId: req.user?.workplaceId || req.workspace?._id,
            deletedAt: { $exists: false },
        });
        if (!note) {
            res
                .status(404)
                .json({ message: 'Clinical note not found or access denied' });
            return;
        }
        if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
            res.status(400).json({ message: 'No files uploaded' });
            return;
        }
        const uploadedFiles = Array.isArray(req.files) ? req.files : [req.files];
        const attachmentData = [];
        for (const file of uploadedFiles) {
            if (file && 'filename' in file && typeof file.filename === 'string') {
                const attachment = {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    fileName: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: (0, uploadService_1.getFileUrl)(file.filename),
                    uploadedAt: new Date(),
                    uploadedBy: req.user?.id,
                };
                attachmentData.push(attachment);
            }
        }
        const updatedNote = await ClinicalNote_1.default.findByIdAndUpdate(noteId, {
            $push: { attachments: { $each: attachmentData } },
            lastModifiedBy: req.user?.id,
            updatedAt: new Date(),
        }, { new: true, runValidators: true })
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role');
        const auditContext = auditService_1.AuditService.createAuditContext(req);
        await auditService_1.AuditService.logActivity(auditContext, {
            action: 'UPLOAD_NOTE_ATTACHMENT',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient,
            details: {
                noteTitle: note.title,
                attachmentCount: attachmentData.length,
                attachments: attachmentData.map((att) => ({
                    fileName: att.fileName,
                    originalName: att.originalName,
                    size: att.size,
                    mimeType: att.mimeType,
                })),
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'medium',
        });
        res.status(201).json({
            message: 'Files uploaded successfully',
            attachments: attachmentData,
            note: updatedNote,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.uploadAttachment = uploadAttachment;
const deleteAttachment = async (req, res) => {
    try {
        const { id: noteId, attachmentId } = req.params;
        const note = await ClinicalNote_1.default.findOne({
            _id: noteId,
            workplaceId: req.user?.workplaceId || req.workspace?._id,
            deletedAt: { $exists: false },
        });
        if (!note) {
            res
                .status(404)
                .json({ message: 'Clinical note not found or access denied' });
            return;
        }
        const attachment = note.attachments?.find((att) => att._id?.toString() === attachmentId);
        if (!attachment) {
            res.status(404).json({ message: 'Attachment not found' });
            return;
        }
        try {
            const filePath = path_1.default.join(process.cwd(), 'uploads', attachment.fileName);
            if (fs_1.default.existsSync(filePath)) {
                await (0, uploadService_1.deleteFile)(filePath);
            }
        }
        catch (fileError) {
            console.error('Error deleting physical file:', fileError);
        }
        const updatedNote = await ClinicalNote_1.default.findByIdAndUpdate(noteId, {
            $pull: { attachments: { _id: attachmentId } },
            lastModifiedBy: req.user?.id,
            updatedAt: new Date(),
        }, { new: true })
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role');
        const auditContext = auditService_1.AuditService.createAuditContext(req);
        await auditService_1.AuditService.logActivity(auditContext, {
            action: 'DELETE_NOTE_ATTACHMENT',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient,
            details: {
                noteTitle: note.title,
                deletedAttachment: {
                    fileName: attachment.fileName,
                    originalName: attachment.originalName,
                    size: attachment.size,
                },
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'medium',
        });
        res.json({
            message: 'Attachment deleted successfully',
            note: updatedNote,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.deleteAttachment = deleteAttachment;
const downloadAttachment = async (req, res) => {
    try {
        const { id: noteId, attachmentId } = req.params;
        const note = await ClinicalNote_1.default.findOne({
            _id: noteId,
            workplaceId: req.user?.workplaceId || req.workspace?._id,
            deletedAt: { $exists: false },
        });
        if (!note) {
            res
                .status(404)
                .json({ message: 'Clinical note not found or access denied' });
            return;
        }
        const attachment = note.attachments?.find((att) => att._id?.toString() === attachmentId);
        if (!attachment) {
            res.status(404).json({ message: 'Attachment not found' });
            return;
        }
        const filePath = path_1.default.join(process.cwd(), 'uploads', attachment.fileName);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ message: 'File not found on server' });
            return;
        }
        const auditContext = auditService_1.AuditService.createAuditContext(req);
        await auditService_1.AuditService.logActivity(auditContext, {
            action: 'DOWNLOAD_NOTE_ATTACHMENT',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient,
            details: {
                noteTitle: note.title,
                attachment: {
                    fileName: attachment.fileName,
                    originalName: attachment.originalName,
                    size: attachment.size,
                },
            },
            complianceCategory: 'data_access',
            riskLevel: 'medium',
        });
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
        res.setHeader('Content-Type', attachment.mimeType);
        res.sendFile(filePath);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.downloadAttachment = downloadAttachment;
const getNoteStatistics = async (req, res) => {
    try {
        const workplaceId = req.user?.workplaceId || req.workspace?._id;
        const { dateFrom, dateTo } = req.query;
        const dateFilter = {};
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom)
                dateFilter.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                dateFilter.createdAt.$lte = new Date(dateTo);
        }
        const stats = await ClinicalNote_1.default.aggregate([
            {
                $match: {
                    workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
                    deletedAt: { $exists: false },
                    ...dateFilter,
                },
            },
            {
                $group: {
                    _id: null,
                    totalNotes: { $sum: 1 },
                    notesByType: {
                        $push: '$type',
                    },
                    notesByPriority: {
                        $push: '$priority',
                    },
                    confidentialNotes: {
                        $sum: { $cond: ['$isConfidential', 1, 0] },
                    },
                    notesWithFollowUp: {
                        $sum: { $cond: ['$followUpRequired', 1, 0] },
                    },
                    notesWithAttachments: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $size: { $ifNull: ['$attachments', []] } }, 0] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);
        const result = stats[0] || {
            totalNotes: 0,
            notesByType: [],
            notesByPriority: [],
            confidentialNotes: 0,
            notesWithFollowUp: 0,
            notesWithAttachments: 0,
        };
        const typeCount = result.notesByType.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        const priorityCount = result.notesByPriority.reduce((acc, priority) => {
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, {});
        res.json({
            totalNotes: result.totalNotes,
            typeDistribution: typeCount,
            priorityDistribution: priorityCount,
            confidentialNotes: result.confidentialNotes,
            notesWithFollowUp: result.notesWithFollowUp,
            notesWithAttachments: result.notesWithAttachments,
            dateRange: { dateFrom, dateTo },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getNoteStatistics = getNoteStatistics;
//# sourceMappingURL=noteController.js.map