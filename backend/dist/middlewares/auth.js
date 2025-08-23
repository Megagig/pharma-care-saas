"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLimit = exports.requireFeature = exports.authorize = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ message: 'Access denied. No token provided.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.default.findById(decoded.userId)
            .populate('currentPlanId')
            .select('-passwordHash');
        if (!user) {
            res.status(401).json({ message: 'Invalid token.' });
            return;
        }
        if (user.status !== 'active') {
            res.status(401).json({ message: 'Account is not active.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: 'Token expired.' });
        }
        else {
            res.status(401).json({ message: 'Invalid token.' });
        }
    }
};
exports.auth = auth;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'Access denied.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Insufficient permissions.' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requireFeature = (featureName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Access denied.' });
                return;
            }
            const user = req.user;
            let plan = user.currentPlanId;
            if (user.planOverride && user.planOverride[featureName] !== undefined) {
                if (user.planOverride[featureName]) {
                    next();
                    return;
                }
                else {
                    res.status(403).json({
                        message: `This feature is not available in your current plan.`,
                        feature: featureName,
                        upgradeRequired: true
                    });
                    return;
                }
            }
            if (!plan || !plan.features || !plan.features[featureName]) {
                res.status(403).json({
                    message: `This feature is not available in your current plan.`,
                    feature: featureName,
                    upgradeRequired: true
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ message: 'Error checking feature access.' });
        }
    };
};
exports.requireFeature = requireFeature;
const checkLimit = (limitName, currentCount) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ message: 'Access denied.' });
                return;
            }
            const user = req.user;
            let plan = user.currentPlanId;
            if (user.planOverride && user.planOverride[limitName] !== undefined) {
                const limit = user.planOverride[limitName];
                if (limit === null || currentCount < limit) {
                    next();
                    return;
                }
                else {
                    res.status(403).json({
                        message: `You have reached your ${limitName} limit.`,
                        limit: limit,
                        current: currentCount,
                        upgradeRequired: true
                    });
                    return;
                }
            }
            if (!plan || !plan.features) {
                res.status(403).json({ message: 'Plan information not available.' });
                return;
            }
            const limit = plan.features[limitName];
            if (limit !== null && currentCount >= limit) {
                res.status(403).json({
                    message: `You have reached your ${limitName} limit.`,
                    limit: limit,
                    current: currentCount,
                    upgradeRequired: true
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ message: 'Error checking limit.' });
        }
    };
};
exports.checkLimit = checkLimit;
//# sourceMappingURL=auth.js.map