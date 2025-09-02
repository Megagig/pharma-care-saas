import { Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare class SecurityController {
    getSecurityThreats(req: AuthRequest, res: Response): Promise<void>;
    getSecurityDashboard(req: AuthRequest, res: Response): Promise<void>;
    resolveThreat(req: AuthRequest, res: Response): Promise<void>;
    getUserSecurityStatus(req: AuthRequest, res: Response): Promise<void>;
    getBlockedIPs(req: AuthRequest, res: Response): Promise<void>;
    private generateSecurityRecommendations;
}
export declare const securityController: SecurityController;
//# sourceMappingURL=securityController.d.ts.map