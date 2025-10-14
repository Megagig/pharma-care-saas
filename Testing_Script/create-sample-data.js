const mongoose = require('mongoose');
require('dotenv').config();

async function createSampleData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharma-care-saas');
    console.log('Connected successfully');

    // Define schemas inline for this script
    const permissionSchema = new mongoose.Schema({
      action: String,
      displayName: String,
      description: String,
      category: String,
      riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      isActive: { type: Boolean, default: true },
      isSystemPermission: { type: Boolean, default: false },
      createdBy: mongoose.Schema.Types.ObjectId,
      lastModifiedBy: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const roleSchema = new mongoose.Schema({
      name: String,
      displayName: String,
      description: String,
      category: { type: String, enum: ['system', 'workplace', 'custom'], default: 'custom' },
      hierarchyLevel: { type: Number, default: 0 },
      permissions: [String],
      isActive: { type: Boolean, default: true },
      isSystemRole: { type: Boolean, default: false },
      isDefault: { type: Boolean, default: false },
      createdBy: mongoose.Schema.Types.ObjectId,
      lastModifiedBy: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    const Permission = mongoose.model('Permission', permissionSchema);
    const Role = mongoose.model('Role', roleSchema);

    // Create permissions
    console.log('Creating permissions...');
    const permissions = await Permission.insertMany([
      {
        action: 'read_users',
        displayName: 'Read Users',
        description: 'Can read user information',
        category: 'user_management',
        riskLevel: 'low',
        isSystemPermission: true,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      },
      {
        action: 'manage_users',
        displayName: 'Manage Users',
        description: 'Can manage user accounts',
        category: 'user_management',
        riskLevel: 'medium',
        isSystemPermission: true,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      },
      {
        action: 'read_patients',
        displayName: 'Read Patients',
        description: 'Can read patient information',
        category: 'patient_management',
        riskLevel: 'low',
        isSystemPermission: true,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      },
      {
        action: 'manage_patients',
        displayName: 'Manage Patients',
        description: 'Can manage patient records',
        category: 'patient_management',
        riskLevel: 'medium',
        isSystemPermission: true,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      }
    ]);

    console.log(`Created ${permissions.length} permissions`);

    // Create roles
    console.log('Creating roles...');
    const roles = await Role.insertMany([
      {
        name: 'pharmacy_manager',
        displayName: 'Pharmacy Manager',
        description: 'Manages pharmacy operations and staff',
        category: 'workplace',
        hierarchyLevel: 0,
        permissions: ['read_users', 'manage_users', 'read_patients'],
        isActive: true,
        isSystemRole: false,
        isDefault: false,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      },
      {
        name: 'staff_pharmacist',
        displayName: 'Staff Pharmacist',
        description: 'Handles patient care and medication management',
        category: 'workplace',
        hierarchyLevel: 1,
        permissions: ['read_patients', 'manage_patients'],
        isActive: true,
        isSystemRole: false,
        isDefault: false,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      },
      {
        name: 'pharmacy_technician',
        displayName: 'Pharmacy Technician',
        description: 'Assists with pharmacy operations',
        category: 'workplace',
        hierarchyLevel: 2,
        permissions: ['read_patients'],
        isActive: true,
        isSystemRole: false,
        isDefault: false,
        createdBy: new mongoose.Types.ObjectId(),
        lastModifiedBy: new mongoose.Types.ObjectId()
      }
    ]);

    console.log(`Created ${roles.length} roles`);
    console.log('Sample data created successfully!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample data:', error);
    process.exit(1);
  }
}

createSampleData();
