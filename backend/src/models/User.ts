import mongoose, { Document, Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

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
  | 'super_admin'
  | 'owner';
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
  workplaceId?: mongoose.Types.ObjectId; // Changed from pharmacyId
  workplaceRole?:
  | 'Owner'
  | 'Staff'
  | 'Pharmacist'
  | 'Cashier'
  | 'Technician'
  | 'Assistant'; // Role within workplace
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

  // Dynamic RBAC fields
  assignedRoles: mongoose.Types.ObjectId[]; // References to Role documents
  directPermissions: string[]; // Explicit permission grants
  deniedPermissions: string[]; // Explicit permission denials
  cachedPermissions?: {
    permissions: string[];
    lastUpdated: Date;
    expiresAt: Date;
    workspaceId?: mongoose.Types.ObjectId;
  }; // Performance optimization cache

  // Role audit fields
  roleLastModifiedBy?: mongoose.Types.ObjectId;
  roleLastModifiedAt?: Date;
  lastPermissionCheck?: Date; // For real-time permission validation

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

  // Notification preferences
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    followUpReminders: boolean;
    criticalAlerts: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
    manualLab?: {
      criticalAlerts: boolean;
      resultNotifications: boolean;
      orderReminders: boolean;
      aiUpdates: boolean;
      weeklyReports: boolean;
    };
  };

  // Theme preference
  themePreference?: 'light' | 'dark' | 'system';

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
        'owner',
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
    workplaceId: {
      // Changed from pharmacyId
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workplace',
      index: true,
    },
    workplaceRole: {
      type: String,
      enum: [
        'Owner',
        'Staff',
        'Pharmacist',
        'Cashier',
        'Technician',
        'Assistant',
      ],
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

    // Dynamic RBAC fields
    assignedRoles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        index: true,
      },
    ],
    directPermissions: [
      {
        type: String,
        index: true,
      },
    ],
    deniedPermissions: [
      {
        type: String,
        index: true,
      },
    ],
    cachedPermissions: {
      permissions: [String],
      lastUpdated: {
        type: Date,
        index: true,
      },
      expiresAt: {
        type: Date,
        index: true,
      },
      workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workplace',
      },
    },
    roleLastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    roleLastModifiedAt: {
      type: Date,
      index: true,
    },
    lastPermissionCheck: {
      type: Date,
      index: true,
    },

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
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: true,
      },
      followUpReminders: {
        type: Boolean,
        default: true,
      },
      criticalAlerts: {
        type: Boolean,
        default: true,
      },
      dailyDigest: {
        type: Boolean,
        default: false,
      },
      weeklyReport: {
        type: Boolean,
        default: false,
      },
    },
    // Theme preference
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
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

// Dynamic RBAC methods
userSchema.methods.getAllRoles = async function (workspaceId?: mongoose.Types.ObjectId): Promise<any[]> {
  const UserRole = mongoose.model('UserRole');
  const query: any = {
    userId: this._id,
    isActive: true,
    $or: [
      { isTemporary: false },
      { isTemporary: true, expiresAt: { $gt: new Date() } },
    ],
  };

  if (workspaceId) {
    query.workspaceId = workspaceId;
  }

  const userRoles = await UserRole.find(query).populate('roleId');
  return userRoles.map((ur: any) => ur.roleId).filter(Boolean);
};

userSchema.methods.getAllPermissions = async function (
  workspaceId?: mongoose.Types.ObjectId,
  useCache: boolean = true
): Promise<string[]> {
  // Check cache first if enabled
  if (useCache && this.cachedPermissions &&
    this.cachedPermissions.lastUpdated > new Date(Date.now() - 5 * 60 * 1000) && // 5 minutes
    (!workspaceId || this.cachedPermissions.workspaceId?.equals(workspaceId))) {
    return this.cachedPermissions.permissions;
  }

  const allPermissions = new Set<string>();

  // Add legacy permissions for backward compatibility
  this.permissions.forEach((permission: string) => allPermissions.add(permission));

  // Add direct permissions
  this.directPermissions.forEach((permission: string) => allPermissions.add(permission));

  // Get permissions from roles
  const roles = await this.getAllRoles(workspaceId);
  for (const role of roles) {
    const rolePermissions = await role.getAllPermissions();
    rolePermissions.forEach((permission: string) => allPermissions.add(permission));
  }

  // Remove denied permissions
  this.deniedPermissions.forEach((permission: string) => allPermissions.delete(permission));

  const finalPermissions = Array.from(allPermissions);

  // Update cache
  this.cachedPermissions = {
    permissions: finalPermissions,
    lastUpdated: new Date(),
    workspaceId: workspaceId,
  };

  return finalPermissions;
};

