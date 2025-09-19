import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
    subscription?: any;
}
export declare class AdminController {
    getAllUsers(req: AuthRequest, res: Response): Promise<any>;
    getUserById(req: AuthRequest, res: Response): Promise<any>;
    updateUserRole(req: AuthRequest, res: Response): Promise<any>;
    suspendUser(req: AuthRequest, res: Response): Promise<any>;
    reactivateUser(req: AuthRequest, res: Response): Promise<any>;
    getPendingLicenses(req: AuthRequest, res: Response): Promise<any>;
    approveLicense(req: AuthRequest, res: Response): Promise<any>;
    rejectLicense(req: AuthRequest, res: Response): Promise<any>;
    createFeatureFlag(req: AuthRequest, res: Response): Promise<any>;
    updateFeatureFlag(req: AuthRequest, res: Response): Promise<any>;
    getAllFeatureFlags(req: AuthRequest, res: Response): Promise<any>;
    getSystemAnalytics(req: AuthRequest, res: Response): Promise<any>;
}
export declare const adminController: AdminController;
export {};
//# sourceMappingURL=adminController.d.ts.map