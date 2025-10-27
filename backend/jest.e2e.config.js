/**
 * Jest Configuration for Patient Engagement E2E Tests
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/e2e/**/*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],
  
  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage/e2e',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/controllers/**/*.ts',
    'src/services/**/*.ts',
    'src/models/**/*.ts',
    'src/routes/**/*.ts',
    'src/middlewares/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/app.ts',
    '!src/server.ts'
  ],
  
  // Test timeout (E2E tests can be slower)
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/src/__tests__/e2e/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/e2e/globalTeardown.ts',
  
  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Maximum worker processes
  maxWorkers: 1, // Run E2E tests sequentially to avoid conflicts
  
  // Reporter configuration
  reporters: ['default']
};