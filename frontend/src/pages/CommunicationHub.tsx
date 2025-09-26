import ResponsiveCommunicationHub from '../components/communication/ResponsiveCommunicationHub';

import NotificationCenter from '../components/communication/NotificationCenter';

import AuditLogViewer from '../components/communication/AuditLogViewer';

import PatientQueryDashboard from '../components/communication/PatientQueryDashboard';

import { Tabs } from '@/components/ui/button';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`communication-tabpanel-${index}`}
      aria-labelledby={`communication-tab-${index}`}
    >
      {value === index && <div className="">{children}</div>}
    </div>
  );
};
const CommunicationHub: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => {
    // Parse URL parameters for deep linking
    const searchParams = new URLSearchParams(location.search);
    const params = CommunicationDeepLinks.parseUrlParams(searchParams);
    // Set active tab based on URL parameters
    if (params.tab) {
      switch (params.tab) {
        case 'messages':
          setActiveTab(0);
          break;
        case 'notifications':
          setActiveTab(1);
          break;
        case 'queries':
          setActiveTab(2);
          break;
        case 'audit':
          setActiveTab(3);
          break;
        default:
          setActiveTab(0);
      }
    }
  }, [location.search]);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Update URL without triggering navigation
    const searchParams = new URLSearchParams(location.search);
    const tabNames = ['messages', 'notifications', 'queries', 'audit'];
    if (newValue === 0) {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tabNames[newValue]);
    }
    const newUrl = `${location.pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`;
    window.history.replaceState(null, '', newUrl);
  };
  return (
    <div maxWidth="xl" className="">
      <div className="">
        <div
          
          component="h1"
          className="">
          Communication Hub
        </div>
        <div  color="text.secondary">
          Secure messaging and collaboration platform for healthcare teams
        </div>
      </div>
      <div
        className=""
      >
        <div
          className=""
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="communication hub tabs"
            className="">
            <Tab label="Messages" />
            <Tab label="Notifications" />
            <Tab label="Patient Queries" />
            <Tab label="Audit Logs" />
          </Tabs>
        </div>
        <TabPanel value={activeTab} index={0}>
          <ResponsiveCommunicationHub />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <NotificationCenter />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <PatientQueryDashboard />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <AuditLogViewer />
        </TabPanel>
      </div>
    </div>
  );
};
export default CommunicationHub;
