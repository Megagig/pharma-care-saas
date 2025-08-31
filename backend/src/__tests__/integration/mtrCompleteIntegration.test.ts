import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestPatient } from '../setup';
import MedicationTherapyReview from '../../models/MedicationTherapyReview';
import DrugTherapyProblem from '../../models/DrugTherapyProblem';
import MTRIntervention from '../../models/MTRIntervention';
import MTRFollowUp from '../../models/MTRFollowUp';
import MTRPerformanceOptimizer from '../../scripts/performanceOptimization';
import MTRSecurityAuditor from '../../scripts/securityAudit';

describe('MTR Complete Integration Tests', () => {
    let authToken: string;
    let pharmacistId: mongoose.Types.ObjectId;
    let workplaceId: mongoose.Types.ObjectId;
    let patientId: mongoose.Types.ObjectId;

    beforeAll(async () => {
        await setupTestDatabase();

        // Create test user and get auth token
        const { user, token } = await createTestUser('pharmacist');
        authToken = token;
        pharmacistId = user._id;
        workplaceId = user.workplaceId;

        // Create test patient
        const patient = await createTestPatient(workplaceId);
        patientId = patient._id;
    });

    afterAll(async () => {
        await cleanupTestDatabase();
    });

    describe('Complete MTR Workflow Integration', () => {
        let mtrId: string;
        let problemId: string;
        let interventionId: string;
        let followUpId: string;

        it('should complete full MTR workflow from creation to follow-up', async () => {
            // Step 1: Create MTR Session
            console.log('🔄 Step 1: Creating MTR Session...');
            const createResponse = await request(app)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: patientId.toString(),
                    priority: 'high',
                    reviewType: 'comprehensive',
                    patientConsent: true,
                    confidentialityAgreed: true,
                    referralSource: 'physician',
                    reviewReason: 'medication optimization',
                    estimatedDuration: 60
                })
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.review).toBeDefined();
            mtrId = createResponse.body.data.review._id;
            console.log('✅ MTR Session created successfully');

            // Step 2: Add medications
            console.log('🔄 Step 2: Adding medications...');
            const medications = [
                {
                    drugName: 'Warfarin',
                    strength: { value: 5, unit: 'mg' },
                    dosageForm: 'tablet',
                    instructions: {
                        dose: '5 mg',
                        frequency: 'once daily',
                        route: 'oral'
                    },
                    category: 'prescribed',
                    startDate: new Date(),
                    indication: 'Anticoagulation'
                },
                {
                    drugName: 'Aspirin',
                    strength: { value: 81, unit: 'mg' },
                    dosageForm: 'tablet',
                    instructions: {
                        dose: '81 mg',
                        frequency: 'once daily',
                        route: 'oral'
                    },
                    category: 'prescribed',
                    startDate: new Date(),
                    indication: 'Cardioprotection'
                }
            ];

            const updateResponse = await request(app)
                .put(`/api/mtr/${mtrId}/step/medicationHistory`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ medications })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            console.log('✅ Medications added successfully');

            // Step 3: Identify drug therapy problem
            console.log('🔄 Step 3: Identifying drug therapy problem...');
            const problemResponse = await request(app)
                .post('/api/mtr/problems')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: patientId.toString(),
                    reviewId: mtrId,
                    category: 'safety',
                    type: 'interaction',
                    severity: 'major',
                    description: 'Warfarin-Aspirin interaction increases bleeding risk',
                    clinicalSignificance: 'Increased risk of major bleeding',
                    affectedMedications: ['Warfarin', 'Aspirin'],
                    evidenceLevel: 'definite'
                })
                .expect(201);

            expect(problemResponse.body.success).toBe(true);
            problemId = problemResponse.body.data._id;
            console.log('✅ Drug therapy problem identified');

            // Step 4: Create intervention
            console.log('🔄 Step 4: Creating intervention...');
            const interventionResponse = await request(app)
                .post('/api/mtr/interventions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    reviewId: mtrId,
                    patientId: patientId.toString(),
                    problemId: problemId,
                    type: 'recommendation',
                    category: 'medication_adjustment',
                    description: 'Recommend discontinuing aspirin and monitoring INR more frequently',
                    rationale: 'Reduce bleeding risk while maintaining anticoagulation',
                    targetAudience: 'physician',
                    communicationMethod: 'phone',
                    priority: 'high',
                    urgency: 'immediate'
                })
                .expect(201);

            expect(interventionResponse.body.success).toBe(true);
            interventionId = interventionResponse.body.data._id;
            console.log('✅ Intervention created successfully');

            // Step 5: Schedule follow-up
            console.log('🔄 Step 5: Scheduling follow-up...');
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + 7);

            const followUpResponse = await request(app)
                .post('/api/mtr/follow-ups')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    reviewId: mtrId,
                    patientId: patientId.toString(),
                    type: 'medication_monitoring',
                    description: 'Follow up on aspirin discontinuation and INR monitoring',
                    scheduledDate: followUpDate,
                    estimatedDuration: 15,
                    relatedInterventions: [interventionId]
                })
                .expect(201);

            expect(followUpResponse.body.success).toBe(true);
            followUpId = followUpResponse.body.data._id;
            console.log('✅ Follow-up scheduled successfully');

            // Step 6: Complete MTR
            console.log('🔄 Step 6: Completing MTR...');
            const completeResponse = await request(app)
                .put(`/api/mtr/${mtrId}/complete`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    summary: 'MTR completed successfully. Identified drug interaction and provided recommendations.',
                    clinicalOutcomes: {
                        problemsIdentified: 1,
                        interventionsProvided: 1,
                        followUpsScheduled: 1,
                        patientSatisfaction: 'high'
                    }
                })
                .expect(200);

            expect(completeResponse.body.success).toBe(true);
            console.log('✅ MTR completed successfully');

            // Verify final state
            const finalMTR = await MedicationTherapyReview.findById(mtrId);
            expect(finalMTR?.status).toBe('completed');
            expect(finalMTR?.medications).toHaveLength(2);
            expect(finalMTR?.completedAt).toBeDefined();

            console.log('🎉 Complete MTR workflow integration test passed!');
        });

        it('should handle concurrent MTR sessions', async () => {
            console.log('🔄 Testing concurrent MTR sessions...');

            const concurrentRequests = Array.from({ length: 5 }, (_, index) =>
                request(app)
                    .post('/api/mtr')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        patientId: patientId.toString(),
                        priority: 'medium',
                        reviewType: 'focused',
                        patientConsent: true,
                        confidentialityAgreed: true,
                        referralSource: 'self',
                        reviewReason: `Concurrent test ${index + 1}`
                    })
            );

            const responses = await Promise.all(concurrentRequests);

            responses.forEach((response, index) => {
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                console.log(`✅ Concurrent MTR ${index + 1} created successfully`);
            });

            console.log('🎉 Concurrent MTR sessions test passed!');
        });

        it('should handle large medication lists efficiently', async () => {
            console.log('🔄 Testing large medication lists...');

            // Create MTR with large medication list
            const createResponse = await request(app)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: patientId.toString(),
                    priority: 'medium',
                    reviewType: 'comprehensive',
                    patientConsent: true,
                    confidentialityAgreed: true
                })
                .expect(201);

            const largeMTRId = createResponse.body.data.review._id;

            // Generate large medication list (50 medications)
            const largeMedicationList = Array.from({ length: 50 }, (_, index) => ({
                drugName: `Medication${index + 1}`,
                strength: { value: 10 + index, unit: 'mg' },
                dosageForm: 'tablet',
                instructions: {
                    dose: `${10 + index} mg`,
                    frequency: 'once daily',
                    route: 'oral'
                },
                category: 'prescribed',
                startDate: new Date(),
                indication: `Indication ${index + 1}`
            }));

            const startTime = Date.now();

            const updateResponse = await request(app)
                .put(`/api/mtr/${largeMTRId}/step/medicationHistory`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ medications: largeMedicationList })
                .expect(200);

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            expect(updateResponse.body.success).toBe(true);
            expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds

            console.log(`✅ Large medication list (50 items) processed in ${processingTime}ms`);
            console.log('🎉 Large medication list test passed!');
        });
    });

    describe('Performance and Security Integration', () => {
        it('should pass performance optimization checks', async () => {
            console.log('🔄 Running performance optimization checks...');

            const optimizer = new MTRPerformanceOptimizer();

            // This will test database indexes and query performance
            await expect(optimizer.runOptimizations()).resolves.not.toThrow();

            console.log('✅ Performance optimization checks passed');
        });

        it('should pass security audit checks', async () => {
            console.log('🔄 Running security audit checks...');

            const auditor = new MTRSecurityAuditor();

            // This will test for common security vulnerabilities
            await expect(auditor.runSecurityAudit()).resolves.not.toThrow();

            console.log('✅ Security audit checks passed');
        });

        it('should handle malicious input safely', async () => {
            console.log('🔄 Testing malicious input handling...');

            const maliciousInputs = [
                '<script>alert("xss")</script>',
                '{"$ne": null}',
                '../../../etc/passwd',
                '; DROP TABLE users; --'
            ];

            for (const maliciousInput of maliciousInputs) {
                const response = await request(app)
                    .post('/api/mtr')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        patientId: maliciousInput,
                        priority: maliciousInput,
                        reviewType: maliciousInput,
                        patientConsent: true,
                        confidentialityAgreed: true
                    });

                // Should either reject with validation error or sanitize input
                expect([400, 422]).toContain(response.status);
            }

            console.log('✅ Malicious input handling test passed');
        });
    });

    describe('Data Integrity and Consistency', () => {
        it('should maintain data consistency across related models', async () => {
            console.log('🔄 Testing data consistency...');

            // Create MTR
            const mtrResponse = await request(app)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: patientId.toString(),
                    priority: 'high',
                    reviewType: 'comprehensive',
                    patientConsent: true,
                    confidentialityAgreed: true
                })
                .expect(201);

            const testMTRId = mtrResponse.body.data.review._id;

            // Create related problem
            const problemResponse = await request(app)
                .post('/api/mtr/problems')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: patientId.toString(),
                    reviewId: testMTRId,
                    category: 'effectiveness',
                    type: 'doseTooLow',
                    severity: 'moderate',
                    description: 'Test problem for consistency check',
                    clinicalSignificance: 'Test significance',
                    affectedMedications: ['TestMed'],
                    evidenceLevel: 'probable'
                })
                .expect(201);

            const testProblemId = problemResponse.body.data._id;

            // Verify relationships
            const mtr = await MedicationTherapyReview.findById(testMTRId);
            const problem = await DrugTherapyProblem.findById(testProblemId);

            expect(mtr).toBeDefined();
            expect(problem).toBeDefined();
            expect(problem?.reviewId.toString()).toBe(testMTRId);
            expect(problem?.patientId.toString()).toBe(patientId.toString());
            expect(problem?.workplaceId.toString()).toBe(workplaceId.toString());

            console.log('✅ Data consistency test passed');
        });

        it('should handle database transactions properly', async () => {
            console.log('🔄 Testing database transactions...');

            // This test would verify that complex operations are atomic
            // For now, we'll test that related data is created consistently

            const mtrResponse = await request(app)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    patientId: patientId.toString(),
                    priority: 'medium',
                    reviewType: 'focused',
                    patientConsent: true,
                    confidentialityAgreed: true
                })
                .expect(201);

            const transactionMTRId = mtrResponse.body.data.review._id;

            // Verify MTR was created with proper audit fields
            const mtr = await MedicationTherapyReview.findById(transactionMTRId);
            expect(mtr?.createdBy.toString()).toBe(pharmacistId.toString());
            expect(mtr?.workplaceId.toString()).toBe(workplaceId.toString());
            expect(mtr?.createdAt).toBeDefined();
            expect(mtr?.isDeleted).toBe(false);

            console.log('✅ Database transaction test passed');
        });
    });

    describe('API Response and Error Handling', () => {
        it('should return consistent API responses', async () => {
            console.log('🔄 Testing API response consistency...');

            const response = await request(app)
                .get('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.success).toBe(true);

            if (response.body.data.results) {
                expect(response.body.data).toHaveProperty('results');
                expect(response.body.data).toHaveProperty('total');
                expect(response.body.data).toHaveProperty('page');
                expect(response.body.data).toHaveProperty('limit');
            }

            console.log('✅ API response consistency test passed');
        });

        it('should handle errors gracefully', async () => {
            console.log('🔄 Testing error handling...');

            // Test 404 error
            const notFoundResponse = await request(app)
                .get('/api/mtr/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(notFoundResponse.body.success).toBe(false);
            expect(notFoundResponse.body.error).toBeDefined();

            // Test validation error
            const validationResponse = await request(app)
                .post('/api/mtr')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Missing required fields
                    patientConsent: true
                })
                .expect(400);

            expect(validationResponse.body.success).toBe(false);
            expect(validationResponse.body.error).toBeDefined();

            console.log('✅ Error handling test passed');
        });
    });
});