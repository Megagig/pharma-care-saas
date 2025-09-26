import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import LoadingSpinner from '../components/LoadingSpinner';
import MedicationAnalyticsPanel from '../components/medications/MedicationAnalyticsPanel';
import MedicationSettingsPanel from '../components/medications/MedicationSettingsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill as MedicationIcon, Plus as AddIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock hook for subscription status
const useSubscriptionStatus = () => {
  return {
    isActive: true,
    loading: false
  };
};

const Medications: React.FC = () => {
  const [tabValue, setTabValue] = useState('dashboard');
  const { isActive, loading } = useSubscriptionStatus();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isActive) {
    return (
      <div className="p-6">
        <Helmet>
          <title>Medications | PharmaCare</title>
        </Helmet>
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold">Medications</h1>
            <p className="text-gray-600">Manage patient medications, interactions, and adherence tracking</p>
          </div>
        </div>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <MedicationIcon className="h-16 w-16 mx-auto text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Premium Feature</h2>
            <p className="text-gray-600 mb-6">
              Advanced medication tracking, drug interaction checking, adherence
              monitoring, and prescription management features require a premium
              subscription.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild>
                <Link to="/subscriptions">Upgrade Now</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>Medication Management | PharmaCare</title>
      </Helmet>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Medication Management</h1>
          <p className="text-gray-600">Manage patient medications, interactions, and adherence tracking</p>
        </div>
        <Button asChild>
          <Link to="/patients?for=medications">
            <AddIcon className="mr-2 h-4 w-4" />
            Select Patient
          </Link>
        </Button>
      </div>
      <Card>
        <div className="p-4">
          <Tabs value={tabValue} onValueChange={setTabValue}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Medication Dashboard</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Please select a patient to view their medication dashboard.
              </p>
              <div className="flex space-x-4">
                <Button asChild>
                  <Link to="/patients">
                    <AddIcon className="mr-2 h-4 w-4" />
                    Select Patient
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/medications/dashboard">
                    View Medications Dashboard
                  </Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div>
                <MedicationAnalyticsPanel patientId="system" />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div>
                <MedicationSettingsPanel patientId="system" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default Medications;