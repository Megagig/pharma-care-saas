"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FHIRService = void 0;
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../../../utils/logger"));
class FHIRService {
    constructor(config, authConfig) {
        this.config = config;
        this.authConfig = authConfig;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/fhir+json',
                'Accept': 'application/fhir+json',
            },
        });
        this.client.interceptors.request.use(async (config) => {
            await this.ensureAuthenticated();
            if (this.accessToken) {
                config.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return config;
        }, (error) => {
            logger_1.default.error('FHIR request interceptor error:', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401 && this.authConfig) {
                this.accessToken = undefined;
                this.tokenExpiry = undefined;
                if (!error.config._retry) {
                    error.config._retry = true;
                    await this.ensureAuthenticated();
                    if (this.accessToken) {
                        error.config.headers.Authorization = `Bearer ${this.accessToken}`;
                        return this.client.request(error.config);
                    }
                }
            }
            logger_1.default.error('FHIR API error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
            });
            return Promise.reject(error);
        });
    }
    async ensureAuthenticated() {
        if (!this.authConfig || this.authConfig.type === 'none') {
            return;
        }
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return;
        }
        try {
            switch (this.authConfig.type) {
                case 'oauth2':
                    await this.authenticateOAuth2();
                    break;
                case 'basic':
                    if (this.authConfig.username && this.authConfig.password) {
                        const credentials = Buffer.from(`${this.authConfig.username}:${this.authConfig.password}`).toString('base64');
                        this.client.defaults.headers.Authorization = `Basic ${credentials}`;
                    }
                    break;
                case 'bearer':
                    if (this.authConfig.bearerToken) {
                        this.accessToken = this.authConfig.bearerToken;
                    }
                    break;
            }
        }
        catch (error) {
            logger_1.default.error('FHIR authentication failed:', error);
            throw new Error(`FHIR authentication failed: ${error}`);
        }
    }
    async authenticateOAuth2() {
        if (!this.authConfig?.tokenUrl || !this.authConfig?.clientId || !this.authConfig?.clientSecret) {
            throw new Error('OAuth2 configuration incomplete');
        }
        try {
            const response = await axios_1.default.post(this.authConfig.tokenUrl, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.authConfig.clientId,
                client_secret: this.authConfig.clientSecret,
                scope: this.authConfig.scope || 'system/*.read system/*.write',
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            this.accessToken = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600;
            this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000));
            logger_1.default.info('FHIR OAuth2 authentication successful', {
                tokenUrl: this.authConfig.tokenUrl,
                expiresIn,
            });
        }
        catch (error) {
            logger_1.default.error('OAuth2 authentication failed:', error);
            throw error;
        }
    }
    async importLabResults(bundle, patientMappings) {
        const result = {
            imported: [],
            failed: [],
        };
        try {
            const patientMap = new Map();
            patientMappings.forEach(mapping => {
                patientMap.set(mapping.fhirPatientId, mapping);
            });
            for (const entry of bundle.entry) {
                try {
                    const resource = entry.resource;
                    if (resource.resourceType === 'Observation') {
                        const labResult = await this.processObservation(resource, patientMap);
                        if (labResult) {
                            result.imported.push({
                                fhirId: resource.id,
                                internalId: labResult._id.toString(),
                                type: 'observation',
                                status: 'success',
                            });
                        }
                    }
                    else if (resource.resourceType === 'ServiceRequest') {
                        const labOrder = await this.processServiceRequest(resource, patientMap);
                        if (labOrder) {
                            result.imported.push({
                                fhirId: resource.id,
                                internalId: labOrder._id.toString(),
                                type: 'serviceRequest',
                                status: 'success',
                            });
                        }
                    }
                }
                catch (error) {
                    logger_1.default.error('Failed to process FHIR resource:', error);
                    result.failed.push({
                        fhirId: entry.resource.id || 'unknown',
                        type: entry.resource.resourceType === 'Observation' ? 'observation' : 'serviceRequest',
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error',
                        resource: entry.resource,
                    });
                }
            }
            logger_1.default.info('FHIR bundle import completed', {
                bundleId: bundle.id,
                totalEntries: bundle.entry.length,
                imported: result.imported.length,
                failed: result.failed.length,
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to import FHIR bundle:', error);
            throw new Error(`Failed to import FHIR bundle: ${error}`);
        }
    }
    async processObservation(observation, patientMap) {
        try {
            const patientRef = observation.subject.reference;
            const fhirPatientId = patientRef.replace(/^Patient\//, '');
            const patientMapping = patientMap.get(fhirPatientId);
            if (!patientMapping) {
                throw new Error(`No patient mapping found for FHIR patient ID: ${fhirPatientId}`);
            }
            const testCode = this.extractTestCode(observation.code);
            const testName = this.extractTestName(observation.code);
            const loincCode = this.extractLoincCode(observation.code);
            if (!observation.code || testCode === 'UNKNOWN') {
                throw new Error('Missing or invalid test code in FHIR Observation');
            }
            const { value, unit, numericValue } = this.extractValue(observation);
            const referenceRange = this.extractReferenceRange(observation);
            const performedAt = observation.effectiveDateTime
                ? new Date(observation.effectiveDateTime)
                : new Date();
            const reportedAt = observation.issued
                ? new Date(observation.issued)
                : new Date();
            const interpretation = this.extractInterpretation(observation);
            const labResultData = {
                patientId: new mongoose_1.Types.ObjectId(patientMapping.internalPatientId),
                workplaceId: new mongoose_1.Types.ObjectId(patientMapping.workplaceId),
                testCode,
                testName,
                testCategory: this.extractCategory(observation),
                loincCode,
                value,
                numericValue,
                unit,
                referenceRange,
                interpretation,
                flags: this.extractFlags(observation),
                source: 'fhir',
                performedAt,
                reportedAt,
                recordedAt: new Date(),
                recordedBy: new mongoose_1.Types.ObjectId(patientMapping.internalPatientId),
                externalResultId: observation.id,
                fhirReference: `Observation/${observation.id}`,
                technicalNotes: this.extractNotes(observation),
                reviewStatus: observation.status === 'final' ? 'approved' : 'pending',
                createdBy: new mongoose_1.Types.ObjectId(patientMapping.internalPatientId),
                followUpRequired: false,
                criticalValue: interpretation === 'critical',
            };
            const LabResult = (await Promise.resolve().then(() => __importStar(require('../models/LabResult')))).default;
            const labResult = new LabResult(labResultData);
            await labResult.save();
            logger_1.default.info('FHIR Observation imported successfully', {
                fhirId: observation.id,
                internalId: labResult._id,
                testCode,
                testName,
                patientId: patientMapping.internalPatientId,
            });
            return labResult;
        }
        catch (error) {
            logger_1.default.error('Failed to process FHIR Observation:', error);
            throw error;
        }
    }
    async processServiceRequest(serviceRequest, patientMap) {
        try {
            const patientRef = serviceRequest.subject.reference;
            const fhirPatientId = patientRef.replace(/^Patient\//, '');
            const patientMapping = patientMap.get(fhirPatientId);
            if (!patientMapping) {
                throw new Error(`No patient mapping found for FHIR patient ID: ${fhirPatientId}`);
            }
            const testCode = this.extractTestCode(serviceRequest.code);
            const testName = this.extractTestName(serviceRequest.code);
            const loincCode = this.extractLoincCode(serviceRequest.code);
            const priority = this.mapPriority(serviceRequest.priority);
            const orderDate = serviceRequest.authoredOn
                ? new Date(serviceRequest.authoredOn)
                : new Date();
            const status = this.mapServiceRequestStatus(serviceRequest.status);
            const labOrderData = {
                patientId: new mongoose_1.Types.ObjectId(patientMapping.internalPatientId),
                orderedBy: new mongoose_1.Types.ObjectId(patientMapping.internalPatientId),
                workplaceId: new mongoose_1.Types.ObjectId(patientMapping.workplaceId),
                tests: [{
                        code: testCode,
                        name: testName,
                        loincCode,
                        indication: this.extractIndication(serviceRequest),
                        priority,
                    }],
                status,
                orderDate,
                externalOrderId: serviceRequest.id,
                fhirReference: `ServiceRequest/${serviceRequest.id}`,
                clinicalIndication: this.extractIndication(serviceRequest),
                orderNumber: `FHIR-${serviceRequest.id}`,
                createdBy: new mongoose_1.Types.ObjectId(patientMapping.internalPatientId),
            };
            const LabOrder = (await Promise.resolve().then(() => __importStar(require('../models/LabOrder')))).default;
            const labOrder = new LabOrder(labOrderData);
            await labOrder.save();
            logger_1.default.info('FHIR ServiceRequest imported successfully', {
                fhirId: serviceRequest.id,
                internalId: labOrder._id,
                testCode,
                testName,
                patientId: patientMapping.internalPatientId,
            });
            return labOrder;
        }
        catch (error) {
            logger_1.default.error('Failed to process FHIR ServiceRequest:', error);
            throw error;
        }
    }
    async exportLabOrder(labOrder) {
        try {
            const serviceRequest = {
                resourceType: 'ServiceRequest',
                id: labOrder._id.toString(),
                status: this.mapInternalStatusToFHIR(labOrder.status),
                intent: 'order',
                priority: this.mapInternalPriorityToFHIR(labOrder.tests[0]?.priority || 'routine'),
                code: {
                    coding: labOrder.tests.map(test => ({
                        system: test.loincCode ? 'http://loinc.org' : 'http://terminology.hl7.org/CodeSystem/v2-0074',
                        code: test.loincCode || test.code,
                        display: test.name,
                    })),
                    text: labOrder.tests.map(test => test.name).join(', '),
                },
                subject: {
                    reference: `Patient/${labOrder.patientId}`,
                },
                authoredOn: labOrder.orderDate.toISOString(),
                requester: {
                    reference: `Practitioner/${labOrder.orderedBy}`,
                },
                reasonCode: labOrder.tests.map(test => ({
                    coding: [],
                    text: test.indication,
                })),
            };
            return serviceRequest;
        }
        catch (error) {
            logger_1.default.error('Failed to export lab order as FHIR ServiceRequest:', error);
            throw error;
        }
    }
    async submitLabOrder(serviceRequest) {
        try {
            const response = await this.client.post('/ServiceRequest', serviceRequest);
            logger_1.default.info('Lab order submitted to FHIR server', {
                fhirId: response.data.id,
                status: response.status,
            });
            return response.data.id;
        }
        catch (error) {
            logger_1.default.error('Failed to submit lab order to FHIR server:', error);
            throw error;
        }
    }
    async fetchLabResults(patientId, fromDate, toDate) {
        try {
            const params = new URLSearchParams({
                'subject': `Patient/${patientId}`,
                'category': 'laboratory',
                '_sort': '-date',
            });
            if (fromDate) {
                params.append('date', `ge${fromDate.toISOString()}`);
            }
            if (toDate) {
                params.append('date', `le${toDate.toISOString()}`);
            }
            const response = await this.client.get(`/Observation?${params.toString()}`);
            logger_1.default.info('Lab results fetched from FHIR server', {
                patientId,
                resultCount: response.data.total || 0,
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error('Failed to fetch lab results from FHIR server:', error);
            throw error;
        }
    }
    async testConnection() {
        try {
            const response = await this.client.get('/metadata');
            logger_1.default.info('FHIR server connection test successful', {
                version: response.data.fhirVersion,
                software: response.data.software?.name,
            });
            return true;
        }
        catch (error) {
            logger_1.default.error('FHIR server connection test failed:', error);
            return false;
        }
    }
    extractTestCode(code) {
        if (code && code.coding && code.coding.length > 0) {
            return code.coding[0]?.code || 'UNKNOWN';
        }
        return code?.text || 'UNKNOWN';
    }
    extractTestName(code) {
        if (code && code.coding && code.coding.length > 0) {
            return code.coding[0]?.display || code.coding[0]?.code || 'Unknown Test';
        }
        return code?.text || 'Unknown Test';
    }
    extractLoincCode(code) {
        if (code && code.coding) {
            const loincCoding = code.coding.find((c) => c && c.system === 'http://loinc.org');
            return loincCoding?.code;
        }
        return undefined;
    }
    extractValue(observation) {
        if (observation.valueQuantity) {
            return {
                value: observation.valueQuantity.value.toString(),
                unit: observation.valueQuantity.unit,
                numericValue: observation.valueQuantity.value,
            };
        }
        if (observation.valueString) {
            return {
                value: observation.valueString,
            };
        }
        if (observation.valueCodeableConcept) {
            return {
                value: observation.valueCodeableConcept.text ||
                    observation.valueCodeableConcept.coding[0]?.display ||
                    'Unknown',
            };
        }
        return { value: 'No value' };
    }
    extractReferenceRange(observation) {
        if (observation.referenceRange && observation.referenceRange.length > 0) {
            const range = observation.referenceRange[0];
            if (range) {
                return {
                    low: range.low?.value,
                    high: range.high?.value,
                    text: range.text,
                    unit: range.low?.unit || range.high?.unit,
                };
            }
        }
        return {};
    }
    extractInterpretation(observation) {
        if (observation.interpretation && observation.interpretation.length > 0) {
            const interp = observation.interpretation[0];
            if (interp && interp.coding && interp.coding.length > 0) {
                const coding = interp.coding[0];
                if (coding && coding.code) {
                    const code = coding.code.toLowerCase();
                    switch (code) {
                        case 'l':
                        case 'low':
                            return 'low';
                        case 'h':
                        case 'high':
                            return 'high';
                        case 'hh':
                        case 'll':
                        case 'critical':
                            return 'critical';
                        case 'n':
                        case 'normal':
                            return 'normal';
                        default:
                            return 'abnormal';
                    }
                }
            }
        }
        return 'normal';
    }
    extractCategory(observation) {
        if (observation.category && observation.category.length > 0) {
            const category = observation.category[0];
            if (category && category.coding && category.coding.length > 0) {
                const coding = category.coding[0];
                if (coding) {
                    return coding.display || coding.code;
                }
            }
        }
        return undefined;
    }
    extractFlags(observation) {
        const flags = [];
        if (observation.interpretation) {
            observation.interpretation.forEach(interp => {
                if (interp.text) {
                    flags.push(interp.text);
                }
            });
        }
        return flags;
    }
    extractNotes(observation) {
        if (observation.note && observation.note.length > 0) {
            return observation.note.map(note => note.text).join('; ');
        }
        return undefined;
    }
    extractIndication(serviceRequest) {
        if (serviceRequest.reasonCode && serviceRequest.reasonCode.length > 0) {
            const reasonCode = serviceRequest.reasonCode[0];
            if (reasonCode) {
                return reasonCode.text ||
                    reasonCode.coding?.[0]?.display ||
                    'Clinical indication';
            }
        }
        return 'Clinical indication';
    }
    mapPriority(fhirPriority) {
        switch (fhirPriority) {
            case 'stat':
                return 'stat';
            case 'urgent':
            case 'asap':
                return 'urgent';
            default:
                return 'routine';
        }
    }
    mapServiceRequestStatus(fhirStatus) {
        switch (fhirStatus) {
            case 'active':
            case 'draft':
                return 'ordered';
            case 'on-hold':
                return 'collected';
            case 'completed':
                return 'completed';
            case 'revoked':
            case 'entered-in-error':
                return 'cancelled';
            default:
                return 'ordered';
        }
    }
    mapInternalStatusToFHIR(status) {
        switch (status) {
            case 'ordered':
                return 'active';
            case 'collected':
                return 'on-hold';
            case 'processing':
                return 'active';
            case 'completed':
                return 'completed';
            case 'cancelled':
                return 'revoked';
            default:
                return 'unknown';
        }
    }
    mapInternalPriorityToFHIR(priority) {
        switch (priority) {
            case 'stat':
                return 'stat';
            case 'urgent':
                return 'urgent';
            default:
                return 'routine';
        }
    }
}
exports.FHIRService = FHIRService;
exports.default = FHIRService;
//# sourceMappingURL=fhirService.js.map