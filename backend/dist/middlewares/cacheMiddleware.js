"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidatePatientCache = exports.invalidateUserCache = exports.invalidateCache = exports.reportsCacheMiddleware = exports.searchCacheMiddleware = exports.medicationCacheMiddleware = exports.clinicalNotesCacheMiddleware = exports.userProfileCacheMiddleware = exports.patientListCacheMiddleware = exports.dashboardCacheMiddleware = exports.cacheMiddleware = void 0;
const PerformanceCacheService_1 = __importDefault(require("../services/PerformanceCacheService"));
const logger_1 = __importDefault(require("../utils/logger"));
const cacheMiddleware = (options = {}) => {
    const cacheService = PerformanceCacheService_1.default.getInstance();
    const { ttl = 300, keyGenerator, condition, tags = [], varyBy = [], skipCache, } = options;
    return async (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        if (condition && !condition(req)) {
            return next();
        }
        if (skipCache && skipCache(req)) {
            return next();
        }
        try {
            const cacheKey = keyGenerator
                ? keyGenerator(req)
                : generateDefaultCacheKey(req, varyBy);
            const cachedResponse = await cacheService.getCachedApiResponse(cacheKey);
            if (cachedResponse) {
                logger_1.default.debug(`Cache hit for key: ${cacheKey}`);
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`,
                });
                return res.json(cachedResponse);
            }
            logger_1.default.debug(`Cache miss for key: ${cacheKey}`);
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                setImmediate(async () => {
                    try {
                        const cacheTags = Array.isArray(tags) ? tags : tags(req);
                        await cacheService.cacheApiResponse(cacheKey, data, {
                            ttl,
                            tags: cacheTags,
                        });
                        logger_1.default.debug(`Cached response for key: ${cacheKey}`);
                    }
                    catch (error) {
                        logger_1.default.error('Error caching response:', error);
                    }
                });
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${ttl}`,
                });
                return originalJson(data);
            };
            next();
        }
        catch (error) {
            logger_1.default.error('Cache middleware error:', error);
            next();
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
function generateDefaultCacheKey(req, varyBy) {
    const parts = [
        req.method,
        req.path,
    ];
    if (Object.keys(req.query).length > 0) {
        const sortedQuery = Object.keys(req.query)
            .sort()
            .map(key => `${key}=${req.query[key]}`)
            .join('&');
        parts.push(sortedQuery);
    }
    for (const vary of varyBy) {
        if (req.headers[vary]) {
            parts.push(`${vary}:${req.headers[vary]}`);
        }
        if (req.params[vary]) {
            parts.push(`${vary}:${req.params[vary]}`);
        }
    }
    if (req.user?.id) {
        parts.push(`user:${req.user.id}`);
    }
    if (req.user?.workspaceId) {
        parts.push(`workspace:${req.user.workspaceId}`);
    }
    return parts.join('|');
}
exports.dashboardCacheMiddleware = (0, exports.cacheMiddleware)({
    ttl: 300,
    tags: ['dashboard'],
    varyBy: ['user', 'workspace'],
    condition: (req) => {
        return !!req.user;
    },
});
exports.patientListCacheMiddleware = (0, exports.cacheMiddleware)({
    ttl: 180,
    tags: ['patients', 'list'],
    varyBy: ['workspace'],
    keyGenerator: (req) => {
        const { page, limit, search, filters } = req.query;
        const workspaceId = req.user?.workspaceId || 'unknown';
        const keyParts = [
            'patient-list',
            workspaceId,
            `page:${page || 1}`,
            `limit:${limit || 10}`,
        ];
        if (search) {
            keyParts.push(`search:${search}`);
        }
        if (filters) {
            const filterStr = typeof filters === 'string'
                ? filters
                : JSON.stringify(filters);
            keyParts.push(`filters:${filterStr}`);
        }
        return keyParts.join('|');
    },
});
exports.userProfileCacheMiddleware = (0, exports.cacheMiddleware)({
    ttl: 600,
    tags: ['user-profile'],
    keyGenerator: (req) => {
        const userId = req.user?.id || req.params.userId;
        return `user-profile:${userId}`;
    },
    condition: (req) => {
        return !!req.user && (req.user.id === req.params.userId || req.user.role === 'admin');
    },
});
exports.clinicalNotesCacheMiddleware = (0, exports.cacheMiddleware)({
    ttl: 300,
    tags: ['clinical-notes'],
    keyGenerator: (req) => {
        const patientId = req.params.patientId;
        const { page, limit } = req.query;
        return `clinical-notes:${patientId}:page:${page || 1}:limit:${limit || 10}`;
    },
});
exports.medicationCacheMiddleware = (0, exports.cacheMiddleware)({
    ttl: 600,
    tags: ['medications'],
    keyGenerator: (req) => {
        const patientId = req.params.patientId;
        const { active, type } = req.query;
        const keyParts = [`medications:${patientId}`];
        if (active !== undefined) {
            keyParts.push(`active:${active}`);
        }
        if (type) {
            keyParts.push(`type:${type}`);
        }
        return keyParts.join('|');
    },
});
exports.searchCacheMiddleware = (0, exports.cacheMiddleware)({
    ttl: 600,
    tags: (req) => ['search', req.params.type || 'general'],
    keyGenerator: (req) => {
        const { q, type, filters } = req.query;
        const workspaceId = req.user?.workspaceId || 'unknown';
        const keyParts = [
            'search',
            workspaceId,
            `query:${q}`,
            `type:${type || 'general'}`,
        ];
        if (filters) {
            keyParts.push(`filters:${JSON.stringify(filters)}`);
        }
        return keyParts.join('|');
    },
});
exports.reportsCacheMiddleware = (0, exports.cacheMiddleware)({
    ttl: 900,
    tags: ['reports', 'analytics'],
    keyGenerator: (req) => {
        const { reportType, dateRange, filters } = req.query;
        const workspaceId = req.user?.workspaceId || 'unknown';
        const keyParts = [
            'reports',
            workspaceId,
            `type:${reportType}`,
            `range:${dateRange}`,
        ];
        if (filters) {
            keyParts.push(`filters:${JSON.stringify(filters)}`);
        }
        return keyParts.join('|');
    },
});
const invalidateCache = async (tags) => {
    try {
        const cacheService = PerformanceCacheService_1.default.getInstance();
        const deletedCount = await cacheService.invalidateByTags(tags);
        logger_1.default.debug(`Invalidated ${deletedCount} cache entries for tags:`, tags);
    }
    catch (error) {
        logger_1.default.error('Error invalidating cache:', error);
    }
};
exports.invalidateCache = invalidateCache;
const invalidateUserCache = async (userId) => {
    try {
        const cacheService = PerformanceCacheService_1.default.getInstance();
        await cacheService.invalidateUserCache(userId);
        logger_1.default.debug(`Invalidated cache for user: ${userId}`);
    }
    catch (error) {
        logger_1.default.error('Error invalidating user cache:', error);
    }
};
exports.invalidateUserCache = invalidateUserCache;
const invalidatePatientCache = async (patientId) => {
    try {
        const cacheService = PerformanceCacheService_1.default.getInstance();
        await cacheService.invalidatePatientCache(patientId);
        logger_1.default.debug(`Invalidated cache for patient: ${patientId}`);
    }
    catch (error) {
        logger_1.default.error('Error invalidating patient cache:', error);
    }
};
exports.invalidatePatientCache = invalidatePatientCache;
//# sourceMappingURL=cacheMiddleware.js.map