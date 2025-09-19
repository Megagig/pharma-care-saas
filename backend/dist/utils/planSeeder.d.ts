export declare class PlanSeeder {
    private planConfigService;
    constructor();
    seedPlans(): Promise<void>;
    private upsertPlan;
    private createNewPlan;
    private updateExistingPlan;
    private mapConfigToPlanModel;
    private mapFeaturesToModel;
    private deactivateObsoletePlans;
    validateConfiguration(): Promise<boolean>;
    getSeedingStats(): Promise<{
        totalPlansInConfig: number;
        totalPlansInDatabase: number;
        activePlansInDatabase: number;
        lastSeededAt?: Date;
    }>;
}
export default PlanSeeder;
//# sourceMappingURL=planSeeder.d.ts.map