import { Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare class AdminDashboardController {
    getDashboardOverview(req: AuthRequest, res: Response): Promise<any>;
    getWorkspaceManagement(req: AuthRequest, res: Response): Promise<any>;
    updateWorkspaceSubscription(req: AuthRequest, res: Response): Promise<any>;
    getInvitationManagement(req: AuthRequest, res: Response): Promise<any>;
    cancelInvitation(req: AuthRequest, res: Response): Promise<any>;
    getSystemHealth(req: AuthRequest, res: Response): Promise<any>;
    private calculateGrowthRate;
}
export declare const adminDashboardController: AdminDashboardController;
//# sourceMappingURL=adminDashboardController.d.ts.map