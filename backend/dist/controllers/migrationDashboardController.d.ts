import { Request, Response } from 'express';
export declare class MigrationDashboardController {
    static getStatus(req: Request, res: Response): Promise<void>;
    static getMetrics(req: Request, res: Response): Promise<void>;
    static runValidation(req: Request, res: Response): Promise<void>;
    static getAlerts(req: Request, res: Response): Promise<void>;
    static resolveAlert(req: Request, res: Response): Promise<void>;
    static generateReport(req: Request, res: Response): Promise<void>;
    static runDryRun(req: Request, res: Response): Promise<void>;
    static executeMigration(req: Request, res: Response): Promise<void>;
    static executeRollback(req: Request, res: Response): Promise<void>;
    static getProgress(req: Request, res: Response): Promise<void>;
    static getHealthCheck(req: Request, res: Response): Promise<void>;
}
export default MigrationDashboardController;
//# sourceMappingURL=migrationDashboardController.d.ts.map