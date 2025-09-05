import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import { requirePermission, requireWorkplaceRole } from './rbac';
import ClinicalNote from '../models/ClinicalNote';
import Patient from '../models/Patient';
import Medication from '../models/Medication';
import { auditOperations } from './auditLogging';
import logger from '../utils/logger';
import mongoose from 'mongoose';

/**
 * Clinical Notes specific RBAC middleware
 * Provides granular access control for clinical note operations
 */

/**
 * Middleware to check if user can create clinical notes
 */
export const canCreateClinicalNote = requirePermission('clinical_notes.create');

/**
 * Middleware to check if user can read clinical notes
 */
export const canReadClinicalNote = requirePermission('clinical_notes.read');

/**
 * Middleware to check if user can update clinical notes
 */
export const canUpdateClinicalNote = requirePermission('clinical_notes.update');

/**
 * Middleware to check if user can delete clinical notes
 */
export const canDeleteClinicalNote = requirePermission('clinical_notes.delete');

/**
 * Middleware to check if user can export clinical notes
 */
export const canExportClinicalNotes = requirePermission(
  'clinical_notes.export'
);

/**
 * Middleware to check if user can access confidential notes
 */
export const canAccessConfidentialNotes = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  // Only pharmacists and owners can access confidential notes
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

/**
 * Middleware to validate note ownership and workplace isolation
 */
export const validateNoteAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const noteId = req.params.id;
    const workplaceId =
      req.user?.workplaceId || req.workspaceContext?.workspace?._id;

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid note ID',
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

    // Find the note and verify workplace isolation
    const note = await ClinicalNote.findOne({
      _id: noteId,
      workplaceId: workplaceId,
      deletedAt: { $exists: false },
    }).populate('patient', 'firstName lastName mrn workplaceId');

    if (!note) {
      // Log unauthorized access attempt
      await auditOperations.unauthorizedAccess(
        req,
        'clinical_note',
        noteId,
        'Note not found or access denied'
      );

      res.status(404).json({
        success: false,
        message: 'Clinical note not found or access denied',
      });
      return;
    }

    // Additional check for confidential notes
    if (note.isConfidential) {
      const allowedRoles = ['Owner', 'Pharmacist'];
      const userWorkplaceRole = req.user?.workplaceRole;

      if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
        // Log confidential note access attempt
        await auditOperations.unauthorizedAccess(
          req,
          'clinical_note',
          noteId,
          'Attempted access to confidential note without sufficient permissions'
        );

        res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access confidential note',
          requiredRoles: allowedRoles,
        });
        return;
      }
    }

    // Store note in request for use in controller
    req.clinicalNote = note;
    next();
  } catch (error) {
    logger.error('Error validating note access:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating note access',
    });
  }
};

/**
 * Middleware to validate patient access for note creation
 */
export const validatePatientAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Super admin bypasses all patient access validation
    if (req.user?.role === 'super_admin') {
      const patientId = req.body.patient || req.params.patientId;
      if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
        // For super admin, just verify patient exists (no workplace restriction)
        const patient = await Patient.findById(patientId);
        if (patient) {
          req.patient = patient;
        }
      }
      return next();
    }

    const patientId = req.body.patient || req.params.patientId;
    const workplaceId =
      req.user?.workplaceId || req.workspaceContext?.workspace?._id;

    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
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

    // Verify patient exists and belongs to the same workplace
    const patient = await Patient.findOne({
      _id: patientId,
      workplaceId: workplaceId,
    });

    if (!patient) {
      // Log unauthorized patient access attempt
      await auditOperations.unauthorizedAccess(
        req,
        'patient',
        patientId,
        'Patient not found or access denied for clinical note operation'
      );

      res.status(404).json({
        success: false,
        message: 'Patient not found or access denied',
      });
      return;
    }

    // Store patient in request for use in controller
    req.patient = patient;
    next();
  } catch (error) {
    logger.error('Error validating patient access:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating patient access',
    });
  }
};

/**
 * Middleware to validate bulk operations
 */
