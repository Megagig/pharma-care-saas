/**
 * Business Logic Validation Utilities for Appointments
 * Provides reusable validation functions for appointment services
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2
 */

import mongoose from 'mongoose';
import Appointment, { IAppointment } from '../models/Appointment';
import FollowUpTask, { IFollowUpTask } from '../models/FollowUpTask';
import PharmacistSchedule from '../models/PharmacistSchedule';
import Patient from '../models/Patient';
import User from '../models/User';
import {
    ValidationError,
    ConflictError,
    AppointmentBusinessLogicError,
    AppointmentNotFoundError,
    createValidationError,
    createConflictError,
    createAppointmentBusinessLogicError
} from './appointmentErrors';
import logger from './logger';

/**
 * Validate appointment date and time
 */
export const validateAppointmentDateTime = (
    scheduledDate: Date,
    scheduledTime: string
): void => {
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(scheduledDate);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
        throw createValidationError(
            'scheduledDate',
            'Appointment date cannot be in the past',
            scheduledDate
        );
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduledTime)) {
        throw createValidationError(
            'scheduledTime',
            'Invalid time format. Expected HH:mm',
            scheduledTime
        );
    }

    // Check if time is within working hours (8 AM - 6 PM)
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    if (hours < 8 || hours >= 18) {
        throw createAppointmentBusinessLogicError(
            'Appointments must be scheduled during working hours (8 AM - 6 PM)',
            'OUTSIDE_WORKING_HOURS'
        );
    }
};

/**
 * Validate appointment duration
 */
export const validateAppointmentDuration = (
    duration: number,
    appointmentType: IAppointment['type']
): void => {
    if (duration < 5 || duration > 120) {
        throw createValidationError(
            'duration',
            'Duration must be between 5 and 120 minutes',
            duration
        );
    }

    // Validate duration based on appointment type
    const minDurations: Record<string, number> = {
        mtm_session: 30,
        chronic_disease_review: 20,
        new_medication_consultation: 15,
        vaccination: 10,
        health_check: 15,
        smoking_cessation: 30,
        general_followup: 10
    };

    const minDuration = minDurations[appointmentType] || 10;
    if (duration < minDuration) {
        throw createAppointmentBusinessLogicError(
            `${appointmentType} appointments require at least ${minDuration} minutes`,
            'INSUFFICIENT_DURATION'
        );
    }
};

/**
 * Check for appointment conflicts
 */
export const checkAppointmentConflict = async (
    pharmacistId: mongoose.Types.ObjectId,
    scheduledDate: Date,
    scheduledTime: string,
    duration: number,
    excludeAppointmentId?: mongoose.Types.ObjectId
): Promise<void> => {
    const conflictCheck = await Appointment.checkConflict(
        pharmacistId,
        scheduledDate,
        scheduledTime,
        duration,
        excludeAppointmentId
    );

    if (conflictCheck.hasConflict) {
        const conflictingAppointment = conflictCheck.conflictingAppointment;
        throw createConflictError(
            'Pharmacist already has an appointment at this time',
            [{
                field: 'scheduledTime',
                message: `Conflicts with appointment: ${conflictingAppointment?.title || 'Untitled'}`,
                value: scheduledTime,
                code: 'PHARMACIST_CONFLICT'
            }]
        );
    }
};

/**
 * Check for patient appointment conflicts
 */
export const checkPatientConflict = async (
    patientId: mongoose.Types.ObjectId,
    scheduledDate: Date,
    scheduledTime: string,
    duration: number,
    workplaceId: mongoose.Types.ObjectId,
    excludeAppointmentId?: mongoose.Types.ObjectId
): Promise<void> => {
    // Calculate appointment end time
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;

    // Find overlapping appointments for the patient
    const overlappingAppointments = await Appointment.find({
        workplaceId,
        patientId,
        scheduledDate: {
            $gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
            $lt: new Date(scheduledDate.setHours(23, 59, 59, 999))
        },
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
        isDeleted: false,
        ...(excludeAppointmentId && { _id: { $ne: excludeAppointmentId } })
    });

    for (const appointment of overlappingAppointments) {
        const [apptHours, apptMinutes] = appointment.scheduledTime.split(':').map(Number);
        const apptStartMinutes = apptHours * 60 + apptMinutes;
        const apptEndMinutes = apptStartMinutes + appointment.duration;

        // Check for overlap
        if (
            (startMinutes >= apptStartMinutes && startMinutes < apptEndMinutes) ||
            (endMinutes > apptStartMinutes && endMinutes <= apptEndMinutes) ||
            (startMinutes <= apptStartMinutes && endMinutes >= apptEndMinutes)
        ) {
            throw createConflictError(
                'Patient already has an appointment at this time',
                [{
                    field: 'patientId',
                    message: `Patient has overlapping appointment: ${appointment.title || 'Untitled'}`,
                    value: patientId.toString(),
                    code: 'PATIENT_CONFLICT'
                }]
            );
        }
    }
};

/**
 * Validate pharmacist availability
 */
