import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import DiagnosticCase, { IDiagnosticCase } from '../models/DiagnosticCase';
import Patient from '../models/Patient';
import openRouterService, {
  DiagnosticInput,
} from '../services/openRouterService';
import { AuthRequest } from '../middlewares/auth';
import logger from '../utils/logger';
import { createAuditLog } from '../utils/responseHelpers';
// Note: Drug interaction service integration will be added later

/**
 * Generate AI diagnostic analysis
 */
export const generateDiagnosticAnalysis = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Log incoming request data for debugging
    logger.info('Diagnostic analysis request received:', {
      body: req.body,
      userId: req.user?._id,
      contentType: req.headers['content-type']
    });

    const userId = req.user!._id;
    const workplaceId = req.user!.workplaceId;

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Diagnostic validation failed:', {
        errors: errors.array(),
        body: req.body,
        userId
      });
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const {
      patientId,
      symptoms,
      labResults,
      currentMedications,
      vitalSigns,
      patientConsent,
    } = req.body;

    // Verify workplaceId exists
    if (!workplaceId) {
      res.status(400).json({
        success: false,
        message: 'User workplace is required for diagnostic analysis',
      });
      return;
    }

    // Validate patient consent
    if (!patientConsent?.provided) {
      res.status(400).json({
        success: false,
        message: 'Patient consent is required for AI diagnostic analysis',
      });
      return;
    }

    // Verify patient exists and belongs to the workplace
    const patient = await Patient.findOne({
      _id: patientId,
      workplaceId: workplaceId,
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found or access denied',
      });
      return;
    }

    // Prepare diagnostic input
    const diagnosticInput: DiagnosticInput = {
      symptoms,
      labResults,
      currentMedications,
      vitalSigns,
      patientAge: patient.age,
      patientGender: patient.gender,
      allergies:
        (patient as any).allergies?.map((allergy: any) => allergy.allergen) ||
        [],
      medicalHistory:
        (patient as any).conditions?.map((condition: any) => condition.name) ||
        [],
    };

    logger.info('Starting AI diagnostic analysis', {
      patientId,
      pharmacistId: userId,
      workplaceId,
      symptomsCount: symptoms.subjective.length + symptoms.objective.length,
    });

    // Generate AI analysis
    const aiResult =
      await openRouterService.generateDiagnosticAnalysis(diagnosticInput);

    // Check for drug interactions if medications are provided
    const drugInteractions: any[] = [];
    if (currentMedications && currentMedications.length > 1) {
      try {
        // This would integrate with your existing drug interaction service
        // drugInteractions = await drugInteractionService.checkInteractions(currentMedications);
      } catch (error) {
        logger.warn('Drug interaction check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Create diagnostic case record
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    const caseId = `DX-${timestamp}-${random}`.toUpperCase();

    const diagnosticCase = new DiagnosticCase({
      caseId,
      patientId,
      pharmacistId: userId,
      workplaceId,
      symptoms,
      labResults,
      currentMedications,
      vitalSigns,
      aiAnalysis: {
        ...aiResult.analysis,
        processingTime: aiResult.processingTime,
      },
      drugInteractions,
      patientConsent: {
        provided: patientConsent.provided,
        consentDate: new Date(),
        consentMethod: patientConsent.method || 'electronic',
      },
      aiRequestData: {
        model: 'deepseek/deepseek-chat-v3.1:free',
        promptTokens: aiResult.usage.prompt_tokens,
        completionTokens: aiResult.usage.completion_tokens,
        totalTokens: aiResult.usage.total_tokens,
        requestId: aiResult.requestId,
        processingTime: aiResult.processingTime,
      },
      pharmacistDecision: {
        accepted: false,
        modifications: '',
        finalRecommendation: '',
        counselingPoints: [],
        followUpRequired: false,
      },
    });

    await diagnosticCase.save();

    // Create audit log
    const auditContext = {
      userId,
      userRole: req.user!.role,
      workplaceId: workplaceId.toString(),
      isAdmin: (req as any).isAdmin || false,
      isSuperAdmin: req.user!.role === 'super_admin',
      canManage: (req as any).canManage || false,
      timestamp: new Date().toISOString(),
    };

    createAuditLog(
      'AI_DIAGNOSTIC_ANALYSIS',
      'DiagnosticCase',
      diagnosticCase._id.toString(),
      auditContext
    );

    logger.info('AI diagnostic analysis completed', {
      caseId: diagnosticCase.caseId,
      processingTime: aiResult.processingTime,
      confidenceScore: aiResult.analysis.confidenceScore,
    });

    res.status(200).json({
      success: true,
      data: {
        caseId: diagnosticCase.caseId,
        analysis: aiResult.analysis,
        drugInteractions,
        processingTime: aiResult.processingTime,
        tokensUsed: aiResult.usage.total_tokens,
      },
    });
  } catch (error) {
    logger.error('AI diagnostic analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      patientId: req.body.patientId,
      pharmacistId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: 'AI diagnostic analysis failed',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : 'Internal server error',
    });
  }
};

/**
 * Save pharmacist decision on diagnostic case
 */
