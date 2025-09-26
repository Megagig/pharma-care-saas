import { Card, CardContent, Spinner, Progress, Skeleton } from '@/components/ui/button';
// Lazy Loading Component for Report Modules with Beautiful Loading States
// Lazy load all report components
const PatientOutcomeReport = lazy(
  () => import('../reports/PatientOutcomeReport')
);
const PharmacistInterventionReport = lazy(
  () => import('../reports/PharmacistInterventionReport')
);
const TherapyEffectivenessReport = lazy(
  () => import('../reports/TherapyEffectivenessReport')
);
const QualityImprovementReport = lazy(
  () => import('../reports/QualityImprovementReport')
);
const RegulatoryComplianceReport = lazy(
  () => import('../reports/RegulatoryComplianceReport')
);
const CostEffectivenessReport = lazy(
  () => import('../reports/CostEffectivenessReport')
);
const TrendForecastingReport = lazy(
  () => import('../reports/TrendForecastingReport')
);
const OperationalEfficiencyReport = lazy(
  () => import('../reports/OperationalEfficiencyReport')
);
const MedicationInventoryReport = lazy(
  () => import('../reports/MedicationInventoryReport')
);
const PatientDemographicsReport = lazy(
  () => import('../reports/PatientDemographicsReport')
);
const AdverseEventReport = lazy(() => import('../reports/AdverseEventReport'));
// Report component mapping
const reportComponents: Record<ReportType, ComponentType<any>> = {
  [ReportType.PATIENT_OUTCOMES]: PatientOutcomeReport,
  [ReportType.PHARMACIST_INTERVENTIONS]: PharmacistInterventionReport,
  [ReportType.THERAPY_EFFECTIVENESS]: TherapyEffectivenessReport,
  [ReportType.QUALITY_IMPROVEMENT]: QualityImprovementReport,
  [ReportType.REGULATORY_COMPLIANCE]: RegulatoryComplianceReport,
  [ReportType.COST_EFFECTIVENESS]: CostEffectivenessReport,
  [ReportType.TREND_FORECASTING]: TrendForecastingReport,
  [ReportType.OPERATIONAL_EFFICIENCY]: OperationalEfficiencyReport,
  [ReportType.MEDICATION_INVENTORY]: MedicationInventoryReport,
  [ReportType.PATIENT_DEMOGRAPHICS]: PatientDemographicsReport,
  [ReportType.ADVERSE_EVENTS]: AdverseEventReport,
  [ReportType.CUSTOM_TEMPLATES]: PatientOutcomeReport, // Fallback for now
};
interface LazyReportLoaderProps {
  reportType: ReportType;
  [key: string]: any; // Allow passing through other props
}
// Beautiful skeleton loading component
const ReportSkeleton: React.FC<{ reportType: ReportType }> = ({ 
  reportType
}) => {
  const theme = useTheme();
  return (
    <div>
      <div className="">
        {/* Header skeleton */}
        <div className="">
          <div className="">
            <Skeleton
              
              width={40}
              height={40}
              className=""
            />
            <div className="">
              <Skeleton  width="60%" height={32} />
              <Skeleton  width="40%" height={20} />
            </div>
          </div>
          <Progress
            className="" ${theme.palette.secondary.main})`,
              },
          />
        </div>
        {/* KPI Cards skeleton */}
        <div container spacing={3} className="">
          {[1, 2, 3, 4].map((i) => (
            <div item xs={12} sm={6} md={3} key={i}>
              <Card
                className="">
                <CardContent>
                  <div
                    className=""
                  >
                    <Skeleton  width="60%" height={20} />
                    <Skeleton
                      
                      width={60}
                      height={24}
                      className=""
                    />
                  </div>
                  <Skeleton
                    
                    width="80%"
                    height={40}
                    className=""
                  />
                  <div className="">
                    <Skeleton
                      
                      width={16}
                      height={16}
                      className=""
                    />
                    <Skeleton  width="50%" height={16} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div container spacing={3}>
          <div item xs={12} md={8}>
            <div className="">
              <div
                className=""
              >
                <Skeleton  width="30%" height={24} />
                <div className="">
                  <Skeleton
                    
                    width={80}
                    height={32}
                    className=""
                  />
                  <Skeleton
                    
                    width={80}
                    height={32}
                    className=""
                  />
                </div>
              </div>
              <Skeleton
                
                width="100%"
                height={300}
                className="" ${theme.palette.grey[200]})`,
              />
            </div>
          </div>
          <div item xs={12} md={4}>
            <div className="">
              <Skeleton  width="60%" height={24} className="" />
              <div className="">
                <Skeleton  width={200} height={200} />
              </div>
              <div className="">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="">
                    <Skeleton
                      
                      width={12}
                      height={12}
                      className=""
                    />
                    <Skeleton  width="70%" height={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Additional content skeleton */}
        <div className="">
          <div container spacing={3}>
            {[1, 2].map((i) => (
              <div item xs={12} md={6} key={i}>
                <div className="">
                  <Skeleton
                    
                    width="50%"
                    height={24}
                    className=""
                  />
                  <Skeleton
                    
                    width="100%"
                    height={150}
                    className=""
                  />
                  <div className="">
                    <Skeleton
                      
                      width={60}
                      height={20}
                      className=""
                    />
                    <Skeleton
                      
                      width={60}
                      height={20}
                      className=""
                    />
                    <Skeleton
                      
                      width={60}
                      height={20}
                      className=""
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// Enhanced loading component with progress indicator
const ReportLoadingState: React.FC<{ reportType: ReportType }> = ({ 
  reportType
}) => {
  const theme = useTheme();
  const [progress, setProgress] = React.useState(0);
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(prevProgress + diff, 100);
      });
    }, 200);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return (
    <div
      className=""
    >
      {/* Loading overlay */}
      <div
        className="">
        <div className="">
          <AssessmentIcon
            className=""
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
          />
          <div>
            <div  color="primary" gutterBottom>
              Loading Report
            </div>
            <div  color="text.secondary">
              Preparing {reportType.replace(/-/g, ' ')} data...
            </div>
          </div>
        </div>
        <div className="">
          <Progress
            
            className="" ${theme.palette.secondary.main})`,
              },
          />
        </div>
        <div  color="text.secondary">
          {Math.round(progress)}% complete
        </div>
        <div className="">
          <Spinner size={16} className="" />
          <div  color="text.secondary">
            Optimizing visualizations...
          </div>
        </div>
      </div>
      {/* Background skeleton */}
      <ReportSkeleton reportType={reportType} />
    </div>
  );
};
// Error boundary for lazy loading
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; reportType: ReportType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; reportType: ReportType }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className=""
        >
          <AssessmentIcon className="" />
          <div  color="error" gutterBottom>
            Failed to Load Report
          </div>
          <div  color="text.secondary" className="">
            There was an error loading the{' '}
            {this.props.reportType.replace(/-/g, ' ')} report.
          </div>
          <div className="">
            <button
              onClick={() => this.setState({ hasError: false })}
              >
              Retry
            </button>
            <button
              onClick={() => window.location.reload()}
              >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// Main lazy report loader component
const LazyReportLoader: React.FC<LazyReportLoaderProps> = ({ 
  reportType,
  ...props })
}) => {
  const ReportComponent = reportComponents[reportType];
  if (!ReportComponent) {
    return (
      <div className="">
        <div  color="error" gutterBottom>
          Report Not Found
        </div>
        <div  color="text.secondary">
          The requested report type "{reportType}" is not available.
        </div>
      </div>
    );
  }
  return (
    <LazyLoadErrorBoundary reportType={reportType}>
      <Suspense fallback={<ReportLoadingState reportType={reportType} />}>
        <ReportComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};
export default LazyReportLoader;
