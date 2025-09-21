import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        workplaceId: string;
        role: string;
    };
}
export declare class CommunicationController {
    getConversations(req: AuthenticatedRequest, res: Response): Promise<void>;
    createConversation(req: AuthenticatedRequest, res: Response): Promise<void>;
    getConversation(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateConversation(req: AuthenticatedRequest, res: Response): Promise<void>;
    addParticipant(req: AuthenticatedRequest, res: Response): Promise<void>;
    removeParticipant(req: AuthenticatedRequest, res: Response): Promise<void>;
    getMessages(req: AuthenticatedRequest, res: Response): Promise<void>;
    sendMessage(req: AuthenticatedRequest, res: Response): Promise<void>;
    markMessageAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    addReaction(req: AuthenticatedRequest, res: Response): Promise<void>;
    removeReaction(req: AuthenticatedRequest, res: Response): Promise<void>;
    editMessage(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteMessage(req: AuthenticatedRequest, res: Response): Promise<void>;
    getMessageStatuses(req: AuthenticatedRequest, res: Response): Promise<void>;
    searchMessages(req: AuthenticatedRequest, res: Response): Promise<void>;
    searchConversations(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPatientConversations(req: AuthenticatedRequest, res: Response): Promise<void>;
    createPatientQuery(req: AuthenticatedRequest, res: Response): Promise<void>;
    getAnalyticsSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    uploadFiles(req: AuthenticatedRequest, res: Response): Promise<void>;
    getFile(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteFile(req: AuthenticatedRequest, res: Response): Promise<void>;
    getConversationFiles(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSearchSuggestions(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSearchHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPopularSearches(req: AuthenticatedRequest, res: Response): Promise<void>;
    saveSearch(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSavedSearches(req: AuthenticatedRequest, res: Response): Promise<void>;
    useSavedSearch(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteSavedSearch(req: AuthenticatedRequest, res: Response): Promise<void>;
    createThread(req: AuthenticatedRequest, res: Response): Promise<void>;
    getThreadMessages(req: AuthenticatedRequest, res: Response): Promise<void>;
    getThreadSummary(req: AuthenticatedRequest, res: Response): Promise<void>;
    replyToThread(req: AuthenticatedRequest, res: Response): Promise<void>;
    getConversationThreads(req: AuthenticatedRequest, res: Response): Promise<void>;
}
export declare const communicationController: CommunicationController;
export default communicationController;
//# sourceMappingURL=communicationController.d.ts.map