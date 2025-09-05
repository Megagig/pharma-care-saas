import { IUser } from '../models/User';
import { AuthRequest } from '../types/auth';
declare class ConfidentialNoteService {
    private static instance;
    private constructor();
    static getInstance(): ConfidentialNoteService;
    canAccessConfidentialNotes(user: IUser): boolean;
    canCreateConfidentialNotes(user: IUser): boolean;
    canModifyConfidentialNote(user: IUser, note: any): boolean;
    applyConfidentialFilters(query: any, user: IUser, includeConfidential?: boolean): any;
    logConfidentialAccess(req: AuthRequest, noteId: string, action: string, details?: any): Promise<void>;
    sanitizeForAudit(noteData: any): any;
    getConfidentialNotesStats(workplaceId: string, user: IUser): Promise<any>;
    validateConfidentialNoteData(noteData: any, user: IUser): {
        valid: boolean;
        errors: string[];
    };
    applyConfidentialSecurity(noteData: any): any;
    requiresAccessJustification(note: any, user: IUser, action: string): boolean;
    getAccessJustificationPrompt(note: any, action: string): string;
}
export default ConfidentialNoteService;
//# sourceMappingURL=confidentialNoteService.d.ts.map