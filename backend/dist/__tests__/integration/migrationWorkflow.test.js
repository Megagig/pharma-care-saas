"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const User_1 = __importDefault(require("../../models/User"));
const Workplace_1 = __importDefault(require("../../models/Workplace"));
const Subscription_1 = __importDefault(require("../../models/Subscription"));
const SubscriptionPlan_1 = __importDefault(require("../../models/SubscriptionPlan"));
const Patient_1 = __importDefault(require("../../models/Patient"));
const mongoose_1 = __importDefault(require("mongoose"));
describe('Migration Workflow Integration Tests', () => {
    let legacyUsers;
    let legacyWorkplaces;
    let subscriptionPlans;
    beforeEach(async () => {
        subscriptionPlans = await SubscriptionPlan_1.default.create([
            {
                name: 'Basic Plan',
                code: 'basic',
                tier: 'basic',
                tierRank: 1,
                priceNGN: 15000,
                billingInterval: 'monthly',
                features: ['patient_management', 'basic_reports'],
                limits: {
                    patients: 100,
                    users: 2,
                    locations: 1,
                    storage: 1000,
                    apiCalls: 1000
                },
                isActive: true
            },
            {
                name: 'Premium Plan',
                code: 'premium',
                tier: 'premium',
                tierRank: 2,
                priceNGN: 35000,
                billingInterval: 'monthly',
                features: ['patient_management', 'team_management', 'advanced_reports'],
                limits: {
                    patients: 500,
                    users: 5,
                    locations: 3,
                    storage: 5000,
                    apiCalls: 5000
                },
                isActive: true
            },
            {
                name: 'Trial Plan',
                code: 'trial',
                tier: 'trial',
                tierRank: 0,
                priceNGN: 0,
                billingInterval: 'monthly',
                features: ['patient_management'],
                limits: {
                    patients: 10,
                    users: 1,
                    locations: 1,
                    storage: 100,
                    apiCalls: 100
                },
                isActive: true,
                isTrial: true
            }
        ]);
        legacyWorkplaces = await Workplace_1.default.create([
            {
                name: 'Legacy Pharmacy 1',
                type: 'pharmacy',
                address: '123 Old Street',
                phone: '+234-800-111-1111',
                teamMembers: []
            },
            {
                name: 'Legacy Pharmacy 2',
                type: 'pharmacy',
                address: '456 Old Avenue',
                phone: '+234-800-222-2222',
                teamMembers: []
            }
        ]);
        legacyUsers = await User_1.default.create([
            {
                firstName: 'Legacy',
                lastName: 'Owner1',
                email: 'owner1@legacy.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Owner',
                workplaceId: legacyWorkplaces[0]._id,
                status: 'active',
                licenseNumber: 'PCN111111'
            },
            {
                firstName: 'Legacy',
                lastName: 'Pharmacist1',
                email: 'pharmacist1@legacy.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Pharmacist',
                workplaceId: legacyWorkplaces[0]._id,
                status: 'active',
                licenseNumber: 'PCN111112'
            },
            {
                firstName: 'Legacy',
                lastName: 'Owner2',
                email: 'owner2@legacy.com',
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Owner',
                workplaceId: legacyWorkplaces[1]._id,
                status: 'active',
                licenseNumber: 'PCN222221'
            }
        ]);
        legacyWorkplaces[0].ownerId = legacyUsers[0]._id;
        legacyWorkplaces[0].teamMembers = [legacyUsers[0]._id, legacyUsers[1]._id];
        await legacyWorkplaces[0].save();
        legacyWorkplaces[1].ownerId = legacyUsers[2]._id;
        legacyWorkplaces[1].teamMembers = [legacyUsers[2]._id];
        await legacyWorkplaces[1].save();
        await Patient_1.default.create([
            {
                firstName: 'Patient',
                lastName: 'One',
                mrn: 'MRN001',
                dob: new Date('1980-01-01'),
                phone: '+234-800-001-0001',
                workplaceId: legacyWorkplaces[0]._id
            },
            {
                firstName: 'Patient',
                lastName: 'Two',
                mrn: 'MRN002',
                dob: new Date('1985-05-15'),
                phone: '+234-800-001-0002',
                workplaceId: legacyWorkplaces[0]._id
            },
            {
                firstName: 'Patient',
                lastName: 'Three',
                mrn: 'MRN003',
                dob: new Date('1990-12-25'),
                phone: '+234-800-002-0001',
                workplaceId: legacyWorkplaces[1]._id
            }
        ]);
    });
    describe('Workspace Subscription Migration', () => {
        it('should migrate all workspaces to have subscriptions', async () => {
            const preWorkspaces = await Workplace_1.default.find({});
            expect(preWorkspaces.every(w => !w.subscriptionId)).toBe(true);
            const preSubscriptions = await Subscription_1.default.find({});
            expect(preSubscriptions).toHaveLength(0);
            const migrationResult = (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=trial', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            expect(migrationResult).toContain('Migration completed successfully');
            const postWorkspaces = await Workplace_1.default.find({}).populate('subscriptionId');
            expect(postWorkspaces.every(w => w.subscriptionId)).toBe(true);
            const postSubscriptions = await Subscription_1.default.find({});
            expect(postSubscriptions).toHaveLength(2);
            for (const workspace of postWorkspaces) {
                const subscription = workspace.subscriptionId;
                expect(subscription.workspaceId.toString()).toBe(workspace._id.toString());
                expect(subscription.status).toBe('active');
                expect(subscription.isTrial).toBe(true);
                expect(subscription.trialEndsAt).toBeTruthy();
                const trialDays = Math.ceil((subscription.trialEndsAt.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24));
                expect(trialDays).toBe(14);
            }
        });
        it('should migrate with intelligent plan assignment based on usage', async () => {
            const additionalUsers = await User_1.default.create([
                {
                    firstName: 'User',
                    lastName: 'Three',
                    email: 'user3@legacy.com',
                    password: 'password123',
                    role: 'pharmacist',
                    workplaceRole: 'Pharmacist',
                    workplaceId: legacyWorkplaces[0]._id,
                    status: 'active'
                },
                {
                    firstName: 'User',
                    lastName: 'Four',
                    email: 'user4@legacy.com',
                    password: 'password123',
                    role: 'pharmacist',
                    workplaceRole: 'Technician',
                    workplaceId: legacyWorkplaces[0]._id,
                    status: 'active'
                }
            ]);
            legacyWorkplaces[0].teamMembers.push(...additionalUsers.map(u => u._id));
            await legacyWorkplaces[0].save();
            const additionalPatients = [];
            for (let i = 4; i <= 120; i++) {
                additionalPatients.push({
                    firstName: 'Patient',
                    lastName: `${i}`,
                    mrn: `MRN${i.toString().padStart(3, '0')}`,
                    dob: new Date('1980-01-01'),
                    phone: `+234-800-001-${i.toString().padStart(4, '0')}`,
                    workplaceId: legacyWorkplaces[0]._id
                });
            }
            await Patient_1.default.create(additionalPatients);
            const migrationResult = (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=intelligent --trial-period=30', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            expect(migrationResult).toContain('Migration completed successfully');
            expect(migrationResult).toContain('Intelligent plan assignment completed');
            const workspaces = await Workplace_1.default.find({}).populate({
                path: 'subscriptionId',
                populate: { path: 'planId' }
            });
            const workspace1 = workspaces.find(w => w._id.toString() === legacyWorkplaces[0]._id.toString());
            const workspace2 = workspaces.find(w => w._id.toString() === legacyWorkplaces[1]._id.toString());
            const subscription1 = workspace1.subscriptionId;
            expect(subscription1.planId.code).toBe('premium');
            expect(subscription1.isTrial).toBe(true);
            const subscription2 = workspace2.subscriptionId;
            expect(subscription2.planId.code).toBe('basic');
            expect(subscription2.isTrial).toBe(true);
            const trialDays1 = Math.ceil((subscription1.trialEndsAt.getTime() - subscription1.startDate.getTime()) / (1000 * 60 * 60 * 24));
            expect(trialDays1).toBe(30);
        });
        it('should handle migration rollback correctly', async () => {
            (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=basic', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            const migratedWorkspaces = await Workplace_1.default.find({});
            expect(migratedWorkspaces.every(w => w.subscriptionId)).toBe(true);
            const migratedSubscriptions = await Subscription_1.default.find({});
            expect(migratedSubscriptions).toHaveLength(2);
            const rollbackResult = (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --rollback', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            expect(rollbackResult).toContain('Rollback completed successfully');
            const rolledBackWorkspaces = await Workplace_1.default.find({});
            expect(rolledBackWorkspaces.every(w => !w.subscriptionId)).toBe(true);
            const rolledBackSubscriptions = await Subscription_1.default.find({});
            expect(rolledBackSubscriptions).toHaveLength(0);
        });
        it('should generate comprehensive migration report', async () => {
            const migrationResult = (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=intelligent --generate-report', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            expect(migrationResult).toContain('Migration Report Generated');
            expect(migrationResult).toContain('Total workspaces migrated: 2');
            expect(migrationResult).toContain('Subscriptions created: 2');
            expect(migrationResult).toContain('Plan distribution:');
            expect(migrationResult).toContain('Trial subscriptions: 2');
            expect(migrationResult).toContain('Report saved to:');
        });
    });
    describe('Data Integrity Validation', () => {
        it('should validate data integrity after migration', async () => {
            (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=basic', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            const validationResult = (0, child_process_1.execSync)('npm run validate:migration-integrity', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            expect(validationResult).toContain('Data integrity validation passed');
            expect(validationResult).toContain('All workspaces have valid subscriptions');
            expect(validationResult).toContain('All subscriptions have valid plans');
            expect(validationResult).toContain('All users are properly associated');
            const workspaces = await Workplace_1.default.find({}).populate('subscriptionId');
            const subscriptions = await Subscription_1.default.find({}).populate('planId');
            for (const workspace of workspaces) {
                const subscription = workspace.subscriptionId;
                expect(subscription.workspaceId.toString()).toBe(workspace._id.toString());
            }
            for (const subscription of subscriptions) {
                expect(subscription.planId).toBeTruthy();
                expect(subscription.planId.isActive).toBe(true);
            }
            const users = await User_1.default.find({});
            for (const user of users) {
                const workspace = workspaces.find(w => w._id.toString() === user.workplaceId.toString());
                expect(workspace).toBeTruthy();
                expect(workspace.teamMembers.map(id => id.toString())).toContain(user._id.toString());
            }
        });
        it('should detect and report data inconsistencies', async () => {
            (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=basic', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            const workspace = await Workplace_1.default.findOne({});
            workspace.subscriptionId = new mongoose_1.default.Types.ObjectId();
            await workspace.save();
            try {
                (0, child_process_1.execSync)('npm run validate:migration-integrity', {
                    cwd: process.cwd() + '/backend',
                    encoding: 'utf8',
                    env: { ...process.env, NODE_ENV: 'test' }
                });
                fail('Validation should have failed due to inconsistency');
            }
            catch (error) {
                expect(error.stdout).toContain('Data integrity validation failed');
                expect(error.stdout).toContain('Invalid subscription references found');
                expect(error.stdout).toContain('Orphaned subscriptions found');
            }
        });
    });
    describe('Migration Performance and Scalability', () => {
        it('should handle large dataset migration efficiently', async () => {
            const largeWorkspaces = [];
            const largeUsers = [];
            for (let i = 0; i < 100; i++) {
                const workspace = await Workplace_1.default.create({
                    name: `Large Pharmacy ${i}`,
                    type: 'pharmacy',
                    address: `${i} Large Street`,
                    phone: `+234-800-${i.toString().padStart(3, '0')}-0000`,
                    teamMembers: []
                });
                const owner = await User_1.default.create({
                    firstName: 'Owner',
                    lastName: `${i}`,
                    email: `owner${i}@large.com`,
                    password: 'password123',
                    role: 'pharmacist',
                    workplaceRole: 'Owner',
                    workplaceId: workspace._id,
                    status: 'active',
                    licenseNumber: `PCN${i.toString().padStart(6, '0')}`
                });
                workspace.ownerId = owner._id;
                workspace.teamMembers = [owner._id];
                await workspace.save();
                largeWorkspaces.push(workspace);
                largeUsers.push(owner);
            }
            const startTime = Date.now();
            const migrationResult = (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=basic --batch-size=10', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            const endTime = Date.now();
            const migrationTime = endTime - startTime;
            expect(migrationResult).toContain('Migration completed successfully');
            expect(migrationResult).toContain('Total workspaces migrated: 102');
            expect(migrationTime).toBeLessThan(30000);
            const migratedWorkspaces = await Workplace_1.default.find({});
            expect(migratedWorkspaces.every(w => w.subscriptionId)).toBe(true);
            const subscriptions = await Subscription_1.default.find({});
            expect(subscriptions).toHaveLength(102);
        });
        it('should support incremental migration with resume capability', async () => {
            const newWorkspaces = [];
            for (let i = 0; i < 5; i++) {
                const workspace = await Workplace_1.default.create({
                    name: `New Pharmacy ${i}`,
                    type: 'pharmacy',
                    address: `${i} New Street`,
                    phone: `+234-900-${i.toString().padStart(3, '0')}-0000`,
                    teamMembers: []
                });
                newWorkspaces.push(workspace);
            }
            (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=basic --workspace-filter="Legacy"', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            const partiallyMigrated = await Workplace_1.default.find({ name: /^Legacy/ });
            expect(partiallyMigrated.every(w => w.subscriptionId)).toBe(true);
            const notYetMigrated = await Workplace_1.default.find({ name: /^New/ });
            expect(notYetMigrated.every(w => !w.subscriptionId)).toBe(true);
            const incrementalResult = (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=incremental --default-plan=basic', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            expect(incrementalResult).toContain('Incremental migration completed');
            expect(incrementalResult).toContain('New workspaces migrated: 5');
            const allWorkspaces = await Workplace_1.default.find({});
            expect(allWorkspaces.every(w => w.subscriptionId)).toBe(true);
        });
    });
    describe('Migration Error Handling', () => {
        it('should handle migration errors gracefully and provide recovery options', async () => {
            const invalidWorkspace = await Workplace_1.default.create({
                name: '',
                type: 'invalid_type',
                teamMembers: []
            });
            const migrationResult = (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=basic --continue-on-error', {
                cwd: process.cwd() + '/backend',
                encoding: 'utf8',
                env: { ...process.env, NODE_ENV: 'test' }
            });
            expect(migrationResult).toContain('Migration completed with errors');
            expect(migrationResult).toContain('Successful migrations: 2');
            expect(migrationResult).toContain('Failed migrations: 1');
            expect(migrationResult).toContain('Error details saved to:');
            const validWorkspaces = await Workplace_1.default.find({ name: { $ne: '' } });
            expect(validWorkspaces.every(w => w.subscriptionId)).toBe(true);
            const invalidWorkspaceAfter = await Workplace_1.default.findById(invalidWorkspace._id);
            expect(invalidWorkspaceAfter.subscriptionId).toBeFalsy();
        });
        it('should provide detailed error reporting and recovery suggestions', async () => {
            await Workplace_1.default.create({
                name: 'Duplicate Email Workspace',
                type: 'pharmacy',
                teamMembers: []
            });
            await User_1.default.create({
                firstName: 'Duplicate',
                lastName: 'User',
                email: legacyUsers[0].email,
                password: 'password123',
                role: 'pharmacist',
                workplaceRole: 'Owner',
                workplaceId: legacyWorkplaces[0]._id,
                status: 'active'
            });
            try {
                (0, child_process_1.execSync)('npm run migrate:workspace-subscriptions -- --mode=auto --default-plan=basic --strict-mode', {
                    cwd: process.cwd() + '/backend',
                    encoding: 'utf8',
                    env: { ...process.env, NODE_ENV: 'test' }
                });
                fail('Migration should have failed in strict mode');
            }
            catch (error) {
                expect(error.stdout).toContain('Migration failed in strict mode');
                expect(error.stdout).toContain('Error types encountered:');
                expect(error.stdout).toContain('Recovery suggestions:');
                expect(error.stdout).toContain('Run with --continue-on-error to skip failed records');
                expect(error.stdout).toContain('Use --dry-run to preview migration without changes');
            }
        });
    });
});
//# sourceMappingURL=migrationWorkflow.test.js.map