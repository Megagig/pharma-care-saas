"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedTenancyGuard = exports.EVIDENCE_LEVELS = exports.DTP_SEVERITIES = exports.DTP_CATEGORIES = exports.DTP_TYPES = exports.SEVERITY_LEVELS = exports.GENDERS = exports.MARITAL_STATUS = exports.GENOTYPES = exports.BLOOD_GROUPS = exports.NIGERIAN_STATES = void 0;
exports.tenancyGuardPlugin = tenancyGuardPlugin;
exports.addAuditFields = addAuditFields;
exports.generateMRN = generateMRN;
const mongoose_1 = __importDefault(require("mongoose"));
function tenancyGuardPlugin(schema, options = {}) {
    const pharmacyIdField = options.pharmacyIdField || 'pharmacyId';
    const softDeleteField = options.softDeleteField || 'isDeleted';
    schema.pre(/^find/, function () {
        const filter = this.getFilter();
        if (!filter.hasOwnProperty(pharmacyIdField)) {
            const pharmacyId = this.getOptions().pharmacyId;
            if (pharmacyId) {
                this.where({ [pharmacyIdField]: pharmacyId });
            }
        }
        if (!filter.hasOwnProperty(softDeleteField)) {
            this.where({ [softDeleteField]: { $ne: true } });
        }
    });
    schema.pre('aggregate', function () {
        const pipeline = this.pipeline();
        const hasMatchStage = pipeline.some((stage) => stage.$match);
        if (!hasMatchStage) {
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
    schema.methods.findWithoutTenancyGuard = function () {
        return this.constructor
            .find()
            .setOptions({ bypassTenancyGuard: true });
    };
    schema.statics.withPharmacy = function (pharmacyId) {
        return this.find().setOptions({ pharmacyId });
    };
    schema.statics.withDeleted = function () {
        return this.find().setOptions({ includeSoftDeleted: true });
    };
    schema.pre(/^find/, function () {
        const options = this.getOptions();
        if (options.bypassTenancyGuard) {
            return;
        }
        if (options.includeSoftDeleted) {
            const filter = this.getFilter();
            if (!filter.hasOwnProperty(pharmacyIdField) && options.pharmacyId) {
                this.where({ [pharmacyIdField]: options.pharmacyId });
            }
        }
    });
}
function addAuditFields(schema) {
    schema.add({
        createdBy: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        updatedBy: {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    });
    schema.pre('save', function () {
        if (this.isModified() && !this.isNew) {
            if (!this.updatedBy && this.modifiedBy) {
                this.updatedBy = this.modifiedBy;
            }
        }
    });
}
function generateMRN(pharmacyCode, sequence) {
    return `PHM-${pharmacyCode}-${sequence.toString().padStart(5, '0')}`;
}
exports.NIGERIAN_STATES = [
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
exports.BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
exports.GENOTYPES = ['AA', 'AS', 'SS', 'AC', 'SC', 'CC'];
exports.MARITAL_STATUS = ['single', 'married', 'divorced', 'widowed'];
exports.GENDERS = ['male', 'female', 'other'];
exports.SEVERITY_LEVELS = ['mild', 'moderate', 'severe'];
exports.DTP_TYPES = [
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
exports.DTP_CATEGORIES = [
    'indication',
    'effectiveness',
    'safety',
    'adherence',
];
exports.DTP_SEVERITIES = [
    'critical',
    'major',
    'moderate',
    'minor',
];
exports.EVIDENCE_LEVELS = [
    'definite',
    'probable',
    'possible',
    'unlikely',
];
const logger_1 = __importDefault(require("./logger"));
class EnhancedTenancyGuard {
    static createContext(req) {
        if (!req.user || !req.workspaceContext?.workspace) {
            return null;
        }
        return {
            workplaceId: req.workspaceContext.workspace._id.toString(),
            userId: req.user._id.toString(),
            userRole: req.user.role,
            workplaceRole: req.user.workplaceRole,
        };
    }
    static applyTenancyFilter(query, context) {
        return {
            ...query,
            workplaceId: new mongoose_1.default.Types.ObjectId(context.workplaceId),
            deletedAt: { $exists: false }
        };
    }
    static validateResourceAccess(resource, context, resourceType = 'resource') {
        if (!resource) {
            logger_1.default.warn(`Tenancy validation failed: ${resourceType} not found`, {
                workplaceId: context.workplaceId,
                userId: context.userId,
            });
            return false;
        }
        const resourceWorkplaceId = resource.workplaceId?.toString();
        if (resourceWorkplaceId !== context.workplaceId) {
            logger_1.default.warn(`Tenancy violation detected: ${resourceType} access across workplaces`, {
                userWorkplaceId: context.workplaceId,
                resourceWorkplaceId,
                userId: context.userId,
                resourceId: resource._id?.toString(),
                resourceType,
            });
            return false;
        }
        return true;
    }
    static validateClinicalNoteAccess(note, patient, context) {
        const errors = [];
        if (!this.validateResourceAccess(note, context, 'clinical note')) {
            errors.push('Clinical note does not belong to your workplace');
        }
        if (!this.validateResourceAccess(patient, context, 'patient')) {
            errors.push('Patient does not belong to your workplace');
        }
        if (note.patient.toString() !== patient._id.toString()) {
            errors.push('Clinical note does not belong to the specified patient');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    static createSecureClinicalNoteQuery(context, baseQuery = {}, includeConfidential = false) {
        const secureQuery = this.applyTenancyFilter(baseQuery, context);
        const canAccessConfidential = ['Owner', 'Pharmacist'].includes(context.workplaceRole || '');
        if (!includeConfidential || !canAccessConfidential) {
            secureQuery.isConfidential = { $ne: true };
        }
        return secureQuery;
    }
    static validateAttachmentAccess(note, attachment, context) {
        if (!this.validateResourceAccess(note, context, 'clinical note')) {
            return false;
        }
        const attachmentExists = note.attachments?.some((att) => att._id?.toString() === attachment._id?.toString());
        if (!attachmentExists) {
            logger_1.default.warn('Attachment access violation: attachment does not belong to note', {
                workplaceId: context.workplaceId,
                userId: context.userId,
                noteId: note._id?.toString(),
                attachmentId: attachment._id?.toString(),
            });
            return false;
        }
        return true;
    }
    static logTenancyViolation(context, violationType, details = {}) {
        logger_1.default.error('Tenancy violation detected', {
            violationType,
            workplaceId: context.workplaceId,
            userId: context.userId,
            userRole: context.userRole,
            workplaceRole: context.workplaceRole,
            timestamp: new Date().toISOString(),
            ...details,
            severity: 'high',
            category: 'security',
        });
    }
}
exports.EnhancedTenancyGuard = EnhancedTenancyGuard;
//# sourceMappingURL=tenancyGuard.js.map