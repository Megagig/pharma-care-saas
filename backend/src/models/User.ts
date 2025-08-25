import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role:
    | 'pharmacist'
    | 'pharmacy_team'
    | 'pharmacy_outlet'
    | 'intern_pharmacist'
    | 'super_admin';
  status:
    | 'pending'
    | 'active'
    | 'suspended'
    | 'license_pending'
    | 'license_rejected';
  emailVerified: boolean;
  verificationToken?: string;
  verificationCode?: string;
  resetToken?: string;
  pharmacyId?: mongoose.Types.ObjectId;
  currentPlanId: mongoose.Types.ObjectId;
  planOverride?: Record<string, any>;
  currentSubscriptionId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;

  // License verification fields
  licenseNumber?: string;
  licenseDocument?: {
    fileName: string;
    filePath: string;
    uploadedAt: Date;
    fileSize: number;
    mimeType: string;
  };
  licenseStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  licenseVerifiedAt?: Date;
  licenseVerifiedBy?: mongoose.Types.ObjectId;
  licenseRejectionReason?: string;

  // Team and hierarchy management
  parentUserId?: mongoose.Types.ObjectId; // For team members under a lead
  teamMembers?: mongoose.Types.ObjectId[]; // For team leads
  permissions: string[]; // Custom permissions array

  // Subscription and access
  subscriptionTier:
    | 'free_trial'
    | 'basic'
    | 'pro'
    | 'pharmily'
    | 'network'
    | 'enterprise';
  trialStartDate?: Date;
  trialEndDate?: Date;
  features: string[]; // Enabled features for this user
  stripeCustomerId?: string; // Stripe customer ID for payment processing

  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
  generateVerificationToken(): string;
  generateVerificationCode(): string;
  generateResetToken(): string;
  hasPermission(permission: string): boolean;
  hasFeature(feature: string): boolean;
}

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    phone: {
      type: String,
      index: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'pharmacist',
        'pharmacy_team',
        'pharmacy_outlet',
        'intern_pharmacist',
        'super_admin',
      ],
      default: 'pharmacist',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'active',
        'suspended',
        'license_pending',
        'license_rejected',
      ],
      default: 'pending',
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      index: { expires: '24h' },
    },
    verificationCode: {
      type: String,
      index: { expires: '24h' },
    },
    resetToken: {
      type: String,
      index: { expires: '1h' },
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      index: true,
    },
    currentPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    planOverride: {
      type: Schema.Types.Mixed,
    },
    currentSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
    },
    lastLoginAt: Date,

    // License verification fields
    licenseNumber: {
      type: String,
      sparse: true,
      index: true,
    },
    licenseDocument: {
      fileName: String,
      filePath: String,
      uploadedAt: Date,
      fileSize: Number,
      mimeType: String,
    },
    licenseStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
      index: true,
    },
    licenseVerifiedAt: Date,
    licenseVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    licenseRejectionReason: String,

    // Team and hierarchy management
    parentUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    permissions: [
      {
        type: String,
        index: true,
      },
    ],

    // Subscription and access
    subscriptionTier: {
      type: String,
      enum: ['free_trial', 'basic', 'pro', 'pharmily', 'network', 'enterprise'],
      default: 'free_trial',
      index: true,
    },
    trialStartDate: Date,
    trialEndDate: Date,
    features: [
      {
        type: String,
        index: true,
      },
    ],
    stripeCustomerId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateVerificationToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return token;
};

userSchema.methods.generateVerificationCode = function (): string {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
  return code;
};

userSchema.methods.generateResetToken = function (): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

userSchema.methods.hasPermission = function (permission: string): boolean {
  return this.permissions.includes(permission) || this.role === 'super_admin';
};

userSchema.methods.hasFeature = function (feature: string): boolean {
  return this.features.includes(feature) || this.role === 'super_admin';
};

// Set license requirements based on role
userSchema.pre<IUser>('save', function (next) {
  if (this.isNew || this.isModified('role')) {
    if (this.role === 'pharmacist' || this.role === 'intern_pharmacist') {
      this.licenseStatus =
        this.licenseStatus === 'not_required' ? 'pending' : this.licenseStatus;
    } else {
      this.licenseStatus = 'not_required';
    }

    // Set trial period for new users
    if (this.isNew && this.subscriptionTier === 'free_trial') {
      this.trialStartDate = new Date();
      this.trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    }
  }
  next();
});

export default mongoose.model<IUser>('User', userSchema);
