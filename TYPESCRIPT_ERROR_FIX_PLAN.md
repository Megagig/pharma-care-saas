# TypeScript Error Fix Plan

## Error Categories

### 1. Singleton Pattern Issues (Multiple files)
- **Files affected**: `optimizedReportHelpers.ts`, `reportsController.ts`, `initializeReportIndexes.ts`
- **Issue**: Services calling `getInstance()` but method doesn't exist or isn't static
- **Services**: `ReportAggregationService`, `BackgroundJobService`, `ConnectionPoolService`, `DatabaseIndexingService`

### 2. File Casing Issue
- **File**: `reportsController.ts`
- **Issue**: Import path casing mismatch `ConnectionPoolService.ts` vs `connectionPoolService.ts`

### 3. Missing Model Methods
- **Files affected**: `reportsRBAC.ts`, `ReportAuditLog.ts`, `ReportSchedule.ts`
- **Missing methods**: `logEvent`, `calculateRiskScore`, `calculateNextRun`, `incrementViewCount`

### 4. Missing Type Definitions
- **Files affected**: `jsonSchemaValidator.ts`, `BackgroundJobService.ts`
- **Missing modules**: `ajv`, `ajv-formats`, `bull`

### 5. Missing Imports
- **Files affected**: `BackgroundJobService.ts`
- **Missing imports**: `path`, `emailHelpers`, `exportHelpers`

### 6. Type Mismatches
- **Files affected**: `reportsRBAC.ts`, `ReportAggregationService.ts`
- **Issues**: `ObjectId` vs `string`, `PipelineStage` type conflicts

### 7. Invalid Mongoose Options
- **File**: `ConnectionPoolService.ts`
- **Issue**: `bufferMaxEntries` doesn't exist in ConnectOptions

## Fix Implementation Order

1. **Install missing dependencies** (ajv, ajv-formats, bull)
2. **Fix file casing issue** (simplest fix first)
3. **Fix singleton pattern implementations** (most widespread issue)
4. **Add missing model methods**
5. **Fix type mismatches**
6. **Fix mongoose options**
7. **Add missing imports**
8. **Verify all fixes**

## Detailed Checklist

- [ ] Install missing dependencies: ajv, ajv-formats, bull
- [ ] Fix ConnectionPoolService import path casing
- [ ] Fix ReportAggregationService singleton pattern
- [ ] Fix BackgroundJobService singleton pattern
- [ ] Fix ConnectionPoolService singleton pattern
- [ ] Fix DatabaseIndexingService singleton pattern
- [ ] Add ReportAuditLog.logEvent static method
- [ ] Add ReportAuditLog calculateRiskScore instance method
- [ ] Add ReportSchedule calculateNextRun instance method
- [ ] Add ReportTemplate incrementViewCount instance method
- [ ] Fix AuthRequest sessionID type definition
- [ ] Fix ObjectId to string conversion in reportsRBAC
- [ ] Fix PipelineStage type import in ReportAggregationService
- [ ] Remove bufferMaxEntries from ConnectionPoolService
- [ ] Add missing imports to BackgroundJobService (path, emailHelpers, exportHelpers)
- [ ] Verify all errors are resolved
