"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getMe = exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../utils/email");
const crypto_1 = __importDefault(require("crypto"));
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, licenseNumber, pharmacyName } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const user = await User_1.default.create({
            firstName,
            lastName,
            email,
            password,
            licenseNumber,
            pharmacyName
        });
        const token = generateToken(user._id.toString());
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                pharmacyName: user.pharmacyName
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
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({ message: 'Account is deactivated' });
            return;
        }
        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user._id.toString());
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                pharmacyName: user.pharmacyName
            }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.login = login;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const resetToken = crypto_1.default.randomBytes(20).toString('hex');
        await (0, email_1.sendEmail)({
            to: email,
            subject: 'Password Reset Request',
            text: `Reset your password using this token: ${resetToken}`
        });
        res.json({ message: 'Password reset email sent' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        res.json({ message: 'Password reset successful' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.resetPassword = resetPassword;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id).populate('subscription');
        res.json({ user });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const user = await User_1.default.findByIdAndUpdate(req.user.id, req.body, {
            new: true,
            runValidators: true
        });
        res.json({ user });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map