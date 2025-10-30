const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacycopilot';

// Sample data configuration
const APPOINTMENT_TYPES = [
  'mtm_session',
  'chronic_disease_review', 
  'new_medication_consultation',
  'vaccination',
  'health_check',
  'smoking_cessation',
  'general_followup'
];

const APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed', 
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
];

// Define schemas (simplified versions)
const appointmentSchema = new mongoose.Schema({
  workplaceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: APPOINTMENT_TYPES, required: true },
  title: String,
  description: String,
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  duration: { type: Number, default: 30 },
  timezone: { type: String, default: 'Africa/Lagos' },
  status: { type: String, enum: APPOINTMENT_STATUSES, default: 'scheduled' },
  confirmationStatus: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
  isRecurring: { type: Boolean, default: false },
  reminders: [{
    type: { type: String, enum: ['email', 'sms', 'whatsapp', 'push'] },
    scheduledFor: Date,
    sentAt: Date,
    deliveryStatus: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'] },
    message: String
  }],
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  rescheduledFrom: Date,
  rescheduledTo: Date,
  rescheduledReason: String,
  outcome: {
    summary: String,
    recommendations: [String],
    followUpRequired: Boolean,
    nextAppointmentDate: Date
  },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const followUpTaskSchema = new mongoose.Schema({
  workplaceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'overdue'], default: 'pending' },
  title: String,
  description: String,
  dueDate: Date,
  completedAt: Date,
  trigger: {
    type: { type: String, required: true },
    sourceId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed
  },
  escalationHistory: [{
    fromPriority: String,
    toPriority: String,
    escalatedAt: Date,
    escalatedBy: mongoose.Schema.Types.ObjectId,
    reason: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
const FollowUpTask = mongoose.model('FollowUpTask', followUpTaskSchema);

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function getWorkplaceAndUsers() {
  // Get first workplace and users
  const Workplace = mongoose.model('Workplace', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Patient = mongoose.model('Patient', new mongoose.Schema({}, { strict: false }));

  const workplace = await Workplace.findOne();
  const users = await User.find({ workplaceId: workplace?._id }).limit(5);
  const patients = await Patient.find({ workplaceId: workplace?._id }).limit(20);

  if (!workplace || users.length === 0 || patients.length === 0) {
    console.log('❌ No workplace, users, or patients found. Please ensure you have basic data setup.');
    return null;
  }

  console.log(`✅ Found workplace: ${workplace.name}`);
  console.log(`✅ Found ${users.length} users`);
  console.log(`✅ Found ${patients.length} patients`);

  return { workplace, users, patients };
}

function generateRandomTime() {
  const hours = faker.number.int({ min: 8, max: 17 }); // 8 AM to 5 PM
  const minutes = faker.helpers.arrayElement([0, 15, 30, 45]);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function generateReminders() {
  const reminderCount = faker.number.int({ min: 0, max: 3 });
  const reminders = [];
  
  for (let i = 0; i < reminderCount; i++) {
    const type = faker.helpers.arrayElement(['email', 'sms', 'whatsapp', 'push']);
    const scheduledFor = faker.date.recent({ days: 7 });
    const deliveryStatus = faker.helpers.arrayElement(['delivered', 'failed', 'pending']);
    
    reminders.push({
      type,
      scheduledFor,
      sentAt: deliveryStatus !== 'pending' ? scheduledFor : null,
      deliveryStatus,
      message: `Reminder: You have an appointment scheduled.`
    });
  }
  
  return reminders;
}

async function createSampleAppointments(workplace, users, patients, count = 100) {
  console.log(`\n📅 Creating ${count} sample appointments...`);
  
  const appointments = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const scheduledDate = faker.date.between({
      from: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      to: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)    // 30 days from now
    });
    
    const status = faker.helpers.arrayElement(APPOINTMENT_STATUSES);
    const type = faker.helpers.arrayElement(APPOINTMENT_TYPES);
    const patient = faker.helpers.arrayElement(patients);
    const assignedUser = faker.helpers.arrayElement(users);
    
    const appointment = {
      workplaceId: workplace._id,
      patientId: patient._id,
      assignedTo: assignedUser._id,
      type,
      title: `${type.replace('_', ' ')} - ${patient.name || 'Patient'}`,
      description: faker.lorem.sentence(),
      scheduledDate,
      scheduledTime: generateRandomTime(),
      duration: faker.helpers.arrayElement([15, 30, 45, 60]),
      status,
      confirmationStatus: status === 'confirmed' ? 'confirmed' : 
                         status === 'cancelled' ? 'declined' : 'pending',
      reminders: generateReminders(),
      createdAt: faker.date.between({
        from: new Date(scheduledDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: scheduledDate
      })
    };
    
    // Add status-specific fields
    if (status === 'completed') {
      appointment.completedAt = new Date(scheduledDate.getTime() + appointment.duration * 60 * 1000);
      appointment.outcome = {
        summary: faker.lorem.paragraph(),
        recommendations: [faker.lorem.sentence(), faker.lorem.sentence()],
        followUpRequired: faker.datatype.boolean(),
        nextAppointmentDate: faker.datatype.boolean() ? 
          faker.date.future({ years: 0.5 }) : null
      };
    } else if (status === 'cancelled') {
      appointment.cancelledAt = faker.date.between({
        from: appointment.createdAt,
        to: scheduledDate
      });
      appointment.cancellationReason = faker.helpers.arrayElement([
        'Patient request',
        'Pharmacist unavailable', 
        'Emergency',
        'Rescheduled',
        'No show'
      ]);
    } else if (status === 'rescheduled') {
      appointment.rescheduledFrom = scheduledDate;
      appointment.rescheduledTo = faker.date.future({ years: 0.25 });
      appointment.rescheduledReason = faker.helpers.arrayElement([
        'Patient request',
        'Pharmacist conflict',
        'Emergency',
        'Better time slot available'
      ]);
    }
    
    appointments.push(appointment);
  }
  
  try {
    await Appointment.insertMany(appointments);
    console.log(`✅ Created ${appointments.length} sample appointments`);
  } catch (error) {
    console.error('❌ Error creating appointments:', error);
  }
}

async function createSampleFollowUpTasks(workplace, users, patients, count = 50) {
  console.log(`\n📋 Creating ${count} sample follow-up tasks...`);
  
  const tasks = [];
  const taskTypes = [
    'medication_review',
    'lab_result_follow_up',
    'side_effect_monitoring',
    'adherence_check',
    'insurance_verification',
    'prescription_refill',
    'clinical_consultation'
  ];
  
  const triggerTypes = [
    'appointment_outcome',
    'medication_change',
    'lab_result',
    'patient_concern',
    'routine_check',
    'system_alert'
  ];
  
  for (let i = 0; i < count; i++) {
    const createdAt = faker.date.recent({ days: 30 });
    const dueDate = faker.date.future({ years: 0.25 });
    const status = faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'overdue']);
    const priority = faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']);
    
    const task = {
      workplaceId: workplace._id,
      patientId: faker.helpers.arrayElement(patients)._id,
      assignedTo: faker.helpers.arrayElement(users)._id,
      type: faker.helpers.arrayElement(taskTypes),
      priority,
      status: dueDate < new Date() && status === 'pending' ? 'overdue' : status,
      title: faker.lorem.words(4),
      description: faker.lorem.sentence(),
      dueDate,
      completedAt: status === 'completed' ? 
        faker.date.between({ from: createdAt, to: new Date() }) : null,
      trigger: {
        type: faker.helpers.arrayElement(triggerTypes),
        sourceId: new mongoose.Types.ObjectId(),
        metadata: {
          reason: faker.lorem.sentence(),
          urgency: priority
        }
      },
      escalationHistory: priority === 'critical' ? [{
        fromPriority: 'high',
        toPriority: 'critical',
        escalatedAt: faker.date.between({ from: createdAt, to: new Date() }),
        escalatedBy: faker.helpers.arrayElement(users)._id,
        reason: 'Patient safety concern'
      }] : [],
      createdAt
    };
    
    tasks.push(task);
  }
  
  try {
    await FollowUpTask.insertMany(tasks);
    console.log(`✅ Created ${tasks.length} sample follow-up tasks`);
  } catch (error) {
    console.error('❌ Error creating follow-up tasks:', error);
  }
}

async function generateAnalyticsSummary(workplace) {
  console.log('\n📊 Generating analytics summary...');
  
  const appointmentCount = await Appointment.countDocuments({ workplaceId: workplace._id });
  const followUpCount = await FollowUpTask.countDocuments({ workplaceId: workplace._id });
  
  const appointmentsByStatus = await Appointment.aggregate([
    { $match: { workplaceId: workplace._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  const appointmentsByType = await Appointment.aggregate([
    { $match: { workplaceId: workplace._id } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  
  console.log(`📈 Total Appointments: ${appointmentCount}`);
  console.log(`📋 Total Follow-up Tasks: ${followUpCount}`);
  console.log('\n📊 Appointments by Status:');
  appointmentsByStatus.forEach(item => {
    console.log(`   ${item._id}: ${item.count}`);
  });
  
  console.log('\n📊 Appointments by Type:');
  appointmentsByType.forEach(item => {
    console.log(`   ${item._id}: ${item.count}`);
  });
}

async function main() {
  console.log('🚀 Creating Sample Data for Analytics Testing\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  const data = await getWorkplaceAndUsers();
  if (!data) {
    console.log('\n❌ Cannot proceed without basic data setup');
    process.exit(1);
  }
  
  const { workplace, users, patients } = data;
  
  // Clear existing sample data
  console.log('\n🧹 Clearing existing sample data...');
  await Appointment.deleteMany({ workplaceId: workplace._id });
  await FollowUpTask.deleteMany({ workplaceId: workplace._id });
  console.log('✅ Cleared existing data');
  
  // Create sample data
  await createSampleAppointments(workplace, users, patients, 150);
  await createSampleFollowUpTasks(workplace, users, patients, 75);
  
  // Generate summary
  await generateAnalyticsSummary(workplace);
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Sample data creation complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Test the analytics endpoints with authentication');
  console.log('   2. Check the frontend analytics components');
  console.log('   3. Verify data is displaying correctly');
  
  await mongoose.disconnect();
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});