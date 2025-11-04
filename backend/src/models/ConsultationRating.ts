import mongoose, { Document, Schema } from 'mongoose';
import { tenancyGuardPlugin, addAuditFields } from '../utils/tenancyGuard';

export interface IConsultationRating extends Document {
  _id: mongoose.Types.ObjectId;
  workplaceId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  pharmacistId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  
  // Rating details
  overallRating: number; // 1-5 stars
  feedback?: string;
  
  // Category ratings
  categories: {
    professionalism: number; // 1-5
    communication: number; // 1-5
    expertise: number; // 1-5
    timeliness: number; // 1-5
    environment: number; // 1-5 (pharmacy environment/cleanliness)
    satisfaction: number; // 1-5 (overall satisfaction with service)
  };
  
  // Additional feedback options
  recommendToOthers: boolean;
  wouldReturnAgain: boolean;
  serviceType: 'consultation' | 'medication_review' | 'health_screening' | 'follow_up' | 'general_service';
  
  // Privacy settings
  isAnonymous: boolean;
  allowPublicDisplay: boolean; // Allow displaying on public reviews
  
  // Response from pharmacist/staff
  response?: {
    text: string;
    respondedBy: mongoose.Types.ObjectId; // ref: User
    respondedAt: Date;
    isPublic: boolean; // Whether response is visible to other patients
  };
  
  // Metadata
  ratingSource: 'patient_portal' | 'sms' | 'email' | 'in_person' | 'phone_call';
  ipAddress?: string;
  userAgent?: string;
  
  // Status and moderation
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderationNotes?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  
  // Helpful votes (for public reviews)
  helpfulVotes: {
    helpful: number;
    notHelpful: number;
    voters: mongoose.Types.ObjectId[]; // Track who voted to prevent duplicate votes
  };
  
  // Audit fields
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateAverageRating(): number;
  addResponse(responseText: string, respondedBy: mongoose.Types.ObjectId, isPublic?: boolean): void;
  addHelpfulVote(userId: mongoose.Types.ObjectId, isHelpful: boolean): boolean;
  canBeDisplayedPublicly(): boolean;
  getDisplayName(): string;
  moderate(status: 'approved' | 'rejected' | 'flagged', moderatedBy: mongoose.Types.ObjectId, notes?: string): void;
}

