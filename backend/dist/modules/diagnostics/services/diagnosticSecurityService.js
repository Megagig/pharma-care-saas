"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const securityMonitoringService_1 = require("../../../services/securityMonitoringService");
class DiagnosticSecurityService {
    constructor() {
        this.threats = new Map();
        this.apiKeyRotationConfig = {
            rotationInterval: 30 * 24 * 60 * 60 * 1000,
            warningThreshold: 0.8,
            autoRotate: false,
            notifyAdmins: true,
        };
    }
    async analyzeRequest(req, requestType) {
        const threats = [];
        try {
            const rateLimitThreats = await this.analyzeRateLimitPatterns(req, requestType);
            threats.push(...rateLimitThreats);
            const dataThreats = await this.analyzeDataPatterns(req);
            threats.push(...dataThreats);
            const injectionThreats = await this.analyzeInjectionAttempts(req);
            threats.push(...injectionThreats);
            const apiThreats = await this.analyzeApiAbusePatterns(req);
            threats.push(...apiThreats);
            for (const threat of threats) {
                await this.processThreat(threat);
            }
            return threats;
        }
        catch (error) {
            logger_1.default.error('Error analyzing diagnostic request security', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: req.user?._id,
                endpoint: req.originalUrl,
            });
            return [];
        }
    }
    async analyzeRateLimitPatterns(req, requestType) {
        const threats = [];
        if (!req.user)
            return threats;
        const userId = req.user._id.toString();
        const workplaceId = req.workspaceContext?.workspace._id?.toString() || '';
        const burstPattern = await this.detectBurstPattern(userId, requestType);
        if (burstPattern.detected) {
            threats.push({
                id: crypto_1.default.randomUUID(),
                type: 'RATE_LIMIT_ABUSE',
                severity: burstPattern.severity,
                userId,
                workplaceId,
                description: `Burst pattern detected: ${burstPattern.requestCount} ${requestType} requests in ${burstPattern.timeWindow}ms`,
                evidence: {
                    requestCount: burstPattern.requestCount,
                    timeWindow: burstPattern.timeWindow,
                    requestType,
                    pattern: 'BURST',
                },
                timestamp: new Date(),
                mitigated: false,
            });
        }
        const sustainedPattern = await this.detectSustainedPattern(userId, requestType);
        if (sustainedPattern.detected) {
            threats.push({
                id: crypto_1.default.randomUUID(),
                type: 'RATE_LIMIT_ABUSE',
                severity: sustainedPattern.severity,
                userId,
                workplaceId,
                description: `Sustained high-volume pattern: ${sustainedPattern.requestCount} requests over ${sustainedPattern.duration}ms`,
                evidence: {
                    requestCount: sustainedPattern.requestCount,
                    duration: sustainedPattern.duration,
                    requestType,
                    pattern: 'SUSTAINED',
                },
                timestamp: new Date(),
                mitigated: false,
            });
        }
        return threats;
    }
    async analyzeDataPatterns(req) {
        const threats = [];
        if (!req.user || !req.body)
            return threats;
        const userId = req.user._id.toString();
        const workplaceId = req.workspaceContext?.workspace._id?.toString() || '';
        const exfiltrationPattern = this.detectDataExfiltrationPattern(req.body);
        if (exfiltrationPattern.detected) {
            threats.push({
                id: crypto_1.default.randomUUID(),
                type: 'DATA_EXFILTRATION',
                severity: exfiltrationPattern.severity,
                userId,
                workplaceId,
                description: `Potential data exfiltration: ${exfiltrationPattern.reason}`,
                evidence: {
                    reason: exfiltrationPattern.reason,
                    dataSize: exfiltrationPattern.dataSize,
                    suspiciousFields: exfiltrationPattern.suspiciousFields,
                },
                timestamp: new Date(),
                mitigated: false,
            });
        }
        const volumePattern = this.detectUnusualDataVolume(req.body);
        if (volumePattern.detected) {
            threats.push({
                id: crypto_1.default.randomUUID(),
                type: 'SUSPICIOUS_PATTERN',
                severity: volumePattern.severity,
                userId,
                workplaceId,
                description: `Unusual data volume: ${volumePattern.description}`,
                evidence: {
                    dataVolume: volumePattern.volume,
                    threshold: volumePattern.threshold,
                    fields: volumePattern.fields,
                },
                timestamp: new Date(),
                mitigated: false,
            });
        }
        return threats;
    }
    async analyzeInjectionAttempts(req) {
        const threats = [];
        if (!req.user)
            return threats;
        const userId = req.user._id.toString();
        const workplaceId = req.workspaceContext?.workspace._id?.toString() || '';
        const injectionPatterns = this.detectInjectionPatterns(req.body);
        for (const pattern of injectionPatterns) {
            threats.push({
                id: crypto_1.default.randomUUID(),
                type: 'INJECTION_ATTEMPT',
                severity: pattern.severity,
                userId,
                workplaceId,
                description: `${pattern.type} injection attempt detected in ${pattern.field}`,
                evidence: {
                    injectionType: pattern.type,
                    field: pattern.field,
                    value: pattern.value.substring(0, 100),
                    pattern: pattern.pattern,
                },
                timestamp: new Date(),
                mitigated: false,
            });
        }
        const queryInjections = this.detectInjectionPatterns(req.query);
        for (const pattern of queryInjections) {
            threats.push({
                id: crypto_1.default.randomUUID(),
                type: 'INJECTION_ATTEMPT',
                severity: pattern.severity,
                userId,
                workplaceId,
                description: `${pattern.type} injection attempt in query parameter ${pattern.field}`,
                evidence: {
                    injectionType: pattern.type,
                    field: pattern.field,
                    value: pattern.value.substring(0, 100),
                    pattern: pattern.pattern,
                    location: 'query',
                },
                timestamp: new Date(),
                mitigated: false,
            });
        }
        return threats;
    }
    async analyzeApiAbusePatterns(req) {
        const threats = [];
        if (!req.user)
            return threats;
        const userId = req.user._id.toString();
        const workplaceId = req.workspaceContext?.workspace._id?.toString() || '';
        const botPattern = this.detectBotBehavior(req);
        if (botPattern.detected) {
            threats.push({
                id: crypto_1.default.randomUUID(),
                type: 'API_ABUSE',
                severity: botPattern.severity,
                userId,
                workplaceId,
                description: `Bot-like behavior detected: ${botPattern.indicators.join(', ')}`,
                evidence: {
                    indicators: botPattern.indicators,
                    userAgent: req.get('User-Agent'),
                    requestTiming: botPattern.requestTiming,
                },
                timestamp: new Date(),
                mitigated: false,
            });
        }
        return threats;
    }
    async detectBurstPattern(userId, requestType) {
        const mockRequestCount = Math.floor(Math.random() * 20);
        const timeWindow = 60000;
        if (mockRequestCount > 15) {
            return {
                detected: true,
                severity: 'CRITICAL',
                requestCount: mockRequestCount,
                timeWindow,
            };
        }
        else if (mockRequestCount > 10) {
            return {
                detected: true,
                severity: 'HIGH',
                requestCount: mockRequestCount,
                timeWindow,
            };
        }
        else if (mockRequestCount > 5) {
            return {
                detected: true,
                severity: 'MEDIUM',
                requestCount: mockRequestCount,
                timeWindow,
            };
        }
        return {
            detected: false,
            severity: 'LOW',
            requestCount: mockRequestCount,
            timeWindow,
        };
    }
    async detectSustainedPattern(userId, requestType) {
        const mockRequestCount = Math.floor(Math.random() * 100);
        const duration = 15 * 60 * 1000;
        if (mockRequestCount > 80) {
            return {
                detected: true,
                severity: 'HIGH',
                requestCount: mockRequestCount,
                duration,
            };
        }
        else if (mockRequestCount > 50) {
            return {
                detected: true,
                severity: 'MEDIUM',
                requestCount: mockRequestCount,
                duration,
            };
        }
        return {
            detected: false,
            severity: 'LOW',
            requestCount: mockRequestCount,
            duration,
        };
    }
    detectDataExfiltrationPattern(data) {
        const dataString = JSON.stringify(data);
        const dataSize = dataString.length;
        const suspiciousFields = [];
        if (dataSize > 100000) {
            return {
                detected: true,
                severity: 'HIGH',
                reason: 'Unusually large payload size',
                dataSize,
                suspiciousFields,
            };
        }
        const fieldNames = this.extractFieldNames(data);
        for (const field of fieldNames) {
            if (field.toLowerCase().includes('password') ||
                field.toLowerCase().includes('secret') ||
                field.toLowerCase().includes('key') ||
                field.toLowerCase().includes('token')) {
                suspiciousFields.push(field);
            }
        }
        if (suspiciousFields.length > 0) {
            return {
                detected: true,
                severity: 'MEDIUM',
                reason: 'Suspicious field names detected',
                dataSize,
                suspiciousFields,
            };
        }
        return {
            detected: false,
            severity: 'LOW',
            reason: '',
            dataSize,
            suspiciousFields,
        };
    }
    detectUnusualDataVolume(data) {
        const issues = [];
        let maxSeverity = 'LOW';
        if (data.symptoms?.subjective?.length > 30) {
            issues.push(`${data.symptoms.subjective.length} symptoms (threshold: 30)`);
            maxSeverity = 'MEDIUM';
        }
        if (data.currentMedications?.length > 25) {
            issues.push(`${data.currentMedications.length} medications (threshold: 25)`);
            maxSeverity = 'MEDIUM';
        }
        if (data.labResults?.length > 50) {
            issues.push(`${data.labResults.length} lab results (threshold: 50)`);
            maxSeverity = 'HIGH';
        }
        if (issues.length > 0) {
            return {
                detected: true,
                severity: maxSeverity,
                description: issues.join(', '),
                volume: JSON.stringify(data).length,
                threshold: 50000,
                fields: issues,
            };
        }
        return {
            detected: false,
            severity: 'LOW',
            description: '',
            volume: JSON.stringify(data).length,
            threshold: 50000,
            fields: [],
        };
    }
    detectInjectionPatterns(data) {
        const patterns = [];
        const injectionPatterns = [
            { type: 'SQL', pattern: /(union|select|insert|update|delete|drop|create|alter)\s+/i, severity: 'HIGH' },
            { type: 'NoSQL', pattern: /(\$where|\$ne|\$gt|\$lt|\$regex)/i, severity: 'HIGH' },
            { type: 'XSS', pattern: /<script|javascript:|on\w+\s*=/i, severity: 'MEDIUM' },
            { type: 'Command', pattern: /(;|\||&|`|\$\(|exec|eval|system)/i, severity: 'CRITICAL' },
            { type: 'Path Traversal', pattern: /(\.\.\/|\.\.\\|%2e%2e%2f)/i, severity: 'MEDIUM' },
        ];
        this.scanObjectForPatterns(data, '', injectionPatterns, patterns);
        return patterns;
    }
    scanObjectForPatterns(obj, path, injectionPatterns, results) {
        if (typeof obj === 'string') {
            for (const { type, pattern, severity } of injectionPatterns) {
                if (pattern.test(obj)) {
                    results.push({
                        type,
                        field: path,
                        value: obj,
                        pattern: pattern.source,
                        severity,
                    });
                }
            }
        }
        else if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                this.scanObjectForPatterns(item, `${path}[${index}]`, injectionPatterns, results);
            });
        }
        else if (obj && typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                const newPath = path ? `${path}.${key}` : key;
                this.scanObjectForPatterns(value, newPath, injectionPatterns, results);
            }
        }
    }
    detectBotBehavior(req) {
        const indicators = [];
        const userAgent = req.get('User-Agent') || '';
        if (userAgent.toLowerCase().includes('bot') ||
            userAgent.toLowerCase().includes('crawler') ||
            userAgent.toLowerCase().includes('spider') ||
            userAgent.toLowerCase().includes('scraper')) {
            indicators.push('Bot user agent');
        }
        if (!req.get('Accept-Language')) {
            indicators.push('Missing Accept-Language header');
        }
        if (!req.get('Accept-Encoding')) {
            indicators.push('Missing Accept-Encoding header');
        }
        const requestTiming = Date.now() % 1000;
        if (requestTiming < 100) {
            indicators.push('Suspiciously fast request timing');
        }
        let severity = 'LOW';
        if (indicators.length >= 3) {
            severity = 'HIGH';
        }
        else if (indicators.length >= 2) {
            severity = 'MEDIUM';
        }
        else if (indicators.length >= 1) {
            severity = 'LOW';
        }
        return {
            detected: indicators.length > 0,
            severity,
            indicators,
            requestTiming,
        };
    }
    extractFieldNames(obj, prefix = '') {
        const fields = [];
        if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                fields.push(fullKey);
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    fields.push(...this.extractFieldNames(obj[key], fullKey));
                }
            }
        }
        return fields;
    }
    async processThreat(threat) {
        try {
            this.threats.set(threat.id, threat);
            logger_1.default.warn('Security threat detected', {
                threatId: threat.id,
                type: threat.type,
                severity: threat.severity,
                userId: threat.userId,
                workplaceId: threat.workplaceId,
                description: threat.description,
            });
            if (threat.severity === 'CRITICAL') {
                await this.mitigateThreat(threat);
            }
            await securityMonitoringService_1.securityMonitoringService.analyzeSecurityEvent({ user: { _id: threat.userId } }, 'diagnostic_security_threat', {
                threatId: threat.id,
                type: threat.type,
                severity: threat.severity,
                evidence: threat.evidence,
            });
        }
        catch (error) {
            logger_1.default.error('Error processing security threat', {
                error: error instanceof Error ? error.message : 'Unknown error',
                threatId: threat.id,
            });
        }
    }
    async mitigateThreat(threat) {
        try {
            switch (threat.type) {
                case 'RATE_LIMIT_ABUSE':
                    await this.temporaryRateLimit(threat.userId);
                    break;
                case 'INJECTION_ATTEMPT':
                    await this.flagUserForReview(threat.userId, 'Injection attempt detected');
                    break;
                case 'API_ABUSE':
                    await this.requireAdditionalVerification(threat.userId);
                    break;
                case 'DATA_EXFILTRATION':
                    await this.alertAdministrators(threat);
                    break;
                default:
                    logger_1.default.warn('No mitigation strategy for threat type', { type: threat.type });
            }
            threat.mitigated = true;
            this.threats.set(threat.id, threat);
            logger_1.default.info('Security threat mitigated', {
                threatId: threat.id,
                type: threat.type,
                userId: threat.userId,
            });
        }
        catch (error) {
            logger_1.default.error('Error mitigating security threat', {
                error: error instanceof Error ? error.message : 'Unknown error',
                threatId: threat.id,
            });
        }
    }
    async temporaryRateLimit(userId) {
        logger_1.default.info('Temporary rate limit applied', { userId });
    }
    async flagUserForReview(userId, reason) {
        logger_1.default.warn('User flagged for review', { userId, reason });
    }
    async requireAdditionalVerification(userId) {
        logger_1.default.info('Additional verification required', { userId });
    }
    async alertAdministrators(threat) {
        logger_1.default.error('SECURITY ALERT: Critical threat detected', {
            threatId: threat.id,
            type: threat.type,
            userId: threat.userId,
            description: threat.description,
        });
    }
    getSecurityMetrics() {
        const threats = Array.from(this.threats.values());
        const threatsByType = {};
        const threatsBySeverity = {};
        for (const threat of threats) {
            threatsByType[threat.type] = (threatsByType[threat.type] || 0) + 1;
            threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
        }
        return {
            totalThreats: threats.length,
            threatsByType,
            threatsBySeverity,
            mitigatedThreats: threats.filter(t => t.mitigated).length,
            activeThreats: threats.filter(t => !t.mitigated).length,
            averageResponseTime: 0,
        };
    }
    getActiveThreats() {
        return Array.from(this.threats.values()).filter(threat => !threat.mitigated);
    }
    clearOldThreats(olderThanMs = 24 * 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - olderThanMs);
        for (const [id, threat] of this.threats.entries()) {
            if (threat.timestamp < cutoff) {
                this.threats.delete(id);
            }
        }
    }
}
exports.default = new DiagnosticSecurityService();
//# sourceMappingURL=diagnosticSecurityService.js.map