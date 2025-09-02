"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rbac_1 = __importDefault(require("../../middlewares/rbac"));
const PermissionService_1 = __importDefault(require("../../services/PermissionService"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
jest.mock('../../services/PermissionService');
jest.mock('../../models/Workplace');
jest.mock('../../models/SubscriptionPlan');
const mockPermissionService = PermissionService_1.default;
const mockWorkplace = Workplace_1.default;
const mockSubscriptionPlan = SubscriptionPlan_1.default;
describe('rbacMiddleware', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let mockPermissionServiceInstance;
    const mockUser = {
        _id: testUtils.createObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'pharmacist',
        workplaceRole: 'Pharmacist',
        status: 'active',
        workplaceId: testUtils.createObjectId()
    };
    const mockWorkspaceData = {
        _id: testUtils.createObjectId(),
        name: 'Test Pharmacy',
        subscriptionId: testUtils.createObjectId()
    };
    const mockPlanData = {
        _id: testUtils.createObjectId(),
        name: 'Premium Plan',
        features: ['patient_management', 'team_management']
    };
    beforeEach(() => {
        mockRequest = {
            user: mockUser,
            workspace: mockWorkspaceData,
            params: {},
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
        mockPermissionServiceInstance = {
            checkPermission: jest.fn(),
            resolveUserPermissions: jest.fn(),
            hasFeatureAccess: jest.fn(),
            getPermissionMatrix: jest.fn(),
            validatePermissionMatrix: jest.fn()
        };
        mockPermissionService.mockImplementation(() => mockPermissionServiceInstance);
        jest.clearAllMocks();
        mockWorkplace.findById.mockResolvedValue(mockWorkspaceData);
        mockSubscriptionPlan.findById.mockResolvedValue(mockPlanData);
    });
    describe('requirePermission', () => {
        it('should allow access when user has required permission', async () => {
            const middleware = rbac_1.default.requirePermission('patient.create');
            mockPermissionServiceInstance.checkPermission.mockResolvedValue({
                allowed: true,
                reason: 'workplace_role_match'
            });
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockPermissionServiceInstance.checkPermission).toHaveBeenCalledWith(mockUser, mockWorkspaceData, mockPlanData, 'patient.create');
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should deny access when user lacks required permission', async () => {
            const middleware = rbac_1.default.requirePermission('patient.delete');
            mockPermissionServiceInstance.checkPermission.mockResolvedValue({
                allowed: false,
                reason: 'insufficient_workplace_role'
            });
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                required: 'patient.delete',
                reason: 'insufficient_workplace_role'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should handle missing user', async () => {
            const middleware = rbac_1.default.requirePermission('patient.create');
            mockRequest.user = undefined;
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'User not authenticated'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should handle missing workspace', async () => {
            const middleware = rbac_1.default.requirePermission('patient.create');
            mockRequest.workspace = undefined;
            mockWorkplace.findById.mockResolvedValue(null);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Workspace not found'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should handle missing subscription plan', async () => {
            const middleware = rbac_1.default.requirePermission('patient.create');
            mockSubscriptionPlan.findById.mockResolvedValue(null);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Subscription plan not found'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('requireRole', () => {
        it('should allow access when user has required workplace role', async () => {
            const middleware = rbac_1.default.requireRole('Pharmacist');
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should allow access when user has higher role', async () => {
            const middleware = rbac_1.default.requireRole('Technician');
            mockRequest.user.workplaceRole = 'Owner';
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should deny access when user has insufficient role', async () => {
            const middleware = rbac_1.default.requireRole('Owner');
            mockRequest.user.workplaceRole = 'Technician';
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient role',
                required: 'Owner',
                current: 'Technician'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should allow super_admin to bypass role checks', async () => {
            const middleware = rbac_1.default.requireRole('Owner');
            mockRequest.user.role = 'super_admin';
            mockRequest.user.workplaceRole = 'Technician';
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
    describe('requireFeature', () => {
        it('should allow access when plan includes required feature', async () => {
            const middleware = rbac_1.default.requireFeature('patient_management');
            mockPermissionServiceInstance.hasFeatureAccess.mockResolvedValue(true);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockPermissionServiceInstance.hasFeatureAccess).toHaveBeenCalledWith(mockPlanData, 'patient_management');
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should deny access when plan lacks required feature', async () => {
            const middleware = rbac_1.default.requireFeature('advanced_reports');
            mockPermissionServiceInstance.hasFeatureAccess.mockResolvedValue(false);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(402);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Feature not available in current plan',
                feature: 'advanced_reports',
                upgradeRequired: true
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('requireOwnership', () => {
        it('should allow access when user is workspace owner', async () => {
            const middleware = rbac_1.default.requireOwnership();
            mockRequest.user.workplaceRole = 'Owner';
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should allow access when user is resource owner', async () => {
            const middleware = rbac_1.default.requireOwnership('userId');
            mockRequest.params = { userId: mockUser._id.toString() };
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should deny access when user is not owner', async () => {
            const middleware = rbac_1.default.requireOwnership('userId');
            mockRequest.params = { userId: testUtils.createObjectId().toString() };
            mockRequest.user.workplaceRole = 'Pharmacist';
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Access denied - ownership required'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should allow super_admin to bypass ownership checks', async () => {
            const middleware = rbac_1.default.requireOwnership('userId');
            mockRequest.params = { userId: testUtils.createObjectId().toString() };
            mockRequest.user.role = 'super_admin';
            mockRequest.user.workplaceRole = 'Pharmacist';
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
    describe('attachUserPermissions', () => {
        it('should attach user permissions to request', async () => {
            const middleware = rbac_1.default.attachUserPermissions();
            const mockPermissions = ['patient.create', 'patient.read', 'patient.update'];
            mockPermissionServiceInstance.resolveUserPermissions.mockResolvedValue(mockPermissions);
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockRequest.userPermissions).toEqual(mockPermissions);
            expect(mockPermissionServiceInstance.resolveUserPermissions).toHaveBeenCalledWith(mockUser, mockWorkspaceData, mockPlanData);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should handle permission resolution errors', async () => {
            const middleware = rbac_1.default.attachUserPermissions();
            mockPermissionServiceInstance.resolveUserPermissions.mockRejectedValue(new Error('Permission resolution failed'));
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to resolve user permissions'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('checkMultiplePermissions', () => {
        it('should allow access when user has all required permissions', async () => {
            const middleware = rbac_1.default.checkMultiplePermissions(['patient.create', 'patient.read']);
            mockPermissionServiceInstance.checkPermission
                .mockResolvedValueOnce({ allowed: true, reason: 'workplace_role_match' })
                .mockResolvedValueOnce({ allowed: true, reason: 'workplace_role_match' });
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockPermissionServiceInstance.checkPermission).toHaveBeenCalledTimes(2);
            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should deny access when user lacks any required permission', async () => {
            const middleware = rbac_1.default.checkMultiplePermissions(['patient.create', 'patient.delete']);
            mockPermissionServiceInstance.checkPermission
                .mockResolvedValueOnce({ allowed: true, reason: 'workplace_role_match' })
                .mockResolvedValueOnce({ allowed: false, reason: 'insufficient_workplace_role' });
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Insufficient permissions',
                required: ['patient.create', 'patient.delete'],
                missing: ['patient.delete']
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('error handling', () => {
        it('should handle permission service errors', async () => {
            const middleware = rbac_1.default.requirePermission('patient.create');
            mockPermissionServiceInstance.checkPermission.mockRejectedValue(new Error('Permission service error'));
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to check permissions'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should handle database errors when fetching workspace', async () => {
            const middleware = rbac_1.default.requirePermission('patient.create');
            mockRequest.workspace = undefined;
            mockWorkplace.findById.mockRejectedValue(new Error('Database error'));
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Failed to check permissions'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('role hierarchy', () => {
        const roleHierarchy = ['Technician', 'Pharmacist', 'Owner'];
        it('should correctly determine role hierarchy', () => {
            expect(rbac_1.default.hasRequiredRole('Owner', 'Technician', roleHierarchy)).toBe(true);
            expect(rbac_1.default.hasRequiredRole('Pharmacist', 'Technician', roleHierarchy)).toBe(true);
            expect(rbac_1.default.hasRequiredRole('Technician', 'Owner', roleHierarchy)).toBe(false);
            expect(rbac_1.default.hasRequiredRole('Pharmacist', 'Owner', roleHierarchy)).toBe(false);
        });
        it('should handle equal roles', () => {
            expect(rbac_1.default.hasRequiredRole('Pharmacist', 'Pharmacist', roleHierarchy)).toBe(true);
        });
        it('should handle unknown roles', () => {
            expect(rbac_1.default.hasRequiredRole('UnknownRole', 'Pharmacist', roleHierarchy)).toBe(false);
            expect(rbac_1.default.hasRequiredRole('Pharmacist', 'UnknownRole', roleHierarchy)).toBe(false);
        });
    });
});
//# sourceMappingURL=rbac.test.js.map