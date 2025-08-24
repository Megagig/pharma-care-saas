import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { ISubscription } from '../models/Subscription';
export interface AuthRequest extends Request {
    user?: IUser & {
        currentUsage?: number;
        usageLimit?: number;
    };
    subscription?: ISubscription | null;
}
type UserRole = 'pharmacist' | 'pharmacy_team' | 'pharmacy_outlet' | 'intern_pharmacist' | 'super_admin';
export declare const auth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authOptionalSubscription: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (permission: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireLicense: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireFeature: (featureKey: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const checkUsageLimit: (featureKey: string, limitKey: string) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireTeamAccess: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void | Response;
export {};
//# sourceMappingURL=auth.d.ts.map