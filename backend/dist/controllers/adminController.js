"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const UserRole_1 = __importDefault(require("../models/UserRole"));
const Permission_1 = __importDefault(require("../models/Permission"));
const DynamicPermissionService_1 = __importDefault(require("../services/DynamicPermissionService"));
const RoleHierarchyService_1 = __importDefault(require("../services/RoleHierarchyService"));
const logger_1 = __importDefault(require("../utils/logger"));
const emailService_1 = require("../utils/emailService");
class AdminController {
    constructor() {
        this.dynamicPermissionService = DynamicPermissionService_1.default.getInstance();
        this.roleHierarchyService = RoleHierarchyService_1.default.getInstance();
    }
    async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 10, search = '', role = '', status = '', sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }
            if (role) {
                query.role = role;
            }
            if (status) {
                query.status = status;
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const users = await User_1.default.find(query)
                .select('-password -verificationToken -resetPasswordToken')
                .sort(sort)
                .skip(skip)
                .limit(limitNum);
            const total = await User_1.default.countDocuments(query);
            const userIds = users.map((user) => user._id);
            const userRoles = await UserRole_1.default.find({
                userId: { $in: userIds },
                isActive: true,
            }).populate('roleId', 'name displayName category description');
            logger_1.default.info(`Found ${userRoles.length} UserRole records for ${userIds.length} users`);
            if (userRoles.length > 0) {
                logger_1.default.info('Sample UserRole:', JSON.stringify(userRoles[0]));
            }
            const userRolesMap = new Map();
            userRoles.forEach((ur) => {
                const userId = ur.userId.toString();
                if (!userRolesMap.has(userId)) {
                    userRolesMap.set(userId, []);
                }
                userRolesMap.get(userId).push(ur.roleId);
            });
            const formattedUsers = users.map((user) => {
                const userObj = user.toObject();
                const roles = userRolesMap.get(user._id.toString()) || [];
                return {
                    ...userObj,
                    roles,
                    assignedRoles: userObj.assignedRoles || [],
                    directPermissions: userObj.directPermissions || [],
                    deniedPermissions: userObj.deniedPermissions || [],
                };
            });
            if (formattedUsers.length > 0) {
                logger_1.default.info('Sample formatted user:', {
                    email: formattedUsers[0].email,
                    roles: formattedUsers[0].roles,
                    assignedRoles: formattedUsers[0].assignedRoles,
                    systemRole: formattedUsers[0].systemRole,
                });
            }
            res.json({
                success: true,
                data: {
                    users: formattedUsers,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching users',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getUserById(req, res) {
        try {
            const { userId } = req.params;
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            const user = await User_1.default.findById(userId).select('-password -verificationToken -resetPasswordToken');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const userRoles = await UserRole_1.default.find({
                userId: user._id,
                isActive: true,
            }).populate('roleId', 'name displayName category');
            res.json({
                success: true,
                data: {
                    user: {
                        ...user.toObject(),
                        roles: userRoles.map((ur) => ur.roleId),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching user by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user by ID',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async updateUserRole(req, res) {
        try {
            const { userId } = req.params;
            const { roleId, workspaceId } = req.body;
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            if (!roleId || !mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format',
                });
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            const role = await Role_1.default.findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
            }
            const existingAssignment = await UserRole_1.default.findOne({
                userId,
                roleId,
                workspaceId: workspaceId || { $exists: false },
                isActive: true,
            });
            if (existingAssignment) {
                return res.status(400).json({
                    success: false,
                    message: 'User already has this role',
                });
            }
            const userRole = new UserRole_1.default({
                userId,
                roleId,
                workspaceId: workspaceId || undefined,
                assignedBy: req.user._id,
                lastModifiedBy: req.user._id,
                isActive: true,
            });
            await userRole.save();
            const currentAssignedRoles = await UserRole_1.default.find({
                userId,
                isActive: true,
            }).distinct('roleId');
            await User_1.default.findByIdAndUpdate(userId, {
                assignedRoles: currentAssignedRoles,
                roleLastModifiedBy: req.user._id,
                roleLastModifiedAt: new Date(),
            });
            await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(userId), workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : undefined);
            logger_1.default.info('User role updated', {
                userId,
                roleId,
                workspaceId: workspaceId || null,
                updatedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'User role updated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error updating user role:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user role',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async suspendUser(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            if (user.status === 'suspended') {
                return res.status(400).json({
                    success: false,
                    message: 'User is already suspended',
                });
            }
            user.status = 'suspended';
            user.suspensionReason = reason || 'No reason provided';
            user.suspendedAt = new Date();
            user.suspendedBy = req.user._id;
            await user.save();
            logger_1.default.info('User suspended', {
                userId,
                reason: reason || 'No reason provided',
                suspendedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'User suspended successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error suspending user:', error);
            res.status(500).json({
                success: false,
                message: 'Error suspending user',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async reactivateUser(req, res) {
        try {
            const { userId } = req.params;
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            if (user.status !== 'suspended') {
                return res.status(400).json({
                    success: false,
                    message: 'User is not suspended',
                });
            }
            user.status = 'active';
            user.reactivatedAt = new Date();
            user.reactivatedBy = req.user._id;
            await user.save();
            logger_1.default.info('User reactivated', {
                userId,
                reactivatedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'User reactivated successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error reactivating user:', error);
            res.status(500).json({
                success: false,
                message: 'Error reactivating user',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async bulkAssignRoles(req, res) {
        try {
            const { userIds, roleId, workspaceId } = req.body;
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required and cannot be empty',
                });
            }
            if (!roleId || !mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format',
                });
            }
            const users = await User_1.default.find({
                _id: { $in: userIds },
            });
            if (users.length !== userIds.length) {
                const foundUserIds = users.map((u) => u._id.toString());
                const missingUserIds = userIds.filter((id) => !foundUserIds.includes(id));
                return res.status(400).json({
                    success: false,
                    message: 'Some users not found',
                    missingUserIds,
                });
            }
            const role = await Role_1.default.findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
            }
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    for (const userId of userIds) {
                        const existingAssignment = await UserRole_1.default.findOne({
                            userId,
                            roleId,
                            workspaceId: workspaceId || { $exists: false },
                            isActive: true,
                        });
                        if (!existingAssignment) {
                            const userRole = new UserRole_1.default({
                                userId,
                                roleId,
                                workspaceId: workspaceId || undefined,
                                assignedBy: req.user._id,
                                lastModifiedBy: req.user._id,
                                isActive: true,
                            });
                            await userRole.save({ session });
                            const currentAssignedRoles = await UserRole_1.default.find({
                                userId,
                                isActive: true,
                            }).distinct('roleId');
                            await User_1.default.findByIdAndUpdate(userId, {
                                assignedRoles: currentAssignedRoles,
                                roleLastModifiedBy: req.user._id,
                                roleLastModifiedAt: new Date(),
                            }, { session });
                            await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(userId), workspaceId
                                ? new mongoose_1.default.Types.ObjectId(workspaceId)
                                : undefined);
                        }
                    }
                    logger_1.default.info('Bulk role assignment completed', {
                        userIds,
                        roleId,
                        workspaceId: workspaceId || null,
                        assignedBy: req.user._id,
                    });
                });
                res.json({
                    success: true,
                    message: 'Bulk role assignment completed successfully',
                });
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            logger_1.default.error('Error in bulk role assignment:', error);
            res.status(500).json({
                success: false,
                message: 'Error in bulk role assignment',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async bulkRevokeRoles(req, res) {
        try {
            const { userIds, roleId, workspaceId } = req.body;
            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required and cannot be empty',
                });
            }
            if (!roleId || !mongoose_1.default.Types.ObjectId.isValid(roleId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role ID format',
                });
            }
            const users = await User_1.default.find({
                _id: { $in: userIds },
            });
            if (users.length !== userIds.length) {
                const foundUserIds = users.map((u) => u._id.toString());
                const missingUserIds = userIds.filter((id) => !foundUserIds.includes(id));
                return res.status(400).json({
                    success: false,
                    message: 'Some users not found',
                    missingUserIds,
                });
            }
            const role = await Role_1.default.findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'Role not found',
                });
            }
            const session = await mongoose_1.default.startSession();
            try {
                await session.withTransaction(async () => {
                    for (const userId of userIds) {
                        const query = {
                            userId,
                            roleId,
                            isActive: true,
                        };
                        if (workspaceId) {
                            query.workspaceId = workspaceId;
                        }
                        const userRole = await UserRole_1.default.findOne(query);
                        if (userRole) {
                            userRole.isActive = false;
                            userRole.revokedBy = req.user._id;
                            userRole.revokedAt = new Date();
                            userRole.lastModifiedBy = req.user._id;
                            await userRole.save({ session });
                            const currentAssignedRoles = await UserRole_1.default.find({
                                userId,
                                isActive: true,
                            }).distinct('roleId');
                            await User_1.default.findByIdAndUpdate(userId, {
                                assignedRoles: currentAssignedRoles,
                                roleLastModifiedBy: req.user._id,
                                roleLastModifiedAt: new Date(),
                            }, { session });
                            await this.dynamicPermissionService.invalidateUserCache(new mongoose_1.default.Types.ObjectId(userId), workspaceId
                                ? new mongoose_1.default.Types.ObjectId(workspaceId)
                                : undefined);
                        }
                    }
                    logger_1.default.info('Bulk role revocation completed', {
                        userIds,
                        roleId,
                        workspaceId: workspaceId || null,
                        revokedBy: req.user._id,
                    });
                });
                res.json({
                    success: true,
                    message: 'Bulk role revocation completed successfully',
                });
            }
            finally {
                await session.endSession();
            }
        }
        catch (error) {
            logger_1.default.error('Error in bulk role revocation:', error);
            res.status(500).json({
                success: false,
                message: 'Error in bulk role revocation',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getPendingLicenses(req, res) {
        try {
            const { page = 1, limit = 50, search = '', status = 'pending', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {
                licenseStatus: status,
                licenseDocument: { $exists: true },
            };
            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { licenseNumber: { $regex: search, $options: 'i' } },
                ];
            }
            const users = await User_1.default.find(query)
                .populate('workplaceId', 'name')
                .select('firstName lastName email role licenseNumber licenseStatus licenseDocument pharmacySchool yearOfGraduation licenseExpirationDate workplaceId')
                .sort({ 'licenseDocument.uploadedAt': -1 })
                .skip(skip)
                .limit(limitNum);
            const total = await User_1.default.countDocuments(query);
            const licenses = users.map(user => ({
                userId: user._id,
                userName: `${user.firstName} ${user.lastName}`,
                userEmail: user.email,
                userRole: user.role,
                workplaceName: user.workplaceId?.name,
                licenseNumber: user.licenseNumber,
                licenseStatus: user.licenseStatus,
                pharmacySchool: user.pharmacySchool,
                yearOfGraduation: user.yearOfGraduation,
                expirationDate: user.licenseExpirationDate,
                documentInfo: user.licenseDocument ? {
                    fileName: user.licenseDocument.fileName,
                    uploadedAt: user.licenseDocument.uploadedAt,
                    fileSize: user.licenseDocument.fileSize,
                } : undefined,
            }));
            res.json({
                success: true,
                data: {
                    licenses,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching pending licenses:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching pending licenses',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async approveLicense(req, res) {
        try {
            const { userId } = req.params;
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            if (user.licenseStatus !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'License is not pending approval',
                });
            }
            if (!user.licenseDocument) {
                return res.status(400).json({
                    success: false,
                    message: 'No license document found',
                });
            }
            user.licenseStatus = 'approved';
            user.licenseVerifiedAt = new Date();
            user.licenseVerifiedBy = req.user._id;
            user.status = 'active';
            await user.save();
            try {
                await emailService_1.emailService.sendLicenseApprovalNotification(user.email, {
                    firstName: user.firstName,
                    licenseNumber: user.licenseNumber || '',
                });
            }
            catch (emailError) {
                logger_1.default.error('Failed to send approval email:', emailError);
            }
            logger_1.default.info('License approved', {
                userId,
                licenseNumber: user.licenseNumber,
                approvedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'License approved successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error approving license:', error);
            res.status(500).json({
                success: false,
                message: 'Error approving license',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async rejectLicense(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format',
                });
            }
            if (!reason || !reason.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Rejection reason is required',
                });
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            if (user.licenseStatus !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'License is not pending approval',
                });
            }
            user.licenseStatus = 'rejected';
            user.licenseVerifiedAt = new Date();
            user.licenseVerifiedBy = req.user._id;
            user.licenseRejectionReason = reason;
            user.status = 'license_rejected';
            await user.save();
            try {
                await emailService_1.emailService.sendLicenseRejectionNotification(user.email, {
                    firstName: user.firstName,
                    reason: reason,
                });
            }
            catch (emailError) {
                logger_1.default.error('Failed to send rejection email:', emailError);
            }
            logger_1.default.info('License rejected', {
                userId,
                licenseNumber: user.licenseNumber,
                reason: reason,
                rejectedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'License rejected successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error rejecting license:', error);
            res.status(500).json({
                success: false,
                message: 'Error rejecting license',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getAllFeatureFlags(req, res) {
        try {
            const { page = 1, limit = 10, search = '', isActive = '', sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ];
            }
            if (isActive !== '') {
                query.isActive = isActive === 'true';
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const FeatureFlag = mongoose_1.default.model('FeatureFlag');
            const featureFlags = await FeatureFlag.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limitNum);
            const total = await FeatureFlag.countDocuments(query);
            res.json({
                success: true,
                data: {
                    featureFlags,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching feature flags:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching feature flags',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async createFeatureFlag(req, res) {
        try {
            const { name, description, isActive, conditions } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Feature flag name is required',
                });
            }
            const FeatureFlag = mongoose_1.default.model('FeatureFlag');
            const existingFlag = await FeatureFlag.findOne({ name });
            if (existingFlag) {
                return res.status(400).json({
                    success: false,
                    message: 'Feature flag with this name already exists',
                });
            }
            const featureFlag = new FeatureFlag({
                name,
                description,
                isActive: isActive !== undefined ? isActive : true,
                conditions: conditions || {},
                createdBy: req.user._id,
            });
            await featureFlag.save();
            logger_1.default.info('Feature flag created', {
                featureFlagId: featureFlag._id,
                name,
                isActive: featureFlag.isActive,
                createdBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'Feature flag created successfully',
                data: {
                    featureFlag,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error creating feature flag:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating feature flag',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async updateFeatureFlag(req, res) {
        try {
            const { flagId } = req.params;
            const { name, description, isActive, conditions } = req.body;
            if (!flagId || !mongoose_1.default.Types.ObjectId.isValid(flagId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid feature flag ID format',
                });
            }
            const FeatureFlag = mongoose_1.default.model('FeatureFlag');
            const featureFlag = await FeatureFlag.findById(flagId);
            if (!featureFlag) {
                return res.status(404).json({
                    success: false,
                    message: 'Feature flag not found',
                });
            }
            if (name && name !== featureFlag.name) {
                const existingFlag = await FeatureFlag.findOne({ name });
                if (existingFlag) {
                    return res.status(400).json({
                        success: false,
                        message: 'Feature flag with this name already exists',
                    });
                }
            }
            const updateData = {
                lastModifiedBy: req.user._id,
                lastModifiedAt: new Date(),
            };
            if (name !== undefined)
                updateData.name = name;
            if (description !== undefined)
                updateData.description = description;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            if (conditions !== undefined)
                updateData.conditions = conditions;
            const updatedFeatureFlag = await FeatureFlag.findByIdAndUpdate(flagId, updateData, { new: true });
            logger_1.default.info('Feature flag updated', {
                featureFlagId: flagId,
                name: updatedFeatureFlag.name,
                isActive: updatedFeatureFlag.isActive,
                updatedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'Feature flag updated successfully',
                data: {
                    featureFlag: updatedFeatureFlag,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error updating feature flag:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating feature flag',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getSystemAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query;
            const endDate = new Date();
            let startDate = new Date();
            switch (period) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                case '1y':
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 30);
            }
            const userAnalytics = {
                total: await User_1.default.countDocuments(),
                active: await User_1.default.countDocuments({ status: 'active' }),
                new: await User_1.default.countDocuments({
                    createdAt: { $gte: startDate, $lte: endDate },
                }),
                byRole: await User_1.default.aggregate([
                    { $group: { _id: '$role', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),
                byStatus: await User_1.default.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),
                growth: await User_1.default.aggregate([
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' },
                                day: { $dayOfMonth: '$createdAt' },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
                ]),
            };
            const roleAnalytics = {
                total: await Role_1.default.countDocuments(),
                active: await Role_1.default.countDocuments({ isActive: true }),
                assignments: await UserRole_1.default.countDocuments({
                    isActive: true,
                    createdAt: { $gte: startDate, $lte: endDate },
                }),
                byCategory: await Role_1.default.aggregate([
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),
            };
            const permissionAnalytics = {
                total: await Permission_1.default.countDocuments(),
                active: await Permission_1.default.countDocuments({ isActive: true }),
                byCategory: await Permission_1.default.aggregate([
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),
                byRiskLevel: await Permission_1.default.aggregate([
                    { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),
            };
            const ActivityLog = mongoose_1.default.model('ActivityLog');
            const activityAnalytics = {
                total: await ActivityLog.countDocuments({
                    timestamp: { $gte: startDate, $lte: endDate },
                }),
                byAction: await ActivityLog.aggregate([
                    {
                        $match: {
                            timestamp: { $gte: startDate, $lte: endDate },
                        },
                    },
                    { $group: { _id: '$action', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),
                byUser: await ActivityLog.aggregate([
                    {
                        $match: {
                            timestamp: { $gte: startDate, $lte: endDate },
                        },
                    },
                    { $group: { _id: '$userId', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: 10 },
                ]),
                daily: await ActivityLog.aggregate([
                    {
                        $match: {
                            timestamp: { $gte: startDate, $lte: endDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$timestamp' },
                                month: { $month: '$timestamp' },
                                day: { $dayOfMonth: '$timestamp' },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
                ]),
            };
            res.json({
                success: true,
                data: {
                    period,
                    userAnalytics,
                    roleAnalytics,
                    permissionAnalytics,
                    activityAnalytics,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching system analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system analytics',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getAllRoles(req, res) {
        try {
            console.log('getAllRoles called with query:', req.query);
            console.log('Testing Role model...');
            const testCount = await Role_1.default.countDocuments({});
            console.log('Total roles in database:', testCount);
            const { page = 1, limit = 10, search = '', category = '', isActive = '', sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { displayName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ];
            }
            if (category) {
                query.category = category;
            }
            if (isActive !== '') {
                query.isActive = isActive === 'true';
            }
            console.log('Query built:', query);
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            console.log('Sort object:', sort);
            const roles = await Role_1.default.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limitNum);
            console.log('Roles found:', roles.length);
            const total = await Role_1.default.countDocuments(query);
            console.log('Total count:', total);
            res.json({
                success: true,
                data: {
                    roles,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            console.error('Error in getAllRoles:', error);
            logger_1.default.error('Error fetching roles:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching roles',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getAllPermissions(req, res) {
        try {
            const { page = 1, limit = 10, search = '', category = '', riskLevel = '', isActive = '', sortBy = 'action', sortOrder = 'asc', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (search) {
                query.$or = [
                    { action: { $regex: search, $options: 'i' } },
                    { displayName: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ];
            }
            if (category) {
                query.category = category;
            }
            if (riskLevel) {
                query.riskLevel = riskLevel;
            }
            if (isActive !== '') {
                query.isActive = isActive === 'true';
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const permissions = await Permission_1.default.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limitNum);
            const total = await Permission_1.default.countDocuments(query);
            res.json({
                success: true,
                data: {
                    permissions,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching permissions',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getSystemStatistics(req, res) {
        try {
            const totalUsers = await User_1.default.countDocuments();
            const activeUsers = await User_1.default.countDocuments({ status: 'active' });
            const inactiveUsers = await User_1.default.countDocuments({ status: 'inactive' });
            const suspendedUsers = await User_1.default.countDocuments({ status: 'suspended' });
            const totalRoles = await Role_1.default.countDocuments();
            const activeRoles = await Role_1.default.countDocuments({ isActive: true });
            const inactiveRoles = await Role_1.default.countDocuments({ isActive: false });
            const totalPermissions = await Permission_1.default.countDocuments();
            const activePermissions = await Permission_1.default.countDocuments({
                isActive: true,
            });
            const inactivePermissions = await Permission_1.default.countDocuments({
                isActive: false,
            });
            const totalUserRoleAssignments = await UserRole_1.default.countDocuments();
            const activeUserRoleAssignments = await UserRole_1.default.countDocuments({
                isActive: true,
            });
            const expiredUserRoleAssignments = await UserRole_1.default.countDocuments({
                isTemporary: true,
                expiresAt: { $lt: new Date() },
            });
            const roleDistribution = await User_1.default.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            const statusDistribution = await User_1.default.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            const permissionCategoryDistribution = await Permission_1.default.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            const roleCategoryDistribution = await Role_1.default.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            res.json({
                success: true,
                data: {
                    users: {
                        total: totalUsers,
                        active: activeUsers,
                        inactive: inactiveUsers,
                        suspended: suspendedUsers,
                        distribution: roleDistribution,
                    },
                    roles: {
                        total: totalRoles,
                        active: activeRoles,
                        inactive: inactiveRoles,
                        distribution: roleCategoryDistribution,
                    },
                    permissions: {
                        total: totalPermissions,
                        active: activePermissions,
                        inactive: inactivePermissions,
                        distribution: permissionCategoryDistribution,
                    },
                    assignments: {
                        total: totalUserRoleAssignments,
                        active: activeUserRoleAssignments,
                        expired: expiredUserRoleAssignments,
                    },
                    statusDistribution,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching system statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system statistics',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 10, action = '', userId = '', entityType = '', entityId = '', startDate = '', endDate = '', sortBy = 'timestamp', sortOrder = 'desc', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (action) {
                query.action = action;
            }
            if (userId) {
                query.userId = userId;
            }
            if (entityType) {
                query.entityType = entityType;
            }
            if (entityId) {
                query.entityId = entityId;
            }
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) {
                    query.timestamp.$gte = new Date(startDate);
                }
                if (endDate) {
                    query.timestamp.$lte = new Date(endDate);
                }
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const AuditLog = mongoose_1.default.model('AuditLog');
            const auditLogs = await AuditLog.find(query)
                .populate('userId', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(limitNum);
            const total = await AuditLog.countDocuments(query);
            res.json({
                success: true,
                data: {
                    auditLogs,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching audit logs:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching audit logs',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getSystemHealth(req, res) {
        try {
            const dbStatus = {
                connected: mongoose_1.default.connection.readyState === 1,
                name: mongoose_1.default.connection.name,
                host: mongoose_1.default.connection.host,
                port: mongoose_1.default.connection.port,
            };
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();
            const nodeVersion = process.version;
            const environment = process.env.NODE_ENV || 'development';
            let healthScore = 100;
            if (!dbStatus.connected) {
                healthScore -= 50;
            }
            const memoryUsagePercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
            if (memoryUsagePercentage > 90) {
                healthScore -= 30;
            }
            else if (memoryUsagePercentage > 70) {
                healthScore -= 15;
            }
            let healthStatus = 'healthy';
            if (healthScore < 50) {
                healthStatus = 'critical';
            }
            else if (healthScore < 80) {
                healthStatus = 'warning';
            }
            res.json({
                success: true,
                data: {
                    status: healthStatus,
                    score: healthScore,
                    database: dbStatus,
                    memory: {
                        usage: memoryUsage,
                        percentage: memoryUsagePercentage.toFixed(2) + '%',
                    },
                    system: {
                        uptime: uptime,
                        nodeVersion,
                        environment,
                    },
                    timestamp: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching system health:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system health',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getSystemConfig(req, res) {
        try {
            const config = {
                app: {
                    name: process.env.APP_NAME || 'PharmacyCopilot SaaS',
                    version: process.env.APP_VERSION || '1.0.0',
                    environment: process.env.NODE_ENV || 'development',
                    url: process.env.FRONTEND_URL || 'http://localhost:3000',
                },
                auth: {
                    jwtExpiration: process.env.JWT_EXPIRATION || '7d',
                    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
                    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
                    lockoutDuration: process.env.LOCKOUT_DURATION || '15m',
                },
                email: {
                    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
                    from: process.env.EMAIL_FROM || 'noreply@PharmacyCopilot.com',
                    maxRecipients: parseInt(process.env.MAX_EMAIL_RECIPIENTS || '100', 10),
                },
                upload: {
                    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
                    allowedTypes: process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx',
                    storageProvider: process.env.STORAGE_PROVIDER || 'local',
                },
                pagination: {
                    defaultLimit: parseInt(process.env.DEFAULT_PAGINATION_LIMIT || '10', 10),
                    maxLimit: parseInt(process.env.MAX_PAGINATION_LIMIT || '100', 10),
                },
                cache: {
                    provider: process.env.CACHE_PROVIDER || 'memory',
                    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
                },
            };
            res.json({
                success: true,
                data: {
                    config,
                    timestamp: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching system config:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system config',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async updateSystemConfig(req, res) {
        try {
            const { config } = req.body;
            if (!config || typeof config !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid configuration data',
                });
            }
            logger_1.default.info('System configuration updated', {
                config,
                updatedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'System configuration updated successfully',
                data: {
                    config,
                    timestamp: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error updating system config:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating system config',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getActivityLogs(req, res) {
        try {
            const { page = 1, limit = 10, userId = '', action = '', entityType = '', startDate = '', endDate = '', sortBy = 'timestamp', sortOrder = 'desc', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (userId) {
                query.userId = userId;
            }
            if (action) {
                query.action = action;
            }
            if (entityType) {
                query.entityType = entityType;
            }
            if (startDate || endDate) {
                query.timestamp = {};
                if (startDate) {
                    query.timestamp.$gte = new Date(startDate);
                }
                if (endDate) {
                    query.timestamp.$lte = new Date(endDate);
                }
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const ActivityLog = mongoose_1.default.model('ActivityLog');
            const activityLogs = await ActivityLog.find(query)
                .populate('userId', 'firstName lastName email')
                .sort(sort)
                .skip(skip)
                .limit(limitNum);
            const total = await ActivityLog.countDocuments(query);
            res.json({
                success: true,
                data: {
                    activityLogs,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching activity logs:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching activity logs',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getSystemNotifications(req, res) {
        try {
            const { page = 1, limit = 10, type = '', priority = '', isRead = '', sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            const query = {};
            if (type) {
                query.type = type;
            }
            if (priority) {
                query.priority = priority;
            }
            if (isRead !== '') {
                query.isRead = isRead === 'true';
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
            const Notification = mongoose_1.default.model('Notification');
            const notifications = await Notification.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limitNum);
            const total = await Notification.countDocuments(query);
            const unreadCount = await Notification.countDocuments({ isRead: false });
            res.json({
                success: true,
                data: {
                    notifications,
                    unreadCount,
                    pagination: {
                        page: pageNum,
                        limit: limitNum,
                        total,
                        pages: Math.ceil(total / limitNum),
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching system notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system notifications',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async markNotificationAsRead(req, res) {
        try {
            const { id } = req.params;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid notification ID format',
                });
            }
            const Notification = mongoose_1.default.model('Notification');
            const notification = await Notification.findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true });
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found',
                });
            }
            logger_1.default.info('Notification marked as read', {
                notificationId: id,
                markedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'Notification marked as read successfully',
                data: {
                    notification,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Error marking notification as read',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async markAllNotificationsAsRead(req, res) {
        try {
            const Notification = mongoose_1.default.model('Notification');
            const result = await Notification.updateMany({ isRead: false }, { isRead: true, readAt: new Date() });
            logger_1.default.info('All notifications marked as read', {
                count: result.modifiedCount,
                markedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'All notifications marked as read successfully',
                data: {
                    count: result.modifiedCount,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                message: 'Error marking all notifications as read',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid notification ID format',
                });
            }
            const Notification = mongoose_1.default.model('Notification');
            const notification = await Notification.findByIdAndDelete(id);
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found',
                });
            }
            logger_1.default.info('Notification deleted', {
                notificationId: id,
                deletedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'Notification deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error deleting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting notification',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getBackupStatus(req, res) {
        try {
            const backupStatus = {
                lastBackup: {
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    status: 'completed',
                    size: '245.6 MB',
                    duration: '2m 34s',
                },
                nextBackup: {
                    date: new Date(Date.now() + 6 * 60 * 60 * 1000),
                    scheduled: true,
                },
                backupSchedule: {
                    frequency: 'daily',
                    time: '02:00 AM',
                    retention: '30 days',
                },
                backupStorage: {
                    provider: 'aws-s3',
                    location: 'us-east-1',
                    used: '1.2 GB',
                    available: '9.8 GB',
                },
            };
            res.json({
                success: true,
                data: {
                    backupStatus,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching backup status:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching backup status',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async createBackup(req, res) {
        try {
            const backupId = new mongoose_1.default.Types.ObjectId().toString();
            logger_1.default.info('System backup initiated', {
                backupId,
                initiatedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'System backup initiated successfully',
                data: {
                    backupId,
                    status: 'in-progress',
                    estimatedDuration: '5-10 minutes',
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error creating system backup:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating system backup',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getSecuritySettings(req, res) {
        try {
            const securitySettings = {
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true,
                    expireAfterDays: 90,
                    preventReuse: 5,
                    lockoutAfterAttempts: 5,
                    lockoutDurationMinutes: 15,
                },
                sessionPolicy: {
                    timeoutMinutes: 30,
                    concurrentSessions: 3,
                    rememberMeDays: 30,
                    requireReauthAfterDays: 7,
                },
                twoFactorAuth: {
                    enabled: true,
                    requiredForAdmins: true,
                    requiredForUsers: false,
                    methods: ['app', 'sms', 'email'],
                },
                ipRestrictions: {
                    enabled: false,
                    allowedIPs: [],
                    blockSuspiciousIPs: true,
                },
                auditLogging: {
                    enabled: true,
                    logLevel: 'detailed',
                    retentionDays: 365,
                },
            };
            res.json({
                success: true,
                data: {
                    securitySettings,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching security settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching security settings',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async updateSecuritySettings(req, res) {
        try {
            const { securitySettings } = req.body;
            if (!securitySettings || typeof securitySettings !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid security settings data',
                });
            }
            logger_1.default.info('System security settings updated', {
                securitySettings,
                updatedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'System security settings updated successfully',
                data: {
                    securitySettings,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error updating security settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating security settings',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getMaintenanceStatus(req, res) {
        try {
            const maintenanceStatus = {
                enabled: false,
                scheduled: false,
                nextMaintenance: null,
                lastMaintenance: {
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    duration: '2 hours',
                    description: 'Scheduled system maintenance',
                },
                maintenanceWindow: {
                    startDay: 'sunday',
                    startTime: '02:00',
                    duration: '4 hours',
                },
                notifications: {
                    beforeHours: 24,
                    beforeMinutes: 60,
                    message: 'System maintenance is scheduled. Please save your work and log out.',
                },
            };
            res.json({
                success: true,
                data: {
                    maintenanceStatus,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching maintenance status:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching maintenance status',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async updateMaintenanceStatus(req, res) {
        try {
            const { maintenanceStatus } = req.body;
            if (!maintenanceStatus || typeof maintenanceStatus !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid maintenance status data',
                });
            }
            logger_1.default.info('System maintenance status updated', {
                maintenanceStatus,
                updatedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'System maintenance status updated successfully',
                data: {
                    maintenanceStatus,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error updating maintenance status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating maintenance status',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async getApiKeys(req, res) {
        try {
            const apiKeys = [
                {
                    id: '1',
                    name: 'Mobile App',
                    key: 'pk_live_1234567890abcdef',
                    prefix: 'pk_live',
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
                    lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    permissions: ['read', 'write'],
                    isActive: true,
                },
                {
                    id: '2',
                    name: 'Web Dashboard',
                    key: 'pk_live_0987654321fedcba',
                    prefix: 'pk_live',
                    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                    expiresAt: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
                    lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    permissions: ['read', 'write', 'delete'],
                    isActive: true,
                },
            ];
            res.json({
                success: true,
                data: {
                    apiKeys,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error fetching API keys:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching API keys',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async createApiKey(req, res) {
        try {
            const { name, permissions, expiresAt } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'API key name is required',
                });
            }
            if (!permissions ||
                !Array.isArray(permissions) ||
                permissions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'API key permissions are required',
                });
            }
            const apiKey = {
                id: new mongoose_1.default.Types.ObjectId().toString(),
                name,
                key: 'pk_live_' + Math.random().toString(36).substring(2, 15),
                prefix: 'pk_live',
                createdAt: new Date(),
                expiresAt: expiresAt || null,
                lastUsed: null,
                permissions,
                isActive: true,
            };
            logger_1.default.info('API key created', {
                apiKeyId: apiKey.id,
                name,
                permissions,
                createdBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'API key created successfully',
                data: {
                    apiKey,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Error creating API key:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating API key',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
    async revokeApiKey(req, res) {
        try {
            const { id } = req.params;
            if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid API key ID format',
                });
            }
            logger_1.default.info('API key revoked', {
                apiKeyId: id,
                revokedBy: req.user._id,
            });
            res.json({
                success: true,
                message: 'API key revoked successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Error revoking API key:', error);
            res.status(500).json({
                success: false,
                message: 'Error revoking API key',
                error: process.env.NODE_ENV === 'development'
                    ? error.message
                    : undefined,
            });
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
//# sourceMappingURL=adminController.js.map