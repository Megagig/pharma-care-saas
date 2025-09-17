#!/usr/bin/env ts-node
declare class DiagnosticEndToEndTest {
    private results;
    private authToken;
    private testPatientId;
    runAllTests(): Promise<void>;
    private connectToDatabase;
    private setupTestData;
    private testFeatureFlags;
    private testAIConnection;
    private testDiagnosticSubmission;
    private testDrugInteractions;
    private testCaseRetrieval;
    private addResult;
    private printResults;
}
export default DiagnosticEndToEndTest;
//# sourceMappingURL=testDiagnosticEndToEnd.d.ts.map