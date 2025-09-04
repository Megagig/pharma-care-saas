"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNoteStatistics = exports.downloadAttachment = exports.deleteAttachment = exports.uploadAttachment = exports.bulkDeleteNotes = exports.bulkUpdateNotes = exports.getNotesWithFilters = exports.searchNotes = exports.getPatientNotes = exports.deleteNote = exports.updateNote = exports.createNote = exports.getNote = exports.getNotes = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ClinicalNote_1 = __importDefault(require("../models/ClinicalNote"));
const Patient_1 = __importDefault(require("../models/Patient"));
const auditService_1 = __importDefault(require("../services/auditService"));
const uploadService_1 = require("../utils/uploadService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getNotes = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, priority, patientId, clinicianId, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc', isConfidential } = req.query;
        const query = {
            workplaceId: req.user.workplaceId || req.workplace?.id
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
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'LIST_CLINICAL_NOTES',
            resourceType: 'ClinicalNote',
            resourceId: new mongoose_1.default.Types.ObjectId(),
            details: {
                filters: { type, priority, patientId, clinicianId, dateFrom, dateTo },
                resultCount: notes.length,
                page: Number(page),
                limit: Number(limit)
            },
            complianceCategory: 'data_access',
            riskLevel: 'low'
        });
        res.json({
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
            filters: { type, priority, patientId, clinicianId, dateFrom, dateTo }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getNotes = getNotes;
const getNote = async (req, res) => {
    try {
        const note = await ClinicalNote_1.default.findOne({
            _id: req.params.id,
            pharmacist: req.user.id
        }).populate('patient medications');
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        res.json({ note });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getNote = getNote;
const createNote = async (req, res) => {
    try {
        const { patient: patientId, type, title, content } = req.body;
        if (!patientId || !type || !title) {
            res.status(400).json({
                message: 'Missing required fields: patient, type, and title are required'
            });
            return;
        }
        const patient = await Patient_1.default.findOne({
            _id: patientId,
            workplaceId: req.user.workplaceId || req.workplace?.id
        });
        if (!patient) {
            res.status(404).json({ message: 'Patient not found or access denied' });
            return;
        }
        const noteData = {
            ...req.body,
            patient: patientId,
            pharmacist: req.user.id,
            workplaceId: req.user.workplaceId || req.workplace?.id,
            locationId: req.user.locationId,
            createdBy: req.user.id,
            lastModifiedBy: req.user.id
        };
        const note = await ClinicalNote_1.default.create(noteData);
        const populatedNote = await ClinicalNote_1.default.findById(note._id)
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage');
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'CREATE_CLINICAL_NOTE',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: new mongoose_1.default.Types.ObjectId(patientId),
            newValues: noteData,
            details: {
                noteType: type,
                title,
                priority: req.body.priority || 'medium',
                isConfidential: req.body.isConfidential || false
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: req.body.isConfidential ? 'high' : 'medium'
        });
        res.status(201).json({ note: populatedNote });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createNote = createNote;
const updateNote = async (req, res) => {
    try {
        const existingNote = await ClinicalNote_1.default.findOne({
            _id: req.params.id,
            workplaceId: req.user.workplaceId || req.workplace?.id
        });
        if (!existingNote) {
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        const oldValues = existingNote.toObject();
        const updateData = {
            ...req.body,
            lastModifiedBy: req.user.id,
            updatedAt: new Date()
        };
        const note = await ClinicalNote_1.default.findOneAndUpdate({ _id: req.params.id, workplaceId: req.user.workplaceId || req.workplace?.id }, updateData, { new: true, runValidators: true }).populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage');
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found or access denied' });
            return;
        }
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'UPDATE_CLINICAL_NOTE',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient._id,
            oldValues,
            newValues: note.toObject(),
            changedFields: Object.keys(req.body),
            details: {
                noteType: note.type,
                title: note.title,
                priority: note.priority,
                isConfidential: note.isConfidential
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: note.isConfidential ? 'high' : 'medium'
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
        const note = await ClinicalNote_1.default.findOne({
            _id: req.params.id,
            workplaceId: req.user.workplaceId || req.workplace?.id
        });
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found' });
            return;
        }
        const noteData = note.toObject();
        const deletedNote = await ClinicalNote_1.default.findOneAndUpdate({ _id: req.params.id, workplaceId: req.user.workplaceId || req.workplace?.id }, {
            deletedAt: new Date(),
            deletedBy: req.user.id,
            lastModifiedBy: req.user.id
        }, { new: true });
        if (!deletedNote) {
            res.status(404).json({ message: 'Clinical note not found or access denied' });
            return;
        }
        if (note.attachments && note.attachments.length > 0) {
            for (const attachment of note.attachments) {
                try {
                    const filePath = path_1.default.join(process.cwd(), 'uploads', attachment);
                    if (fs_1.default.existsSync(filePath)) {
                        await (0, uploadService_1.deleteFile)(filePath);
                    }
                }
                catch (fileError) {
                    console.error('Error deleting attachment:', fileError);
                }
            }
        }
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'DELETE_CLINICAL_NOTE',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient,
            oldValues: noteData,
            details: {
                noteType: note.type,
                title: note.title,
                priority: note.priority,
                isConfidential: note.isConfidential,
                attachmentCount: note.attachments?.length || 0
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'critical'
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
        const { page = 1, limit = 10, type, priority } = req.query;
        const patient = await Patient_1.default.findOne({
            _id: req.params.patientId,
            workplaceId: req.user.workplaceId || req.workplace?.id
        });
        if (!patient) {
            res.status(404).json({ message: 'Patient not found or access denied' });
            return;
        }
        const query = {
            patient: req.params.patientId,
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
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
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logPatientAccess(auditContext, new mongoose_1.default.Types.ObjectId(req.params.patientId), 'view', {
            accessType: 'clinical_notes',
            noteCount: notes.length,
            filters: { type, priority }
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
                mrn: patient.mrn
            }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getPatientNotes = getPatientNotes;
const searchNotes = async (req, res) => {
    try {
        const { query: searchQuery, page = 1, limit = 10, type, priority, patientId, dateFrom, dateTo } = req.query;
        if (!searchQuery) {
            res.status(400).json({ message: 'Search query is required' });
            return;
        }
        const baseQuery = {
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        };
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
        const searchConditions = {
            $or: [
                { title: searchRegex },
                { 'content.subjective': searchRegex },
                { 'content.objective': searchRegex },
                { 'content.assessment': searchRegex },
                { 'content.plan': searchRegex },
                { recommendations: { $elemMatch: { $regex: searchRegex } } },
                { tags: { $elemMatch: { $regex: searchRegex } } }
            ]
        };
        const finalQuery = { ...baseQuery, ...searchConditions };
        const notes = await ClinicalNote_1.default.find(finalQuery)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role')
            .populate('medications', 'name dosage')
            .sort({ createdAt: -1 });
        const total = await ClinicalNote_1.default.countDocuments(finalQuery);
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'SEARCH_CLINICAL_NOTES',
            resourceType: 'ClinicalNote',
            resourceId: new mongoose_1.default.Types.ObjectId(),
            details: {
                searchQuery,
                filters: { type, priority, patientId, dateFrom, dateTo },
                resultCount: notes.length,
                page: Number(page),
                limit: Number(limit)
            },
            complianceCategory: 'data_access',
            riskLevel: 'medium'
        });
        res.json({
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
            searchQuery,
            filters: { type, priority, patientId, dateFrom, dateTo }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.searchNotes = searchNotes;
const getNotesWithFilters = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, priority, patientId, clinicianId, dateFrom, dateTo, isConfidential, followUpRequired, tags, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const query = {
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
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
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'FILTER_CLINICAL_NOTES',
            resourceType: 'ClinicalNote',
            resourceId: new mongoose_1.default.Types.ObjectId(),
            details: {
                filters: {
                    type, priority, patientId, clinicianId, dateFrom, dateTo,
                    isConfidential, followUpRequired, tags
                },
                resultCount: notes.length,
                sortBy,
                sortOrder
            },
            complianceCategory: 'data_access',
            riskLevel: 'low'
        });
        res.json({
            notes,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total,
            appliedFilters: {
                type, priority, patientId, clinicianId, dateFrom, dateTo,
                isConfidential, followUpRequired, tags
            }
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
            res.status(400).json({ message: 'Note IDs array is required' });
            return;
        }
        if (!updates || Object.keys(updates).length === 0) {
            res.status(400).json({ message: 'Updates object is required' });
            return;
        }
        const existingNotes = await ClinicalNote_1.default.find({
            _id: { $in: noteIds },
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        });
        if (existingNotes.length !== noteIds.length) {
            res.status(404).json({
                message: 'Some notes not found or access denied',
                found: existingNotes.length,
                requested: noteIds.length
            });
            return;
        }
        const updateData = {
            ...updates,
            lastModifiedBy: req.user.id,
            updatedAt: new Date()
        };
        const result = await ClinicalNote_1.default.updateMany({
            _id: { $in: noteIds },
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        }, updateData, { runValidators: true });
        const updatedNotes = await ClinicalNote_1.default.find({
            _id: { $in: noteIds }
        }).populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role');
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'BULK_UPDATE_CLINICAL_NOTES',
            resourceType: 'ClinicalNote',
            resourceId: new mongoose_1.default.Types.ObjectId(),
            newValues: updateData,
            details: {
                noteIds,
                updatedFields: Object.keys(updates),
                affectedCount: result.modifiedCount,
                updates
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'high'
        });
        res.json({
            message: `Successfully updated ${result.modifiedCount} notes`,
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            notes: updatedNotes
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.bulkUpdateNotes = bulkUpdateNotes;
const bulkDeleteNotes = async (req, res) => {
    try {
        const { noteIds } = req.body;
        if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
            res.status(400).json({ message: 'Note IDs array is required' });
            return;
        }
        const existingNotes = await ClinicalNote_1.default.find({
            _id: { $in: noteIds },
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        });
        if (existingNotes.length !== noteIds.length) {
            res.status(404).json({
                message: 'Some notes not found or access denied',
                found: existingNotes.length,
                requested: noteIds.length
            });
            return;
        }
        const result = await ClinicalNote_1.default.updateMany({
            _id: { $in: noteIds },
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        }, {
            deletedAt: new Date(),
            deletedBy: req.user.id,
            lastModifiedBy: req.user.id
        });
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'BULK_DELETE_CLINICAL_NOTES',
            resourceType: 'ClinicalNote',
            resourceId: new mongoose_1.default.Types.ObjectId(),
            details: {
                noteIds,
                deletedCount: result.modifiedCount,
                noteDetails: existingNotes.map(note => ({
                    id: note._id,
                    title: note.title,
                    type: note.type,
                    patientId: note.patient
                }))
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'critical'
        });
        res.json({
            message: `Successfully deleted ${result.modifiedCount} notes`,
            deletedCount: result.modifiedCount
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.bulkDeleteNotes = bulkDeleteNotes;
const uploadAttachment = async (req, res) => {
    try {
        const noteId = req.params.id;
        const note = await ClinicalNote_1.default.findOne({
            _id: noteId,
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        });
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found or access denied' });
            return;
        }
        if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
            res.status(400).json({ message: 'No files uploaded' });
            return;
        }
        const uploadedFiles = Array.isArray(req.files) ? req.files : [req.files];
        const attachmentData = [];
        for (const file of uploadedFiles) {
            if ('filename' in file) {
                const attachment = {
                    _id: new mongoose_1.default.Types.ObjectId(),
                    fileName: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    url: (0, uploadService_1.getFileUrl)(file.filename),
                    uploadedAt: new Date(),
                    uploadedBy: req.user.id
                };
                attachmentData.push(attachment);
            }
        }
        const updatedNote = await ClinicalNote_1.default.findByIdAndUpdate(noteId, {
            $push: { attachments: { $each: attachmentData } },
            lastModifiedBy: req.user.id,
            updatedAt: new Date()
        }, { new: true, runValidators: true }).populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role');
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'UPLOAD_NOTE_ATTACHMENT',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient,
            details: {
                noteTitle: note.title,
                attachmentCount: attachmentData.length,
                attachments: attachmentData.map(att => ({
                    fileName: att.fileName,
                    originalName: att.originalName,
                    size: att.size,
                    mimeType: att.mimeType
                }))
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'medium'
        });
        res.status(201).json({
            message: 'Files uploaded successfully',
            attachments: attachmentData,
            note: updatedNote
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
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        });
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found or access denied' });
            return;
        }
        const attachment = note.attachments?.find(att => att._id?.toString() === attachmentId);
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
            lastModifiedBy: req.user.id,
            updatedAt: new Date()
        }, { new: true }).populate('patient', 'firstName lastName mrn')
            .populate('pharmacist', 'firstName lastName role');
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'DELETE_NOTE_ATTACHMENT',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient,
            details: {
                noteTitle: note.title,
                deletedAttachment: {
                    fileName: attachment.fileName,
                    originalName: attachment.originalName,
                    size: attachment.size
                }
            },
            complianceCategory: 'clinical_documentation',
            riskLevel: 'medium'
        });
        res.json({
            message: 'Attachment deleted successfully',
            note: updatedNote
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
            workplaceId: req.user.workplaceId || req.workplace?.id,
            deletedAt: { $exists: false }
        });
        if (!note) {
            res.status(404).json({ message: 'Clinical note not found or access denied' });
            return;
        }
        const attachment = note.attachments?.find(att => att._id?.toString() === attachmentId);
        if (!attachment) {
            res.status(404).json({ message: 'Attachment not found' });
            return;
        }
        const filePath = path_1.default.join(process.cwd(), 'uploads', attachment.fileName);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ message: 'File not found on server' });
            return;
        }
        const auditContext = auditService_1.default.createAuditContext(req);
        await auditService_1.default.logActivity(auditContext, {
            action: 'DOWNLOAD_NOTE_ATTACHMENT',
            resourceType: 'ClinicalNote',
            resourceId: note._id,
            patientId: note.patient,
            details: {
                noteTitle: note.title,
                attachment: {
                    fileName: attachment.fileName,
                    originalName: attachment.originalName,
                    size: attachment.size
                }
            },
            complianceCategory: 'data_access',
            riskLevel: 'medium'
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
        const workplaceId = req.user.workplaceId || req.workplace?.id;
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
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalNotes: { $sum: 1 },
                    notesByType: {
                        $push: '$type'
                    },
                    notesByPriority: {
                        $push: '$priority'
                    },
                    confidentialNotes: {
                        $sum: { $cond: ['$isConfidential', 1, 0] }
                    },
                    notesWithFollowUp: {
                        $sum: { $cond: ['$followUpRequired', 1, 0] }
                    },
                    notesWithAttachments: {
                        $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$attachments', []] } }, 0] }, 1, 0] }
                    }
                }
            }
        ]);
        const result = stats[0] || {
            totalNotes: 0,
            notesByType: [],
            notesByPriority: [],
            confidentialNotes: 0,
            notesWithFollowUp: 0,
            notesWithAttachments: 0
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
            dateRange: { dateFrom, dateTo }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getNoteStatistics = getNoteStatistics;
//# sourceMappingURL=noteController.js.map