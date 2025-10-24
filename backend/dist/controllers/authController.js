"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCookiesStatus = exports.findWorkplaceByInviteCode = exports.registerWithWorkplace = exports.updateThemePreference = exports.updateProfile = exports.getMe = exports.logoutAll = exports.checkCookies = exports.clearCookies = exports.logout = exports.refreshToken = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const Session_1 = __importDefault(require("../models/Session"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const Subscription_1 = __importDefault(require("../models/Subscription"));
const WorkplaceService_1 = __importDefault(require("../services/WorkplaceService"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../utils/email");
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const auditLogging_1 = require("../middlewares/auditLogging");
const generateAccessToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(64).toString('hex');
};
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, role = 'pharmacist', inviteToken, inviteCode, } = req.body;
        if (!firstName || !lastName || !email || !password) {
            res.status(400).json({
                message: 'Missing required fields: firstName, lastName, email, and password are required',
            });
            return;
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }
        let workspaceInvite = null;
        let workplace = null;
        let workplaceId = null;
        let workplaceRole = null;
        let requiresApproval = false;
        let inviteMethod = null;
        if (inviteToken) {
            const { WorkspaceInvite } = await Promise.resolve().then(() => __importStar(require('../models/WorkspaceInvite')));
            workspaceInvite = await WorkspaceInvite.findOne({
                inviteToken,
                status: 'pending',
            });
            if (!workspaceInvite) {
                res.status(400).json({
                    message: 'Invalid or expired invite link',
                });
                return;
            }
            if (workspaceInvite.isExpired()) {
                res.status(400).json({
                    message: 'This invite link has expired',
                });
                return;
            }
            if (workspaceInvite.email.toLowerCase() !== email.toLowerCase()) {
                res.status(400).json({
                    message: 'This invite was sent to a different email address',
                });
                return;
            }
            if (workspaceInvite.usedCount >= workspaceInvite.maxUses) {
                res.status(400).json({
                    message: 'This invite link has reached its maximum number of uses',
                });
                return;
            }
            workplaceId = workspaceInvite.workplaceId;
            workplaceRole = workspaceInvite.workplaceRole;
            requiresApproval = workspaceInvite.requiresApproval;
            inviteMethod = 'token';
        }
        else if (inviteCode) {
            const { Workplace } = await Promise.resolve().then(() => __importStar(require('../models/Workplace')));
            workplace = await Workplace.findOne({ inviteCode: inviteCode.toUpperCase() });
            if (!workplace) {
                res.status(400).json({
                    message: 'Invalid workplace invite code',
                });
                return;
            }
            workplaceId = workplace._id;
            workplaceRole = 'Staff';
            requiresApproval = true;
            inviteMethod = 'code';
        }
        const freeTrialPlan = await SubscriptionPlan_1.default.findOne({
            name: 'Free Trial',
            billingInterval: 'monthly',
        });
        if (!freeTrialPlan) {
            res.status(500).json({
                message: 'Default subscription plan not found. Please run seed script.',
            });
            return;
        }
        let userStatus = 'pending';
        if (requiresApproval) {
            userStatus = 'pending';
        }
        const user = await User_1.default.create({
            firstName,
            lastName,
            email,
            phone,
            passwordHash: password,
            role: workplaceId ? 'pharmacy_team' : role,
            workplaceId: workplaceId || undefined,
            workplaceRole: workplaceRole || undefined,
            currentPlanId: freeTrialPlan._id,
            status: userStatus,
        });
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + (freeTrialPlan.trialDuration || 14));
        const { getSubscriptionFeatures } = await Promise.resolve().then(() => __importStar(require('../utils/subscriptionFeatures')));
        const features = await getSubscriptionFeatures(freeTrialPlan, 'free_trial');
        const subscription = await Subscription_1.default.create({
            workspaceId: workplaceId || undefined,
            planId: freeTrialPlan._id,
            tier: 'free_trial',
            status: 'trial',
            startDate: new Date(),
            endDate: trialEndDate,
            trialEndDate: trialEndDate,
            priceAtPurchase: 0,
            autoRenew: false,
            features: features,
            customFeatures: [],
            limits: {
                patients: null,
                users: null,
                locations: null,
                storage: null,
                apiCalls: null,
            },
            usageMetrics: [],
            paymentHistory: [],
            webhookEvents: [],
            renewalAttempts: [],
        });
        user.currentSubscriptionId = subscription._id;
        await user.save();
        if (inviteMethod === 'token' && workspaceInvite) {
            workspaceInvite.usedCount += 1;
            if (!requiresApproval) {
                workspaceInvite.status = 'accepted';
                workspaceInvite.acceptedAt = new Date();
                workspaceInvite.acceptedBy = user._id;
            }
            await workspaceInvite.save();
            if (workplaceId) {
                const { workspaceAuditService } = await Promise.resolve().then(() => __importStar(require('../services/workspaceAuditService')));
                await workspaceAuditService.logInviteAction(new mongoose_1.default.Types.ObjectId(workplaceId), user._id, 'invite_accepted', {
                    metadata: {
                        inviteId: workspaceInvite._id,
                        email: user.email,
                        role: workplaceRole,
                        requiresApproval,
                        method: 'invite_link',
                        status: requiresApproval ? 'pending_approval' : 'active',
                    },
                }, req);
            }
        }
        else if (inviteMethod === 'code' && workplace) {
            if (workplaceId) {
                const { workspaceAuditService } = await Promise.resolve().then(() => __importStar(require('../services/workspaceAuditService')));
                await workspaceAuditService.logMemberAction(new mongoose_1.default.Types.ObjectId(workplaceId), user._id, user._id, 'member_added', {
                    reason: `Joined using workplace invite code: ${inviteCode}`,
                    metadata: {
                        email: user.email,
                        role: workplaceRole,
                        inviteCode,
                        requiresApproval,
                        method: 'invite_code',
                        via: 'invite_code',
                    },
                }, req);
            }
        }
        const verificationToken = user.generateVerificationToken();
        const verificationCode = user.generateVerificationCode();
        await user.save();
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await (0, email_1.sendEmail)({
            to: email,
            subject: 'Verify Your Email - PharmacyCopilot',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to PharmacyCopilot!</h1>
            <p style="color: #6b7280; font-size: 16px;">Hi ${firstName}, please verify your email address</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">Choose your verification method:</h2>
            
            <div style="margin-bottom: 30px;">
              <h3 style="color: #374151; margin-bottom: 15px;">Option 1: Click the verification link</h3>
              <div style="text-align: center;">
                <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email Address</a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
              <h3 style="color: #374151; margin-bottom: 15px;">Option 2: Enter this 6-digit code</h3>
              <div style="text-align: center; background: white; padding: 20px; border-radius: 8px; border: 2px dashed #d1d5db;">
                <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</div>
                <p style="color: #6b7280; margin-top: 10px; font-size: 14px;">Enter this code on the verification page</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>This verification will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        </div>
      `,
        });
        let successMessage = 'Registration successful! Please check your email to verify your account.';
        if ((workspaceInvite || workplace) && requiresApproval) {
            successMessage = 'Registration successful! Please verify your email. Your account will be activated once the workspace owner approves your request.';
        }
        else if (workspaceInvite || workplace) {
            successMessage = 'Registration successful! Please verify your email to access your workspace.';
        }
        res.status(201).json({
            success: true,
            message: successMessage,
            requiresApproval: (workspaceInvite || workplace) ? requiresApproval : false,
            workspaceInvite: (workspaceInvite || workplace) ? true : false,
            inviteMethod: inviteMethod,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                workplaceId: user.workplaceId,
                workplaceRole: user.workplaceRole,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email })
            .select('+passwordHash')
            .populate('currentPlanId');
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid credentials' });
            setImmediate(async () => {
                try {
                    await auditLogging_1.auditOperations.login(req, user || { email }, false);
                }
                catch (auditError) {
                    console.error('Audit logging error:', auditError);
                }
            });
            return;
        }
        if (user.status === 'suspended') {
            res
                .status(401)
                .json({ message: 'Account is suspended. Please contact support.' });
            return;
        }
        if (user.status === 'pending') {
            res.status(401).json({
                message: 'Your account is pending approval by the workspace owner. You will receive an email once approved.',
                requiresApproval: true,
            });
            return;
        }
        if (!user.emailVerified) {
            res.status(401).json({
                message: 'Please verify your email before logging in.',
                requiresVerification: true,
            });
            return;
        }
        user.lastLoginAt = new Date();
        await user.save();
        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await Session_1.default.create({
            userId: user._id,
            refreshToken: crypto_1.default
                .createHash('sha256')
                .update(refreshToken)
                .digest('hex'),
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            expiresAt,
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/',
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                licenseStatus: user.licenseStatus,
                licenseNumber: user.licenseNumber,
                licenseVerifiedAt: user.licenseVerifiedAt,
                currentPlan: user.currentPlanId,
                workplaceId: user.workplaceId,
                workplaceRole: user.workplaceRole,
            },
        });
        setImmediate(async () => {
            try {
                await auditLogging_1.auditOperations.login(req, user, true);
            }
            catch (auditError) {
                console.error('Audit logging error:', auditError);
            }
        });
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(400).json({ message: error.message });
        }
    }
};
exports.login = login;
const verifyEmail = async (req, res) => {
    try {
        const { token, code } = req.body;
        if (!token && !code) {
            res
                .status(400)
                .json({ message: 'Verification token or code is required' });
            return;
        }
        let user = null;
        if (token) {
            const hashedToken = crypto_1.default
                .createHash('sha256')
                .update(token)
                .digest('hex');
            user = await User_1.default.findOne({
                verificationToken: hashedToken,
                emailVerified: false,
            });
        }
        else if (code) {
            const hashedCode = crypto_1.default.createHash('sha256').update(code).digest('hex');
            user = await User_1.default.findOne({
                verificationCode: hashedCode,
                emailVerified: false,
            });
        }
        if (!user) {
            res
                .status(400)
                .json({ message: 'Invalid or expired verification token/code' });
            return;
        }
        user.emailVerified = true;
        const { Workplace } = await Promise.resolve().then(() => __importStar(require('../models/Workplace')));
        const isWorkspaceOwner = await Workplace.findOne({
            _id: user.workplaceId,
            ownerId: user._id
        });
        if (isWorkspaceOwner) {
            user.status = 'active';
        }
        else if (user.workplaceId && user.workplaceRole) {
            user.status = 'pending';
        }
        else {
            user.status = 'active';
        }
        user.verificationToken = undefined;
        user.verificationCode = undefined;
        await user.save();
        res.json({
            success: true,
            message: (!isWorkspaceOwner && user.workplaceId && user.workplaceRole)
                ? 'Email verified successfully! Your account is pending approval by the workspace owner. You will receive an email once approved.'
                : 'Email verified successfully! You can now log in.',
            requiresApproval: !!((!isWorkspaceOwner && user.workplaceId && user.workplaceRole)),
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.verifyEmail = verifyEmail;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.json({
                message: 'If an account with that email exists, a password reset link has been sent.',
            });
            return;
        }
        const resetToken = user.generateResetToken();
        await user.save();
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await (0, email_1.sendEmail)({
            to: email,
            subject: 'Password Reset Request - PharmacyCopilot',
            html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        });
        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({ message: 'Token and new password are required' });
            return;
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.default.findOne({
            resetToken: hashedToken,
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }
        user.passwordHash = password;
        user.resetToken = undefined;
        await user.save();
        await Session_1.default.updateMany({ userId: user._id }, { isActive: false });
        res.json({
            success: true,
            message: 'Password reset successful! Please log in with your new password.',
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.resetPassword = resetPassword;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            res.status(401).json({ message: 'Refresh token not provided' });
            return;
        }
        const hashedToken = crypto_1.default
            .createHash('sha256')
            .update(refreshToken)
            .digest('hex');
        const session = await Session_1.default.findOne({
            refreshToken: hashedToken,
            isActive: true,
            expiresAt: { $gt: new Date() },
        }).populate('userId');
        if (!session) {
            res.status(401).json({ message: 'Invalid or expired refresh token' });
            return;
        }
        const user = session.userId;
        const accessToken = generateAccessToken(user._id.toString());
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 60 * 60 * 1000,
        });
        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        let user = null;
        if (refreshToken) {
            const hashedToken = crypto_1.default
                .createHash('sha256')
                .update(refreshToken)
                .digest('hex');
            const session = await Session_1.default.findOne({
                refreshToken: hashedToken,
            }).populate('userId');
            if (session) {
                user = session.userId;
            }
            await Session_1.default.updateOne({ refreshToken: hashedToken }, { isActive: false });
        }
        if (user) {
            await auditLogging_1.auditOperations.logout(req);
        }
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        res.clearCookie('token');
        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.logout = logout;
const clearCookies = async (req, res) => {
    try {
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        res.clearCookie('token');
        res.json({
            success: true,
            message: 'Cookies cleared successfully',
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.clearCookies = clearCookies;
const checkCookies = async (req, res) => {
    try {
        const accessToken = req.cookies.accessToken || req.cookies.token;
        const refreshToken = req.cookies.refreshToken;
        res.json({
            success: true,
            hasCookies: !!(accessToken || refreshToken),
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            debug: process.env.NODE_ENV === 'development'
                ? {
                    cookies: Object.keys(req.cookies),
                    userAgent: req.get('User-Agent'),
                    origin: req.get('Origin'),
                }
                : undefined,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.checkCookies = checkCookies;
const logoutAll = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            const hashedToken = crypto_1.default
                .createHash('sha256')
                .update(refreshToken)
                .digest('hex');
            const session = await Session_1.default.findOne({ refreshToken: hashedToken });
            if (session) {
                await Session_1.default.updateMany({ userId: session.userId }, { isActive: false });
            }
        }
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        res.json({
            success: true,
            message: 'Logged out from all devices successfully',
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.logoutAll = logoutAll;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id)
            .populate('currentPlanId')
            .populate('workplaceId')
            .populate('currentSubscriptionId')
            .select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        let userSubscription = user.currentSubscriptionId;
        let subscriptionData = null;
        if (!userSubscription) {
            subscriptionData = await Subscription_1.default.findOne({
                userId: user._id,
                status: { $in: ['active', 'trial', 'grace_period'] },
            }).populate('planId');
        }
        else if (typeof userSubscription === 'object' && userSubscription._id) {
            subscriptionData = userSubscription;
        }
        else {
            subscriptionData = await Subscription_1.default.findById(userSubscription).populate('planId');
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                licenseStatus: user.licenseStatus,
                licenseNumber: user.licenseNumber,
                licenseVerifiedAt: user.licenseVerifiedAt,
                currentPlan: user.currentPlanId,
                workplace: user.workplaceId,
                workplaceRole: user.workplaceRole,
                subscription: subscriptionData,
                hasSubscription: !!subscriptionData,
                lastLoginAt: user.lastLoginAt,
                themePreference: user.themePreference,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const allowedUpdates = ['firstName', 'lastName', 'phone'];
        const updates = Object.keys(req.body);
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
        if (!isValidOperation) {
            res.status(400).json({
                message: 'Invalid updates. Only firstName, lastName, and phone can be updated.',
            });
            return;
        }
        const user = await User_1.default.findByIdAndUpdate(req.user.userId, req.body, {
            new: true,
            runValidators: true,
        }).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                themePreference: user.themePreference,
            },
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateProfile = updateProfile;
const updateThemePreference = async (req, res) => {
    try {
        const { themePreference } = req.body;
        if (!['light', 'dark', 'system'].includes(themePreference)) {
            res.status(400).json({
                message: 'Invalid theme preference. Must be light, dark, or system.',
            });
            return;
        }
        const user = await User_1.default.findByIdAndUpdate(req.user.userId, { themePreference }, {
            new: true,
            runValidators: true,
        }).select('-passwordHash');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            message: 'Theme preference updated successfully',
            themePreference: user.themePreference,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateThemePreference = updateThemePreference;
const registerWithWorkplace = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        const executeRegistration = async () => {
            const { firstName, lastName, email, password, phone, role = 'pharmacist', workplaceFlow, workplace, inviteCode, workplaceId, workplaceRole, } = req.body;
            if (!firstName || !lastName || !email || !password || !workplaceFlow) {
                res.status(400).json({
                    message: 'Missing required fields: firstName, lastName, email, password, and workplaceFlow are required',
                });
                return;
            }
            if (!['create', 'join', 'skip'].includes(workplaceFlow)) {
                res.status(400).json({
                    message: 'workplaceFlow must be one of: create, join, skip',
                });
                return;
            }
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                res
                    .status(400)
                    .json({ message: 'User already exists with this email' });
                return;
            }
            const freeTrialPlan = await SubscriptionPlan_1.default.findOne({
                name: 'Free Trial',
                billingInterval: 'monthly',
            });
            if (!freeTrialPlan) {
                res.status(500).json({
                    message: 'Default subscription plan not found. Please run seed script.',
                });
                return;
            }
            const userArray = await User_1.default.create([
                {
                    firstName,
                    lastName,
                    email,
                    phone,
                    passwordHash: password,
                    role,
                    currentPlanId: freeTrialPlan._id,
                    status: 'pending',
                },
            ], { session });
            const createdUser = userArray[0];
            if (!createdUser) {
                throw new Error('Failed to create user');
            }
            let workplaceData = null;
            let subscription = null;
            if (workplaceFlow === 'create') {
                if (!workplace ||
                    !workplace.name ||
                    !workplace.type ||
                    !workplace.email) {
                    res.status(400).json({
                        message: 'Workplace name, type, and email are required for creating a workplace',
                    });
                    return;
                }
                if (!createdUser) {
                    throw new Error('Failed to create user');
                }
                workplaceData = await WorkplaceService_1.default.createWorkplace({
                    name: workplace.name,
                    type: workplace.type,
                    licenseNumber: workplace.licenseNumber || undefined,
                    email: workplace.email,
                    address: workplace.address,
                    state: workplace.state,
                    lga: workplace.lga,
                    ownerId: createdUser._id,
                });
                const trialEndDate = new Date();
                trialEndDate.setDate(trialEndDate.getDate() + 14);
                const { getSubscriptionFeatures } = await Promise.resolve().then(() => __importStar(require('../utils/subscriptionFeatures')));
                const features = await getSubscriptionFeatures(freeTrialPlan, 'free_trial');
                const subscriptionArray = await Subscription_1.default.create([
                    {
                        workspaceId: workplaceData._id,
                        planId: freeTrialPlan._id,
                        tier: 'free_trial',
                        status: 'trial',
                        startDate: new Date(),
                        endDate: trialEndDate,
                        trialEndDate: trialEndDate,
                        priceAtPurchase: 0,
                        autoRenew: false,
                        features: features,
                        customFeatures: [],
                        limits: {
                            patients: null,
                            users: null,
                            locations: null,
                            storage: null,
                            apiCalls: null,
                        },
                        usageMetrics: [],
                        paymentHistory: [],
                        webhookEvents: [],
                        renewalAttempts: [],
                    },
                ], { session });
                subscription = subscriptionArray[0];
                if (!subscription) {
                    throw new Error('Failed to create subscription');
                }
                await User_1.default.findByIdAndUpdate(createdUser._id, {
                    workplaceId: workplaceData._id,
                    workplaceRole: 'Owner',
                    currentSubscriptionId: subscription._id,
                }, { session });
            }
            else if (workplaceFlow === 'join') {
                if (!inviteCode && !workplaceId) {
                    res.status(400).json({
                        message: 'Either inviteCode or workplaceId is required for joining a workplace',
                    });
                    return;
                }
                workplaceData = await WorkplaceService_1.default.joinWorkplace({
                    userId: createdUser._id,
                    inviteCode,
                    workplaceId: workplaceId
                        ? new mongoose_1.default.Types.ObjectId(workplaceId)
                        : undefined,
                    workplaceRole: workplaceRole || 'Staff',
                }, session);
                const workplaceSubscription = await Subscription_1.default.findOne({
                    workspaceId: workplaceData._id,
                    status: { $in: ['active', 'trial', 'grace_period'] },
                });
                if (workplaceSubscription) {
                    await User_1.default.findByIdAndUpdate(createdUser._id, {
                        currentSubscriptionId: workplaceSubscription._id,
                    }, { session });
                }
            }
            else if (workplaceFlow === 'skip') {
            }
            const verificationToken = createdUser.generateVerificationToken();
            const verificationCode = createdUser.generateVerificationCode();
            await createdUser.save({ session });
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
            let emailSubject = 'Welcome to PharmacyCopilot - Verify Your Email';
            let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to PharmacyCopilot!</h1>
            <p style="color: #6b7280; font-size: 16px;">Hi ${firstName}, please verify your email address</p>
          </div>`;
            if (workplaceFlow === 'create') {
                emailContent += `
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #0369a1; margin-bottom: 10px;">🎉 Your workplace has been created!</h3>
            <p style="color: #374151; margin-bottom: 10px;"><strong>Workplace:</strong> ${workplaceData?.name}</p>
            <p style="color: #374151; margin-bottom: 10px;"><strong>Invite Code:</strong> <span style="background: #dbeafe; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${workplaceData?.inviteCode}</span></p>
            <p style="color: #6b7280; font-size: 14px;">Share this invite code with your team members so they can join your workplace.</p>
            <p style="color: #059669; font-size: 14px;"><strong>✨ You've got a 14-day free trial to explore all features!</strong></p>
          </div>`;
            }
            else if (workplaceFlow === 'join') {
                emailContent += `
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #059669; margin-bottom: 10px;">🤝 You've joined a workplace!</h3>
            <p style="color: #374151; margin-bottom: 10px;"><strong>Workplace:</strong> ${workplaceData?.name}</p>
            <p style="color: #374151; margin-bottom: 10px;"><strong>Your Role:</strong> ${workplaceRole || 'Staff'}</p>
            <p style="color: #6b7280; font-size: 14px;">You now have access to your workplace's features and subscription plan.</p>
          </div>`;
            }
            else {
                emailContent += `
          <div style="background: #fefce8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #ca8a04; margin-bottom: 10px;">👤 Independent Account Created</h3>
            <p style="color: #374151; margin-bottom: 10px;">You can access general features like Knowledge Hub, CPD, and Forum.</p>
            <p style="color: #6b7280; font-size: 14px;">To access workplace features like Patient Management, create or join a workplace anytime from your dashboard.</p>
          </div>`;
            }
            emailContent += `
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px; text-align: center;">Choose your verification method:</h2>
            
            <div style="margin-bottom: 30px;">
              <h3 style="color: #374151; margin-bottom: 15px;">Option 1: Click the verification link</h3>
              <div style="text-align: center;">
                <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email Address</a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 30px;">
              <h3 style="color: #374151; margin-bottom: 15px;">Option 2: Enter this 6-digit code</h3>
              <div style="text-align: center; background: white; padding: 20px; border-radius: 8px; border: 2px dashed #d1d5db;">
                <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">${verificationCode}</div>
                <p style="color: #6b7280; margin-top: 10px; font-size: 14px;">Enter this code on the verification page</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p>This verification will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        </div>
      `;
            await (0, email_1.sendEmail)({
                to: email,
                subject: emailSubject,
                html: emailContent,
            });
            res.status(201).json({
                success: true,
                message: 'Registration successful! Please check your email to verify your account.',
                data: {
                    user: {
                        id: createdUser._id,
                        firstName: createdUser.firstName,
                        lastName: createdUser.lastName,
                        email: createdUser.email,
                        role: createdUser.role,
                        status: createdUser.status,
                        emailVerified: createdUser.emailVerified,
                        workplaceId: createdUser.workplaceId,
                        workplaceRole: createdUser.workplaceRole,
                    },
                    workplace: workplaceData
                        ? {
                            id: workplaceData._id,
                            name: workplaceData.name,
                            type: workplaceData.type,
                            inviteCode: workplaceData.inviteCode,
                        }
                        : null,
                    subscription: subscription
                        ? {
                            id: subscription._id,
                            tier: subscription.tier,
                            status: subscription.status,
                            endDate: subscription.endDate,
                        }
                        : null,
                    workplaceFlow,
                },
            });
        };
        try {
            await session.withTransaction(executeRegistration);
        }
        catch (transactionError) {
            if (transactionError.code === 20 ||
                transactionError.codeName === 'IllegalOperation') {
                console.warn('Transactions not supported, falling back to non-transactional execution');
                await executeRegistration();
            }
            else {
                throw transactionError;
            }
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ message: error.message });
    }
    finally {
        session.endSession();
    }
};
exports.registerWithWorkplace = registerWithWorkplace;
const findWorkplaceByInviteCode = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        if (!inviteCode || typeof inviteCode !== 'string') {
            res.status(400).json({
                success: false,
                message: 'Invite code is required',
            });
            return;
        }
        const workplace = await WorkplaceService_1.default.findByInviteCode(inviteCode);
        if (!workplace) {
            res.status(404).json({
                success: false,
                message: 'Invalid invite code',
            });
            return;
        }
        res.json({
            success: true,
            data: {
                id: workplace._id,
                name: workplace.name,
                type: workplace.type,
                address: workplace.address,
                state: workplace.state,
                inviteCode: workplace.inviteCode,
                owner: workplace.ownerId,
                teamSize: workplace.teamMembers.length,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.findWorkplaceByInviteCode = findWorkplaceByInviteCode;
const checkCookiesStatus = async (req, res) => {
    try {
        if (req.cookies.accessToken || req.cookies.refreshToken) {
            res.status(200).json({ success: true, hasCookies: true });
        }
        else {
            res.status(200).json({ success: true, hasCookies: false });
        }
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.checkCookiesStatus = checkCookiesStatus;
//# sourceMappingURL=authController.js.map