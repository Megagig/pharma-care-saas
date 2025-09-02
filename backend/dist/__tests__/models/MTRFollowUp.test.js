"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MTRFollowUp_1 = __importDefault(require("../../models/MTRFollowUp"));
describe('MTRFollowUp Model', () => {
    let workplaceId;
    let reviewId;
    let patientId;
    let assignedTo;
    let createdBy;
    beforeEach(() => {
        workplaceId = testUtils.createObjectId();
        reviewId = testUtils.createObjectId();
        patientId = testUtils.createObjectId();
        assignedTo = testUtils.createObjectId();
        createdBy = testUtils.createObjectId();
    });
    describe('Model Creation', () => {
        it('should create a valid MTR follow-up', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Follow-up call to assess medication adherence',
                objectives: ['Check adherence', 'Assess side effects'],
                scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            const savedFollowUp = await followUp.save();
            expect(savedFollowUp._id).toBeValidObjectId();
            expect(savedFollowUp.workplaceId).toEqual(workplaceId);
            expect(savedFollowUp.reviewId).toEqual(reviewId);
            expect(savedFollowUp.patientId).toEqual(patientId);
            expect(savedFollowUp.type).toBe('phone_call');
            expect(savedFollowUp.status).toBe('scheduled');
            expect(savedFollowUp.priority).toBe('medium');
            expect(savedFollowUp.estimatedDuration).toBe(30);
        });
        it('should fail validation without required fields', async () => {
            const followUp = new MTRFollowUp_1.default({});
            await expect(followUp.save()).rejects.toThrow();
        });
        it('should validate enum values', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'invalid_type',
                description: 'Test follow-up',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow();
        });
        it('should validate scheduled date is not in the past', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Test follow-up',
                scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow('Scheduled date cannot be in the past');
        });
        it('should validate duration range', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Test follow-up',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                estimatedDuration: 500,
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow();
        });
        it('should require objectives for high priority follow-ups', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'High priority follow-up',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                priority: 'high',
                objectives: [],
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow('High priority follow-ups must have at least one objective');
        });
    });
    describe('Virtual Properties', () => {
        let followUp;
        beforeEach(async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Follow-up call',
                scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            followUp = new MTRFollowUp_1.default(followUpData);
            await followUp.save();
        });
        it('should calculate days until follow-up', () => {
            expect(followUp.daysUntilFollowUp).toBe(3);
        });
        it('should return null for completed follow-ups', () => {
            followUp.status = 'completed';
            expect(followUp.daysUntilFollowUp).toBeNull();
        });
        it('should calculate days since scheduled', () => {
            followUp.scheduledDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
            expect(followUp.daysSinceScheduled).toBeGreaterThanOrEqual(2);
        });
        it('should determine overdue status', () => {
            followUp.scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            expect(followUp.isOverdue()).toBe(false);
            followUp.scheduledDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            expect(followUp.isOverdue()).toBe(true);
            followUp.status = 'completed';
            expect(followUp.isOverdue()).toBe(false);
        });
        it('should determine reminder status', () => {
            followUp.reminders = [];
            expect(followUp.reminderStatus).toBe('none');
            followUp.reminders.push({
                type: 'email',
                scheduledFor: new Date(),
                sent: false
            });
            expect(followUp.reminderStatus).toBe('pending');
            followUp.reminders[0].sent = true;
            expect(followUp.reminderStatus).toBe('all_sent');
            followUp.reminders.push({
                type: 'sms',
                scheduledFor: new Date(),
                sent: false
            });
            expect(followUp.reminderStatus).toBe('partial');
        });
    });
    describe('Instance Methods', () => {
        let followUp;
        beforeEach(async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Follow-up call',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            followUp = new MTRFollowUp_1.default(followUpData);
            await followUp.save();
        });
        it('should determine if follow-up is overdue', () => {
            followUp.scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            expect(followUp.isOverdue()).toBe(false);
            followUp.scheduledDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            expect(followUp.isOverdue()).toBe(true);
            followUp.status = 'completed';
            expect(followUp.isOverdue()).toBe(false);
        });
        it('should determine if follow-up can be rescheduled', () => {
            followUp.status = 'scheduled';
            expect(followUp.canReschedule()).toBe(true);
            followUp.status = 'missed';
            expect(followUp.canReschedule()).toBe(true);
            followUp.status = 'completed';
            expect(followUp.canReschedule()).toBe(false);
            followUp.status = 'cancelled';
            expect(followUp.canReschedule()).toBe(false);
        });
        it('should mark follow-up as completed', () => {
            const outcome = {
                status: 'successful',
                notes: 'Patient is adhering well to medication regimen',
                nextActions: ['Continue current therapy', 'Schedule next review in 3 months'],
                adherenceImproved: true
            };
            followUp.markCompleted(outcome);
            expect(followUp.status).toBe('completed');
            expect(followUp.completedAt).toBeInstanceOf(Date);
            expect(followUp.outcome).toEqual(outcome);
        });
        it('should schedule reminder', () => {
            followUp.reminders = [];
            const reminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            followUp.scheduleReminder('email', reminderDate);
            expect(followUp.reminders).toHaveLength(1);
            expect(followUp.reminders[0].type).toBe('email');
            expect(followUp.reminders[0].scheduledFor).toEqual(reminderDate);
            expect(followUp.reminders[0].sent).toBe(false);
        });
        it('should reschedule follow-up', () => {
            const originalDate = followUp.scheduledDate;
            const newDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const reason = 'Patient requested different time';
            followUp.reschedule(newDate, reason);
            expect(followUp.rescheduledFrom).toEqual(originalDate);
            expect(followUp.scheduledDate).toEqual(newDate);
            expect(followUp.status).toBe('scheduled');
            expect(followUp.rescheduledReason).toBe(reason);
            expect(followUp.reminders.length).toBeGreaterThanOrEqual(0);
        });
        it('should not reschedule if status does not allow it', () => {
            followUp.status = 'completed';
            expect(() => {
                followUp.reschedule(new Date());
            }).toThrow('Follow-up cannot be rescheduled in current status');
        });
        it('should schedule default reminders', () => {
            followUp.scheduleDefaultReminders();
            expect(followUp.reminders.length).toBeGreaterThan(0);
            followUp.reminders.forEach(reminder => {
                expect(reminder.scheduledFor.getTime()).toBeLessThan(followUp.scheduledDate.getTime());
            });
        });
    });
    describe('Pre-save Middleware', () => {
        it('should auto-set completion date when status changes to completed', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Follow-up call',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await followUp.save();
            followUp.status = 'completed';
            followUp.outcome = {
                status: 'successful',
                notes: 'Test outcome',
                nextActions: []
            };
            await followUp.save();
            expect(followUp.completedAt).toBeInstanceOf(Date);
        });
        it('should clear completion date when status changes from completed', async () => {
            const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Follow-up call',
                scheduledDate,
                status: 'completed',
                completedAt: new Date(scheduledDate.getTime() + 60 * 60 * 1000),
                outcome: {
                    status: 'successful',
                    notes: 'Test outcome',
                    nextActions: []
                },
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await followUp.save();
            followUp.status = 'scheduled';
            await followUp.save();
            expect(followUp.completedAt).toBeUndefined();
        });
        it('should require outcome when status is completed', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Follow-up call',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                status: 'completed',
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow('Outcome is required when follow-up is completed');
        });
        it('should schedule default reminders for new follow-ups', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Follow-up call',
                scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await followUp.save();
            expect(followUp.reminders.length).toBeGreaterThan(0);
        });
    });
    describe('Static Methods', () => {
        beforeEach(async () => {
            const followUpData1 = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'First follow-up',
                objectives: ['Check medication adherence'],
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                status: 'scheduled',
                priority: 'high',
                assignedTo,
                createdBy
            };
            const followUpData2 = {
                workplaceId,
                reviewId: testUtils.createObjectId(),
                patientId: testUtils.createObjectId(),
                type: 'appointment',
                description: 'Second follow-up',
                scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
                status: 'scheduled',
                priority: 'medium',
                assignedTo,
                createdBy
            };
            const followUpData3 = {
                workplaceId,
                reviewId: testUtils.createObjectId(),
                patientId: testUtils.createObjectId(),
                type: 'lab_review',
                description: 'Completed follow-up',
                scheduledDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
                status: 'scheduled',
                assignedTo,
                createdBy
            };
            const followUps = await MTRFollowUp_1.default.create([followUpData1, followUpData2, followUpData3]);
            await MTRFollowUp_1.default.updateOne({ _id: followUps[1]._id }, { scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000) }, { runValidators: false });
            const completedDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            await MTRFollowUp_1.default.updateOne({ _id: followUps[2]._id }, {
                scheduledDate: completedDate,
                status: 'completed',
                completedAt: new Date(completedDate.getTime() + 60 * 60 * 1000),
                outcome: {
                    status: 'successful',
                    notes: 'All good',
                    nextActions: []
                }
            }, { runValidators: false });
        });
        it('should find follow-ups by review', async () => {
            const followUps = await MTRFollowUp_1.default.findByReview(reviewId, workplaceId);
            expect(followUps).toHaveLength(1);
            expect(followUps[0].reviewId).toEqual(reviewId);
        });
        it('should find follow-ups by patient', async () => {
            const followUps = await MTRFollowUp_1.default.findByPatient(patientId, workplaceId);
            expect(followUps).toHaveLength(1);
            expect(followUps[0].patientId).toEqual(patientId);
        });
        it('should find scheduled follow-ups', async () => {
            const scheduledFollowUps = await MTRFollowUp_1.default.findScheduled(workplaceId);
            expect(scheduledFollowUps).toHaveLength(2);
            scheduledFollowUps.forEach((followUp) => {
                expect(followUp.status).toBe('scheduled');
            });
        });
        it('should find overdue follow-ups', async () => {
            const overdueFollowUps = await MTRFollowUp_1.default.findOverdue(workplaceId);
            expect(overdueFollowUps).toHaveLength(1);
            expect(overdueFollowUps[0].scheduledDate.getTime()).toBeLessThan(Date.now());
        });
        it('should find follow-ups by assignee', async () => {
            const assignedFollowUps = await MTRFollowUp_1.default.findByAssignee(assignedTo, workplaceId);
            expect(assignedFollowUps).toHaveLength(3);
            assignedFollowUps.forEach((followUp) => {
                expect(followUp.assignedTo).toEqual(assignedTo);
            });
        });
        it('should find pending reminders', async () => {
            await MTRFollowUp_1.default.create({
                workplaceId,
                reviewId: testUtils.createObjectId(),
                patientId: testUtils.createObjectId(),
                type: 'phone_call',
                description: 'Follow-up with reminder',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                reminders: [{
                        type: 'email',
                        scheduledFor: new Date(Date.now() - 60 * 60 * 1000),
                        sent: false
                    }],
                assignedTo,
                createdBy
            });
            const pendingReminders = await MTRFollowUp_1.default.findPendingReminders(workplaceId);
            expect(pendingReminders).toHaveLength(1);
            expect(pendingReminders[0].reminders[0].sent).toBe(false);
        });
        it('should get follow-up statistics', async () => {
            const stats = await MTRFollowUp_1.default.getStatistics(workplaceId);
            expect(stats.totalFollowUps).toBe(3);
            expect(stats.scheduledFollowUps).toBe(2);
            expect(stats.completedFollowUps).toBe(1);
            expect(stats.overdueFollowUps).toBe(1);
            expect(stats.completionRate).toBeCloseTo(33.33, 1);
        });
    });
    describe('Validation Rules', () => {
        it('should validate description length', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'A'.repeat(1001),
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow();
        });
        it('should validate completion date is after scheduled date', async () => {
            const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
            const completedAt = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Test follow-up',
                scheduledDate,
                status: 'completed',
                completedAt,
                outcome: {
                    status: 'successful',
                    notes: 'Test outcome'
                },
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow('Completion date cannot be before scheduled date');
        });
        it('should validate outcome notes length', async () => {
            const followUpData = {
                workplaceId,
                reviewId,
                patientId,
                type: 'phone_call',
                description: 'Test follow-up',
                scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                status: 'completed',
                completedAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
                outcome: {
                    status: 'successful',
                    notes: 'A'.repeat(2001)
                },
                assignedTo,
                createdBy
            };
            const followUp = new MTRFollowUp_1.default(followUpData);
            await expect(followUp.save()).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=MTRFollowUp.test.js.map