export const validatePharmacistAvailability = async (
    pharmacistId: mongoose.Types.ObjectId,
    scheduledDate: Date,
    appointmentType: IAppointment['type'],
    workplaceId: mongoose.Types.ObjectId
): Promise<void> => {
    // Check if pharmacist schedule exists
    const schedule = await PharmacistSchedule.findCurrentSchedule(pharmacistId, workplaceId);

    if (!schedule) {
        logger.warn('No schedule found for pharmacist', {
            pharmacistId: pharmacistId.toString(),
            workplaceId: workplaceId.toString()
        });
        return; // Allow appointment if no schedule is configured
    }

    // Check if pharmacist is working on this date
    const isWorking = schedule.isWorkingOn(scheduledDate);
    if (!isWorking) {
        throw createAppointmentBusinessLogicError(
            'Pharmacist is not working on this date',
            'PHARMACIST_NOT_WORKING'
        );
    }

    // Check if pharmacist can handle this appointment type
    if (!schedule.canHandleAppointmentType(appointmentType)) {
        throw createAppointmentBusinessLogicError(
            `Pharmacist is not configured to handle ${appointmentType} appointments`,
            'APPOINTMENT_TYPE_NOT_SUPPORTED'
        );
    }

    // Check if pharmacist has reached maximum appointments for the day
    const dayOfWeek = scheduledDate.getDay();
    const workingHours = schedule.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);

    if (workingHours && schedule.appointmentPreferences.maxAppointmentsPerDay) {
        const appointmentCount = await Appointment.countDocuments({
            workplaceId,
            assignedTo: pharmacistId,
            scheduledDate: {
                $gte: new Date(scheduledDate.setHours(0, 0, 0, 0)),
                $lt: new Date(scheduledDate.setHours(23, 59, 59, 999))
            },
            status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
            isDeleted: false
        });

        if (appointmentCount >= schedule.appointmentPreferences.maxAppointmentsPerDay) {
            throw createAppointmentBusinessLogicError(
                'Pharmacist has reached maximum appointments for this day',
                'MAX_APPOINTMENTS_REACHED'
            );
        }
    }
};

/**
 * Validate patient exists and belongs to workplace
 */
export const validatePatient = async (
    patientId: mongoose.Types.ObjectId,
    workplaceId: mongoose.Types.ObjectId
): Promise<void> => {
    const patient = await Patient.findOne({
        _id: patientId,
        workplaceId,
        isDeleted: false
    });

    if (!patient) {
        throw new AppointmentNotFoundError(
            'Patient not found or does not belong to your workplace',
            'Patient',
            patientId.toString()
        );
    }
};

/**
 * Validate pharmacist exists and belongs to workplace
 */
export const validatePharmacist = async (
    pharmacistId: mongoose.Types.ObjectId,
    workplaceId: mongoose.Types.ObjectId
): Promise<void> => {
    const pharmacist = await User.findOne({
        _id: pharmacistId,
        workplaceId,
        isDeleted: false
    });

    if (!pharmacist) {
        throw new AppointmentNotFoundError(
            'Pharmacist not found or does not belong to your workplace',
            'Pharmacist',
            pharmacistId.toString()
        );
    }
};

/**
 * Validate appointment status transition
 */
export const validateStatusTransition = (
    currentStatus: IAppointment['status'],
    newStatus: IAppointment['status']
): void => {
    const validTransitions: Record<string, string[]> = {
        scheduled: ['confirmed', 'in_progress', 'cancelled', 'rescheduled', 'no_show'],
        confirmed: ['in_progress', 'completed', 'cancelled', 'no_show'],
        in_progress: ['completed', 'cancelled'],
        completed: [], // Cannot transition from completed
        cancelled: [], // Cannot transition from cancelled
        no_show: [], // Cannot transition from no_show
        rescheduled: [] // Cannot transition from rescheduled (new appointment created)
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
        throw createAppointmentBusinessLogicError(
            `Cannot transition from ${currentStatus} to ${newStatus}`,
            'INVALID_STATUS_TRANSITION'
        );
    }
};

/**
 * Validate recurrence pattern
 */
