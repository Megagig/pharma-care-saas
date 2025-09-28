import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';

// Import models
import MedicationTherapyReview from '../models/MedicationTherapyReview';
import MTRIntervention from '../models/MTRIntervention';
import MTRFollowUp from '../models/MTRFollowUp';
import DrugTherapyProblem from '../models/DrugTherapyProblem';
import Patient from '../models/Patient';

// Import utilities
import {
  sendSuccess,
  sendError,
  respondWithPaginatedResults,
  asyncHandler,
  ensureResourceExists,
  checkTenantAccess,
  checkTenantAccessWithRequest,
  getRequestContext,
  createAuditLog,
  isSuperAdmin,
} from '../utils/responseHelpers';
import { AuditService } from '../services/auditService';

/**
 * Medication Therapy Review Controller
 * Comprehensive CRUD operations for MTR module
 */

// ===============================
// MTR SESSION OPERATIONS
// ===============================

/**
 * GET /api/mtr
 * List MTR sessions with search, filtering, and pagination
 */
export const getMTRSessions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      reviewType,
      pharmacistId,
      patientId,
      sort,
    } = req.query as any;
    const context = getRequestContext(req);

    // Parse pagination parameters
    const parsedPage = Math.max(1, parseInt(page as string) || 1);
    const parsedLimit = Math.min(
      50,
      Math.max(1, parseInt(limit as string) || 10)
    );

    // Build query
    const query: any = {};

    // Tenant filtering
    if (!context.isAdmin) {
      query.workplaceId = context.workplaceId;
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (reviewType) query.reviewType = reviewType;
    if (pharmacistId) query.pharmacistId = pharmacistId;
    if (patientId) query.patientId = patientId;

    // Execute query with pagination
    const [sessions, total] = await Promise.all([
      MedicationTherapyReview.find(query)
        .populate('patientId', 'firstName lastName mrn')
        .populate('pharmacistId', 'firstName lastName')
        .sort(sort || '-createdAt')
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit)
        .select('-__v')
        .lean(),
      MedicationTherapyReview.countDocuments(query),
    ]);

    respondWithPaginatedResults(
      res,
      sessions,
      total,
      parsedPage,
      parsedLimit,
      `Found ${total} MTR sessions`
    );
  }
);

/**
 * GET /api/mtr/:id
 * Get specific MTR session with full details
 */
export const getMTRSession = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session with populated references
    const session = await MedicationTherapyReview.findById(id)
      .populate('patientId', 'firstName lastName mrn dob phone')
      .populate('pharmacistId', 'firstName lastName')
      .populate('problems')
      .populate('interventions')
      .populate('followUps')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Create response with computed properties
    const responseData = {
      review: {
        ...session!.toObject(),
        completionPercentage: session!.getCompletionPercentage(),
        nextStep: session!.getNextStep(),
        canComplete: session!.canComplete(),
      },
    };

    sendSuccess(res, responseData, 'MTR session retrieved successfully');
  }
);

/**
 * POST /api/mtr
 * Create new MTR session
 */
export const createMTRSession = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const {
      patientId,
      priority = 'routine',
      reviewType = 'initial',
      referralSource,
      reviewReason,
      patientConsent = false,
      confidentialityAgreed = false,
    } = req.body;

    // Validate patient exists and belongs to workplace
    const patient = await Patient.findById(patientId);
    ensureResourceExists(patient, 'Patient', patientId);

    // Skip tenant check for super_admin users
    if (req.user?.role === 'super_admin') {
      console.log('Super admin bypassing tenant check for MTR patient access');
    } else {
      checkTenantAccess(
        patient!.workplaceId.toString(),
        context.workplaceId,
        context.isAdmin
      );
    }

    // Generate review number
    const reviewNumber = await (
      MedicationTherapyReview as any
    ).generateNextReviewNumber(context.workplaceId);

    // Create MTR session
    const session = new MedicationTherapyReview({
      workplaceId: context.workplaceId,
      patientId,
      pharmacistId: context.userId,
      reviewNumber,
      priority,
      reviewType,
      referralSource,
      reviewReason,
      patientConsent: req.user?.role === 'super_admin' ? true : patientConsent, // Auto-approve consent for super_admin
      confidentialityAgreed:
        req.user?.role === 'super_admin' ? true : confidentialityAgreed, // Auto-approve confidentiality for super_admin
      createdBy: context.userId,
      clinicalOutcomes: {
        problemsResolved: 0,
        medicationsOptimized: 0,
        adherenceImproved: false,
        adverseEventsReduced: false,
      },
      // Initialize steps object with default values
      steps: {
        patientSelection: { completed: false },
        medicationHistory: { completed: false },
        therapyAssessment: { completed: false },
        planDevelopment: { completed: false },
        interventions: { completed: false },
        followUp: { completed: false },
      },
    });

    // Add role information for validation middleware
    if (req.user?.role === 'super_admin') {
      (session as any).createdByRole = 'super_admin';
    }

    await session.save();

    // Mark patient selection step as complete
    session.markStepComplete('patientSelection', {
      patientId,
      selectedAt: new Date(),
    });
    await session.save();

    // Audit log - TODO: Implement audit logging
    // await AuditService.logMTRActivity(
    //   AuditService.createAuditContext(req),
    //   'CREATE_MTR_SESSION',
    //   session
    // );

    sendSuccess(
      res,
      {
        review: {
          ...session.toObject(),
          completionPercentage: session.getCompletionPercentage(),
          nextStep: session.getNextStep(),
        },
      },
      'MTR session created successfully',
      201
    );
  }
);

