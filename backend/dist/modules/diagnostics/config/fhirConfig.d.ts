import { FHIRConfig, FHIRAuthConfig } from '../services/fhirService';
export interface FHIRServerConfig {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    config: FHIRConfig;
    auth?: FHIRAuthConfig;
    workplaceId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface FHIRConfigManager {
    getConfig(serverId: string, workplaceId?: string): Promise<FHIRServerConfig | null>;
    getAllConfigs(workplaceId?: string): Promise<FHIRServerConfig[]>;
    saveConfig(config: Omit<FHIRServerConfig, 'createdAt' | 'updatedAt'>): Promise<FHIRServerConfig>;
    updateConfig(serverId: string, updates: Partial<FHIRServerConfig>): Promise<FHIRServerConfig>;
    deleteConfig(serverId: string): Promise<boolean>;
    testConfig(serverId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
export declare const DEFAULT_FHIR_CONFIGS: Partial<FHIRServerConfig>[];
export declare function getEnvironmentFHIRConfig(): FHIRServerConfig | null;
export declare function validateFHIRConfig(config: FHIRServerConfig): {
    valid: boolean;
    errors: string[];
};
export declare function sanitizeFHIRConfig(config: FHIRServerConfig): Partial<FHIRServerConfig>;
export declare function getFHIRConfigForWorkplace(workplaceId: string): FHIRServerConfig | null;
export declare const REQUIRED_FHIR_CAPABILITIES: string[];
export declare const FHIR_PROFILES: {
    LAB_OBSERVATION: string;
    LAB_SERVICE_REQUEST: string;
    US_CORE_PATIENT: string;
};
export declare const COMMON_LOINC_CODES: {
    GLUCOSE: string;
    CREATININE: string;
    SODIUM: string;
    POTASSIUM: string;
    CHLORIDE: string;
    CO2: string;
    BUN: string;
    HEMOGLOBIN: string;
    HEMATOCRIT: string;
    WBC: string;
    PLATELETS: string;
    TOTAL_CHOLESTEROL: string;
    HDL_CHOLESTEROL: string;
    LDL_CHOLESTEROL: string;
    TRIGLYCERIDES: string;
    ALT: string;
    AST: string;
    BILIRUBIN_TOTAL: string;
    ALKALINE_PHOSPHATASE: string;
    TROPONIN_I: string;
    CK_MB: string;
    BNP: string;
    TSH: string;
    T4_FREE: string;
    T3_FREE: string;
    HBA1C: string;
    GLUCOSE_RANDOM: string;
    GLUCOSE_FASTING: string;
};
declare const _default: {
    DEFAULT_FHIR_CONFIGS: Partial<FHIRServerConfig>[];
    getEnvironmentFHIRConfig: typeof getEnvironmentFHIRConfig;
    validateFHIRConfig: typeof validateFHIRConfig;
    sanitizeFHIRConfig: typeof sanitizeFHIRConfig;
    getFHIRConfigForWorkplace: typeof getFHIRConfigForWorkplace;
    REQUIRED_FHIR_CAPABILITIES: string[];
    FHIR_PROFILES: {
        LAB_OBSERVATION: string;
        LAB_SERVICE_REQUEST: string;
        US_CORE_PATIENT: string;
    };
    COMMON_LOINC_CODES: {
        GLUCOSE: string;
        CREATININE: string;
        SODIUM: string;
        POTASSIUM: string;
        CHLORIDE: string;
        CO2: string;
        BUN: string;
        HEMOGLOBIN: string;
        HEMATOCRIT: string;
        WBC: string;
        PLATELETS: string;
        TOTAL_CHOLESTEROL: string;
        HDL_CHOLESTEROL: string;
        LDL_CHOLESTEROL: string;
        TRIGLYCERIDES: string;
        ALT: string;
        AST: string;
        BILIRUBIN_TOTAL: string;
        ALKALINE_PHOSPHATASE: string;
        TROPONIN_I: string;
        CK_MB: string;
        BNP: string;
        TSH: string;
        T4_FREE: string;
        T3_FREE: string;
        HBA1C: string;
        GLUCOSE_RANDOM: string;
        GLUCOSE_FASTING: string;
    };
};
export default _default;
//# sourceMappingURL=fhirConfig.d.ts.map