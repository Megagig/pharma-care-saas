import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: any;
}
export declare const getNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientNotes: (req: AuthRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=noteController.d.ts.map