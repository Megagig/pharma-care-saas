import { IMessage } from "../models/Message";
import { IConversation } from "../models/Conversation";
export interface AdvancedSearchFilters {
    query?: string;
    conversationId?: string;
    senderId?: string;
    participantId?: string;
    messageType?: "text" | "file" | "image" | "clinical_note" | "system" | "voice_note";
    fileType?: string;
    priority?: "normal" | "high" | "urgent";
    hasAttachments?: boolean;
    hasMentions?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    tags?: string[];
    limit?: number;
    offset?: number;
    sortBy?: "relevance" | "date" | "sender";
    sortOrder?: "asc" | "desc";
}
export interface SearchResult {
    message: IMessage;
    conversation: IConversation;
    highlights?: {
        content?: string;
        title?: string;
    };
    score?: number;
}
export interface SearchStats {
    totalResults: number;
    searchTime: number;
    facets: {
        messageTypes: {
            type: string;
            count: number;
        }[];
        senders: {
            userId: string;
            name: string;
            count: number;
        }[];
        conversations: {
            conversationId: string;
            title: string;
            count: number;
        }[];
        dateRanges: {
            range: string;
            count: number;
        }[];
    };
}
export declare class MessageSearchService {
    searchMessages(workplaceId: string, userId: string, filters: AdvancedSearchFilters): Promise<{
        results: SearchResult[];
        stats: SearchStats;
    }>;
    searchConversations(workplaceId: string, userId: string, filters: Omit<AdvancedSearchFilters, "messageType" | "hasAttachments" | "hasMentions">): Promise<{
        results: IConversation[];
        stats: Partial<SearchStats>;
    }>;
    getSearchSuggestions(workplaceId: string, userId: string, query?: string): Promise<{
        suggestions: string[];
        popularSearches: string[];
        recentSearches: string[];
    }>;
    saveSearchHistory(userId: string, query: string, filters: AdvancedSearchFilters, resultCount: number): Promise<void>;
    private getUserConversations;
    private buildSearchPipeline;
    private buildConversationSearchPipeline;
    private getFacetedResults;
    private processSearchResults;
    private highlightText;
    private getPopularSearchTerms;
    private getUserRecentSearches;
    private generateQuerySuggestions;
}
export declare const messageSearchService: MessageSearchService;
export default messageSearchService;
//# sourceMappingURL=messageSearchService.d.ts.map