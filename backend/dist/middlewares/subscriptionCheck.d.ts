import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const requireActiveSubscription: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=subscriptionCheck.d.ts.map