/**
 * Workspace Team Management Page
 * Main page for managing workspace team members, invites, and audit logs
 * Only accessible to pharmacy_outlet (workspace owner) users
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  GridLegacy as Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import MailIcon from '@mui/icons-material/Mail';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import { useRBAC } from '../../hooks/useRBAC';
import { useWorkspaceStats } from '../../queries/useWorkspaceTeam';
import MemberList from '../../components/workspace/MemberList';
import MemberFilters from '../../components/workspace/MemberFilters';
import PendingApprovals from '../../components/workspace/PendingApprovals';
import InviteList from '../../components/workspace/InviteList';
import InviteGenerator from '../../components/workspace/InviteGenerator';
import AuditTrail from '../../components/workspace/AuditTrail';
import type { MemberFilters as MemberFiltersType } from '../../types/workspace';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workspace-team-tabpanel-${index}`}
      aria-labelledby={`workspace-team-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Stats card component
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  loading = false,
}) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Typography variant="h4" component="div">
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const WorkspaceTeam: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { hasRole } = useRBAC();
  const [activeTab, setActiveTab] = useState(0);
  const [memberFilters, setMemberFilters] = useState<MemberFiltersType>({});
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Fetch workspace statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useWorkspaceStats();

  // Access control - only pharmacy_outlet users can access
  if (!hasRole('pharmacy_outlet')) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="error" sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1">
            This page is restricted to workspace owners only. You need
            pharmacy_outlet role to access team management.
          </Typography>
        </Alert>
      </Container>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem' } }}
            >
              <PeopleIcon sx={{ mr: 1, fontSize: 'inherit', verticalAlign: 'middle' }} />
              Team Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your workspace team members, invitations, and activity
            </Typography>
          </Box>

          <Chip
            icon={<PeopleIcon />}
            label="Workspace Owner"
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Stats Cards */}
        {statsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load workspace statistics. Please try refreshing the page.
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Members"
              value={stats?.totalMembers || 0}
              icon={<PeopleIcon />}
              color="primary"
              loading={statsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Active Members"
              value={stats?.activeMembers || 0}
              icon={<PeopleIcon />}
              color="success"
              loading={statsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Pending Approvals"
              value={stats?.pendingApprovals || 0}
              icon={<HourglassEmptyIcon />}
              color="warning"
              loading={statsLoading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Active Invites"
              value={stats?.activeInvites || 0}
              icon={<MailIcon />}
              color="info"
              loading={statsLoading}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
          aria-label="workspace team management tabs"
        >
          <Tab
            icon={<PeopleIcon />}
            label="Members"
            iconPosition="start"
            id="workspace-team-tab-0"
            aria-controls="workspace-team-tabpanel-0"
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<HourglassEmptyIcon />}
            label="Pending Approvals"
            iconPosition="start"
            id="workspace-team-tab-1"
            aria-controls="workspace-team-tabpanel-1"
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<MailIcon />}
            label="Invite Links"
            iconPosition="start"
            id="workspace-team-tab-2"
            aria-controls="workspace-team-tabpanel-2"
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<HistoryIcon />}
            label="Audit Trail"
            iconPosition="start"
            id="workspace-team-tab-3"
            aria-controls="workspace-team-tabpanel-3"
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <MemberFilters filters={memberFilters} onFiltersChange={setMemberFilters} />
        <MemberList filters={memberFilters} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <PendingApprovals />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Workspace Invites</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Generate Invite Link
          </Button>
        </Box>
        <InviteList />
        <InviteGenerator
          open={inviteDialogOpen}
          onClose={() => setInviteDialogOpen(false)}
          onSuccess={() => {
            // Invite list will auto-refresh via query invalidation
            setInviteDialogOpen(false);
          }}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <AuditTrail />
      </TabPanel>
    </Container>
  );
};

export default WorkspaceTeam;
