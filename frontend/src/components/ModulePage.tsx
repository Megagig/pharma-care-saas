import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import type { ModuleInfo, ModulePageProps } from '../types/moduleTypes';

const ModulePage: React.FC<ModulePageProps> = ({
  moduleInfo,
  icon: IconComponent,
  gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}) => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const getStatusColor = (status: ModuleInfo['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'in_development':
        return 'warning';
      case 'placeholder':
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status: ModuleInfo['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'in_development':
        return 'In Development';
      case 'placeholder':
      default:
        return 'Coming Soon';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
      >
        <Link
          component="button"
          variant="body2"
          onClick={handleBackToDashboard}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            textDecoration: 'none',
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <DashboardIcon fontSize="small" />
          Dashboard
        </Link>
        <Typography variant="body2" color="text.primary">
          {moduleInfo.title}
        </Typography>
      </Breadcrumbs>

      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          mb: 4,
          background: gradient,
          color: 'white',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -50,
            right: -50,
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: '400px',
            height: '400px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={3}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            sx={{ mb: 3 }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <IconComponent sx={{ fontSize: 40 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                }}
              >
                {moduleInfo.title}
              </Typography>
              <Chip
                label={getStatusLabel(moduleInfo.status)}
                color={getStatusColor(moduleInfo.status)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              />
              {moduleInfo.estimatedRelease && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Estimated Release: {moduleInfo.estimatedRelease}
                </Typography>
              )}
            </Box>
          </Stack>

          <Typography
            variant="h6"
            sx={{
              opacity: 0.95,
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            {moduleInfo.purpose}
          </Typography>
        </Box>
      </Paper>

      {/* Content Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 4,
          mb: 4,
        }}
      >
        {/* Workflow Section */}
        <Card
          sx={{
            height: 'fit-content',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScheduleIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                Workflow
              </Typography>
            </Box>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.6 }}
            >
              {moduleInfo.workflow.description}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}
            >
              Process Steps:
            </Typography>

            <List sx={{ p: 0 }}>
              {moduleInfo.workflow.steps.map((step, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 1,
                    alignItems: 'flex-start',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={step}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { lineHeight: 1.5 },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Key Features Section */}
        <Card
          sx={{
            height: 'fit-content',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background:
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                Key Features
              </Typography>
            </Box>

            <List sx={{ p: 0 }}>
              {moduleInfo.keyFeatures.map((feature, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 1.5,
                    alignItems: 'flex-start',
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(248,250,252,0.8)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <CheckCircleIcon
                      sx={{
                        color: 'success.main',
                        fontSize: 20,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={feature}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { lineHeight: 1.5, fontWeight: 500 },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 600,
          }}
        >
          Back to Dashboard
        </Button>

        {moduleInfo.status === 'placeholder' && (
          <Button
            variant="contained"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              background: gradient,
              '&:hover': {
                background: gradient,
                opacity: 0.9,
              },
            }}
            disabled
          >
            Coming Soon
          </Button>
        )}
      </Box>

      {/* Footer Note */}
      {moduleInfo.status === 'placeholder' && (
        <Paper
          sx={{
            mt: 4,
            p: 3,
            bgcolor: 'info.light',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            color="info.dark"
            sx={{ fontWeight: 500 }}
          >
            This module is currently in development. The information above
            represents the planned functionality and may be subject to changes
            during implementation.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default ModulePage;