userSchema.methods.hasRolePermission = async function (
  permission: string,
  workspaceId?: mongoose.Types.ObjectId
): Promise<boolean> {
  // Check if permission is explicitly denied
  if (this.deniedPermissions.includes(permission)) {
    return false;
  }

  // Check direct permissions
  if (this.directPermissions.includes(permission)) {
    return true;
  }

  // Check legacy permissions for backward compatibility
  if (this.permissions.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  const allPermissions = await this.getAllPermissions(workspaceId, true);
  return allPermissions.includes(permission);
};

userSchema.methods.assignRole = async function (
  roleId: mongoose.Types.ObjectId,
  assignedBy: mongoose.Types.ObjectId,
  workspaceId?: mongoose.Types.ObjectId,
  options?: {
    isTemporary?: boolean;
    expiresAt?: Date;
    reason?: string;
  }
): Promise<any> {
  const UserRole = mongoose.model('UserRole');

  // Check if role assignment already exists
  const existingAssignment = await UserRole.findOne({
    userId: this._id,
    roleId: roleId,
    workspaceId: workspaceId,
    isActive: true,
  });

  if (existingAssignment) {
    throw new Error('Role is already assigned to this user');
  }

  const userRole = new UserRole({
    userId: this._id,
    roleId: roleId,
    workspaceId: workspaceId,
    assignedBy: assignedBy,
    lastModifiedBy: assignedBy,
    isTemporary: options?.isTemporary || false,
    expiresAt: options?.expiresAt,
    assignmentReason: options?.reason,
  });

  await userRole.save();

  // Update user's assignedRoles array
  if (!this.assignedRoles.includes(roleId)) {
    this.assignedRoles.push(roleId);
  }

  // Update audit fields
  this.roleLastModifiedBy = assignedBy;
  this.roleLastModifiedAt = new Date();

  // Clear permission cache
  this.cachedPermissions = undefined;

  await this.save();
  return userRole;
};

userSchema.methods.revokeRole = async function (
  roleId: mongoose.Types.ObjectId,
  revokedBy: mongoose.Types.ObjectId,
  workspaceId?: mongoose.Types.ObjectId,
  reason?: string
): Promise<void> {
  const UserRole = mongoose.model('UserRole');

  const userRole = await UserRole.findOne({
    userId: this._id,
    roleId: roleId,
    workspaceId: workspaceId,
    isActive: true,
  });

  if (!userRole) {
    throw new Error('Role assignment not found');
  }

  userRole.revoke(revokedBy, reason);
  await userRole.save();

  // Remove from assignedRoles array if no other active assignments exist
  const otherAssignments = await UserRole.findOne({
    userId: this._id,
    roleId: roleId,
    isActive: true,
    _id: { $ne: userRole._id },
  });

  if (!otherAssignments) {
    this.assignedRoles = this.assignedRoles.filter((id: mongoose.Types.ObjectId) => !id.equals(roleId));
  }

  // Update audit fields
  this.roleLastModifiedBy = revokedBy;
  this.roleLastModifiedAt = new Date();

  // Clear permission cache
  this.cachedPermissions = undefined;

  await this.save();
};

userSchema.methods.grantDirectPermission = function (
  permission: string,
  grantedBy: mongoose.Types.ObjectId
): void {
  if (!this.directPermissions.includes(permission)) {
    this.directPermissions.push(permission);
  }

  // Remove from denied permissions if present
  this.deniedPermissions = this.deniedPermissions.filter((p: string) => p !== permission);

  // Update audit fields
  this.roleLastModifiedBy = grantedBy;
  this.roleLastModifiedAt = new Date();

  // Clear permission cache
  this.cachedPermissions = undefined;
};

userSchema.methods.denyDirectPermission = function (
  permission: string,
  deniedBy: mongoose.Types.ObjectId
): void {
  if (!this.deniedPermissions.includes(permission)) {
    this.deniedPermissions.push(permission);
  }

  // Remove from direct permissions if present
  this.directPermissions = this.directPermissions.filter((p: string) => p !== permission);

  // Update audit fields
  this.roleLastModifiedBy = deniedBy;
  this.roleLastModifiedAt = new Date();

  // Clear permission cache
  this.cachedPermissions = undefined;
};

userSchema.methods.clearPermissionCache = function (): void {
  this.cachedPermissions = undefined;
};

// Additional indexes for dynamic RBAC
userSchema.index({ assignedRoles: 1 });
userSchema.index({ directPermissions: 1 });
userSchema.index({ deniedPermissions: 1 });
userSchema.index({ roleLastModifiedAt: -1 });
userSchema.index({ 'cachedPermissions.lastUpdated': -1 });
userSchema.index({ 'cachedPermissions.workspaceId': 1 });

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

// Pre-save middleware to clear permission cache when roles change
userSchema.pre<IUser>('save', function (next) {
  if (this.isModified('assignedRoles') || this.isModified('directPermissions') || this.isModified('deniedPermissions')) {
    this.cachedPermissions = undefined;
    this.roleLastModifiedAt = new Date();
  }
  next();
});

export default mongoose.model<IUser>('User', userSchema);
