import { ILabOrder } from '../models/LabOrder';
export interface FHIRConfig {
    baseUrl: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    version: 'R4' | 'STU3' | 'DSTU2';
    timeout: number;
    retryAttempts: number;
}
export interface FHIRObservation {
    resourceType: 'Observation';
    id: string;
    status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
    category?: Array<{
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
    }>;
    code: {
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
        text?: string;
    };
    subject: {
        reference: string;
        display?: string;
    };
    effectiveDateTime?: string;
    issued?: string;
    valueQuantity?: {
        value: number;
        unit: string;
        system: string;
        code: string;
    };
    valueString?: string;
    valueCodeableConcept?: {
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
        text?: string;
    };
    referenceRange?: Array<{
        low?: {
            value: number;
            unit: string;
            system: string;
            code: string;
        };
        high?: {
            value: number;
            unit: string;
            system: string;
            code: string;
        };
        type?: {
            coding: Array<{
                system: string;
                code: string;
                display: string;
            }>;
        };
        text?: string;
    }>;
    interpretation?: Array<{
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
        text?: string;
    }>;
    note?: Array<{
        text: string;
    }>;
    performer?: Array<{
        reference: string;
        display?: string;
    }>;
    device?: {
        reference: string;
        display?: string;
    };
}
export interface FHIRServiceRequest {
    resourceType: 'ServiceRequest';
    id: string;
    status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
    intent: 'proposal' | 'plan' | 'directive' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
    priority?: 'routine' | 'urgent' | 'asap' | 'stat';
    code: {
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
        text?: string;
    };
    subject: {
        reference: string;
        display?: string;
    };
    authoredOn?: string;
    requester?: {
        reference: string;
        display?: string;
    };
    reasonCode?: Array<{
        coding: Array<{
            system: string;
            code: string;
            display: string;
        }>;
        text?: string;
    }>;
    note?: Array<{
        text: string;
    }>;
}
export interface FHIRBundle {
    resourceType: 'Bundle';
    id: string;
    type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
    timestamp?: string;
    total?: number;
    entry: Array<{
        fullUrl?: string;
        resource: FHIRObservation | FHIRServiceRequest | any;
        search?: {
            mode: 'match' | 'include' | 'outcome';
            score?: number;
        };
    }>;
}
export interface PatientMapping {
    fhirPatientId: string;
    internalPatientId: string;
    workplaceId: string;
}
export interface FHIRImportResult {
    imported: Array<{
        fhirId: string;
        internalId: string;
        type: 'observation' | 'serviceRequest';
        status: 'success';
    }>;
    failed: Array<{
        fhirId: string;
        type: 'observation' | 'serviceRequest';
        status: 'failed';
        error: string;
        resource?: any;
    }>;
}
export interface FHIRAuthConfig {
    type: 'oauth2' | 'basic' | 'bearer' | 'none';
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    scope?: string;
    username?: string;
    password?: string;
    bearerToken?: string;
}
export declare class FHIRService {
    private client;
    private config;
    private authConfig?;
    private accessToken?;
    private tokenExpiry?;
    constructor(config: FHIRConfig, authConfig?: FHIRAuthConfig);
    private ensureAuthenticated;
    private authenticateOAuth2;
    importLabResults(bundle: FHIRBundle, patientMappings: PatientMapping[]): Promise<FHIRImportResult>;
    private processObservation;
    private processServiceRequest;
    exportLabOrder(labOrder: ILabOrder): Promise<FHIRServiceRequest>;
    submitLabOrder(serviceRequest: FHIRServiceRequest): Promise<string>;
    fetchLabResults(patientId: string, fromDate?: Date, toDate?: Date): Promise<FHIRBundle>;
    testConnection(): Promise<boolean>;
    private extractTestCode;
    private extractTestName;
    private extractLoincCode;
    private extractValue;
    private extractReferenceRange;
    private extractInterpretation;
    private extractCategory;
    private extractFlags;
    private extractNotes;
    private extractIndication;
    private mapPriority;
    private mapServiceRequestStatus;
    private mapInternalStatusToFHIR;
    private mapInternalPriorityToFHIR;
}
export default FHIRService;
//# sourceMappingURL=fhirService.d.ts.map