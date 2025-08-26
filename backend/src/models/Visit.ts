import mongoose, { Document, Schema } from 'mongoose';
import { tenancyGuardPlugin, addAuditFields } from '../utils/tenancyGuard';

export interface IAttachment {
  kind: 'lab' | 'image' | 'audio' | 'other';
  url: string;
  uploadedAt: Date;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface ISOAPNotes {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface IVisit extends Document {
  _id: mongoose.Types.ObjectId;
  pharmacyId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  date: Date;
  soap: ISOAPNotes;
  attachments?: IAttachment[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema(
  {
    kind: {
      type: String,
      enum: ['lab', 'image', 'audio', 'other'],
      required: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function (value: string) {
          // Basic URL validation
          try {
            new URL(value);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format',
      },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: [255, 'File name too long'],
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative'],
      max: [100 * 1024 * 1024, 'File size cannot exceed 100MB'], // 100MB limit
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: [100, 'MIME type too long'],
    },
  },
  { _id: false }
);

const soapSchema = new Schema(
  {
    subjective: {
      type: String,
      trim: true,
      maxlength: [2000, 'Subjective section cannot exceed 2000 characters'],
    },
    objective: {
      type: String,
      trim: true,
      maxlength: [2000, 'Objective section cannot exceed 2000 characters'],
    },
    assessment: {
      type: String,
      trim: true,
      maxlength: [2000, 'Assessment section cannot exceed 2000 characters'],
    },
    plan: {
      type: String,
      trim: true,
      maxlength: [2000, 'Plan section cannot exceed 2000 characters'],
    },
  },
  { _id: false }
);

const visitSchema = new Schema(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      validate: {
        validator: function (value: Date) {
          // Visit date should not be more than 1 day in the future
          const futureLimit = new Date();
          futureLimit.setDate(futureLimit.getDate() + 1);
          return value <= futureLimit;
        },
        message: 'Visit date cannot be more than 1 day in the future',
      },
      index: true,
    },
    soap: {
      type: soapSchema,
      required: true,
      validate: {
        validator: function (soap: ISOAPNotes) {
          // At least one SOAP section must have content
          return !!(
            soap.subjective ||
            soap.objective ||
            soap.assessment ||
            soap.plan
          );
        },
        message:
          'At least one SOAP section (Subjective, Objective, Assessment, or Plan) must have content',
      },
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator: function (attachments: IAttachment[]) {
          // Maximum 10 attachments per visit
          return attachments.length <= 10;
        },
        message: 'Maximum 10 attachments allowed per visit',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add audit fields (createdBy, updatedBy, isDeleted)
addAuditFields(visitSchema);

// Apply tenancy guard plugin
visitSchema.plugin(tenancyGuardPlugin);

// Indexes for efficient querying
visitSchema.index({ pharmacyId: 1, patientId: 1, date: -1 });
visitSchema.index({ pharmacyId: 1, date: -1 });
visitSchema.index({ pharmacyId: 1, isDeleted: 1 });
visitSchema.index({ createdAt: -1 });

// Virtual to populate patient details
visitSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for visit duration (if we add start/end times later)
visitSchema.virtual('visitDate').get(function (this: IVisit) {
  return this.date.toISOString().split('T')[0]; // YYYY-MM-DD format
});

// Virtual for SOAP completeness
visitSchema.virtual('soapCompleteness').get(function (this: IVisit) {
  let completedSections = 0;
  const totalSections = 4;

  if (this.soap.subjective && this.soap.subjective.trim().length > 0)
    completedSections++;
  if (this.soap.objective && this.soap.objective.trim().length > 0)
    completedSections++;
  if (this.soap.assessment && this.soap.assessment.trim().length > 0)
    completedSections++;
  if (this.soap.plan && this.soap.plan.trim().length > 0) completedSections++;

  return Math.round((completedSections / totalSections) * 100);
});

// Virtual for attachment count by type
visitSchema.virtual('attachmentSummary').get(function (this: IVisit) {
  if (!this.attachments || this.attachments.length === 0) {
    return null;
  }

  const summary = {
    total: this.attachments.length,
    byType: {} as Record<string, number>,
  };

  this.attachments.forEach((attachment) => {
    summary.byType[attachment.kind] =
      (summary.byType[attachment.kind] || 0) + 1;
  });

  return summary;
});

// Virtual for total attachment size
visitSchema.virtual('totalAttachmentSize').get(function (this: IVisit) {
  if (!this.attachments || this.attachments.length === 0) {
    return 0;
  }

  return this.attachments.reduce((total, attachment) => {
    return total + (attachment.fileSize || 0);
  }, 0);
});

// Pre-save validation and normalization
visitSchema.pre('save', function (this: IVisit) {
  // Ensure at least one SOAP section has meaningful content
  const hasContent = !!(
    (this.soap.subjective && this.soap.subjective.trim().length > 5) ||
    (this.soap.objective && this.soap.objective.trim().length > 5) ||
    (this.soap.assessment && this.soap.assessment.trim().length > 5) ||
    (this.soap.plan && this.soap.plan.trim().length > 5)
  );

  if (!hasContent) {
    throw new Error(
      'At least one SOAP section must have meaningful content (minimum 5 characters)'
    );
  }

  // Trim all SOAP sections
  if (this.soap.subjective) this.soap.subjective = this.soap.subjective.trim();
  if (this.soap.objective) this.soap.objective = this.soap.objective.trim();
  if (this.soap.assessment) this.soap.assessment = this.soap.assessment.trim();
  if (this.soap.plan) this.soap.plan = this.soap.plan.trim();

  // Validate attachments
  if (this.attachments && this.attachments.length > 0) {
    this.attachments.forEach((attachment, index) => {
      if (!attachment.uploadedAt) {
        attachment.uploadedAt = new Date();
      }

      // Validate file size for different types
      if (attachment.fileSize) {
        const maxSizes = {
          image: 10 * 1024 * 1024, // 10MB for images
          audio: 50 * 1024 * 1024, // 50MB for audio
          lab: 5 * 1024 * 1024, // 5MB for lab reports
          other: 20 * 1024 * 1024, // 20MB for other files
        };

        const maxSize = maxSizes[attachment.kind] || maxSizes['other'];
        if (attachment.fileSize > maxSize) {
          throw new Error(
            `Attachment ${index + 1} exceeds maximum size for ${
              attachment.kind
            } files`
          );
        }
      }
    });
  }
});

// Static method to find visits for a patient
visitSchema.statics.findByPatient = function (
  patientId: mongoose.Types.ObjectId,
  limit?: number,
  pharmacyId?: mongoose.Types.ObjectId
) {
  const query = { patientId };

  let baseQuery;
  if (pharmacyId) {
    baseQuery = this.find(query).setOptions({ pharmacyId });
  } else {
    baseQuery = this.find(query);
  }

  baseQuery = baseQuery.sort({ date: -1 });

  if (limit) {
    baseQuery = baseQuery.limit(limit);
  }

  return baseQuery;
};

// Static method to find visits by date range
visitSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
  pharmacyId?: mongoose.Types.ObjectId
) {
  const query = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  if (pharmacyId) {
    return this.find(query).setOptions({ pharmacyId }).sort({ date: -1 });
  }
  return this.find(query).sort({ date: -1 });
};

// Static method to find recent visits
visitSchema.statics.findRecent = function (
  days: number = 7,
  pharmacyId?: mongoose.Types.ObjectId
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const query = {
    date: {
      $gte: startDate,
      $lte: new Date(),
    },
  };

  if (pharmacyId) {
    return this.find(query).setOptions({ pharmacyId }).sort({ date: -1 });
  }
  return this.find(query).sort({ date: -1 });
};

// Static method to search visits by SOAP content
visitSchema.statics.searchByContent = function (
  searchTerm: string,
  pharmacyId?: mongoose.Types.ObjectId
) {
  const regex = new RegExp(searchTerm, 'i');
  const query = {
    $or: [
      { 'soap.subjective': regex },
      { 'soap.objective': regex },
      { 'soap.assessment': regex },
      { 'soap.plan': regex },
    ],
  };

  if (pharmacyId) {
    return this.find(query).setOptions({ pharmacyId }).sort({ date: -1 });
  }
  return this.find(query).sort({ date: -1 });
};

// Instance methods
visitSchema.methods.addAttachment = function (
  this: IVisit,
  attachment: Omit<IAttachment, 'uploadedAt'>
): void {
  if (!this.attachments) {
    this.attachments = [];
  }

  if (this.attachments.length >= 10) {
    throw new Error('Maximum 10 attachments allowed per visit');
  }

  this.attachments.push({
    ...attachment,
    uploadedAt: new Date(),
  });
};

visitSchema.methods.removeAttachment = function (
  this: IVisit,
  index: number
): boolean {
  if (this.attachments && index >= 0 && index < this.attachments.length) {
    this.attachments.splice(index, 1);
    return true;
  }
  return false;
};

visitSchema.methods.updateSOAPSection = function (
  this: IVisit,
  section: keyof ISOAPNotes,
  content: string
): void {
  if (!this.soap) {
    this.soap = {};
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length > 2000) {
    throw new Error(`${section} section cannot exceed 2000 characters`);
  }

  this.soap[section] = trimmedContent;
};

visitSchema.methods.isComplete = function (this: IVisit): boolean {
  return this.get('soapCompleteness') === 100;
};

visitSchema.methods.hasAttachments = function (this: IVisit): boolean {
  return !!(this.attachments && this.attachments.length > 0);
};

visitSchema.methods.getAttachmentsByType = function (
  this: IVisit,
  type: string
): IAttachment[] {
  if (!this.attachments) {
    return [];
  }

  return this.attachments.filter((attachment) => attachment.kind === type);
};

visitSchema.methods.getFormattedDate = function (this: IVisit): string {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

visitSchema.methods.getSummary = function (this: IVisit): string {
  const parts = [];

  if (this.soap.subjective) {
    const summary = this.soap.subjective.slice(0, 100);
    parts.push(
      `S: ${summary}${this.soap.subjective.length > 100 ? '...' : ''}`
    );
  }

  if (this.soap.assessment) {
    const summary = this.soap.assessment.slice(0, 100);
    parts.push(
      `A: ${summary}${this.soap.assessment.length > 100 ? '...' : ''}`
    );
  }

  return parts.join(' | ') || 'No summary available';
};

export default mongoose.model<IVisit>('Visit', visitSchema);
