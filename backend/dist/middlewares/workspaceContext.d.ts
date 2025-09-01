import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
export declare const loadWorkspaceContext: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const clearWorkspaceCache: (userId?: string) => void;
export declare const requireWorkspaceContext: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireWorkspace: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireActiveSubscription: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    loadWorkspaceContext: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireWorkspaceContext: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireWorkspace: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireActiveSubscription: (req: AuthRequest, res: Response, next: NextFunction) => void;
    clearWorkspaceCache: (userId?: string) => void;
};
export default _default;
//# sourceMappingURL=workspaceContext.d.ts.map