/**
 * PUT /api/mtr/:id
 * Update MTR session
 */
export const updateMTRSession = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);
    const updates = req.body;

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Prevent updating completed sessions unless admin or super_admin
    if (session!.status === 'completed' && !context.isAdmin && !context.isSuperAdmin) {
      return sendError(
        res,
        'FORBIDDEN',
        'Cannot update completed MTR session',
        403
      );
    }

    // Handle follow-ups separately if they exist in updates
    if (updates.followUps && Array.isArray(updates.followUps)) {
      console.log('🔍 Processing follow-ups:', updates.followUps.length);
      // If followUps are provided as full objects, we need to create/update them separately
      const followUpIds: mongoose.Types.ObjectId[] = [];

      for (const followUpData of updates.followUps) {
        if (followUpData._id && followUpData._id !== 'temp' && !followUpData._id.toString().startsWith('temp')) {
          // This is an existing follow-up, try to update it
          try {
            const existingFollowUp = await MTRFollowUp.findById(followUpData._id);
            if (existingFollowUp) {
              // Handle assignedTo field for updates
              let assignedToId = existingFollowUp.assignedTo;
              if (followUpData.assignedTo) {
                if (mongoose.Types.ObjectId.isValid(followUpData.assignedTo)) {
                  assignedToId = followUpData.assignedTo;
                } else {
                  console.log(`⚠️ Invalid assignedTo value "${followUpData.assignedTo}", keeping existing value`);
                }
              }

              Object.assign(existingFollowUp, followUpData, {
                assignedTo: assignedToId,
                updatedBy: context.userId,
              });
              await existingFollowUp.save();
              followUpIds.push(existingFollowUp._id);
              console.log('✅ Updated existing follow-up:', existingFollowUp._id);
            }
          } catch (error) {
            console.warn('Failed to update existing follow-up:', error);
            // Create new follow-up if update fails
            let assignedToId = context.userId;
            if (followUpData.assignedTo && mongoose.Types.ObjectId.isValid(followUpData.assignedTo)) {
              assignedToId = followUpData.assignedTo;
            }

            const newFollowUp = new MTRFollowUp({
              ...followUpData,
              _id: undefined, // Remove the temp ID
              workplaceId: context.workplaceId,
              reviewId: id,
              patientId: session!.patientId,
              assignedTo: assignedToId,
              createdBy: context.userId,
            });
            await newFollowUp.save();
            followUpIds.push(newFollowUp._id);
            console.log('✅ Created new follow-up after update failure:', newFollowUp._id);
          }
        } else {
          // This is a new follow-up, create it
          // Handle assignedTo field - if it's a string, use current user ID
          let assignedToId = context.userId;
          if (followUpData.assignedTo) {
            if (mongoose.Types.ObjectId.isValid(followUpData.assignedTo)) {
              assignedToId = followUpData.assignedTo;
            } else {
              // If it's a string (like "cosmas"), use current user ID as fallback
              console.log(`⚠️ Invalid assignedTo value "${followUpData.assignedTo}", using current user ID`);
              assignedToId = context.userId;
            }
          }

          const newFollowUp = new MTRFollowUp({
            ...followUpData,
            _id: undefined, // Remove any temp ID
            workplaceId: context.workplaceId,
            reviewId: id,
            patientId: session!.patientId,
            assignedTo: assignedToId,
            createdBy: context.userId,
          });
          await newFollowUp.save();
          followUpIds.push(newFollowUp._id);
          console.log('✅ Created new follow-up:', newFollowUp._id);
        }
      }

      // Update the session with the follow-up IDs
      session!.followUps = followUpIds;
      console.log('✅ Updated session with follow-up IDs:', followUpIds);

      // Remove followUps from updates to avoid the casting error
      delete updates.followUps;
    }

    // Handle interventions separately if they exist in updates
    if (updates.interventions && Array.isArray(updates.interventions)) {
      // If interventions are provided as full objects, we need to create/update them separately
      const interventionIds: mongoose.Types.ObjectId[] = [];

      for (const interventionData of updates.interventions) {
        if (interventionData._id && interventionData._id !== 'temp' && !interventionData._id.toString().startsWith('temp')) {
          // This is an existing intervention, try to update it
          try {
            const existingIntervention = await MTRIntervention.findById(interventionData._id);
            if (existingIntervention) {
              Object.assign(existingIntervention, interventionData, {
                updatedBy: context.userId,
              });
              await existingIntervention.save();
              interventionIds.push(existingIntervention._id);
            }
          } catch (error) {
            console.warn('Failed to update existing intervention:', error);
            // Create new intervention if update fails
            const newIntervention = new MTRIntervention({
              ...interventionData,
              _id: undefined, // Remove the temp ID
              workplaceId: context.workplaceId,
              reviewId: id,
              patientId: session!.patientId,
              pharmacistId: context.userId,
              createdBy: context.userId,
            });
            await newIntervention.save();
            interventionIds.push(newIntervention._id);
          }
        } else {
          // This is a new intervention, create it
          const newIntervention = new MTRIntervention({
            ...interventionData,
            _id: undefined, // Remove any temp ID
            workplaceId: context.workplaceId,
            reviewId: id,
            patientId: session!.patientId,
            pharmacistId: context.userId,
            createdBy: context.userId,
          });
          await newIntervention.save();
          interventionIds.push(newIntervention._id);
        }
      }

      // Update the session with the intervention IDs
      session!.interventions = interventionIds;

      // Remove interventions from updates to avoid the casting error
      delete updates.interventions;
    }

    // Handle problems separately if they exist in updates
    if (updates.problems && Array.isArray(updates.problems)) {
      // If problems are provided as full objects, we need to create/update them separately
      const problemIds: mongoose.Types.ObjectId[] = [];

      for (const problemData of updates.problems) {
        if (problemData._id && problemData._id !== 'temp' && !problemData._id.toString().startsWith('temp')) {
          // This is an existing problem, try to update it
          try {
            const existingProblem = await DrugTherapyProblem.findById(problemData._id);
            if (existingProblem) {
              Object.assign(existingProblem, problemData, {
                updatedBy: context.userId,
              });
              await existingProblem.save();
              problemIds.push(existingProblem._id);
            }
          } catch (error) {
            console.warn('Failed to update existing problem:', error);
            // Create new problem if update fails
            const newProblem = new DrugTherapyProblem({
              ...problemData,
              _id: undefined, // Remove the temp ID
              workplaceId: context.workplaceId,
              patientId: session!.patientId,
              reviewId: id,
              identifiedBy: context.userId,
              createdBy: context.userId,
            });
            await newProblem.save();
            problemIds.push(newProblem._id);
          }
        } else {
          // This is a new problem, create it
          const newProblem = new DrugTherapyProblem({
            ...problemData,
            _id: undefined, // Remove any temp ID
            workplaceId: context.workplaceId,
            patientId: session!.patientId,
            reviewId: id,
            identifiedBy: context.userId,
            createdBy: context.userId,
          });
          await newProblem.save();
          problemIds.push(newProblem._id);
        }
      }

      // Update the session with the problem IDs
      session!.problems = problemIds;

      // Remove problems from updates to avoid the casting error
      delete updates.problems;
    }

    // Update session with remaining updates
    Object.assign(session!, updates, {
      updatedBy: context.userId,
      updatedAt: new Date(),
    });

    await session!.save();

    // Audit log - TODO: Implement audit logging
    // await AuditService.logMTRActivity(
    //   AuditService.createAuditContext(req),
    //   'UPDATE_MTR_SESSION',
    //   session!,
    //   session!.toObject(), // oldValues
    //   { ...session!.toObject(), ...updates } // newValues
    // );

    sendSuccess(
      res,
      {
        review: {
          ...session!.toObject(),
          completionPercentage: session!.getCompletionPercentage(),
          nextStep: session!.getNextStep(),
        },
      },
      'MTR session updated successfully'
    );
  }
);

