import mongoose, { Document, Schema } from 'mongoose';

export interface LocationInfo {
  id: string;
  name: string;
  address: string;
  isPrimary: boolean;
  metadata?: Record<string, any>;
}

export interface WorkspaceStats {
  patientsCount: number;
  usersCount: number;
  storageUsed?: number; // in MB
  apiCallsThisMonth?: number;
  lastUpdated: Date;
}

export interface WorkspaceSettings {
  maxPendingInvites: number;
  allowSharedPatients: boolean;
}

export interface IWorkplace extends Document {
  name: string;
  type:
  | 'Community'
  | 'Hospital'
  | 'Academia'
  | 'Industry'
  | 'Regulatory Body'
  | 'Other';
  licenseNumber: string;
  email: string;
  phone?: string;
  address?: string;
  state?: string;
  lga?: string;
  ownerId: mongoose.Types.ObjectId;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  documents: Array<{
    kind: string;
    url: string;
    uploadedAt: Date;
  }>;
  logoUrl?: string;
  inviteCode: string; // Unique code for staff to join
  teamMembers: mongoose.Types.ObjectId[]; // Array of user IDs who are part of this workplace

  // New subscription fields
  currentSubscriptionId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId; // Alias for currentSubscriptionId for backward compatibility
  currentPlanId?: mongoose.Types.ObjectId;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'expired' | 'canceled';
  trialStartDate?: Date;
  trialEndDate?: Date;

  // Usage statistics
  stats: WorkspaceStats;

  // Multi-location support
  locations: LocationInfo[];

  // Configuration
  settings: WorkspaceSettings;

  createdAt: Date;
  updatedAt: Date;
}

const nigerianStates = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const workplaceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Workplace name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'Community',
        'Hospital',
        'Academia',
        'Industry',
        'Regulatory Body',
        'Other',
      ],
      required: [true, 'Workplace type is required'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Workplace email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      enum: nigerianStates,
    },
    lga: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    documents: [
      {
        kind: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    logoUrl: String,
    inviteCode: {
      type: String,
      unique: true,
      index: true,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // New subscription fields
    currentSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
    },
    currentPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'expired', 'canceled'],
      default: 'trial',
      index: true,
    },
    trialStartDate: {
      type: Date,
      index: true,
    },
    trialEndDate: {
      type: Date,
      index: true,
    },

    // Usage statistics
    stats: {
      patientsCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      usersCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Multi-location support
    locations: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        address: {
          type: String,
          required: true,
          trim: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],

    // Configuration
    settings: {
      maxPendingInvites: {
        type: Number,
        default: 20,
        min: 1,
        max: 100,
      },
      allowSharedPatients: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Generate unique invite code before saving
workplaceSchema.pre('save', async function (next) {
  if (this.isNew && !this.inviteCode) {
    // Generate a 6-8 character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }

      // Check if this code already exists
      const existing = await (this.constructor as any).findOne({
        inviteCode: result,
      });
      if (!existing) {
        this.inviteCode = result;
        break;
      }
      attempts++;
    }

    if (!this.inviteCode) {
      // Fallback: use timestamp-based code
      this.inviteCode = 'WRK' + Date.now().toString().slice(-6);
    }
  }

  // Initialize trial period for new workspaces
  if (this.isNew && !this.trialStartDate) {
    const now = new Date();
    this.trialStartDate = now;
    this.trialEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    this.subscriptionStatus = 'trial';
  }

  // Initialize stats if not present
  if (this.isNew && !this.stats) {
    this.stats = {
      patientsCount: 0,
      usersCount: 1, // Owner is the first user
      lastUpdated: new Date(),
    };
  }

  // Initialize settings if not present
  if (this.isNew && !this.settings) {
    this.settings = {
      maxPendingInvites: 20,
      allowSharedPatients: false,
    };
  }

  // Initialize locations with primary location if not present
  if (this.isNew && (!this.locations || this.locations.length === 0)) {
    this.locations = [
      {
        id: 'primary',
        name: this.name,
        address: this.address || 'Main Location',
        isPrimary: true,
        metadata: {},
      },
    ];
  }

  next();
});

// Indexes
workplaceSchema.index({ ownerId: 1 });
workplaceSchema.index({ inviteCode: 1 }, { unique: true });
workplaceSchema.index({ name: 'text', type: 'text' });
workplaceSchema.index({ currentSubscriptionId: 1 });
workplaceSchema.index({ subscriptionStatus: 1 });
workplaceSchema.index({ trialEndDate: 1 });
workplaceSchema.index({ 'stats.lastUpdated': 1 });

// Virtual property for backward compatibility
workplaceSchema.virtual('subscriptionId').get(function () {
  return this.currentSubscriptionId;
});

workplaceSchema.virtual('subscriptionId').set(function (value) {
  this.currentSubscriptionId = value;
});

// Ensure virtual fields are serialized
workplaceSchema.set('toJSON', { virtuals: true });
workplaceSchema.set('toObject', { virtuals: true });

const Workplace = mongoose.model<IWorkplace>('Workplace', workplaceSchema);

export { Workplace };
export default Workplace;
