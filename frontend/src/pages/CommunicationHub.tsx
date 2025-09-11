import React from 'react';
import ModulePage from '../components/ModulePage';
import ForumIcon from '@mui/icons-material/Forum';
import type { ModuleInfo } from '../types/moduleTypes';

const CommunicationHub: React.FC = () => {
   const moduleInfo: ModuleInfo = {
      title: 'Communication Hub',
      purpose:
         'Secure messaging platform between pharmacists, doctors, and patients for coordinated care.',
      workflow: {
         description:
            'Facilitate seamless communication across the healthcare team to ensure coordinated patient care and timely interventions.',
         steps: [
            'Access secure chat interface',
            'Respond to patient queries and concerns',
            'Collaborate with doctors on therapy decisions',
            'Send and receive clinical notifications',
            'Document communication for care continuity',
         ],
      },
      keyFeatures: [
         'HIPAA-compliant secure messaging',
         'Multi-party conversation support',
         'Patient query management system',
         'Healthcare provider collaboration tools',
         'Automated notification system',
         'Message threading and organization',
         'File and image sharing capabilities',
         'Communication audit trail',
      ],
      status: 'placeholder',
      estimatedRelease: 'Q3 2025',
   };

   return (
      <ModulePage
         moduleInfo={moduleInfo}
         icon={ForumIcon}
         gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
      />
   );
};

export default CommunicationHub;
