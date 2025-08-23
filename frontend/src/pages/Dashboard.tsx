import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  Medication as MedicationIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Patients',
      value: '147',
      change: '+12%',
      changeType: 'increase',
      icon: PeopleIcon,
      color: 'primary',
    },
    {
      title: 'Clinical Notes',
      value: '523',
      change: '+18%',
      changeType: 'increase',
      icon: DescriptionIcon,
      color: 'success',
    },
    {
      title: 'Active Medications',
      value: '1,284',
      change: '+7%',
      changeType: 'increase',
      icon: MedicationIcon,
      color: 'secondary',
    },
    {
      title: 'Adherence Rate',
      value: '84.2%',
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUpIcon,
      color: 'warning',
    },
  ];

  const recentPatients = [
    {
      name: 'Sarah Johnson',
      age: 65,
      condition: 'Hypertension',
      lastVisit: 'Today',
      avatar: 'S',
      status: 'active',
    },
    {
      name: 'Michael Chen',
      age: 45,
      condition: 'Diabetes',
      lastVisit: '2 days ago',
      avatar: 'M',
      status: 'pending',
    },
    {
      name: 'Emma Wilson',
      age: 32,
      condition: 'Asthma',
      lastVisit: '1 week ago',
      avatar: 'E',
      status: 'completed',
    },
  ];

  const alerts = [
    {
      type: 'warning',
      title: 'Medication Review Due',
      message: 'John Doe - Hypertension medication needs review',
      time: '2 hours ago',
    },
    {
      type: 'info',
      title: 'New Patient Registration',
      message: 'Lisa Martinez has registered for consultation',
      time: '4 hours ago',
    },
    {
      type: 'success',
      title: 'Prescription Filled',
      message: 'Robert Kim picked up diabetes medication',
      time: '6 hours ago',
    },
  ];

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's what's happening in your practice.
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block' }}
        >
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${stat.color}.main`,
                        color: 'white',
                      }}
                    >
                      <IconComponent />
                    </Box>
                    <Chip
                      label={stat.change}
                      size="small"
                      color="success"
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                  </Box>
                  <Typography
                    variant="h4"
                    component="h3"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Patients */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Recent Patients
                </Typography>
                <Button variant="text" size="small" color="primary">
                  View all
                </Button>
              </Box>
              <List disablePadding>
                {recentPatients.map((patient, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      mb: 1,
                      '&:last-child': { mb: 0 },
                      '&:hover': { bgcolor: 'grey.100' },
                      cursor: 'pointer',
                    }}
                    secondaryAction={
                      <IconButton edge="end" size="small">
                        <MoreHorizIcon />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {patient.avatar}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={patient.name}
                      secondary={`Age ${patient.age} • ${patient.condition}`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <Box sx={{ textAlign: 'right', mr: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last visit
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {patient.lastVisit}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts & Notifications */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Alerts & Notifications
                </Typography>
                <Button variant="text" size="small" color="primary">
                  View all
                </Button>
              </Box>
              <List disablePadding>
                {alerts.map((alert, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      mb: 1,
                      '&:last-child': { mb: 0 },
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getAlertColor(alert.type)}.main`,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {alert.type === 'warning' && (
                          <WarningIcon fontSize="small" />
                        )}
                        {alert.type === 'info' && (
                          <ScheduleIcon fontSize="small" />
                        )}
                        {alert.type === 'success' && (
                          <TrendingUpIcon fontSize="small" />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={alert.title}
                      secondary={alert.message}
                      primaryTypographyProps={{
                        fontWeight: 500,
                        fontSize: '0.875rem',
                      }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {alert.time}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontWeight: 600, mb: 3 }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PeopleIcon />}
                sx={{ py: 2, justifyContent: 'flex-start' }}
              >
                Add New Patient
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DescriptionIcon />}
                sx={{ py: 2, justifyContent: 'flex-start' }}
              >
                Create Clinical Note
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<MedicationIcon />}
                sx={{ py: 2, justifyContent: 'flex-start' }}
              >
                Add Medication
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
