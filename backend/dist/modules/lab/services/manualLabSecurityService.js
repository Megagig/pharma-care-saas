"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const auditService_1 = require("../../../services/auditService");
class ManualLabSecurityService {
    static async analyzeRequest(context, requestData) {
        const threats = [];
        try {
            const injectionThreat = this.detectInjectionAttempts(requestData);
            if (injectionThreat) {
                threats.push(injectionThreat);
            }
            const patternThreat = this.detectSuspiciousPatterns(context, requestData);
            if (patternThreat) {
                threats.push(patternThreat);
            }
            const exfiltrationThreat = this.detectDataExfiltration(context, requestData);
            if (exfiltrationThreat) {
                threats.push(exfiltrationThreat);
            }
            await this.updateSecurityMetrics(context, requestData, threats);
            for (const threat of threats) {
                await this.logSecurityThreat(context, threat);
            }
            return threats;
        }
        catch (error) {
            logger_1.default.error('Security analysis failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: context.userId,
                service: 'manual-lab-security'
            });
            return [];
        }
    }
    static detectInjectionAttempts(requestData) {
        const suspiciousPatterns = [
            /(\$where|\$ne|\$gt|\$lt|\$in|\$nin)/i,
            /(union|select|insert|update|delete|drop|create|alter)/i,
            /(<script|javascript:|vbscript:|onload|onerror)/i,
            /(eval\(|setTimeout\(|setInterval\()/i,
            /(\.\.\/)|(\.\.\\)/g,
        ];
        const checkValue = (value) => {
            if (typeof value === 'string') {
                return suspiciousPatterns.some(pattern => pattern.test(value));
            }
            if (typeof value === 'object' && value !== null) {
                return Object.values(value).some(v => checkValue(v));
            }
            return false;
        };
        const allData = {
            ...requestData.body,
            ...requestData.query,
            ...requestData.params
        };
        if (checkValue(allData)) {
            return {
                type: 'injection_attempt',
                severity: 'high',
                details: {
                    method: requestData.method,
                    url: requestData.url,
                    suspiciousData: allData,
                    detectedPatterns: suspiciousPatterns.filter(pattern => JSON.stringify(allData).match(pattern)).map(p => p.toString())
                },
                timestamp: new Date()
            };
        }
        return null;
    }
    static detectSuspiciousPatterns(context, requestData) {
        const userId = context.userId.toString();
        const metrics = this.getSecurityMetrics(userId);
        const now = new Date();
        const timeDiff = now.getTime() - metrics.lastActivity.getTime();
        if (timeDiff < 100) {
            return {
                type: 'suspicious_pattern',
                severity: 'medium',
                userId: new mongoose_1.default.Types.ObjectId(context.userId),
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                details: {
                    pattern: 'rapid_requests',
                    timeDiff,
                    method: requestData.method,
                    url: requestData.url
                },
                timestamp: now
            };
        }
        if (requestData.url.includes('/pdf') && metrics.pdfAccesses > 20) {
            const recentPdfAccesses = this.threatLog.filter(threat => threat.userId?.toString() === userId &&
                threat.details?.url?.includes('/pdf') &&
                now.getTime() - threat.timestamp.getTime() < 60 * 60 * 1000).length;
            if (recentPdfAccesses > 10) {
                return {
                    type: 'data_exfiltration',
                    severity: 'high',
                    userId: new mongoose_1.default.Types.ObjectId(context.userId),
                    ipAddress: context.ipAddress,
                    details: {
                        pattern: 'excessive_pdf_access',
                        recentAccesses: recentPdfAccesses,
                        totalPdfAccesses: metrics.pdfAccesses
                    },
                    timestamp: now
                };
            }
        }
        return null;
    }
    static detectDataExfiltration(context, requestData) {
        const userId = context.userId.toString();
        const metrics = this.getSecurityMetrics(userId);
        if (requestData.query?.limit && parseInt(requestData.query.limit) > 100) {
            return {
                type: 'data_exfiltration',
                severity: 'medium',
                userId: new mongoose_1.default.Types.ObjectId(context.userId),
                ipAddress: context.ipAddress,
                details: {
                    pattern: 'bulk_data_request',
                    requestedLimit: requestData.query.limit,
                    url: requestData.url
                },
                timestamp: new Date()
            };
        }
        const userAgent = context.userAgent || '';
        if (userAgent.toLowerCase().includes('bot') ||
            userAgent.toLowerCase().includes('crawler') ||
            userAgent.toLowerCase().includes('script') ||
            !userAgent) {
            return {
                type: 'unauthorized_access',
                severity: 'high',
                userId: new mongoose_1.default.Types.ObjectId(context.userId),
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                details: {
                    pattern: 'automated_access',
                    userAgent,
                    url: requestData.url
                },
                timestamp: new Date()
            };
        }
        return null;
    }
    static async updateSecurityMetrics(context, requestData, threats) {
        const userId = context.userId.toString();
        const metrics = this.getSecurityMetrics(userId);
        metrics.totalRequests++;
        metrics.lastActivity = new Date();
        if (requestData.url.includes('/pdf')) {
            metrics.pdfAccesses++;
        }
        if (requestData.method === 'POST' && requestData.url.endsWith('/manual-lab-orders')) {
            metrics.orderCreations++;
        }
        metrics.suspiciousActivities += threats.length;
        metrics.riskScore = this.calculateRiskScore(metrics, threats);
        this.securityMetrics.set(userId, metrics);
        if (metrics.riskScore > 7) {
            logger_1.default.warn('High-risk user detected', {
                userId,
                riskScore: metrics.riskScore,
                metrics,
                service: 'manual-lab-security'
            });
        }
    }
    static async logSecurityThreat(context, threat) {
        try {
            this.threatLog.push(threat);
            if (this.threatLog.length > this.MAX_THREAT_LOG_SIZE) {
                this.threatLog.shift();
            }
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_SECURITY_THREAT_DETECTED',
                resourceType: 'System',
                resourceId: context.userId,
                details: {
                    threatType: threat.type,
                    severity: threat.severity,
                    threatDetails: threat.details,
                    timestamp: threat.timestamp
                },
                complianceCategory: 'system_security',
                riskLevel: threat.severity === 'critical' ? 'critical' :
                    threat.severity === 'high' ? 'high' : 'medium'
            });
            logger_1.default.warn('Security threat detected', {
                threatType: threat.type,
                severity: threat.severity,
                userId: threat.userId,
                ipAddress: threat.ipAddress,
                details: threat.details,
                service: 'manual-lab-security'
            });
            if (threat.severity === 'critical' || threat.severity === 'high') {
                await this.triggerSecurityAlert(context, threat);
            }
        }
        catch (error) {
            logger_1.default.error('Failed to log security threat', {
                error: error instanceof Error ? error.message : 'Unknown error',
                threatType: threat.type,
                service: 'manual-lab-security'
            });
        }
    }
    static getSecurityMetrics(userId) {
        let metrics = this.securityMetrics.get(userId);
        if (!metrics) {
            metrics = {
                userId,
                totalRequests: 0,
                failedRequests: 0,
                pdfAccesses: 0,
                orderCreations: 0,
                suspiciousActivities: 0,
                lastActivity: new Date(),
                riskScore: 0
            };
            this.securityMetrics.set(userId, metrics);
        }
        return metrics;
    }
    static calculateRiskScore(metrics, currentThreats) {
        let score = 0;
        score += Math.min(metrics.suspiciousActivities * 0.5, 3);
        score += Math.min(metrics.failedRequests * 0.2, 2);
        if (metrics.pdfAccesses > 50)
            score += 2;
        else if (metrics.pdfAccesses > 20)
            score += 1;
        for (const threat of currentThreats) {
            switch (threat.severity) {
                case 'critical':
                    score += 4;
                    break;
                case 'high':
                    score += 3;
                    break;
                case 'medium':
                    score += 2;
                    break;
                case 'low':
                    score += 1;
                    break;
            }
        }
        const now = new Date();
        const hoursSinceLastActivity = (now.getTime() - metrics.lastActivity.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastActivity < 0.1 && metrics.totalRequests > 100) {
            score += 2;
        }
        return Math.min(score, 10);
    }
    static async triggerSecurityAlert(context, threat) {
        try {
            logger_1.default.error('SECURITY ALERT: High-severity threat detected', {
                threatType: threat.type,
                severity: threat.severity,
                userId: threat.userId,
                ipAddress: threat.ipAddress,
                details: threat.details,
                service: 'manual-lab-security'
            });
            await auditService_1.AuditService.logActivity(context, {
                action: 'MANUAL_LAB_SECURITY_ALERT_TRIGGERED',
                resourceType: 'System',
                resourceId: context.userId,
                details: {
                    alertType: 'high_severity_threat',
                    threatType: threat.type,
                    severity: threat.severity,
                    threatDetails: threat.details,
                    timestamp: new Date()
                },
                complianceCategory: 'system_security',
                riskLevel: 'critical'
            });
        }
        catch (error) {
            logger_1.default.error('Failed to trigger security alert', {
                error: error instanceof Error ? error.message : 'Unknown error',
                threatType: threat.type,
                service: 'manual-lab-security'
            });
        }
    }
    static getSecuritySummary(userId) {
        return this.securityMetrics.get(userId) || null;
    }
    static getRecentThreats(limit = 50) {
        return this.threatLog
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    static clearUserMetrics(userId) {
        return this.securityMetrics.delete(userId);
    }
    static getSecurityStatistics() {
        const stats = {
            totalUsers: this.securityMetrics.size,
            highRiskUsers: 0,
            totalThreats: this.threatLog.length,
            threatsByType: {},
            threatsBySeverity: {}
        };
        for (const metrics of this.securityMetrics.values()) {
            if (metrics.riskScore > 6) {
                stats.highRiskUsers++;
            }
        }
        for (const threat of this.threatLog) {
            stats.threatsByType[threat.type] = (stats.threatsByType[threat.type] || 0) + 1;
            stats.threatsBySeverity[threat.severity] = (stats.threatsBySeverity[threat.severity] || 0) + 1;
        }
        return stats;
    }
}
ManualLabSecurityService.securityMetrics = new Map();
ManualLabSecurityService.threatLog = [];
ManualLabSecurityService.MAX_THREAT_LOG_SIZE = 1000;
exports.default = ManualLabSecurityService;
//# sourceMappingURL=manualLabSecurityService.js.map