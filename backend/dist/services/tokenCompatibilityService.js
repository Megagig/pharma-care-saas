"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenCompatibilityService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const User_1 = __importDefault(require("../models/User"));
const Workplace_1 = __importDefault(require("../models/Workplace"));
class TokenCompatibilityService {
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const isLegacy = !!(decoded.id && !decoded.userId) || !!decoded.pharmacyId;
            const needsRefresh = !decoded.workspaceId && !isLegacy;
            logger_1.default.debug('Token verification result', {
                isLegacy,
                needsRefresh,
                hasUserId: !!(decoded.userId || decoded.id),
                hasWorkspaceId: !!decoded.workspaceId,
                hasPharmacyId: !!decoded.pharmacyId,
            });
            return {
                payload: decoded,
                isLegacy,
                needsRefresh,
            };
        }
        catch (error) {
            logger_1.default.error('Token verification failed', { error });
            throw error;
        }
    }
    static async generateModernToken(userId) {
        try {
            const user = await User_1.default.findById(userId).populate('workplaceId');
            if (!user) {
                throw new Error('User not found');
            }
            const payload = {
                userId: user._id.toString(),
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
            };
            if (user.workplaceId) {
                payload.workspaceId = user.workplaceId.toString();
                payload.workplaceRole = user.workplaceRole;
            }
            const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET);
            logger_1.default.info('Generated modern token', {
                userId,
                hasWorkspace: !!payload.workspaceId,
                workplaceRole: payload.workplaceRole,
            });
            return token;
        }
        catch (error) {
            logger_1.default.error('Failed to generate modern token', { error, userId });
            throw error;
        }
    }
    static async refreshTokenWithWorkspaceContext(oldToken) {
        try {
            const { payload } = await this.verifyToken(oldToken);
            const userId = payload.userId || payload.id;
            if (!userId) {
                throw new Error('Invalid token payload');
            }
            const user = await User_1.default.findById(userId).populate('workplaceId');
            if (!user) {
                throw new Error('User not found');
            }
            let workspace = null;
            if (user.workplaceId) {
                workspace = await Workplace_1.default.findById(user.workplaceId);
            }
            const newToken = await this.generateModernToken(userId);
            logger_1.default.info('Token refreshed with workspace context', {
                userId,
                oldTokenLegacy: !!payload.id,
                hasWorkspace: !!workspace,
            });
            return {
                newToken,
                user,
                workspace,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to refresh token', { error });
            throw error;
        }
    }
    static async migrateLegacyToken(legacyToken) {
        try {
            const { payload, isLegacy } = await this.verifyToken(legacyToken);
            if (!isLegacy) {
                return {
                    modernToken: legacyToken,
                    migrationInfo: {
                        wasLegacy: false,
                        addedWorkspaceContext: false,
                        userId: payload.userId,
                        workspaceId: payload.workspaceId,
                    },
                };
            }
            const userId = payload.id || payload.userId;
            if (!userId) {
                throw new Error('No user ID found in legacy token');
            }
            const user = await User_1.default.findById(userId);
            if (!user) {
                throw new Error('User not found for legacy token');
            }
            if (!user.workplaceId) {
                logger_1.default.warn('User in legacy token has no workspace - needs migration', {
                    userId,
                });
            }
            const modernToken = await this.generateModernToken(userId);
            const migrationInfo = {
                wasLegacy: true,
                addedWorkspaceContext: !!user.workplaceId,
                userId,
                workspaceId: user.workplaceId?.toString(),
            };
            logger_1.default.info('Legacy token migrated', migrationInfo);
            return {
                modernToken,
                migrationInfo,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to migrate legacy token', { error });
            throw error;
        }
    }
    static async validateTokenAndGetContext(token) {
        try {
            const { payload, isLegacy, needsRefresh } = await this.verifyToken(token);
            const userId = payload.userId || payload.id;
            if (!userId) {
                throw new Error('No user ID in token');
            }
            const User = require('../models/User').default;
            const Workplace = require('../models/Workplace').default;
            const Subscription = require('../models/Subscription').default;
            const user = await User.findById(userId)
                .populate('currentPlanId')
                .populate('workplaceId')
                .select('-passwordHash');
            if (!user) {
                throw new Error('User not found');
            }
            let workspace = null;
            let subscription = null;
            if (user.workplaceId) {
                workspace = await Workplace.findById(user.workplaceId);
                if (workspace?.currentSubscriptionId) {
                    subscription = await Subscription.findById(workspace.currentSubscriptionId)
                        .populate('planId');
                }
            }
            else {
                subscription = await Subscription.findOne({
                    userId: user._id,
                    status: { $in: ['active', 'trial', 'past_due'] },
                }).populate('planId');
            }
            const needsMigration = !user.workplaceId || isLegacy;
            logger_1.default.debug('Token validation context', {
                userId,
                hasWorkspace: !!workspace,
                hasSubscription: !!subscription,
                isLegacyToken: isLegacy,
                needsMigration,
            });
            return {
                user,
                workspace,
                subscription,
                isLegacyToken: isLegacy,
                needsMigration,
            };
        }
        catch (error) {
            logger_1.default.error('Token validation failed', { error });
            throw error;
        }
    }
    static shouldRefreshToken(payload) {
        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp || 0;
        const timeUntilExpiry = exp - now;
        const shouldRefresh = timeUntilExpiry < 3600;
        const isLegacy = !!payload.id;
        const missingWorkspace = !payload.workspaceId && !isLegacy;
        return shouldRefresh || isLegacy || missingWorkspace;
    }
    static extractUserId(payload) {
        return payload.userId || payload.id || null;
    }
    static extractWorkspaceId(payload) {
        return payload.workspaceId || payload.pharmacyId || null;
    }
}
exports.TokenCompatibilityService = TokenCompatibilityService;
exports.default = TokenCompatibilityService;
//# sourceMappingURL=tokenCompatibilityService.js.map