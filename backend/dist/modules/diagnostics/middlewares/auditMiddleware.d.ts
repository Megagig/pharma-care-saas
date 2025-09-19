import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../types/auth';
export interface AuditableRequest extends AuthRequest {
    auditData?: {
        action: string;
        details: Record<string, any>;
        complianceCategory: string;
        riskLevel?: 'low' | 'medium' | 'high' | 'critical';
        interventionId?: string;
        oldValues?: Record<string, any>;
        newValues?: Record<string, any>;
        changedFields?: string[];
        eventType?: string;
        entityType?: string;
        entityId?: string;
        patientId?: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
        aiMetadata?: any;
        regulatoryContext?: any;
    };
    startTime?: number;
    requestHash?: string;
}
export declare const auditTimer: (req: AuditableRequest, res: Response, next: NextFunction) => void;
export declare const diagnosticAuditLogger: (options?: {
    eventType?: string;
    entityType?: string;
    severity?: "low" | "medium" | "high" | "critical";
    skipSuccessLog?: boolean;
    requireConsent?: boolean;
    aiProcessing?: boolean;
}) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditDiagnosticRequest: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditAIProcessing: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditPharmacistReview: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditHighRiskActivity: (eventType: string, entityType: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditDataAccess: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const auditDataExport: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const setAuditData: (req: AuditableRequest, data: Partial<AuditableRequest["auditData"]>) => void;
export declare const setAIMetadata: (req: AuditableRequest, aiMetadata: any) => void;
export declare const setRegulatoryContext: (req: AuditableRequest, regulatoryContext: any) => void;
declare const _default: {
    auditTimer: (req: AuditableRequest, res: Response, next: NextFunction) => void;
    diagnosticAuditLogger: (options?: {
        eventType?: string;
        entityType?: string;
        severity?: "low" | "medium" | "high" | "critical";
        skipSuccessLog?: boolean;
        requireConsent?: boolean;
        aiProcessing?: boolean;
    }) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditDiagnosticRequest: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditAIProcessing: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditPharmacistReview: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditHighRiskActivity: (eventType: string, entityType: string) => (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditDataAccess: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    auditDataExport: (req: AuditableRequest, res: Response, next: NextFunction) => Promise<void>;
    setAuditData: (req: AuditableRequest, data: Partial<AuditableRequest["auditData"]>) => void;
    setAIMetadata: (req: AuditableRequest, aiMetadata: any) => void;
    setRegulatoryContext: (req: AuditableRequest, regulatoryContext: any) => void;
};
export default _default;
//# sourceMappingURL=auditMiddleware.d.ts.map