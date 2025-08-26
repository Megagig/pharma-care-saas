import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';

// Import models
import Patient from '../models/Patient';
import Allergy from '../models/Allergy';
import Condition from '../models/Condition';
import MedicationRecord from '../models/MedicationRecord';
import ClinicalAssessment from '../models/ClinicalAssessment';
import DrugTherapyProblem from '../models/DrugTherapyProblem';
import CarePlan from '../models/CarePlan';
import Visit from '../models/Visit';

// Import utilities
import { generateMRN } from '../utils/tenancyGuard';
import {
  sendSuccess,
  sendError,
  respondWithPatient,
  respondWithPaginatedResults,
  asyncHandler,
  ensureResourceExists,
  checkTenantAccess,
  getRequestContext,
  validateBusinessRules,
  createAuditLog,
  createPaginationMeta,
} from '../utils/responseHelpers';

/**
 * Patient Management Controller
 * Comprehensive CRUD operations for Patient Management module
 */

// ===============================
// PATIENT OPERATIONS
// ===============================

/**
 * GET /api/patients
 * List patients with search, filtering, and pagination
 */
export const getPatients = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      page,
      limit,
      q,
      name,
      mrn,
      phone,
      state,
      bloodGroup,
      genotype,
      sort,
    } = req.query as any;
    const context = getRequestContext(req);

    // Build query
    const query: any = {};

    // Tenant filtering (automatic via tenancy guard, but explicit for admin cross-tenant)
    if (!context.isAdmin) {
      query.workplaceId = context.workplaceId;
    }

    // Search functionality
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

    // Specific filters
    if (name) {
      const nameRegex = new RegExp(name, 'i');
      query.$or = [
        { firstName: nameRegex },
        { lastName: nameRegex },
        { otherNames: nameRegex },
      ];
    }

    if (mrn) query.mrn = new RegExp(mrn, 'i');
    if (phone) query.phone = new RegExp(phone, 'i');
    if (state) query.state = state;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (genotype) query.genotype = genotype;

    // Execute query with pagination
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .sort(sort || '-createdAt')
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-__v')
        .lean(),
      Patient.countDocuments(query),
    ]);

    respondWithPaginatedResults(
      res,
      patients,
      total,
      page,
      limit,
      `Found ${total} patients`
    );
  }
);

/**
 * GET /api/patients/:id - Get patient details
 */
export const getPatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find patient with full details
    const patient = await Patient.findById(id)
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    ensureResourceExists(patient, 'Patient', id);
    checkTenantAccess(
      patient!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Create clean patient object with computed properties
    const responseData = {
      patient: {
        ...patient!.toObject(),
        age: patient!.getAge(),
        displayName: patient!.getDisplayName(),
      },
    };

    sendSuccess(res, responseData, 'Patient details retrieved successfully');
  }
);

/**
 * POST /api/patients
 * Create new patient with optional related data
 */
export const createPatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const context = getRequestContext(req);
    const {
      allergies,
      conditions,
      medications,
      assessment,
      dtps,
      carePlan,
      ...patientData
    } = req.body;

    // Validate business rules
    validateBusinessRules.validatePatientAge(patientData.dob, patientData.age);

    // Start transaction for atomic operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Generate MRN
      const workplaceCode = 'GEN'; // TODO: Get from workplace settings
      const patientCount = await Patient.countDocuments({
        workplaceId: context.workplaceId,
      });
      const mrn = generateMRN(workplaceCode, patientCount + 1);

      // Create patient
      const patient = new Patient({
        ...patientData,
        mrn,
        workplaceId: context.workplaceId,
        createdBy: context.userId,
        isDeleted: false,
      });

      await patient.save({ session });

      // Create related data if provided
      const relatedData: any = {};

      // Create allergies
      if (allergies?.length) {
        const allergyDocs = allergies.map((allergy: any) => ({
          ...allergy,
          patientId: patient._id,
          workplaceId: context.workplaceId,
          createdBy: context.userId,
        }));
        relatedData.allergies = await Allergy.insertMany(allergyDocs, {
          session,
        });
      }

      // Create conditions
      if (conditions?.length) {
        const conditionDocs = conditions.map((condition: any) => ({
          ...condition,
          patientId: patient._id,
          workplaceId: context.workplaceId,
          createdBy: context.userId,
        }));
        relatedData.conditions = await Condition.insertMany(conditionDocs, {
          session,
        });
      }

      // Create medications
      if (medications?.length) {
        const medicationDocs = medications.map((medication: any) => ({
          ...medication,
          patientId: patient._id,
          workplaceId: context.workplaceId,
          createdBy: context.userId,
        }));
        relatedData.medications = await MedicationRecord.insertMany(
          medicationDocs,
          { session }
        );
      }

      // Create clinical assessment
      if (assessment?.vitals || assessment?.labs) {
        const assessmentDoc = new ClinicalAssessment({
          ...assessment,
          patientId: patient._id,
          workplaceId: context.workplaceId,
          createdBy: context.userId,
        });
        await assessmentDoc.save({ session });
        relatedData.assessment = assessmentDoc;

        // Update patient's latest vitals
        if (assessment.vitals) {
          patient.latestVitals = {
            ...assessment.vitals,
            recordedAt: assessment.recordedAt || new Date(),
          };
          await patient.save({ session });
        }
      }

      // Create DTPs
      if (dtps?.length) {
        const dtpDocs = dtps.map((dtp: any) => ({
          ...dtp,
          patientId: patient._id,
          workplaceId: context.workplaceId,
          createdBy: context.userId,
        }));
        const createdDTPs = await DrugTherapyProblem.insertMany(dtpDocs, {
          session,
        });
        relatedData.dtps = createdDTPs;

        // Update patient's hasActiveDTP flag
        const hasUnresolvedDTPs = createdDTPs.some(
          (dtp: any) => dtp.status === 'unresolved'
        );
        if (hasUnresolvedDTPs) {
          patient.hasActiveDTP = true;
          await patient.save({ session });
        }
      }

      // Create care plan
      if (carePlan) {
        const carePlanDoc = new CarePlan({
          ...carePlan,
          patientId: patient._id,
          workplaceId: context.workplaceId,
          createdBy: context.userId,
        });
        await carePlanDoc.save({ session });
        relatedData.carePlan = carePlanDoc;
      }

      await session.commitTransaction();

      // Audit log
      console.log(
        'Patient created:',
        createAuditLog(
          'CREATE_PATIENT',
          'Patient',
          patient._id.toString(),
          context,
          { mrn: patient.mrn, name: patient.getDisplayName() }
        )
      );

      sendSuccess(
        res,
        {
          patient: {
            ...patient.toObject(),
            age: patient.getAge(),
            displayName: patient.getDisplayName(),
          },
          related: relatedData,
        },
        'Patient created successfully',
        201
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
);

