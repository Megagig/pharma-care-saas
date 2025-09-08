import { Request, Response } from 'express';
import MedicationManagement, {
  IMedicationManagement,
} from '../models/MedicationManagement';
import AdherenceLog from '../models/AdherenceLog';
import Patient from '../models/Patient';
import mongoose from 'mongoose';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    workplaceId: string;
    [key: string]: any;
  };
}

// Helper function to check if patient exists
const checkPatientExists = async (patientId: string): Promise<boolean> => {
  try {
    const patient = await Patient.findById(patientId);
    return !!patient;
  } catch (error) {
    return false;
  }
};

/**
 * Create a new medication for a patient
 */
export const createMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.body;
    // Check if patient exists
    const patientExists = await checkPatientExists(patientId as string);
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Add workplaceId from the request (set by auth middleware)
    const workplaceId = req.user?.workplaceId;

    // Create medication with user and workplace context
    const medication = new MedicationManagement({
      ...req.body,
      workplaceId,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    // Save the medication
    const savedMedication = await medication.save();

    // Return the created medication
    res.status(201).json({
      success: true,
      data: savedMedication,
    });
    return;
  } catch (error) {
    logger.error('Error creating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating medication',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

/**
 * Get all medications for a specific patient
 */
export const getMedicationsByPatient = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { patientId } = req.params;
    const { status = 'active' } = req.query;

    // Build query based on status filter
    let statusFilter = {};
    if (status !== 'all') {
      statusFilter = { status };
    }

    // Check if patient exists
    const patientExists = await checkPatientExists(patientId as string);
    if (!patientExists) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Find medications for the patient with workplace tenancy
    const medications = await MedicationManagement.find({
      patientId,
      workplaceId: req.user?.workplaceId,
      ...statusFilter,
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: medications.length,
      data: medications,
    });
    return;
  } catch (error) {
    logger.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medications',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

/**
 * Get a specific medication by ID
 */
export const getMedicationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const medication = await MedicationManagement.findOne({
      _id: id,
      workplaceId: req.user?.workplaceId,
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    res.json({
      success: true,
      data: medication,
    });
    return;
  } catch (error) {
    logger.error('Error fetching medication:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medication',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

/**
 * Update a medication
 */
export const updateMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the current medication
    const currentMedication = await MedicationManagement.findOne({
      _id: id,
      workplaceId: req.user?.workplaceId,
    });

    if (!currentMedication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    // Create a history entry from current medication state
    const historyEntry = {
      name: currentMedication.name,
      dosage: currentMedication.dosage,
      frequency: currentMedication.frequency,
      route: currentMedication.route,
      startDate: currentMedication.startDate,
      endDate: currentMedication.endDate,
      indication: currentMedication.indication,
      prescriber: currentMedication.prescriber,
      status: currentMedication.status,
      updatedAt: new Date(),
      updatedBy: req.user?._id,
      notes: updateData.historyNotes || 'Updated medication',
    };

    // Update the medication
    const updatedMedication = await MedicationManagement.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: req.user?._id,
        $push: { history: historyEntry },
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedMedication,
    });
    return;
  } catch (error) {
    logger.error('Error updating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating medication',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

/**
 * Archive a medication
 */
export const archiveMedication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Find the current medication
    const currentMedication = await MedicationManagement.findOne({
      _id: id,
      workplaceId: req.user?.workplaceId,
    });

    if (!currentMedication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found',
      });
    }

    // Create a history entry for archival
    const historyEntry = {
      name: currentMedication.name,
      dosage: currentMedication.dosage,
      frequency: currentMedication.frequency,
      route: currentMedication.route,
      startDate: currentMedication.startDate,
      endDate: currentMedication.endDate,
      indication: currentMedication.indication,
      prescriber: currentMedication.prescriber,
      status: currentMedication.status,
      updatedAt: new Date(),
      updatedBy: req.user?._id,
      notes: reason || 'Medication archived',
    };

    // Update to archived status
    const archivedMedication = await MedicationManagement.findByIdAndUpdate(
      id,
      {
        status: 'archived',
        updatedBy: req.user?._id,
        $push: { history: historyEntry },
      },
      { new: true }
    );

    res.json({
      success: true,
      data: archivedMedication,
    });
    return;
  } catch (error) {
    logger.error('Error archiving medication:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving medication',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

/**
 * Log medication adherence
 */
export const logAdherence = async (req: AuthRequest, res: Response) => {
  try {
    const {
      medicationId,
      patientId,
      refillDate,
      adherenceScore,
      pillCount,
      notes,
    } = req.body;

    // Verify medication exists and belongs to patient
    const medication = await MedicationManagement.findOne({
      _id: medicationId,
      patientId,
      workplaceId: req.user?.workplaceId,
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found or does not belong to the patient',
      });
    }

    // Create new adherence log
    const adherenceLog = new AdherenceLog({
      medicationId,
      patientId,
      workplaceId: req.user?.workplaceId,
      refillDate: refillDate || new Date(),
      adherenceScore,
      pillCount,
      notes,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    const savedLog = await adherenceLog.save();

    res.status(201).json({
      success: true,
      data: savedLog,
    });
    return;
  } catch (error) {
    logger.error('Error logging adherence:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging adherence',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

/**
 * Get adherence logs for a patient
 */
export const getAdherenceLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        refillDate: {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        },
      };
    }

    // Find adherence logs for the patient
    const adherenceLogs = await AdherenceLog.find({
      patientId,
      workplaceId: req.user?.workplaceId,
      ...dateFilter,
    })
      .populate('medicationId', 'name dosage frequency')
      .sort({ refillDate: -1 });

    res.json({
      success: true,
      count: adherenceLogs.length,
      data: adherenceLogs,
    });
  } catch (error) {
    logger.error('Error fetching adherence logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching adherence logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Check for medication interactions
 */
export const checkInteractions = async (req: AuthRequest, res: Response) => {
  try {
    const { medications } = req.body;

    // Implementation placeholder for RxNorm API integration
    // This would normally connect to an external API service like RxNorm

    // For demonstration, return a mock response
    const mockInteractions = [
      {
        drugPair: [medications[0]?.name, medications[1]?.name].filter(Boolean),
        severity: 'moderate',
        description: 'These medications may interact. Monitor patient closely.',
      },
    ];

    res.json({
      success: true,
      data: mockInteractions,
    });

    // TODO: Implement actual RxNorm API integration in the future
  } catch (error) {
    logger.error('Error checking interactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking medication interactions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