/**
 * DELETE /api/mtr/:id
 * Delete MTR session (soft delete)
 */
export const deleteMTRSession = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Prevent deleting completed sessions unless admin or super_admin
    if (session!.status === 'completed' && !context.isAdmin && !context.isSuperAdmin) {
      return sendError(
        res,
        'FORBIDDEN',
        'Cannot delete completed MTR session',
        403
      );
    }

    // Soft delete
    session!.isDeleted = true;
    session!.updatedBy = context.userId;
    await session!.save();

    // Audit log - TODO: Implement audit logging
    // await AuditService.logMTRActivity(
    //   AuditService.createAuditContext(req),
    //   'DELETE_MTR_SESSION',
    //   session!
    // );

    sendSuccess(res, null, 'MTR session deleted successfully');
  }
);

// ===============================
// WORKFLOW STEP OPERATIONS
// ===============================

/**
 * PUT /api/mtr/:id/step/:stepName
 * Update specific workflow step
 */
export const updateMTRStep = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id, stepName } = req.params;
    const { completed, data } = req.body;
    const context = getRequestContext(req);

    // Validate step name
    const validSteps = [
      'patientSelection',
      'medicationHistory',
      'therapyAssessment',
      'planDevelopment',
      'interventions',
      'followUp',
    ];

    if (!stepName || !validSteps.includes(stepName)) {
      return sendError(res, 'BAD_REQUEST', 'Invalid step name', 400);
    }

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Update step
    if (completed) {
      session!.markStepComplete(stepName, data);
    } else {
      // Mark step as incomplete
      const steps = session!.steps;
      const stepKey = stepName as keyof typeof steps;
      const step = steps[stepKey];
      step.completed = false;
      step.completedAt = undefined;
      if (data !== undefined) {
        step.data = data;
      }
    }

    session!.updatedBy = context.userId;
    await session!.save();

    sendSuccess(
      res,
      {
        review: {
          ...session!.toObject(),
          completionPercentage: session!.getCompletionPercentage(),
          nextStep: session!.getNextStep(),
        },
      },
      `Step ${stepName} updated successfully`
    );
  }
);

