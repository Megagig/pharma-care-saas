#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const testSuites = [
    {
        name: 'Unit Tests - Models',
        file: 'comprehensive-models.test.ts',
        description: 'Tests for ManualLabOrder, ManualLabResult, and TestCatalog models',
        timeout: 30000
    },
    {
        name: 'Unit Tests - Services',
        file: 'comprehensive-services.test.ts',
        description: 'Tests for ManualLabService and related business logic',
        timeout: 45000
    },
    {
        name: 'Unit Tests - Token Service',
        file: 'comprehensive-token-service.test.ts',
        description: 'Tests for TokenService security and functionality',
        timeout: 30000
    },
    {
        name: 'Integration Tests - API',
        file: 'comprehensive-api-integration.test.ts',
        description: 'Tests for API endpoints with authentication and validation',
        timeout: 60000
    },
    {
        name: 'End-to-End Tests - Workflow',
        file: 'comprehensive-e2e-workflow.test.ts',
        description: 'Complete workflow tests from order creation to AI interpretation',
        timeout: 120000
    }
];
class TestRunner {
    constructor() {
        this.results = [];
        this.startTime = 0;
        this.startTime = Date.now();
    }
    async runAllTests() {
        console.log('🧪 Manual Lab Module - Comprehensive Test Suite');
        console.log('='.repeat(60));
        console.log(`Starting comprehensive tests at ${new Date().toISOString()}`);
        console.log(`Test suites to run: ${testSuites.length}`);
        console.log('');
        for (const suite of testSuites) {
            await this.runTestSuite(suite);
        }
        this.printSummary();
    }
    async runTestSuite(suite) {
        console.log(`📋 Running: ${suite.name}`);
        console.log(`   Description: ${suite.description}`);
        console.log(`   File: ${suite.file}`);
        const startTime = Date.now();
        let result;
        try {
            const testFilePath = path_1.default.join(__dirname, suite.file);
            if (!fs_1.default.existsSync(testFilePath)) {
                throw new Error(`Test file not found: ${testFilePath}`);
            }
            const jestCommand = [
                'npx jest',
                `"${testFilePath}"`,
                '--verbose',
                '--no-cache',
                '--detectOpenHandles',
                '--forceExit',
                suite.timeout ? `--testTimeout=${suite.timeout}` : '--testTimeout=30000'
            ].join(' ');
            const output = (0, child_process_1.execSync)(jestCommand, {
                cwd: path_1.default.join(__dirname, '../../../..'),
                encoding: 'utf8',
                stdio: 'pipe'
            });
            const duration = Date.now() - startTime;
            result = {
                suite: suite.name,
                passed: true,
                duration,
                output
            };
            console.log(`   ✅ PASSED (${duration}ms)`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            result = {
                suite: suite.name,
                passed: false,
                duration,
                output: '',
                error: errorMessage
            };
            console.log(`   ❌ FAILED (${duration}ms)`);
            console.log(`   Error: ${errorMessage.split('\n')[0]}`);
        }
        this.results.push(result);
        console.log('');
    }
    printSummary() {
        const totalDuration = Date.now() - this.startTime;
        const passedTests = this.results.filter(r => r.passed).length;
        const failedTests = this.results.filter(r => !r.passed).length;
        console.log('📊 Test Summary');
        console.log('='.repeat(60));
        console.log(`Total test suites: ${this.results.length}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Total duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
        console.log('');
        if (failedTests > 0) {
            console.log('❌ Failed Test Suites:');
            this.results
                .filter(r => !r.passed)
                .forEach(result => {
                console.log(`   - ${result.suite}`);
                if (result.error) {
                    console.log(`     Error: ${result.error.split('\n')[0]}`);
                }
            });
            console.log('');
        }
        if (passedTests > 0) {
            console.log('✅ Passed Test Suites:');
            this.results
                .filter(r => r.passed)
                .forEach(result => {
                console.log(`   - ${result.suite} (${result.duration}ms)`);
            });
            console.log('');
        }
        console.log('📈 Coverage Information:');
        console.log('   Run with --coverage flag for detailed coverage report');
        console.log('   Target coverage: >90% statements, >85% branches');
        console.log('');
        if (failedTests > 0) {
            console.log('❌ Some tests failed. Please review the errors above.');
            process.exit(1);
        }
        else {
            console.log('🎉 All tests passed successfully!');
            process.exit(0);
        }
    }
}
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().catch(error => {
        console.error('Fatal error running tests:', error);
        process.exit(1);
    });
}
exports.default = TestRunner;
//# sourceMappingURL=run-comprehensive-tests.js.map