import { Request, Response } from 'express';
import mongoose from 'mongoose';
import ClinicalNote from '../models/ClinicalNote';
import Patient from '../models/Patient';
import AuditService from '../services/auditService';
import ConfidentialNoteService from '../services/confidentialNoteService';
import { EnhancedTenancyGuard } from '../utils/tenancyGuard';
import { upload, deleteFile, getFileUrl } from '../utils/uploadService';
import { auditOperations } from '../middlewares/auditLogging';
import { AuthRequest } from '../types/auth';
import path from 'path';
import fs from 'fs';

export const getNotes = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      priority,
      patientId,
      clinicianId,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isConfidential,
    } = req.query;

    // Use tenancy filter from middleware
    const query: any = { ...req.tenancyFilter };

    // Apply filters
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (patientId) query.patient = patientId;
    if (clinicianId) query.pharmacist = clinicianId;

    // Handle confidential notes based on user permissions
    if (isConfidential !== undefined) {
      const canAccessConfidential = ['Owner', 'Pharmacist'].includes(
        req.user?.workplaceRole || ''
      );

      if (isConfidential === 'true') {
        if (!canAccessConfidential) {
          res.status(403).json({
            success: false,
            message: 'Insufficient permissions to access confidential notes',
          });
          return;
        }
        query.isConfidential = true;
      } else {
        query.isConfidential = { $ne: true };
      }
    } else {
      // If no specific filter, exclude confidential notes for users without permission
      const canAccessConfidential = ['Owner', 'Pharmacist'].includes(
        req.user?.workplaceRole || ''
      );
      if (!canAccessConfidential) {
        query.isConfidential = { $ne: true };
      }
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const notes = await ClinicalNote.find(query)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role')
      .populate('medications', 'name dosage')
      .sort(sortObj);

    const total = await ClinicalNote.countDocuments(query);

    // Log audit trail for data access
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
      action: 'LIST_CLINICAL_NOTES',
      resourceType: 'ClinicalNote',
      resourceId: new mongoose.Types.ObjectId(),
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNote = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Note is already validated and loaded by middleware
    const note = req.clinicalNote;

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Clinical note not found',
      });
      return;
    }

    // Populate additional fields if needed
    await note.populate([
      { path: 'patient', select: 'firstName lastName mrn dateOfBirth' },
      { path: 'pharmacist', select: 'firstName lastName role' },
      { path: 'medications', select: 'name dosage strength' },
    ]);

    // Log confidential note access if applicable
    if (note.isConfidential) {
      const auditContext = AuditService.createAuditContext(req);
      await AuditService.logActivity(auditContext, {
        action: 'VIEW_CONFIDENTIAL_NOTE',
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const createNote = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate required fields
    const { patient: patientId, type, title, content } = req.body;

    if (!patientId || !type || !title) {
      res.status(400).json({
        success: false,
        message:
          'Missing required fields: patient, type, and title are required',
      });
      return;
    }

    // Patient is already validated by middleware
    const patient = req.patient;
    const workplaceId = req.workspaceContext?.workspace?._id;

    // Validate confidential note creation permissions
    if (req.body.isConfidential) {
      const canCreateConfidential = ['Owner', 'Pharmacist'].includes(
        req.user?.workplaceRole || ''
      );
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

    const note = await ClinicalNote.create(noteData);

    // Populate the created note
    const populatedNote = await ClinicalNote.findById(note._id)
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role')
      .populate('medications', 'name dosage');

    // Log audit trail with enhanced details
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
      action: req.body.isConfidential
        ? 'CREATE_CONFIDENTIAL_NOTE'
        : 'CREATE_CLINICAL_NOTE',
      resourceType: 'ClinicalNote',
      resourceId: note._id,
      patientId: new mongoose.Types.ObjectId(patientId),
      newValues: {
        ...noteData,
        // Sanitize sensitive data in audit log
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateNote = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the existing note for audit trail
    const existingNote = await ClinicalNote.findOne({
      _id: req.params.id,
      workplaceId: req.user?.workplaceId || req.workspace?._id,
    });

    if (!existingNote) {
      res.status(404).json({ message: 'Clinical note not found' });
      return;
    }

    // Store old values for audit
    const oldValues = existingNote.toObject();

    // Update the note
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user?.id,
      updatedAt: new Date(),
    };

    const note = await ClinicalNote.findOneAndUpdate(
      {
        _id: req.params.id,
        workplaceId: req.user?.workplaceId || req.workspace?._id,
      },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role')
      .populate('medications', 'name dosage');

    if (!note) {
      res
        .status(404)
        .json({ message: 'Clinical note not found or access denied' });
      return;
    }

    // Log audit trail
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
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
        isConfidential: note.isConfidential,
      },
      complianceCategory: 'clinical_documentation',
      riskLevel: note.isConfidential ? 'high' : 'medium',
    });

    res.json({ note });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteNote = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the note first for audit trail
    const note = await ClinicalNote.findOne({
      _id: req.params.id,
      workplaceId: req.user?.workplaceId || req.workspace?._id,
    });

    if (!note) {
      res.status(404).json({ message: 'Clinical note not found' });
      return;
    }

    // Store note data for audit before deletion
    const noteData = note.toObject();

    // Implement soft deletion by adding deletedAt field
    const deletedNote = await ClinicalNote.findOneAndUpdate(
      {
        _id: req.params.id,
        workplaceId: req.user?.workplaceId || req.workspace?._id,
      },
      {
        deletedAt: new Date(),
        deletedBy: req.user?.id,
        lastModifiedBy: req.user?.id,
      },
      { new: true }
    );

    if (!deletedNote) {
      res
        .status(404)
        .json({ message: 'Clinical note not found or access denied' });
      return;
    }

    // Delete associated attachments
    if (note.attachments && note.attachments.length > 0) {
      for (const attachment of note.attachments) {
        try {
          const filePath = path.join(
            process.cwd(),
            'uploads',
            attachment.fileName
          );
          if (fs.existsSync(filePath)) {
            await deleteFile(filePath);
          }
        } catch (fileError) {
          console.error('Error deleting attachment:', fileError);
        }
      }
    }

    // Log audit trail
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
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
        attachmentCount: note.attachments?.length || 0,
      },
      complianceCategory: 'clinical_documentation',
      riskLevel: 'critical',
    });

    res.json({ message: 'Clinical note deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPatientNotes = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, type, priority } = req.query;

    // Verify patient exists and belongs to the same workplace
    const patient = await Patient.findOne({
      _id: req.params.patientId,
      workplaceId: req.user?.workplaceId || req.workspace?._id,
    });

    if (!patient) {
      res.status(404).json({ message: 'Patient not found or access denied' });
      return;
    }

    const query: any = {
      patient: req.params.patientId,
      workplaceId: req.user?.workplaceId || req.workspace?._id,
      deletedAt: { $exists: false }, // Exclude soft-deleted notes
    };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const notes = await ClinicalNote.find(query)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('pharmacist', 'firstName lastName role')
      .populate('medications', 'name dosage')
      .sort({ createdAt: -1 });

    const total = await ClinicalNote.countDocuments(query);

    // Log audit trail for patient data access
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logPatientAccess(
      auditContext,
      new mongoose.Types.ObjectId(req.params.patientId),
      'view',
      {
        accessType: 'clinical_notes',
        noteCount: notes.length,
        filters: { type, priority },
      }
    );

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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Enhanced search functionality with full-text search
export const searchNotes = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      query: searchQuery,
      page = 1,
      limit = 10,
      type,
      priority,
      patientId,
      dateFrom,
      dateTo,
    } = req.query;

    if (!searchQuery) {
      res.status(400).json({ message: 'Search query is required' });
      return;
    }

    // Build base query with tenancy isolation
    const baseQuery: any = {
      workplaceId: req.user?.workplaceId || req.workspace?._id,
      deletedAt: { $exists: false },
    };

    // Add filters
    if (type) baseQuery.type = type;
    if (priority) baseQuery.priority = priority;
    if (patientId) baseQuery.patient = patientId;

    // Date range filter
    if (dateFrom || dateTo) {
      baseQuery.createdAt = {};
      if (dateFrom) baseQuery.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) baseQuery.createdAt.$lte = new Date(dateTo as string);
    }

    // Full-text search across multiple fields
    const searchRegex = new RegExp(searchQuery as string, 'i');
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

    const notes = await ClinicalNote.find(finalQuery)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role')
      .populate('medications', 'name dosage')
      .sort({ createdAt: -1 });

    const total = await ClinicalNote.countDocuments(finalQuery);

    // Log audit trail for search
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
      action: 'SEARCH_CLINICAL_NOTES',
      resourceType: 'ClinicalNote',
      resourceId: new mongoose.Types.ObjectId(),
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

    res.json({
      notes,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
      searchQuery,
      filters: { type, priority, patientId, dateFrom, dateTo },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Advanced filtering with multiple criteria
export const getNotesWithFilters = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      priority,
      patientId,
      clinicianId,
      dateFrom,
      dateTo,
      isConfidential,
      followUpRequired,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build query with tenancy isolation
    const query: any = {
      workplaceId: req.user?.workplaceId || req.workspace?._id,
      deletedAt: { $exists: false },
    };

    // Apply all filters
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (patientId) query.patient = patientId;
    if (clinicianId) query.pharmacist = clinicianId;
    if (isConfidential !== undefined)
      query.isConfidential = isConfidential === 'true';
    if (followUpRequired !== undefined)
      query.followUpRequired = followUpRequired === 'true';

    // Tags filter (array contains any of the specified tags)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const notes = await ClinicalNote.find(query)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role')
      .populate('medications', 'name dosage')
      .sort(sortObj);

    const total = await ClinicalNote.countDocuments(query);

    // Log audit trail
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
      action: 'FILTER_CLINICAL_NOTES',
      resourceType: 'ClinicalNote',
      resourceId: new mongoose.Types.ObjectId(),
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Bulk update notes
export const bulkUpdateNotes = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

    // Notes are already validated by middleware
    const existingNotes = req.clinicalNotes;
    const confidentialNoteService = ConfidentialNoteService.getInstance();

    if (!existingNotes) {
      res.status(400).json({
        success: false,
        message: 'Clinical notes not found',
      });
      return;
    }

    // Check for confidential note updates
    const confidentialNotes = existingNotes.filter(
      (note: any) => note.isConfidential
    );
    if (confidentialNotes.length > 0) {
      const canModifyConfidential = confidentialNotes.every((note: any) =>
        confidentialNoteService.canModifyConfidentialNote(req.user!, note)
      );

      if (!canModifyConfidential) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to modify some confidential notes',
          confidentialNoteCount: confidentialNotes.length,
        });
        return;
      }
    }

    // Validate confidential note updates if isConfidential is being changed
    if (updates.isConfidential === true) {
      if (!confidentialNoteService.canCreateConfidentialNotes(req.user!)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to mark notes as confidential',
        });
        return;
      }
    }

    // Prepare update data
    const updateData = {
      ...updates,
      lastModifiedBy: req.user?.id,
      updatedAt: new Date(),
    };

    // Apply confidential security measures if needed
    if (updates.isConfidential) {
      Object.assign(
        updateData,
        confidentialNoteService.applyConfidentialSecurity(updateData)
      );
    }

    // Perform bulk update
    const result = await ClinicalNote.updateMany(
      {
        _id: { $in: noteIds },
        ...req.tenancyFilter,
      },
      updateData,
      { runValidators: true }
    );

    // Get updated notes for response
    const updatedNotes = await ClinicalNote.find({
      _id: { $in: noteIds },
    })
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role');

    // Log bulk operation audit trail
    await auditOperations.bulkOperation(
      req,
      'UPDATE_NOTES',
      'ClinicalNote',
      noteIds,
      {
        updatedFields: Object.keys(updates),
        affectedCount: result.modifiedCount,
        confidentialNotesAffected: confidentialNotes.length,
        updates: confidentialNoteService.sanitizeForAudit(updates),
      }
    );

    // Log confidential note access if applicable
    if (confidentialNotes.length > 0) {
      for (const note of confidentialNotes) {
        await confidentialNoteService.logConfidentialAccess(
          req,
          note._id.toString(),
          'BULK_UPDATE',
          {
            noteTitle: note.title,
            noteType: note.type,
            bulkOperation: true,
          }
        );
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Bulk delete notes (soft delete)
export const bulkDeleteNotes = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { noteIds } = req.body;

    if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Note IDs array is required',
      });
      return;
    }

    // Notes are already validated by middleware
    const existingNotes = req.clinicalNotes;
    const confidentialNoteService = ConfidentialNoteService.getInstance();

    if (!existingNotes) {
      res.status(400).json({
        success: false,
        message: 'Clinical notes not found',
      });
      return;
    }

    // Check for confidential note deletions
    const confidentialNotes = existingNotes.filter(
      (note: any) => note.isConfidential
    );
    if (confidentialNotes.length > 0) {
      const canDeleteConfidential = confidentialNotes.every((note: any) =>
        confidentialNoteService.canModifyConfidentialNote(req.user!, note)
      );

      if (!canDeleteConfidential) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete some confidential notes',
          confidentialNoteCount: confidentialNotes.length,
        });
        return;
      }
    }

    // Store note details for audit before deletion
    const noteDetails = existingNotes.map((note: any) => ({
      id: note._id,
      title: note.title,
      type: note.type,
      patientId: note.patient,
      isConfidential: note.isConfidential,
      attachmentCount: note.attachments?.length || 0,
    }));

    // Perform bulk soft delete
    const result = await ClinicalNote.updateMany(
      {
        _id: { $in: noteIds },
        ...req.tenancyFilter,
      },
      {
        deletedAt: new Date(),
        deletedBy: req.user?.id,
        lastModifiedBy: req.user?.id,
      }
    );

    // Delete associated attachments for all notes
    for (const note of existingNotes) {
      if (note.attachments && note.attachments.length > 0) {
        for (const attachment of note.attachments) {
          try {
            const filePath = path.join(
              process.cwd(),
              'uploads',
              attachment.fileName
            );
            if (fs.existsSync(filePath)) {
              await deleteFile(filePath);
            }
          } catch (fileError) {
            console.error('Error deleting attachment:', fileError);
          }
        }
      }
    }

    // Log bulk deletion audit trail
    await auditOperations.bulkOperation(
      req,
      'DELETE_NOTES',
      'ClinicalNote',
      noteIds,
      {
        deletedCount: result.modifiedCount,
        confidentialNotesDeleted: confidentialNotes.length,
        noteDetails: noteDetails.map((detail) =>
          detail.isConfidential
            ? { ...detail, title: '[CONFIDENTIAL_NOTE]' }
            : detail
        ),
        totalAttachmentsDeleted: noteDetails.reduce(
          (sum, note) => sum + note.attachmentCount,
          0
        ),
      }
    );

    // Log confidential note deletions separately
    if (confidentialNotes.length > 0) {
      for (const note of confidentialNotes) {
        await confidentialNoteService.logConfidentialAccess(
          req,
          note._id.toString(),
          'BULK_DELETE',
          {
            noteTitle: note.title,
            noteType: note.type,
            bulkOperation: true,
            permanentDeletion: false, // Soft delete
          }
        );
      }
    }

    res.json({
      success: true,
      message: `Successfully deleted ${result.modifiedCount} notes`,
      deletedCount: result.modifiedCount,
      confidentialNotesDeleted: confidentialNotes.length,
      attachmentsDeleted: noteDetails.reduce(
        (sum, note) => sum + note.attachmentCount,
        0
      ),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// File upload for note attachments
export const uploadAttachment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const noteId = req.params.id;

    // Verify note exists and belongs to user's workplace
    const note = await ClinicalNote.findOne({
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

    // Check if files were uploaded
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }

    const uploadedFiles = Array.isArray(req.files) ? req.files : [req.files];
    const attachmentData: any[] = [];

    // Process each uploaded file
    for (const file of uploadedFiles) {
      if (file && 'filename' in file && typeof file.filename === 'string') {
        const attachment = {
          _id: new mongoose.Types.ObjectId(),
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: getFileUrl(file.filename as string),
          uploadedAt: new Date(),
          uploadedBy: req.user?.id,
        };

        attachmentData.push(attachment);
      }
    }

    // Update note with new attachments
    const updatedNote = await ClinicalNote.findByIdAndUpdate(
      noteId,
      {
        $push: { attachments: { $each: attachmentData } },
        lastModifiedBy: req.user?.id,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role');

    // Log audit trail
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete attachment from note
export const deleteAttachment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: noteId, attachmentId } = req.params;

    // Verify note exists and belongs to user's workplace
    const note = await ClinicalNote.findOne({
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

    // Find the attachment
    const attachment = note.attachments?.find(
      (att) => att._id?.toString() === attachmentId
    );
    if (!attachment) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), 'uploads', attachment.fileName);
      if (fs.existsSync(filePath)) {
        await deleteFile(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
    }

    // Remove attachment from note
    const updatedNote = await ClinicalNote.findByIdAndUpdate(
      noteId,
      {
        $pull: { attachments: { _id: attachmentId } },
        lastModifiedBy: req.user?.id,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate('patient', 'firstName lastName mrn')
      .populate('pharmacist', 'firstName lastName role');

    // Log audit trail
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Download attachment
export const downloadAttachment = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: noteId, attachmentId } = req.params;

    // Verify note exists and belongs to user's workplace
    const note = await ClinicalNote.findOne({
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

    // Find the attachment
    const attachment = note.attachments?.find(
      (att) => att._id?.toString() === attachmentId
    );
    if (!attachment) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), 'uploads', attachment.fileName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File not found on server' });
      return;
    }

    // Log audit trail for file access
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logActivity(auditContext, {
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

    // Set appropriate headers and send file
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.originalName}"`
    );
    res.setHeader('Content-Type', attachment.mimeType);
    res.sendFile(filePath);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Get note statistics for dashboard
export const getNoteStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const workplaceId = req.user?.workplaceId || req.workspace?._id;
    const { dateFrom, dateTo } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo as string);
    }

    // Get statistics
    const stats = await ClinicalNote.aggregate([
      {
        $match: {
          workplaceId: new mongoose.Types.ObjectId(workplaceId),
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

    // Count by type
    const typeCount = result.notesByType.reduce((acc: any, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Count by priority
    const priorityCount = result.notesByPriority.reduce(
      (acc: any, priority: string) => {
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {}
    );

    res.json({
      totalNotes: result.totalNotes,
      typeDistribution: typeCount,
      priorityDistribution: priorityCount,
      confidentialNotes: result.confidentialNotes,
      notesWithFollowUp: result.notesWithFollowUp,
      notesWithAttachments: result.notesWithAttachments,
      dateRange: { dateFrom, dateTo },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
