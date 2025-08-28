import React from 'react';
import ModulePage from '../components/ModulePage';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import type { ModuleInfo } from '../types/moduleTypes';

const DrugInformationCenter: React.FC = () => {
  const moduleInfo: ModuleInfo = {
    title: 'Drug Information Center',
    purpose:
      'Access comprehensive drug monographs, clinical guidelines, and formulary information for informed decision-making.',
    workflow: {
      description:
        'Comprehensive drug information resource providing evidence-based data to support clinical decision-making and patient counseling.',
      steps: [
        'Search for specific drug information',
        'View detailed drug monographs',
        'Check clinical guidelines and protocols',
        'Review formulary status and alternatives',
        'Add relevant information to therapy plans',
      ],
    },
    keyFeatures: [
      'Comprehensive drug database',
      'Clinical monographs and references',
      'Formulary management system',
      'Drug interaction database',
      'Dosing guidelines and calculators',
      'Patient counseling information',
      'Adverse effect profiles',
      'Therapeutic equivalence data',
    ],
    status: 'placeholder',
    estimatedRelease: 'Q1 2025',
  };

  return (
    <ModulePage
      moduleInfo={moduleInfo}
      icon={MenuBookIcon}
      gradient="linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
    />
  );
};

export default DrugInformationCenter;
