"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
class DataAnonymizationService {
    constructor() {
        this.pseudonymMap = new Map();
        this.defaultSalt = process.env.ANONYMIZATION_SALT || 'default-salt-change-in-production';
    }
    static getInstance() {
        if (!DataAnonymizationService.instance) {
            DataAnonymizationService.instance = new DataAnonymizationService();
        }
        return DataAnonymizationService.instance;
    }
    anonymizePatientId(patientId, options = { method: 'hash' }) {
        try {
            let anonymizedValue;
            let reversible = false;
            switch (options.method) {
                case 'hash':
                    anonymizedValue = this.hashValue(patientId, options.salt);
                    break;
                case 'pseudonymize':
                    anonymizedValue = this.pseudonymizeValue(patientId, 'patient');
                    reversible = true;
                    break;
                case 'mask':
                    anonymizedValue = this.maskValue(patientId, options.maskChar || '*');
                    break;
                case 'suppress':
                    anonymizedValue = '[SUPPRESSED]';
                    break;
                default:
                    anonymizedValue = this.hashValue(patientId, options.salt);
            }
            return {
                originalValue: patientId,
                anonymizedValue,
                method: options.method,
                reversible,
                metadata: {
                    dataType: 'patientId',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error anonymizing patient ID:', error);
            return {
                originalValue: patientId,
                anonymizedValue: '[ANONYMIZATION_ERROR]',
                method: 'error',
                reversible: false
            };
        }
    }
    anonymizeName(name, options = { method: 'mask' }) {
        try {
            let anonymizedValue;
            let reversible = false;
            switch (options.method) {
                case 'hash':
                    anonymizedValue = this.hashValue(name, options.salt);
                    break;
                case 'mask':
                    anonymizedValue = this.maskName(name, options.maskChar || '*');
                    break;
                case 'generalize':
                    anonymizedValue = this.generalizeName(name);
                    break;
                case 'pseudonymize':
                    anonymizedValue = this.pseudonymizeValue(name, 'name');
                    reversible = true;
                    break;
                case 'suppress':
                    anonymizedValue = '[NAME_SUPPRESSED]';
                    break;
                default:
                    anonymizedValue = this.maskName(name, options.maskChar || '*');
            }
            return {
                originalValue: name,
                anonymizedValue,
                method: options.method,
                reversible,
                metadata: {
                    dataType: 'name',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error anonymizing name:', error);
            return {
                originalValue: name,
                anonymizedValue: '[ANONYMIZATION_ERROR]',
                method: 'error',
                reversible: false
            };
        }
    }
    anonymizeAge(age, options = { method: 'generalize', generalizationLevel: 5 }) {
        try {
            let anonymizedValue;
            switch (options.method) {
                case 'generalize':
                    const level = options.generalizationLevel || 5;
                    const ageGroup = Math.floor(age / level) * level;
                    anonymizedValue = `${ageGroup}-${ageGroup + level - 1}`;
                    break;
                case 'suppress':
                    anonymizedValue = '[AGE_SUPPRESSED]';
                    break;
                case 'hash':
                    anonymizedValue = this.hashValue(age.toString(), options.salt);
                    break;
                default:
                    const defaultLevel = 10;
                    const defaultAgeGroup = Math.floor(age / defaultLevel) * defaultLevel;
                    anonymizedValue = `${defaultAgeGroup}-${defaultAgeGroup + defaultLevel - 1}`;
            }
            return {
                originalValue: age,
                anonymizedValue,
                method: options.method,
                reversible: false,
                metadata: {
                    dataType: 'age',
                    generalizationLevel: options.generalizationLevel,
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error anonymizing age:', error);
            return {
                originalValue: age,
                anonymizedValue: '[ANONYMIZATION_ERROR]',
                method: 'error',
                reversible: false
            };
        }
    }
    anonymizeLocation(location, options = { method: 'generalize' }) {
        try {
            let anonymizedValue;
            switch (options.method) {
                case 'generalize':
                    anonymizedValue = this.generalizeLocation(location);
                    break;
                case 'hash':
                    anonymizedValue = this.hashValue(location, options.salt);
                    break;
                case 'suppress':
                    anonymizedValue = '[LOCATION_SUPPRESSED]';
                    break;
                case 'mask':
                    anonymizedValue = this.maskValue(location, options.maskChar || '*');
                    break;
                default:
                    anonymizedValue = this.generalizeLocation(location);
            }
            return {
                originalValue: location,
                anonymizedValue,
                method: options.method,
                reversible: false,
                metadata: {
                    dataType: 'location',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error anonymizing location:', error);
            return {
                originalValue: location,
                anonymizedValue: '[ANONYMIZATION_ERROR]',
                method: 'error',
                reversible: false
            };
        }
    }
    anonymizeFinancialData(amount, options = { method: 'generalize' }) {
        try {
            let anonymizedValue;
            switch (options.method) {
                case 'generalize':
                    if (amount > 10000) {
                        anonymizedValue = Math.round(amount / 1000) * 1000;
                    }
                    else if (amount > 1000) {
                        anonymizedValue = Math.round(amount / 100) * 100;
                    }
                    else {
                        anonymizedValue = Math.round(amount / 10) * 10;
                    }
                    break;
                case 'suppress':
                    anonymizedValue = '[AMOUNT_SUPPRESSED]';
                    break;
                case 'hash':
                    anonymizedValue = this.hashValue(amount.toString(), options.salt);
                    break;
                default:
                    anonymizedValue = Math.round(amount / 100) * 100;
            }
            return {
                originalValue: amount,
                anonymizedValue,
                method: options.method,
                reversible: false,
                metadata: {
                    dataType: 'financial',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error anonymizing financial data:', error);
            return {
                originalValue: amount,
                anonymizedValue: '[ANONYMIZATION_ERROR]',
                method: 'error',
                reversible: false
            };
        }
    }
    anonymizeReportData(data, sensitiveFields, options = {}) {
        try {
            return data.map(record => {
                const anonymizedRecord = { ...record };
                sensitiveFields.forEach(field => {
                    if (record[field] !== undefined && record[field] !== null) {
                        const fieldOptions = options[field] || { method: 'hash' };
                        const result = this.anonymizeValue(record[field], field, fieldOptions);
                        anonymizedRecord[field] = result.anonymizedValue;
                        if (!anonymizedRecord._anonymization) {
                            anonymizedRecord._anonymization = {};
                        }
                        anonymizedRecord._anonymization[field] = {
                            method: result.method,
                            reversible: result.reversible,
                            timestamp: result.metadata?.timestamp
                        };
                    }
                });
                return anonymizedRecord;
            });
        }
        catch (error) {
            logger_1.default.error('Error anonymizing report data:', error);
            return data;
        }
    }
    shouldAnonymizeData(userPermissions, dataType, reportType) {
        const sensitiveDataTypes = [
            'patient-outcomes',
            'patient-demographics',
            'adverse-events',
            'therapy-effectiveness'
        ];
        const fullAccessPermissions = [
            'view_full_patient_data',
            'view_identifiable_data',
            'admin_access',
            'super_admin'
        ];
        const containsSensitiveData = sensitiveDataTypes.includes(reportType);
        const hasFullAccess = userPermissions.some(permission => fullAccessPermissions.includes(permission));
        return containsSensitiveData && !hasFullAccess;
    }
    generateAnonymizationSummary(originalData, anonymizedData, sensitiveFields) {
        return {
            totalRecords: originalData.length,
            anonymizedRecords: anonymizedData.length,
            sensitiveFields,
            anonymizationMethods: this.getUsedMethods(anonymizedData),
            dataIntegrityCheck: this.validateDataIntegrity(originalData, anonymizedData),
            timestamp: new Date().toISOString()
        };
    }
    hashValue(value, salt) {
        const actualSalt = salt || this.defaultSalt;
        return crypto_1.default.createHash('sha256').update(value + actualSalt).digest('hex').substring(0, 16);
    }
    maskValue(value, maskChar = '*') {
        if (value.length <= 2) {
            return maskChar.repeat(value.length);
        }
        return value.charAt(0) + maskChar.repeat(value.length - 2) + value.charAt(value.length - 1);
    }
    maskName(name, maskChar = '*') {
        const parts = name.split(' ');
        return parts.map(part => {
            if (part.length <= 1)
                return part;
            return part.charAt(0) + maskChar.repeat(Math.max(1, part.length - 1));
        }).join(' ');
    }
    generalizeName(name) {
        const parts = name.split(' ');
        if (parts.length === 1) {
            return `${parts[0].charAt(0)}. [SURNAME]`;
        }
        return `${parts[0].charAt(0)}. ${parts[parts.length - 1].charAt(0)}.`;
    }
    generalizeLocation(location) {
        const parts = location.split(',').map(part => part.trim());
        if (parts.length >= 2) {
            return parts.slice(-2).join(', ');
        }
        return '[LOCATION_GENERALIZED]';
    }
    pseudonymizeValue(value, type) {
        const key = `${type}:${value}`;
        if (this.pseudonymMap.has(key)) {
            return this.pseudonymMap.get(key);
        }
        const pseudonym = this.generatePseudonym(type);
        this.pseudonymMap.set(key, pseudonym);
        return pseudonym;
    }
    generatePseudonym(type) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${type.toUpperCase()}_${timestamp}_${random}`;
    }
    anonymizeValue(value, fieldType, options) {
        switch (fieldType) {
            case 'patientId':
            case 'patient_id':
                return this.anonymizePatientId(value.toString(), options);
            case 'name':
            case 'patientName':
            case 'patient_name':
                return this.anonymizeName(value.toString(), options);
            case 'age':
                return this.anonymizeAge(typeof value === 'number' ? value : parseInt(value), options);
            case 'location':
            case 'address':
                return this.anonymizeLocation(value.toString(), options);
            case 'cost':
            case 'amount':
            case 'price':
                return this.anonymizeFinancialData(typeof value === 'number' ? value : parseFloat(value), options);
            default:
                return {
                    originalValue: value,
                    anonymizedValue: this.hashValue(value.toString(), options.salt),
                    method: 'hash',
                    reversible: false,
                    metadata: {
                        dataType: fieldType,
                        timestamp: new Date().toISOString()
                    }
                };
        }
    }
    getUsedMethods(anonymizedData) {
        const methods = new Set();
        anonymizedData.forEach(record => {
            if (record._anonymization) {
                Object.values(record._anonymization).forEach((meta) => {
                    if (meta.method) {
                        methods.add(meta.method);
                    }
                });
            }
        });
        return Array.from(methods);
    }
    validateDataIntegrity(originalData, anonymizedData) {
        if (originalData.length !== anonymizedData.length) {
            return false;
        }
        if (originalData.length > 0 && anonymizedData.length > 0) {
            const originalKeys = Object.keys(originalData[0]).filter(key => !key.startsWith('_'));
            const anonymizedKeys = Object.keys(anonymizedData[0]).filter(key => !key.startsWith('_'));
            return originalKeys.length === anonymizedKeys.length &&
                originalKeys.every(key => anonymizedKeys.includes(key));
        }
        return true;
    }
}
exports.default = DataAnonymizationService;
//# sourceMappingURL=DataAnonymizationService.js.map