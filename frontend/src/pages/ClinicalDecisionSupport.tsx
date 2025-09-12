import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tab,
  Tabs,
  Alert,
} from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import InfoIcon from '@mui/icons-material/Info';
import DiagnosticModule from '../components/DiagnosticModule';
import type { ModuleInfo } from '../types/moduleTypes';
import ModulePage from '../components/ModulePage';

const ClinicalDecisionSupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const moduleInfo: ModuleInfo = {
    title: 'Clinical Decision Support',
    purpose:
      'AI-powered diagnostic assistance and clinical recommendations for evidence-based patient care.',
    workflow: {
      description:
        'Intelligent clinical decision support system that provides AI-powered diagnostic analysis and evidence-based recommendations to enhance patient safety.',
      steps: [
        'Input patient symptoms and clinical data',
        'Review AI-generated diagnostic analysis',
        'Evaluate differential diagnoses and recommendations',
        'Accept, modify, or override AI suggestions',
        'Document clinical rationale and decisions',
      ],
    },
    keyFeatures: [
      'AI-powered diagnostic analysis',
      'Differential diagnosis ranking',
      'Drug interaction checking',
      'Red flag identification',
      'Therapeutic recommendations',
      'Evidence-based suggestions',
      'Patient consent management',
      'Clinical decision documentation',
    ],
    status: 'active',
    estimatedRelease: 'Available Now',
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Module Header */}
      <Box
        sx={{
          p: 3,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
          color: 'white',
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PsychologyIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {moduleInfo.title}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
              {moduleInfo.purpose}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<PsychologyIcon />} 
            label="AI Diagnostic Tool" 
            iconPosition="start"
          />
          <Tab 
            icon={<InfoIcon />} 
            label="How to Use" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Content */}
      {activeTab === 0 && <DiagnosticModule />}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="primary" />
              How to Use Clinical Decision Support
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Step-by-Step Usage Guide
              </Typography>
              
              <Box component="ol" sx={{ pl: 2, '& > li': { mb: 2 } }}>
                <li>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Select Patient
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose the patient from the dropdown menu. This ensures the AI analysis is contextualized with the patient's medical history.
                  </Typography>
                </li>
                
                <li>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Input Symptoms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add both subjective symptoms (patient-reported) and objective findings (clinical observations). Use the "Add Subjective" and "Add Objective" buttons to categorize symptoms appropriately.
                  </Typography>
                </li>
                
                <li>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Clinical Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Specify the duration (e.g., "3 days", "2 weeks"), severity (mild/moderate/severe), and onset type (acute/chronic/subacute) of symptoms.
                  </Typography>
                </li>
                
                <li>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Vital Signs
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter current vital signs including blood pressure, heart rate, temperature, and oxygen saturation. This data helps the AI assess severity and urgency.
                  </Typography>
                </li>
                
                <li>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Generate Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click "Generate AI Analysis" to receive comprehensive diagnostic insights. The system will prompt for patient consent before proceeding.
                  </Typography>
                </li>
                
                <li>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Review Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Examine the AI-generated differential diagnoses, red flags, recommended tests, and therapeutic options. Use these as clinical decision support - not replacement for professional judgment.
                  </Typography>
                </li>
              </Box>
              
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Important Notes:
                </Typography>
                <Typography variant="body2">
                  • This tool provides clinical decision support and should not replace professional medical judgment<br/>
                  • Always verify AI recommendations with current clinical guidelines<br/>
                  • Patient consent is required before generating AI analysis<br/>
                  • Red flags require immediate attention and possible escalation
                </Typography>
              </Alert>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                  Best Practices
                </Typography>
                <Typography variant="body2">
                  • Be thorough in symptom documentation for better AI accuracy<br/>
                  • Include all relevant vital signs and clinical observations<br/>
                  • Review drug interactions in therapeutic recommendations<br/>
                  • Document your clinical reasoning alongside AI suggestions<br/>
                  • Use confidence scores to guide decision-making
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ClinicalDecisionSupport;
