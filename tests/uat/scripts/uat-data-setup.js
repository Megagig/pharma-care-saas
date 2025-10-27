/**
 * UAT Data Setup Script
 * Creates realistic test data for User Acceptance Testing
 * of the Patient Engagement & Follow-up Management module
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

// Import models (adjust paths as needed)
const User = require('../../../backend/src/models/User');
const Patient = require('../../../backend/src/models/Patient');
const Workplace = require('../../../backend/src/models/Workplace');
const Appointment = require('../../../backend/src/models/Appointment');
const FollowUpTask = require('../../../backend/src/models/FollowUpTask');
const PharmacistSchedule = require('../../../backend/src/models/PharmacistSchedule');
const ReminderTemplate = require('../../../backend/src/models/ReminderTemplate');

class UATDataSetup {
  constructor() {
    this.workplaceId = null;
    this.pharmacistIds = [];
    this.patientIds = [];
    this.appointmentIds = [];
    this.followUpIds = [];
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacycopilot-uat');
      console.log('✅ Connected to MongoDB for UAT data setup');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async cleanupExistingData() {
    console.log('🧹 Cleaning up existing UAT data...');
    
    try {
      // Delete UAT-specific data (marked with UAT prefix)
      await Appointment.deleteMany({ 
        $or: [
          { title: { $regex: /^UAT/i } },
          { description: { $regex: /UAT Test/i } }
        ]
      });
      
      await FollowUpTask.deleteMany({ 
        $or: [
          { title: { $regex: /^UAT/i } },
          { description: { $regex: /UAT Test/i } }
        ]
      });
      
      await Patient.deleteMany({ 
        $or: [
          { firstName: { $regex: /^UAT/i } },
          { email: { $regex: /@uat-test\.com$/i } }
        ]
      });
      
      await User.deleteMany({ 
        email: { $regex: /@uat-test\.com$/i }
      });

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  async createTestWorkplace() {
    console.log('🏢 Creating test workplace...');
    
    const workplace = new Workplace({
      name: 'UAT Test Pharmacy',
      address: {
        street: '123 Test Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        postalCode: '100001'
      },
      phone: '+234-800-UAT-TEST',
      email: 'admin@uat-test.com',
      settings: {
        timezone: 'Africa/Lagos',
        workingHours: {
          monday: { start: '08:00', end: '18:00' },
          tuesday: { start: '08:00', end: '18:00' },
          wednesday: { start: '08:00', end: '18:00' },
          thursday: { start: '08:00', end: '18:00' },
          friday: { start: '08:00', end: '18:00' },
          saturday: { start: '09:00', end: '15:00' },
          sunday: { start: '10:00', end: '14:00' }
        }
      },
      isActive: true
    });

    await workplace.save();
    this.workplaceId = workplace._id;
    console.log(`✅ Created workplace: ${workplace.name} (${this.workplaceId})`);
    
    return workplace;
  }

  async createTestPharmacists() {
    console.log('👨‍⚕️ Creating test pharmacists...');
    
    const pharmacists = [
      {
        firstName: 'UAT Dr. Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@uat-test.com',
        role: 'pharmacist',
        specialties: ['MTM', 'Chronic Disease Management', 'Vaccinations']
      },
      {
        firstName: 'UAT Dr. Michael',
        lastName: 'Chen',
        email: 'michael.chen@uat-test.com',
        role: 'pharmacist',
        specialties: ['Clinical Interventions', 'Smoking Cessation', 'Health Checks']
      },
      {
        firstName: 'UAT Dr. Amina',
        lastName: 'Okafor',
        email: 'amina.okafor@uat-test.com',
        role: 'pharmacy_manager',
        specialties: ['All Services', 'Management', 'Training']
      }
    ];

    for (const pharmacistData of pharmacists) {
      const hashedPassword = await bcrypt.hash('UAT-Test123!', 10);
      
      const pharmacist = new User({
        ...pharmacistData,
        password: hashedPassword,
        workplaceId: this.workplaceId,
        isActive: true,
        profile: {
          licenseNumber: `UAT-${faker.string.alphanumeric(8).toUpperCase()}`,
          specializations: pharmacistData.specialties,
          workingHours: {
            monday: { start: '08:00', end: '17:00' },
            tuesday: { start: '08:00', end: '17:00' },
            wednesday: { start: '08:00', end: '17:00' },
            thursday: { start: '08:00', end: '17:00' },
            friday: { start: '08:00', end: '17:00' }
          }
        }
      });

      await pharmacist.save();
      this.pharmacistIds.push(pharmacist._id);
      
      // Create pharmacist schedule
      await this.createPharmacistSchedule(pharmacist._id);
      
      console.log(`✅ Created pharmacist: ${pharmacist.firstName} ${pharmacist.lastName}`);
    }
  }

  async createPharmacistSchedule(pharmacistId) {
    const schedule = new PharmacistSchedule({
      workplaceId: this.workplaceId,
      pharmacistId: pharmacistId,
      workingHours: [
        { dayOfWeek: 1, isWorkingDay: true, shifts: [{ startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' }] },
        { dayOfWeek: 2, isWorkingDay: true, shifts: [{ startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' }] },
        { dayOfWeek: 3, isWorkingDay: true, shifts: [{ startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' }] },
        { dayOfWeek: 4, isWorkingDay: true, shifts: [{ startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' }] },
        { dayOfWeek: 5, isWorkingDay: true, shifts: [{ startTime: '08:00', endTime: '17:00', breakStart: '12:00', breakEnd: '13:00' }] },
        { dayOfWeek: 6, isWorkingDay: true, shifts: [{ startTime: '09:00', endTime: '15:00' }] },
        { dayOfWeek: 0, isWorkingDay: false, shifts: [] }
      ],
      appointmentPreferences: {
        maxAppointmentsPerDay: 12,
        appointmentTypes: ['mtm_session', 'chronic_disease_review', 'new_medication_consultation', 'vaccination', 'health_check', 'general_followup'],
        defaultDuration: 30,
        bufferBetweenAppointments: 5
      },
      isActive: true,
      effectiveFrom: new Date()
    });

    await schedule.save();
  }

  async createTestPatients() {
    console.log('👥 Creating test patients...');
    
    const patientProfiles = [
      {
        type: 'chronic_disease',
        conditions: ['Diabetes Type 2', 'Hypertension'],
        medications: ['Metformin', 'Lisinopril', 'Amlodipine']
      },
      {
        type: 'elderly',
        conditions: ['Arthritis', 'High Cholesterol'],
        medications: ['Atorvastatin', 'Ibuprofen']
      },
      {
        type: 'young_adult',
        conditions: ['Asthma'],
        medications: ['Albuterol Inhaler']
      },
      {
        type: 'new_patient',
        conditions: [],
        medications: []
      }
    ];

    for (let i = 0; i < 15; i++) {
      const profile = faker.helpers.arrayElement(patientProfiles);
      const gender = faker.person.sex();
      
      const patient = new Patient({
        workplaceId: this.workplaceId,
        firstName: `UAT ${faker.person.firstName(gender)}`,
        lastName: faker.person.lastName(),
        email: `patient${i + 1}@uat-test.com`,
        phone: faker.phone.number('+234-###-###-####'),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        gender: gender,
        address: {
          street: faker.location.streetAddress(),
          city: faker.helpers.arrayElement(['Lagos', 'Abuja', 'Kano', 'Ibadan']),
          state: faker.helpers.arrayElement(['Lagos', 'FCT', 'Kano', 'Oyo']),
          country: 'Nigeria',
          postalCode: faker.location.zipCode()
        },
        medicalHistory: {
          conditions: profile.conditions,
          allergies: faker.helpers.maybe(() => [faker.helpers.arrayElement(['Penicillin', 'Sulfa', 'Aspirin'])], { probability: 0.3 }) || [],
          currentMedications: profile.medications.map(med => ({
            name: med,
            dosage: faker.helpers.arrayElement(['5mg', '10mg', '25mg', '50mg']),
            frequency: faker.helpers.arrayElement(['Once daily', 'Twice daily', 'Three times daily'])
          }))
        },
        appointmentPreferences: {
          preferredDays: faker.helpers.arrayElements([1, 2, 3, 4, 5], { min: 2, max: 4 }),
          preferredTimeSlots: [
            { start: '09:00', end: '12:00' },
            { start: '14:00', end: '17:00' }
          ],
          reminderPreferences: {
            email: faker.datatype.boolean(),
            sms: faker.datatype.boolean(),
            push: faker.datatype.boolean(),
            whatsapp: faker.datatype.boolean()
          },
          language: faker.helpers.arrayElement(['en', 'yo', 'ig', 'ha']),
          timezone: 'Africa/Lagos'
        },
        isActive: true
      });

      await patient.save();
      this.patientIds.push(patient._id);
      console.log(`✅ Created patient: ${patient.firstName} ${patient.lastName}`);
    }
  }

  async createTestAppointments() {
    console.log('📅 Creating test appointments...');
    
    const appointmentTypes = [
      'mtm_session',
      'chronic_disease_review',
      'new_medication_consultation',
      'vaccination',
      'health_check',
      'smoking_cessation',
      'general_followup'
    ];

    const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    
    // Create appointments for the next 30 days
    for (let i = 0; i < 25; i++) {
      const appointmentDate = faker.date.between({ 
        from: new Date(), 
        to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      });
      
      const appointmentType = faker.helpers.arrayElement(appointmentTypes);
      const patientId = faker.helpers.arrayElement(this.patientIds);
      const pharmacistId = faker.helpers.arrayElement(this.pharmacistIds);
      const status = faker.helpers.arrayElement(statuses);
      
      const appointment = new Appointment({
        workplaceId: this.workplaceId,
        patientId: patientId,
        assignedTo: pharmacistId,
        type: appointmentType,
        title: `UAT ${appointmentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        description: `UAT Test appointment for ${appointmentType}`,
        scheduledDate: appointmentDate,
        scheduledTime: faker.helpers.arrayElement(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']),
        duration: faker.helpers.arrayElement([15, 30, 45, 60]),
        timezone: 'Africa/Lagos',
        status: status,
        confirmationStatus: status === 'confirmed' ? 'confirmed' : 'pending',
        isRecurring: faker.helpers.maybe(() => true, { probability: 0.2 }) || false,
        reminders: [
          {
            type: 'email',
            scheduledFor: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000),
            sent: false
          },
          {
            type: 'sms',
            scheduledFor: new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000),
            sent: false
          }
        ],
        metadata: {
          source: 'manual',
          customFields: {
            uatTest: true,
            testScenario: faker.helpers.arrayElement(['daily_management', 'rescheduling', 'completion'])
          }
        },
        createdBy: pharmacistId,
        isDeleted: false
      });

      // Add completion data for completed appointments
      if (status === 'completed') {
        appointment.completedAt = new Date(appointmentDate.getTime() + appointment.duration * 60 * 1000);
        appointment.outcome = {
          status: faker.helpers.arrayElement(['successful', 'partially_successful']),
          notes: `UAT Test completion notes for ${appointmentType}`,
          nextActions: ['Follow up in 2 weeks', 'Monitor medication adherence'],
          visitCreated: faker.datatype.boolean()
        };
      }

      await appointment.save();
      this.appointmentIds.push(appointment._id);
      console.log(`✅ Created appointment: ${appointment.title} (${status})`);
    }
  }

  async createTestFollowUps() {
    console.log('📋 Creating test follow-up tasks...');
    
    const followUpTypes = [
      'medication_start_followup',
      'lab_result_review',
      'hospital_discharge_followup',
      'medication_change_followup',
      'chronic_disease_monitoring',
      'adherence_check',
      'preventive_care',
      'general_followup'
    ];

    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['pending', 'in_progress', 'completed', 'overdue'];

    for (let i = 0; i < 20; i++) {
      const followUpType = faker.helpers.arrayElement(followUpTypes);
      const patientId = faker.helpers.arrayElement(this.patientIds);
      const pharmacistId = faker.helpers.arrayElement(this.pharmacistIds);
      const priority = faker.helpers.arrayElement(priorities);
      const status = faker.helpers.arrayElement(statuses);
      
      const dueDate = faker.date.between({ 
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
        to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
      });

      const followUp = new FollowUpTask({
        workplaceId: this.workplaceId,
        patientId: patientId,
        assignedTo: pharmacistId,
        type: followUpType,
        title: `UAT ${followUpType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        description: `UAT Test follow-up task for ${followUpType}`,
        objectives: [
          'Contact patient to assess current status',
          'Review medication adherence',
          'Document outcomes and next steps'
        ],
        priority: priority,
        dueDate: dueDate,
        status: status,
        trigger: {
          type: faker.helpers.arrayElement(['manual', 'medication_start', 'lab_result', 'system_rule']),
          triggerDate: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          triggerDetails: {
            uatTest: true,
            scenario: followUpType
          }
        },
        escalationHistory: priority === 'urgent' ? [{
          escalatedAt: new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000),
          escalatedBy: pharmacistId,
          fromPriority: 'high',
          toPriority: 'urgent',
          reason: 'Patient condition requires immediate attention'
        }] : [],
        createdBy: pharmacistId,
        isDeleted: false
      });

      // Add completion data for completed tasks
      if (status === 'completed') {
        followUp.completedAt = new Date();
        followUp.completedBy = pharmacistId;
        followUp.outcome = {
          status: faker.helpers.arrayElement(['successful', 'partially_successful']),
          notes: `UAT Test completion notes for ${followUpType}`,
          nextActions: ['Schedule follow-up appointment', 'Monitor progress'],
          appointmentCreated: faker.datatype.boolean()
        };
      }

      await followUp.save();
      this.followUpIds.push(followUp._id);
      console.log(`✅ Created follow-up: ${followUp.title} (${status}, ${priority})`);
    }
  }

  async createReminderTemplates() {
    console.log('📨 Creating reminder templates...');
    
    const templates = [
      {
        name: 'UAT 24-Hour Appointment Reminder',
        type: 'appointment',
        category: 'pre_appointment',
        channels: ['email', 'sms'],
        timing: { unit: 'hours', value: 24, relativeTo: 'before_appointment' },
        messageTemplates: {
          email: {
            subject: 'UAT Test: Appointment Reminder - {{appointmentDate}}',
            body: 'Dear {{patientName}}, this is a UAT test reminder for your {{appointmentType}} appointment tomorrow at {{appointmentTime}}.'
          },
          sms: {
            message: 'UAT Test: Appointment reminder - {{appointmentType}} tomorrow at {{appointmentTime}}. Reply CONFIRM to confirm.'
          }
        },
        isActive: true,
        isDefault: true
      },
      {
        name: 'UAT 2-Hour Appointment Reminder',
        type: 'appointment',
        category: 'pre_appointment',
        channels: ['sms', 'push'],
        timing: { unit: 'hours', value: 2, relativeTo: 'before_appointment' },
        messageTemplates: {
          sms: {
            message: 'UAT Test: Your {{appointmentType}} appointment is in 2 hours at {{appointmentTime}}.'
          },
          push: {
            title: 'UAT Test: Appointment Soon',
            body: '{{appointmentType}} appointment in 2 hours',
            actionUrl: '/appointments/confirm/{{appointmentId}}'
          }
        },
        isActive: true,
        isDefault: true
      }
    ];

    for (const templateData of templates) {
      const template = new ReminderTemplate({
        ...templateData,
        workplaceId: this.workplaceId,
        usageStats: {
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0
        },
        createdBy: this.pharmacistIds[0],
        isDeleted: false
      });

      await template.save();
      console.log(`✅ Created reminder template: ${template.name}`);
    }
  }

  async generateSummaryReport() {
    console.log('\n📊 UAT Data Setup Summary Report');
    console.log('=====================================');
    console.log(`Workplace ID: ${this.workplaceId}`);
    console.log(`Pharmacists Created: ${this.pharmacistIds.length}`);
    console.log(`Patients Created: ${this.patientIds.length}`);
    console.log(`Appointments Created: ${this.appointmentIds.length}`);
    console.log(`Follow-ups Created: ${this.followUpIds.length}`);
    
    // Generate test user credentials
    console.log('\n👤 Test User Credentials');
    console.log('========================');
    console.log('Pharmacist 1: sarah.johnson@uat-test.com / UAT-Test123!');
    console.log('Pharmacist 2: michael.chen@uat-test.com / UAT-Test123!');
    console.log('Manager: amina.okafor@uat-test.com / UAT-Test123!');
    
    console.log('\n📧 Patient Portal Test Accounts');
    console.log('===============================');
    for (let i = 1; i <= 5; i++) {
      console.log(`Patient ${i}: patient${i}@uat-test.com`);
    }
    
    console.log('\n🎯 UAT Test Scenarios Ready');
    console.log('===========================');
    console.log('✅ Daily appointment management');
    console.log('✅ Follow-up task workflows');
    console.log('✅ Schedule management');
    console.log('✅ Patient portal booking');
    console.log('✅ Reminder system testing');
    console.log('✅ Integration scenarios');
    
    console.log('\n🚀 Ready for UAT Execution!');
  }

  async run() {
    try {
      await this.connect();
      await this.cleanupExistingData();
      await this.createTestWorkplace();
      await this.createTestPharmacists();
      await this.createTestPatients();
      await this.createTestAppointments();
      await this.createTestFollowUps();
      await this.createReminderTemplates();
      await this.generateSummaryReport();
    } catch (error) {
      console.error('❌ UAT data setup failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new UATDataSetup();
  setup.run().catch(console.error);
}

module.exports = UATDataSetup;