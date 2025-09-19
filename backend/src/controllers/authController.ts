import User from '../models/User';
import Session from '../models/Session';
import SubscriptionPlan from '../models/SubscriptionPlan';
import Subscription from '../models/Subscription';
import Workplace from '../models/Workplace';
import WorkplaceService from '../services/WorkplaceService';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email';
import crypto from 'crypto';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { auditOperations } from '../middlewares/auditLogging';

const generateAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1h' }); // Increased to 1 hour
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      role = 'pharmacist',
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({
        message:
          'Missing required fields: firstName, lastName, email, and password are required',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Get the Free Trial plan as default
    const freeTrialPlan = await SubscriptionPlan.findOne({
      name: 'Free Trial',
      billingInterval: 'monthly',
    });
    if (!freeTrialPlan) {
      res.status(500).json({
        message: 'Default subscription plan not found. Please run seed script.',
      });
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
      subscriptionTier: 'free_trial',
      status: 'pending', // User needs to verify email
    });

    // Create Free Trial subscription
    const trialEndDate = new Date();
    trialEndDate.setDate(
      trialEndDate.getDate() + (freeTrialPlan.trialDuration || 14)
    );

    const subscription = await Subscription.create({
      userId: user._id,
      planId: freeTrialPlan._id,
      tier: 'free_trial',
      status: 'trial',
      startDate: new Date(),
      endDate: trialEndDate,
      priceAtPurchase: 0,
      autoRenew: false, // Free trial doesn't auto-renew
    });

    // Update user with subscription reference
    user.currentSubscriptionId = subscription._id;
    await user.save();

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
      `,
    });

    res.status(201).json({
      success: true,
      message:
        'Registration successful! Please check your email to verify your account.',
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email })
      .select('+passwordHash')
      .populate('currentPlanId');
    if (!user || !(await user.comparePassword(password))) {
      // Log failed login attempt
      await auditOperations.login(req, user || { email }, false);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user is active
    if (user.status === 'suspended') {
      res
        .status(401)
        .json({ message: 'Account is suspended. Please contact support.' });
      return;
    }

    // Check if email is verified
    if (!user.emailVerified) {
      res.status(401).json({
        message: 'Please verify your email before logging in.',
        requiresVerification: true,
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
      refreshToken: crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex'),
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      expiresAt,
    });

    // Set both access and refresh tokens as httpOnly cookies with path settings
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour (matching JWT expiration)
      path: '/', // Ensure cookie is available on all paths
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/', // Ensure cookie is available on all paths
    });

    // Log successful login
    await auditOperations.login(req, user, true);

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
        currentPlan: user.currentPlanId,
        workplaceId: user.workplaceId,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      // Hash the token to match what's stored in the database
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with this verification token
      user = await User.findOne({
        verificationToken: hashedToken,
        emailVerified: false,
      });
    } else if (code) {
      // Hash the code to match what's stored in the database
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

      // Find user with this verification code
      user = await User.findOne({
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

    // Update user status
    user.emailVerified = true;
    user.status = 'active';
    user.verificationToken = undefined;
    user.verificationCode = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      res.json({
        message:
          'If an account with that email exists, a password reset link has been sent.',
      });
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
      `,
    });

    res.json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      resetToken: hashedToken,
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
    await Session.updateMany({ userId: user._id }, { isActive: false });

    res.json({
      success: true,
      message:
        'Password reset successful! Please log in with your new password.',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not provided' });
      return;
    }

    // Hash the refresh token to match what's stored in the database
    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Find active session with this refresh token
    const session = await Session.findOne({
      refreshToken: hashedToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    if (!session) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = session.userId as any;

    // Generate new access token
    const accessToken = generateAccessToken(user._id.toString());

    // Set new access token as httpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 1000, // 60 minutes
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;
    let user = null;

    if (refreshToken) {
      // Hash the refresh token to match what's stored in the database
      const hashedToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      // Find the session to get user info for audit logging
      const session = await Session.findOne({
        refreshToken: hashedToken,
      }).populate('userId');
      if (session) {
        user = session.userId;
      }

      // Deactivate the session
      await Session.updateOne(
        { refreshToken: hashedToken },
        { isActive: false }
      );
    }

    // Log logout for audit (if we have user info)
    if (user) {
      await auditOperations.logout(req as any);
    }

    // Clear all possible cookie names
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.clearCookie('token'); // Clear old token cookie name too

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Clear cookies endpoint (no auth required)
export const clearCookies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Clear all possible cookie names
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.clearCookie('token'); // Clear old token cookie name too

    res.json({
      success: true,
      message: 'Cookies cleared successfully',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Check if authentication cookies exist (lightweight endpoint)
export const checkCookies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const accessToken = req.cookies.accessToken || req.cookies.token;
    const refreshToken = req.cookies.refreshToken;

    res.json({
      success: true,
      hasCookies: !!(accessToken || refreshToken),
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      debug:
        process.env.NODE_ENV === 'development'
          ? {
            cookies: Object.keys(req.cookies),
            userAgent: req.get('User-Agent'),
            origin: req.get('Origin'),
          }
          : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Hash the refresh token to find the user
      const hashedToken = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');
      const session = await Session.findOne({ refreshToken: hashedToken });

      if (session) {
        // Deactivate all sessions for this user
        await Session.updateMany(
          { userId: session.userId },
          { isActive: false }
        );
      }
    }

    // Clear both cookies
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
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
    const user = await User.findById(req.user._id)
      .populate('currentPlanId')
      .populate('workplaceId')
      .populate('currentSubscriptionId')
      .select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Get user's active subscription if not populated
    let userSubscription = user.currentSubscriptionId;
    let subscriptionData = null;

    if (!userSubscription) {
      subscriptionData = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['active', 'trial', 'grace_period'] },
      }).populate('planId');
    } else if (typeof userSubscription === 'object' && userSubscription._id) {
      // If it's already populated
      subscriptionData = userSubscription;
    } else {
      // If it's just an ObjectId, populate it
      subscriptionData = await Subscription.findById(userSubscription).populate(
        'planId'
      );
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
        workplace: user.workplaceId,
        workplaceRole: user.workplaceRole,
        subscriptionTier: user.subscriptionTier,
        subscription: subscriptionData,
        hasSubscription: !!subscriptionData,
        lastLoginAt: user.lastLoginAt,
        themePreference: user.themePreference,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      res.status(400).json({
        message:
          'Invalid updates. Only firstName, lastName, and phone can be updated.',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(req.user.userId, req.body, {
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateThemePreference = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { themePreference } = req.body;

    // Validate theme preference
    if (!['light', 'dark', 'system'].includes(themePreference)) {
      res.status(400).json({
        message: 'Invalid theme preference. Must be light, dark, or system.',
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { themePreference },
      {
        new: true,
        runValidators: true,
      }
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Theme preference updated successfully',
      themePreference: user.themePreference,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * New multi-step registration endpoint
 * Handles three flows:
 * 1. Register with new workplace
 * 2. Join existing workplace
 * 3. Skip workplace setup (independent user)
 */
export const registerWithWorkplace = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    // Try to use transactions, but fall back to non-transactional for test environments
    const executeRegistration = async () => {
      const {
        // User info
        firstName,
        lastName,
        email,
        password,
        phone,
        role = 'pharmacist',
        licenseNumber,

        // Workplace flow
        workplaceFlow, // 'create', 'join', or 'skip'

        // For creating new workplace
        workplace,

        // For joining existing workplace
        inviteCode,
        workplaceId,
        workplaceRole,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !password || !workplaceFlow) {
        res.status(400).json({
          message:
            'Missing required fields: firstName, lastName, email, password, and workplaceFlow are required',
        });
        return;
      }

      // Validate workplace flow
      if (!['create', 'join', 'skip'].includes(workplaceFlow)) {
        res.status(400).json({
          message: 'workplaceFlow must be one of: create, join, skip',
        });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res
          .status(400)
          .json({ message: 'User already exists with this email' });
        return;
      }

      // Get the Free Trial plan as default
      const freeTrialPlan = await SubscriptionPlan.findOne({
        name: 'Free Trial',
        billingInterval: 'monthly',
      });
      if (!freeTrialPlan) {
        res.status(500).json({
          message:
            'Default subscription plan not found. Please run seed script.',
        });
        return;
      }

      // Create user first
      const userArray = await User.create(
        [
          {
            firstName,
            lastName,
            email,
            phone,
            passwordHash: password,
            role,
            licenseNumber,
            currentPlanId: freeTrialPlan._id,
            subscriptionTier: 'free_trial',
            status: 'pending',
          },
        ],
        { session }
      );

      const createdUser = userArray[0];

      if (!createdUser) {
        throw new Error('Failed to create user');
      }

      let workplaceData = null;
      let subscription = null;

      // Handle workplace flows
      if (workplaceFlow === 'create') {
        // Validate workplace data
        if (
          !workplace ||
          !workplace.name ||
          !workplace.type ||
          !workplace.licenseNumber ||
          !workplace.email
        ) {
          res.status(400).json({
            message:
              'Workplace name, type, licenseNumber, and email are required for creating a workplace',
          });
          return;
        }

        if (!createdUser) {
          throw new Error('Failed to create user');
        }

        // Create new workplace and assign 14-day free trial
        workplaceData = await WorkplaceService.createWorkplace({
          name: workplace.name,
          type: workplace.type,
          licenseNumber: workplace.licenseNumber,
          email: workplace.email,
          address: workplace.address,
          state: workplace.state,
          lga: workplace.lga,
          ownerId: createdUser._id,
        });

        // Create trial subscription for the workplace owner
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);

        const subscriptionArray = await Subscription.create(
          [
            {
              workspaceId: workplaceData._id,
              planId: freeTrialPlan._id,
              tier: 'free_trial',
              status: 'trial',
              startDate: new Date(),
              endDate: trialEndDate,
              priceAtPurchase: 0,
              autoRenew: false,
            },
          ],
          { session }
        );

        subscription = subscriptionArray[0];

        if (!subscription) {
          throw new Error('Failed to create subscription');
        }

        // Update user with workplace and subscription
        await User.findByIdAndUpdate(
          createdUser!._id,
          {
            workplaceId: workplaceData._id,
            workplaceRole: 'Owner',
            currentSubscriptionId: subscription!._id,
          },
          { session }
        );
      } else if (workplaceFlow === 'join') {
        // Validate join data
        if (!inviteCode && !workplaceId) {
          res.status(400).json({
            message:
              'Either inviteCode or workplaceId is required for joining a workplace',
          });
          return;
        }

        // Join existing workplace - inherit subscription
        workplaceData = await WorkplaceService.joinWorkplace({
          userId: createdUser!._id,
          inviteCode,
          workplaceId: workplaceId
            ? new mongoose.Types.ObjectId(workplaceId)
            : undefined,
          workplaceRole: workplaceRole || 'Staff',
        });

        // Find the workplace's subscription to inherit
        const workplaceSubscription = await Subscription.findOne({
          workspaceId: workplaceData._id,
          status: { $in: ['active', 'trial', 'grace_period'] },
        });

        if (workplaceSubscription) {
          // Update user to reference the workplace subscription
          await User.findByIdAndUpdate(
            createdUser!._id,
            {
              currentSubscriptionId: workplaceSubscription._id,
              subscriptionTier: workplaceSubscription.tier,
            },
            { session }
          );
        }
      } else if (workplaceFlow === 'skip') {
        // Independent user - no workplace, no subscription
        // They get access to basic features only (Knowledge Hub, CPD, Forum)
        // No subscription needed for these features
        // User remains with workplaceId: null and no subscription
        // They can create or join a workplace later from their dashboard
      }

      // Generate verification token and code
      const verificationToken = createdUser!.generateVerificationToken();
      const verificationCode = createdUser!.generateVerificationCode();
      await createdUser!.save({ session });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

      let emailSubject = 'Welcome to PharmaCare - Verify Your Email';
      let emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to PharmaCare!</h1>
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
      } else if (workplaceFlow === 'join') {
        emailContent += `
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #059669; margin-bottom: 10px;">🤝 You've joined a workplace!</h3>
            <p style="color: #374151; margin-bottom: 10px;"><strong>Workplace:</strong> ${workplaceData?.name
          }</p>
            <p style="color: #374151; margin-bottom: 10px;"><strong>Your Role:</strong> ${workplaceRole || 'Staff'
          }</p>
            <p style="color: #6b7280; font-size: 14px;">You now have access to your workplace's features and subscription plan.</p>
          </div>`;
      } else {
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

      await sendEmail({
        to: email,
        subject: emailSubject,
        html: emailContent,
      });

      res.status(201).json({
        success: true,
        message:
          'Registration successful! Please check your email to verify your account.',
        data: {
          user: {
            id: createdUser!._id,
            firstName: createdUser!.firstName,
            lastName: createdUser!.lastName,
            email: createdUser!.email,
            role: createdUser!.role,
            status: createdUser!.status,
            emailVerified: createdUser!.emailVerified,
            workplaceId: createdUser!.workplaceId,
            workplaceRole: createdUser!.workplaceRole,
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

    // Try to use transactions, but fall back to non-transactional for test environments
    try {
      await session.withTransaction(executeRegistration);
    } catch (transactionError: any) {
      // If transaction fails (e.g., in test environment), try without transaction
      if (
        transactionError.code === 20 ||
        transactionError.codeName === 'IllegalOperation'
      ) {
        console.warn(
          'Transactions not supported, falling back to non-transactional execution'
        );
        await executeRegistration();
      } else {
        throw transactionError;
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Find workplace by invite code
 */
export const findWorkplaceByInviteCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { inviteCode } = req.params;

    if (!inviteCode || typeof inviteCode !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Invite code is required',
      });
      return;
    }

    const workplace = await WorkplaceService.findByInviteCode(inviteCode);

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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// The duplicate refreshToken function has been removed

// Check if cookies exist - lightweight endpoint for frontend to detect authentication state
export const checkCookiesStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // If either cookie exists, respond with success
    if (req.cookies.accessToken || req.cookies.refreshToken) {
      res.status(200).json({ success: true, hasCookies: true });
    } else {
      res.status(200).json({ success: true, hasCookies: false });
    }
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
