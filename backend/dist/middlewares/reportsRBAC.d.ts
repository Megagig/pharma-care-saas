import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const requireReportAccess: (reportType?: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireTemplateAccess: (action?: "view" | "edit" | "delete" | "clone") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireScheduleAccess: (action?: "view" | "edit" | "delete" | "execute") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireExportPermission: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateDataAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const enforceWorkspaceIsolation: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare module '../types/auth' {
    interface AuthRequest {
        template?: any;
        schedule?: any;
        dataContext?: {
            dataTypes: string[];
            sensitiveData: boolean;
            anonymized: boolean;
        };
    }
}
declare const _default: {
    requireReportAccess: (reportType?: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireTemplateAccess: (action?: "view" | "edit" | "delete" | "clone") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireScheduleAccess: (action?: "view" | "edit" | "delete" | "execute") => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireExportPermission: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateDataAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    enforceWorkspaceIsolation: (req: AuthRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=reportsRBAC.d.ts.map