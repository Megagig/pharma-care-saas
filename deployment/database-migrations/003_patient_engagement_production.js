// Patient Engagement & Follow-up Management - Production Migration Script
// This script creates indexes and performs data migrations for production deployment

print("Starting Patient Engagement production migration...");

// Create indexes for optimal performance
print("Creating database indexes...");

// Appointment indexes
db.appointments.createIndex({ "workplaceId": 1, "scheduledDate": 1, "status": 1 });
db.appointments.createIndex({ "workplaceId": 1, "patientId": 1, "scheduledDate": -1 });
db.appointments.createIndex({ "workplaceId": 1, "assignedTo": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "workplaceId": 1, "type": 1, "status": 1 });
db.appointments.createIndex({ "workplaceId": 1, "locationId": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "recurringSeriesId": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "status": 1, "scheduledDate": 1 });
db.appointments.createIndex({ "reminders.scheduledFor": 1, "reminders.sent": 1 });
db.appointments.createIndex({ "createdAt": -1 });

// FollowUpTask indexes
db.followuptasks.createIndex({ "workplaceId": 1, "status": 1, "dueDate": 1 });
db.followuptasks.createIndex({ "workplaceId": 1, "patientId": 1, "status": 1 });
db.followuptasks.createIndex({ "workplaceId": 1, "assignedTo": 1, "status": 1, "priority": -1 });
db.followuptasks.createIndex({ "workplaceId": 1, "type": 1, "status": 1 });
db.followuptasks.createIndex({ "status": 1, "dueDate": 1 });
db.followuptasks.createIndex({ "trigger.type": 1, "trigger.sourceId": 1 });
db.followuptasks.createIndex({ "createdAt": -1 });

// ReminderTemplate indexes
db.remindertemplates.createIndex({ "workplaceId": 1, "type": 1, "isActive": 1 });
db.remindertemplates.createIndex({ "workplaceId": 1, "isDefault": 1 });
db.remindertemplates.createIndex({ "isActive": 1, "type": 1 });

// PharmacistSchedule indexes
db.pharmacistschedules.createIndex({ "workplaceId": 1, "pharmacistId": 1, "isActive": 1 });
db.pharmacistschedules.createIndex({ "workplaceId": 1, "locationId": 1, "isActive": 1 });
db.pharmacistschedules.createIndex({ "pharmacistId": 1, "effectiveFrom": 1, "effectiveTo": 1 });

print("Database indexes created successfully");

// Migrate existing MTR follow-ups to new system
print("Migrating existing MTR follow-ups...");
var mtrFollowUps = db.mtrfollowups.find({ "status": { $in: ["pending", "in_progress"] } });
var migratedCount = 0;