export const saveDiagnosticDecision = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { caseId } = req.params;
    const {
      accepted,
      modifications,
      finalRecommendation,
      counselingPoints,
      followUpRequired,
      followUpDate,
    } = req.body;
    const userId = req.user!._id;

    // Find and verify ownership of diagnostic case
    const diagnosticCase = await DiagnosticCase.findOne({
      caseId,
      pharmacistId: userId,
    });

    if (!diagnosticCase) {
      res.status(404).json({
        success: false,
        message: 'Diagnostic case not found or access denied',
      });
      return;
    }

    // Update pharmacist decision
    diagnosticCase.pharmacistDecision = {
      accepted,
      modifications: modifications || '',
      finalRecommendation,
      counselingPoints: counselingPoints || [],
      followUpRequired: followUpRequired || false,
      followUpDate:
        followUpRequired && followUpDate ? new Date(followUpDate) : undefined,
    };

    diagnosticCase.status = 'completed';
    diagnosticCase.completedAt = new Date();

    await diagnosticCase.save();

    // Create audit log
    const auditContext = {
      userId,
      userRole: req.user!.role,
      workplaceId: diagnosticCase.workplaceId.toString(),
      isAdmin: (req as any).isAdmin || false,
      isSuperAdmin: req.user!.role === 'super_admin',
      canManage: (req as any).canManage || false,
      timestamp: new Date().toISOString(),
    };

    createAuditLog(
      'DIAGNOSTIC_DECISION_SAVED',
      'DiagnosticCase',
      diagnosticCase._id.toString(),
      auditContext
    );

    res.status(200).json({
      success: true,
      data: {
        caseId: diagnosticCase.caseId,
        status: diagnosticCase.status,
        completedAt: diagnosticCase.completedAt,
      },
    });
  } catch (error) {
    logger.error('Failed to save diagnostic decision', {
      error: error instanceof Error ? error.message : 'Unknown error',
      caseId: req.params.caseId,
      pharmacistId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to save diagnostic decision',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : 'Internal server error',
    });
  }
};

/**
 * Get diagnostic case history for a patient
 */
export const getDiagnosticHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user!._id;
    const workplaceId = req.user!.workplaceId;

    // Verify patient access
    const patient = await Patient.findOne({
      _id: patientId,
      workplaceId: workplaceId,
    });

    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'Patient not found or access denied',
      });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const diagnosticCases = await DiagnosticCase.find({
      patientId,
      workplaceId,
    })
      .populate('pharmacistId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-aiRequestData -pharmacistDecision.modifications'); // Exclude sensitive data

    const total = await DiagnosticCase.countDocuments({
      patientId,
      workplaceId,
    });

    res.status(200).json({
      success: true,
      data: {
        cases: diagnosticCases,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          count: diagnosticCases.length,
          totalCases: total,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get diagnostic history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      patientId: req.params.patientId,
      pharmacistId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get diagnostic history',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : 'Internal server error',
    });
  }
};

/**
 * Get a specific diagnostic case
 */
export const getDiagnosticCase = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { caseId } = req.params;
    const workplaceId = req.user!.workplaceId;

    const diagnosticCase = await DiagnosticCase.findOne({
      caseId,
      workplaceId,
    })
      .populate('patientId', 'firstName lastName age gender')
      .populate('pharmacistId', 'firstName lastName');

    if (!diagnosticCase) {
      res.status(404).json({
        success: false,
        message: 'Diagnostic case not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: diagnosticCase,
    });
  } catch (error) {
    logger.error('Failed to get diagnostic case', {
      error: error instanceof Error ? error.message : 'Unknown error',
      caseId: req.params.caseId,
      pharmacistId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to get diagnostic case',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : 'Internal server error',
    });
  }
};

/**
 * Check drug interactions
 */
export const checkDrugInteractions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { medications } = req.body;

    if (!medications || medications.length < 2) {
      res.status(400).json({
        success: false,
        message:
          'At least two medications are required for interaction checking',
      });
      return;
    }

    // This would integrate with your existing drug interaction service
    // For now, return a placeholder response
    const interactions: any[] = [];
    // const interactions = await drugInteractionService.checkInteractions(medications);

    res.status(200).json({
      success: true,
      data: {
        interactions,
        medicationsChecked: medications.length,
        interactionsFound: interactions.length,
      },
    });
  } catch (error) {
    logger.error('Drug interaction check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pharmacistId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: 'Drug interaction check failed',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : 'Internal server error',
    });
  }
};

/**
 * Test OpenRouter connection
 */
export const testAIConnection = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Only super admins can test the connection
    if (req.user!.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Super admin required.',
      });
      return;
    }

    const isConnected = await openRouterService.testConnection();

    res.status(200).json({
      success: true,
      data: {
        connected: isConnected,
        service: 'OpenRouter API',
        model: 'deepseek/deepseek-chat-v3.1:free',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('AI connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pharmacistId: req.user?._id,
    });

    res.status(500).json({
      success: false,
      message: 'AI connection test failed',
      error:
        process.env.NODE_ENV === 'development'
          ? error instanceof Error
            ? error.message
            : 'Unknown error'
          : 'Internal server error',
    });
  }
};

export default {
  generateDiagnosticAnalysis,
  saveDiagnosticDecision,
  getDiagnosticHistory,
  getDiagnosticCase,
  checkDrugInteractions,
  testAIConnection,
};