/**
 * GET /api/mtr/:id/progress
 * Get workflow progress
 */
export const getMTRProgress = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    const progress = {
      completionPercentage: session!.getCompletionPercentage(),
      nextStep: session!.getNextStep(),
      canComplete: session!.canComplete(),
      steps: session!.steps,
    };

    sendSuccess(res, progress, 'MTR progress retrieved successfully');
  }
);

// ===============================
// PATIENT-SPECIFIC OPERATIONS
// ===============================

/**
 * GET /api/mtr/patient/:patientId
 * Get patient's MTR history
 */
export const getPatientMTRHistory = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;
    const context = getRequestContext(req);

    // Validate patient exists and belongs to workplace
    const patient = await Patient.findById(patientId);
    ensureResourceExists(patient, 'Patient', patientId);
    checkTenantAccess(
      patient!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Parse pagination
    const parsedPage = Math.max(1, parseInt(page as string) || 1);
    const parsedLimit = Math.min(
      50,
      Math.max(1, parseInt(limit as string) || 10)
    );

    // Get MTR sessions for patient
    const [sessions, total] = await Promise.all([
      MedicationTherapyReview.find({ patientId })
        .populate('pharmacistId', 'firstName lastName')
        .sort('-createdAt')
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit)
        .select('-medications -plan -__v')
        .lean(),
      MedicationTherapyReview.countDocuments({ patientId }),
    ]);

    respondWithPaginatedResults(
      res,
      sessions,
      total,
      parsedPage,
      parsedLimit,
      `Found ${total} MTR sessions for patient`
    );
  }
);

/**
 * POST /api/mtr/patient/:patientId
 * Create MTR session for specific patient
 */
