import mongoose, { Document } from 'mongoose';
export interface IFollowUpReminder {
    type: 'email' | 'sms' | 'push' | 'system';
    scheduledFor: Date;
    sent: boolean;
    sentAt?: Date;
    recipientId?: mongoose.Types.ObjectId;
    message?: string;
}
export interface IFollowUpOutcome {
    status: 'successful' | 'partially_successful' | 'unsuccessful';
    notes: string;
    nextActions: string[];
    nextFollowUpDate?: Date;
    adherenceImproved?: boolean;
    problemsResolved?: string[];
    newProblemsIdentified?: string[];
}
export interface IMTRFollowUp extends Document {
    _id: mongoose.Types.ObjectId;
    workplaceId: mongoose.Types.ObjectId;
    reviewId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    type: 'phone_call' | 'appointment' | 'lab_review' | 'adherence_check' | 'outcome_assessment';
    priority: 'high' | 'medium' | 'low';
    description: string;
    objectives: string[];
    scheduledDate: Date;
    estimatedDuration: number;
    assignedTo: mongoose.Types.ObjectId;
    status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'rescheduled' | 'cancelled';
    completedAt?: Date;
    rescheduledFrom?: Date;
    rescheduledReason?: string;
    reminders: IFollowUpReminder[];
    outcome?: IFollowUpOutcome;
    relatedInterventions: mongoose.Types.ObjectId[];
    appointmentId?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    updatedBy?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    daysUntilFollowUp: number | null;
    daysSinceScheduled: number;
    reminderStatus: string;
    isOverdue(): boolean;
    canReschedule(): boolean;
    markCompleted(outcome: IFollowUpOutcome): void;
    scheduleReminder(type: string, scheduledFor: Date): void;
    scheduleDefaultReminders(): void;
    reschedule(newDate: Date, reason?: string): void;
}
declare const _default: mongoose.Model<IMTRFollowUp, {}, {}, {}, mongoose.Document<unknown, {}, IMTRFollowUp> & IMTRFollowUp & Required<{
    _id: mongoose.Types.ObjectId;
}>, any>;
export default _default;
//# sourceMappingURL=MTRFollowUp.d.ts.map