import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Paper,
  Container,
  Fade,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Note as NoteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import ClinicalNoteDetail from '../components/ClinicalNoteDetail';
import { useClinicalNoteStore } from '../stores/clinicalNoteStore';
import ErrorBoundary from '../components/ErrorBoundary';

const ClinicalNoteDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const noteId = params.id!;
  const { selectedNote } = useClinicalNoteStore();

  // Navigation handlers
  const handleBackNavigation = () => {
    const fromState = location.state?.from;
    if (fromState) {
      navigate(fromState);
    } else {
      navigate('/notes');
    }
  };

  const handleNavigateToEdit = () => {
    navigate(`/notes/${noteId}/edit`, {
      state: { from: location.pathname },
    });
  };

  const handleNoteDeleted = () => {
    navigate('/notes', {
      replace: true,
      state: {
        message: 'Note deleted successfully',
      },
    });
  };

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    return [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: <HomeIcon fontSize="small" />,
      },
      {
        label: 'Clinical Notes',
        path: '/notes',
        icon: <NoteIcon fontSize="small" />,
      },
      {
        label: selectedNote?.title || 'Note Details',
        path: `/notes/${noteId}`,
        icon: <NoteIcon fontSize="small" />,
      },
    ];
  };

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    const breadcrumbs = getBreadcrumbs();

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
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast) {
            return (
              <Box
                key={crumb.path}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.primary',
                  fontWeight: 500,
                }}
              >
                {crumb.icon}
                <Typography variant="body2" color="textPrimary">
                  {crumb.label}
                </Typography>
              </Box>
            );
          }

          return (
            <Link
              key={crumb.path}
              component={RouterLink}
              to={crumb.path}
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
              {crumb.icon}
              <Typography variant="body2">{crumb.label}</Typography>
            </Link>
          );
        })}
      </Breadcrumbs>
    );
  };

  return (
    <ErrorBoundary>
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
          px: { xs: 2, sm: 3 },
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          {renderBreadcrumbs()}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleBackNavigation}
                size="small"
              >
                Back
              </Button>

              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                }}
              >
                {selectedNote?.title || 'Clinical Note Details'}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleNavigateToEdit}
            >
              Edit Note
            </Button>
          </Box>
        </Box>

        {/* Detail Content */}
        <Fade in timeout={300}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <ClinicalNoteDetail
              noteId={noteId}
              onEdit={handleNavigateToEdit}
              onDelete={handleNoteDeleted}
            />
          </Paper>
        </Fade>
      </Container>
    </ErrorBoundary>
  );
};

export default ClinicalNoteDetailPage;