export const validateBulkNoteAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { noteIds } = req.body;
    const workplaceId =
      req.user?.workplaceId || req.workspaceContext?.workspace?._id;

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

    // Validate all note IDs
    const invalidIds = noteIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid note IDs found',
        invalidIds,
      });
      return;
    }

    // Verify all notes belong to the user's workplace
    const notes = await ClinicalNote.find({
      _id: { $in: noteIds },
      workplaceId: workplaceId,
      deletedAt: { $exists: false },
    });

    if (notes.length !== noteIds.length) {
      // Log unauthorized bulk access attempt
      await auditOperations.unauthorizedAccess(
        req,
        'clinical_note',
        noteIds.join(','),
        `Bulk operation attempted on notes not accessible to user. Found: ${notes.length}, Requested: ${noteIds.length}`
      );

      res.status(404).json({
        success: false,
        message: 'Some notes not found or access denied',
        found: notes.length,
        requested: noteIds.length,
      });
      return;
    }

    // Check for confidential notes in bulk operations
    const confidentialNotes = notes.filter((note) => note.isConfidential);
    if (confidentialNotes.length > 0) {
      const allowedRoles = ['Owner', 'Pharmacist'];
      const userWorkplaceRole = req.user?.workplaceRole;

      if (!userWorkplaceRole || !allowedRoles.includes(userWorkplaceRole)) {
        // Log confidential note bulk access attempt
        await auditOperations.unauthorizedAccess(
          req,
          'clinical_note',
          confidentialNotes.map((n) => n._id.toString()).join(','),
          'Bulk operation attempted on confidential notes without sufficient permissions'
        );

        res.status(403).json({
          success: false,
          message:
            'Bulk operation includes confidential notes that require higher permissions',
          confidentialNoteCount: confidentialNotes.length,
          requiredRoles: allowedRoles,
        });
        return;
      }
    }

    // Store notes in request for use in controller
    req.clinicalNotes = notes;
    next();
  } catch (error) {
    logger.error('Error validating bulk note access:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating bulk note access',
    });
  }
};

/**
 * Middleware to enforce tenancy isolation in queries
 */
export const enforceTenancyIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const workplaceId =
    req.user?.workplaceId || req.workspaceContext?.workspace?._id;

  if (!workplaceId) {
    res.status(403).json({
      success: false,
      message: 'No workplace context available for tenancy isolation',
    });
    return;
  }

  // Add workplace filter to request for use in controllers
  req.tenancyFilter = {
    workplaceId: workplaceId,
    deletedAt: { $exists: false },
  };

  next();
};

/**
 * Middleware to check note modification permissions
 * Only the creator or users with higher privileges can modify notes
 */
export const canModifyNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Super admin can modify any note
    if (user.role === 'super_admin') {
      return next();
    }

    // Workplace owners can modify any note in their workplace
    if (user.workplaceRole === 'Owner') {
      return next();
    }

    // Pharmacists can modify notes they created or if they have explicit permission
    if (user.workplaceRole === 'Pharmacist') {
      // Check if user is the creator
      if (note.pharmacist.toString() === user._id.toString()) {
        return next();
      }

      // Check if user has explicit permission to modify others' notes
      // This could be extended with more granular permissions
      return next();
    }

    // Other roles cannot modify notes
    res.status(403).json({
      success: false,
      message: 'Insufficient permissions to modify this note',
      noteCreator: note.pharmacist.toString(),
      currentUser: user._id.toString(),
    });
  } catch (error) {
    logger.error('Error checking note modification permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking modification permissions',
    });
  }
};

/**
 * Middleware to log note access for audit trail
 */
export const logNoteAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const note = req.clinicalNote;
    const action = determineActionFromRequest(req);

    if (note && req.user) {
      // Log the access
      await auditOperations.noteAccess(req, note._id, action, {
        noteTitle: note.title,
        noteType: note.type,
        patientId: note.patient._id || note.patient,
        isConfidential: note.isConfidential,
      });
    }

    next();
  } catch (error) {
    logger.error('Error logging note access:', error);
    // Don't fail the request, just log the error
    next();
  }
};

/**
 * Helper function to determine action from request
 */
function determineActionFromRequest(req: AuthRequest): string {
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

// Extend AuthRequest interface to include clinical note data
declare global {
  namespace Express {
    interface Request {
      clinicalNote?: any;
      clinicalNotes?: any[];
      patient?: any;
      tenancyFilter?: any;
    }
  }
}

export default {
  canCreateClinicalNote,
  canReadClinicalNote,
  canUpdateClinicalNote,
  canDeleteClinicalNote,
  canExportClinicalNotes,
  canAccessConfidentialNotes,
  validateNoteAccess,
  validatePatientAccess,
  validateBulkNoteAccess,
  enforceTenancyIsolation,
  canModifyNote,
  logNoteAccess,
};
