
import { Card, CardContent, Tooltip, Progress } from '@/components/ui/button';

interface InterventionEffectivenessChartProps {
  data: InterventionEffectivenessReport;
  loading?: boolean;
}

const InterventionEffectivenessChart: React.FC = ({ data, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <div  gutterBottom>
            Intervention Effectiveness
          </div>
          <Progress />
        </CardContent>
      </Card>
    );
  }

  const outcomeData = [
    {
      name: 'Accepted',
      value: data.summary.acceptedInterventions,
      color: '#4CAF50',
    },
    {
      name: 'Rejected',
      value: data.summary.rejectedInterventions,
      color: '#F44336',
    },
    {
      name: 'Modified',
      value: data.summary.modifiedInterventions,
      color: '#FF9800',
    },
    {
      name: 'Pending',
      value: data.summary.pendingInterventions,
      color: '#2196F3',
    },
  ];

  const getAcceptanceRateColor = (rate: number) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'warning';
    return 'error';
  };

  return (
    <div container spacing={3}>
      {/* Summary Card */}
      <div item xs={12}>
        <Card>
          <CardContent>
            <div className="">
              <TrendingUpIcon className="" />
              <div >
                Intervention Effectiveness Summary
              </div>
            </div>

            <div container spacing={2}>
              <div item xs={12} sm={6} md={3}>
                <div
                  className=""
                >
                  <div  color="primary.main">
                    {data.summary.totalInterventions}
                  </div>
                  <div  color="textSecondary">
                    Total Interventions
                  </div>
                </div>
              </div>

              <div item xs={12} sm={6} md={3}>
                <div
                  className=""
                >
                  <div
                    
                    color={`${getAcceptanceRateColor(
                      data.summary.overallAcceptanceRate}
                    )}.main`}
                  >
                    {data.summary.overallAcceptanceRate.toFixed(1)}%
                  </div>
                  <div  color="textSecondary">
                    Acceptance Rate
                  </div>
                </div>
              </div>

              <div item xs={12} sm={6} md={3}>
                <div
                  className=""
                >
                  <div  color="success.main">
                    {data.summary.acceptedInterventions}
                  </div>
                  <div  color="textSecondary">
                    Accepted
                  </div>
                </div>
              </div>

              <div item xs={12} sm={6} md={3}>
                <div
                  className=""
                >
                  <div  color="warning.main">
                    {data.summary.pendingInterventions}
                  </div>
                  <div  color="textSecondary">
                    Pending
                  </div>
                </div>
              </div>
            </div>

            {/* Outcome Status Chips */}
            <div className="">
              <div  gutterBottom>
                Intervention Outcomes
              </div>
              <div className="">
                <Chip
                  label={`Accepted: ${data.summary.acceptedInterventions}`}
                  color="success"
                  
                  size="small"
                />
                <Chip
                  label={`Rejected: ${data.summary.rejectedInterventions}`}
                  color="error"
                  
                  size="small"
                />
                <Chip
                  label={`Modified: ${data.summary.modifiedInterventions}`}
                  color="warning"
                  
                  size="small"
                />
                <Chip
                  label={`Pending: ${data.summary.pendingInterventions}`}
                  color="info"
                  
                  size="small"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Distribution Pie Chart */}
      <div item xs={12} md={6}>
        <Card>
          <CardContent>
            <div  gutterBottom>
              Intervention Outcome Distribution
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Effectiveness by Type */}
      <div item xs={12} md={6}>
        <Card>
          <CardContent>
            <div  gutterBottom>
              Effectiveness by Intervention Type
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.effectiveness.byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="acceptanceRate"
                  fill="#8884d8"
                  name="Acceptance Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Effectiveness by Category */}
      <div item xs={12} md={6}>
        <Card>
          <CardContent>
            <div  gutterBottom>
              Effectiveness by Category
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.effectiveness.byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="acceptanceRate"
                  fill="#82ca9d"
                  name="Acceptance Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Pharmacists */}
      <div item xs={12} md={6}>
        <Card>
          <CardContent>
            <div  gutterBottom>
              Top Performing Pharmacists
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.pharmacistPerformance.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pharmacistName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalInterventions"
                  fill="#8884d8"
                  name="Total Interventions"
                />
                <Bar
                  dataKey="acceptanceRate"
                  fill="#82ca9d"
                  name="Acceptance Rate %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterventionEffectivenessChart;
