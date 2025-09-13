"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManualLabIndexes = createManualLabIndexes;
exports.seedDefaultTestCatalog = seedDefaultTestCatalog;
exports.runManualLabMigrations = runManualLabMigrations;
exports.dropManualLabIndexes = dropManualLabIndexes;
const models_1 = require("../models");
async function createManualLabIndexes() {
    try {
        console.log('Creating manual lab indexes...');
        await models_1.ManualLabOrder.collection.createIndex({ workplaceId: 1, orderId: 1 }, { unique: true, name: 'workplace_order_unique' });
        await models_1.ManualLabOrder.collection.createIndex({ workplaceId: 1, patientId: 1, createdAt: -1 }, { name: 'workplace_patient_date' });
        await models_1.ManualLabOrder.collection.createIndex({ workplaceId: 1, status: 1, createdAt: -1 }, { name: 'workplace_status_date' });
        await models_1.ManualLabOrder.collection.createIndex({ barcodeData: 1 }, { unique: true, name: 'barcode_unique' });
        await models_1.ManualLabResult.collection.createIndex({ orderId: 1 }, { unique: true, name: 'order_result_unique' });
        await models_1.ManualLabResult.collection.createIndex({ enteredBy: 1, enteredAt: -1 }, { name: 'entered_by_date' });
        await models_1.ManualLabResult.collection.createIndex({ aiProcessed: 1, enteredAt: -1 }, { name: 'ai_processed_date' });
        await models_1.TestCatalog.collection.createIndex({ workplaceId: 1, code: 1 }, { unique: true, name: 'workplace_test_code_unique' });
        await models_1.TestCatalog.collection.createIndex({ workplaceId: 1, category: 1, isActive: 1 }, { name: 'workplace_category_active' });
        await models_1.TestCatalog.collection.createIndex({ workplaceId: 1, isActive: 1, isCustom: 1 }, { name: 'workplace_active_custom' });
        console.log('Manual lab indexes created successfully');
        return {
            success: true,
            message: 'Manual lab indexes created successfully'
        };
    }
    catch (error) {
        console.error('Error creating manual lab indexes:', error);
        return {
            success: false,
            message: 'Failed to create manual lab indexes',
            details: error
        };
    }
}
async function seedDefaultTestCatalog(workplaceId, createdBy) {
    try {
        console.log('Seeding default test catalog...');
        const defaultTests = [
            {
                code: 'CBC',
                name: 'Complete Blood Count',
                category: 'Hematology',
                specimenType: 'Blood',
                unit: 'cells/μL',
                refRange: '4.5-11.0 x10³',
                description: 'Complete blood count with differential',
                estimatedCost: 25.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'HGB',
                name: 'Hemoglobin',
                category: 'Hematology',
                specimenType: 'Blood',
                unit: 'g/dL',
                refRange: 'M: 13.8-17.2, F: 12.1-15.1',
                description: 'Hemoglobin concentration',
                estimatedCost: 15.00,
                turnaroundTime: '1-2 hours'
            },
            {
                code: 'HCT',
                name: 'Hematocrit',
                category: 'Hematology',
                specimenType: 'Blood',
                unit: '%',
                refRange: 'M: 40.7-50.3, F: 36.1-44.3',
                description: 'Hematocrit percentage',
                estimatedCost: 15.00,
                turnaroundTime: '1-2 hours'
            },
            {
                code: 'GLU',
                name: 'Glucose',
                category: 'Chemistry',
                specimenType: 'Blood',
                unit: 'mg/dL',
                refRange: '70-100 (fasting)',
                description: 'Blood glucose level',
                estimatedCost: 20.00,
                turnaroundTime: '1-2 hours'
            },
            {
                code: 'CREAT',
                name: 'Creatinine',
                category: 'Chemistry',
                specimenType: 'Blood',
                unit: 'mg/dL',
                refRange: 'M: 0.74-1.35, F: 0.59-1.04',
                description: 'Serum creatinine',
                estimatedCost: 18.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'BUN',
                name: 'Blood Urea Nitrogen',
                category: 'Chemistry',
                specimenType: 'Blood',
                unit: 'mg/dL',
                refRange: '6-24',
                description: 'Blood urea nitrogen',
                estimatedCost: 18.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'CHOL',
                name: 'Total Cholesterol',
                category: 'Lipids',
                specimenType: 'Blood',
                unit: 'mg/dL',
                refRange: '<200 desirable',
                description: 'Total cholesterol',
                estimatedCost: 22.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'HDL',
                name: 'HDL Cholesterol',
                category: 'Lipids',
                specimenType: 'Blood',
                unit: 'mg/dL',
                refRange: 'M: >40, F: >50',
                description: 'High-density lipoprotein cholesterol',
                estimatedCost: 22.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'LDL',
                name: 'LDL Cholesterol',
                category: 'Lipids',
                specimenType: 'Blood',
                unit: 'mg/dL',
                refRange: '<100 optimal',
                description: 'Low-density lipoprotein cholesterol',
                estimatedCost: 22.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'ALT',
                name: 'Alanine Aminotransferase',
                category: 'Liver Function',
                specimenType: 'Blood',
                unit: 'U/L',
                refRange: 'M: 10-40, F: 7-35',
                description: 'Alanine aminotransferase',
                estimatedCost: 20.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'AST',
                name: 'Aspartate Aminotransferase',
                category: 'Liver Function',
                specimenType: 'Blood',
                unit: 'U/L',
                refRange: 'M: 10-40, F: 9-32',
                description: 'Aspartate aminotransferase',
                estimatedCost: 20.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'UA',
                name: 'Urinalysis',
                category: 'Urinalysis',
                specimenType: 'Urine',
                description: 'Complete urinalysis with microscopy',
                estimatedCost: 30.00,
                turnaroundTime: '2-4 hours'
            },
            {
                code: 'TSH',
                name: 'Thyroid Stimulating Hormone',
                category: 'Endocrinology',
                specimenType: 'Blood',
                unit: 'mIU/L',
                refRange: '0.27-4.20',
                description: 'Thyroid stimulating hormone',
                estimatedCost: 35.00,
                turnaroundTime: '4-6 hours'
            }
        ];
        const existingCount = await models_1.TestCatalog.countDocuments({ workplaceId, isCustom: false });
        if (existingCount > 0) {
            return {
                success: true,
                message: `Default test catalog already exists (${existingCount} tests)`
            };
        }
        const testDocuments = defaultTests.map(test => ({
            ...test,
            workplaceId,
            createdBy,
            isActive: true,
            isCustom: false
        }));
        await models_1.TestCatalog.insertMany(testDocuments);
        console.log(`Seeded ${defaultTests.length} default test catalog entries`);
        return {
            success: true,
            message: `Seeded ${defaultTests.length} default test catalog entries`
        };
    }
    catch (error) {
        console.error('Error seeding default test catalog:', error);
        return {
            success: false,
            message: 'Failed to seed default test catalog',
            details: error
        };
    }
}
async function runManualLabMigrations(workplaceId, createdBy) {
    const results = [];
    const indexResult = await createManualLabIndexes();
    results.push(indexResult);
    if (workplaceId && createdBy) {
        const seedResult = await seedDefaultTestCatalog(workplaceId, createdBy);
        results.push(seedResult);
    }
    return results;
}
async function dropManualLabIndexes() {
    try {
        console.log('Dropping manual lab indexes...');
        try {
            await models_1.ManualLabOrder.collection.dropIndex('workplace_order_unique');
            await models_1.ManualLabOrder.collection.dropIndex('workplace_patient_date');
            await models_1.ManualLabOrder.collection.dropIndex('workplace_status_date');
            await models_1.ManualLabOrder.collection.dropIndex('barcode_unique');
        }
        catch (error) {
        }
        try {
            await models_1.ManualLabResult.collection.dropIndex('order_result_unique');
            await models_1.ManualLabResult.collection.dropIndex('entered_by_date');
            await models_1.ManualLabResult.collection.dropIndex('ai_processed_date');
        }
        catch (error) {
        }
        try {
            await models_1.TestCatalog.collection.dropIndex('workplace_test_code_unique');
            await models_1.TestCatalog.collection.dropIndex('workplace_category_active');
            await models_1.TestCatalog.collection.dropIndex('workplace_active_custom');
        }
        catch (error) {
        }
        console.log('Manual lab indexes dropped successfully');
        return {
            success: true,
            message: 'Manual lab indexes dropped successfully'
        };
    }
    catch (error) {
        console.error('Error dropping manual lab indexes:', error);
        return {
            success: false,
            message: 'Failed to drop manual lab indexes',
            details: error
        };
    }
}
//# sourceMappingURL=manualLabMigrations.js.map