export const createPatientMTRSession = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { patientId } = req.params;
    const context = getRequestContext(req);

    // Validate patient exists and belongs to workplace
    const patient = await Patient.findById(patientId);
    ensureResourceExists(patient, 'Patient', patientId);
    checkTenantAccess(
      patient!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Check for active MTR session
    const activeSession = await MedicationTherapyReview.findOne({
      patientId,
      status: { $in: ['in_progress', 'on_hold'] },
    });

    if (activeSession) {
      return sendError(
        res,
        'BAD_REQUEST',
        'Patient already has an active MTR session',
        409,
        { activeSessionId: activeSession._id }
      );
    }

    // Create new session with patient ID
    const sessionData = {
      ...req.body,
      patientId,
      patientConsent: req.body.patientConsent || false,
      confidentialityAgreed: req.body.confidentialityAgreed || false,
    };

    // Create new session with patient ID
    const {
      priority = 'routine',
      reviewType = 'initial',
      referralSource,
      reviewReason,
      patientConsent = false,
      confidentialityAgreed = false,
    } = sessionData;

    // Generate review number
    const reviewNumber = await (
      MedicationTherapyReview as any
    ).generateNextReviewNumber(context.workplaceId);

    // Create MTR session
    const session = new MedicationTherapyReview({
      workplaceId: context.workplaceId,
      patientId,
      pharmacistId: context.userId,
      reviewNumber,
      priority,
      reviewType,
      referralSource,
      reviewReason,
      patientConsent,
      confidentialityAgreed,
      createdBy: context.userId,
      clinicalOutcomes: {
        problemsResolved: 0,
        medicationsOptimized: 0,
        adherenceImproved: false,
        adverseEventsReduced: false,
      },
    });

    await session.save();

    // Mark patient selection step as complete
    session.markStepComplete('patientSelection', {
      patientId,
      selectedAt: new Date(),
    });
    await session.save();

    sendSuccess(
      res,
      {
        review: {
          ...session.toObject(),
          completionPercentage: session.getCompletionPercentage(),
          nextStep: session.getNextStep(),
        },
      },
      'MTR session created successfully',
      201
    );
  }
);

// All functions are exported individually above

// ===============================
// DRUG THERAPY PROBLEMS OPERATIONS
// ===============================

/**
 * GET /api/mtr/:id/problems
 * Get identified problems for MTR session
 */
export const getMTRProblems = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Get problems for this review
    const problems = await DrugTherapyProblem.find({ reviewId: id })
      .populate('identifiedBy', 'firstName lastName')
      .populate('resolution.resolvedBy', 'firstName lastName')
      .sort({ severity: 1, identifiedAt: -1 });

    sendSuccess(
      res,
      { problems },
      `Found ${problems.length} problems for MTR session`
    );
  }
);

/**
 * POST /api/mtr/:id/problems
 * Add new problem to MTR session
 */
export const createMTRProblem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Create problem
    const problem = new DrugTherapyProblem({
      ...req.body,
      workplaceId: context.workplaceId,
      patientId: session!.patientId,
      reviewId: id,
      identifiedBy: context.userId,
      createdBy: context.userId,
    });

    await problem.save();

    // Add problem to session
    session!.problems.push(problem._id);
    session!.updatedBy = context.userId;
    await session!.save();

    // Audit log
    console.log(
      'MTR problem created:',
      createAuditLog(
        'CREATE_MTR_PROBLEM',
        'DrugTherapyProblem',
        problem._id.toString(),
        context,
        { reviewId: id, type: problem.type }
      )
    );

    sendSuccess(
      res,
      { problem },
      'Problem added to MTR session successfully',
      201
    );
  }
);

/**
 * PUT /api/mtr/:id/problems/:problemId
 * Update problem in MTR session
 */
export const updateMTRProblem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id, problemId } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Find and update problem
    const problem = await DrugTherapyProblem.findById(problemId);
    ensureResourceExists(problem, 'Problem', problemId);

    // Verify problem belongs to this review
    if (problem!.reviewId?.toString() !== id) {
      return sendError(
        res,
        'BAD_REQUEST',
        'Problem does not belong to this MTR session',
        400
      );
    }

    Object.assign(problem!, req.body, {
      updatedBy: context.userId,
    });

    await problem!.save();

    sendSuccess(res, { problem }, 'Problem updated successfully');
  }
);

