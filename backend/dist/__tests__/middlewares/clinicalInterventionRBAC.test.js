"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const clinicalInterventionRBAC_1 = require("../../middlewares/clinicalInterventionRBAC");
const ClinicalIntervention_1 = __importDefault(require("../../models/ClinicalIntervention"));
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
jest.mock('../../middlewares/rbac', () => ({
    requirePermission: jest.fn((permission) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            if (!req.workspaceContext) {
                return res.status(500).json({ success: false, message: 'Workspace context not loaded' });
            }
            if (req.user.role === 'super_admin') {
                return next();
            }
            const userRole = req.user.workplaceRole;
            const hasFeature = req.workspaceContext.permissions.includes('clinicalInterventions');
            if (!hasFeature) {
                return res.status(402).json({
                    success: false,
                    message: 'Clinical interventions feature not available',
                    upgradeRequired: true,
                });
            }
            switch (permission) {
                case 'clinical_intervention.create':
                case 'clinical_intervention.update':
                case 'clinical_intervention.delete':
                case 'clinical_intervention.assign':
                    if (!['Owner', 'Pharmacist'].includes(userRole || '')) {
                        return res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                            requiredRoles: ['Owner', 'Pharmacist'],
                        });
                    }
                    break;
                case 'clinical_intervention.read':
                    if (!['Owner', 'Pharmacist', 'Technician'].includes(userRole || '')) {
                        return res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                            requiredRoles: ['Owner', 'Pharmacist', 'Technician'],
                        });
                    }
                    break;
                case 'clinical_intervention.reports':
                case 'clinical_intervention.export':
                    if (!['Owner', 'Pharmacist'].includes(userRole || '')) {
                        return res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                            requiredRoles: ['Owner', 'Pharmacist'],
                        });
                    }
                    const hasAdvancedReports = req.workspaceContext.permissions.includes('advancedReports');
                    if (!hasAdvancedReports) {
                        return res.status(402).json({
                            success: false,
                            message: 'Advanced reporting not available',
                            upgradeRequired: true,
                        });
                    }
                    break;
            }
            next();
        };
    }),
}));
describe('Clinical Intervention RBAC Middleware', () => {
    let mongoServer;
    let testWorkplace;
    let testUser;
    let testIntervention;
    let req;
    let res;
    let next;
    beforeAll(async () => {
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.connection.close();
        }
        await mongoose_1.default.connect(mongoUri);
    });
    afterAll(async () => {
        await mongoose_1.default.connection.dropDatabase();
        await mongoose_1.default.connection.close();
        await mongoServer.stop();
    });
    beforeEach(async () => {
        await User_1.default.deleteMany({});
        await Workplace_1.default.deleteMany({});
        await ClinicalIntervention_1.default.deleteMany({});
        testWorkplace = await Workplace_1.default.create({
            name: 'Test Pharmacy',
            address: 'Test Address',
            phone: '1234567890',
            email: 'test@pharmacy.com',
            licenseNumber: 'TEST123',
            subscriptionStatus: 'active',
        });
        testUser = await User_1.default.create({
            firstName: 'Test',
            lastName: 'Pharmacist',
            email: 'test@pharmacist.com',
            passwordHash: 'hashedpassword',
            role: 'pharmacist',
            workplaceId: testWorkplace._id,
            workplaceRole: 'Pharmacist',
            status: 'active',
            licenseStatus: 'approved',
        });
        testIntervention = await ClinicalIntervention_1.default.create({
            workplaceId: testWorkplace._id,
            patientId: new mongoose_1.default.Types.ObjectId(),
            interventionNumber: 'CI-202401-0001',
            category: 'drug_therapy_problem',
            priority: 'high',
            issueDescription: 'Test intervention description',
            identifiedDate: new Date(),
            identifiedBy: testUser._id,
            status: 'identified',
            strategies: [],
            assignments: [],
            outcomes: {
                patientResponse: 'unknown',
                clinicalParameters: [],
                successMetrics: {
                    problemResolved: false,
                    medicationOptimized: false,
                    adherenceImproved: false,
                },
            },
            followUp: {
                required: false,
            },
            createdBy: testUser._id,
        });
        req = {
            user: testUser,
            workspaceContext: {
                workspace: testWorkplace,
                subscription: null,
                plan: null,
                permissions: ['clinicalInterventions', 'advancedReports'],
                limits: {
                    patients: null,
                    users: null,
                    locations: null,
                    storage: null,
                    apiCalls: null,
                    interventions: 100
                },
                isTrialExpired: false,
                isSubscriptionActive: true,
            },
            params: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });
    describe('Basic Permission Middleware', () => {
        it('should allow pharmacist to create interventions', async () => {
            await (0, clinicalInterventionRBAC_1.requireInterventionCreate)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should allow technician to read interventions', async () => {
            req.user.workplaceRole = 'Technician';
            await (0, clinicalInterventionRBAC_1.requireInterventionRead)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should deny assistant from creating interventions', async () => {
            req.user.workplaceRole = 'Assistant';
            await (0, clinicalInterventionRBAC_1.requireInterventionCreate)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });
        it('should deny access without clinical interventions feature', async () => {
            req.workspaceContext.permissions = [];
            await (0, clinicalInterventionRBAC_1.requireInterventionCreate)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(402);
        });
        it('should allow super admin to bypass all checks', async () => {
            req.user.role = 'super_admin';
            req.workspaceContext.permissions = [];
            await (0, clinicalInterventionRBAC_1.requireInterventionCreate)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
    describe('checkInterventionAccess', () => {
        it('should allow access to intervention from same workplace', async () => {
            req.params.id = testIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should deny access to intervention from different workplace', async () => {
            const otherWorkplace = await Workplace_1.default.create({
                name: 'Other Pharmacy',
                address: 'Other Address',
                phone: '0987654321',
                email: 'other@pharmacy.com',
                licenseNumber: 'OTHER123',
                subscriptionStatus: 'active',
            });
            const otherIntervention = await ClinicalIntervention_1.default.create({
                workplaceId: otherWorkplace._id,
                patientId: new mongoose_1.default.Types.ObjectId(),
                interventionNumber: 'CI-202401-0002',
                category: 'drug_therapy_problem',
                priority: 'medium',
                issueDescription: 'Other intervention description',
                identifiedDate: new Date(),
                identifiedBy: testUser._id,
                status: 'identified',
                strategies: [],
                assignments: [],
                outcomes: {
                    patientResponse: 'unknown',
                    clinicalParameters: [],
                    successMetrics: {
                        problemResolved: false,
                        medicationOptimized: false,
                        adherenceImproved: false,
                    },
                },
                followUp: {
                    required: false,
                },
                createdBy: testUser._id,
            });
            req.params.id = otherIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });
        it('should return 404 for non-existent intervention', async () => {
            req.params.id = new mongoose_1.default.Types.ObjectId().toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('should allow super admin to access any intervention', async () => {
            req.user.role = 'super_admin';
            req.params.id = testIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
    describe('checkInterventionModifyAccess', () => {
        it('should allow pharmacist to modify any intervention in their workplace', async () => {
            req.params.id = testIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionModifyAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should allow owner to modify any intervention in their workplace', async () => {
            req.user.workplaceRole = 'Owner';
            req.params.id = testIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionModifyAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should allow technician to modify only their own interventions', async () => {
            req.user.workplaceRole = 'Technician';
            req.params.id = testIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionModifyAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it('should deny technician from modifying others interventions', async () => {
            const otherUser = await User_1.default.create({
                firstName: 'Other',
                lastName: 'User',
                email: 'other@user.com',
                passwordHash: 'hashedpassword',
                role: 'pharmacist',
                workplaceId: testWorkplace._id,
                workplaceRole: 'Pharmacist',
                status: 'active',
            });
            const otherIntervention = await ClinicalIntervention_1.default.create({
                workplaceId: testWorkplace._id,
                patientId: new mongoose_1.default.Types.ObjectId(),
                interventionNumber: 'CI-202401-0003',
                category: 'adverse_drug_reaction',
                priority: 'low',
                issueDescription: 'Other user intervention',
                identifiedDate: new Date(),
                identifiedBy: otherUser._id,
                status: 'identified',
                strategies: [],
                assignments: [],
                outcomes: {
                    patientResponse: 'unknown',
                    clinicalParameters: [],
                    successMetrics: {
                        problemResolved: false,
                        medicationOptimized: false,
                        adherenceImproved: false,
                    },
                },
                followUp: {
                    required: false,
                },
                createdBy: otherUser._id,
            });
            req.user.workplaceRole = 'Technician';
            req.params.id = otherIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionModifyAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
    describe('checkInterventionAssignAccess', () => {
        it('should allow pharmacist with team management to assign team members', async () => {
            req.workspaceContext.permissions.push('teamManagement');
            await (0, clinicalInterventionRBAC_1.checkInterventionAssignAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should deny assignment without team management feature', async () => {
            req.workspaceContext.permissions = ['clinicalInterventions'];
            await (0, clinicalInterventionRBAC_1.checkInterventionAssignAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(402);
        });
        it('should deny technician from assigning team members', async () => {
            req.user.workplaceRole = 'Technician';
            req.workspaceContext.permissions.push('teamManagement');
            await (0, clinicalInterventionRBAC_1.checkInterventionAssignAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
    describe('checkInterventionReportAccess', () => {
        it('should allow pharmacist with advanced reports to access reports', async () => {
            await (0, clinicalInterventionRBAC_1.checkInterventionReportAccess)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should deny access without advanced reports feature', async () => {
            req.workspaceContext.permissions = ['clinicalInterventions'];
            await (0, clinicalInterventionRBAC_1.checkInterventionReportAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(402);
        });
        it('should deny access with insufficient plan tier', async () => {
            req.workspaceContext.plan = { tier: 'basic' };
            await (0, clinicalInterventionRBAC_1.checkInterventionReportAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(402);
        });
        it('should deny technician from accessing reports', async () => {
            req.user.workplaceRole = 'Technician';
            await (0, clinicalInterventionRBAC_1.checkInterventionReportAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
    describe('checkInterventionPlanLimits', () => {
        it('should allow creation within plan limits', async () => {
            await (0, clinicalInterventionRBAC_1.checkInterventionPlanLimits)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should allow creation with no limits set', async () => {
            req.workspaceContext.limits.interventions = null;
            await (0, clinicalInterventionRBAC_1.checkInterventionPlanLimits)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
        it('should deny creation when limit exceeded', async () => {
            req.workspaceContext.limits.interventions = 1;
            await (0, clinicalInterventionRBAC_1.checkInterventionPlanLimits)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(429);
        });
        it('should allow super admin to bypass limits', async () => {
            req.user.role = 'super_admin';
            req.workspaceContext.limits.interventions = 0;
            await (0, clinicalInterventionRBAC_1.checkInterventionPlanLimits)(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            const originalFindById = ClinicalIntervention_1.default.findById;
            ClinicalIntervention_1.default.findById = jest.fn().mockRejectedValue(new Error('Database error'));
            req.params.id = testIntervention._id.toString();
            await (0, clinicalInterventionRBAC_1.checkInterventionAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            ClinicalIntervention_1.default.findById = originalFindById;
        });
        it('should handle missing authentication', async () => {
            req.user = undefined;
            await (0, clinicalInterventionRBAC_1.checkInterventionAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
        });
        it('should handle missing workspace context', async () => {
            req.workspaceContext = undefined;
            await (0, clinicalInterventionRBAC_1.checkInterventionAssignAccess)(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
//# sourceMappingURL=clinicalInterventionRBAC.test.js.map