export const validateRecurrencePattern = (
    recurrencePattern: IAppointment['recurrencePattern']
): void => {
    if (!recurrencePattern) return;

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'];
    if (!validFrequencies.includes(recurrencePattern.frequency)) {
        throw createValidationError(
            'recurrencePattern.frequency',
            'Invalid recurrence frequency',
            recurrencePattern.frequency
        );
    }

    // Validate interval
    if (recurrencePattern.interval < 1 || recurrencePattern.interval > 12) {
        throw createValidationError(
            'recurrencePattern.interval',
            'Interval must be between 1 and 12',
            recurrencePattern.interval
        );
    }

    // Validate end conditions
    if (!recurrencePattern.endDate && !recurrencePattern.endAfterOccurrences) {
        throw createValidationError(
            'recurrencePattern',
            'Either endDate or endAfterOccurrences must be specified',
            recurrencePattern
        );
    }

    // Validate end date is in the future
    if (recurrencePattern.endDate) {
        const endDate = new Date(recurrencePattern.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (endDate < today) {
            throw createValidationError(
                'recurrencePattern.endDate',
                'End date cannot be in the past',
                recurrencePattern.endDate
            );
        }
    }

    // Validate end after occurrences
    if (recurrencePattern.endAfterOccurrences) {
        if (recurrencePattern.endAfterOccurrences < 1 || recurrencePattern.endAfterOccurrences > 52) {
            throw createValidationError(
                'recurrencePattern.endAfterOccurrences',
                'End after occurrences must be between 1 and 52',
                recurrencePattern.endAfterOccurrences
            );
        }
    }
};

/**
 * Validate follow-up task priority and due date
 */
export const validateFollowUpPriority = (
    priority: IFollowUpTask['priority'],
    dueDate: Date
): void => {
    const now = new Date();
    const daysDifference = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Critical and urgent tasks should be due within 7 days
    if ((priority === 'critical' || priority === 'urgent') && daysDifference > 7) {
        throw createAppointmentBusinessLogicError(
            'Critical and urgent tasks must be due within 7 days',
            'INVALID_DUE_DATE_FOR_PRIORITY'
        );
    }

    // High priority tasks should be due within 14 days
    if (priority === 'high' && daysDifference > 14) {
        logger.warn('High priority task due date is more than 14 days away', {
            priority,
            dueDate,
            daysDifference
        });
    }
};

/**
 * Validate follow-up task can be converted to appointment
 */
export const validateFollowUpConversion = async (
    followUpTask: IFollowUpTask
): Promise<void> => {
    // Check if task is already completed
    if (followUpTask.status === 'completed') {
        throw createAppointmentBusinessLogicError(
            'Cannot convert completed follow-up task to appointment',
            'TASK_ALREADY_COMPLETED'
        );
    }

    // Check if task is already converted
    if (followUpTask.status === 'converted_to_appointment') {
        throw createAppointmentBusinessLogicError(
            'Follow-up task has already been converted to an appointment',
            'TASK_ALREADY_CONVERTED'
        );
    }

    // Check if task is cancelled
    if (followUpTask.status === 'cancelled') {
        throw createAppointmentBusinessLogicError(
            'Cannot convert cancelled follow-up task to appointment',
            'TASK_CANCELLED'
        );
    }
};

/**
 * Validate appointment can be rescheduled
 */
export const validateAppointmentReschedule = (
    appointment: IAppointment
): void => {
    // Check if appointment is already completed
    if (appointment.status === 'completed') {
        throw createAppointmentBusinessLogicError(
            'Cannot reschedule completed appointment',
            'APPOINTMENT_COMPLETED'
        );
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
        throw createAppointmentBusinessLogicError(
            'Cannot reschedule cancelled appointment',
            'APPOINTMENT_CANCELLED'
        );
    }

    // Check if appointment is marked as no-show
    if (appointment.status === 'no_show') {
        throw createAppointmentBusinessLogicError(
            'Cannot reschedule no-show appointment. Create a new appointment instead.',
            'APPOINTMENT_NO_SHOW'
        );
    }
};

/**
 * Validate appointment can be cancelled
 */
export const validateAppointmentCancellation = (
    appointment: IAppointment
): void => {
    // Check if appointment is already completed
    if (appointment.status === 'completed') {
        throw createAppointmentBusinessLogicError(
            'Cannot cancel completed appointment',
            'APPOINTMENT_COMPLETED'
        );
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
        throw createAppointmentBusinessLogicError(
            'Appointment is already cancelled',
            'APPOINTMENT_ALREADY_CANCELLED'
        );
    }
};

/**
 * Comprehensive appointment validation
 */
export const validateAppointmentCreation = async (
    data: {
        patientId: mongoose.Types.ObjectId;
        assignedTo: mongoose.Types.ObjectId;
        type: IAppointment['type'];
        scheduledDate: Date;
        scheduledTime: string;
        duration: number;
        isRecurring?: boolean;
        recurrencePattern?: IAppointment['recurrencePattern'];
    },
    workplaceId: mongoose.Types.ObjectId
): Promise<void> => {
    // Validate patient
    await validatePatient(data.patientId, workplaceId);

    // Validate pharmacist
    await validatePharmacist(data.assignedTo, workplaceId);

    // Validate date and time
    validateAppointmentDateTime(data.scheduledDate, data.scheduledTime);

    // Validate duration
    validateAppointmentDuration(data.duration, data.type);

    // Validate pharmacist availability
    await validatePharmacistAvailability(
        data.assignedTo,
        data.scheduledDate,
        data.type,
        workplaceId
    );

    // Check for conflicts
    await checkAppointmentConflict(
        data.assignedTo,
        data.scheduledDate,
        data.scheduledTime,
        data.duration
    );

    // Check for patient conflicts
    await checkPatientConflict(
        data.patientId,
        data.scheduledDate,
        data.scheduledTime,
        data.duration,
        workplaceId
    );

    // Validate recurrence pattern if recurring
    if (data.isRecurring && data.recurrencePattern) {
        validateRecurrencePattern(data.recurrencePattern);
    }
};
