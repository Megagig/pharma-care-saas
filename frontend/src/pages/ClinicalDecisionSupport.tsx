import React, { useState } from 'react';
import DiagnosticModule from '../components/DiagnosticModule';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Brain as PsychologyIcon, Info as InfoIcon } from 'lucide-react';
import { ModuleInfo } from '@/types/moduleTypes';
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
  const handleTabChange = (newValue: string) => {
    setActiveTab(Number(newValue));
  };
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Module Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <PsychologyIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {moduleInfo.title}
            </h1>
            <p className="text-gray-600 mt-2">
              {moduleInfo.purpose}
            </p>
          </div>
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="mb-6">
        <Tabs value={activeTab.toString()} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="0" className="flex items-center space-x-2">
              <PsychologyIcon className="h-4 w-4" />
              <span>AI Diagnostic Tool</span>
            </TabsTrigger>
            <TabsTrigger value="1" className="flex items-center space-x-2">
              <InfoIcon className="h-4 w-4" />
              <span>How to Use</span>
            </TabsTrigger>
          </TabsList>
          {/* Content */}
          <TabsContent value="0" className="mt-6">
            <DiagnosticModule />
          </TabsContent>
          <TabsContent value="1" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <InfoIcon className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-semibold text-gray-900">
                    How to Use Clinical Decision Support
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-4">
                      Step-by-Step Usage Guide
                    </h3>
                    <ol className="space-y-4">
                      <li className="flex-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            1
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Select Patient
                          </h4>
                          <p className="text-gray-600">
                            Choose the patient from the dropdown menu. This ensures the AI analysis is contextualized with the patient's medical history.
                          </p>
                        </div>
                      </li>
                      <li className="flex-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            2
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Input Symptoms
                          </h4>
                          <p className="text-gray-600">
                            Add both subjective symptoms (patient-reported) and objective findings (clinical observations). Use the "Add Subjective" and "Add Objective" buttons to categorize symptoms appropriately.
                          </p>
                        </div>
                      </li>
                      <li className="flex-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            3
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Clinical Details
                          </h4>
                          <p className="text-gray-600">
                            Specify the duration (e.g., "3 days", "2 weeks"), severity (mild/moderate/severe), and onset type (acute/chronic/subacute) of symptoms.
                          </p>
                        </div>
                      </li>
                      <li className="flex-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            4
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Vital Signs
                          </h4>
                          <p className="text-gray-600">
                            Enter current vital signs including blood pressure, heart rate, temperature, and oxygen saturation. This data helps the AI assess severity and urgency.
                          </p>
                        </div>
                      </li>
                      <li className="flex-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            5
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Generate Analysis
                          </h4>
                          <p className="text-gray-600">
                            Click "Generate AI Analysis" to receive comprehensive diagnostic insights. The system will prompt for patient consent before proceeding.
                          </p>
                        </div>
                      </li>
                      <li className="flex-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                            6
                          </div>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            Review Results
                          </h4>
                          <p className="text-gray-600">
                            Examine the AI-generated differential diagnoses, red flags, recommended tests, and therapeutic options. Use these as clinical decision support - not replacement for professional judgment.
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>
                  <Alert className="bg-blue-50 border-blue-200">
                    <div className="font-semibold text-blue-900 mb-2">
                      Important Notes:
                    </div>
                    <div className="text-blue-800 space-y-1">
                      <p>• This tool provides clinical decision support and should not replace professional medical judgment</p>
                      <p>• Always verify AI recommendations with current clinical guidelines</p>
                      <p>• Patient consent is required before generating AI analysis</p>
                      <p>• Red flags require immediate attention and possible escalation</p>
                    </div>
                  </Alert>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-600 mb-3">
                      Best Practices
                    </h4>
                    <div className="text-gray-700 space-y-1">
                      <p>• Be thorough in symptom documentation for better AI accuracy</p>
                      <p>• Include all relevant vital signs and clinical observations</p>
                      <p>• Review drug interactions in therapeutic recommendations</p>
                      <p>• Document your clinical reasoning alongside AI suggestions</p>
                      <p>• Use confidence scores to guide decision-making</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
export default ClinicalDecisionSupport;
