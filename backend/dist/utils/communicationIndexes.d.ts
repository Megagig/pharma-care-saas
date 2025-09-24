import mongoose from 'mongoose';
export interface IndexDefinition {
    collection: string;
    index: Record<string, any>;
    options?: mongoose.IndexOptions;
    description: string;
}
export declare const communicationIndexes: IndexDefinition[];
export declare function createCommunicationIndexes(): Promise<void>;
export declare function dropCommunicationIndexes(): Promise<void>;
export declare function analyzeCommunicationIndexes(): Promise<any>;
export declare function optimizeCommunicationIndexes(): Promise<void>;
export declare function validateIndexPerformance(): Promise<boolean>;
declare const _default: {
    createCommunicationIndexes: typeof createCommunicationIndexes;
    dropCommunicationIndexes: typeof dropCommunicationIndexes;
    analyzeCommunicationIndexes: typeof analyzeCommunicationIndexes;
    optimizeCommunicationIndexes: typeof optimizeCommunicationIndexes;
    validateIndexPerformance: typeof validateIndexPerformance;
    communicationIndexes: IndexDefinition[];
};
export default _default;
//# sourceMappingURL=communicationIndexes.d.ts.map