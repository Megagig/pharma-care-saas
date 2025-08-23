import User from '../models/User';
import Session from '../models/Session';
import SubscriptionPlan from '../models/SubscriptionPlan';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email';
import crypto from 'crypto';
import { Request, Response } from 'express';

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone, role = 'pharmacist' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Get the Free Trial plan as default
    const freeTrialPlan = await SubscriptionPlan.findOne({ name: 'Free Trial' });
    if (!freeTrialPlan) {
      res.status(500).json({ message: 'Default subscription plan not found. Please run seed script.' });
      return;
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash: password, // Will be hashed by pre-save hook
      role,
      currentPlanId: freeTrialPlan._id,
      status: 'pending' // User needs to verify email
    });

    // Generate verification token and code
    const verificationToken = user.generateVerificationToken();
    const verificationCode = user.generateVerificationCode();
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - PharmaCare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to PharmaCare!</h1>
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+passwordHash').populate('currentPlanId');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (user.status === 'suspended') {
      res.status(401).json({ message: 'Account is suspended. Please contact support.' });
      return;
    }

    // Check if email is verified
    if (!user.emailVerified) {
      res.status(401).json({
        message: 'Please verify your email before logging in.',
        requiresVerification: true
      });
      return;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken();

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await Session.create({
      userId: user._id,
      refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      expiresAt
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, code } = req.body;

    if (!token && !code) {
      res.status(400).json({ message: 'Verification token or code is required' });
      return;
    }

    let user = null;

    if (token) {
      // Hash the token to match what's stored in the database
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with this verification token
      user = await User.findOne({
        verificationToken: hashedToken,
        emailVerified: false
      });
    } else if (code) {
      // Hash the code to match what's stored in the database
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

      // Find user with this verification code
      user = await User.findOne({
        verificationCode: hashedCode,
        emailVerified: false
      });
    }

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired verification token/code' });
      return;
    }

    // Update user status
    user.emailVerified = true;
    user.status = 'active';
    user.verificationToken = undefined;
    user.verificationCode = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      return;
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    // Hash the token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this reset token
    const user = await User.findOne({
      resetToken: hashedToken
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    // Update password and clear reset token
    user.passwordHash = password; // Will be hashed by pre-save hook
    user.resetToken = undefined;
    await user.save();

    // Invalidate all existing sessions for security
    await Session.updateMany(
      { userId: user._id },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Password reset successful! Please log in with your new password.'
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not provided' });
      return;
    }

    // Hash the refresh token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Find active session with this refresh token
    const session = await Session.findOne({
      refreshToken: hashedToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!session) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = session.userId as any;

    // Generate new access token
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Hash the refresh token to match what's stored in the database
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Deactivate the session
      await Session.updateOne(
        { refreshToken: hashedToken },
        { isActive: false }
      );
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Hash the refresh token to find the user
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const session = await Session.findOne({ refreshToken: hashedToken });

      if (session) {
        // Deactivate all sessions for this user
        await Session.updateMany(
          { userId: session.userId },
          { isActive: false }
        );
      }
    }

    // Clear the refresh token cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

interface AuthRequest extends Request {
  user?: any;
}

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.userId)
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      res.status(400).json({ message: 'Invalid updates. Only firstName, lastName, and phone can be updated.' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-passwordHash');

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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};