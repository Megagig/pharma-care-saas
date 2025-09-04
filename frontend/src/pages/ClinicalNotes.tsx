import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Paper,
  Container,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Home as HomeIcon,
  Note as NoteIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ClinicalNotesDashboard from '../components/ClinicalNotesDashboard';
import ClinicalNotesUXEnhancer from '../components/ClinicalNotesUXEnhancer';

interface ClinicalNotesPageProps {
  patientId?: string;
}

const ClinicalNotes: React.FC<ClinicalNotesPageProps> = ({ patientId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Navigation handlers
  const handleNavigateToCreate = () => {
    navigate('/notes/new', {
      state: {
        from: location.pathname,
        patientId: patientId,
      },
    });
  };

  const handleNavigateToEdit = (id: string) => {
    navigate(`/notes/${id}/edit`, {
      state: { from: location.pathname },
    });
  };

  const handleNavigateToView = (id: string) => {
    navigate(`/notes/${id}`, {
      state: { from: location.pathname },
    });
  };

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    return (
      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
          mb: 2,
          '& .MuiBreadcrumbs-separator': {
            mx: 1,
          },
        }}
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': {
              color: 'primary.main',
              textDecoration: 'underline',
            },
          }}
        >
          <HomeIcon fontSize="small" />
          <Typography variant="body2">Dashboard</Typography>
        </Link>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.primary',
            fontWeight: 500,
          }}
        >
          <NoteIcon fontSize="small" />
          <Typography variant="body2" color="textPrimary">
            Clinical Notes
          </Typography>
        </Box>
      </Breadcrumbs>
    );
  };

  // Render page header
  const renderPageHeader = () => (
    <Box sx={{ mb: 3 }}>
      {renderBreadcrumbs()}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          Clinical Notes
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNavigateToCreate}
          sx={{
            minWidth: isMobile ? '100%' : 'auto',
          }}
        >
          New Clinical Note
        </Button>
      </Box>
    </Box>
  );

  return (
    <ClinicalNotesUXEnhancer context="clinical-notes-page">
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          px: { xs: 2, sm: 3 },
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        {renderPageHeader()}

        <Fade in timeout={300}>
          <Paper elevation={1} sx={{ height: 'calc(100vh - 200px)' }}>
            <ClinicalNotesDashboard
              patientId={patientId}
              onNoteSelect={handleNavigateToView}
              onNoteEdit={handleNavigateToEdit}
              onNoteCreate={handleNavigateToCreate}
            />
          </Paper>
        </Fade>
      </Container>
    </ClinicalNotesUXEnhancer>
  );
};

export default ClinicalNotes;
