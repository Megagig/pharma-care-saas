"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.communicationSecurityMonitoringService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class CommunicationSecurityMonitoringService {
    constructor() {
        this.securityEvents = new Map();
        this.threatIndicators = new Map();
        this.userRiskScores = new Map();
        this.ipRiskScores = new Map();
        this.blockedIPs = new Set();
        this.suspiciousUsers = new Set();
        this.MAX_EVENTS = 10000;
        this.RISK_THRESHOLD_HIGH = 8;
        this.RISK_THRESHOLD_MEDIUM = 5;
        this.CLEANUP_INTERVAL = 60 * 60 * 1000;
        this.EVENT_RETENTION = 24 * 60 * 60 * 1000;
        setInterval(() => {
            this.cleanupOldEvents();
        }, this.CLEANUP_INTERVAL);
    }
    recordSecurityEvent(eventType, req, details = {}, severity = 'medium') {
        const eventId = this.generateEventId();
        const timestamp = Date.now();
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';
        const event = {
            id: eventId,
            userId: req.user?._id?.toString(),
            sessionId: req.sessionID,
            eventType,
            severity,
            timestamp,
            ipAddress,
            userAgent,
            details,
            riskScore: this.calculateEventRiskScore(eventType, severity, details),
        };
        this.securityEvents.set(eventId, event);
        this.updateThreatIndicators(event);
        this.updateRiskScores(event);
        this.analyzeImmediateThreats(event);
        logger_1.default.warn('Security event recorded', {
            eventId,
            eventType,
            severity,
            userId: event.userId,
            ipAddress,
            riskScore: event.riskScore,
            service: 'communication-security-monitoring',
        });
        if (this.securityEvents.size > this.MAX_EVENTS) {
            this.cleanupOldEvents();
        }
    }
    analyzeImmediateThreats(event) {
        const actions = [];
        if (event.riskScore >= this.RISK_THRESHOLD_HIGH) {
            actions.push('high_risk_alert');
            if (event.userId) {
                this.suspiciousUsers.add(event.userId);
                actions.push('user_flagged');
            }
            if (event.ipAddress !== 'unknown') {
                this.ipRiskScores.set(event.ipAddress, (this.ipRiskScores.get(event.ipAddress) || 0) + event.riskScore);
                if ((this.ipRiskScores.get(event.ipAddress) || 0) > 20) {
                    this.blockedIPs.add(event.ipAddress);
                    actions.push('ip_blocked');
                }
            }
        }
        this.checkThreatPatterns(event, actions);
        if (actions.length > 0) {
            event.actionTaken = actions.join(', ');
            this.securityEvents.set(event.id, event);
            logger_1.default.error('Immediate security threat detected', {
                eventId: event.id,
                eventType: event.eventType,
                riskScore: event.riskScore,
                actionsTaken: actions,
                service: 'communication-security-monitoring',
            });
        }
    }
    checkThreatPatterns(event, actions) {
        if (event.eventType === 'input_validation_failed' &&
            event.details.pattern?.includes('sql_injection')) {
            actions.push('sql_injection_detected');
        }
        if (event.eventType === 'xss_attempt' ||
            (event.details.content && this.containsXSSPattern(event.details.content))) {
            actions.push('xss_attempt_detected');
        }
        if (event.eventType === 'authentication_failed' ||
            event.eventType === 'session_validation_failed') {
            const recentFailures = this.getRecentEventsByType(event.eventType, event.ipAddress, 5 * 60 * 1000);
            if (recentFailures.length >= 5) {
                actions.push('brute_force_detected');
                if (event.ipAddress !== 'unknown') {
                    this.blockedIPs.add(event.ipAddress);
                    actions.push('ip_blocked');
                }
            }
        }
        if (event.eventType === 'rate_limit_exceeded') {
            const recentRateLimits = this.getRecentEventsByType(event.eventType, event.ipAddress, 15 * 60 * 1000);
            if (recentRateLimits.length >= 3) {
                actions.push('rate_limit_abuse_detected');
            }
        }
        if (event.eventType === 'file_upload_rejected' &&
            event.details.reason?.includes('executable')) {
            actions.push('malicious_file_upload_attempt');
        }
        if (event.eventType === 'session_anomaly') {
            if (event.details.anomalyType === 'device_mismatch' ||
                event.details.anomalyType === 'location_change') {
                actions.push('session_hijack_suspected');
            }
        }
    }
    containsXSSPattern(content) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
        ];
        return xssPatterns.some(pattern => pattern.test(content));
    }
    getRecentEventsByType(eventType, ipAddress, timeWindow) {
        const cutoff = Date.now() - timeWindow;
        return Array.from(this.securityEvents.values()).filter(event => event.eventType === eventType &&
            event.ipAddress === ipAddress &&
            event.timestamp > cutoff);
    }
    calculateEventRiskScore(eventType, severity, details) {
        let baseScore = 0;
        const eventTypeScores = {
            'authentication_failed': 2,
            'session_validation_failed': 3,
            'permission_denied': 1,
            'rate_limit_exceeded': 2,
            'input_validation_failed': 4,
            'xss_attempt': 6,
            'sql_injection_attempt': 8,
            'file_upload_rejected': 3,
            'session_anomaly': 5,
            'csrf_token_invalid': 4,
            'suspicious_activity': 3,
            'data_access_violation': 5,
            'privilege_escalation_attempt': 9,
            'malicious_file_upload': 7,
        };
        baseScore = eventTypeScores[eventType] || 1;
        const severityMultipliers = {
            low: 1,
            medium: 1.5,
            high: 2,
            critical: 3,
        };
        baseScore *= severityMultipliers[severity];
        if (details.repeated)
            baseScore *= 1.5;
        if (details.automated)
            baseScore *= 1.3;
        if (details.privilegedAction)
            baseScore *= 1.4;
        if (details.sensitiveData)
            baseScore *= 1.6;
        return Math.min(baseScore, 10);
    }
    updateThreatIndicators(event) {
        const indicators = [
            { type: 'ip', value: event.ipAddress },
        ];
        if (event.userId) {
            indicators.push({ type: 'user', value: event.userId });
        }
        if (event.details.pattern) {
            indicators.push({ type: 'pattern', value: event.details.pattern });
        }
        for (const indicator of indicators) {
            const key = `${indicator.type}:${indicator.value}`;
            const existing = this.threatIndicators.get(key);
            if (existing) {
                existing.lastSeen = event.timestamp;
                existing.occurrences++;
                if (this.getSeverityLevel(event.severity) > this.getSeverityLevel(existing.severity)) {
                    existing.severity = event.severity;
                }
            }
            else {
                this.threatIndicators.set(key, {
                    type: indicator.type,
                    value: indicator.value,
                    severity: event.severity,
                    firstSeen: event.timestamp,
                    lastSeen: event.timestamp,
                    occurrences: 1,
                    description: `${event.eventType} from ${indicator.type}`,
                });
            }
        }
    }
    updateRiskScores(event) {
        if (event.userId) {
            const currentScore = this.userRiskScores.get(event.userId) || 0;
            this.userRiskScores.set(event.userId, Math.min(currentScore + event.riskScore * 0.1, 10));
        }
        if (event.ipAddress !== 'unknown') {
            const currentScore = this.ipRiskScores.get(event.ipAddress) || 0;
            this.ipRiskScores.set(event.ipAddress, Math.min(currentScore + event.riskScore * 0.2, 10));
        }
    }
    getSeverityLevel(severity) {
        const levels = { low: 1, medium: 2, high: 3, critical: 4 };
        return levels[severity];
    }
    generateEventId() {
        return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    cleanupOldEvents() {
        const cutoff = Date.now() - this.EVENT_RETENTION;
        let cleanedCount = 0;
        for (const [eventId, event] of this.securityEvents.entries()) {
            if (event.timestamp < cutoff) {
                this.securityEvents.delete(eventId);
                cleanedCount++;
            }
        }
        for (const [key, indicator] of this.threatIndicators.entries()) {
            if (indicator.lastSeen < cutoff) {
                this.threatIndicators.delete(key);
            }
        }
        if (cleanedCount > 0) {
            logger_1.default.info('Cleaned up old security events', {
                cleanedCount,
                remainingEvents: this.securityEvents.size,
                service: 'communication-security-monitoring',
            });
        }
    }
    isIPBlocked(ipAddress) {
        return this.blockedIPs.has(ipAddress);
    }
    isUserSuspicious(userId) {
        return this.suspiciousUsers.has(userId);
    }
    getUserRiskScore(userId) {
        return this.userRiskScores.get(userId) || 0;
    }
    getIPRiskScore(ipAddress) {
        return this.ipRiskScores.get(ipAddress) || 0;
    }
    getSecurityMetrics() {
        const events = Array.from(this.securityEvents.values());
        const eventsByType = {};
        const eventsBySeverity = {};
        for (const event of events) {
            eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
            eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
        }
        const topThreats = Array.from(this.threatIndicators.values())
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 10);
        const totalRiskScore = events.reduce((sum, event) => sum + event.riskScore, 0);
        const avgRiskScore = events.length > 0 ? totalRiskScore / events.length : 0;
        return {
            totalEvents: events.length,
            eventsByType,
            eventsBySeverity,
            topThreats,
            riskScore: avgRiskScore,
            lastUpdated: Date.now(),
        };
    }
    getRecentEvents(limit = 100) {
        return Array.from(this.securityEvents.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    getEventsByUser(userId, limit = 50) {
        return Array.from(this.securityEvents.values())
            .filter(event => event.userId === userId)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    unblockIP(ipAddress) {
        if (this.blockedIPs.has(ipAddress)) {
            this.blockedIPs.delete(ipAddress);
            this.ipRiskScores.delete(ipAddress);
            logger_1.default.info('IP address unblocked', {
                ipAddress,
                service: 'communication-security-monitoring',
            });
            return true;
        }
        return false;
    }
    clearUserSuspicion(userId) {
        if (this.suspiciousUsers.has(userId)) {
            this.suspiciousUsers.delete(userId);
            this.userRiskScores.delete(userId);
            logger_1.default.info('User suspicion cleared', {
                userId,
                service: 'communication-security-monitoring',
            });
            return true;
        }
        return false;
    }
    reset() {
        this.securityEvents.clear();
        this.threatIndicators.clear();
        this.userRiskScores.clear();
        this.ipRiskScores.clear();
        this.blockedIPs.clear();
        this.suspiciousUsers.clear();
        logger_1.default.warn('Security monitoring data reset', {
            service: 'communication-security-monitoring',
        });
    }
}
exports.communicationSecurityMonitoringService = new CommunicationSecurityMonitoringService();
exports.default = exports.communicationSecurityMonitoringService;
//# sourceMappingURL=communicationSecurityMonitoring.js.map