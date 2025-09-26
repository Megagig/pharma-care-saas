"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_LOINC_CODES = exports.FHIR_PROFILES = exports.REQUIRED_FHIR_CAPABILITIES = exports.DEFAULT_FHIR_CONFIGS = void 0;
exports.getEnvironmentFHIRConfig = getEnvironmentFHIRConfig;
exports.validateFHIRConfig = validateFHIRConfig;
exports.sanitizeFHIRConfig = sanitizeFHIRConfig;
exports.getFHIRConfigForWorkplace = getFHIRConfigForWorkplace;
exports.DEFAULT_FHIR_CONFIGS = [
    {
        id: 'hapi-fhir-local',
        name: 'Local HAPI FHIR Server',
        description: 'Local development FHIR server',
        enabled: false,
        config: {
            baseUrl: 'http://localhost:8080/fhir',
            version: 'R4',
            timeout: 30000,
            retryAttempts: 3,
        },
        auth: {
            type: 'none',
        },
    },
    {
        id: 'hapi-fhir-public',
        name: 'HAPI FHIR Public Test Server',
        description: 'Public HAPI FHIR test server',
        enabled: false,
        config: {
            baseUrl: 'http://hapi.fhir.org/baseR4',
            version: 'R4',
            timeout: 30000,
            retryAttempts: 3,
        },
        auth: {
            type: 'none',
        },
    },
    {
        id: 'smart-health-it',
        name: 'SMART Health IT Sandbox',
        description: 'SMART on FHIR sandbox server',
        enabled: false,
        config: {
            baseUrl: 'https://launch.smarthealthit.org/v/r4/fhir',
            version: 'R4',
            timeout: 30000,
            retryAttempts: 3,
        },
        auth: {
            type: 'oauth2',
            tokenUrl: 'https://launch.smarthealthit.org/v/r4/auth/token',
            scope: 'system/*.read system/*.write',
        },
    },
];
function getEnvironmentFHIRConfig() {
    const baseUrl = process.env.FHIR_BASE_URL;
    if (!baseUrl) {
        return null;
    }
    const config = {
        id: 'environment',
        name: 'Environment FHIR Server',
        description: 'FHIR server configured via environment variables',
        enabled: true,
        config: {
            baseUrl,
            version: process.env.FHIR_VERSION || 'R4',
            timeout: parseInt(process.env.FHIR_TIMEOUT || '30000'),
            retryAttempts: parseInt(process.env.FHIR_RETRY_ATTEMPTS || '3'),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const authType = process.env.FHIR_AUTH_TYPE;
    if (authType) {
        switch (authType) {
            case 'oauth2':
                config.auth = {
                    type: 'oauth2',
                    tokenUrl: process.env.FHIR_TOKEN_URL,
                    clientId: process.env.FHIR_CLIENT_ID,
                    clientSecret: process.env.FHIR_CLIENT_SECRET,
                    scope: process.env.FHIR_SCOPE || 'system/*.read system/*.write',
                };
                break;
            case 'basic':
                config.auth = {
                    type: 'basic',
                    username: process.env.FHIR_USERNAME,
                    password: process.env.FHIR_PASSWORD,
                };
                break;
            case 'bearer':
                config.auth = {
                    type: 'bearer',
                    bearerToken: process.env.FHIR_BEARER_TOKEN,
                };
                break;
            default:
                config.auth = {
                    type: 'none',
                };
        }
    }
    return config;
}
function validateFHIRConfig(config) {
    const errors = [];
    if (!config.id) {
        errors.push('Server ID is required');
    }
    if (!config.name) {
        errors.push('Server name is required');
    }
    if (!config.config.baseUrl) {
        errors.push('Base URL is required');
    }
    else {
        try {
            new URL(config.config.baseUrl);
        }
        catch {
            errors.push('Base URL must be a valid URL');
        }
    }
    if (!['R4', 'STU3', 'DSTU2'].includes(config.config.version)) {
        errors.push('FHIR version must be R4, STU3, or DSTU2');
    }
    if (config.config.timeout < 1000 || config.config.timeout > 300000) {
        errors.push('Timeout must be between 1000ms and 300000ms');
    }
    if (config.config.retryAttempts < 0 || config.config.retryAttempts > 10) {
        errors.push('Retry attempts must be between 0 and 10');
    }
    if (config.auth) {
        switch (config.auth.type) {
            case 'oauth2':
                if (!config.auth.tokenUrl) {
                    errors.push('OAuth2 token URL is required');
                }
                if (!config.auth.clientId) {
                    errors.push('OAuth2 client ID is required');
                }
                if (!config.auth.clientSecret) {
                    errors.push('OAuth2 client secret is required');
                }
                break;
            case 'basic':
                if (!config.auth.username) {
                    errors.push('Basic auth username is required');
                }
                if (!config.auth.password) {
                    errors.push('Basic auth password is required');
                }
                break;
            case 'bearer':
                if (!config.auth.bearerToken) {
                    errors.push('Bearer token is required');
                }
                break;
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function sanitizeFHIRConfig(config) {
    const sanitized = {
        id: config.id,
        name: config.name,
        description: config.description,
        enabled: config.enabled,
        config: {
            baseUrl: config.config.baseUrl,
            version: config.config.version,
            timeout: config.config.timeout,
            retryAttempts: config.config.retryAttempts,
        },
        workplaceId: config.workplaceId,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
    };
    if (config.auth) {
        sanitized.auth = {
            type: config.auth.type,
            tokenUrl: config.auth.tokenUrl,
            scope: config.auth.scope,
        };
    }
    return sanitized;
}
function getFHIRConfigForWorkplace(workplaceId) {
    const envConfig = getEnvironmentFHIRConfig();
    if (envConfig) {
        return envConfig;
    }
    return null;
}
exports.REQUIRED_FHIR_CAPABILITIES = [
    'Observation',
    'ServiceRequest',
    'Patient',
    'Practitioner',
    'Organization',
];
exports.FHIR_PROFILES = {
    LAB_OBSERVATION: 'http://hl7.org/fhir/StructureDefinition/vitalsigns',
    LAB_SERVICE_REQUEST: 'http://hl7.org/fhir/StructureDefinition/ServiceRequest',
    US_CORE_PATIENT: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient',
};
exports.COMMON_LOINC_CODES = {
    GLUCOSE: '2345-7',
    CREATININE: '2160-0',
    SODIUM: '2951-2',
    POTASSIUM: '2823-3',
    CHLORIDE: '2075-0',
    CO2: '2028-9',
    BUN: '3094-0',
    HEMOGLOBIN: '718-7',
    HEMATOCRIT: '4544-3',
    WBC: '6690-2',
    PLATELETS: '777-3',
    TOTAL_CHOLESTEROL: '2093-3',
    HDL_CHOLESTEROL: '2085-9',
    LDL_CHOLESTEROL: '18262-6',
    TRIGLYCERIDES: '2571-8',
    ALT: '1742-6',
    AST: '1920-8',
    BILIRUBIN_TOTAL: '1975-2',
    ALKALINE_PHOSPHATASE: '6768-6',
    TROPONIN_I: '10839-9',
    CK_MB: '13969-1',
    BNP: '30934-4',
    TSH: '3016-3',
    T4_FREE: '3024-7',
    T3_FREE: '3051-0',
    HBA1C: '4548-4',
    GLUCOSE_RANDOM: '2345-7',
    GLUCOSE_FASTING: '1558-6',
};
exports.default = {
    DEFAULT_FHIR_CONFIGS: exports.DEFAULT_FHIR_CONFIGS,
    getEnvironmentFHIRConfig,
    validateFHIRConfig,
    sanitizeFHIRConfig,
    getFHIRConfigForWorkplace,
    REQUIRED_FHIR_CAPABILITIES: exports.REQUIRED_FHIR_CAPABILITIES,
    FHIR_PROFILES: exports.FHIR_PROFILES,
    COMMON_LOINC_CODES: exports.COMMON_LOINC_CODES,
};
//# sourceMappingURL=fhirConfig.js.map