import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { IWorkplace } from '../models/Workplace';
import { ISubscription } from '../models/Subscription';
export interface CompatibilityRequest extends Request {
    user?: IUser;
    subscription?: ISubscription | null;
    workplace?: IWorkplace | null;
    plan?: any;
    pharmacy?: IWorkplace;
    userSubscription?: ISubscription;
}
export declare const compatibilityAuth: (req: CompatibilityRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const compatibilityAuthOptional: (req: CompatibilityRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const compatibilityResponse: (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
export declare const legacyEndpointWrapper: (newHandler: (req: CompatibilityRequest, res: Response, next: NextFunction) => void) => (req: CompatibilityRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkSubscriptionCompatibility: (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
export declare const checkFeatureCompatibility: (featureKey: string) => (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
export declare const migrationStatusChecker: (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    compatibilityAuth: (req: CompatibilityRequest, res: Response, next: NextFunction) => Promise<void>;
    compatibilityAuthOptional: (req: CompatibilityRequest, res: Response, next: NextFunction) => Promise<void>;
    compatibilityResponse: (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
    legacyEndpointWrapper: (newHandler: (req: CompatibilityRequest, res: Response, next: NextFunction) => void) => (req: CompatibilityRequest, res: Response, next: NextFunction) => Promise<void>;
    checkSubscriptionCompatibility: (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
    checkFeatureCompatibility: (featureKey: string) => (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
    migrationStatusChecker: (req: CompatibilityRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=compatibilityLayer.d.ts.map