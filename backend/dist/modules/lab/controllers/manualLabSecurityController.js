"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSecuritySummary = exports.clearUserSecurityMetrics = exports.getSecurityThreats = exports.getSecurityDashboard = void 0;
const manualLabSecurityService_1 = __importDefault(require("../services/manualLabSecurityService"));
const responseHelpers_1 = require("../../../utils/responseHelpers");
const logger_1 = __importDefault(require("../../../utils/logger"));
exports.getSecurityDashboard = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const securityStats = manualLabSecurityService_1.default.getSecurityStatistics();
        const recentThreats = manualLabSecurityService_1.default.getRecentThreats(20);
        const userSecurity = manualLabSecurityService_1.default.getSecuritySummary(context.userId.toString());
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const recentThreatsCount = recentThreats.filter(t => t.timestamp >= last24h).length;
        const previousThreatsCount = recentThreats.filter(t => t.timestamp >= previous24h && t.timestamp < last24h).length;
        const threatTrend = recentThreatsCount - previousThreatsCount;
        const dashboard = {
            overview: {
                totalUsers: securityStats.totalUsers,
                highRiskUsers: securityStats.highRiskUsers,
                totalThreats: securityStats.totalThreats,
                recentThreats: recentThreatsCount,
                threatTrend,
                riskLevel: securityStats.highRiskUsers > 5 ? 'high' :
                    securityStats.highRiskUsers > 2 ? 'medium' : 'low'
            },
            threatAnalysis: {
                byType: securityStats.threatsByType,
                bySeverity: securityStats.threatsBySeverity,
                recentThreats: recentThreats.slice(0, 10).map(threat => ({
                    id: `${threat.type}_${threat.timestamp.getTime()}`,
                    type: threat.type,
                    severity: threat.severity,
                    timestamp: threat.timestamp,
                    userId: threat.userId,
                    ipAddress: threat.ipAddress,
                    summary: getThreatSummary(threat)
                }))
            },
            userSecurity: userSecurity ? {
                riskScore: userSecurity.riskScore,
                totalRequests: userSecurity.totalRequests,
                suspiciousActivities: userSecurity.suspiciousActivities,
                lastActivity: userSecurity.lastActivity,
                status: userSecurity.riskScore > 7 ? 'high_risk' :
                    userSecurity.riskScore > 4 ? 'medium_risk' : 'low_risk'
            } : null,
            recommendations: generateSecurityRecommendations(securityStats, recentThreats)
        };
        (0, responseHelpers_1.sendSuccess)(res, { dashboard }, 'Security dashboard retrieved successfully');
        logger_1.default.info('Security dashboard accessed', {
            userId: context.userId,
            workplaceId: context.workplaceId,
            service: 'manual-lab-security'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve security dashboard', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: context.userId,
            service: 'manual-lab-security'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve security dashboard', 500);
    }
});
exports.getSecurityThreats = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const context = (0, responseHelpers_1.getRequestContext)(req);
    const { limit = 50, severity, type, userId: filterUserId } = req.query;
    try {
        let threats = manualLabSecurityService_1.default.getRecentThreats(parseInt(limit));
        if (severity) {
            threats = threats.filter(t => t.severity === severity);
        }
        if (type) {
            threats = threats.filter(t => t.type === type);
        }
        if (filterUserId) {
            threats = threats.filter(t => t.userId?.toString() === filterUserId);
        }
        const formattedThreats = threats.map(threat => ({
            id: `${threat.type}_${threat.timestamp.getTime()}`,
            type: threat.type,
            severity: threat.severity,
            timestamp: threat.timestamp,
            userId: threat.userId,
            ipAddress: threat.ipAddress,
            userAgent: threat.userAgent,
            details: threat.details,
            summary: getThreatSummary(threat),
            riskScore: calculateThreatRiskScore(threat)
        }));
        const threatAnalysis = {
            total: formattedThreats.length,
            byType: formattedThreats.reduce((acc, threat) => {
                acc[threat.type] = (acc[threat.type] || 0) + 1;
                return acc;
            }, {}),
            bySeverity: formattedThreats.reduce((acc, threat) => {
                acc[threat.severity] = (acc[threat.severity] || 0) + 1;
                return acc;
            }, {}),
            topUsers: getTopThreatUsers(formattedThreats)
        };
        (0, responseHelpers_1.sendSuccess)(res, {
            threats: formattedThreats,
            analysis: threatAnalysis
        }, 'Security threats retrieved successfully');
        logger_1.default.info('Security threats retrieved', {
            count: formattedThreats.length,
            filters: { severity, type, filterUserId },
            userId: context.userId,
            service: 'manual-lab-security'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve security threats', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: context.userId,
            service: 'manual-lab-security'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve security threats', 500);
    }
});
exports.clearUserSecurityMetrics = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    if (context.userRole !== 'owner') {
        return (0, responseHelpers_1.sendError)(res, 'FORBIDDEN', 'Only owners can clear user security metrics', 403);
    }
    try {
        const cleared = manualLabSecurityService_1.default.clearUserMetrics(userId);
        if (cleared) {
            (0, responseHelpers_1.sendSuccess)(res, { userId, cleared: true }, 'User security metrics cleared successfully');
            logger_1.default.info('User security metrics cleared', {
                targetUserId: userId,
                clearedBy: context.userId,
                service: 'manual-lab-security'
            });
        }
        else {
            (0, responseHelpers_1.sendSuccess)(res, { userId, cleared: false }, 'No security metrics found for user');
        }
    }
    catch (error) {
        logger_1.default.error('Failed to clear user security metrics', {
            targetUserId: userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: context.userId,
            service: 'manual-lab-security'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to clear user security metrics', 500);
    }
});
exports.getUserSecuritySummary = (0, responseHelpers_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const context = (0, responseHelpers_1.getRequestContext)(req);
    try {
        const securitySummary = manualLabSecurityService_1.default.getSecuritySummary(userId);
        if (!securitySummary) {
            return (0, responseHelpers_1.sendSuccess)(res, { userId, summary: null }, 'No security data found for user');
        }
        const enhancedSummary = {
            ...securitySummary,
            riskAssessment: {
                level: securitySummary.riskScore > 7 ? 'high' :
                    securitySummary.riskScore > 4 ? 'medium' : 'low',
                factors: getRiskFactors(securitySummary),
                recommendations: getUserRecommendations(securitySummary)
            },
            activityPattern: {
                requestsPerHour: calculateRequestsPerHour(securitySummary),
                mostActiveHours: getMostActiveHours(securitySummary),
                suspiciousPatterns: securitySummary.suspiciousActivities > 0
            }
        };
        (0, responseHelpers_1.sendSuccess)(res, { userId, summary: enhancedSummary }, 'User security summary retrieved successfully');
        logger_1.default.info('User security summary retrieved', {
            targetUserId: userId,
            riskScore: securitySummary.riskScore,
            requestedBy: context.userId,
            service: 'manual-lab-security'
        });
    }
    catch (error) {
        logger_1.default.error('Failed to retrieve user security summary', {
            targetUserId: userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: context.userId,
            service: 'manual-lab-security'
        });
        (0, responseHelpers_1.sendError)(res, 'SERVER_ERROR', 'Failed to retrieve user security summary', 500);
    }
});
const getThreatSummary = (threat) => {
    switch (threat.type) {
        case 'rate_limit_exceeded':
            return `Rate limit exceeded: ${threat.details?.pattern || 'unknown pattern'}`;
        case 'suspicious_pattern':
            return `Suspicious pattern detected: ${threat.details?.pattern || 'unknown'}`;
        case 'unauthorized_access':
            return `Unauthorized access attempt: ${threat.details?.pattern || 'unknown'}`;
        case 'data_exfiltration':
            return `Potential data exfiltration: ${threat.details?.pattern || 'unknown'}`;
        case 'injection_attempt':
            return `Injection attempt detected: ${threat.details?.detectedPatterns?.length || 0} patterns`;
        default:
            return `Security threat: ${threat.type}`;
    }
};
const calculateThreatRiskScore = (threat) => {
    let score = 0;
    switch (threat.severity) {
        case 'critical':
            score += 8;
            break;
        case 'high':
            score += 6;
            break;
        case 'medium':
            score += 4;
            break;
        case 'low':
            score += 2;
            break;
    }
    if (threat.type === 'injection_attempt')
        score += 2;
    if (threat.type === 'data_exfiltration')
        score += 3;
    if (threat.details?.pattern === 'automated_access')
        score += 2;
    return Math.min(score, 10);
};
const getTopThreatUsers = (threats) => {
    const userCounts = threats.reduce((acc, threat) => {
        if (threat.userId) {
            const userId = threat.userId.toString();
            acc[userId] = (acc[userId] || 0) + 1;
        }
        return acc;
    }, {});
    return Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, threatCount: count }));
};
const generateSecurityRecommendations = (stats, threats) => {
    const recommendations = [];
    if (stats.highRiskUsers > 5) {
        recommendations.push('High number of risky users detected. Consider implementing additional security training.');
    }
    if (stats.totalThreats > 100) {
        recommendations.push('High threat volume detected. Review security policies and monitoring thresholds.');
    }
    const injectionThreats = threats.filter(t => t.type === 'injection_attempt').length;
    if (injectionThreats > 10) {
        recommendations.push('Multiple injection attempts detected. Strengthen input validation and consider WAF implementation.');
    }
    const exfiltrationThreats = threats.filter(t => t.type === 'data_exfiltration').length;
    if (exfiltrationThreats > 5) {
        recommendations.push('Potential data exfiltration attempts detected. Review data access patterns and implement DLP controls.');
    }
    if (recommendations.length === 0) {
        recommendations.push('Security metrics are within acceptable ranges. Continue monitoring.');
    }
    return recommendations;
};
const getRiskFactors = (summary) => {
    const factors = [];
    if (summary.suspiciousActivities > 5) {
        factors.push('High number of suspicious activities');
    }
    if (summary.failedRequests > 10) {
        factors.push('Multiple failed requests');
    }
    if (summary.pdfAccesses > 50) {
        factors.push('Excessive PDF access');
    }
    if (summary.riskScore > 7) {
        factors.push('High calculated risk score');
    }
    return factors;
};
const getUserRecommendations = (summary) => {
    const recommendations = [];
    if (summary.riskScore > 7) {
        recommendations.push('Consider temporary access restrictions');
        recommendations.push('Require additional authentication for sensitive operations');
    }
    if (summary.suspiciousActivities > 3) {
        recommendations.push('Monitor user activity closely');
        recommendations.push('Review recent access patterns');
    }
    if (summary.pdfAccesses > 30) {
        recommendations.push('Review PDF access patterns for legitimacy');
    }
    return recommendations;
};
const calculateRequestsPerHour = (summary) => {
    const hoursActive = Math.max(1, (Date.now() - summary.lastActivity.getTime()) / (1000 * 60 * 60));
    return Math.round(summary.totalRequests / hoursActive);
};
const getMostActiveHours = (summary) => {
    return [9, 10, 11, 14, 15, 16];
};
exports.default = {
    getSecurityDashboard: exports.getSecurityDashboard,
    getSecurityThreats: exports.getSecurityThreats,
    clearUserSecurityMetrics: exports.clearUserSecurityMetrics,
    getUserSecuritySummary: exports.getUserSecuritySummary
};
//# sourceMappingURL=manualLabSecurityController.js.map