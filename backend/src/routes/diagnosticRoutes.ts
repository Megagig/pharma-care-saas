import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import diagnosticController from '../controllers/diagnosticController';

const {
  generateDiagnosticAnalysis,
  saveDiagnosticDecision,
  getDiagnosticHistory,
  getDiagnosticCase,
  checkDrugInteractions,
  testAIConnection,
  saveDiagnosticNotes
} = diagnosticController;
import {
  validateDiagnosticAnalysis,
  validateDiagnosticDecision,
  validateDiagnosticHistory,
  validateGetDiagnosticCase,
  validateDrugInteractions
} from '../validators/diagnosticValidators';
import { auth, requireFeature, requireLicense } from '../middlewares/auth';
import { auditLogger } from '../middlewares/auditMiddleware';

const router = Router();

// Rate limiting for AI API calls (more restrictive)
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 10, // 10 requests per 15 minutes in production
  message: {
    success: false,
    message: 'Too many AI diagnostic requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for general diagnostic endpoints
const diagnosticRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 100, // 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many diagnostic requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Timeout middleware for AI diagnostic requests
const extendTimeout = (req: any, res: any, next: any) => {
  // Set timeout to 90 seconds for AI processing
  req.setTimeout(90000);
  res.setTimeout(90000);
  next();
};

/**
 * @route POST /api/diagnostics/ai
 * @desc Generate AI diagnostic analysis
 * @access Private (requires license and clinical_decision_support feature)
 */
router.post(
  '/ai',
  extendTimeout,
  aiRateLimit,
  auth,
  requireLicense,
  requireFeature('clinical_decision_support'),
  auditLogger('AI_DIAGNOSTIC_REQUEST', 'clinical_documentation'),
  validateDiagnosticAnalysis,
  generateDiagnosticAnalysis
);

/**
 * @route POST /api/diagnostics/cases/:caseId/decision
 * @desc Save pharmacist decision on diagnostic case
 * @access Private (requires license)
 */
router.post(
  '/cases/:caseId/decision',
  diagnosticRateLimit,
  auth,
  requireLicense,
  auditLogger('DIAGNOSTIC_DECISION', 'clinical_documentation'),
  validateDiagnosticDecision,
  saveDiagnosticDecision
);

/**
 * @route GET /api/diagnostics/patients/:patientId/history
 * @desc Get diagnostic case history for a patient
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/patients/:patientId/history',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('VIEW_DIAGNOSTIC_HISTORY', 'data_access'),
  validateDiagnosticHistory,
  getDiagnosticHistory
);

/**
 * @route GET /api/diagnostics/cases/:caseId
 * @desc Get a specific diagnostic case
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/cases/:caseId',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('VIEW_DIAGNOSTIC_CASE', 'data_access'),
  validateGetDiagnosticCase,
  getDiagnosticCase
);

/**
 * @route POST /api/diagnostics/interactions
 * @desc Check drug interactions
 * @access Private (requires drug_information feature)
 */
router.post(
  '/interactions',
  diagnosticRateLimit,
  auth,
  requireFeature('drug_information'),
  auditLogger('DRUG_INTERACTION_CHECK', 'clinical_documentation'),
  validateDrugInteractions,
  checkDrugInteractions
);

/**
 * @route POST /api/diagnostics/cases/:caseId/notes
 * @desc Save notes for a diagnostic case
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/cases/:caseId/notes',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('SAVE_DIAGNOSTIC_NOTES', 'clinical_documentation'),
  saveDiagnosticNotes
);

/**
 * @route POST /api/diagnostics/cases/:caseId/notes
 * @desc Save notes for a diagnostic case
 * @access Private (requires license)
 */
router.post(
  '/cases/:caseId/notes',
  diagnosticRateLimit,
  auth,
  requireLicense,
  auditLogger('SAVE_DIAGNOSTIC_NOTES', 'clinical_documentation'),
  saveDiagnosticNotes
);

/**
 * @route GET /api/diagnostics/ai/test
 * @desc Test OpenRouter AI connection (Super Admin only)
 * @access Private (super admin only)
 */
router.get(
  '/ai/test',
  auth,
  auditLogger('AI_CONNECTION_TEST', 'system_security'),
  testAIConnection
);

export default router;