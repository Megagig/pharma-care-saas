declare class MTRSecurityAuditor {
    private issues;
    testInputValidation(): Promise<void>;
    private testMaliciousInput;
    testAuthSecurity(): Promise<void>;
    private testPrivilegeEscalation;
    testDataSecurity(): Promise<void>;
    private checkSensitiveDataLogging;
    private checkDataSanitization;
    private checkDataTransmission;
    testCommonVulnerabilities(): Promise<void>;
    private testRateLimiting;
    private testSessionSecurity;
    private testErrorHandling;
    generateSecurityReport(): void;
    private groupIssuesBySeverity;
    private getSeverityIcon;
    runSecurityAudit(): Promise<void>;
}
export default MTRSecurityAuditor;
//# sourceMappingURL=securityAudit.d.ts.map