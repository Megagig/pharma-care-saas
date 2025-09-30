import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const generateDiagnosticAnalysis: (req: AuthRequest, res: Response) => Promise<void>;
export declare const saveDiagnosticDecision: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDiagnosticHistory: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDiagnosticCase: (req: AuthRequest, res: Response) => Promise<void>;
export declare const checkDrugInteractions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const testAIConnection: (req: AuthRequest, res: Response) => Promise<void>;
export declare const saveDiagnosticNotes: (req: AuthRequest, res: Response) => Promise<void>;
declare const _default: {
    generateDiagnosticAnalysis: (req: AuthRequest, res: Response) => Promise<void>;
    saveDiagnosticDecision: (req: AuthRequest, res: Response) => Promise<void>;
    getDiagnosticHistory: (req: AuthRequest, res: Response) => Promise<void>;
    getDiagnosticCase: (req: AuthRequest, res: Response) => Promise<void>;
    checkDrugInteractions: (req: AuthRequest, res: Response) => Promise<void>;
    testAIConnection: (req: AuthRequest, res: Response) => Promise<void>;
    saveDiagnosticNotes: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=diagnosticController.d.ts.map