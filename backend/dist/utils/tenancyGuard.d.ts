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
export declare const DTP_CATEGORIES: string[];
export declare const DTP_SEVERITIES: string[];
export declare const EVIDENCE_LEVELS: string[];
import { AuthRequest } from '../types/auth';
interface TenancyContext {
    workplaceId: string;
    userId: string;
    userRole: string;
    workplaceRole?: string;
}
export declare class EnhancedTenancyGuard {
    static createContext(req: AuthRequest): TenancyContext | null;
    static applyTenancyFilter(query: any, context: TenancyContext): any;
    static validateResourceAccess(resource: any, context: TenancyContext, resourceType?: string): boolean;
    static validateClinicalNoteAccess(note: any, patient: any, context: TenancyContext): {
        valid: boolean;
        errors: string[];
    };
    static createSecureClinicalNoteQuery(context: TenancyContext, baseQuery?: any, includeConfidential?: boolean): any;
    static validateAttachmentAccess(note: any, attachment: any, context: TenancyContext): boolean;
    static logTenancyViolation(context: TenancyContext, violationType: string, details?: any): void;
}
export {};
//# sourceMappingURL=tenancyGuard.d.ts.map