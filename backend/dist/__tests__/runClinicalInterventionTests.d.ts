#!/usr/bin/env ts-node
declare class ClinicalInterventionTestRunner {
    private results;
    runAllTests(): Promise<void>;
    private runTestSuite;
    private parseJestOutput;
    private generateReport;
    private generateCoverageSummary;
    private generateQualityMetrics;
    runSpecificTest(testPattern: string): Promise<void>;
    runWithWatch(): Promise<void>;
}
export default ClinicalInterventionTestRunner;
//# sourceMappingURL=runClinicalInterventionTests.d.ts.map