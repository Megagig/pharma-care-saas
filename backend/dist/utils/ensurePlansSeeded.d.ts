export declare function ensurePlansSeeded(): Promise<void>;
export declare function forceReseedPlans(): Promise<void>;
export declare function getPlanSeedingStatus(): Promise<{
    isSeeded: boolean;
    stats: {
        totalPlansInConfig: number;
        totalPlansInDatabase: number;
        activePlansInDatabase: number;
        lastSeededAt?: Date;
    };
    needsSeeding: boolean;
}>;
//# sourceMappingURL=ensurePlansSeeded.d.ts.map