mtrFollowUps.forEach(function(mtr) {
    try {
        // Create corresponding appointment if scheduled
        if (mtr.scheduledDate && mtr.scheduledTime) {
            var appointment = {
                workplaceId: mtr.workplaceId,
                patientId: mtr.patientId,
                assignedTo: mtr.assignedTo || mtr.createdBy,
                type: "mtm_session",
                title: "MTR Follow-up Session",
                description: mtr.notes || "Migrated from MTR follow-up",
                scheduledDate: mtr.scheduledDate,
                scheduledTime: mtr.scheduledTime,
                duration: 30,
                timezone: "Africa/Lagos",
                status: "scheduled",
                confirmationStatus: "pending",
                isRecurring: false,
                isRecurringException: false,
                reminders: [],
                relatedRecords: {
                    mtrSessionId: mtr._id
                },
                metadata: {
                    source: "mtr_migration",
                    triggerEvent: "mtr_followup_migration"
                },
                createdBy: mtr.createdBy,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            var appointmentResult = db.appointments.insertOne(appointment);
            
            // Update MTR follow-up with appointment reference
            db.mtrfollowups.updateOne(
                { _id: mtr._id },
                { 
                    $set: { 
                        "relatedRecords.appointmentId": appointmentResult.insertedId,
                        "migrationStatus": "migrated_to_appointment",
                        "migratedAt": new Date()
                    }
                }
            );
            
            migratedCount++;
        } else {
            // Create follow-up task for unscheduled MTR follow-ups
            var followUpTask = {
                workplaceId: mtr.workplaceId,
                patientId: mtr.patientId,
                assignedTo: mtr.assignedTo || mtr.createdBy,
                type: "medication_change_followup",
                title: "MTR Follow-up Required",
                description: mtr.notes || "Migrated from MTR follow-up",
                objectives: ["Complete medication therapy review", "Address identified issues"],
                priority: mtr.priority || "medium",
                dueDate: mtr.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                status: "pending",
                trigger: {
                    type: "mtr_followup",
                    sourceId: mtr._id,
                    sourceType: "MTRFollowUp",
                    triggerDate: mtr.createdAt,
                    triggerDetails: {
                        originalMTRId: mtr.mtrId,
                        migrationSource: "mtr_followup"
                    }
                },
                relatedRecords: {
                    mtrSessionId: mtr._id
                },
                escalationHistory: [],
                remindersSent: [],
                createdBy: mtr.createdBy,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            var taskResult = db.followuptasks.insertOne(followUpTask);
            
            // Update MTR follow-up with task reference
            db.mtrfollowups.updateOne(
                { _id: mtr._id },
                { 
                    $set: { 
                        "relatedRecords.followUpTaskId": taskResult.insertedId,
                        "migrationStatus": "migrated_to_task",
                        "migratedAt": new Date()
                    }
                }
            );
            
            migratedCount++;
        }
    } catch (error) {
        print("Error migrating MTR follow-up " + mtr._id + ": " + error.message);
    }
});

print("Migrated " + migratedCount + " MTR follow-ups");

// Create default reminder templates
print("Creating default reminder templates...");

var workplaces = db.workplaces.find({});
workplaces.forEach(function(workplace) {
    var templates = [
        {
            workplaceId: workplace._id,
            name: "24h Appointment Reminder",
            type: "appointment",
            category: "pre_appointment",
            channels: ["email", "sms"],
            timing: {
                unit: "hours",
                value: 24,
                relativeTo: "before_appointment"
            },
            messageTemplates: {
                email: {
                    subject: "Appointment Reminder - {{appointmentDate}}",
                    body: "Dear {{patientName}},\n\nThis is a reminder that you have an appointment scheduled for {{appointmentDate}} at {{appointmentTime}} at {{pharmacyName}}.\n\nPlease arrive 10 minutes early and bring any medications you are currently taking.\n\nIf you need to reschedule, please contact us at {{pharmacyPhone}}.\n\nThank you,\n{{pharmacyName}} Team"
                },
                sms: {
                    message: "Reminder: Appointment at {{pharmacyName}} on {{appointmentDate}} at {{appointmentTime}}. Reply CONFIRM to confirm or call {{pharmacyPhone}} to reschedule."
                }
            },
            isActive: true,
            isDefault: true,
            usageStats: {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0
            },
            createdBy: workplace.ownerId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            workplaceId: workplace._id,
            name: "2h Appointment Reminder",
            type: "appointment",
            category: "pre_appointment",
            channels: ["sms", "push"],
            timing: {
                unit: "hours",
                value: 2,
                relativeTo: "before_appointment"
            },
            messageTemplates: {
                sms: {
                    message: "Your appointment at {{pharmacyName}} is in 2 hours ({{appointmentTime}}). See you soon!"
                },
                push: {
                    title: "Appointment in 2 hours",
                    body: "Your appointment at {{pharmacyName}} is at {{appointmentTime}}",
                    actionUrl: "/appointments/{{appointmentId}}"
                }
            },
            isActive: true,
            isDefault: true,
            usageStats: {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0
            },
            createdBy: workplace.ownerId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            workplaceId: workplace._id,
            name: "Medication Refill Reminder",
            type: "medication_refill",
            category: "medication",
            channels: ["email", "sms"],
            timing: {
                unit: "days",
                value: 7,
                relativeTo: "before_due_date"
            },
            messageTemplates: {
                email: {
                    subject: "Medication Refill Due - {{medicationName}}",
                    body: "Dear {{patientName}},\n\nYour prescription for {{medicationName}} is due for refill in 7 days.\n\nPlease contact us at {{pharmacyPhone}} or visit our pharmacy to arrange your refill.\n\nThank you,\n{{pharmacyName}} Team"
                },
                sms: {
                    message: "Refill reminder: {{medicationName}} due in 7 days. Contact {{pharmacyName}} at {{pharmacyPhone}} to refill."
                }
            },
            isActive: true,
            isDefault: true,
            usageStats: {
                totalSent: 0,
                totalDelivered: 0,
                totalFailed: 0
            },
            createdBy: workplace.ownerId,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    templates.forEach(function(template) {
        db.remindertemplates.insertOne(template);
    });
});

print("Default reminder templates created");

// Update Patient model with appointment preferences
print("Updating patient records with appointment preferences...");
db.patients.updateMany(
    { "appointmentPreferences": { $exists: false } },
    {
        $set: {
            "appointmentPreferences": {
                "preferredDays": [1, 2, 3, 4, 5], // Monday to Friday
                "preferredTimeSlots": [
                    { "start": "09:00", "end": "12:00" },
                    { "start": "14:00", "end": "17:00" }
                ],
                "reminderPreferences": {
                    "email": true,
                    "sms": true,
                    "push": false,
                    "whatsapp": false
                },
                "language": "en",
                "timezone": "Africa/Lagos"
            }
        }
    }
);

print("Patient records updated");

// Create migration log
db.migrationlogs.insertOne({
    migration: "003_patient_engagement_production",
    version: "1.0.0",
    executedAt: new Date(),
    status: "completed",
    details: {
        indexesCreated: true,
        mtrFollowUpsMigrated: migratedCount,
        reminderTemplatesCreated: true,
        patientPreferencesUpdated: true
    }
});

print("Patient Engagement production migration completed successfully");