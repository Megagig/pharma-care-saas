import mongoose, { Document, Schema } from 'mongoose';
import {
  tenancyGuardPlugin,
  addAuditFields,
  DTP_TYPES,
} from '../utils/tenancyGuard';

export interface IDrugTherapyProblem extends Document {
  _id: mongoose.Types.ObjectId;
  pharmacyId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  visitId?: mongoose.Types.ObjectId;
  type:
    | 'unnecessary'
    | 'wrongDrug'
    | 'doseTooLow'
    | 'doseTooHigh'
    | 'adverseReaction'
    | 'inappropriateAdherence'
    | 'needsAdditional';
  description?: string;
  status: 'unresolved' | 'resolved';
  resolvedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const drugTherapyProblemSchema = new Schema(
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
    visitId: {
      type: Schema.Types.ObjectId,
      ref: 'Visit',
      index: true,
    },
    type: {
      type: String,
      enum: DTP_TYPES,
      required: [true, 'DTP type is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['unresolved', 'resolved'],
      default: 'unresolved',
      required: true,
      index: true,
    },
    resolvedAt: {
      type: Date,
      validate: {
        validator: function (this: IDrugTherapyProblem, value: Date) {
          if (value) {
            // Resolved date cannot be before creation
            return value >= this.createdAt;
          }
          return true;
        },
        message: 'Resolved date cannot be before DTP creation',
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
addAuditFields(drugTherapyProblemSchema);

// Apply tenancy guard plugin
drugTherapyProblemSchema.plugin(tenancyGuardPlugin);

// Indexes for efficient querying
drugTherapyProblemSchema.index({ pharmacyId: 1, patientId: 1, status: 1 });
drugTherapyProblemSchema.index({ pharmacyId: 1, type: 1 });
drugTherapyProblemSchema.index({ pharmacyId: 1, visitId: 1 });
drugTherapyProblemSchema.index({ pharmacyId: 1, isDeleted: 1 });
drugTherapyProblemSchema.index({ status: 1, createdAt: -1 });
drugTherapyProblemSchema.index({ resolvedAt: -1 }, { sparse: true });
drugTherapyProblemSchema.index({ createdAt: -1 });

// Virtual to populate patient details
drugTherapyProblemSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate visit details
drugTherapyProblemSchema.virtual('visit', {
  ref: 'Visit',
  localField: 'visitId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for resolution duration
drugTherapyProblemSchema
  .virtual('resolutionDurationDays')
  .get(function (this: IDrugTherapyProblem) {
    if (this.resolvedAt && this.createdAt) {
      const diffTime = Math.abs(
        this.resolvedAt.getTime() - this.createdAt.getTime()
      );
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
  });

// Virtual for DTP severity based on type
drugTherapyProblemSchema
  .virtual('severity')
  .get(function (this: IDrugTherapyProblem) {
    const severityMap = {
      adverseReaction: 'high',
      wrongDrug: 'high',
      doseTooHigh: 'medium',
      doseTooLow: 'medium',
      unnecessary: 'medium',
      inappropriateAdherence: 'medium',
      needsAdditional: 'low',
    };

    return severityMap[this.type] || 'medium';
  });

// Virtual for human-readable type
drugTherapyProblemSchema
  .virtual('typeDisplay')
  .get(function (this: IDrugTherapyProblem) {
    const typeMap = {
      unnecessary: 'Unnecessary Medication',
      wrongDrug: 'Wrong Drug/Indication',
      doseTooLow: 'Dose Too Low',
      doseTooHigh: 'Dose Too High',
      adverseReaction: 'Adverse Reaction',
      inappropriateAdherence: 'Inappropriate Adherence',
      needsAdditional: 'Needs Additional Medication',
    };

    return typeMap[this.type] || this.type;
  });

// Pre-save validation and business logic
drugTherapyProblemSchema.pre('save', function (this: IDrugTherapyProblem) {
  // Auto-set resolvedAt when status changes to resolved
  if (
    this.isModified('status') &&
    this.status === 'resolved' &&
    !this.resolvedAt
  ) {
    this.resolvedAt = new Date();
  }

  // Clear resolvedAt when status changes back to unresolved
  if (this.isModified('status') && this.status === 'unresolved') {
    this.resolvedAt = undefined;
  }

  // Ensure high-severity DTPs have descriptions
  const highSeverityTypes = ['adverseReaction', 'wrongDrug'];
  if (
    highSeverityTypes.includes(this.type) &&
    (!this.description || this.description.trim().length < 10)
  ) {
    throw new Error(
      `DTP type '${this.type}' requires detailed description (minimum 10 characters)`
    );
  }
});

// Post-save hook to update patient's hasActiveDTP flag
drugTherapyProblemSchema.post(
  'save',
  async function (this: IDrugTherapyProblem) {
    try {
      const Patient = mongoose.model('Patient');

      // Count active DTPs for this patient
      const activeDTPCount = await mongoose
        .model('DrugTherapyProblem')
        .countDocuments({
          patientId: this.patientId,
          pharmacyId: this.pharmacyId,
          status: 'unresolved',
          isDeleted: { $ne: true },
        });

      // Update patient's hasActiveDTP flag
      await Patient.findByIdAndUpdate(
        this.patientId,
        { hasActiveDTP: activeDTPCount > 0 },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating patient hasActiveDTP flag:', error);
    }
  }
);

// Static method to find DTPs for a patient
drugTherapyProblemSchema.statics.findByPatient = function (
  patientId: mongoose.Types.ObjectId,
  status?: string,
  pharmacyId?: mongoose.Types.ObjectId
) {
  const query: any = { patientId };
  if (status) {
    query.status = status;
  }

  const baseQuery = pharmacyId
    ? this.find(query).setOptions({ pharmacyId })
    : this.find(query);
  return baseQuery.sort({ status: 1, createdAt: -1 }); // Show unresolved first
};

// Static method to find DTPs by type
drugTherapyProblemSchema.statics.findByType = function (
  type: string,
  status?: string,
  pharmacyId?: mongoose.Types.ObjectId
) {
  const query: any = { type };
  if (status) {
    query.status = status;
  }

  const baseQuery = pharmacyId
    ? this.find(query).setOptions({ pharmacyId })
    : this.find(query);
  return baseQuery.sort({ createdAt: -1 });
};

// Static method to find unresolved DTPs
drugTherapyProblemSchema.statics.findUnresolved = function (
  pharmacyId?: mongoose.Types.ObjectId
) {
  const query = { status: 'unresolved' };

  const baseQuery = pharmacyId
    ? this.find(query).setOptions({ pharmacyId })
    : this.find(query);
  return baseQuery.sort({ createdAt: -1 });
};

// Static method to get DTP statistics
drugTherapyProblemSchema.statics.getStatistics = async function (
  pharmacyId?: mongoose.Types.ObjectId,
  dateRange?: { start: Date; end: Date }
) {
  const matchStage: any = {};

  if (pharmacyId) {
    matchStage.pharmacyId = pharmacyId;
  }

  if (dateRange) {
    matchStage.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalDTPs: { $sum: 1 },
        unresolvedDTPs: {
          $sum: { $cond: [{ $eq: ['$status', 'unresolved'] }, 1, 0] },
        },
        resolvedDTPs: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
        },
        dtpsByType: {
          $push: {
            type: '$type',
            status: '$status',
          },
        },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'resolved'] },
              {
                $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60 * 24, // Convert to days
                ],
              },
              null,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalDTPs: 1,
        unresolvedDTPs: 1,
        resolvedDTPs: 1,
        resolutionRate: {
          $cond: [
            { $gt: ['$totalDTPs', 0] },
            { $multiply: [{ $divide: ['$resolvedDTPs', '$totalDTPs'] }, 100] },
            0,
          ],
        },
        avgResolutionTimeDays: { $round: ['$avgResolutionTime', 1] },
        dtpsByType: 1,
      },
    },
  ];

  const result = await this.aggregate(pipeline);
  return (
    result[0] || {
      totalDTPs: 0,
      unresolvedDTPs: 0,
      resolvedDTPs: 0,
      resolutionRate: 0,
      avgResolutionTimeDays: 0,
      dtpsByType: [],
    }
  );
};

// Instance methods
drugTherapyProblemSchema.methods.resolve = function (
  this: IDrugTherapyProblem,
  resolvedBy?: mongoose.Types.ObjectId
): void {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  if (resolvedBy) {
    this.updatedBy = resolvedBy;
  }
};

drugTherapyProblemSchema.methods.reopen = function (
  this: IDrugTherapyProblem,
  reopenedBy?: mongoose.Types.ObjectId
): void {
  this.status = 'unresolved';
  this.resolvedAt = undefined;
  if (reopenedBy) {
    this.updatedBy = reopenedBy;
  }
};

drugTherapyProblemSchema.methods.isHighSeverity = function (
  this: IDrugTherapyProblem
): boolean {
  return ['adverseReaction', 'wrongDrug'].includes(this.type);
};

drugTherapyProblemSchema.methods.isOverdue = function (
  this: IDrugTherapyProblem
): boolean {
  if (this.status === 'resolved') return false;

  const daysSinceCreation = Math.floor(
    (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Consider high severity DTPs overdue after 1 day, others after 7 days
  const overdueThreshold = this.get('severity') === 'high' ? 1 : 7;

  return daysSinceCreation > overdueThreshold;
};

export default mongoose.model<IDrugTherapyProblem>(
  'DrugTherapyProblem',
  drugTherapyProblemSchema
);
