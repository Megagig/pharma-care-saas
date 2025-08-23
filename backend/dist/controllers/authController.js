"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.logoutAll = exports.logout = exports.refreshToken = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const Session_1 = __importDefault(require("../models/Session"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../utils/email");
const crypto_1 = __importDefault(require("crypto"));
const generateAccessToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(64).toString('hex');
};
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, role = 'pharmacist' } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }
        const freeTrialPlan = await SubscriptionPlan_1.default.findOne({ name: 'Free Trial' });
        if (!freeTrialPlan) {
            res.status(500).json({ message: 'Default subscription plan not found. Please run seed script.' });
            return;
        }
        const user = await User_1.default.create({
            firstName,
            lastName,
            email,
            phone,
            passwordHash: password,
            role,
            currentPlanId: freeTrialPlan._id,
            status: 'pending'
        });
        const verificationToken = user.generateVerificationToken();
        await user.save();
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        await (0, email_1.sendEmail)({
            to: email,
            subject: 'Verify Your Email - PharmaCare',
            html: `
        <h2>Welcome to PharmaCare!</h2>
        <p>Hi ${firstName},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
        });
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified
            }
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
        const user = await User_1.default.findOne({ email }).select('+passwordHash').populate('currentPlanId');
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        if (user.status === 'suspended') {
            res.status(401).json({ message: 'Account is suspended. Please contact support.' });
            return;
        }
        if (!user.emailVerified) {
            res.status(401).json({
                message: 'Please verify your email before logging in.',
                requiresVerification: true
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
            refreshToken: crypto_1.default.createHash('sha256').update(refreshToken).digest('hex'),
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip,
            expiresAt
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        res.json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                currentPlan: user.currentPlanId,
                pharmacyId: user.pharmacyId
            }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.login = login;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ message: 'Verification token is required' });
            return;
        }
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.default.findOne({
            verificationToken: hashedToken,
            emailVerified: false
        });
        if (!user) {
            res.status(400).json({ message: 'Invalid or expired verification token' });
            return;
        }
        user.emailVerified = true;
        user.status = 'active';
        user.verificationToken = undefined;
        await user.save();
        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
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
            res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
            return;
        }
        const resetToken = user.generateResetToken();
        await user.save();
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await (0, email_1.sendEmail)({
            to: email,
            subject: 'Password Reset Request - PharmaCare',
            html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
        });
        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
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
            resetToken: hashedToken
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
            message: 'Password reset successful! Please log in with your new password.'
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
        const hashedToken = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        const session = await Session_1.default.findOne({
            refreshToken: hashedToken,
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).populate('userId');
        if (!session) {
            res.status(401).json({ message: 'Invalid or expired refresh token' });
            return;
        }
        const user = session.userId;
        const accessToken = generateAccessToken(user._id.toString());
        res.json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified
            }
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
        if (refreshToken) {
            const hashedToken = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            await Session_1.default.updateOne({ refreshToken: hashedToken }, { isActive: false });
        }
        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.logout = logout;
const logoutAll = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            const hashedToken = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            const session = await Session_1.default.findOne({ refreshToken: hashedToken });
            if (session) {
                await Session_1.default.updateMany({ userId: session.userId }, { isActive: false });
            }
        }
        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logged out from all devices successfully'
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.logoutAll = logoutAll;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.userId)
            .populate('currentPlanId')
            .populate('pharmacyId')
            .select('-passwordHash');
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
                emailVerified: user.emailVerified,
                currentPlan: user.currentPlanId,
                pharmacy: user.pharmacyId,
                lastLoginAt: user.lastLoginAt
            }
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
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) {
            res.status(400).json({ message: 'Invalid updates. Only firstName, lastName, and phone can be updated.' });
            return;
        }
        const user = await User_1.default.findByIdAndUpdate(req.user.userId, req.body, {
            new: true,
            runValidators: true
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
                status: user.status
            }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map