#!/usr/bin/env ts-node
declare class DiagnosticTestRunner {
    private results;
    private startTime;
    private testSuites;
    runAllTests(): Promise<void>;
    private preflightChecks;
    private runTestSuite;
    private generateReport;
    private generateCoverageReport;
    private generatePerformanceReport;
    private generateSecurityReport;
    private formatDuration;
}
export { DiagnosticTestRunner };
//# sourceMappingURL=runAllTests.d.ts.map