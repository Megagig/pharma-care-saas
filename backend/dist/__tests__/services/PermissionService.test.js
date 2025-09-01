"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionService_1 = __importDefault(require("../../services/PermissionService"));
const mongoose_1 = __importDefault(require("mongoose"));
jest.mock('../../config/permissionMatrix', () => ({
    PERMISSION_MATRIX: {
        'invitation.create': {
            workplaceRoles: ['Owner'],
            features: ['team_management'],
        },
        'invitation.delete': {
            workplaceRoles: ['Owner'],
            features: ['team_management'],
        },
        'patient.create': {
            workplaceRoles: ['Owner', 'Pharmacist', 'Technician'],
            features: ['patient_management'],
        },
        'patient.delete': {
            workplaceRoles: ['Owner', 'Pharmacist'],
            features: ['patient_management'],
        },
        'subscription.manage': {
            workplaceRoles: ['Owner'],
        },
        'workspace.settings': {
            workplaceRoles: ['Owner'],
            systemRoles: ['super_admin'],
        },
        'admin.access': {
            systemRoles: ['super_admin'],
        },
    },
    ROLE_HIERARCHY: {
        super_admin: ['super_admin', 'pharmacy_outlet', 'pharmacy_team', 'pharmacist', 'intern_pharmacist'],
        pharmacy_outlet: ['pharmacy_outlet', 'pharmacy_team', 'pharmacist'],
        pharmacy_team: ['pharmacy_team', 'pharmacist'],
        pharmacist: ['pharmacist'],
        intern_pharmacist: ['intern_pharmacist'],
    },
    WORKPLACE_ROLE_HIERARCHY: {
        Owner: ['Owner', 'Pharmacist', 'Staff', 'Technician', 'Cashier', 'Assistant'],
        Pharmacist: ['Pharmacist', 'Technician', 'Assistant'],
        Staff: ['Staff', 'Technician', 'Assistant'],
        Technician: ['Technician', 'Assistant'],
        Cashier: ['Cashier', 'Assistant'],
        Assistant: ['Assistant'],
    },
}));
describe('PermissionService', () => {
    let permissionService;
    const mockUser = {
        _id: new mongoose_1.default.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'pharmacist',
        status: 'active',
        workplaceRole: 'Pharmacist'
    };
    const mockWorkspace = {
        _id: new mongoose_1.default.Types.ObjectId(),
        name: 'Test Pharmacy',
        type: 'Community',
        ownerId: new mongoose_1.default.Types.ObjectId(),
        teamMembers: [mockUser._id]
    };
    const mockPlan = {
        _id: new mongoose_1.default.Types.ObjectId(),
        name: 'Pro Plan',
        tier: 'pro',
        features: {
            patientLimit: 500,
            reminderSmsMonthlyLimit: 100,
            reportsExport: true,
            careNoteExport: true,
            adrModule: true,
            multiUserSupport: true,
            teamSize: 5,
            apiAccess: true,
            auditLogs: true,
            dataBackup: true,
            clinicalNotesLimit: null,
            prioritySupport: true,
            emailReminders: true,
            smsReminders: true,
            advancedReports: true,
            drugTherapyManagement: true,
            teamManagement: true,
            dedicatedSupport: false,
            adrReporting: true,
            drugInteractionChecker: true,
            doseCalculator: true,
            multiLocationDashboard: false,
            sharedPatientRecords: false,
            groupAnalytics: false,
            cdss: true
        }
    };
    const mockContext = {
        workspace: mockWorkspace,
        plan: mockPlan,
        subscription: null,
        permissions: ['patient_management', 'team_management', 'advanced_reports'],
        limits: {
            patients: 500,
            users: 5,
            locations: 3,
            storage: 5000,
            apiCalls: 5000
        },
        isSubscriptionActive: true,
        isTrialExpired: false
    };
    beforeEach(() => {
        permissionService = PermissionService_1.default.getInstance();
    });
    describe('checkPermission', () => {
        it('should allow super_admin to access any action', async () => {
            const superAdminUser = { ...mockUser, role: 'super_admin' };
            const result = await permissionService.checkPermission(mockContext, superAdminUser, 'any.action');
            expect(result.allowed).toBe(true);
        });
        it('should deny access for suspended users', async () => {
            const suspendedUser = { ...mockUser, status: 'suspended' };
            const result = await permissionService.checkPermission(mockContext, suspendedUser, 'patient.create');
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('User account is suspended');
        });
        it('should deny access for users with rejected license', async () => {
            const rejectedUser = { ...mockUser, licenseStatus: 'rejected' };
            const result = await permissionService.checkPermission(mockContext, rejectedUser, 'patient.create');
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('License verification rejected');
        });
        it('should allow access when user has required workplace role', async () => {
            const result = await permissionService.checkPermission(mockContext, mockUser, 'patient.create');
            expect(result.allowed).toBe(true);
        });
        it('should deny access when user lacks required workplace role', async () => {
            const technicianUser = { ...mockUser, workplaceRole: 'Technician' };
            const result = await permissionService.checkPermission(mockContext, technicianUser, 'patient.delete');
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Insufficient workplace role');
        });
        it('should deny access when plan lacks required feature', async () => {
            const limitedContext = {
                ...mockContext,
                permissions: ['patient_management']
            };
            const ownerUser = { ...mockUser, workplaceRole: 'Owner' };
            const result = await permissionService.checkPermission(limitedContext, ownerUser, 'invitation.create');
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Required plan features not available');
        });
        it('should allow access when all conditions are met', async () => {
            const ownerUser = { ...mockUser, workplaceRole: 'Owner' };
            const result = await permissionService.checkPermission(mockContext, ownerUser, 'invitation.create');
            expect(result.allowed).toBe(true);
        });
        it('should deny access for unknown actions', async () => {
            const result = await permissionService.checkPermission(mockContext, mockUser, 'unknown.action');
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Permission not defined');
        });
        it('should allow system role access when specified', async () => {
            const superAdminUser = { ...mockUser, role: 'super_admin' };
            const result = await permissionService.checkPermission(mockContext, superAdminUser, 'admin.access');
            expect(result.allowed).toBe(true);
        });
    });
    describe('resolveUserPermissions', () => {
        it('should return all permissions for super_admin', async () => {
            const superAdminUser = { ...mockUser, role: 'super_admin' };
            const permissions = await permissionService.resolveUserPermissions(superAdminUser, mockContext);
            expect(permissions.length).toBeGreaterThan(0);
        });
        it('should return specific permissions based on workplace role and plan features', async () => {
            const ownerUser = { ...mockUser, workplaceRole: 'Owner' };
            const permissions = await permissionService.resolveUserPermissions(ownerUser, mockContext);
            expect(permissions).toContain('invitation.create');
            expect(permissions).toContain('invitation.delete');
            expect(permissions).toContain('patient.create');
            expect(permissions).toContain('patient.delete');
        });
        it('should return limited permissions for technician role', async () => {
            const technicianUser = { ...mockUser, workplaceRole: 'Technician' };
            const permissions = await permissionService.resolveUserPermissions(technicianUser, mockContext);
            expect(permissions).toContain('patient.create');
            expect(permissions).not.toContain('patient.delete');
            expect(permissions).not.toContain('invitation.create');
        });
        it('should exclude permissions for features not in plan', async () => {
            const limitedContext = {
                ...mockContext,
                permissions: ['patient_management']
            };
            const ownerUser = { ...mockUser, workplaceRole: 'Owner' };
            const permissions = await permissionService.resolveUserPermissions(ownerUser, limitedContext);
            expect(permissions).toContain('patient.create');
            expect(permissions).toContain('patient.delete');
            expect(permissions).not.toContain('invitation.create');
            expect(permissions).not.toContain('invitation.delete');
        });
    });
});
//# sourceMappingURL=PermissionService.test.js.map