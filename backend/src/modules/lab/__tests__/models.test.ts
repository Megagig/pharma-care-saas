import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ManualLabOrder, ManualLabResult, TestCatalog } from '../models';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('Manual Lab Models', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        // Only create new connection if not already connected
        if (mongoose.connection.readyState === 0) {
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
        }
    });

    afterAll(async () => {
        // Only disconnect if we created the connection
        if (mongoServer) {
            await mongoose.disconnect();
            await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    describe('ManualLabOrder Model', () => {
        const validOrderData = {
            orderId: 'LAB-2024-0001',
            patientId: new mongoose.Types.ObjectId(),
            workplaceId: new mongoose.Types.ObjectId(),
            orderedBy: new mongoose.Types.ObjectId(),
            tests: [{
                name: 'Complete Blood Count',
                code: 'CBC',
                specimenType: 'Blood',
                unit: 'cells/μL',
                refRange: '4.5-11.0 x10³',
                category: 'Hematology'
            }],
            indication: 'Routine health screening',
            requisitionFormUrl: '/api/manual-lab-orders/LAB-2024-0001/pdf',
            barcodeData: 'eyJvcmRlcklkIjoiTEFCLTIwMjQtMDAwMSJ9',
            consentObtained: true,
            consentObtainedBy: new mongoose.Types.ObjectId(),
            createdBy: new mongoose.Types.ObjectId()
        };

        it('should create a valid manual lab order', async () => {
            const order = new ManualLabOrder(validOrderData);
            const savedOrder = await order.save();

            expect(savedOrder.orderId).toBe('LAB-2024-0001');
            expect(savedOrder.status).toBe('requested');
            expect(savedOrder.tests).toHaveLength(1);
            expect(savedOrder.tests[0]?.name).toBe('Complete Blood Count');
            expect(savedOrder.consentObtained).toBe(true);
        });

        it('should require consent to be true', async () => {
            const orderData = { ...validOrderData, consentObtained: false };
            const order = new ManualLabOrder(orderData);

            await expect(order.save()).rejects.toThrow('Patient consent is required');
        });

        it('should require at least one test', async () => {
            const orderData = { ...validOrderData, tests: [] };
            const order = new ManualLabOrder(orderData);

            await expect(order.save()).rejects.toThrow('At least one test is required');
        });

        it('should update status correctly', async () => {
            const order = new ManualLabOrder(validOrderData);
            const savedOrder = await order.save();

            await savedOrder.updateStatus('sample_collected');
            expect(savedOrder.status).toBe('sample_collected');
        });

        it('should check if order is active', async () => {
            const order = new ManualLabOrder(validOrderData);
            const savedOrder = await order.save();

            expect(savedOrder.isActive()).toBe(true);

            await savedOrder.updateStatus('completed');
            expect(savedOrder.isActive()).toBe(false);
        });

        it('should generate unique order IDs', async () => {
            const workplaceId = new mongoose.Types.ObjectId();

            const orderId1 = await ManualLabOrder.generateNextOrderId(workplaceId);
            const orderId2 = await ManualLabOrder.generateNextOrderId(workplaceId);

            expect(orderId1).toMatch(/^LAB-\d{4}-\d{4}$/);
            expect(orderId2).toMatch(/^LAB-\d{4}-\d{4}$/);
            expect(orderId1).not.toBe(orderId2);
        });
    });

    describe('ManualLabResult Model', () => {
        const validResultData = {
            orderId: 'LAB-2024-0001',
            enteredBy: new mongoose.Types.ObjectId(),
            values: [{
                testCode: 'CBC',
                testName: 'Complete Blood Count',
                numericValue: 7.5,
                unit: 'x10³/μL'
            }],
            createdBy: new mongoose.Types.ObjectId()
        };

        it('should create a valid manual lab result', async () => {
            const result = new ManualLabResult(validResultData);
            const savedResult = await result.save();

            expect(savedResult.orderId).toBe('LAB-2024-0001');
            expect(savedResult.values).toHaveLength(1);
            expect(savedResult.values[0]?.testCode).toBe('CBC');
            expect(savedResult.values[0]?.numericValue).toBe(7.5);
            expect(savedResult.aiProcessed).toBe(false);
        });

        it('should require at least one result value', async () => {
            const resultData = { ...validResultData, values: [] };
            const result = new ManualLabResult(resultData);

            await expect(result.save()).rejects.toThrow('At least one result value is required');
        });

        it('should auto-generate normal interpretation', async () => {
            const result = new ManualLabResult(validResultData);
            const savedResult = await result.save();

            expect(savedResult.interpretation).toHaveLength(1);
            expect(savedResult.interpretation[0]?.testCode).toBe('CBC');
            expect(savedResult.interpretation[0]?.interpretation).toBe('normal');
        });

        it('should add values correctly', async () => {
            const result = new ManualLabResult(validResultData);

            result.addValue('HGB', 'Hemoglobin', 12.5, 'g/dL');

            expect(result.values).toHaveLength(2);
            expect(result.values[1]?.testCode).toBe('HGB');
            expect(result.values[1]?.testName).toBe('Hemoglobin');
            expect(result.values[1]?.numericValue).toBe(12.5);
            expect(result.values[1]?.unit).toBe('g/dL');
        });

        it('should interpret values correctly', async () => {
            const result = new ManualLabResult(validResultData);

            result.interpretValue('CBC', 'high', 'Above normal range');

            expect(result.interpretation[0]?.interpretation).toBe('high');
            expect(result.interpretation[0]?.note).toBe('Above normal range');
            expect(result.values[0]?.abnormalFlag).toBe(true);
        });

        it('should detect abnormal results', async () => {
            const result = new ManualLabResult(validResultData);
            result.interpretValue('CBC', 'critical');

            expect(result.hasAbnormalResults()).toBe(true);
        });

        it('should mark as AI processed', async () => {
            const result = new ManualLabResult(validResultData);
            const savedResult = await result.save();

            const diagnosticResultId = new mongoose.Types.ObjectId();
            await savedResult.markAsAIProcessed(diagnosticResultId);

            expect(savedResult.aiProcessed).toBe(true);
            expect(savedResult.diagnosticResultId).toEqual(diagnosticResultId);
            expect(savedResult.aiProcessedAt).toBeDefined();
        });
    });

    describe('TestCatalog Model', () => {
        const validTestData = {
            workplaceId: new mongoose.Types.ObjectId(),
            code: 'CBC',
            name: 'Complete Blood Count',
            category: 'Hematology',
            specimenType: 'Blood',
            unit: 'cells/μL',
            refRange: '4.5-11.0 x10³',
            estimatedCost: 25.00,
            turnaroundTime: '24 hours',
            createdBy: new mongoose.Types.ObjectId()
        };

        it('should create a valid test catalog entry', async () => {
            const test = new TestCatalog(validTestData);
            const savedTest = await test.save();

            expect(savedTest.code).toBe('CBC');
            expect(savedTest.name).toBe('Complete Blood Count');
            expect(savedTest.category).toBe('Hematology');
            expect(savedTest.isActive).toBe(true);
            expect(savedTest.isCustom).toBe(false);
        });

        it('should enforce unique codes per workplace', async () => {
            const test1 = new TestCatalog(validTestData);
            await test1.save();

            const test2 = new TestCatalog(validTestData);
            await expect(test2.save()).rejects.toThrow();
        });

        it('should allow same code in different workplaces', async () => {
            const test1 = new TestCatalog(validTestData);
            await test1.save();

            const test2 = new TestCatalog({
                ...validTestData,
                workplaceId: new mongoose.Types.ObjectId()
            });

            const savedTest2 = await test2.save();
            expect(savedTest2.code).toBe('CBC');
        });

        it('should activate and deactivate tests', async () => {
            const test = new TestCatalog(validTestData);
            const savedTest = await test.save();

            await savedTest.deactivate();
            expect(savedTest.isActive).toBe(false);

            await savedTest.activate();
            expect(savedTest.isActive).toBe(true);
        });

        it('should update cost correctly', async () => {
            const test = new TestCatalog(validTestData);
            const savedTest = await test.save();
            const updatedBy = new mongoose.Types.ObjectId();

            await savedTest.updateCost(30.00, updatedBy);

            expect(savedTest.estimatedCost).toBe(30.00);
            expect(savedTest.updatedBy).toEqual(updatedBy);
        });

        it('should find active tests', async () => {
            const workplaceId = new mongoose.Types.ObjectId();

            const test1 = new TestCatalog({ ...validTestData, workplaceId, code: 'CBC' });
            const test2 = new TestCatalog({ ...validTestData, workplaceId, code: 'HGB', name: 'Hemoglobin' });
            const test3 = new TestCatalog({ ...validTestData, workplaceId, code: 'GLU', name: 'Glucose', isActive: false });

            await Promise.all([test1.save(), test2.save(), test3.save()]);

            const activeTests = await TestCatalog.findActiveTests(workplaceId);

            expect(activeTests).toHaveLength(2);
            expect(activeTests.map((t: any) => t.code)).toContain('CBC');
            expect(activeTests.map((t: any) => t.code)).toContain('HGB');
            expect(activeTests.map((t: any) => t.code)).not.toContain('GLU');
        });
    });
});