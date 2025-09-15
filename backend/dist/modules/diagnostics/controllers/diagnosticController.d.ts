import { Response } from 'express';
export declare const createDiagnosticRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getDiagnosticRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const retryDiagnosticRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const cancelDiagnosticRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPatientDiagnosticHistory: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getDiagnosticDashboard: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const approveDiagnosticResult: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const rejectDiagnosticResult: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getPendingReviews: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const createInterventionFromResult: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getReviewWorkflowStatus: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getDiagnosticAnalytics: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=diagnosticController.d.ts.map