import { Response } from 'express';
import { AuthRequest } from '../types/auth';
declare class CommunicationAuditController {
    getAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    getConversationAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    getHighRiskActivities(req: AuthRequest, res: Response): Promise<void>;
    generateComplianceReport(req: AuthRequest, res: Response): Promise<void>;
    exportAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    getUserActivitySummary(req: AuthRequest, res: Response): Promise<void>;
    getAuditStatistics(req: AuthRequest, res: Response): Promise<void>;
    searchAuditLogs(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: CommunicationAuditController;
export default _default;
//# sourceMappingURL=communicationAuditController.d.ts.map