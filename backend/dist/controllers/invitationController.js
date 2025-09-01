"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInvitationLimits = exports.getInvitationStats = exports.getInvitationAnalytics = exports.validateInvitation = exports.acceptInvitation = exports.cancelInvitation = exports.getWorkspaceInvitations = exports.createInvitation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Invitation_1 = __importDefault(require("../models/Invitation"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
const User_1 = __importDefault(require("../models/User"));
const emailService_1 = require("../utils/emailService");
const InvitationCronService_1 = require("../services/InvitationCronService");
const auditLogging_1 = require("../middlewares/auditLogging");
const createInvitation = async (req, res) => {
    try {
        const { id: workspaceId } = req.params;
        const { email, role, customMessage } = req.body;
        const inviterId = req.user._id;
        if (!workspaceId || !mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid workspace ID',
            });
            return;
        }
        if (!email || !role) {
            res.status(400).json({
                success: false,
                message: 'Email and role are required',
            });
            return;
        }
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
            return;
        }
        const validRoles = ['Owner', 'Pharmacist', 'Technician', 'Intern'];
        if (!validRoles.includes(role)) {
            res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: ' + validRoles.join(', '),
            });
            return;
        }
        const workspace = await Workplace_1.default.findById(workspaceId);
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found',
            });
            return;
        }
        if (workspace.ownerId.toString() !== inviterId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Only workspace owners can send invitations',
            });
            return;
        }
        const inviter = await User_1.default.findById(inviterId);
        if (inviter?.email.toLowerCase() === email.toLowerCase()) {
            res.status(400).json({
                success: false,
                message: 'You cannot invite yourself',
            });
            return;
        }
        const existingUser = await User_1.default.findOne({
            email: email.toLowerCase(),
            workplaceId: workspaceId
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User is already a member of this workspace',
            });
            return;
        }
        const pendingCount = await Invitation_1.default.countDocuments({
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            status: 'active'
        });
        const maxPendingInvites = workspace.settings?.maxPendingInvites || 20;
        if (pendingCount >= maxPendingInvites) {
            res.status(409).json({
                success: false,
                message: `Maximum pending invitations limit reached (${maxPendingInvites}). Please wait for existing invitations to be accepted or expired.`,
                upgradeRequired: true,
                upgradeTo: 'Contact support to increase invitation limits',
            });
            return;
        }
        const existingInvitation = await Invitation_1.default.findOne({
            email: email.toLowerCase(),
            workspaceId: workspaceId,
            status: 'active',
        });
        if (existingInvitation) {
            res.status(409).json({
                success: false,
                message: 'An active invitation already exists for this email',
                data: {
                    invitationId: existingInvitation._id,
                    expiresAt: existingInvitation.expiresAt,
                },
            });
            return;
        }
        const invitation = new Invitation_1.default({
            email: email.toLowerCase(),
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            invitedBy: new mongoose_1.default.Types.ObjectId(inviterId),
            role,
            metadata: {
                inviterName: inviter?.firstName + ' ' + inviter?.lastName || 'Unknown',
                workspaceName: workspace.name,
                customMessage: customMessage?.trim() || undefined,
            },
        });
        await invitation.save();
        await auditLogging_1.auditOperations.invitationCreated(req, invitation);
        emailService_1.emailService.sendInvitationEmail(invitation).catch((error) => {
            console.error('Failed to send invitation email:', error);
        });
        res.status(201).json({
            success: true,
            message: 'Invitation created and sent successfully',
            data: {
                invitationId: invitation._id,
                email: invitation.email,
                role: invitation.role,
                code: invitation.code,
                expiresAt: invitation.expiresAt,
                status: invitation.status,
            },
        });
    }
    catch (error) {
        console.error('Error creating invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.createInvitation = createInvitation;
const getWorkspaceInvitations = async (req, res) => {
    try {
        const { id: workspaceId } = req.params;
        const { status, page = '1', limit = '10' } = req.query;
        const userId = req.user._id;
        if (!workspaceId || !mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid workspace ID',
            });
            return;
        }
        const workspace = await Workplace_1.default.findById(workspaceId);
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found',
            });
            return;
        }
        if (workspace.ownerId.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Only workspace owners can view invitations',
            });
            return;
        }
        const query = { workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId) };
        if (status && ['active', 'expired', 'used', 'canceled'].includes(status)) {
            query.status = status;
        }
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;
        const [invitations, total] = await Promise.all([
            Invitation_1.default.find(query)
                .populate('invitedBy', 'firstName lastName email')
                .populate('usedBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Invitation_1.default.countDocuments(query),
        ]);
        const stats = await Invitation_1.default.aggregate([
            { $match: { workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);
        const statusCounts = stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});
        res.json({
            success: true,
            data: {
                invitations,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum),
                },
                stats: {
                    active: statusCounts.active || 0,
                    expired: statusCounts.expired || 0,
                    used: statusCounts.used || 0,
                    canceled: statusCounts.canceled || 0,
                    total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
                },
            },
        });
    }
    catch (error) {
        console.error('Error fetching workspace invitations:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.getWorkspaceInvitations = getWorkspaceInvitations;
const cancelInvitation = async (req, res) => {
    try {
        const { id: invitationId } = req.params;
        const userId = req.user._id;
        if (!invitationId || !mongoose_1.default.Types.ObjectId.isValid(invitationId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid invitation ID',
            });
            return;
        }
        const invitation = await Invitation_1.default.findById(invitationId);
        if (!invitation) {
            res.status(404).json({
                success: false,
                message: 'Invitation not found',
            });
            return;
        }
        const workspace = await Workplace_1.default.findById(invitation.workspaceId);
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found',
            });
            return;
        }
        if (workspace.ownerId.toString() !== userId.toString() &&
            invitation.invitedBy.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'You can only cancel invitations you created or if you are the workspace owner',
            });
            return;
        }
        if (invitation.status !== 'active') {
            res.status(400).json({
                success: false,
                message: `Cannot cancel invitation with status: ${invitation.status}`,
            });
            return;
        }
        invitation.status = 'canceled';
        await invitation.save();
        res.json({
            success: true,
            message: 'Invitation canceled successfully',
            data: {
                invitationId: invitation._id,
                status: invitation.status,
            },
        });
    }
    catch (error) {
        console.error('Error canceling invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.cancelInvitation = cancelInvitation;
const acceptInvitation = async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user._id;
        if (!code || code.length !== 8) {
            res.status(400).json({
                success: false,
                message: 'Invalid invitation code format',
            });
            return;
        }
        const invitation = await Invitation_1.default.findOne({ code: code.toUpperCase() })
            .populate('workspaceId')
            .populate('invitedBy', 'firstName lastName email');
        if (!invitation) {
            res.status(404).json({
                success: false,
                message: 'Invitation not found',
            });
            return;
        }
        const isExpired = invitation.expiresAt < new Date();
        const canBeUsed = invitation.status === 'active' && !isExpired;
        if (!canBeUsed) {
            const reason = isExpired ? 'expired' : `already ${invitation.status}`;
            res.status(400).json({
                success: false,
                message: `This invitation is ${reason} and cannot be used`,
                data: {
                    status: invitation.status,
                    expiresAt: invitation.expiresAt,
                },
            });
            return;
        }
        const user = await User_1.default.findById(userId);
        const workspace = invitation.workspaceId;
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found',
            });
            return;
        }
        if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
            res.status(403).json({
                success: false,
                message: 'This invitation is for a different email address',
                data: {
                    invitationEmail: invitation.email,
                    userEmail: user.email,
                },
            });
            return;
        }
        if (user.workplaceId && user.workplaceId.toString() === workspace._id.toString()) {
            res.status(409).json({
                success: false,
                message: 'You are already a member of this workspace',
            });
            return;
        }
        if (user.workplaceId) {
            res.status(409).json({
                success: false,
                message: 'You are already a member of another workspace. Please leave your current workspace first.',
                data: {
                    currentWorkspaceId: user.workplaceId,
                },
            });
            return;
        }
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            await User_1.default.findByIdAndUpdate(userId, {
                workplaceId: workspace._id,
                role: invitation.role,
            }, { session });
            await Workplace_1.default.findByIdAndUpdate(workspace._id, {
                $addToSet: { teamMembers: userId },
                $inc: { 'stats.usersCount': 1 },
                'stats.lastUpdated': new Date(),
            }, { session });
            invitation.status = 'used';
            invitation.usedAt = new Date();
            invitation.usedBy = new mongoose_1.default.Types.ObjectId(userId);
            await invitation.save({ session });
            await session.commitTransaction();
            await auditLogging_1.auditOperations.invitationAccepted(req, invitation, user);
            const inviterData = invitation.invitedBy;
            emailService_1.emailService.sendInvitationAcceptedNotification(inviterData.email, {
                inviterName: `${inviterData.firstName} ${inviterData.lastName}`,
                acceptedUserName: `${user.firstName} ${user.lastName}`,
                acceptedUserEmail: user.email,
                workspaceName: workspace.name,
                role: invitation.role,
            }).catch((error) => {
                console.error('Failed to send invitation accepted notification:', error);
            });
            res.json({
                success: true,
                message: 'Invitation accepted successfully',
                data: {
                    workspace: {
                        id: workspace._id,
                        name: workspace.name,
                        type: workspace.type,
                    },
                    role: invitation.role,
                    user: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: invitation.role,
                    },
                },
            });
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.acceptInvitation = acceptInvitation;
const validateInvitation = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code || code.length !== 8) {
            res.status(400).json({
                success: false,
                message: 'Invalid invitation code format',
            });
            return;
        }
        const invitation = await Invitation_1.default.findOne({ code: code.toUpperCase() })
            .populate('workspaceId', 'name type logoUrl')
            .populate('invitedBy', 'firstName lastName')
            .lean();
        if (!invitation) {
            res.status(404).json({
                success: false,
                message: 'Invitation not found',
            });
            return;
        }
        const isExpired = invitation.expiresAt < new Date();
        const canBeUsed = invitation.status === 'active' && !isExpired;
        if (isExpired && invitation.status === 'active') {
            await Invitation_1.default.findByIdAndUpdate(invitation._id, { status: 'expired' });
        }
        const workspaceData = invitation.workspaceId;
        const inviterData = invitation.invitedBy;
        res.json({
            success: true,
            data: {
                invitation: {
                    id: invitation._id,
                    email: invitation.email,
                    role: invitation.role,
                    status: isExpired ? 'expired' : invitation.status,
                    expiresAt: invitation.expiresAt,
                    canBeUsed,
                    workspace: {
                        id: workspaceData._id,
                        name: workspaceData.name,
                        type: workspaceData.type,
                        logoUrl: workspaceData.logoUrl,
                    },
                    inviter: {
                        name: `${inviterData.firstName} ${inviterData.lastName}`,
                    },
                    metadata: invitation.metadata,
                },
            },
        });
    }
    catch (error) {
        console.error('Error validating invitation:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.validateInvitation = validateInvitation;
const getInvitationAnalytics = async (req, res) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user._id;
        if (!workspaceId || !mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid workspace ID',
            });
            return;
        }
        const workspace = await Workplace_1.default.findById(workspaceId);
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found',
            });
            return;
        }
        if (workspace.ownerId.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Only workspace owners can view invitation analytics',
            });
            return;
        }
        const analytics = await InvitationCronService_1.invitationCronService.getInvitationAnalytics(workspaceId);
        res.json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        console.error('Error fetching invitation analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.getInvitationAnalytics = getInvitationAnalytics;
const getInvitationStats = async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const userId = req.user._id;
        if (workspaceId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid workspace ID',
                });
                return;
            }
            const workspace = await Workplace_1.default.findById(workspaceId);
            if (!workspace) {
                res.status(404).json({
                    success: false,
                    message: 'Workspace not found',
                });
                return;
            }
            if (workspace.ownerId.toString() !== userId.toString()) {
                res.status(403).json({
                    success: false,
                    message: 'Only workspace owners can view invitation statistics',
                });
                return;
            }
        }
        const stats = await InvitationCronService_1.invitationCronService.getInvitationStats(workspaceId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error fetching invitation stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.getInvitationStats = getInvitationStats;
const checkInvitationLimits = async (req, res) => {
    try {
        const { id: workspaceId } = req.params;
        const userId = req.user._id;
        if (!workspaceId || !mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
            res.status(400).json({
                success: false,
                message: 'Invalid workspace ID',
            });
            return;
        }
        const workspace = await Workplace_1.default.findById(workspaceId);
        if (!workspace) {
            res.status(404).json({
                success: false,
                message: 'Workspace not found',
            });
            return;
        }
        if (workspace.ownerId.toString() !== userId.toString()) {
            res.status(403).json({
                success: false,
                message: 'Only workspace owners can view invitation limits',
            });
            return;
        }
        const limits = await InvitationCronService_1.invitationCronService.validateInvitationLimits(workspaceId);
        res.json({
            success: true,
            data: limits,
        });
    }
    catch (error) {
        console.error('Error checking invitation limits:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
exports.checkInvitationLimits = checkInvitationLimits;
//# sourceMappingURL=invitationController.js.map