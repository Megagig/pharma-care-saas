export interface FieldProjectionOptions {
    include?: string[];
    exclude?: string[];
    maxDepth?: number;
    maxArrayLength?: number;
}
export interface PayloadOptimizationOptions {
    removeNullValues?: boolean;
    removeEmptyArrays?: boolean;
    removeEmptyObjects?: boolean;
    compactArrays?: boolean;
    maxStringLength?: number;
    dateFormat?: 'iso' | 'timestamp' | 'short';
}
export declare class FieldProjection {
    static project<T>(data: T | T[], options?: FieldProjectionOptions): Partial<T> | Partial<T>[];
    private static projectSingle;
    static createMongoProjection(options: FieldProjectionOptions): Record<string, 1 | 0>;
}
export declare class PayloadOptimizer {
    static optimize<T>(data: T, options?: PayloadOptimizationOptions): T;
    private static optimizeValue;
    private static formatDate;
    static calculateReduction(original: any, optimized: any): {
        originalSize: number;
        optimizedSize: number;
        reductionBytes: number;
        reductionPercent: number;
    };
}
export declare const responseOptimizationMiddleware: (projectionOptions?: FieldProjectionOptions, optimizationOptions?: PayloadOptimizationOptions) => (req: any, res: any, next: any) => void;
export declare const OptimizationPresets: {
    mobile: {
        projection: {
            exclude: string[];
            maxArrayLength: number;
            maxDepth: number;
        };
        optimization: {
            removeNullValues: boolean;
            removeEmptyArrays: boolean;
            removeEmptyObjects: boolean;
            maxStringLength: number;
            dateFormat: "timestamp";
        };
    };
    list: {
        projection: {
            include: string[];
            maxArrayLength: number;
        };
        optimization: {
            removeNullValues: boolean;
            removeEmptyArrays: boolean;
            dateFormat: "short";
        };
    };
    detail: {
        projection: {
            exclude: string[];
            maxDepth: number;
        };
        optimization: {
            removeNullValues: boolean;
            removeEmptyArrays: boolean;
            removeEmptyObjects: boolean;
        };
    };
    export: {
        projection: {
            exclude: string[];
            maxDepth: number;
        };
        optimization: {
            removeNullValues: boolean;
            removeEmptyArrays: boolean;
            removeEmptyObjects: boolean;
            dateFormat: "iso";
        };
    };
};
declare const _default: {
    FieldProjection: typeof FieldProjection;
    PayloadOptimizer: typeof PayloadOptimizer;
    responseOptimizationMiddleware: (projectionOptions?: FieldProjectionOptions, optimizationOptions?: PayloadOptimizationOptions) => (req: any, res: any, next: any) => void;
    OptimizationPresets: {
        mobile: {
            projection: {
                exclude: string[];
                maxArrayLength: number;
                maxDepth: number;
            };
            optimization: {
                removeNullValues: boolean;
                removeEmptyArrays: boolean;
                removeEmptyObjects: boolean;
                maxStringLength: number;
                dateFormat: "timestamp";
            };
        };
        list: {
            projection: {
                include: string[];
                maxArrayLength: number;
            };
            optimization: {
                removeNullValues: boolean;
                removeEmptyArrays: boolean;
                dateFormat: "short";
            };
        };
        detail: {
            projection: {
                exclude: string[];
                maxDepth: number;
            };
            optimization: {
                removeNullValues: boolean;
                removeEmptyArrays: boolean;
                removeEmptyObjects: boolean;
            };
        };
        export: {
            projection: {
                exclude: string[];
                maxDepth: number;
            };
            optimization: {
                removeNullValues: boolean;
                removeEmptyArrays: boolean;
                removeEmptyObjects: boolean;
                dateFormat: "iso";
            };
        };
    };
};
export default _default;
//# sourceMappingURL=payloadOptimization.d.ts.map