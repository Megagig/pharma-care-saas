import mongoose, { Document, Schema } from 'mongoose';

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
  next();
});

// Indexes
workplaceSchema.index({ ownerId: 1 });
workplaceSchema.index({ inviteCode: 1 }, { unique: true });
workplaceSchema.index({ name: 'text', type: 'text' });

export default mongoose.model<IWorkplace>('Workplace', workplaceSchema);
