import { useLocation, useParams, Link, Routes, Route, Navigate } from 'react-router-dom';

// Import components
import ClinicalInterventionDashboard from './ClinicalInterventionDashboard';
import ClinicalInterventionsList from './ClinicalInterventionsList';
import ClinicalInterventionForm from './ClinicalInterventionForm';
import ClinicalInterventionDetails from './ClinicalInterventionDetails';
import PatientInterventions from './PatientInterventions';
import ClinicalInterventionReports from './ClinicalInterventionReports';
import ClinicalInterventionAuditTrail from './ClinicalInterventionAuditTrail';
import ClinicalInterventionComplianceReport from './ClinicalInterventionComplianceReport';

// Mock components for now
const MockTabs = ({ children, value, ...props }: any) => (
  <div {...props} className={`w-full ${props.className || ''}`}>
    {React.Children.map(children, (child, index) => {
      if (React.isValidElement(child) && child.type === MockTabsList) {
        return React.cloneElement(child as React.ReactElement<any>, {
          value,
          ...(child.props || {})
        });
      }
      return child;
    })}
  </div>
);

const MockTabsList = ({ children, value, ...props }: any) => (
  <div {...props} className={`grid w-full grid-cols-7 border-b ${props.className || ''}`}>
    {React.Children.map(children, (child, index) => {
      if (React.isValidElement(child) && child.type === MockTabsTrigger) {
        return React.cloneElement(child as React.ReactElement<any>, {
          value,
          ...(child.props || {})
        });
      }
      return child;
    })}
  </div>
);

const MockTabsTrigger = ({ children, value, asChild, ...props }: any) => {
  const isActive = value === props.value;
  const className = `flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 ${isActive
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } ${props.className || ''}`;

  if (asChild) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <button {...props} className={className}>
      {children}
    </button>
  );
};

const MockTabsContent = ({ children, value, ...props }: any) => (
  <div {...props} className={`mt-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockButton = ({ children, ...props }: any) => (
  <button {...props} className={`px-3 py-1 rounded-md ${props.className || ''}`}>
    {children}
  </button>
);

const MockCard = ({ children, ...props }: any) => (
  <div {...props} className={`bg-white dark:bg-gray-800 rounded-lg shadow ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardContent = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardHeader = ({ children, ...props }: any) => (
  <div {...props} className={`p-6 border-b ${props.className || ''}`}>
    {children}
  </div>
);

const MockCardTitle = ({ children, ...props }: any) => (
  <h3 {...props} className={`text-lg font-semibold ${props.className || ''}`}>
    {children}
  </h3>
);

// Replace imports with mock components
const Tabs = MockTabs;
const TabsContent = MockTabsContent;
const TabsList = MockTabsList;
const TabsTrigger = MockTabsTrigger;
const Button = MockButton;
const Card = MockCard;
const CardContent = MockCardContent;
const CardHeader = MockCardHeader;
const CardTitle = MockCardTitle;

// Icons
const DashboardIcon = () => <span>📊</span>;
const AddIcon = () => <span>➕</span>;
const ListIcon = () => <span>📋</span>;
const PersonIcon = () => <span>👤</span>;
const ReportsIcon = () => <span>📈</span>;
const HistoryIcon = () => <span>🕒</span>;
const SecurityIcon = () => <span>🔒</span>;

const ClinicalInterventionsLayout: React.FC = () => {
  const location = useLocation();

  // Get current tab based on pathname
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/create')) return 'create';
    if (path.includes('/list')) return 'list';
    if (path.includes('/patients')) return 'patients';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/audit')) return 'audit';
    if (path.includes('/compliance')) return 'compliance';
    return 'dashboard'; // Default to dashboard
  };

  const tabRoutes = [
    {
      label: 'Dashboard',
      value: 'dashboard',
      path: '/pharmacy/clinical-interventions/dashboard',
      icon: <DashboardIcon />,
    },
    {
      label: 'Create New',
      value: 'create',
      path: '/pharmacy/clinical-interventions/create',
      icon: <AddIcon />,
    },
    {
      label: 'Manage All',
      value: 'list',
      path: '/pharmacy/clinical-interventions/list',
      icon: <ListIcon />,
    },
    {
      label: 'By Patient',
      value: 'patients',
      path: '/pharmacy/clinical-interventions/patients',
      icon: <PersonIcon />,
    },
    {
      label: 'Reports',
      value: 'reports',
      path: '/pharmacy/clinical-interventions/reports',
      icon: <ReportsIcon />,
    },
    {
      label: 'Audit Trail',
      value: 'audit',
      path: '/pharmacy/clinical-interventions/audit',
      icon: <HistoryIcon />,
    },
    {
      label: 'Compliance',
      value: 'compliance',
      path: '/pharmacy/clinical-interventions/compliance',
      icon: <SecurityIcon />,
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
        <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <span>/</span>
        <Link to="/pharmacy/clinical-interventions" className="hover:text-gray-700">Pharmacy</Link>
        <span>/</span>
        <span className="text-gray-900">Clinical Interventions</span>
      </div>

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Clinical Interventions</h1>
        <p className="text-gray-500">
          Comprehensive clinical intervention management and workflow system
        </p>
      </div>

      {/* Navigation Tabs */}
      <div>
        <Tabs value={getCurrentTab()} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {tabRoutes.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} asChild>
                <Link to={tab.path} className="flex items-center gap-2">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate to="/pharmacy/clinical-interventions/dashboard" replace />
                }
              />
              <Route path="/dashboard" element={<ClinicalInterventionDashboard />} />
              <Route path="/create" element={<ClinicalInterventionForm />} />
              <Route path="/list" element={<ClinicalInterventionsList />} />
              <Route path="/edit/:id" element={<ClinicalInterventionForm />} />
              <Route path="/details/:id" element={<ClinicalInterventionDetails />} />
              <Route path="/patients" element={<PatientInterventions />} />
              <Route path="/patients/:patientId" element={<PatientInterventions />} />
              <Route path="/reports" element={<ClinicalInterventionReports />} />
              <Route path="/audit" element={<ClinicalInterventionAuditTrail />} />
              <Route
                path="/audit/:interventionId"
                element={<AuditTrailWithParams />}
              />
              <Route
                path="/compliance"
                element={<ClinicalInterventionComplianceReport />}
              />
              <Route
                path="*"
                element={
                  <Navigate to="/pharmacy/clinical-interventions/dashboard" replace />
                }
              />
            </Routes>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

// Wrapper component to pass interventionId from URL params
const AuditTrailWithParams: React.FC = () => {
  const { interventionId } = useParams<{ interventionId: string }>();
  return <ClinicalInterventionAuditTrail interventionId={interventionId} />;
};

export default ClinicalInterventionsLayout;
