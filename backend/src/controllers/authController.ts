import User from '../models/User';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email';
import crypto from 'crypto';
import { Request, Response } from 'express';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, licenseNumber, pharmacyName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    // In a real app, you'd save this token with expiry to the user model
    
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: `Reset your password using this token: ${resetToken}`
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    // In a real app, you'd verify the token and update the password
    res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

interface AuthRequest extends Request {
  user?: any;
}

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json({ user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};