import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveCommunicationHub } from '../components/communication/ResponsiveCommunicationHub';
import { NotificationCenter } from '../components/communication/NotificationCenter';
import { AuditLogViewer } from '../components/communication/AuditLogViewer';
import { PatientQueryDashboard } from '../components/communication/PatientQueryDashboard';
import { CommunicationDeepLinks } from '../utils/communicationDeepLinks';

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const CommunicationHub: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Communication Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Secure messaging and collaboration platform for healthcare teams
        </Typography>
      </Box>

      <Paper
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme.shadows[4],
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="communication hub tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 64,
              },
              '& .Mui-selected': {
                color: theme.palette.primary.main,
              },
            }}
          >
            <Tab label="Messages" />
            <Tab label="Notifications" />
            <Tab label="Patient Queries" />
            <Tab label="Audit Logs" />
          </Tabs>
        </Box>

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
      </Paper>
    </Container>
  );
};

export default CommunicationHub;
