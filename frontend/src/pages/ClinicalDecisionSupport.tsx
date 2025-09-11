import React from 'react';
import ModulePage from '../components/ModulePage';
import PsychologyIcon from '@mui/icons-material/Psychology';
import type { ModuleInfo } from '../types/moduleTypes';

const ClinicalDecisionSupport: React.FC = () => {
   const moduleInfo: ModuleInfo = {
      title: 'Clinical Decision Support',
      purpose:
         'AI-powered alerts and recommendations for contraindications, drug duplications, and missed therapy opportunities.',
      workflow: {
         description:
            'Intelligent clinical decision support system that provides real-time alerts and evidence-based recommendations to enhance patient safety.',
         steps: [
            'Receive real-time clinical alerts',
            'Review AI-generated suggestions',
            'Evaluate recommendations against patient context',
            'Accept, modify, or override suggestions',
            'Document clinical rationale for decisions',
         ],
      },
      keyFeatures: [
         'Real-time drug interaction alerts',
         'Contraindication screening',
         'Duplicate therapy detection',
         'Missed therapy identification',
         'Dosing optimization suggestions',
         'Clinical rule engine',
         'Evidence-based recommendations',
         'Alert fatigue reduction algorithms',
      ],
      status: 'placeholder',
      estimatedRelease: 'Q4 2025',
   };

   return (
      <ModulePage
         moduleInfo={moduleInfo}
         icon={PsychologyIcon}
         gradient="linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"
      />
   );
};

export default ClinicalDecisionSupport;
