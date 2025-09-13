"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAIResponse = exports.formatSchemaErrors = exports.isValidDrugInteraction = exports.isValidFHIRBundle = exports.isValidAIResponse = exports.validateDrugInteraction = exports.validateFHIRBundle = exports.validateAIResponse = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const ajv = new ajv_1.default({ allErrors: true });
(0, ajv_formats_1.default)(ajv);
const aiResponseSchema = {
    type: 'object',
    properties: {
        diagnoses: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                properties: {
                    condition: { type: 'string', minLength: 1 },
                    probability: { type: 'number', minimum: 0, maximum: 1 },
                    reasoning: { type: 'string', minLength: 1 },
                    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                    icdCode: { type: 'string', nullable: true },
                    snomedCode: { type: 'string', nullable: true }
                },
                required: ['condition', 'probability', 'reasoning', 'severity'],
                additionalProperties: false
            }
        },
        suggestedTests: {
            type: 'array',
            nullable: true,
            items: {
                type: 'object',
                properties: {
                    testName: { type: 'string', minLength: 1 },
                    priority: { type: 'string', enum: ['urgent', 'routine', 'optional'] },
                    reasoning: { type: 'string', minLength: 1 },
                    loincCode: { type: 'string', nullable: true }
                },
                required: ['testName', 'priority', 'reasoning'],
                additionalProperties: false
            }
        },
        medicationSuggestions: {
            type: 'array',
            nullable: true,
            items: {
                type: 'object',
                properties: {
                    drugName: { type: 'string', minLength: 1 },
                    dosage: { type: 'string', minLength: 1 },
                    frequency: { type: 'string', minLength: 1 },
                    duration: { type: 'string', minLength: 1 },
                    reasoning: { type: 'string', minLength: 1 },
                    safetyNotes: {
                        type: 'array',
                        items: { type: 'string' }
                    },
                    rxcui: { type: 'string', nullable: true }
                },
                required: ['drugName', 'dosage', 'frequency', 'duration', 'reasoning', 'safetyNotes'],
                additionalProperties: false
            }
        },
        redFlags: {
            type: 'array',
            nullable: true,
            items: {
                type: 'object',
                properties: {
                    flag: { type: 'string', minLength: 1 },
                    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    action: { type: 'string', minLength: 1 }
                },
                required: ['flag', 'severity', 'action'],
                additionalProperties: false
            }
        },
        referralRecommendation: {
            type: 'object',
            nullable: true,
            properties: {
                recommended: { type: 'boolean' },
                urgency: {
                    type: 'string',
                    enum: ['immediate', 'within_24h', 'routine'],
                    nullable: true
                },
                specialty: { type: 'string', nullable: true },
                reason: { type: 'string', nullable: true }
            },
            required: ['recommended'],
            additionalProperties: false,
            if: { properties: { recommended: { const: true } } },
            then: {
                required: ['recommended', 'urgency', 'specialty', 'reason']
            }
        },
        confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
        disclaimer: { type: 'string', nullable: true }
    },
    required: ['diagnoses', 'confidenceScore'],
    additionalProperties: false
};
const fhirBundleSchema = {
    type: 'object',
    properties: {
        resourceType: { type: 'string', const: 'Bundle' },
        type: { type: 'string' },
        entry: {
            type: 'array',
            nullable: true,
            items: {
                type: 'object',
                properties: {
                    resource: {
                        type: 'object',
                        properties: {
                            resourceType: { type: 'string' }
                        },
                        required: ['resourceType'],
                        additionalProperties: true
                    }
                },
                required: ['resource'],
                additionalProperties: true
            }
        }
    },
    required: ['resourceType', 'type'],
    additionalProperties: true
};
const drugInteractionSchema = {
    type: 'object',
    properties: {
        interactions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    drug1: { type: 'string', minLength: 1 },
                    drug2: { type: 'string', minLength: 1 },
                    severity: { type: 'string', enum: ['minor', 'moderate', 'major'] },
                    description: { type: 'string', minLength: 1 },
                    clinicalEffect: { type: 'string', minLength: 1 },
                    mechanism: { type: 'string', nullable: true },
                    management: { type: 'string', nullable: true }
                },
                required: ['drug1', 'drug2', 'severity', 'description', 'clinicalEffect'],
                additionalProperties: false
            }
        },
        allergicReactions: {
            type: 'array',
            nullable: true,
            items: {
                type: 'object',
                properties: {
                    drug: { type: 'string', minLength: 1 },
                    allergy: { type: 'string', minLength: 1 },
                    severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
                    reaction: { type: 'string', minLength: 1 }
                },
                required: ['drug', 'allergy', 'severity', 'reaction'],
                additionalProperties: false
            }
        },
        contraindications: {
            type: 'array',
            nullable: true,
            items: {
                type: 'object',
                properties: {
                    drug: { type: 'string', minLength: 1 },
                    condition: { type: 'string', minLength: 1 },
                    reason: { type: 'string', minLength: 1 },
                    severity: { type: 'string', enum: ['warning', 'contraindicated'] }
                },
                required: ['drug', 'condition', 'reason', 'severity'],
                additionalProperties: false
            }
        }
    },
    required: ['interactions'],
    additionalProperties: false
};
exports.validateAIResponse = ajv.compile(aiResponseSchema);
exports.validateFHIRBundle = ajv.compile(fhirBundleSchema);
exports.validateDrugInteraction = ajv.compile(drugInteractionSchema);
const isValidAIResponse = (data) => {
    return (0, exports.validateAIResponse)(data);
};
exports.isValidAIResponse = isValidAIResponse;
const isValidFHIRBundle = (data) => {
    return (0, exports.validateFHIRBundle)(data);
};
exports.isValidFHIRBundle = isValidFHIRBundle;
const isValidDrugInteraction = (data) => {
    return (0, exports.validateDrugInteraction)(data);
};
exports.isValidDrugInteraction = isValidDrugInteraction;
const formatSchemaErrors = (validator) => {
    if (!validator.errors)
        return [];
    return validator.errors.map((error) => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        code: error.keyword,
        allowedValues: error.params?.allowedValues
    }));
};
exports.formatSchemaErrors = formatSchemaErrors;
const sanitizeAIResponse = (data) => {
    const sanitized = {};
    if (Array.isArray(data.diagnoses)) {
        sanitized.diagnoses = data.diagnoses.map((d) => ({
            condition: String(d.condition || '').trim(),
            probability: Math.max(0, Math.min(1, Number(d.probability) || 0)),
            reasoning: String(d.reasoning || '').trim(),
            severity: ['low', 'medium', 'high'].includes(d.severity) ? d.severity : 'low',
            icdCode: d.icdCode ? String(d.icdCode).trim() : undefined,
            snomedCode: d.snomedCode ? String(d.snomedCode).trim() : undefined
        })).filter((d) => d.condition && d.reasoning);
    }
    if (Array.isArray(data.suggestedTests)) {
        sanitized.suggestedTests = data.suggestedTests.map((t) => ({
            testName: String(t.testName || '').trim(),
            priority: ['urgent', 'routine', 'optional'].includes(t.priority) ? t.priority : 'routine',
            reasoning: String(t.reasoning || '').trim(),
            loincCode: t.loincCode ? String(t.loincCode).trim() : undefined
        })).filter((t) => t.testName && t.reasoning);
    }
    if (Array.isArray(data.medicationSuggestions)) {
        sanitized.medicationSuggestions = data.medicationSuggestions.map((m) => ({
            drugName: String(m.drugName || '').trim(),
            dosage: String(m.dosage || '').trim(),
            frequency: String(m.frequency || '').trim(),
            duration: String(m.duration || '').trim(),
            reasoning: String(m.reasoning || '').trim(),
            safetyNotes: Array.isArray(m.safetyNotes)
                ? m.safetyNotes.map((n) => String(n).trim()).filter(Boolean)
                : [],
            rxcui: m.rxcui ? String(m.rxcui).trim() : undefined
        })).filter((m) => m.drugName && m.dosage && m.frequency && m.duration && m.reasoning);
    }
    if (Array.isArray(data.redFlags)) {
        sanitized.redFlags = data.redFlags.map((f) => ({
            flag: String(f.flag || '').trim(),
            severity: ['low', 'medium', 'high', 'critical'].includes(f.severity) ? f.severity : 'low',
            action: String(f.action || '').trim()
        })).filter((f) => f.flag && f.action);
    }
    if (data.referralRecommendation && typeof data.referralRecommendation === 'object') {
        const ref = data.referralRecommendation;
        sanitized.referralRecommendation = {
            recommended: Boolean(ref.recommended),
            urgency: ref.recommended && ['immediate', 'within_24h', 'routine'].includes(ref.urgency)
                ? ref.urgency : undefined,
            specialty: ref.recommended && ref.specialty ? String(ref.specialty).trim() : undefined,
            reason: ref.recommended && ref.reason ? String(ref.reason).trim() : undefined
        };
    }
    sanitized.confidenceScore = Math.max(0, Math.min(1, Number(data.confidenceScore) || 0));
    sanitized.disclaimer = data.disclaimer ? String(data.disclaimer).trim() : undefined;
    return sanitized;
};
exports.sanitizeAIResponse = sanitizeAIResponse;
//# sourceMappingURL=jsonSchemaValidator.js.map