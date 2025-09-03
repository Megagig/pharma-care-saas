#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const perf_hooks_1 = require("perf_hooks");
class ClinicalInterventionTestRunner {
    constructor() {
        this.results = [];
    }
    async runAllTests() {
        console.log('🧪 Starting Clinical Intervention Test Suite');
        console.log('='.repeat(60));
        const testSuites = [
            {
                name: 'Unit Tests - Models',
                pattern: '__tests__/models/ClinicalIntervention*.test.ts'
            },
            {
                name: 'Unit Tests - Services',
                pattern: '__tests__/services/clinicalInterventionService*.test.ts'
            },
            {
                name: 'Unit Tests - Controllers',
                pattern: '__tests__/controllers/clinicalInterventionController*.test.ts'
            },
            {
                name: 'Unit Tests - Validators',
                pattern: '__tests__/validators/clinicalInterventionValidators*.test.ts'
            },
            {
                name: 'Unit Tests - Middlewares',
                pattern: '__tests__/middlewares/clinicalInterventionErrorHandler*.test.ts'
            },
            {
                name: 'Integration Tests',
                pattern: '__tests__/integration/clinicalInterventionIntegration*.test.ts'
            },
            {
                name: 'Database Tests',
                pattern: '__tests__/database/clinicalInterventionDatabase*.test.ts'
            },
            {
                name: 'Performance Tests',
                pattern: '__tests__/performance/clinicalInterventionPerformance*.test.ts'
            }
        ];
        for (const suite of testSuites) {
            await this.runTestSuite(suite.name, suite.pattern);
        }
        this.generateReport();
    }
    async runTestSuite(suiteName, pattern) {
        console.log(`\n📋 Running ${suiteName}...`);
        const startTime = perf_hooks_1.performance.now();
        const tests = [];
        try {
            const command = `npx jest --testPathPattern="${pattern}" --verbose --coverage=false --silent`;
            const output = (0, child_process_1.execSync)(command, {
                encoding: 'utf8',
                cwd: process.cwd(),
                timeout: 300000
            });
            const testResults = this.parseJestOutput(output);
            tests.push(...testResults);
            console.log(`✅ ${suiteName} completed successfully`);
        }
        catch (error) {
            console.log(`❌ ${suiteName} failed`);
            const failedTests = this.parseJestOutput(error.stdout || error.message);
            tests.push(...failedTests);
        }
        const endTime = perf_hooks_1.performance.now();
        const duration = endTime - startTime;
        const suite = {
            name: suiteName,
            tests,
            totalDuration: duration,
            passedCount: tests.filter(t => t.passed).length,
            failedCount: tests.filter(t => !t.passed).length
        };
        this.results.push(suite);
    }
    parseJestOutput(output) {
        const tests = [];
        const lines = output.split('\n');
        let currentTest = '';
        let testPassed = false;
        let testOutput = '';
        for (const line of lines) {
            if (line.includes('✓') || line.includes('✗')) {
                if (currentTest) {
                    tests.push({
                        name: currentTest,
                        passed: testPassed,
                        duration: 0,
                        output: testOutput
                    });
                }
                currentTest = line.trim();
                testPassed = line.includes('✓');
                testOutput = '';
            }
            else if (currentTest) {
                testOutput += line + '\n';
            }
        }
        if (currentTest) {
            tests.push({
                name: currentTest,
                passed: testPassed,
                duration: 0,
                output: testOutput
            });
        }
        return tests;
    }
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 CLINICAL INTERVENTION TEST REPORT');
        console.log('='.repeat(60));
        let totalTests = 0;
        let totalPassed = 0;
        let totalFailed = 0;
        let totalDuration = 0;
        for (const suite of this.results) {
            console.log(`\n📁 ${suite.name}`);
            console.log(`   Tests: ${suite.tests.length}`);
            console.log(`   Passed: ${suite.passedCount}`);
            console.log(`   Failed: ${suite.failedCount}`);
            console.log(`   Duration: ${(suite.totalDuration / 1000).toFixed(2)}s`);
            if (suite.failedCount > 0) {
                console.log('   ❌ Failed Tests:');
                suite.tests
                    .filter(t => !t.passed)
                    .forEach(test => {
                    console.log(`      - ${test.name}`);
                });
            }
            totalTests += suite.tests.length;
            totalPassed += suite.passedCount;
            totalFailed += suite.failedCount;
            totalDuration += suite.totalDuration;
        }
        console.log('\n' + '-'.repeat(60));
        console.log('📈 OVERALL SUMMARY');
        console.log('-'.repeat(60));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Failed: ${totalFailed} (${((totalFailed / totalTests) * 100).toFixed(1)}%)`);
        console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
        this.generateCoverageSummary();
        this.generateQualityMetrics();
        if (totalFailed > 0) {
            console.log('\n❌ Some tests failed. Please review and fix failing tests.');
            process.exit(1);
        }
        else {
            console.log('\n✅ All tests passed successfully!');
            process.exit(0);
        }
    }
    generateCoverageSummary() {
        console.log('\n📊 COVERAGE SUMMARY');
        console.log('-'.repeat(30));
        try {
            const coverageOutput = (0, child_process_1.execSync)('npx jest --testPathPattern="__tests__.*clinicalIntervention.*" --coverage --coverageReporters=text-summary --silent', { encoding: 'utf8', cwd: process.cwd() });
            const coverageLines = coverageOutput.split('\n');
            const summaryLine = coverageLines.find(line => line.includes('All files'));
            if (summaryLine) {
                console.log(summaryLine);
            }
            else {
                console.log('Coverage data not available');
            }
        }
        catch (error) {
            console.log('Could not generate coverage summary');
        }
    }
    generateQualityMetrics() {
        console.log('\n🎯 QUALITY METRICS');
        console.log('-'.repeat(30));
        const totalTests = this.results.reduce((sum, suite) => sum + suite.tests.length, 0);
        const totalDuration = this.results.reduce((sum, suite) => sum + suite.totalDuration, 0);
        const avgTestDuration = totalDuration / totalTests;
        console.log(`Average Test Duration: ${(avgTestDuration / 1000).toFixed(3)}s`);
        if (avgTestDuration > 5000) {
            console.log('⚠️  Warning: Tests are running slowly (>5s average)');
        }
        else if (avgTestDuration < 100) {
            console.log('🚀 Excellent: Tests are running very fast (<100ms average)');
        }
        else {
            console.log('✅ Good: Test performance is acceptable');
        }
        console.log('\n📊 Test Distribution:');
        this.results.forEach(suite => {
            const percentage = ((suite.tests.length / totalTests) * 100).toFixed(1);
            console.log(`   ${suite.name}: ${suite.tests.length} tests (${percentage}%)`);
        });
    }
    async runSpecificTest(testPattern) {
        console.log(`🧪 Running specific test: ${testPattern}`);
        try {
            const command = `npx jest --testPathPattern="${testPattern}" --verbose`;
            const output = (0, child_process_1.execSync)(command, {
                encoding: 'utf8',
                stdio: 'inherit',
                cwd: process.cwd()
            });
            console.log('✅ Test completed successfully');
        }
        catch (error) {
            console.log('❌ Test failed');
            process.exit(1);
        }
    }
    async runWithWatch() {
        console.log('🔍 Running tests in watch mode...');
        try {
            const command = 'npx jest --testPathPattern="__tests__.*clinicalIntervention.*" --watch';
            (0, child_process_1.execSync)(command, {
                stdio: 'inherit',
                cwd: process.cwd()
            });
        }
        catch (error) {
            console.log('Watch mode interrupted');
        }
    }
}
async function main() {
    const args = process.argv.slice(2);
    const runner = new ClinicalInterventionTestRunner();
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Clinical Intervention Test Runner

Usage:
  npm run test:ci                    # Run all tests
  npm run test:ci -- --watch        # Run in watch mode
  npm run test:ci -- --test <pattern>  # Run specific test pattern

Options:
  --help, -h     Show this help message
  --watch        Run tests in watch mode
  --test         Run specific test pattern

Examples:
  npm run test:ci -- --test "models"
  npm run test:ci -- --test "ClinicalIntervention.test"
  npm run test:ci -- --watch
        `);
        return;
    }
    if (args.includes('--watch')) {
        await runner.runWithWatch();
    }
    else if (args.includes('--test')) {
        const testIndex = args.indexOf('--test');
        const testPattern = args[testIndex + 1];
        if (!testPattern) {
            console.error('❌ Please provide a test pattern after --test');
            process.exit(1);
        }
        await runner.runSpecificTest(testPattern);
    }
    else {
        await runner.runAllTests();
    }
}
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}
exports.default = ClinicalInterventionTestRunner;
//# sourceMappingURL=runClinicalInterventionTests.js.map