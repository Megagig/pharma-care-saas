export interface IndexCreationResult {
    collection: string;
    indexSpec: Record<string, 1 | -1>;
    created: boolean;
    error?: string;
    executionTime: number;
}
export interface DatabaseOptimizationSummary {
    totalIndexes: number;
    successfulIndexes: number;
    failedIndexes: number;
    results: IndexCreationResult[];
    executionTime: number;
    timestamp: Date;
}
declare class PerformanceDatabaseOptimizer {
    private static instance;
    private constructor();
    static getInstance(): PerformanceDatabaseOptimizer;
    createAllOptimizedIndexes(): Promise<DatabaseOptimizationSummary>;
    private createPatientIndexes;
    private createClinicalNotesIndexes;
    private createMedicationIndexes;
    private createUserIndexes;
    private createWorkspaceIndexes;
    private createAuditLogIndexes;
    private createMTRIndexes;
    private createClinicalInterventionIndexes;
    private createCommunicationIndexes;
    private createNotificationIndexes;
    private createReportsIndexes;
    private createSingleIndex;
    private generateIndexName;
    analyzeExistingIndexes(): Promise<{
        collections: string[];
        totalIndexes: number;
        unusedIndexes: any[];
        recommendations: string[];
    }>;
    dropUnusedIndexes(dryRun?: boolean): Promise<{
        droppedIndexes: string[];
        errors: string[];
    }>;
}
export default PerformanceDatabaseOptimizer;
//# sourceMappingURL=PerformanceDatabaseOptimizer.d.ts.map