#!/usr/bin/env ts-node
declare class TestRunner {
    private results;
    private startTime;
    constructor();
    runAllTests(): Promise<void>;
    private runTestSuite;
    private printSummary;
}
export default TestRunner;
//# sourceMappingURL=run-comprehensive-tests.d.ts.map