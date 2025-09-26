
import { Card, CardContent, CardHeader, Progress, Avatar } from '@/components/ui/button';

interface PatientAnalyticsProps {
  patientId: string;
}
const PatientAnalytics: React.FC<PatientAnalyticsProps> = () => {
  // Mock analytics data
  const analytics = {
    totalVisits: 12,
    totalAssessments: 8,
    medicationAdherence: 85,
    dtpResolutionRate: 75,
    averageVitals: {
      bloodPressure: { systolic: 128, diastolic: 82 },
      heartRate: 72,
      temperature: 36.8,
    },
    trends: {
      bloodPressure: 'improving',
      weight: 'stable',
      adherence: 'good',
    },
    recentMilestones: [
      {
        id: 1,
        date: new Date().toISOString(),
        type: 'assessment',
        description: 'Clinical assessment completed',
      },
      {
        id: 2,
        date: new Date(Date.now() - 86400000).toISOString(),
        type: 'medication',
        description: 'Medication regimen updated',
      },
    ],
  };
  return (
    <div className="">
      {/* Header */}
      <div className="">
        <div
          
          component="h1"
          className=""
        >
          <AssessmentIcon color="primary" />
          Patient Analytics
        </div>
        <div  color="text.secondary">
          Comprehensive health insights and trend analysis
        </div>
      </div>
      {/* Key Metrics */}
      <div className="">
        <div className="">
          <Card>
            <CardContent>
              <div className="">
                <Avatar className="">
                  <ScheduleIcon />
                </Avatar>
                <div>
                  <div  className="">
                    {analytics.totalVisits}
                  </div>
                  <div  color="text.secondary">
                    Total Visits
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="">
          <Card>
            <CardContent>
              <div className="">
                <Avatar className="">
                  <AssessmentIcon />
                </Avatar>
                <div>
                  <div  className="">
                    {analytics.totalAssessments}
                  </div>
                  <div  color="text.secondary">
                    Clinical Assessments
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="">
          <Card>
            <CardContent>
              <div className="">
                <Avatar className="">
                  <PersonIcon />
                </Avatar>
                <div>
                  <div  className="">
                    {analytics.medicationAdherence}%
                  </div>
                  <div  color="text.secondary">
                    Medication Adherence
                  </div>
                </div>
              </div>
              <Progress
                
                className=""
                color={
                  analytics.medicationAdherence >= 80
                    ? 'success'
                    : analytics.medicationAdherence >= 60
                    ? 'warning'
                    : 'error'}
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Clinical Trends */}
      <div className="">
        <div className="">
          <Card>
            <CardHeader
              title="Clinical Trends"
              
              avatar={<TimelineIcon color="primary" />}
            />
            <CardContent>
              <div spacing={3}>
                <div>
                  <div
                    className=""
                  >
                    <div  color="text.secondary">
                      Blood Pressure Trend
                    </div>
                    <Chip
                      label={analytics.trends.bloodPressure}
                      size="small"
                      color="success"
                      
                    />
                  </div>
                  <div >
                    {analytics.averageVitals.bloodPressure.systolic}/
                    {analytics.averageVitals.bloodPressure.diastolic} mmHg avg
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="">
          <Card>
            <CardHeader
              title="Risk Assessment"
              
              avatar={<WarningIcon color="warning" />}
            />
            <CardContent>
              <div
                className=""
              >
                <CheckCircleIcon color="success" />
                <div>
                  <div  color="success.main">
                    Low Risk Profile
                  </div>
                  <div  color="text.secondary">
                    No immediate concerns identified
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Recent Milestones */}
      <Card>
        <CardHeader
          title="Recent Milestones"
          
          avatar={<TrendingUpIcon color="primary" />}
        />
        <CardContent>
          <List>
            {analytics.recentMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="">
                <div>
                  <Avatar
                    className=""
                  >
                    {milestone.type[0].toUpperCase()}
                  </Avatar>
                </div>
                <div
                  primary={milestone.description}
                  secondary={new Date(milestone.date).toLocaleDateString()}
                  
                  
                />
              </div>
            ))}
          </List>
        </CardContent>
      </Card>
    </div>
  );
};
export default PatientAnalytics;