/**
 * DELETE /api/mtr/:id/problems/:problemId
 * Delete problem from MTR session
 */
export const deleteMTRProblem = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id, problemId } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Find problem
    const problem = await DrugTherapyProblem.findById(problemId);
    ensureResourceExists(problem, 'Problem', problemId);

    // Verify problem belongs to this review
    if (problem!.reviewId?.toString() !== id) {
      return sendError(
        res,
        'BAD_REQUEST',
        'Problem does not belong to this MTR session',
        400
      );
    }

    // Soft delete problem
    problem!.isDeleted = true;
    problem!.updatedBy = context.userId;
    await problem!.save();

    // Remove from session
    session!.problems = session!.problems.filter(
      (p) => p.toString() !== problemId
    );
    session!.updatedBy = context.userId;
    await session!.save();

    sendSuccess(res, null, 'Problem deleted successfully');
  }
);

// ===============================
// INTERVENTIONS OPERATIONS
// ===============================

/**
 * GET /api/mtr/:id/interventions
 * Get interventions for MTR session
 */
export const getMTRInterventions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Get interventions for this review
    const interventions = await MTRIntervention.find({ reviewId: id })
      .populate('pharmacistId', 'firstName lastName')
      .sort({ priority: 1, performedAt: -1 });

    sendSuccess(
      res,
      { interventions },
      `Found ${interventions.length} interventions for MTR session`
    );
  }
);

/**
 * POST /api/mtr/:id/interventions
 * Record new intervention for MTR session
 */
export const createMTRIntervention = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Create intervention
    const intervention = new MTRIntervention({
      ...req.body,
      workplaceId: context.workplaceId,
      reviewId: id,
      patientId: session!.patientId,
      pharmacistId: context.userId,
      createdBy: context.userId,
    });

    await intervention.save();

    // Add intervention to session
    session!.interventions.push(intervention._id);
    session!.updatedBy = context.userId;
    await session!.save();

    // Audit log
    console.log(
      'MTR intervention created:',
      createAuditLog(
        'CREATE_MTR_INTERVENTION',
        'MTRIntervention',
        intervention._id.toString(),
        context,
        { reviewId: id, type: intervention.type }
      )
    );

    sendSuccess(
      res,
      { intervention },
      'Intervention recorded successfully',
      201
    );
  }
);

/**
 * PUT /api/mtr/:id/interventions/:interventionId
 * Update intervention in MTR session
 */
export const updateMTRIntervention = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id, interventionId } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Find and update intervention
    const intervention = await MTRIntervention.findById(interventionId);
    ensureResourceExists(intervention, 'Intervention', interventionId);

    // Verify intervention belongs to this review
    if (intervention!.reviewId.toString() !== id) {
      return sendError(
        res,
        'BAD_REQUEST',
        'Intervention does not belong to this MTR session',
        400
      );
    }

    Object.assign(intervention!, req.body, {
      updatedBy: context.userId,
    });

    await intervention!.save();

    sendSuccess(res, { intervention }, 'Intervention updated successfully');
  }
);

// ===============================
// FOLLOW-UPS OPERATIONS
// ===============================

/**
 * GET /api/mtr/:id/followups
 * Get follow-ups for MTR session
 */
export const getMTRFollowUps = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Get follow-ups for this review
    const followUps = await MTRFollowUp.find({ reviewId: id })
      .populate('assignedTo', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ scheduledDate: 1 });

    sendSuccess(
      res,
      { followUps },
      `Found ${followUps.length} follow-ups for MTR session`
    );
  }
);

/**
 * POST /api/mtr/:id/followups
 * Schedule follow-up for MTR session
 */
export const createMTRFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Create follow-up
    const followUp = new MTRFollowUp({
      ...req.body,
      workplaceId: context.workplaceId,
      reviewId: id,
      patientId: session!.patientId,
      assignedTo: req.body.assignedTo || context.userId,
      createdBy: context.userId,
    });

    await followUp.save();

    // Add follow-up to session
    session!.followUps.push(followUp._id);
    session!.updatedBy = context.userId;
    await session!.save();

    // Audit log
    console.log(
      'MTR follow-up created:',
      createAuditLog(
        'CREATE_MTR_FOLLOWUP',
        'MTRFollowUp',
        followUp._id.toString(),
        context,
        { reviewId: id, type: followUp.type }
      )
    );

    sendSuccess(res, { followUp }, 'Follow-up scheduled successfully', 201);
  }
);