const consultationRatingSchema = new Schema(
  {
    workplaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workplace',
      required: [true, 'Workplace ID is required'],
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    pharmacistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pharmacist ID is required'],
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    
    overallRating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: function (value: number) {
          return Number.isInteger(value);
        },
        message: 'Rating must be a whole number',
      },
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    
    categories: {
      professionalism: {
        type: Number,
        required: [true, 'Professionalism rating is required'],
        min: [1, 'Professionalism rating must be at least 1'],
        max: [5, 'Professionalism rating cannot exceed 5'],
        validate: {
          validator: function (value: number) {
            return Number.isInteger(value);
          },
          message: 'Professionalism rating must be a whole number',
        },
      },
      communication: {
        type: Number,
        required: [true, 'Communication rating is required'],
        min: [1, 'Communication rating must be at least 1'],
        max: [5, 'Communication rating cannot exceed 5'],
        validate: {
          validator: function (value: number) {
            return Number.isInteger(value);
          },
          message: 'Communication rating must be a whole number',
        },
      },
      expertise: {
        type: Number,
        required: [true, 'Expertise rating is required'],
        min: [1, 'Expertise rating must be at least 1'],
        max: [5, 'Expertise rating cannot exceed 5'],
        validate: {
          validator: function (value: number) {
            return Number.isInteger(value);
          },
          message: 'Expertise rating must be a whole number',
        },
      },
      timeliness: {
        type: Number,
        required: [true, 'Timeliness rating is required'],
        min: [1, 'Timeliness rating must be at least 1'],
        max: [5, 'Timeliness rating cannot exceed 5'],
        validate: {
          validator: function (value: number) {
            return Number.isInteger(value);
          },
          message: 'Timeliness rating must be a whole number',
        },
      },
      environment: {
        type: Number,
        required: [true, 'Environment rating is required'],
        min: [1, 'Environment rating must be at least 1'],
        max: [5, 'Environment rating cannot exceed 5'],
        validate: {
          validator: function (value: number) {
            return Number.isInteger(value);
          },
          message: 'Environment rating must be a whole number',
        },
      },
      satisfaction: {
        type: Number,
        required: [true, 'Satisfaction rating is required'],
        min: [1, 'Satisfaction rating must be at least 1'],
        max: [5, 'Satisfaction rating cannot exceed 5'],
        validate: {
          validator: function (value: number) {
            return Number.isInteger(value);
          },
          message: 'Satisfaction rating must be a whole number',
        },
      },
    },
    
    recommendToOthers: {
      type: Boolean,
      required: [true, 'Recommendation preference is required'],
    },
    wouldReturnAgain: {
      type: Boolean,
      required: [true, 'Return preference is required'],
    },
    serviceType: {
      type: String,
      enum: {
        values: ['consultation', 'medication_review', 'health_screening', 'follow_up', 'general_service'],
        message: 'Invalid service type',
      },
      required: [true, 'Service type is required'],
      index: true,
    },
    
    isAnonymous: {
      type: Boolean,
      default: false,
      required: true,
    },
    allowPublicDisplay: {
      type: Boolean,
      default: false,
      required: true,
    },
    
    response: {
      text: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Response cannot exceed 1000 characters'],
      },
      respondedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      respondedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
    
    ratingSource: {
      type: String,
      enum: {
        values: ['patient_portal', 'sms', 'email', 'in_person', 'phone_call'],
        message: 'Invalid rating source',
      },
      default: 'patient_portal',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      validate: {
        validator: function (ip: string) {
          if (!ip) return true; // Optional field
          // Basic IP validation (IPv4 and IPv6)
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          return ipv4Regex.test(ip) || ipv6Regex.test(ip);
        },
        message: 'Invalid IP address format',
      },
    },
    userAgent: {
      type: String,
      maxlength: [500, 'User agent cannot exceed 500 characters'],
    },
    
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'flagged'],
        message: 'Invalid status',
      },
      default: 'pending',
      required: true,
      index: true,
    },
    moderationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Moderation notes cannot exceed 500 characters'],
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: Date,
    
    helpfulVotes: {
      helpful: {
        type: Number,
        default: 0,
        min: [0, 'Helpful votes cannot be negative'],
      },
      notHelpful: {
        type: Number,
        default: 0,
        min: [0, 'Not helpful votes cannot be negative'],
      },
      voters: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        default: [],
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add audit fields
addAuditFields(consultationRatingSchema);

// Apply tenancy guard plugin
consultationRatingSchema.plugin(tenancyGuardPlugin);

// Compound indexes for efficient querying
consultationRatingSchema.index({ workplaceId: 1, pharmacistId: 1, status: 1 });
consultationRatingSchema.index({ workplaceId: 1, patientId: 1, createdAt: -1 });
consultationRatingSchema.index({ workplaceId: 1, overallRating: -1, status: 1 });
consultationRatingSchema.index({ workplaceId: 1, serviceType: 1, status: 1 });
consultationRatingSchema.index({ workplaceId: 1, allowPublicDisplay: 1, status: 1 });
consultationRatingSchema.index({ appointmentId: 1 }, { sparse: true });
consultationRatingSchema.index({ createdAt: -1 });

// Ensure one rating per patient per appointment (if appointmentId exists)
consultationRatingSchema.index(
  { workplaceId: 1, patientId: 1, appointmentId: 1 },
  { 
    unique: true, 
    sparse: true, // Allow multiple documents with null appointmentId
    partialFilterExpression: { appointmentId: { $exists: true } }
  }
);

// Virtual for patient details
consultationRatingSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for pharmacist details
consultationRatingSchema.virtual('pharmacist', {
  ref: 'User',
  localField: 'pharmacistId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for appointment details
consultationRatingSchema.virtual('appointment', {
  ref: 'Appointment',
  localField: 'appointmentId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for average category rating
consultationRatingSchema.virtual('averageCategoryRating').get(function (this: IConsultationRating) {
  const categories = this.categories;
  const total = categories.professionalism + categories.communication + 
                categories.expertise + categories.timeliness + 
                categories.environment + categories.satisfaction;
  return Math.round((total / 6) * 10) / 10; // Round to 1 decimal place
});

// Virtual for total helpful votes
consultationRatingSchema.virtual('totalHelpfulVotes').get(function (this: IConsultationRating) {
  return this.helpfulVotes.helpful + this.helpfulVotes.notHelpful;
});

// Virtual for helpful percentage
consultationRatingSchema.virtual('helpfulPercentage').get(function (this: IConsultationRating) {
  const total = this.get('totalHelpfulVotes');
  if (total === 0) return 0;
  return Math.round((this.helpfulVotes.helpful / total) * 100);
});

// Virtual for display rating (for public display)
consultationRatingSchema.virtual('displayRating').get(function (this: IConsultationRating) {
  return {
    overall: this.overallRating,
    average: this.get('averageCategoryRating'),
    categories: this.categories,
    feedback: this.allowPublicDisplay ? this.feedback : undefined,
    serviceType: this.serviceType,
    createdAt: this.createdAt,
    response: this.response?.isPublic ? this.response : undefined,
    helpful: this.helpfulVotes.helpful,
    total: this.get('totalHelpfulVotes'),
  };
});

// Pre-save middleware
consultationRatingSchema.pre('save', function (this: IConsultationRating) {
  // Auto-approve ratings from verified sources if no explicit moderation needed
  if (this.isNew && this.status === 'pending') {
    if (this.ratingSource === 'patient_portal' && !this.feedback) {
      this.status = 'approved';
    }
  }
  
  // Set moderation timestamp when status changes
  if (this.isModified('status') && this.status !== 'pending') {
    this.moderatedAt = new Date();
  }
  
  // Validate that overall rating aligns reasonably with category average
  const categoryAverage = this.get('averageCategoryRating');
  const difference = Math.abs(this.overallRating - categoryAverage);
  
  if (difference > 2) {
    console.warn(`Large discrepancy between overall rating (${this.overallRating}) and category average (${categoryAverage})`);
  }
});

// Instance method to calculate average rating
consultationRatingSchema.methods.calculateAverageRating = function (this: IConsultationRating): number {
  return this.get('averageCategoryRating');
};

// Instance method to add response
consultationRatingSchema.methods.addResponse = function (
  this: IConsultationRating,
  responseText: string,
  respondedBy: mongoose.Types.ObjectId,
  isPublic: boolean = true
): void {
  this.response = {
    text: responseText,
    respondedBy,
    respondedAt: new Date(),
    isPublic,
  };
};

// Instance method to add helpful vote
consultationRatingSchema.methods.addHelpfulVote = function (
  this: IConsultationRating,
  userId: mongoose.Types.ObjectId,
  isHelpful: boolean
): boolean {
  // Check if user has already voted
  if (this.helpfulVotes.voters.includes(userId)) {
    return false; // User has already voted
  }
  
  // Add vote
  if (isHelpful) {
    this.helpfulVotes.helpful += 1;
  } else {
    this.helpfulVotes.notHelpful += 1;
  }
  
  this.helpfulVotes.voters.push(userId);
  return true; // Vote added successfully
};

// Instance method to check if can be displayed publicly
consultationRatingSchema.methods.canBeDisplayedPublicly = function (this: IConsultationRating): boolean {
  return this.allowPublicDisplay && 
         this.status === 'approved' && 
         !this.isDeleted;
};

// Instance method to get display name
consultationRatingSchema.methods.getDisplayName = function (this: IConsultationRating): string {
  if (this.isAnonymous) {
    return 'Anonymous Patient';
  }
  
  // This would typically be populated from the patient relationship
  return 'Patient'; // Placeholder - would be replaced with actual patient name
};

// Instance method to moderate rating
consultationRatingSchema.methods.moderate = function (
  this: IConsultationRating,
  status: 'approved' | 'rejected' | 'flagged',
  moderatedBy: mongoose.Types.ObjectId,
  notes?: string
): void {
  this.status = status;
  this.moderatedBy = moderatedBy;
  this.moderatedAt = new Date();
  if (notes) {
    this.moderationNotes = notes;
  }
};

// Static method to get ratings for pharmacist
consultationRatingSchema.statics.getPharmacistRatings = function (
  pharmacistId: mongoose.Types.ObjectId,
  workplaceId: mongoose.Types.ObjectId,
  options?: {
    status?: string;
    serviceType?: string;
    limit?: number;
    skip?: number;
    publicOnly?: boolean;
  }
) {
  const query: any = {
    pharmacistId,
    workplaceId,
  };
  
  if (options?.status) {
    query.status = options.status;
  } else {
    query.status = 'approved'; // Default to approved ratings
  }
  
  if (options?.serviceType) {
    query.serviceType = options.serviceType;
  }
  
  if (options?.publicOnly) {
    query.allowPublicDisplay = true;
  }
  
  let queryBuilder = this.find(query)
    .populate('patient', 'firstName lastName')
    .sort({ createdAt: -1 });
  
  if (options?.skip) {
    queryBuilder = queryBuilder.skip(options.skip);
  }
  
  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder;
};

// Static method to get rating statistics
consultationRatingSchema.statics.getRatingStatistics = function (
  pharmacistId: mongoose.Types.ObjectId,
  workplaceId: mongoose.Types.ObjectId,
  options?: {
    serviceType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  const matchStage: any = {
    pharmacistId,
    workplaceId,
    status: 'approved',
  };
  
  if (options?.serviceType) {
    matchStage.serviceType = options.serviceType;
  }
  
  if (options?.dateFrom || options?.dateTo) {
    matchStage.createdAt = {};
    if (options.dateFrom) {
      matchStage.createdAt.$gte = options.dateFrom;
    }
    if (options.dateTo) {
      matchStage.createdAt.$lte = options.dateTo;
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageOverallRating: { $avg: '$overallRating' },
        averageProfessionalism: { $avg: '$categories.professionalism' },
        averageCommunication: { $avg: '$categories.communication' },
        averageExpertise: { $avg: '$categories.expertise' },
        averageTimeliness: { $avg: '$categories.timeliness' },
        averageEnvironment: { $avg: '$categories.environment' },
        averageSatisfaction: { $avg: '$categories.satisfaction' },
        recommendationRate: { $avg: { $cond: ['$recommendToOthers', 1, 0] } },
        returnRate: { $avg: { $cond: ['$wouldReturnAgain', 1, 0] } },
        ratingDistribution: {
          $push: '$overallRating'
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalRatings: 1,
        averageOverallRating: { $round: ['$averageOverallRating', 1] },
        categoryAverages: {
          professionalism: { $round: ['$averageProfessionalism', 1] },
          communication: { $round: ['$averageCommunication', 1] },
          expertise: { $round: ['$averageExpertise', 1] },
          timeliness: { $round: ['$averageTimeliness', 1] },
          environment: { $round: ['$averageEnvironment', 1] },
          satisfaction: { $round: ['$averageSatisfaction', 1] },
        },
        recommendationRate: { $round: [{ $multiply: ['$recommendationRate', 100] }, 1] },
        returnRate: { $round: [{ $multiply: ['$returnRate', 100] }, 1] },
        ratingDistribution: 1,
      },
    },
  ]);
};

// Static method to get recent ratings for dashboard
consultationRatingSchema.statics.getRecentRatings = function (
  workplaceId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({
    workplaceId,
    status: 'approved',
  })
    .populate('patient', 'firstName lastName')
    .populate('pharmacist', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('overallRating feedback serviceType createdAt isAnonymous');
};

export default mongoose.model<IConsultationRating>('ConsultationRating', consultationRatingSchema);