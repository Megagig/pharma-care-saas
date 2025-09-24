export interface MigrationResult {
    success: boolean;
    message: string;
    details?: any;
    errors?: string[];
}
export declare function runCommunicationHubMigration(): Promise<MigrationResult>;
export declare function rollbackCommunicationHubMigration(): Promise<MigrationResult>;
export declare function checkCommunicationHubMigrationStatus(): Promise<{
    isComplete: boolean;
    details: any;
}>;
declare const _default: {
    runCommunicationHubMigration: typeof runCommunicationHubMigration;
    rollbackCommunicationHubMigration: typeof rollbackCommunicationHubMigration;
    checkCommunicationHubMigrationStatus: typeof checkCommunicationHubMigrationStatus;
};
export default _default;
//# sourceMappingURL=communicationHubMigration.d.ts.map