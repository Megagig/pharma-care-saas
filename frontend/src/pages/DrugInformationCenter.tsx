import React, { useState } from 'react';
import ModulePage from '../components/ModulePage';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper, 
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import DrugSearch from '../components/DrugSearch';
import DrugDetails from '../components/DrugDetails';
import DrugInteractions from '../components/DrugInteractions';
import AdverseEffects from '../components/AdverseEffects';
import Formulary from '../components/Formulary';
import TherapyPlanManager from '../components/TherapyPlan';
import { useDrugStore } from '../stores/drugStore';
import type { ModuleInfo } from '../types/moduleTypes';

const DrugInformationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { selectedDrug, searchError } = useDrugStore();

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
    status: 'active',
    estimatedRelease: 'Available now',
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDrugSelect = (drug: any) => {
    setActiveTab(1); // Switch to details tab when a drug is selected
  };

  return (
    <ModulePage
      moduleInfo={moduleInfo}
      icon={MenuBookIcon}
      gradient="linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)"
    >
      <Box className="drug-information-center">
        <Box component="div" sx={{ width: '100%' }}>
          <Box component="div" sx={{ width: '100%' }}>
            <Paper elevation={3} className="p-4">
              <Typography variant="h5" className="mb-4">
                Drug Information Center
              </Typography>
              
              <DrugSearch onDrugSelect={handleDrugSelect} />
              
              {searchError && (
                <Alert severity="error" className="mb-4">
                  {searchError}
                </Alert>
              )}
              
              {selectedDrug ? (
                <>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                    <Tabs 
                      value={activeTab} 
                      onChange={handleTabChange} 
                      variant="scrollable"
                      scrollButtons="auto"
                    >
                      <Tab label="Overview" />
                      <Tab label="Monograph" />
                      <Tab label="Interactions" />
                      <Tab label="Adverse Effects" />
                      <Tab label="Formulary" />
                      <Tab label="Therapy Plan" />
                    </Tabs>
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    {activeTab === 0 && (
                      <Box>
                        <Typography variant="h6" className="mb-3">
                          {selectedDrug.name}
                        </Typography>
                        <Typography variant="body1" className="mb-3">
                          RxCUI: {selectedDrug.rxCui}
                        </Typography>
                        <Alert severity="info">
                          Select other tabs to view detailed drug information
                        </Alert>
                      </Box>
                    )}
                    
                    {activeTab === 1 && <DrugDetails drugId={selectedDrug.rxCui} />}
                    {activeTab === 2 && <DrugInteractions rxcui={selectedDrug.rxCui} drugName={selectedDrug.name} />}
                    {activeTab === 3 && <AdverseEffects drugId={selectedDrug.rxCui} drugName={selectedDrug.name} />}
                    {activeTab === 4 && <Formulary drugId={selectedDrug.rxCui} drugName={selectedDrug.name} />}
                    {activeTab === 5 && <TherapyPlanManager />}
                  </Box>
                </>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <Typography variant="h6" color="textSecondary">
                    Search for a drug to view detailed information
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </ModulePage>
  );
};

export default DrugInformationCenter;