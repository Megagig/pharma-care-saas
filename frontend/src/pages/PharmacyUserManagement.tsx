import React from 'react';
import ModulePage from '../components/ModulePage';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import type { ModuleInfo } from '../types/moduleTypes';

const PharmacyUserManagement: React.FC = () => {
  const moduleInfo: ModuleInfo = {
    title: 'User Management',
    purpose:
      'Manage pharmacist profiles, roles, permissions, and access controls within the pharmacy system.',
    workflow: {
      description:
        'Comprehensive user management system for controlling access, roles, and permissions across the pharmacy platform.',
      steps: [
        'Add new pharmacist users to the system',
        'Assign appropriate roles and permissions',
        'Set access levels for different modules',
        'Monitor user activity and compliance',
        'Audit user actions and system access',
      ],
    },
    keyFeatures: [
      'User profile management',
      'Role-based access control (RBAC)',
      'Permission matrix configuration',
      'Activity monitoring and logging',
      'Compliance tracking',
      'Multi-factor authentication',
      'Session management',
      'User onboarding workflows',
    ],
    status: 'placeholder',
    estimatedRelease: 'Q2 2025',
  };

  return (
    <ModulePage
      moduleInfo={moduleInfo}
      icon={SupervisorAccountIcon}
      gradient="linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
    />
  );
};

export default PharmacyUserManagement;
