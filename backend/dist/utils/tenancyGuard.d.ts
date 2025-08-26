import mongoose from 'mongoose';
export interface TenancyOptions {
    pharmacyIdField?: string;
    softDeleteField?: string;
}
export declare function tenancyGuardPlugin(schema: mongoose.Schema, options?: TenancyOptions): void;
export declare function addAuditFields(schema: mongoose.Schema): void;
export declare function generateMRN(pharmacyCode: string, sequence: number): string;
export declare const NIGERIAN_STATES: string[];
export declare const BLOOD_GROUPS: string[];
export declare const GENOTYPES: string[];
export declare const MARITAL_STATUS: string[];
export declare const GENDERS: string[];
export declare const SEVERITY_LEVELS: string[];
export declare const DTP_TYPES: string[];
//# sourceMappingURL=tenancyGuard.d.ts.map