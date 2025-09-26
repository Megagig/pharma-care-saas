import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MTRDocumentation from '../components/help/MTRDocumentation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Home as HomeIcon,
  HelpCircle as HelpIcon,
  BookOpen as GuideIcon,
  FileText as TrainingIcon,
  Book as ReferenceIcon
} from 'lucide-react';

// Mock components for KeyboardShortcuts and StatusIndicators
const KeyboardShortcuts = () => (
  <Card>
    <CardContent className="p-4">
      <h3 className="font-medium mb-2">Keyboard Shortcuts</h3>
      <ul className="text-sm space-y-1">
        <li>Ctrl + N: New MTR Session</li>
        <li>Ctrl + F: Find Patient</li>
        <li>Ctrl + S: Save Changes</li>
        <li>Ctrl + R: View Reports</li>
      </ul>
    </CardContent>
  </Card>
);

const StatusIndicators = () => (
  <Card>
    <CardContent className="p-4">
      <h3 className="font-medium mb-2">Status Indicators</h3>
      <ul className="text-sm space-y-1">
        <li>Green: Completed</li>
        <li>Yellow: In Progress</li>
        <li>Red: Needs Attention</li>
        <li>Blue: Scheduled</li>
      </ul>
    </CardContent>
  </Card>
);

const MTRHelp: React.FC = () => {
  const navigate = useNavigate();

  const quickStartGuides = [
    {
      title: 'First Time User',
      description: 'New to MTR? Start here for a complete introduction.',
      duration: '15 minutes',
      steps: ['System overview', 'Basic navigation', 'First MTR session'],
      color: 'primary' as const,
    },
    {
      title: 'Quick MTR Session',
      description: 'Fast-track guide for experienced users.',
      duration: '5 minutes',
      steps: [
        'Patient selection',
        'Key assessment points',
        'Documentation tips',
      ],
      color: 'secondary' as const,
    },
    {
      title: 'Advanced Features',
      description: 'Learn about advanced MTR capabilities.',
      duration: '20 minutes',
      steps: ['Custom templates', 'Bulk operations', 'Integration features'],
      color: 'success' as const,
    },
  ];

  const commonTasks = [
    { task: 'Start a new MTR session', shortcut: 'Ctrl + N', page: '/mtr' },
    { task: 'Search for patients', shortcut: 'Ctrl + F', page: '/patients' },
    { task: 'View MTR reports', shortcut: 'Ctrl + R', page: '/reports' },
    { task: 'Access help system', shortcut: 'Ctrl + ?', page: '/help' },
  ];

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center hover:text-foreground"
        >
          <HomeIcon className="w-4 h-4 mr-1" />
          Dashboard
        </button>
        <span>/</span>
        <span className="flex items-center text-foreground">
          <HelpIcon className="w-4 h-4 mr-1" />
          MTR Help & Documentation
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          MTR Help & Documentation
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          Comprehensive guide to using the Medication Therapy Review system
          effectively
        </p>

        <div className="flex gap-4 flex-wrap">
          <Button onClick={() => navigate('/mtr')} className="flex items-center gap-2">
            <GuideIcon className="w-4 h-4" />
            Start MTR Session
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              window.open('/docs/MTR_TRAINING_MATERIALS.md', '_blank')}
            className="flex items-center gap-2"
          >
            <TrainingIcon className="w-4 h-4" />
            Training Materials
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open('/docs/MTR_USER_GUIDE.md', '_blank')}
            className="flex items-center gap-2"
          >
            <ReferenceIcon className="w-4 h-4" />
            Full User Guide
          </Button>
        </div>
      </div>

      {/* Quick Start Guides */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Start Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickStartGuides.map((guide, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium">{guide.title}</h3>
                    <Badge>{guide.duration}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {guide.description}
                  </p>
                  <div>
                    <p className="text-sm font-medium mb-2">What you'll learn:</p>
                    <ul className="text-sm space-y-1 pl-4">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="list-disc">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Tasks */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Common Tasks & Shortcuts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {commonTasks.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium mb-2">{item.task}</p>
                  <Badge className="mb-2">
                    {item.shortcut}
                  </Badge>
                  <div>
                    <Button size="sm" onClick={() => navigate(item.page)}>
                      Go to Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Documentation */}
      <Card>
        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflow">Overview & Workflow</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="p-6">
            <MTRDocumentation section="workflow" />
          </TabsContent>

          <TabsContent value="best-practices" className="p-6">
            <MTRDocumentation section="best-practices" />
          </TabsContent>

          <TabsContent value="troubleshooting" className="p-6">
            <MTRDocumentation section="troubleshooting" />
          </TabsContent>

          <TabsContent value="reference" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <KeyboardShortcuts />
              <StatusIndicators />
            </div>
            <MTRDocumentation section="reference" />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Need additional help? Contact your system administrator or training
          coordinator.
        </p>
      </div>
    </div>
  );
};

export default MTRHelp;