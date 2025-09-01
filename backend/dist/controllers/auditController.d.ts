import { Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare class AuditController {
    getAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    getAuditSummary(req: AuthRequest, res: Response): Promise<void>;
    getSecurityAlerts(req: AuthRequest, res: Response): Promise<void>;
    exportAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    private calculateOverallRiskScore;
    private calculateComplianceScore;
    private analyzeSecurityPatterns;
    private convertToCSV;
}
export declare const auditController: AuditController;
//# sourceMappingURL=auditController.d.ts.map