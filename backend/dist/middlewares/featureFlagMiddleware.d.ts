import { Request, Response, NextFunction } from 'express';
import { IFeatureFlag } from '../models/FeatureFlag';
import { IUser } from '../models/User';
import { ISubscription } from '../models/Subscription';
interface FeatureFlagRequest extends Request {
    user?: IUser;
    subscription?: ISubscription;
    featureFlag?: IFeatureFlag;
}
export declare const loadFeatureFlag: (featureKey: string) => (req: FeatureFlagRequest, res: Response, next: NextFunction) => Promise<void | Response>;
export declare const gateAccess: () => (req: FeatureFlagRequest, res: Response, next: NextFunction) => Promise<void | Response>;
export declare const requireFeatureAccess: (featureKey: string) => ((req: FeatureFlagRequest, res: Response, next: NextFunction) => Promise<void | Response>)[];
export declare const trackFeatureUsage: (featureKey: string) => (req: FeatureFlagRequest, res: Response, next: NextFunction) => Promise<void | Response>;
export {};
//# sourceMappingURL=featureFlagMiddleware.d.ts.map