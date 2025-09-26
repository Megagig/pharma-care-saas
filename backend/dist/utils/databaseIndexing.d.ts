interface IndexDefinition {
    fields: Record<string, 1 | -1 | 'text' | '2dsphere'>;
    options?: {
        name?: string;
        unique?: boolean;
        sparse?: boolean;
        background?: boolean;
        partialFilterExpression?: any;
        expireAfterSeconds?: number;
    };
}
interface IndexRecommendation {
    collection: string;
    index: IndexDefinition;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
}
export declare class DatabaseIndexingService {
    private static instance;
    private indexRecommendations;
    static getInstance(): DatabaseIndexingService;
    createReportIndexes(): Promise<void>;
    private createMTRIndexes;
    private createInterventionIndexes;
    private createProblemIndexes;
    private createMedicationIndexes;
    private createAuditIndexes;
    private createTemplateIndexes;
    private createScheduleIndexes;
    private createIndexes;
    private generateIndexName;
    private compareIndexFields;
    analyzeQueryPerformance(): Promise<IndexRecommendation[]>;
    private getSlowQueries;
    private generateIndexRecommendation;
    getIndexRecommendations(): IndexRecommendation[];
    dropUnusedIndexes(): Promise<void>;
    getIndexStats(): Promise<any[]>;
}
declare const _default: DatabaseIndexingService;
export default _default;
//# sourceMappingURL=databaseIndexing.d.ts.map