/**
 * PUT /api/mtr/:id/followups/:followupId
 * Update follow-up in MTR session
 */
export const updateMTRFollowUp = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id, followupId } = req.params;
    const context = getRequestContext(req);

    // Find MTR session
    const session = await MedicationTherapyReview.findById(id);
    ensureResourceExists(session, 'MTR Session', id);
    checkTenantAccess(
      session!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Find and update follow-up
    const followUp = await MTRFollowUp.findById(followupId);
    ensureResourceExists(followUp, 'Follow-up', followupId);

    // Verify follow-up belongs to this review
    if (followUp!.reviewId.toString() !== id) {
      return sendError(
        res,
        'BAD_REQUEST',
        'Follow-up does not belong to this MTR session',
        400
      );
    }

    Object.assign(followUp!, req.body, {
      updatedBy: context.userId,
    });

    await followUp!.save();

    sendSuccess(res, { followUp }, 'Follow-up updated successfully');
  }
);

// ===============================
// REPORTS AND ANALYTICS OPERATIONS
// ===============================

/**
 * GET /api/mtr/reports/summary
 * Get MTR summary reports
 */
export const getMTRReports = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { startDate, endDate, pharmacistId } = req.query as any;
    const context = getRequestContext(req);

    // Build date range
    const dateRange =
      startDate && endDate
        ? {
          start: new Date(startDate),
          end: new Date(endDate),
        }
        : undefined;

    // Build match criteria
    const matchCriteria: any = {};
    if (!context.isAdmin) {
      matchCriteria.workplaceId = context.workplaceId;
    }
    if (pharmacistId) {
      matchCriteria.pharmacistId = new mongoose.Types.ObjectId(pharmacistId);
    }
    if (dateRange) {
      matchCriteria.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // Aggregate MTR statistics
    const pipeline = [
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          inProgressSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          avgCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                {
                  $divide: [
                    { $subtract: ['$completedAt', '$startedAt'] },
                    1000 * 60 * 60 * 24, // Convert to days
                  ],
                },
                null,
              ],
            },
          },
          sessionsByType: {
            $push: {
              reviewType: '$reviewType',
              status: '$status',
              priority: '$priority',
            },
          },
        },
      },
    ];

    const [stats] = await MedicationTherapyReview.aggregate(pipeline);

    const summary = stats || {
      totalSessions: 0,
      completedSessions: 0,
      inProgressSessions: 0,
      avgCompletionTime: 0,
      sessionsByType: [],
    };

    sendSuccess(res, { summary }, 'MTR summary report generated successfully');
  }
);

/**
 * GET /api/mtr/reports/outcomes
 * Get outcome analytics
 */
export const getMTROutcomes = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { startDate, endDate } = req.query as any;
    const context = getRequestContext(req);

    // Build date range
    const dateRange =
      startDate && endDate
        ? {
          start: new Date(startDate),
          end: new Date(endDate),
        }
        : undefined;

    // Build match criteria
    const matchCriteria: any = { status: 'completed' };
    if (!context.isAdmin) {
      matchCriteria.workplaceId = context.workplaceId;
    }
    if (dateRange) {
      matchCriteria.completedAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    // Aggregate outcomes
    const pipeline = [
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          totalCompletedSessions: { $sum: 1 },
          totalProblemsResolved: { $sum: '$clinicalOutcomes.problemsResolved' },
          totalMedicationsOptimized: {
            $sum: '$clinicalOutcomes.medicationsOptimized',
          },
          adherenceImprovedCount: {
            $sum: { $cond: ['$clinicalOutcomes.adherenceImproved', 1, 0] },
          },
          adverseEventsReducedCount: {
            $sum: { $cond: ['$clinicalOutcomes.adverseEventsReduced', 1, 0] },
          },
          totalCostSavings: { $sum: '$clinicalOutcomes.costSavings' },
        },
      },
    ];

    const [outcomes] = await MedicationTherapyReview.aggregate(pipeline);

    const analytics = outcomes || {
      totalCompletedSessions: 0,
      totalProblemsResolved: 0,
      totalMedicationsOptimized: 0,
      adherenceImprovedCount: 0,
      adverseEventsReducedCount: 0,
      totalCostSavings: 0,
    };

    sendSuccess(res, { analytics }, 'Outcome analytics generated successfully');
  }
);

