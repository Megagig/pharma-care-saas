import { Request, Response } from 'express';
import { AuthRequest as AuthRequestType } from '../types/auth';
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const verifyEmail: (req: Request, res: Response) => Promise<void>;
export declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
export declare const resetPassword: (req: Request, res: Response) => Promise<void>;
export declare const refreshToken: (req: Request, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
export declare const clearCookies: (req: Request, res: Response) => Promise<void>;
export declare const checkCookies: (req: Request, res: Response) => Promise<void>;
export declare const logoutAll: (req: Request, res: Response) => Promise<void>;
export declare const getMe: (req: AuthRequestType, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthRequestType, res: Response) => Promise<void>;
export declare const updateThemePreference: (req: AuthRequestType, res: Response) => Promise<void>;
export declare const registerWithWorkplace: (req: Request, res: Response) => Promise<void>;
export declare const findWorkplaceByInviteCode: (req: Request, res: Response) => Promise<void>;
export declare const checkCookiesStatus: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map