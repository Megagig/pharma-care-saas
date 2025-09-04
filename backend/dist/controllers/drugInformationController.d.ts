import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
    };
}
declare class DrugInformationController {
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
declare const _default: DrugInformationController;
export default _default;
//# sourceMappingURL=drugInformationController.d.ts.map