"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPatientPlanLimits = exports.checkPharmacyAccess = exports.checkWorkplaceAccess = exports.requireVitalsAccess = exports.requireClinicalAssessmentAccess = exports.requirePatientManage = exports.requirePatientDelete = exports.requirePatientUpdate = exports.requirePatientCreate = exports.requirePatientRead = exports.requirePatientPermission = exports.hasPatientManagementPermission = void 0;
const PATIENT_MANAGEMENT_PERMISSIONS = {
    owner: ['create', 'read', 'update', 'delete', 'manage'],
    pharmacist: ['create', 'read', 'update', 'delete', 'manage'],
    technician: ['read'],
    admin: ['create', 'read', 'update', 'delete', 'manage'],
};
const TECHNICIAN_ALLOWED_RESOURCES = ['clinical-assessments', 'vitals', 'labs'];
const hasPatientManagementPermission = (userRole, action, resource) => {
    const role = mapToPatientManagementRole(userRole);
    const allowedActions = PATIENT_MANAGEMENT_PERMISSIONS[role] || [];
    if (allowedActions.includes(action)) {
        return true;
    }
    if (role === 'technician' &&
        ['create', 'update'].includes(action) &&
        resource) {
        return TECHNICIAN_ALLOWED_RESOURCES.some((allowedResource) => resource.includes(allowedResource));
    }
    return false;
};
exports.hasPatientManagementPermission = hasPatientManagementPermission;
const mapToPatientManagementRole = (systemRole) => {
    switch (systemRole) {
        case 'super_admin':
            return 'admin';
        case 'pharmacy_outlet':
            return 'owner';
        case 'pharmacist':
        case 'pharmacy_team':
            return 'pharmacist';
        case 'intern_pharmacist':
            return 'technician';
        default:
            return 'technician';
    }
};
const requirePatientPermission = (action, resource) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log('RBAC - No user in request');
            res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }
        const userRole = req.user.role;
        const hasPermission = (0, exports.hasPatientManagementPermission)(userRole, action, resource);
        if (process.env.NODE_ENV === 'development') {
            console.log('RBAC check:', {
                userRole,
                action,
                resource,
                hasPermission,
                mappedRole: mapToPatientManagementRole(userRole),
                userId: req.user._id,
            });
        }
        if (!hasPermission) {
            res.status(403).json({
                message: 'Insufficient permissions for this action',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: action,
                userRole: mapToPatientManagementRole(userRole),
                resource: resource,
            });
            return;
        }
        req.patientRole = mapToPatientManagementRole(userRole);
        req.canManage = (0, exports.hasPatientManagementPermission)(userRole, 'manage');
        req.isAdmin = mapToPatientManagementRole(userRole) === 'admin';
        next();
    };
};
exports.requirePatientPermission = requirePatientPermission;
exports.requirePatientRead = (0, exports.requirePatientPermission)('read');
exports.requirePatientCreate = (0, exports.requirePatientPermission)('create');
exports.requirePatientUpdate = (0, exports.requirePatientPermission)('update');
exports.requirePatientDelete = (0, exports.requirePatientPermission)('delete');
exports.requirePatientManage = (0, exports.requirePatientPermission)('manage');
exports.requireClinicalAssessmentAccess = (0, exports.requirePatientPermission)('create', 'clinical-assessments');
exports.requireVitalsAccess = (0, exports.requirePatientPermission)('create', 'vitals');
const checkWorkplaceAccess = async (req, res, next) => {
    if (req.isAdmin || req.user?.role === 'super_admin') {
        next();
        return;
    }
    if (process.env.NODE_ENV === 'development') {
        console.log('checkWorkplaceAccess debug:', {
            userId: req.user?._id,
            workplaceId: req.user?.workplaceId,
            currentPlanId: req.user?.currentPlanId,
            role: req.user?.role,
            status: req.user?.status,
            isAdmin: req.isAdmin,
        });
    }
    if (!req.user?.workplaceId && !req.user?.currentPlanId) {
        res.status(403).json({
            message: 'No workplace association found',
            code: 'NO_WORKPLACE_ACCESS',
            requiresAction: 'workplace_setup',
        });
        return;
    }
    if (!req.user?.workplaceId && req.user?.currentPlanId) {
        console.log('Allowing access with plan but no workplace:', req.user?.currentPlanId);
        next();
        return;
    }
    next();
};
exports.checkWorkplaceAccess = checkWorkplaceAccess;
exports.checkPharmacyAccess = exports.checkWorkplaceAccess;
const checkPatientPlanLimits = async (req, res, next) => {
    try {
        if (req.isAdmin || req.user?.role === 'super_admin') {
            next();
            return;
        }
        const subscription = req.subscription;
        if (!subscription || !subscription.planId) {
            res.status(402).json({
                message: 'Active subscription required for Patient Management',
                code: 'SUBSCRIPTION_REQUIRED',
                feature: 'patient_management',
            });
            return;
        }
        if (req.method === 'POST' && req.path === '/') {
            const planFeatures = subscription.planId.features || {};
            const maxPatients = planFeatures.maxPatients || 0;
            if (maxPatients > 0) {
                const Patient = require('../models/Patient').default;
                const currentCount = await Patient.countDocuments({
                    workplaceId: req.user?.workplaceId,
                    isDeleted: false,
                });
                if (currentCount >= maxPatients) {
                    res.status(402).json({
                        message: `Patient limit reached. Your plan allows up to ${maxPatients} patients.`,
                        code: 'PATIENT_LIMIT_REACHED',
                        current: currentCount,
                        limit: maxPatients,
                        upgradeUrl: '/api/subscriptions/plans',
                    });
                    return;
                }
            }
        }
        next();
    }
    catch (error) {
        console.error('Plan limit check error:', error);
        next();
    }
};
exports.checkPatientPlanLimits = checkPatientPlanLimits;
//# sourceMappingURL=patientRBAC.js.map