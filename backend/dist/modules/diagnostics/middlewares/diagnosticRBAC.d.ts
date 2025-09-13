import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth';
export declare const requireDiagnosticRead: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticCreate: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticProcess: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticReview: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticApprove: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticIntervention: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticCancel: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticRetry: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticAnalytics: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAIDiagnosticsFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireLabIntegrationFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireDrugInteractionFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireDiagnosticAnalyticsFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireSeniorPharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const checkDiagnosticLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkAIProcessingLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkDiagnosticAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkDiagnosticResultAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validatePatientConsent: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const diagnosticCreateMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
export declare const diagnosticProcessMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
export declare const diagnosticReviewMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
export declare const diagnosticApproveMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
export declare const diagnosticAnalyticsMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
declare global {
    namespace Express {
        interface Request {
            diagnosticUsage?: {
                current: number;
                limit: number;
                remaining: number;
            };
            aiUsage?: {
                tokens: {
                    current: number;
                    limit: number;
                    remaining: number;
                };
            };
            diagnosticRequest?: any;
            diagnosticResult?: any;
        }
    }
}
declare const _default: {
    requireDiagnosticRead: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticCreate: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticProcess: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticReview: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticApprove: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticIntervention: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticCancel: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticRetry: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticAnalytics: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireAIDiagnosticsFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
    requireLabIntegrationFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
    requireDrugInteractionFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
    requireDiagnosticAnalyticsFeature: (req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void;
    requirePharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireSeniorPharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
    checkDiagnosticLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    checkAIProcessingLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    checkDiagnosticAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    checkDiagnosticResultAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validatePatientConsent: (req: AuthRequest, res: Response, next: NextFunction) => void;
    diagnosticCreateMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
    diagnosticProcessMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
    diagnosticReviewMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
    diagnosticApproveMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
    diagnosticAnalyticsMiddleware: (((req: import("../../../types/auth").AuthRequest, res: Response, next: NextFunction) => void) | ((req: AuthRequest, res: Response, next: NextFunction) => void))[];
};
export default _default;
//# sourceMappingURL=diagnosticRBAC.d.ts.map