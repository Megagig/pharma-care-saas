import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Divider,
  Badge,
  CircularProgress,
  CardActions,
  Collapse,
  useTheme,
} from '@mui/material';
import ClinicalNotesErrorBoundary from './ClinicalNotesErrorBoundary';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridActionsCellItem,
  GridToolbar,
  GridSortModel,
  GridRowParams,
} from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewIcon from '@mui/icons-material/Visibility';
import FilterIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SecurityIcon from '@mui/icons-material/Security';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { format, parseISO } from 'date-fns';
import { useEnhancedClinicalNoteStore } from '../stores/enhancedClinicalNoteStore';
import { useClinicalNotes } from '../queries/clinicalNoteQueries';
import { useResponsive } from '../hooks/useResponsive';
import {
  ClinicalNote,
  ClinicalNoteFilters,
  NOTE_TYPES,
  NOTE_PRIORITIES,
} from '../types/clinicalNote';

interface ClinicalNotesDashboardProps {
  patientId?: string;
  embedded?: boolean;
  maxHeight?: number;
  onNoteSelect?: (noteId: string) => void;
  onNoteEdit?: (noteId: string) => void;
  onNoteCreate?: () => void;
}

const ClinicalNotesDashboard: React.FC<ClinicalNotesDashboardProps> = ({
  patientId,
  embedded = false,
  maxHeight,
  onNoteSelect,
  onNoteEdit,
  onNoteCreate,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isMobile, shouldUseCardLayout } = useResponsive();

  // Store state
  const {
    selectedNotes,
    filters,
    searchQuery,
    loading,
    errors,
    ui,
    // Actions
    fetchNotes,
    searchNotes,
    deleteNote,
    bulkDeleteNotes,
    bulkUpdateNotes,
    toggleNoteSelection,
    clearSelection,
    setFilters,
    setSearchQuery,
    setPage,
    setCreateModalOpen,
    setEditModalOpen,
    setDeleteConfirmOpen,
    setBulkDeleteConfirmOpen,
  } = useEnhancedClinicalNoteStore();

  // Local state
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [bulkActionAnchor, setBulkActionAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedNoteForAction, setSelectedNoteForAction] =
    useState<ClinicalNote | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // React Query for data fetching
  const currentFilters = useMemo(
    () => ({
      ...(filters || {}),
      ...(patientId && { patientId }),
    }),
    [filters, patientId]
  );

  const { data, isLoading, error } = useClinicalNotes(currentFilters);

  // Store state validation - ensure all required state is initialized
  const isStoreReady = useMemo(() => {
    return (
      filters !== undefined &&
      selectedNotes !== undefined &&
      typeof filters === 'object' &&
      Array.isArray(selectedNotes)
    );
  }, [filters, selectedNotes]);

  // Memoize row selection model with extra safety checks
  const rowSelectionModel: GridRowSelectionModel = useMemo(() => {
    try {
      // Ensure selectedNotes is always a valid array
      if (!selectedNotes || !Array.isArray(selectedNotes)) {
        return { type: 'include', ids: new Set() };
      }

      // Filter out any invalid IDs and ensure strings
      const validSelection = selectedNotes.filter((id): id is string => {
        return (
          id !== null &&
          id !== undefined &&
          typeof id === 'string' &&
          id.trim().length > 0
        );
      });

      return { type: 'include', ids: new Set(validSelection) };
    } catch (error) {
      console.warn('Error creating rowSelectionModel:', error);
      return { type: 'include', ids: new Set() };
    }
  }, [selectedNotes]); // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.trim()) {
        searchNotes(query, currentFilters);
      } else {
        fetchNotes(currentFilters);
      }
    },
    [searchNotes, fetchNotes, currentFilters, setSearchQuery]
  );

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleSearch(query), 300);
    };
  }, [handleSearch]);

  // Handle search input change
  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (
    key: keyof ClinicalNoteFilters,
    value: string | undefined
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (searchQuery) {
      searchNotes(searchQuery, newFilters);
    } else {
      fetchNotes(newFilters);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearchInput('');
    setSearchQuery('');
    fetchNotes({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...(patientId && { patientId }),
    });
  };

  // Handle row selection with simplified approach
  const handleRowSelectionChange = useCallback(
    (selectionModel: GridRowSelectionModel) => {
      try {
        // Extract IDs from the new GridRowSelectionModel format
        const selectedIds = Array.from(selectionModel.ids);

        // Filter out invalid IDs
        const validSelection = selectedIds.filter((id): id is string => {
          return (
            id !== null &&
            id !== undefined &&
            typeof id === 'string' &&
            id.trim().length > 0
          );
        });

        // Only update if the selection actually changed
        const currentIds = selectedNotes.slice().sort();
        const newIds = validSelection.slice().sort();

        if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
          // Clear current selection first
          clearSelection();

          // Then add new selections
          validSelection.forEach((noteId) => {
            if (noteId && typeof noteId === 'string') {
              toggleNoteSelection(noteId);
            }
          });
        }
      } catch (error) {
        console.error('Error handling row selection change:', error);
        // Fallback: clear selection on error
        clearSelection();
      }
    },
    [selectedNotes, clearSelection, toggleNoteSelection]
  ); // Handle bulk actions
  const handleBulkDelete = async () => {
    try {
      const success = await bulkDeleteNotes(selectedNotes);
      if (success) {
        setSnackbar({
          open: true,
          message: `Successfully deleted ${selectedNotes.length} notes`,
          severity: 'success',
        });
        clearSelection();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to delete notes',
        severity: 'error',
      });
    }
    setBulkDeleteConfirmOpen(false);
  };

  const handleBulkToggleConfidential = async (isConfidential: boolean) => {
    try {
      const success = await bulkUpdateNotes(selectedNotes, { isConfidential });
      if (success) {
        setSnackbar({
          open: true,
          message: `Successfully updated ${selectedNotes.length} notes`,
          severity: 'success',
        });
        clearSelection();
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to update notes',
        severity: 'error',
      });
    }
    setBulkActionAnchor(null);
  };

  // Handle individual note actions
  const handleViewNote = (note: ClinicalNote) => {
    // Use callback if provided, otherwise fallback to navigation
    if (onNoteSelect) {
      onNoteSelect(note._id);
    } else if (embedded) {
      // For embedded views, open in new tab
      window.open(`/notes/${note._id}`, '_blank');
    } else {
      // For main dashboard, navigate in same tab
      navigate(`/notes/${note._id}`);
    }
  };

  const handleEditNote = (note: ClinicalNote) => {
    // Use callback if provided, otherwise fallback to modal
    if (onNoteEdit) {
      onNoteEdit(note._id);
    } else {
      setSelectedNoteForAction(note);
      setEditModalOpen(true);
    }
  };

  const handleDeleteNote = async (note: ClinicalNote) => {
    try {
      const success = await deleteNote(note._id);
      if (success) {
        setSnackbar({
          open: true,
          message: 'Note deleted successfully',
          severity: 'success',
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to delete note',
        severity: 'error',
      });
    }
    setDeleteConfirmOpen(false);
  };

  // Format functions
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatPatientName = (patient: ClinicalNote['patient']) => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  const formatPharmacistName = (pharmacist: ClinicalNote['pharmacist']) => {
    return `${pharmacist.firstName} ${pharmacist.lastName}`;
  };

  // Priority chip component
  const PriorityChip = ({
    priority,
  }: {
    priority: ClinicalNote['priority'];
  }) => {
    const priorityInfo = NOTE_PRIORITIES.find((p) => p.value === priority);
    return (
      <Chip
        label={priorityInfo?.label || priority}
        size="small"
        sx={{
          backgroundColor: priorityInfo?.color || '#757575',
          color: 'white',
          fontWeight: 500,
        }}
      />
    );
  };

  // Type chip component
  const TypeChip = ({ type }: { type: ClinicalNote['type'] }) => {
    const typeInfo = NOTE_TYPES.find((t) => t.value === type);
    return (
      <Chip
        label={typeInfo?.label || type}
        size="small"
        variant="outlined"
        color="primary"
      />
    );
  };

  // Define DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500} noWrap>
            {params.value}
          </Typography>
          {params.row.isConfidential && (
            <Chip
              icon={<SecurityIcon />}
              label="Confidential"
              size="small"
              color="warning"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>
      ),
    },
    {
      field: 'patient',
      headerName: 'Patient',
      width: 180,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {formatPatientName(params.value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            MRN: {params.value.mrn}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => <TypeChip type={params.value} />,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => <PriorityChip priority={params.value} />,
    },
    {
      field: 'pharmacist',
      headerName: 'Pharmacist',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatPharmacistName(params.value)}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'attachments',
      headerName: 'Attachments',
      width: 120,
      align: 'center',
      renderCell: (params) =>
        params.value?.length > 0 ? (
          <Badge badgeContent={params.value.length} color="primary">
            <AttachFileIcon color="action" />
          </Badge>
        ) : null,
    },
    {
      field: 'followUpRequired',
      headerName: 'Follow-up',
      width: 100,
      align: 'center',
      renderCell: (params) =>
        params.value ? (
          <Tooltip
            title={`Follow-up: ${
              params.row.followUpDate
                ? formatDate(params.row.followUpDate)
                : 'Not scheduled'
            }`}
          >
            <ScheduleIcon color="warning" />
          </Tooltip>
        ) : null,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<ViewIcon />}
          label="View"
          onClick={() => handleViewNote(params.row)}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditNote(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => {
            setSelectedNoteForAction(params.row);
            setDeleteConfirmOpen(true);
          }}
        />,
      ],
    },
  ];

  // Handle sorting
  const handleSortChange = (model: GridSortModel) => {
    if (Array.isArray(model) && model.length > 0) {
      const sort = model[0];
      if (sort && typeof sort.field === 'string') {
        handleFilterChange('sortBy', sort.field);
        handleFilterChange('sortOrder', sort.sort || undefined);
      }
    }
  };

  // Mobile Card Component
  const NoteCard: React.FC<{ note: ClinicalNote }> = ({ note }) => {
    const [cardExpanded, setCardExpanded] = useState(false);
    const isSelected = selectedNotes.includes(note._id);

    return (
      <Card
        sx={{
          mb: 2,
          border: isSelected
            ? `2px solid ${theme.palette.primary.main}`
            : '1px solid #e0e0e0',
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                {note.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                <TypeChip type={note.type} />
                <PriorityChip priority={note.priority} />
                {note.isConfidential && (
                  <Chip
                    icon={<SecurityIcon />}
                    label="Confidential"
                    size="small"
                    color="warning"
                  />
                )}
              </Stack>
            </Box>
            <IconButton
              size="small"
              onClick={() => toggleNoteSelection(note._id)}
              color={isSelected ? 'primary' : 'default'}
            >
              {isSelected ? '✓' : '○'}
            </IconButton>
          </Box>

          {/* Patient Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Patient: <strong>{formatPatientName(note.patient)}</strong> (MRN:{' '}
              {note.patient.mrn})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pharmacist: {formatPharmacistName(note.pharmacist)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(note.createdAt)}
            </Typography>
          </Box>

          {/* Indicators */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            {note.followUpRequired && (
              <Tooltip
                title={`Follow-up: ${
                  note.followUpDate
                    ? formatDate(note.followUpDate)
                    : 'Not scheduled'
                }`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScheduleIcon
                    color="warning"
                    fontSize="small"
                    sx={{ mr: 0.5 }}
                  />
                  <Typography variant="caption">Follow-up</Typography>
                </Box>
              </Tooltip>
            )}
            {note.attachments?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachFileIcon
                  color="action"
                  fontSize="small"
                  sx={{ mr: 0.5 }}
                />
                <Typography variant="caption">
                  {note.attachments.length} files
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Content Preview */}
          <Collapse in={cardExpanded}>
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              {note.content.subjective && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="primary"
                  >
                    Subjective:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {note.content.subjective}
                  </Typography>
                </Box>
              )}
              {note.content.objective && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="primary"
                  >
                    Objective:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {note.content.objective}
                  </Typography>
                </Box>
              )}
              {note.content.assessment && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="primary"
                  >
                    Assessment:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {note.content.assessment}
                  </Typography>
                </Box>
              )}
              {note.content.plan && (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="primary"
                  >
                    Plan:
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {note.content.plan}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setCardExpanded(!cardExpanded)}
            startIcon={cardExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {cardExpanded ? 'Less' : 'More'}
          </Button>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() => handleViewNote(note)}
              color="primary"
            >
              <ViewIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleEditNote(note)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                setSelectedNoteForAction(note);
                setDeleteConfirmOpen(true);
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box sx={{ height: maxHeight || (embedded ? 600 : '100%'), width: '100%' }}>
      {!embedded && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Clinical Notes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage SOAP notes and clinical documentation
          </Typography>
        </Box>
      )}

      {/* Toolbar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 2 }}>
          {isMobile ? (
            // Mobile Toolbar Layout
            <Stack spacing={2}>
              {/* Search Row */}
              <TextField
                placeholder="Search notes..."
                value={searchInput}
                onChange={handleSearchInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchInput('');
                          handleSearch('');
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
                size="small"
              />

              {/* Action Buttons Row */}
              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Stack direction="row" spacing={1}>
                  <IconButton
                    onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                    color="primary"
                    size="small"
                  >
                    <FilterIcon />
                  </IconButton>
                  {(filters.type ||
                    filters.priority ||
                    filters.dateFrom ||
                    filters.dateTo) && (
                    <IconButton
                      onClick={handleClearFilters}
                      color="secondary"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                  {selectedNotes.length > 0 && (
                    <IconButton
                      onClick={(e) => setBulkActionAnchor(e.currentTarget)}
                      color="secondary"
                      size="small"
                    >
                      <Badge
                        badgeContent={selectedNotes.length}
                        color="primary"
                      >
                        <MoreVertIcon />
                      </Badge>
                    </IconButton>
                  )}
                </Stack>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() =>
                    onNoteCreate ? onNoteCreate() : setCreateModalOpen(true)
                  }
                  variant="contained"
                  size="small"
                >
                  New
                </Button>
              </Stack>
            </Stack>
          ) : (
            // Desktop Toolbar Layout
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
            >
              {/* Search */}
              <TextField
                placeholder="Search notes..."
                value={searchInput}
                onChange={handleSearchInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchInput('');
                          handleSearch('');
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300, flex: 1 }}
              />

              {/* Filters */}
              <Button
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                variant="outlined"
              >
                Filters
              </Button>

              {/* Clear Filters */}
              {(filters.type ||
                filters.priority ||
                filters.dateFrom ||
                filters.dateTo) && (
                <Button
                  startIcon={<ClearIcon />}
                  onClick={handleClearFilters}
                  variant="text"
                  color="secondary"
                >
                  Clear Filters
                </Button>
              )}

              {/* Create Note */}
              <Button
                startIcon={<AddIcon />}
                onClick={() =>
                  onNoteCreate ? onNoteCreate() : setCreateModalOpen(true)
                }
                variant="contained"
              >
                New Note
              </Button>

              {/* Bulk Actions */}
              {selectedNotes.length > 0 && (
                <Button
                  startIcon={<MoreVertIcon />}
                  onClick={(e) => setBulkActionAnchor(e.currentTarget)}
                  variant="outlined"
                  color="secondary"
                >
                  Actions ({selectedNotes.length})
                </Button>
              )}
            </Stack>
          )}

          {/* Active Filters Display */}
          {(filters.type ||
            filters.priority ||
            filters.dateFrom ||
            filters.dateTo) && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {filters.type && (
                  <Chip
                    label={`Type: ${
                      NOTE_TYPES.find((t) => t.value === filters.type)?.label
                    }`}
                    onDelete={() => handleFilterChange('type', undefined)}
                    size="small"
                  />
                )}
                {filters.priority && (
                  <Chip
                    label={`Priority: ${
                      NOTE_PRIORITIES.find((p) => p.value === filters.priority)
                        ?.label
                    }`}
                    onDelete={() => handleFilterChange('priority', undefined)}
                    size="small"
                  />
                )}
                {filters.dateFrom && (
                  <Chip
                    label={`From: ${format(
                      parseISO(filters.dateFrom),
                      'MMM dd, yyyy'
                    )}`}
                    onDelete={() => handleFilterChange('dateFrom', undefined)}
                    size="small"
                  />
                )}
                {filters.dateTo && (
                  <Chip
                    label={`To: ${format(
                      parseISO(filters.dateTo),
                      'MMM dd, yyyy'
                    )}`}
                    onDelete={() => handleFilterChange('dateTo', undefined)}
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Data Display - Table or Cards */}
      {shouldUseCardLayout ? (
        // Mobile Card Layout
        <Box>
          {isLoading || loading.fetchNotes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (data?.notes || []).length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 8 }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  No clinical notes found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {searchQuery || filters.type || filters.priority
                    ? 'Try adjusting your search or filters'
                    : 'Create your first clinical note to get started'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    onNoteCreate ? onNoteCreate() : setCreateModalOpen(true)
                  }
                >
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Notes List */}
              <Box>
                {(data?.notes || []).map((note) => (
                  <NoteCard key={note._id} note={note} />
                ))}
              </Box>

              {/* Mobile Pagination */}
              {data && data.totalPages > 1 && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" color="text.secondary">
                        Page {data.currentPage} of {data.totalPages}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          disabled={data.currentPage <= 1}
                          onClick={() => setPage(data.currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          size="small"
                          disabled={data.currentPage >= data.totalPages}
                          onClick={() => setPage(data.currentPage + 1)}
                        >
                          Next
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>
      ) : (
        // Desktop Table Layout
        <Card>
          {/* Only render DataGrid when we have a valid state and data */}
          {isStoreReady &&
          data &&
          Array.isArray(data.notes) &&
          Array.isArray(selectedNotes) &&
          Array.isArray(rowSelectionModel) &&
          typeof data.total === 'number' &&
          typeof data.currentPage === 'number' ? (
            <>
              {/* DataGrid wrapped in error boundary for additional protection */}
              <ClinicalNotesErrorBoundary>
                <DataGrid
                  rows={(data?.notes || []).map((note) => ({
                    ...note,
                    id: note._id, // Ensure id field exists for DataGrid
                  }))}
                  columns={columns}
                  loading={isLoading || loading.fetchNotes}
                  checkboxSelection={selectedNotes.length >= 0} // Only enable when we have a valid array
                  disableRowSelectionOnClick
                  rowSelectionModel={rowSelectionModel}
                  onRowSelectionModelChange={handleRowSelectionChange}
                  paginationMode="client"
                  sortingMode="client"
                  filterMode="client"
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        page: 0,
                        pageSize: 10,
                      },
                    },
                  }}
                  getRowId={(row) => row._id || row.id}
                  onSortModelChange={handleSortChange}
                  slots={{
                    toolbar: GridToolbar,
                    footer: () => null,
                  }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: false,
                      printOptions: { disableToolbarButton: true },
                    },
                  }}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#fafafa',
                      borderBottom: '2px solid #e0e0e0',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                    // Additional CSS to prevent size property issues
                    '& .MuiDataGrid-columnHeader .MuiCheckbox-root': {
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.25rem',
                      },
                    },
                    '& .MuiDataGrid-row .MuiCheckbox-root': {
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.25rem',
                      },
                    },
                  }}
                />
              </ClinicalNotesErrorBoundary>
              {/* Custom Pagination Controls */}
              {data && data.totalPages > 1 && (
                <Box
                  sx={{
                    p: 2,
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Showing {data.notes.length} of {data.total} total rows
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      disabled={data.currentPage <= 1}
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          page: data.currentPage - 1,
                        };
                        setFilters(newFilters);
                        if (searchQuery) {
                          searchNotes(searchQuery, newFilters);
                        } else {
                          fetchNotes(newFilters);
                        }
                      }}
                    >
                      Previous
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Page {data.currentPage} of {data.totalPages}
                    </Typography>
                    <Button
                      size="small"
                      disabled={data.currentPage >= data.totalPages}
                      onClick={() => {
                        const newFilters = {
                          ...filters,
                          page: data.currentPage + 1,
                        };
                        setFilters(newFilters);
                        if (searchQuery) {
                          searchNotes(searchQuery, newFilters);
                        } else {
                          fetchNotes(newFilters);
                        }
                      }}
                    >
                      Next
                    </Button>
                  </Stack>
                </Box>
              )}
            </>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={200}
              flexDirection="column"
              gap={2}
            >
              {isLoading || loading.fetchNotes ? (
                <>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Loading clinical notes...
                  </Typography>
                </>
              ) : !isStoreReady ? (
                <>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Initializing data store...
                  </Typography>
                </>
              ) : !Array.isArray(selectedNotes) ? (
                <>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Initializing selection state...
                  </Typography>
                </>
              ) : !data?.notes ? (
                <Typography variant="body2" color="text.secondary">
                  No data available
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Preparing data grid...
                </Typography>
              )}
            </Box>
          )}
        </Card>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
        PaperProps={{ sx: { minWidth: 300, p: 2 } }}
      >
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Note Type</InputLabel>
            <Select
              value={filters.type || ''}
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange('type', e.target.value || undefined)
              }
              label="Note Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {NOTE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority || ''}
              onChange={(e: SelectChangeEvent) =>
                handleFilterChange('priority', e.target.value || undefined)
              }
              label="Priority"
            >
              <MenuItem value="">All Priorities</MenuItem>
              {NOTE_PRIORITIES.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Date From"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) =>
              handleFilterChange('dateFrom', e.target.value || undefined)
            }
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />

          <TextField
            label="Date To"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) =>
              handleFilterChange('dateTo', e.target.value || undefined)
            }
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
        </Stack>
      </Menu>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionAnchor}
        open={Boolean(bulkActionAnchor)}
        onClose={() => setBulkActionAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkToggleConfidential(true)}>
          <SecurityIcon sx={{ mr: 1 }} />
          Mark as Confidential
        </MenuItem>
        <MenuItem onClick={() => handleBulkToggleConfidential(false)}>
          <SecurityIcon sx={{ mr: 1 }} />
          Remove Confidential
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => setBulkDeleteConfirmOpen(true)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Selected
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={ui.isDeleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this note? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              selectedNoteForAction && handleDeleteNote(selectedNoteForAction)
            }
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={ui.isBulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Multiple Notes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedNotes.length} selected
            notes? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            Delete {selectedNotes.length} Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Error Display */}
      {(error || errors.fetchNotes) && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error?.message ||
            errors.fetchNotes ||
            'An error occurred while loading notes'}
        </Alert>
      )}
    </Box>
  );
};

// Wrap with error boundary
const ClinicalNotesDashboardWithErrorBoundary: React.FC<
  ClinicalNotesDashboardProps
> = (props) => {
  return (
    <ClinicalNotesErrorBoundary context="clinical-notes-dashboard">
      <ClinicalNotesDashboard {...props} />
    </ClinicalNotesErrorBoundary>
  );
};

export default ClinicalNotesDashboardWithErrorBoundary;
