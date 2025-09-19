import { Response } from 'express';
import { AuthRequest } from '../types/auth';
export declare const getNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteNote: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const searchNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getNotesWithFilters: (req: AuthRequest, res: Response) => Promise<void>;
export declare const bulkUpdateNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const bulkDeleteNotes: (req: AuthRequest, res: Response) => Promise<void>;
export declare const uploadAttachment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteAttachment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const downloadAttachment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getNoteStatistics: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=noteController.d.ts.map