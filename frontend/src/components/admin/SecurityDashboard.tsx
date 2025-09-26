import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { CardHeader } from '@/components/ui/card';

import { Spinner } from '@/components/ui/spinner';

import { Alert } from '@/components/ui/alert';

import { Separator } from '@/components/ui/separator';

interface SecurityEvent {
  id: string;
  type:
    | 'login'
    | 'failed_login'
    | 'suspicious_activity'
    | 'data_access'
    | 'configuration_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  user: string;
  ip: string;
  location: string;
  description: string;
}
interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  warningEvents: number;
  resolvedEvents: number;
  activeThreats: number;
}
const SecurityDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [securityMetrics, setSecurityMetrics] =
    useState<SecurityMetrics | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const addNotification = useUIStore((state) => state.addNotification);
  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real implementation, these would be separate API calls
      // For now, we'll mock the data structure
      const mockMetrics: SecurityMetrics = {
        totalEvents: 124,
        criticalEvents: 3,
        warningEvents: 12,
        resolvedEvents: 89,
        activeThreats: 1,
      };
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'failed_login',
          severity: 'high',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user: 'admin@example.com',
          ip: '192.168.1.100',
          location: 'Lagos, Nigeria',
          description: 'Multiple failed login attempts detected',
        },
        {
          id: '2',
          type: 'suspicious_activity',
          severity: 'critical',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user: 'user@example.com',
          ip: '10.0.0.5',
          location: 'Unknown',
          description: 'Unusual data access pattern detected',
        },
        {
          id: '3',
          type: 'configuration_change',
          severity: 'medium',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          user: 'superadmin@example.com',
          ip: '192.168.1.50',
          location: 'Abuja, Nigeria',
          description: 'Security settings updated',
        },
      ];
      setSecurityMetrics(mockMetrics);
      setSecurityEvents(mockEvents);
    } catch (err) {
      setError('Failed to load security data');
      addNotification({ 
        type: 'error',
        title: 'Error',
        message: 'Failed to load security dashboard data'}
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadSecurityData();
  }, []);
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'failed_login':
        return <ErrorIcon />;
      case 'suspicious_activity':
        return <WarningIcon />;
      case 'configuration_change':
        return <InfoIcon />;
      default:
        return <SecurityIcon />;
    }
  };
  if (loading) {
    return (
      <div
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <Alert severity="error" className="">
        {error}
      </Alert>
    );
  }
  return (
    <div>
      <div
        className=""
      >
        <div className="">
          <SecurityIcon className="" />
          <div  component="h1">
            Security Dashboard
          </div>
        </div>
        <Button
          
          startIcon={<RefreshIcon />}
          onClick={loadSecurityData}
        >
          Refresh
        </Button>
      </div>
      {/* Security Metrics */}
      <div container spacing={3} className="">
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent className="">
              <div  color="primary.main" gutterBottom>
                {securityMetrics?.totalEvents || 0}
              </div>
              <div  color="textSecondary">
                Total Events
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent className="">
              <div  color="error.main" gutterBottom>
                {securityMetrics?.criticalEvents || 0}
              </div>
              <div  color="textSecondary">
                Critical Alerts
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent className="">
              <div  color="warning.main" gutterBottom>
                {securityMetrics?.warningEvents || 0}
              </div>
              <div  color="textSecondary">
                Warnings
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent className="">
              <div  color="success.main" gutterBottom>
                {securityMetrics?.resolvedEvents || 0}
              </div>
              <div  color="textSecondary">
                Resolved
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent className="">
              <div  color="info.main" gutterBottom>
                {securityMetrics?.activeThreats || 0}
              </div>
              <div  color="textSecondary">
                Active Threats
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Security Events */}
      <div container spacing={3}>
        <div item xs={12} md={8}>
          <Card>
            <CardHeader
              title="Recent Security Events"
              subheader="Latest security activities and alerts"
            />
            <Separator />
            <CardContent>
              <List>
                {securityEvents.map((event) => (
                  <div key={event.id} className="">
                    <div className="">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div
                      primary={
                        <div
                          className=""
                        >
                          <div  className="">}
                            {event.description}
                          </div>
                          <Chip
                            label={event.severity}
                            size="small"
                            color={getSeverityColor(event.severity) as any}
                          />
                        </div>
                      }
                      secondary={
                        <div>
                          <div  color="textSecondary">}
                            User: {event.user} • IP: {event.ip} •{' '}
                            {event.location}
                          </div>
                          <div  color="textSecondary">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      }
                    />
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} md={4}>
          <Card className="">
            <CardHeader
              title="Security Status"
              subheader="Current system security posture"
            />
            <Separator />
            <CardContent>
              <div className="">
                <CheckCircleIcon
                  className=""
                />
                <div  gutterBottom>
                  System Secure
                </div>
                <div  color="textSecondary">
                  No critical vulnerabilities detected
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              title="Quick Actions"
              subheader="Security management tools"
            />
            <Separator />
            <CardContent>
              <div className="">
                <Button  fullWidth>
                  View All Alerts
                </Button>
                <Button  fullWidth>
                  Security Settings
                </Button>
                <Button  fullWidth>
                  Audit Logs
                </Button>
                <Button  fullWidth color="error">
                  Emergency Lockdown
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default SecurityDashboard;
