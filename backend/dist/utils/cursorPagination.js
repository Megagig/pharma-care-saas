"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSkipLimitToCursor = exports.cursorPaginationMiddleware = exports.CursorPagination = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("./logger"));
class CursorPagination {
    static async paginate(model, options = {}) {
        const { limit = 20, cursor, sortField = 'createdAt', sortOrder = 'desc', filters = {}, } = options;
        try {
            const cursorInfo = cursor ? this.parseCursor(cursor) : null;
            let query = model.find(filters);
            if (cursorInfo) {
                query = this.applyCursorFilter(query, cursorInfo, sortField, sortOrder);
            }
            const sortDirection = sortOrder === 'asc' ? 1 : -1;
            query = query.sort({ [sortField]: sortDirection, _id: sortDirection });
            const items = await query.limit(limit + 1).lean();
            const hasNextPage = items.length > limit;
            const hasPrevPage = !!cursorInfo;
            const resultItems = hasNextPage ? items.slice(0, limit) : items;
            const startCursor = resultItems.length > 0
                ? this.generateCursor(resultItems[0], sortField, 'forward')
                : null;
            const endCursor = resultItems.length > 0
                ? this.generateCursor(resultItems[resultItems.length - 1], sortField, 'forward')
                : null;
            const nextCursor = hasNextPage ? endCursor : null;
            const prevCursor = hasPrevPage ? startCursor : null;
            return {
                items: resultItems,
                nextCursor,
                prevCursor,
                hasNextPage,
                hasPrevPage,
                pageInfo: {
                    startCursor,
                    endCursor,
                    hasNextPage,
                    hasPrevPage,
                },
            };
        }
        catch (error) {
            logger_1.default.error('Error in cursor pagination:', error);
            throw error;
        }
    }
    static async paginateWithCount(model, options = {}) {
        const result = await this.paginate(model, options);
        try {
            const totalCount = await model.countDocuments(options.filters || {});
            result.totalCount = totalCount;
        }
        catch (error) {
            logger_1.default.warn('Failed to get total count for pagination:', error);
        }
        return result;
    }
    static generateCursor(document, sortField, direction) {
        const cursorInfo = {
            id: document._id.toString(),
            sortValue: document[sortField],
            direction,
        };
        return Buffer.from(JSON.stringify(cursorInfo)).toString('base64');
    }
    static parseCursor(cursor) {
        try {
            const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
            return JSON.parse(decoded);
        }
        catch (error) {
            throw new Error('Invalid cursor format');
        }
    }
    static applyCursorFilter(query, cursorInfo, sortField, sortOrder) {
        const { id, sortValue, direction } = cursorInfo;
        if (direction === 'forward') {
            if (sortOrder === 'desc') {
                query = query.where({
                    $or: [
                        { [sortField]: { $lt: sortValue } },
                        { [sortField]: sortValue, _id: { $lt: new mongoose_1.default.Types.ObjectId(id) } }
                    ]
                });
            }
            else {
                query = query.where({
                    $or: [
                        { [sortField]: { $gt: sortValue } },
                        { [sortField]: sortValue, _id: { $gt: new mongoose_1.default.Types.ObjectId(id) } }
                    ]
                });
            }
        }
        else {
            if (sortOrder === 'desc') {
                query = query.where({
                    $or: [
                        { [sortField]: { $gt: sortValue } },
                        { [sortField]: sortValue, _id: { $gt: new mongoose_1.default.Types.ObjectId(id) } }
                    ]
                });
            }
            else {
                query = query.where({
                    $or: [
                        { [sortField]: { $lt: sortValue } },
                        { [sortField]: sortValue, _id: { $lt: new mongoose_1.default.Types.ObjectId(id) } }
                    ]
                });
            }
        }
        return query;
    }
    static createPaginatedResponse(result, baseUrl, queryParams = {}) {
        const { nextCursor, prevCursor, pageInfo, totalCount } = result;
        const nextUrl = nextCursor
            ? `${baseUrl}?${new URLSearchParams({ ...queryParams, cursor: nextCursor }).toString()}`
            : null;
        const prevUrl = prevCursor
            ? `${baseUrl}?${new URLSearchParams({ ...queryParams, cursor: prevCursor }).toString()}`
            : null;
        return {
            data: result.items,
            pagination: {
                pageInfo,
                totalCount,
                cursors: {
                    next: nextCursor,
                    prev: prevCursor,
                },
                links: {
                    next: nextUrl,
                    prev: prevUrl,
                },
            },
        };
    }
}
exports.CursorPagination = CursorPagination;
const cursorPaginationMiddleware = (req, res, next) => {
    req.paginate = async (model, options = {}) => {
        const paginationOptions = {
            limit: parseInt(req.query.limit) || 20,
            cursor: req.query.cursor,
            sortField: req.query.sortField || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
            filters: options.filters || {},
            ...options,
        };
        return CursorPagination.paginate(model, paginationOptions);
    };
    req.paginateWithCount = async (model, options = {}) => {
        const paginationOptions = {
            limit: parseInt(req.query.limit) || 20,
            cursor: req.query.cursor,
            sortField: req.query.sortField || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
            filters: options.filters || {},
            ...options,
        };
        return CursorPagination.paginateWithCount(model, paginationOptions);
    };
    next();
};
exports.cursorPaginationMiddleware = cursorPaginationMiddleware;
const convertSkipLimitToCursor = (page, limit, sortField = 'createdAt') => {
    logger_1.default.warn('Using skip/limit pagination - consider migrating to cursor-based pagination for better performance');
    return {
        limit,
        skip: (page - 1) * limit,
    };
};
exports.convertSkipLimitToCursor = convertSkipLimitToCursor;
exports.default = CursorPagination;
//# sourceMappingURL=cursorPagination.js.map