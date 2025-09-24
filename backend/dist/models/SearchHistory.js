"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearch = exports.SearchHistory = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const tenancyGuard_1 = require("../utils/tenancyGuard");
const searchHistorySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    query: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Search query cannot exceed 500 characters'],
        index: 'text',
    },
    filters: {
        conversationId: {
            type: String,
            validate: {
                validator: function (id) {
                    return !id || /^[0-9a-fA-F]{24}$/.test(id);
                },
                message: 'Invalid conversation ID format',
            },
        },
        senderId: {
            type: String,
            validate: {
                validator: function (id) {
                    return !id || /^[0-9a-fA-F]{24}$/.test(id);
                },
                message: 'Invalid sender ID format',
            },
        },
        messageType: {
            type: String,
            enum: ['text', 'file', 'image', 'clinical_note', 'system', 'voice_note'],
        },
        priority: {
            type: String,
            enum: ['normal', 'high', 'urgent'],
        },
        dateFrom: Date,
        dateTo: Date,
        tags: [{
                type: String,
                trim: true,
                maxlength: [50, 'Tag cannot exceed 50 characters'],
            }],
    },
    resultCount: {
        type: Number,
        required: true,
        min: [0, 'Result count cannot be negative'],
    },
    searchType: {
        type: String,
        enum: ['message', 'conversation'],
        required: true,
        index: true,
    },
    executionTime: {
        type: Number,
        required: true,
        min: [0, 'Execution time cannot be negative'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
const savedSearchSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    workplaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Workplace',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Search name cannot exceed 100 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    query: {
        type: String,
        required: true,
        trim: true,
        maxlength: [500, 'Search query cannot exceed 500 characters'],
        index: 'text',
    },
    filters: {
        conversationId: {
            type: String,
            validate: {
                validator: function (id) {
                    return !id || /^[0-9a-fA-F]{24}$/.test(id);
                },
                message: 'Invalid conversation ID format',
            },
        },
        senderId: {
            type: String,
            validate: {
                validator: function (id) {
                    return !id || /^[0-9a-fA-F]{24}$/.test(id);
                },
                message: 'Invalid sender ID format',
            },
        },
        messageType: {
            type: String,
            enum: ['text', 'file', 'image', 'clinical_note', 'system', 'voice_note'],
        },
        priority: {
            type: String,
            enum: ['normal', 'high', 'urgent'],
        },
        dateFrom: Date,
        dateTo: Date,
        tags: [{
                type: String,
                trim: true,
                maxlength: [50, 'Tag cannot exceed 50 characters'],
            }],
    },
    searchType: {
        type: String,
        enum: ['message', 'conversation'],
        required: true,
        index: true,
    },
    isPublic: {
        type: Boolean,
        default: false,
        index: true,
    },
    lastUsed: {
        type: Date,
        index: true,
    },
    useCount: {
        type: Number,
        default: 0,
        min: [0, 'Use count cannot be negative'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
(0, tenancyGuard_1.addAuditFields)(searchHistorySchema);
(0, tenancyGuard_1.addAuditFields)(savedSearchSchema);
searchHistorySchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
savedSearchSchema.plugin(tenancyGuard_1.tenancyGuardPlugin);
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ workplaceId: 1, searchType: 1, createdAt: -1 });
searchHistorySchema.index({ query: 'text' });
savedSearchSchema.index({ userId: 1, name: 1 }, { unique: true });
savedSearchSchema.index({ workplaceId: 1, isPublic: 1, searchType: 1 });
savedSearchSchema.index({ lastUsed: -1 });
savedSearchSchema.index({ useCount: -1 });
searchHistorySchema.virtual('frequency').get(function () {
    return 1;
});
savedSearchSchema.methods.incrementUseCount = function () {
    this.useCount += 1;
    this.lastUsed = new Date();
    return this.save();
};
searchHistorySchema.statics.getRecentSearches = function (userId, limit = 10) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('query searchType createdAt resultCount');
};
searchHistorySchema.statics.getPopularSearches = function (workplaceId, searchType, limit = 10) {
    const matchStage = { workplaceId };
    if (searchType) {
        matchStage.searchType = searchType;
    }
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$query',
                count: { $sum: 1 },
                avgResultCount: { $avg: '$resultCount' },
                lastUsed: { $max: '$createdAt' },
                searchType: { $first: '$searchType' }
            }
        },
        { $sort: { count: -1, lastUsed: -1 } },
        { $limit: limit },
        {
            $project: {
                query: '$_id',
                count: 1,
                avgResultCount: 1,
                lastUsed: 1,
                searchType: 1,
                _id: 0
            }
        }
    ]);
};
savedSearchSchema.statics.getPublicSearches = function (workplaceId, searchType) {
    const query = { workplaceId, isPublic: true };
    if (searchType) {
        query.searchType = searchType;
    }
    return this.find(query)
        .populate('userId', 'firstName lastName role')
        .sort({ useCount: -1, lastUsed: -1 })
        .limit(20);
};
savedSearchSchema.statics.getUserSearches = function (userId, searchType) {
    const query = { userId };
    if (searchType) {
        query.searchType = searchType;
    }
    return this.find(query)
        .sort({ lastUsed: -1, createdAt: -1 });
};
searchHistorySchema.pre('save', async function () {
    const MAX_HISTORY_PER_USER = 1000;
    if (this.isNew) {
        const count = await this.constructor.countDocuments({ userId: this.userId });
        if (count >= MAX_HISTORY_PER_USER) {
            const oldestEntries = await this.constructor
                .find({ userId: this.userId })
                .sort({ createdAt: 1 })
                .limit(count - MAX_HISTORY_PER_USER + 1)
                .select('_id');
            const idsToRemove = oldestEntries.map((entry) => entry._id);
            await this.constructor.deleteMany({ _id: { $in: idsToRemove } });
        }
    }
});
exports.SearchHistory = mongoose_1.default.model('SearchHistory', searchHistorySchema);
exports.SavedSearch = mongoose_1.default.model('SavedSearch', savedSearchSchema);
exports.default = { SearchHistory: exports.SearchHistory, SavedSearch: exports.SavedSearch };
//# sourceMappingURL=SearchHistory.js.map