"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DTP_TYPES = exports.SEVERITY_LEVELS = exports.GENDERS = exports.MARITAL_STATUS = exports.GENOTYPES = exports.BLOOD_GROUPS = exports.NIGERIAN_STATES = void 0;
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
];
//# sourceMappingURL=tenancyGuard.js.map