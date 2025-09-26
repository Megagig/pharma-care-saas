"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInterventionPlanLimits = exports.checkInterventionReportAccess = exports.checkInterventionAssignAccess = exports.checkInterventionModifyAccess = exports.checkInterventionAccess = exports.requireInterventionExport = exports.requireInterventionReports = exports.requireInterventionAssign = exports.requireInterventionDelete = exports.requireInterventionUpdate = exports.requireInterventionRead = exports.requireInterventionCreate = void 0;
const rbac_1 = require("./rbac");
const ClinicalIntervention_1 = __importDefault(require("../models/ClinicalIntervention"));
const logger_1 = __importDefault(require("../utils/logger"));
exports.requireInterventionCreate = (0, rbac_1.requirePermission)('clinical_intervention.create');
exports.requireInterventionRead = (0, rbac_1.requirePermission)('clinical_intervention.read');
exports.requireInterventionUpdate = (0, rbac_1.requirePermission)('clinical_intervention.update');
exports.requireInterventionDelete = (0, rbac_1.requirePermission)('clinical_intervention.delete');
exports.requireInterventionAssign = (0, rbac_1.requirePermission)('clinical_intervention.assign');
exports.requireInterventionReports = (0, rbac_1.requirePermission)('clinical_intervention.reports');
exports.requireInterventionExport = (0, rbac_1.requirePermission)('clinical_intervention.export');
const checkInterventionAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (!req.workspaceContext?.workspace) {
            res.status(403).json({
                success: false,
                message: 'No workspace associated with user',
            });
            return;
        }
        const interventionId = req.params.id;
        if (!interventionId) {
            return next();
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const intervention = await ClinicalIntervention_1.default.findById(interventionId)
            .select('workplaceId identifiedBy')
            .lean();
        if (!intervention) {
            res.status(404).json({
                success: false,
                message: 'Clinical intervention not found',
            });
            return;
        }
        const userWorkplaceId = req.workspaceContext.workspace._id.toString();
        const interventionWorkplaceId = intervention.workplaceId.toString();
        if (interventionWorkplaceId !== userWorkplaceId) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Intervention belongs to different workplace.',
            });
            return;
        }
        req.interventionData = intervention;
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking intervention access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking intervention access',
        });
    }
};
exports.checkInterventionAccess = checkInterventionAccess;
const checkInterventionModifyAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        const interventionId = req.params.id;
        if (!interventionId) {
            res.status(400).json({
                success: false,
                message: 'Intervention ID is required',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        if (['Owner', 'Pharmacist'].includes(req.user.workplaceRole || '')) {
            return next();
        }
        const intervention = await ClinicalIntervention_1.default.findById(interventionId)
            .select('identifiedBy workplaceId')
            .lean();
        if (!intervention) {
            res.status(404).json({
                success: false,
                message: 'Clinical intervention not found',
            });
            return;
        }
        const isCreator = intervention.identifiedBy.toString() === req.user._id.toString();
        if (!isCreator) {
            res.status(403).json({
                success: false,
                message: 'Access denied. You can only modify interventions you created.',
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking intervention modify access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking intervention modify access',
        });
    }
};
exports.checkInterventionModifyAccess = checkInterventionModifyAccess;
const checkInterventionAssignAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (!req.workspaceContext) {
            res.status(500).json({
                success: false,
                message: 'Workspace context not loaded',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const hasTeamManagement = req.workspaceContext.permissions.includes('teamManagement');
        if (!hasTeamManagement) {
            res.status(402).json({
                success: false,
                message: 'Team management feature not available in your plan',
                upgradeRequired: true,
            });
            return;
        }
        if (!['Owner', 'Pharmacist'].includes(req.user.workplaceRole || '')) {
            res.status(403).json({
                success: false,
                message: 'Insufficient role permissions for team assignment',
                requiredRoles: ['Owner', 'Pharmacist'],
                userRole: req.user.workplaceRole,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking intervention assign access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking intervention assign access',
        });
    }
};
exports.checkInterventionAssignAccess = checkInterventionAssignAccess;
const checkInterventionReportAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (!req.workspaceContext) {
            res.status(500).json({
                success: false,
                message: 'Workspace context not loaded',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const hasAdvancedReports = req.workspaceContext.permissions.includes('advancedReports');
        if (!hasAdvancedReports) {
            res.status(402).json({
                success: false,
                message: 'Advanced reporting feature not available in your plan',
                upgradeRequired: true,
                requiredFeatures: ['advancedReports'],
            });
            return;
        }
        const currentTier = req.workspaceContext.plan?.tier;
        const allowedTiers = ['pro', 'pharmily', 'network', 'enterprise'];
        if (!currentTier || !allowedTiers.includes(currentTier)) {
            res.status(402).json({
                success: false,
                message: 'Advanced reporting requires Pro plan or higher',
                upgradeRequired: true,
                currentTier,
                requiredTiers: allowedTiers,
            });
            return;
        }
        if (!['Owner', 'Pharmacist'].includes(req.user.workplaceRole || '')) {
            res.status(403).json({
                success: false,
                message: 'Insufficient role permissions for reporting',
                requiredRoles: ['Owner', 'Pharmacist'],
                userRole: req.user.workplaceRole,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking intervention report access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking intervention report access',
        });
    }
};
exports.checkInterventionReportAccess = checkInterventionReportAccess;
const checkInterventionPlanLimits = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
            return;
        }
        if (!req.workspaceContext) {
            res.status(500).json({
                success: false,
                message: 'Workspace context not loaded',
            });
            return;
        }
        if (req.user.role === 'super_admin') {
            return next();
        }
        const interventionLimit = req.workspaceContext.limits?.interventions;
        if (interventionLimit === null || interventionLimit === undefined) {
            return next();
        }
        const currentCount = await ClinicalIntervention_1.default.countDocuments({
            workplaceId: req.workspaceContext.workspace?._id,
            isDeleted: false,
        });
        if (currentCount >= interventionLimit) {
            res.status(429).json({
                success: false,
                message: 'Intervention limit exceeded for your plan',
                limit: interventionLimit,
                current: currentCount,
                upgradeRequired: true,
            });
            return;
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Error checking intervention plan limits:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking intervention plan limits',
        });
    }
};
exports.checkInterventionPlanLimits = checkInterventionPlanLimits;
exports.default = {
    requireInterventionCreate: exports.requireInterventionCreate,
    requireInterventionRead: exports.requireInterventionRead,
    requireInterventionUpdate: exports.requireInterventionUpdate,
    requireInterventionDelete: exports.requireInterventionDelete,
    requireInterventionAssign: exports.requireInterventionAssign,
    requireInterventionReports: exports.requireInterventionReports,
    requireInterventionExport: exports.requireInterventionExport,
    checkInterventionAccess: exports.checkInterventionAccess,
    checkInterventionModifyAccess: exports.checkInterventionModifyAccess,
    checkInterventionAssignAccess: exports.checkInterventionAssignAccess,
    checkInterventionReportAccess: exports.checkInterventionReportAccess,
    checkInterventionPlanLimits: exports.checkInterventionPlanLimits,
};
//# sourceMappingURL=clinicalInterventionRBAC.js.map