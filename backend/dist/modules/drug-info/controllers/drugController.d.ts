import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
    };
}
declare class DrugController {
    searchDrugs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getMonograph(req: Request, res: Response, next: NextFunction): Promise<void>;
    checkInteractions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAdverseEffects(req: Request, res: Response, next: NextFunction): Promise<void>;
    getFormulary(req: Request, res: Response, next: NextFunction): Promise<void>;
    createTherapyPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getTherapyPlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getTherapyPlanById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateTherapyPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    deleteTherapyPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: DrugController;
export default _default;
//# sourceMappingURL=drugController.d.ts.map