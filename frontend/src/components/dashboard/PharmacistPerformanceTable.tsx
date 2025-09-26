import DashboardChart from './DashboardChart';

import { Card, CardContent, Tooltip, Progress, Avatar } from '@/components/ui/button';

interface PharmacistPerformance {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  metrics: {
    totalMTRs: number;
    completedMTRs: number;
    completionRate: number;
    averageTime: number; // in hours
    patientSatisfaction: number; // 1-5 scale
    clinicalInterventions: number;
    costSavings: number; // in currency
  };
  trends: {
    mtrTrend: number; // percentage change
    satisfactionTrend: number;
    interventionTrend: number;
  };
  recentActivity: {
    lastMTR: string;
    lastIntervention: string;
  };
}
const mockPharmacistData: PharmacistPerformance[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@pharmacare.com',
    metrics: {
      totalMTRs: 45,
      completedMTRs: 42,
      completionRate: 93.3,
      averageTime: 2.5,
      patientSatisfaction: 4.8,
      clinicalInterventions: 28,
      costSavings: 15420,
    },
    trends: {
      mtrTrend: 12.5,
      satisfactionTrend: 5.2,
      interventionTrend: 8.7,
    },
    recentActivity: {
      lastMTR: '2024-01-15',
      lastIntervention: '2024-01-14',
    },
  },
  {
    id: '2',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@pharmacare.com',
    metrics: {
      totalMTRs: 38,
      completedMTRs: 35,
      completionRate: 92.1,
      averageTime: 3.1,
      patientSatisfaction: 4.6,
      clinicalInterventions: 22,
      costSavings: 12850,
    },
    trends: {
      mtrTrend: 8.3,
      satisfactionTrend: -2.1,
      interventionTrend: 15.4,
    },
    recentActivity: {
      lastMTR: '2024-01-14',
      lastIntervention: '2024-01-13',
    },
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@pharmacare.com',
    metrics: {
      totalMTRs: 52,
      completedMTRs: 48,
      completionRate: 92.3,
      averageTime: 2.8,
      patientSatisfaction: 4.9,
      clinicalInterventions: 35,
      costSavings: 18750,
    },
    trends: {
      mtrTrend: 18.2,
      satisfactionTrend: 7.8,
      interventionTrend: 22.1,
    },
    recentActivity: {
      lastMTR: '2024-01-15',
      lastIntervention: '2024-01-15',
    },
  },
  {
    id: '4',
    name: 'Dr. James Wilson',
    email: 'james.wilson@pharmacare.com',
    metrics: {
      totalMTRs: 31,
      completedMTRs: 28,
      completionRate: 90.3,
      averageTime: 3.5,
      patientSatisfaction: 4.4,
      clinicalInterventions: 18,
      costSavings: 9680,
    },
    trends: {
      mtrTrend: -5.2,
      satisfactionTrend: 3.1,
      interventionTrend: -8.7,
    },
    recentActivity: {
      lastMTR: '2024-01-12',
      lastIntervention: '2024-01-11',
    },
  },
];
const PharmacistPerformanceTable: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [pharmacistData, setPharmacistData] = useState<PharmacistPerformance[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPharmacistData(mockPharmacistData);
      setLoading(false);
    }, 1000);
  }, []);
  const getPerformanceColor = (
    value: number,
    type: 'completion' | 'satisfaction' | 'trend'
  ) => {
    switch (type) {
      case 'completion':
        if (value >= 95) return theme.palette.success.main;
        if (value >= 90) return theme.palette.warning.main;
        return theme.palette.error.main;
      case 'satisfaction':
        if (value >= 4.5) return theme.palette.success.main;
        if (value >= 4.0) return theme.palette.warning.main;
        return theme.palette.error.main;
      case 'trend':
        return value >= 0
          ? theme.palette.success.main
          : theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIcon
        key={index}
        className=""
      />
    ));
  };
  // Prepare chart data
  const performanceChartData = pharmacistData.map((pharmacist) => ({ 
    name: pharmacist.name.split(' ')[1], // Last name
    completionRate: pharmacist.metrics.completionRate,
    satisfaction: pharmacist.metrics.patientSatisfaction * 20, // Scale to 100
    interventions: pharmacist.metrics.clinicalInterventions}
  }));
  const costSavingsData = pharmacistData.map((pharmacist) => ({ 
    name: pharmacist.name.split(' ')[1],
    value: pharmacist.metrics.costSavings}
  }));
  if (loading) {
    return (
      <div className="">
        <div  className="">
          Pharmacist Performance
        </div>
        <Card>
          <CardContent>
            <div className="">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className=""
                >
                  <div
                    className=""
                  />
                  <div className="">
                    <div
                      className=""
                    />
                    <div
                      className=""
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <motion.div
      
      >
      <div className="">
        <div  className="">
          Pharmacist Performance
        </div>
        {/* Performance Charts */}
        <div
          className="">
          <div className="">
            <DashboardChart
              title="Performance Metrics Comparison"
              data={performanceChartData}
              type="bar"
              height={350}
              colors={[
                theme.palette.primary.main,
                theme.palette.success.main,
                theme.palette.warning.main,}
              ]}
              subtitle="Comparative performance analysis"
              showLegend={true}
              interactive={true}
            />
          </div>
          <div className="">
            <DashboardChart
              title="Cost Savings by Pharmacist"
              data={costSavingsData}
              type="pie"
              height={350}
              colors={[
                theme.palette.primary.main,
                theme.palette.secondary.main,
                theme.palette.success.main,
                theme.palette.warning.main,}
              ]}
              subtitle="Individual cost savings contribution"
              showLegend={true}
              interactive={true}
            />
          </div>
        </div>
        {/* Performance Table */}
        <Card>
          <CardContent className="">
            <TableContainer  >
              <Table>
                <TableHead>
                  <TableRow
                    className=""
                  >
                    <TableCell className="">
                      Pharmacist
                    </TableCell>
                    <TableCell align="center" className="">
                      MTRs
                    </TableCell>
                    <TableCell align="center" className="">
                      Completion Rate
                    </TableCell>
                    <TableCell align="center" className="">
                      Avg. Time
                    </TableCell>
                    <TableCell align="center" className="">
                      Satisfaction
                    </TableCell>
                    <TableCell align="center" className="">
                      Interventions
                    </TableCell>
                    <TableCell align="center" className="">
                      Cost Savings
                    </TableCell>
                    <TableCell align="center" className="">
                      Trends
                    </TableCell>
                    <TableCell align="center" className="">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pharmacistData.map((pharmacist, index) => (
                    <motion.tr
                      key={pharmacist.id}
                      
                      
                      
                      
                      className="">
                      <TableCell>
                        <div display="flex" alignItems="center">
                          <Avatar
                            className=""
                          >
                            {pharmacist.avatar ? (
                              <img
                                src={pharmacist.avatar}
                                alt={pharmacist.name}
                              />
                            ) : (
                              <PersonIcon />
                            )}
                          </Avatar>
                          <div>
                            <div
                              
                              className=""
                            >
                              {pharmacist.name}
                            </div>
                            <div
                              
                              color="text.secondary"
                            >
                              {pharmacist.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <div>
                          <div
                            
                            className=""
                          >
                            {pharmacist.metrics.completedMTRs}/
                            {pharmacist.metrics.totalMTRs}
                          </div>
                          <div  color="text.secondary">
                            Total/Completed
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <div>
                          <Chip
                            label={`${pharmacist.metrics.completionRate.toFixed(
                              1}
                            )}%`}
                            color={
                              pharmacist.metrics.completionRate >= 95
                                ? 'success'
                                : pharmacist.metrics.completionRate >= 90
                                ? 'warning'
                                : 'error'}
                            }
                            size="small"
                            className=""
                          />
                          <Progress
                            
                            className="" />
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <div
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <ScheduleIcon
                            className=""
                          />
                          <div >
                            {pharmacist.metrics.averageTime}h
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <div
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                        >
                          <div display="flex" alignItems="center" mb={0.5}>
                            {renderStars(
                              pharmacist.metrics.patientSatisfaction
                            )}
                          </div>
                          <div  color="text.secondary">
                            {pharmacist.metrics.patientSatisfaction.toFixed(1)}
                            /5.0
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <div
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <AssignmentIcon
                            className=""
                          />
                          <div
                            
                            className=""
                          >
                            {pharmacist.metrics.clinicalInterventions}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <div
                          
                          className=""
                        >
                          {formatCurrency(pharmacist.metrics.costSavings)}
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <div
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          gap={0.5}
                        >
                          <div display="flex" alignItems="center">
                            {pharmacist.trends.mtrTrend >= 0 ? (
                              <TrendingUpIcon
                                className=""
                              />
                            ) : (
                              <TrendingDownIcon
                                className=""
                              />
                            )}
                            <div
                              
                              className=""
                            >
                              {pharmacist.trends.mtrTrend > 0 ? '+' : ''}
                              {pharmacist.trends.mtrTrend.toFixed(1)}%
                            </div>
                          </div>
                          <div  color="text.secondary">
                            MTRs
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        {/* Summary Cards */}
        <div
          className="">
          <div className="">
            <Card>
              <CardContent>
                <div display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon className="" />
                  <div  className="">
                    Avg. Completion
                  </div>
                </div>
                <div
                  
                  className=""
                >
                  {(
                    pharmacistData.reduce(
                      (sum, p) => sum + p.metrics.completionRate,
                      0
                    ) / pharmacistData.length
                  ).toFixed(1)}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card>
              <CardContent>
                <div display="flex" alignItems="center" mb={1}>
                  <StarIcon className="" />
                  <div  className="">
                    Avg. Satisfaction
                  </div>
                </div>
                <div
                  
                  className=""
                >
                  {(
                    pharmacistData.reduce(
                      (sum, p) => sum + p.metrics.patientSatisfaction,
                      0
                    ) / pharmacistData.length
                  ).toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card>
              <CardContent>
                <div display="flex" alignItems="center" mb={1}>
                  <AssignmentIcon className="" />
                  <div  className="">
                    Total Interventions
                  </div>
                </div>
                <div
                  
                  className=""
                >
                  {pharmacistData.reduce(
                    (sum, p) => sum + p.metrics.clinicalInterventions,
                    0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card>
              <CardContent>
                <div display="flex" alignItems="center" mb={1}>
                  <TrendingUpIcon className="" />
                  <div  className="">
                    Total Savings
                  </div>
                </div>
                <div
                  
                  className=""
                >
                  {formatCurrency(
                    pharmacistData.reduce(
                      (sum, p) => sum + p.metrics.costSavings,
                      0
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default PharmacistPerformanceTable;
