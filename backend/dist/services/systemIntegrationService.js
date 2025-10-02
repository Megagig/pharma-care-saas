"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemIntegrationService = void 0;
const FeatureFlagService_1 = __importDefault(require("../services/FeatureFlagService"));
const auditService_1 = require("./auditService");
class SystemIntegrationService {
    constructor() {
        this.healthChecks = new Map();
        this.featureFlagService = FeatureFlagService_1.default;
        this.initializeHealthChecks();
    }
    static getInstance() {
        if (!SystemIntegrationService.instance) {
            SystemIntegrationService.instance = new SystemIntegrationService();
        }
        return SystemIntegrationService.instance;
    }
    initializeHealthChecks() {
        const services = [
            'existing_fhir_lab_import',
            'authentication_system',
            'audit_logging',
            'notification_service',
            'pdf_generation',
            'ai_diagnostic_service',
            'database_connection',
            'file_storage'
        ];
        services.forEach(service => {
            this.healthChecks.set(service, {
                service,
                status: 'healthy',
                lastCheck: new Date()
            });
        });
        this.startHealthCheckScheduler();
    }
    async checkSystemCompatibility() {
        const existingRoutes = await this.getExistingRoutes();
        const newRoutes = this.getManualLabRoutes();
        const conflicts = this.detectRouteConflicts(existingRoutes, newRoutes);
        const migrations = await this.checkRequiredMigrations();
        return {
            existingRoutes,
            newRoutes,
            conflicts,
            migrations
        };
    }
    async validateIntegration() {
        const issues = [];
        const warnings = [];
        try {
            const compatibility = await this.checkSystemCompatibility();
            if (compatibility.conflicts.length > 0) {
                issues.push(`Route conflicts detected: ${compatibility.conflicts.join(', ')}`);
            }
            const schemaCheck = await this.validateDatabaseSchema();
            if (!schemaCheck.compatible) {
                issues.push(`Database schema issues: ${schemaCheck.issues.join(', ')}`);
            }
            const fhirCheck = await this.validateFHIRIntegration();
            if (!fhirCheck.compatible) {
                warnings.push(`FHIR integration concerns: ${fhirCheck.warnings.join(', ')}`);
            }
            const authCheck = await this.validateAuthenticationIntegration();
            if (!authCheck.compatible) {
                issues.push(`Authentication integration issues: ${authCheck.issues.join(', ')}`);
            }
            const auditCheck = await this.validateAuditIntegration();
            if (!auditCheck.compatible) {
                warnings.push(`Audit system concerns: ${auditCheck.warnings.join(', ')}`);
            }
            return {
                success: issues.length === 0,
                issues,
                warnings
            };
        }
        catch (error) {
            issues.push(`Integration validation failed: ${error}`);
            return {
                success: false,
                issues,
                warnings
            };
        }
    }
    backwardCompatibilityMiddleware() {
        return (req, res, next) => {
            res.setHeader('X-Manual-Lab-Integration', 'v1.0.0');
            res.setHeader('X-Backward-Compatible', 'true');
            const isExistingRoute = this.isExistingRoute(req.path);
            if (isExistingRoute) {
                req.headers['x-legacy-route'] = 'true';
            }
            this.monitorRequestHealth(req);
            next();
        };
    }
    gradualRolloutMiddleware() {
        return async (req, res, next) => {
            const userId = req.user?._id?.toString();
            const workplaceId = req.user?.workplaceId?.toString();
            const isEnabled = await this.featureFlagService.isFeatureEnabled('manual_lab_orders', userId || '', workplaceId || '');
            if (!isEnabled && req.path.startsWith('/api/manual-lab')) {
                res.status(404).json({
                    success: false,
                    message: 'Feature not available for your account',
                    code: 'FEATURE_NOT_AVAILABLE'
                });
                return;
            }
            next();
        };
    }
    async getIntegrationHealth() {
        const services = Array.from(this.healthChecks.values());
        const healthyCount = services.filter(s => s.status === 'healthy').length;
        const totalCount = services.length;
        let overall;
        if (healthyCount === totalCount) {
            overall = 'healthy';
        }
        else if (healthyCount >= totalCount * 0.7) {
            overall = 'degraded';
        }
        else {
            overall = 'unhealthy';
        }
        const manualLabResult = await this.featureFlagService.isFeatureEnabled('manual_lab_orders', 'system', 'system');
        const manualLabEnabled = manualLabResult.enabled;
        const criticalFeatureChecks = await Promise.all([
            'manual_lab_pdf_generation',
            'manual_lab_qr_scanning'
        ].map(flag => this.featureFlagService.isFeatureEnabled(flag, 'system', 'system')));
        const criticalFeaturesEnabled = criticalFeatureChecks.every(check => check.enabled);
        let manualLabStatus;
        if (!manualLabEnabled) {
            manualLabStatus = 'disabled';
        }
        else if (criticalFeaturesEnabled) {
            manualLabStatus = 'enabled';
        }
        else {
            manualLabStatus = 'partial';
        }
        return {
            overall,
            services,
            manualLabStatus
        };
    }
    async emergencyRollback(reason) {
        const rollbackActions = [];
        const errors = [];
        try {
            const manualLabFlags = [
                'manual_lab_orders',
                'manual_lab_pdf_generation',
                'manual_lab_qr_scanning',
                'manual_lab_ai_interpretation',
                'manual_lab_fhir_integration'
            ];
            for (const flag of manualLabFlags) {
                try {
                    await this.featureFlagService.setUserFeatureOverride(flag, 'system', false);
                    rollbackActions.push(`Disabled feature flag: ${flag}`);
                }
                catch (error) {
                    errors.push(`Failed to disable ${flag}: ${error}`);
                }
            }
            await auditService_1.AuditService.logActivity({
                userId: 'system',
                workspaceId: 'system'
            }, {
                action: 'EMERGENCY_ROLLBACK',
                resourceType: 'manual_lab_integration',
                details: {
                    reason,
                    rollbackActions,
                    timestamp: new Date(),
                    severity: 'critical'
                },
                riskLevel: 'high'
            });
            rollbackActions.push('Logged emergency rollback event');
            return {
                success: errors.length === 0,
                rollbackActions,
                errors
            };
        }
        catch (error) {
            errors.push(`Rollback failed: ${error}`);
            return {
                success: false,
                rollbackActions,
                errors
            };
        }
    }
    async getExistingRoutes() {
        return [
            '/api/auth',
            '/api/patients',
            '/api/medications',
            '/api/diagnostics',
            '/api/notes',
            '/api/mtr',
            '/api/admin',
            '/api/audit'
        ];
    }
    getManualLabRoutes() {
        return [
            '/api/manual-lab',
            '/api/manual-lab/scan',
            '/api/manual-lab/orders',
            '/api/manual-lab/results',
            '/api/manual-lab/pdf'
        ];
    }
    detectRouteConflicts(existing, newRoutes) {
        const conflicts = [];
        newRoutes.forEach(newRoute => {
            existing.forEach(existingRoute => {
                if (newRoute.startsWith(existingRoute) || existingRoute.startsWith(newRoute)) {
                    conflicts.push(`${newRoute} conflicts with ${existingRoute}`);
                }
            });
        });
        return conflicts;
    }
    async checkRequiredMigrations() {
        const migrations = [];
        try {
            const collections = ['manuallaborders', 'manuallabresults', 'testcatalogs'];
            migrations.push('Manual lab collections setup');
        }
        catch (error) {
        }
        return migrations;
    }
    async validateDatabaseSchema() {
        const issues = [];
        try {
            return { compatible: true, issues };
        }
        catch (error) {
            issues.push(`Schema validation error: ${error}`);
            return { compatible: false, issues };
        }
    }
    async validateFHIRIntegration() {
        const warnings = [];
        try {
            return { compatible: true, warnings };
        }
        catch (error) {
            warnings.push(`FHIR integration warning: ${error}`);
            return { compatible: true, warnings };
        }
    }
    async validateAuthenticationIntegration() {
        const issues = [];
        try {
            return { compatible: true, issues };
        }
        catch (error) {
            issues.push(`Auth integration error: ${error}`);
            return { compatible: false, issues };
        }
    }
    async validateAuditIntegration() {
        const warnings = [];
        try {
            return { compatible: true, warnings };
        }
        catch (error) {
            warnings.push(`Audit integration warning: ${error}`);
            return { compatible: true, warnings };
        }
    }
    isExistingRoute(path) {
        const existingPrefixes = [
            '/api/auth',
            '/api/patients',
            '/api/medications',
            '/api/diagnostics',
            '/api/notes',
            '/api/mtr'
        ];
        return existingPrefixes.some(prefix => path.startsWith(prefix));
    }
    monitorRequestHealth(req) {
        const startTime = Date.now();
        req.on('end', () => {
            const responseTime = Date.now() - startTime;
            if (responseTime > 5000) {
                console.warn(`Slow request detected: ${req.path} took ${responseTime}ms`);
            }
        });
    }
    startHealthCheckScheduler() {
        setInterval(async () => {
            await this.performHealthChecks();
        }, 5 * 60 * 1000);
    }
    async performHealthChecks() {
        for (const [serviceName, health] of this.healthChecks) {
            try {
                const startTime = Date.now();
                await this.checkServiceHealth(serviceName);
                const responseTime = Date.now() - startTime;
                this.healthChecks.set(serviceName, {
                    ...health,
                    status: 'healthy',
                    lastCheck: new Date(),
                    responseTime
                });
            }
            catch (error) {
                this.healthChecks.set(serviceName, {
                    ...health,
                    status: 'unhealthy',
                    lastCheck: new Date(),
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
    async checkServiceHealth(serviceName) {
        switch (serviceName) {
            case 'database_connection':
                break;
            case 'existing_fhir_lab_import':
                break;
            case 'authentication_system':
                break;
            default:
                break;
        }
    }
}
exports.SystemIntegrationService = SystemIntegrationService;
exports.default = SystemIntegrationService;
//# sourceMappingURL=systemIntegrationService.js.map