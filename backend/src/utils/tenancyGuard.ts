import mongoose from 'mongoose';

/**
 * Tenancy Guard Plugin
 * Automatically injects pharmacyId and isDeleted: false filters to all queries
 * Ensures multi-tenant data isolation and soft delete behavior
 */
export interface TenancyOptions {
  pharmacyIdField?: string;
  softDeleteField?: string;
}

export function tenancyGuardPlugin(
  schema: mongoose.Schema,
  options: TenancyOptions = {}
) {
  const pharmacyIdField = options.pharmacyIdField || 'pharmacyId';
  const softDeleteField = options.softDeleteField || 'isDeleted';

  // Pre-hook for find operations to auto-inject tenant and soft delete filters
  schema.pre(/^find/, function (this: mongoose.Query<any, any>) {
    // Only add filters if they haven't been explicitly set
    const filter = this.getFilter();

    // Add pharmacyId filter if not already present and if pharmacyId exists in context
    if (!filter.hasOwnProperty(pharmacyIdField)) {
      const pharmacyId = this.getOptions().pharmacyId;
      if (pharmacyId) {
        this.where({ [pharmacyIdField]: pharmacyId });
      }
    }

    // Add soft delete filter if not already present
    if (!filter.hasOwnProperty(softDeleteField)) {
      this.where({ [softDeleteField]: { $ne: true } });
    }
  });

  // Pre-hook for aggregate operations
  schema.pre('aggregate', function (this: mongoose.Aggregate<any>) {
    const pipeline = this.pipeline();
    const hasMatchStage = pipeline.some((stage: any) => stage.$match);

    if (!hasMatchStage) {
      // Add $match stage at the beginning if none exists
      const matchStage = {
        $match: {
          [softDeleteField]: { $ne: true },
        },
      };

      const pharmacyId = this.options.pharmacyId;
      if (pharmacyId) {
        matchStage.$match[pharmacyIdField] = pharmacyId;
      }

      this.pipeline().unshift(matchStage);
    }
  });

  // Instance method to bypass tenancy guard for admin operations
  schema.methods.findWithoutTenancyGuard = function () {
    return (this.constructor as any)
      .find()
      .setOptions({ bypassTenancyGuard: true });
  };

  // Static method to set pharmacy context for queries
  schema.statics.withPharmacy = function (pharmacyId: mongoose.Types.ObjectId) {
    return this.find().setOptions({ pharmacyId });
  };

  // Static method to include soft-deleted records
  schema.statics.withDeleted = function () {
    return this.find().setOptions({ includeSoftDeleted: true });
  };

  // Override the pre-hook behavior when bypassTenancyGuard is set
  schema.pre(/^find/, function (this: mongoose.Query<any, any>) {
    const options = this.getOptions();

    if (options.bypassTenancyGuard) {
      return; // Skip tenancy guard
    }

    if (options.includeSoftDeleted) {
      // Only add pharmacyId filter, skip soft delete filter
      const filter = this.getFilter();
      if (!filter.hasOwnProperty(pharmacyIdField) && options.pharmacyId) {
        this.where({ [pharmacyIdField]: options.pharmacyId });
      }
    }
  });
}

// Helper function to add audit fields to schema
export function addAuditFields(schema: mongoose.Schema) {
  schema.add({
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  });

  // Auto-set updatedBy on save
  schema.pre('save', function (this: any) {
    if (this.isModified() && !this.isNew) {
      // updatedBy should be set by the controller/middleware
      // This is just a fallback
      if (!this.updatedBy && this.modifiedBy) {
        this.updatedBy = this.modifiedBy;
      }
    }
  });
}

// Helper to generate MRN
export function generateMRN(pharmacyCode: string, sequence: number): string {
  return `PHM-${pharmacyCode}-${sequence.toString().padStart(5, '0')}`;
}

// Nigerian states and LGAs for validation
export const NIGERIAN_STATES = [
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
  'FCT',
];

// Common blood groups and genotypes
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC'];
export const MARITAL_STATUS = ['single', 'married', 'divorced', 'widowed'];
export const GENDERS = ['male', 'female', 'other'];
export const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'];
export const DTP_TYPES = [
  'unnecessary',
  'wrongDrug',
  'doseTooLow',
  'doseTooHigh',
  'adverseReaction',
  'inappropriateAdherence',
  'needsAdditional',
  'interaction',
  'duplication',
  'contraindication',
  'monitoring',
];

export const DTP_CATEGORIES = [
  'indication',
  'effectiveness',
  'safety',
  'adherence',
];

export const DTP_SEVERITIES = [
  'critical',
  'major',
  'moderate',
  'minor',
];

export const EVIDENCE_LEVELS = [
  'definite',
  'probable',
  'possible',
  'unlikely',
];
