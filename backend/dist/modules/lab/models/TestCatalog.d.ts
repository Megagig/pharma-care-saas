import mongoose, { Document } from 'mongoose';
export interface ITestCatalog extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    code: string;
    name: string;
    loincCode?: string;
    category: string;
    specimenType: string;
    unit?: string;
    refRange?: string;
    description?: string;
    estimatedCost?: number;
    turnaroundTime?: string;
    isActive: boolean;
    isCustom: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    updateCost(cost: number, updatedBy: mongoose.Types.ObjectId): Promise<void>;
}
interface ITestCatalogModel extends mongoose.Model<ITestCatalog> {
    findActiveTests(workplaceId: mongoose.Types.ObjectId): mongoose.Query<ITestCatalog[], ITestCatalog>;
    findByCategory(workplaceId: mongoose.Types.ObjectId, category: string): mongoose.Query<ITestCatalog[], ITestCatalog>;
    findBySpecimenType(workplaceId: mongoose.Types.ObjectId, specimenType: string): mongoose.Query<ITestCatalog[], ITestCatalog>;
    searchTests(workplaceId: mongoose.Types.ObjectId, query: string, options?: any): mongoose.Query<ITestCatalog[], ITestCatalog>;
    findByCode(workplaceId: mongoose.Types.ObjectId, code: string): mongoose.Query<ITestCatalog | null, ITestCatalog>;
    getCategories(workplaceId: mongoose.Types.ObjectId): Promise<string[]>;
    getSpecimenTypes(workplaceId: mongoose.Types.ObjectId): Promise<string[]>;
}
declare const _default: ITestCatalogModel;
export default _default;
//# sourceMappingURL=TestCatalog.d.ts.map