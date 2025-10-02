import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  generateDiagnosticAnalysis,
  saveDiagnosticDecision,
  getDiagnosticHistory,
  getDiagnosticCase,
  checkDrugInteractions,
  testAIConnection,
  saveDiagnosticNotes,
  getPatientDiagnosticHistory,
  addDiagnosticHistoryNote,
  getDiagnosticAnalytics,
  getAllDiagnosticCases,
  getDiagnosticReferrals,
  exportDiagnosticHistoryPDF,
  generateReferralDocument,
  compareDiagnosticHistories,
  debugDatabaseCounts,
  markCaseForFollowUp,
  markCaseAsCompleted,
  generateCaseReferralDocument,
  updateReferralDocument,
  getFollowUpCases,
  downloadReferralDocument,
  sendReferralElectronically,
  deleteReferral,
} from '../controllers/diagnosticController';
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
 * @route GET /api/diagnostics/cases/all
 * @desc Get all diagnostic cases (for "View All" functionality)
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/cases/all',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('VIEW_ALL_DIAGNOSTIC_CASES', 'data_access'),
  getAllDiagnosticCases
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

/**
 * @route GET /api/diagnostics/debug/counts
 * @desc Debug endpoint to check database counts (Development only)
 * @access Private
 */
router.get(
  '/debug/counts',
  auth,
  debugDatabaseCounts
);

// New enhanced endpoints for diagnostic history management



/**
 * @route POST /api/diagnostics/history/:historyId/notes
 * @desc Add notes to diagnostic history
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/history/:historyId/notes',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('ADD_DIAGNOSTIC_HISTORY_NOTE', 'clinical_documentation'),
  addDiagnosticHistoryNote
);

/**
 * @route GET /api/diagnostics/analytics
 * @desc Get diagnostic analytics
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/analytics',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('VIEW_DIAGNOSTIC_ANALYTICS', 'data_access'),
  getDiagnosticAnalytics
);



/**
 * @route GET /api/diagnostics/referrals
 * @desc Get diagnostic referrals
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/referrals',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('VIEW_DIAGNOSTIC_REFERRALS', 'data_access'),
  getDiagnosticReferrals
);

/**
 * @route GET /api/diagnostics/history/:historyId/export/pdf
 * @desc Export diagnostic history as PDF
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/history/:historyId/export/pdf',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('EXPORT_DIAGNOSTIC_HISTORY_PDF', 'data_export'),
  exportDiagnosticHistoryPDF
);

/**
 * @route POST /api/diagnostics/history/:historyId/referral/generate
 * @desc Generate referral document
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/history/:historyId/referral/generate',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('GENERATE_REFERRAL_DOCUMENT', 'clinical_documentation'),
  generateReferralDocument
);

/**
 * @route POST /api/diagnostics/history/compare
 * @desc Compare diagnostic histories
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/history/compare',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('COMPARE_DIAGNOSTIC_HISTORIES', 'data_analysis'),
  compareDiagnosticHistories
);

/**
 * @route POST /api/diagnostics/cases/:caseId/follow-up
 * @desc Mark case for follow-up
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/cases/:caseId/follow-up',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('MARK_CASE_FOLLOW_UP', 'clinical_documentation'),
  markCaseForFollowUp
);

/**
 * @route POST /api/diagnostics/cases/:caseId/complete
 * @desc Mark case as completed
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/cases/:caseId/complete',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('MARK_CASE_COMPLETED', 'clinical_documentation'),
  markCaseAsCompleted
);

/**
 * @route POST /api/diagnostics/cases/:caseId/referral/generate
 * @desc Generate referral document for case
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/cases/:caseId/referral/generate',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('GENERATE_CASE_REFERRAL', 'clinical_documentation'),
  generateCaseReferralDocument
);

/**
 * @route PUT /api/diagnostics/cases/:caseId/referral/update
 * @desc Update referral document
 * @access Private (requires clinical_decision_support feature)
 */
router.put(
  '/cases/:caseId/referral/update',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('UPDATE_REFERRAL_DOCUMENT', 'clinical_documentation'),
  updateReferralDocument
);

/**
 * @route GET /api/diagnostics/follow-up
 * @desc Get follow-up cases
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/follow-up',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('VIEW_FOLLOW_UP_CASES', 'data_access'),
  getFollowUpCases
);

/**
 * @route GET /api/diagnostics/cases/:caseId/referral/download
 * @desc Download referral document
 * @access Private (requires clinical_decision_support feature)
 */
router.get(
  '/cases/:caseId/referral/download',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('DOWNLOAD_REFERRAL_DOCUMENT', 'data_export'),
  downloadReferralDocument
);

/**
 * @route POST /api/diagnostics/cases/:caseId/referral/send
 * @desc Send referral electronically
 * @access Private (requires clinical_decision_support feature)
 */
router.post(
  '/cases/:caseId/referral/send',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('SEND_REFERRAL_ELECTRONICALLY', 'clinical_communication'),
  sendReferralElectronically
);

/**
 * @route DELETE /api/diagnostics/cases/:caseId/referral
 * @desc Delete referral
 * @access Private (requires clinical_decision_support feature)
 */
router.delete(
  '/cases/:caseId/referral',
  diagnosticRateLimit,
  auth,
  requireFeature('clinical_decision_support'),
  auditLogger('DELETE_REFERRAL', 'clinical_documentation'),
  deleteReferral
);

export default router;