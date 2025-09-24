"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageSearchService = exports.MessageSearchService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = __importDefault(require("../models/Message"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const logger_1 = __importDefault(require("../utils/logger"));
class MessageSearchService {
    async searchMessages(workplaceId, userId, filters) {
        const startTime = Date.now();
        try {
            const userConversations = await this.getUserConversations(workplaceId, userId);
            const conversationIds = userConversations.map((c) => c._id);
            const pipeline = this.buildSearchPipeline(conversationIds, filters);
            const [searchResults, facetResults] = await Promise.all([
                Message_1.default.aggregate(pipeline),
                this.getFacetedResults(conversationIds, filters, workplaceId),
            ]);
            const processedResults = await this.processSearchResults(searchResults, filters.query);
            const searchTime = Date.now() - startTime;
            return {
                results: processedResults,
                stats: {
                    totalResults: processedResults.length,
                    searchTime,
                    facets: facetResults,
                },
            };
        }
        catch (error) {
            logger_1.default.error("Error in advanced message search:", error);
            throw error;
        }
    }
    async searchConversations(workplaceId, userId, filters) {
        const startTime = Date.now();
        try {
            const pipeline = this.buildConversationSearchPipeline(workplaceId, userId, filters);
            const results = await Conversation_1.default.aggregate(pipeline);
            const searchTime = Date.now() - startTime;
            return {
                results,
                stats: {
                    totalResults: results.length,
                    searchTime,
                },
            };
        }
        catch (error) {
            logger_1.default.error("Error in conversation search:", error);
            throw error;
        }
    }
    async getSearchSuggestions(workplaceId, userId, query) {
        try {
            const userConversations = await this.getUserConversations(workplaceId, userId);
            const conversationIds = userConversations.map((c) => c._id);
            const popularTerms = await this.getPopularSearchTerms(conversationIds);
            const recentSearches = await this.getUserRecentSearches(userId);
            const suggestions = query
                ? await this.generateQuerySuggestions(query, conversationIds)
                : [];
            return {
                suggestions,
                popularSearches: popularTerms,
                recentSearches,
            };
        }
        catch (error) {
            logger_1.default.error("Error getting search suggestions:", error);
            return {
                suggestions: [],
                popularSearches: [],
                recentSearches: [],
            };
        }
    }
    async saveSearchHistory(userId, query, filters, resultCount) {
        try {
            logger_1.default.info(`Saving search history for user ${userId}: "${query}" (${resultCount} results)`);
        }
        catch (error) {
            logger_1.default.error("Error saving search history:", error);
        }
    }
    async getUserConversations(workplaceId, userId) {
        return await Conversation_1.default.find({
            workplaceId,
            "participants.userId": userId,
            "participants.leftAt": { $exists: false },
            status: { $ne: "closed" },
        }).select("_id title type");
    }
    buildSearchPipeline(conversationIds, filters) {
        const pipeline = [];
        const matchStage = {
            conversationId: { $in: conversationIds },
        };
        if (filters.query) {
            matchStage.$text = { $search: filters.query };
        }
        if (filters.conversationId) {
            matchStage.conversationId = new mongoose_1.default.Types.ObjectId(filters.conversationId);
        }
        if (filters.senderId) {
            matchStage.senderId = new mongoose_1.default.Types.ObjectId(filters.senderId);
        }
        if (filters.messageType) {
            matchStage["content.type"] = filters.messageType;
        }
        if (filters.priority) {
            matchStage.priority = filters.priority;
        }
        if (filters.hasAttachments !== undefined) {
            if (filters.hasAttachments) {
                matchStage["content.attachments"] = { $exists: true, $ne: [] };
            }
            else {
                matchStage["content.attachments"] = { $exists: false };
            }
        }
        if (filters.hasMentions !== undefined) {
            if (filters.hasMentions) {
                matchStage.mentions = { $exists: true, $ne: [] };
            }
            else {
                matchStage.mentions = { $exists: false };
            }
        }
        if (filters.dateFrom || filters.dateTo) {
            matchStage.createdAt = {};
            if (filters.dateFrom) {
                matchStage.createdAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.createdAt.$lte = filters.dateTo;
            }
        }
        if (filters.fileType && filters.messageType === "file") {
            matchStage["content.attachments.mimeType"] = {
                $regex: filters.fileType,
                $options: "i",
            };
        }
        pipeline.push({ $match: matchStage });
        if (filters.query) {
            pipeline.push({
                $addFields: {
                    score: { $meta: "textScore" },
                },
            });
        }
        pipeline.push({
            $lookup: {
                from: "conversations",
                localField: "conversationId",
                foreignField: "_id",
                as: "conversation",
            },
        });
        pipeline.push({
            $unwind: "$conversation",
        });
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "senderId",
                foreignField: "_id",
                as: "sender",
            },
        });
        pipeline.push({
            $unwind: "$sender",
        });
        if (filters.participantId) {
            pipeline.push({
                $match: {
                    "conversation.participants.userId": new mongoose_1.default.Types.ObjectId(filters.participantId),
                },
            });
        }
        if (filters.tags && filters.tags.length > 0) {
            pipeline.push({
                $match: {
                    "conversation.tags": { $in: filters.tags },
                },
            });
        }
        const sortStage = {};
        if (filters.sortBy === "relevance" && filters.query) {
            sortStage.score = { $meta: "textScore" };
        }
        else if (filters.sortBy === "sender") {
            sortStage["sender.firstName"] = filters.sortOrder === "desc" ? -1 : 1;
        }
        else {
            sortStage.createdAt = filters.sortOrder === "asc" ? 1 : -1;
        }
        pipeline.push({ $sort: sortStage });
        if (filters.offset) {
            pipeline.push({ $skip: filters.offset });
        }
        if (filters.limit) {
            pipeline.push({ $limit: filters.limit });
        }
        pipeline.push({
            $project: {
                _id: 1,
                conversationId: 1,
                senderId: 1,
                content: 1,
                mentions: 1,
                priority: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                score: { $ifNull: ["$score", 0] },
                conversation: {
                    _id: "$conversation._id",
                    title: "$conversation.title",
                    type: "$conversation.type",
                    status: "$conversation.status",
                },
                sender: {
                    _id: "$sender._id",
                    firstName: "$sender.firstName",
                    lastName: "$sender.lastName",
                    role: "$sender.role",
                },
            },
        });
        return pipeline;
    }
    buildConversationSearchPipeline(workplaceId, userId, filters) {
        const pipeline = [];
        const matchStage = {
            workplaceId: new mongoose_1.default.Types.ObjectId(workplaceId),
            "participants.userId": new mongoose_1.default.Types.ObjectId(userId),
            "participants.leftAt": { $exists: false },
        };
        if (filters.query) {
            matchStage.$text = { $search: filters.query };
        }
        if (filters.priority) {
            matchStage.priority = filters.priority;
        }
        if (filters.tags && filters.tags.length > 0) {
            matchStage.tags = { $in: filters.tags };
        }
        if (filters.dateFrom || filters.dateTo) {
            matchStage.createdAt = {};
            if (filters.dateFrom) {
                matchStage.createdAt.$gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                matchStage.createdAt.$lte = filters.dateTo;
            }
        }
        pipeline.push({ $match: matchStage });
        if (filters.query) {
            pipeline.push({
                $addFields: {
                    score: { $meta: "textScore" },
                },
            });
        }
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "participants.userId",
                foreignField: "_id",
                as: "participantDetails",
            },
        });
        const sortStage = {};
        if (filters.query) {
            sortStage.score = { $meta: "textScore" };
        }
        sortStage.lastMessageAt = -1;
        pipeline.push({ $sort: sortStage });
        if (filters.offset) {
            pipeline.push({ $skip: filters.offset });
        }
        if (filters.limit) {
            pipeline.push({ $limit: filters.limit });
        }
        return pipeline;
    }
    async getFacetedResults(conversationIds, filters, workplaceId) {
        try {
            const facetPipeline = [
                {
                    $match: {
                        conversationId: { $in: conversationIds },
                    },
                },
                {
                    $facet: {
                        messageTypes: [
                            { $group: { _id: "$content.type", count: { $sum: 1 } } },
                            { $project: { type: "$_id", count: 1, _id: 0 } },
                            { $sort: { count: -1 } },
                        ],
                        senders: [
                            { $group: { _id: "$senderId", count: { $sum: 1 } } },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "user",
                                },
                            },
                            { $unwind: "$user" },
                            {
                                $project: {
                                    userId: "$_id",
                                    name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
                                    count: 1,
                                    _id: 0,
                                },
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 },
                        ],
                        conversations: [
                            { $group: { _id: "$conversationId", count: { $sum: 1 } } },
                            {
                                $lookup: {
                                    from: "conversations",
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "conversation",
                                },
                            },
                            { $unwind: "$conversation" },
                            {
                                $project: {
                                    conversationId: "$_id",
                                    title: "$conversation.title",
                                    count: 1,
                                    _id: 0,
                                },
                            },
                            { $sort: { count: -1 } },
                            { $limit: 10 },
                        ],
                    },
                },
            ];
            const [facetResults] = await Message_1.default.aggregate(facetPipeline);
            return {
                messageTypes: facetResults.messageTypes || [],
                senders: facetResults.senders || [],
                conversations: facetResults.conversations || [],
                dateRanges: [],
            };
        }
        catch (error) {
            logger_1.default.error("Error getting faceted results:", error);
            return {
                messageTypes: [],
                senders: [],
                conversations: [],
                dateRanges: [],
            };
        }
    }
    async processSearchResults(results, query) {
        return results.map((result) => {
            const searchResult = {
                message: result,
                conversation: result.conversation,
                score: result.score || 0,
            };
            if (query && result.content?.text) {
                searchResult.highlights = {
                    content: this.highlightText(result.content.text, query),
                };
            }
            return searchResult;
        });
    }
    highlightText(text, query) {
        if (!text || !query)
            return text;
        const terms = query.split(" ").filter((term) => term.length > 2);
        let highlightedText = text;
        terms.forEach((term) => {
            const regex = new RegExp(`(${term})`, "gi");
            highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
        });
        return highlightedText;
    }
    async getPopularSearchTerms(conversationIds) {
        try {
            return [
                "medication",
                "prescription",
                "dosage",
                "side effects",
                "patient",
                "treatment",
                "diagnosis",
                "therapy",
            ];
        }
        catch (error) {
            logger_1.default.error("Error getting popular search terms:", error);
            return [];
        }
    }
    async getUserRecentSearches(userId) {
        try {
            return [];
        }
        catch (error) {
            logger_1.default.error("Error getting user recent searches:", error);
            return [];
        }
    }
    async generateQuerySuggestions(query, conversationIds) {
        try {
            const suggestions = [
                `${query} medication`,
                `${query} patient`,
                `${query} prescription`,
                `${query} side effects`,
            ];
            return suggestions.filter((s) => s !== query);
        }
        catch (error) {
            logger_1.default.error("Error generating query suggestions:", error);
            return [];
        }
    }
}
exports.MessageSearchService = MessageSearchService;
exports.messageSearchService = new MessageSearchService();
exports.default = exports.messageSearchService;
//# sourceMappingURL=messageSearchService.js.map