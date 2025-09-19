import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const authWithWorkspace: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authWithWorkspaceOptionalSubscription: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    authWithWorkspace: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    authWithWorkspaceOptionalSubscription: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=authWithWorkspace.d.ts.map