/**
 * GET /api/mtr/reports/audit
 * Get audit trail reports
 */
export const getMTRAuditTrail = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { startDate, endDate, sessionId, userId } = req.query as any;
    const context = getRequestContext(req);

    // Build query for audit trail
    const query: any = {};
    if (!context.isAdmin) {
      query.workplaceId = context.workplaceId;
    }
    if (sessionId) {
      query._id = sessionId;
    }
    if (userId) {
      query.$or = [
        { createdBy: userId },
        { updatedBy: userId },
        { pharmacistId: userId },
      ];
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get audit trail
    const auditTrail = await MedicationTherapyReview.find(query)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName')
      .populate('pharmacistId', 'firstName lastName')
      .select(
        'reviewNumber status createdAt updatedAt createdBy updatedBy pharmacistId'
      )
      .sort('-updatedAt')
      .limit(100);

    sendSuccess(
      res,
      { auditTrail },
      `Found ${auditTrail.length} audit trail entries`
    );
  }
);

// ===============================
// DRUG INTERACTION CHECKING OPERATIONS
// ===============================

/**
 * POST /api/mtr/check-interactions
 * Check drug interactions (placeholder implementation)
 */
export const checkDrugInteractions = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications)) {
      return sendError(
        res,
        'BAD_REQUEST',
        'Medications array is required',
        400
      );
    }

    // Placeholder implementation - in production, this would integrate with a drug database API
    const interactions = [];

    // Mock interaction detection logic
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i];
        const med2 = medications[j];

        // Simple mock logic - check for common interaction patterns
        if (
          (med1.drugName.toLowerCase().includes('warfarin') &&
            med2.drugName.toLowerCase().includes('aspirin')) ||
          (med1.drugName.toLowerCase().includes('digoxin') &&
            med2.drugName.toLowerCase().includes('furosemide'))
        ) {
          interactions.push({
            medication1: med1.drugName,
            medication2: med2.drugName,
            severity: 'major',
            description: `Potential interaction between ${med1.drugName} and ${med2.drugName}`,
            clinicalSignificance: 'Monitor patient closely for adverse effects',
            recommendation: 'Consider alternative therapy or adjust dosing',
          });
        }
      }
    }

    sendSuccess(
      res,
      { interactions, checkedMedications: medications.length },
      `Checked ${medications.length} medications for interactions`
    );
  }
);

/**
 * POST /api/mtr/check-duplicates
 * Check duplicate therapies (placeholder implementation)
 */
export const checkDuplicateTherapies = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { medications } = req.body;

    if (!medications || !Array.isArray(medications)) {
      return sendError(
        res,
        'BAD_REQUEST',
        'Medications array is required',
        400
      );
    }

    // Placeholder implementation - in production, this would use therapeutic classification
    const duplicates: any[] = [];
    const therapeuticClasses: { [key: string]: string[] } = {};

    // Group medications by therapeutic class (simplified)
    medications.forEach((med: any, index: number) => {
      const drugName = med.drugName.toLowerCase();
      let therapeuticClass = 'other';

      // Simple classification logic
      if (drugName.includes('metformin') || drugName.includes('glipizide')) {
        therapeuticClass = 'antidiabetic';
      } else if (
        drugName.includes('lisinopril') ||
        drugName.includes('amlodipine')
      ) {
        therapeuticClass = 'antihypertensive';
      } else if (
        drugName.includes('atorvastatin') ||
        drugName.includes('simvastatin')
      ) {
        therapeuticClass = 'statin';
      }

      if (!therapeuticClasses[therapeuticClass]) {
        therapeuticClasses[therapeuticClass] = [];
      }
      therapeuticClasses[therapeuticClass]!.push(med.drugName);
    });

    // Find duplicates
    Object.entries(therapeuticClasses).forEach(([className, meds]) => {
      if (meds.length > 1 && className !== 'other') {
        duplicates.push({
          therapeuticClass: className,
          medications: meds,
          severity: 'moderate',
          description: `Multiple medications in ${className} class`,
          recommendation: 'Review for therapeutic duplication',
        });
      }
    });

    sendSuccess(
      res,
      { duplicates, checkedMedications: medications.length },
      `Checked ${medications.length} medications for duplicates`
    );
  }
);
