import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'pharmacist' | 'technician' | 'owner' | 'admin';
  status: 'pending' | 'active' | 'suspended';
  emailVerified: boolean;
  verificationToken?: string;
  verificationCode?: string;
  resetToken?: string;
  pharmacyId?: mongoose.Types.ObjectId;
  currentPlanId: mongoose.Types.ObjectId;
  planOverride?: Record<string, any>;
  currentSubscriptionId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  generateVerificationToken(): string;
  generateVerificationCode(): string;
  generateResetToken(): string;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    index: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    index: true,
    sparse: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['pharmacist', 'technician', 'owner', 'admin'],
    default: 'pharmacist',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending',
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    index: { expires: '24h' }
  },
  verificationCode: {
    type: String,
    index: { expires: '24h' }
  },
  resetToken: {
    type: String,
    index: { expires: '1h' }
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    index: true
  },
  currentPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  planOverride: {
    type: Schema.Types.Mixed
  },
  currentSubscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    index: true
  },
  lastLoginAt: Date
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

userSchema.methods.generateVerificationCode = function (): string {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = crypto.createHash('sha256').update(code).digest('hex');
  return code;
};

userSchema.methods.generateResetToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

export default mongoose.model<IUser>('User', userSchema);