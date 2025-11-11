import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare const requireDiagnosticRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticCreate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticProcess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticApprove: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticIntervention: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticCancel: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticRetry: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireDiagnosticAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAIDiagnosticsFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireLabIntegrationFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireDrugInteractionFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireDiagnosticAnalyticsFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireDiagnosticAnalyticsFeatureOrTrial: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireSeniorPharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const checkDiagnosticLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkAIProcessingLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkDiagnosticAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkDiagnosticResultAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validatePatientConsent: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const diagnosticCreateMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const diagnosticProcessMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const diagnosticReviewMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const diagnosticApproveMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
export declare const diagnosticAnalyticsMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
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
    requireDiagnosticRead: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticCreate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticProcess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticApprove: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticIntervention: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticCancel: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticRetry: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireDiagnosticAnalytics: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireAIDiagnosticsFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireLabIntegrationFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireDrugInteractionFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireDiagnosticAnalyticsFeature: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requirePharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireSeniorPharmacistRole: (req: AuthRequest, res: Response, next: NextFunction) => void;
    checkDiagnosticLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    checkAIProcessingLimits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    checkDiagnosticAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    checkDiagnosticResultAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validatePatientConsent: (req: AuthRequest, res: Response, next: NextFunction) => void;
    diagnosticCreateMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    diagnosticProcessMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    diagnosticReviewMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    diagnosticApproveMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
    diagnosticAnalyticsMiddleware: ((req: AuthRequest, res: Response, next: NextFunction) => void)[];
};
export default _default;
//# sourceMappingURL=diagnosticRBAC.d.ts.map