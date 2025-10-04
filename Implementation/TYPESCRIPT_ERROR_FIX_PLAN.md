# TypeScript Error Fix Plan

## Errors to Fix (29 errors in 10 files)

### 1. src/modules/lab/routes/manualLabRoutes.ts (2 errors)
- [ ] Fix missing exports `injectFeatureFlags` and `requireFeatureFlag` from featureFlags

### 2. src/routes/lighthouseRoutes.ts (1 error)
- [ ] Fix missing properties `workspaceId` and `budgetStatus` in LighthouseResult

### 3. src/services/ContinuousMonitoringService.ts (8 errors)
- [ ] Fix `cron` namespace issue
- [ ] Fix missing `getRecentMetrics` method in WebVitalsService
- [ ] Fix missing `sendAlert` method in PerformanceAlertService (3 instances)
- [ ] Fix missing `runLighthouseTest` method in LighthouseCIService
- [ ] Fix missing `getMetricsInRange` method in WebVitalsService

### 4. src/services/FeatureFlagService.ts (1 error)
- [ ] Fix arithmetic operation with Date types

### 5. src/services/LighthouseCIService.ts (4 errors)
- [ ] Fix missing `get` and `set` methods in PerformanceCacheService (4 instances)

### 6. src/services/PerformanceMonitoringService.ts (6 errors)
- [ ] Fix import statement for PerformanceCacheService
- [ ] Fix missing `current` and `previous` properties in trend object
- [ ] Fix arithmetic operations with Object.values()

### 7. src/services/ProductionValidationService.ts (3 errors)
- [ ] Fix missing `runLighthouseTest` method in LighthouseCIService
- [ ] Fix missing `getRecentMetrics` method in WebVitalsService
- [ ] Fix missing `sendAlert` method in PerformanceAlertService

### 8. src/services/WebVitalsService.ts (2 errors)
- [ ] Fix import statement for PerformanceCacheService
- [ ] Fix MongoDB aggregation pipeline type issues

### 9. src/services/communicationAuditService.ts (1 error)
- [ ] Fix ObjectId type assignment issue

### 10. src/services/systemIntegrationService.ts (1 error)
- [ ] Fix missing FeatureFlagService export from featureFlags

## Strategy
1. Start with import/export issues as they're foundational
2. Fix missing methods and properties
3. Address type compatibility issues
4. Test with `npx tsc --noEmit` after each major fix