export const updatePatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);
    const updates = req.body;

    // Find patient
    const patient = await Patient.findById(id);
    ensureResourceExists(patient, 'Patient', id);
    checkTenantAccess(
      patient!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Validate age/DOB consistency if both are provided
    if (updates.dob || updates.age) {
      validateBusinessRules.validatePatientAge(
        updates.dob || patient!.dob,
        updates.age || patient!.age
      );
    }

    // Update patient
    Object.assign(patient!, updates, {
      updatedBy: context.userId,
      updatedAt: new Date(),
    });

    await patient!.save();

    // Audit log
    console.log(
      'Patient updated:',
      createAuditLog(
        'UPDATE_PATIENT',
        'Patient',
        patient!._id.toString(),
        context,
        { updates }
      )
    );

    respondWithPatient(res, patient!, 'Patient updated successfully');
  }
);

export const deletePatient = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find patient
    const patient = await Patient.findById(id);
    ensureResourceExists(patient, 'Patient', id);
    checkTenantAccess(
      patient!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Soft delete
    patient!.isDeleted = true;
    patient!.updatedBy = context.userId;
    await patient!.save();

    // Audit log
    console.log(
      'Patient deleted:',
      createAuditLog(
        'DELETE_PATIENT',
        'Patient',
        patient!._id.toString(),
        context,
        { mrn: patient!.mrn, name: patient!.getDisplayName() }
      )
    );

    sendSuccess(res, null, 'Patient deleted successfully');
  }
);

/**
 * GET /api/patients/search
 * Advanced patient search with multiple criteria
 */
export const searchPatients = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { q, limit = 10 } = req.query as any;
    const context = getRequestContext(req);

    if (!q) {
      return sendError(res, 'BAD_REQUEST', 'Search query is required', 400);
    }

    const searchRegex = new RegExp(q, 'i');
    const query: any = {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { otherNames: searchRegex },
        { mrn: searchRegex },
        { phone: searchRegex },
      ],
    };

    // Tenant filtering
    if (!context.isAdmin) {
      query.workplaceId = context.workplaceId;
    }

    const patients = await Patient.find(query)
      .select(
        'firstName lastName otherNames mrn phone dob bloodGroup latestVitals'
      )
      .limit(Math.min(parseInt(limit), 50))
      .sort('lastName firstName')
      .lean();

    // Add computed fields
    const enrichedPatients = patients.map((patient) => ({
      ...patient,
      displayName: `${patient.firstName} ${patient.lastName}`,
      age: patient.dob
        ? Math.floor(
            (Date.now() - patient.dob.getTime()) /
              (1000 * 60 * 60 * 24 * 365.25)
          )
        : null,
    }));

    sendSuccess(
      res,
      {
        patients: enrichedPatients,
        total: enrichedPatients.length,
        query: q,
      },
      `Found ${enrichedPatients.length} patients`
    );
  }
);

/**
 * GET /api/patients/:id/summary
 * Get patient summary for dashboard/overview
 */
export const getPatientSummary = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const context = getRequestContext(req);

    // Find patient
    const patient = await Patient.findById(id);
    ensureResourceExists(patient, 'Patient', id);
    checkTenantAccess(
      patient!.workplaceId.toString(),
      context.workplaceId,
      context.isAdmin
    );

    // Get counts for patient's related records
    const [allergyCount, conditionCount, medicationCount, visitCount] =
      await Promise.all([
        Allergy.countDocuments({ patientId: id, isDeleted: false }),
        Condition.countDocuments({ patientId: id, isDeleted: false }),
        MedicationRecord.countDocuments({
          patientId: id,
          isDeleted: false,
          phase: 'current',
        }),
        Visit.countDocuments({ patientId: id, isDeleted: false }),
      ]);

    const summary = {
      patient: {
        id: patient!._id,
        name: `${patient!.firstName} ${patient!.lastName}`,
        mrn: patient!.mrn,
        age: patient!.dob
          ? Math.floor(
              (Date.now() - patient!.dob.getTime()) /
                (1000 * 60 * 60 * 24 * 365.25)
            )
          : null,
        latestVitals: patient!.latestVitals,
      },
      counts: {
        allergies: allergyCount,
        conditions: conditionCount,
        currentMedications: medicationCount,
        visits: visitCount,
        hasActiveDTP: patient!.hasActiveDTP,
      },
    };

    sendSuccess(res, summary, 'Patient summary retrieved successfully');
  }
);
