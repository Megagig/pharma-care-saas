const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  displayName: 'RBAC Tests',
  testMatch: [
    '<rootDir>/src/__tests__/services/DynamicPermissionService.test.ts',
    '<rootDir>/src/__tests__/services/RoleHierarchyService.test.ts',
    '<rootDir>/src/__tests__/services/CacheManager.test.ts',
    '<rootDir>/src/__tests__/migrations/rbacMigration.test.ts',
    '<rootDir>/src/__tests__/integration/rbacWorkflows.test.ts',
    '<rootDir>/src/__tests__/performance/rbacPerformance.test.ts',
    '<rootDir>/src/__tests__/security/rbacSecurity.test.ts',
  ],
  collectCoverageFrom: [
    'src/services/DynamicPermissionService.ts',
    'src/services/RoleHierarchyService.ts',
    'src/services/CacheManager.ts',
    'src/services/CacheInvalidationService.ts',
    'src/services/PermissionAggregationService.ts',
    'src/middlewares/rbac.ts',
    'src/controllers/roleController.ts',
    'src/controllers/permissionController.ts',
    'src/controllers/rbacAuditController.ts',
    'src/models/Role.ts',
    'src/models/Permission.ts',
    'src/models/UserRole.ts',
    'src/models/RolePermission.ts',
  ],
  coverageDirectory: 'coverage/rbac',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/services/DynamicPermissionService.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/services/RoleHierarchyService.ts': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/services/CacheManager.ts': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testEnvironment: 'node',
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  maxWorkers: 1, // Run tests sequentially for integration/performance tests

  // Performance test specific settings
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },

  // Custom test result processor for detailed reporting
  testResultsProcessor: '<rootDir>/src/__tests__/rbacTestResultsProcessor.js',
};
