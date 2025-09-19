"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFHIRStatus = exports.getFHIRCapabilities = exports.getDefaultFHIRConfigs = exports.testFHIRConfig = exports.getFHIRConfig = exports.getFHIRConfigs = void 0;
const logger_1 = __importDefault(require("../../../utils/logger"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const fhirConfig_1 = require("../config/fhirConfig");
const fhirService_1 = __importDefault(require("../services/fhirService"));
exports.getFHIRConfigs = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const configs = [];
        const envConfig = (0, fhirConfig_1.getEnvironmentFHIRConfig)();
        if (envConfig) {
            configs.push((0, fhirConfig_1.sanitizeFHIRConfig)(envConfig));
        }
        fhirConfig_1.DEFAULT_FHIR_CONFIGS.forEach(config => {
            if (config.id && config.name && config.config) {
                configs.push({
                    ...config,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        });
        logger_1.default.info('FHIR configurations retrieved', {
            workplaceId: context.workplaceId,
            configCount: configs.length,
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            configs,
            total: configs.length,
            hasEnvironmentConfig: !!envConfig,
        }, 'FHIR configurations retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get FHIR configurations:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get FHIR configurations: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getFHIRConfig = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        let config = null;
        if (id === 'environment') {
            config = (0, fhirConfig_1.getEnvironmentFHIRConfig)();
        }
        else {
            const defaultConfig = fhirConfig_1.DEFAULT_FHIR_CONFIGS.find(c => c.id === id);
            if (defaultConfig && defaultConfig.id && defaultConfig.name && defaultConfig.config) {
                config = {
                    ...defaultConfig,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }
        }
        if (!config) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'FHIR configuration not found', 404);
        }
        const sanitizedConfig = (0, fhirConfig_1.sanitizeFHIRConfig)(config);
        logger_1.default.info('FHIR configuration retrieved', {
            configId: id,
            workplaceId: context.workplaceId,
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            config: sanitizedConfig,
        }, 'FHIR configuration retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get FHIR configuration:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get FHIR configuration: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.testFHIRConfig = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { config: fhirConfig, auth: authConfig } = req.body;
    try {
        const validation = (0, fhirConfig_1.validateFHIRConfig)({
            id: 'test',
            name: 'Test Configuration',
            enabled: true,
            config: fhirConfig,
            auth: authConfig,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        if (!validation.valid) {
            return (0, responseHelpers_1.sendError)(res, 'VALIDATION_ERROR', 'Invalid FHIR configuration', 422, {
                errors: validation.errors,
            });
        }
        const fhirService = new fhirService_1.default(fhirConfig, authConfig);
        const connectionResult = await fhirService.testConnection();
        console.log('FHIR configuration tested:', (0, responseHelpers_1.createAuditLog)('TEST_FHIR_CONFIG', 'FHIRConfig', 'test_connection', context, {
            baseUrl: fhirConfig.baseUrl,
            version: fhirConfig.version,
            authType: authConfig?.type || 'none',
            connected: connectionResult,
        }));
        if (connectionResult) {
            (0, responseHelpers_1.sendSuccess)(res, {
                connected: true,
                message: 'FHIR server connection successful',
                timestamp: new Date().toISOString(),
                config: {
                    baseUrl: fhirConfig.baseUrl,
                    version: fhirConfig.version,
                },
            }, 'FHIR configuration test successful');
        }
        else {
            (0, responseHelpers_1.sendError)(res, 'SERVICE_UNAVAILABLE', 'FHIR server connection failed', 503, {
                connected: false,
                timestamp: new Date().toISOString(),
                config: {
                    baseUrl: fhirConfig.baseUrl,
                    version: fhirConfig.version,
                },
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to test FHIR configuration:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to test FHIR configuration: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getDefaultFHIRConfigs = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const sanitizedConfigs = fhirConfig_1.DEFAULT_FHIR_CONFIGS.map(config => ({
            ...config,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        logger_1.default.info('Default FHIR configurations retrieved', {
            workplaceId: context.workplaceId,
            configCount: sanitizedConfigs.length,
        });
        (0, responseHelpers_1.sendSuccess)(res, {
            configs: sanitizedConfigs,
            total: sanitizedConfigs.length,
        }, 'Default FHIR configurations retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get default FHIR configurations:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get default FHIR configurations: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getFHIRCapabilities = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { serverId } = req.query;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        let config = null;
        if (serverId === 'environment') {
            config = (0, fhirConfig_1.getEnvironmentFHIRConfig)();
        }
        else if (typeof serverId === 'string') {
            const defaultConfig = fhirConfig_1.DEFAULT_FHIR_CONFIGS.find(c => c.id === serverId);
            if (defaultConfig && defaultConfig.id && defaultConfig.name && defaultConfig.config) {
                config = {
                    ...defaultConfig,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }
        }
        if (!config) {
            return (0, responseHelpers_1.sendError)(res, 'NOT_FOUND', 'FHIR configuration not found', 404);
        }
        const fhirService = new fhirService_1.default(config.config, config.auth);
        try {
            const capabilities = {
                fhirVersion: config.config.version,
                software: {
                    name: 'Unknown',
                    version: 'Unknown',
                },
                implementation: {
                    description: 'FHIR Server',
                    url: config.config.baseUrl,
                },
                rest: [{
                        mode: 'server',
                        resource: [
                            {
                                type: 'Observation',
                                interaction: [
                                    { code: 'read' },
                                    { code: 'search-type' },
                                    { code: 'create' },
                                    { code: 'update' },
                                ],
                            },
                            {
                                type: 'ServiceRequest',
                                interaction: [
                                    { code: 'read' },
                                    { code: 'search-type' },
                                    { code: 'create' },
                                    { code: 'update' },
                                ],
                            },
                            {
                                type: 'Patient',
                                interaction: [
                                    { code: 'read' },
                                    { code: 'search-type' },
                                ],
                            },
                        ],
                    }],
            };
            logger_1.default.info('FHIR capabilities retrieved', {
                serverId,
                workplaceId: context.workplaceId,
                baseUrl: config.config.baseUrl,
            });
            (0, responseHelpers_1.sendSuccess)(res, {
                capabilities,
                serverId,
                baseUrl: config.config.baseUrl,
                version: config.config.version,
            }, 'FHIR capabilities retrieved successfully');
        }
        catch (capabilityError) {
            logger_1.default.warn('Failed to retrieve FHIR capabilities:', capabilityError);
            (0, responseHelpers_1.sendError)(res, 'SERVICE_UNAVAILABLE', 'Unable to retrieve FHIR server capabilities', 503, {
                serverId,
                baseUrl: config.config.baseUrl,
                error: capabilityError instanceof Error ? capabilityError.message : 'Unknown error',
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to get FHIR capabilities:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get FHIR capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.getFHIRStatus = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const status = {
            enabled: !!process.env.FHIR_BASE_URL,
            environmentConfig: !!(0, fhirConfig_1.getEnvironmentFHIRConfig)(),
            defaultConfigs: fhirConfig_1.DEFAULT_FHIR_CONFIGS.length,
            lastChecked: new Date().toISOString(),
            features: {
                import: true,
                export: true,
                sync: true,
                realtime: false,
            },
            supportedVersions: ['R4', 'STU3', 'DSTU2'],
            supportedResources: [
                'Observation',
                'ServiceRequest',
                'Patient',
                'Practitioner',
                'Organization',
            ],
        };
        const envConfig = (0, fhirConfig_1.getEnvironmentFHIRConfig)();
        if (envConfig) {
            try {
                const fhirService = new fhirService_1.default(envConfig.config, envConfig.auth);
                status.enabled = await fhirService.testConnection();
            }
            catch (error) {
                logger_1.default.warn('Environment FHIR server not accessible:', error);
                status.enabled = false;
            }
        }
        logger_1.default.info('FHIR status retrieved', {
            workplaceId: context.workplaceId,
            enabled: status.enabled,
            environmentConfig: status.environmentConfig,
        });
        (0, responseHelpers_1.sendSuccess)(res, status, 'FHIR integration status retrieved successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to get FHIR status:', error);
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', `Failed to get FHIR status: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.default = {
    getFHIRConfigs: exports.getFHIRConfigs,
    getFHIRConfig: exports.getFHIRConfig,
    testFHIRConfig: exports.testFHIRConfig,
    getDefaultFHIRConfigs: exports.getDefaultFHIRConfigs,
    getFHIRCapabilities: exports.getFHIRCapabilities,
    getFHIRStatus: exports.getFHIRStatus,
};
//# sourceMappingURL=fhirConfigController.js.map