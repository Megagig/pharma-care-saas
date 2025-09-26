import { Request, Response } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        systemRole: string;
        workplaceRole?: string;
        assignedRoles?: string[];
    };
    workspaceContext?: {
        workspaceId: string;
    };
}
declare class RBACSecurityAuditController {
    static getAuditDashboard(req: AuthRequest, res: Response): Promise<void>;
    static getAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    static getUserAuditTrail(req: AuthRequest, res: Response): Promise<void>;
    static getRoleAuditTrail(req: AuthRequest, res: Response): Promise<void>;
    static exportAuditLogs(req: AuthRequest, res: Response): Promise<void>;
    static getComplianceReport(req: AuthRequest, res: Response): Promise<void>;
    static getSecurityAlerts(req: AuthRequest, res: Response): Promise<void>;
    static resolveSecurityAlert(req: AuthRequest, res: Response): Promise<void>;
    static getAuditStatistics(req: AuthRequest, res: Response): Promise<void>;
}
export { RBACSecurityAuditController };
export default RBACSecurityAuditController;
//# sourceMappingURL=rbacAuditController.d.ts.map