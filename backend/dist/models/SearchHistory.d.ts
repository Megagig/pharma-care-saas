import mongoose, { Document } from 'mongoose';
export interface ISearchHistory extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    query: string;
    filters: {
        conversationId?: string;
        senderId?: string;
        messageType?: string;
        priority?: string;
        dateFrom?: Date;
        dateTo?: Date;
        tags?: string[];
    };
    resultCount: number;
    searchType: 'message' | 'conversation';
    executionTime: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISavedSearch extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    query: string;
    filters: {
        conversationId?: string;
        senderId?: string;
        messageType?: string;
        priority?: string;
        dateFrom?: Date;
        dateTo?: Date;
        tags?: string[];
    };
    searchType: 'message' | 'conversation';
    isPublic: boolean;
    lastUsed?: Date;
    useCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SearchHistory: mongoose.Model<ISearchHistory, {}, {}, {}, mongoose.Document<unknown, {}, ISearchHistory> & ISearchHistory & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export declare const SavedSearch: mongoose.Model<ISavedSearch, {}, {}, {}, mongoose.Document<unknown, {}, ISavedSearch> & ISavedSearch & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
declare const _default: {
    SearchHistory: mongoose.Model<ISearchHistory, {}, {}, {}, mongoose.Document<unknown, {}, ISearchHistory> & ISearchHistory & Required<{
        _id: mongoose.Types.ObjectId;
    }>, any>;
    SavedSearch: mongoose.Model<ISavedSearch, {}, {}, {}, mongoose.Document<unknown, {}, ISavedSearch> & ISavedSearch & Required<{
        _id: mongoose.Types.ObjectId;
    }>, any>;
};
export default _default;
//# sourceMappingURL=SearchHistory.d.ts.map