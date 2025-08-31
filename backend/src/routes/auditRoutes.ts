import express from 'express';
import { auth } from '../middlewares/auth';
import {
    getAuditLogs,
    getAuditSummary,
    getComplianceReport,
    getHighRiskActivities,
    getSuspiciousActivities,
    exportAuditData,
    getUserActivity,
    getPatientAccessLog,
    getAuditActions,
} from '../controllers/auditController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Audit log routes
router.get('/logs', getAuditLogs);
router.get('/summary', getAuditSummary);
router.get('/compliance-report', getComplianceReport);
router.get('/high-risk-activities', getHighRiskActivities);
router.get('/suspicious-activities', getSuspiciousActivities);
router.post('/export', exportAuditData);

// User and patient specific audit trails
router.get('/user-activity/:userId', getUserActivity);
router.get('/patient-access/:patientId', getPatientAccessLog);

// Utility routes
router.get('/actions', getAuditActions);

export default router;