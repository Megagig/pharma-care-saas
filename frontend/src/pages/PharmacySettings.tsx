import React from 'react';
import ModulePage from '../components/ModulePage';
import TuneIcon from '@mui/icons-material/Tune';
import type { ModuleInfo } from '../types/moduleTypes';

const PharmacySettings: React.FC = () => {
  const moduleInfo: ModuleInfo = {
    title: 'Settings & Configuration',
    purpose:
      'Customize platform behavior, notifications, integrations, and system preferences for optimal workflow.',
    workflow: {
      description:
        'Centralized configuration hub for customizing system behavior, notifications, and integrations to match pharmacy workflows.',
      steps: [
        'Access system configuration settings',
        'Set user preferences and notifications',
        'Configure external system integrations',
        'Manage alert thresholds and rules',
        'Save and apply configuration changes',
      ],
    },
    keyFeatures: [
      'User preference management',
      'Notification configuration',
      'Integration settings',
      'Alert threshold customization',
      'Workflow automation rules',
      'System backup and restore',
      'Performance optimization settings',
      'Security configuration options',
    ],
    status: 'placeholder',
    estimatedRelease: 'Q1 2025',
  };

  return (
    <ModulePage
      moduleInfo={moduleInfo}
      icon={TuneIcon}
      gradient="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
    />
  );
};

export default PharmacySettings;
