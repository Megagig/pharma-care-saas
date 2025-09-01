import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare const createInvitation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getWorkspaceInvitations: (req: AuthRequest, res: Response) => Promise<void>;
export declare const cancelInvitation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const acceptInvitation: (req: AuthRequest, res: Response) => Promise<void>;
export declare const validateInvitation: (req: Request, res: Response) => Promise<void>;
export declare const getInvitationAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getInvitationStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const checkInvitationLimits: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=invitationController.d.ts.map