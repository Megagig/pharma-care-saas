import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useWebVitals } from '../hooks/useWebVitals';
import { WebVitalsMetrics } from '../utils/WebVitalsMonitor';

interface WebVitalsSummary {
  period: string;
  metrics: {
    [key: string]: {
      p50: number;
      p75: number;
      p95: number;
    };
  };
  budgetStatus: {
    [key: string]: 'good' | 'needs-improvement' | 'poor';
  };
  totalSamples: number;
  lastUpdated: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'good':
      return 'bg-green-100 text-green-800';
    case 'needs-improvement':
      return 'bg-yellow-100 text-yellow-800';
    case 'poor':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatMetricValue = (metric: string, value: number) => {
  if (metric === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
};

const WebVitalsDashboard: React.FC = () => {
  const { metrics, isMonitoring, budgetViolations, startMonitoring, stopMonitoring, clearViolations } = useWebVitals({
    enabled: true,
    onBudgetExceeded: (entry, budget) => {
      console.warn(`Performance budget exceeded: ${entry.name} = ${entry.value} > ${budget}`);
    },
  });

  const [summary, setSummary] = useState<WebVitalsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/web-vitals/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch Web Vitals summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Web Vitals Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={isMonitoring ? 'default' : 'secondary'}>
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </Badge>
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? 'destructive' : 'default'}
            size="sm"
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
          <Button onClick={fetchSummary} variant="outline" size="sm" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Current Session Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Current Session Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(metrics).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {value ? formatMetricValue(key, value) : '-'}
                </div>
                <div className="text-sm text-gray-600">{key}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Summary ({summary.period})</CardTitle>
            <p className="text-sm text-gray-600">
              Based on {summary.totalSamples} samples • Last updated: {new Date(summary.lastUpdated).toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(summary.metrics).map(([metric, values]) => (
                <div key={metric} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{metric}</span>
                    <Badge className={getStatusColor(summary.budgetStatus[metric])}>
                      {summary.budgetStatus[metric]}
                    </Badge>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <div>
                      <span className="text-gray-600">P50:</span> {formatMetricValue(metric, values.p50)}
                    </div>
                    <div>
                      <span className="text-gray-600">P75:</span> {formatMetricValue(metric, values.p75)}
                    </div>
                    <div>
                      <span className="text-gray-600">P95:</span> {formatMetricValue(metric, values.p95)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Violations */}
      {budgetViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Performance Budget Violations
              <Button onClick={clearViolations} variant="outline" size="sm">
                Clear All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {budgetViolations.map((violation, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                  <div>
                    <span className="font-medium text-red-800">{violation.entry.name}</span>
                    <span className="text-red-600 ml-2">
                      {formatMetricValue(violation.entry.name, violation.entry.value)} exceeds budget of {formatMetricValue(violation.entry.name, violation.budget)}
                    </span>
                  </div>
                  <div className="text-xs text-red-600">
                    {new Date(violation.entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebVitalsDashboard;