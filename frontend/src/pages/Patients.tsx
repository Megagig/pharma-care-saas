import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  TablePagination,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock patient data
  const patients = [
    {
      id: 1,
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: '1958-03-15',
      gender: 'female',
      phone: '(555) 123-4567',
      email: 'sarah.johnson@email.com',
      conditions: ['Hypertension', 'Diabetes'],
      medications: 5,
      lastVisit: '2024-01-15',
      status: 'active',
    },
    {
      id: 2,
      firstName: 'Michael',
      lastName: 'Chen',
      dateOfBirth: '1979-07-22',
      gender: 'male',
      phone: '(555) 234-5678',
      email: 'michael.chen@email.com',
      conditions: ['Asthma'],
      medications: 2,
      lastVisit: '2024-01-12',
      status: 'active',
    },
    {
      id: 3,
      firstName: 'Emma',
      lastName: 'Wilson',
      dateOfBirth: '1991-11-08',
      gender: 'female',
      phone: '(555) 345-6789',
      email: 'emma.wilson@email.com',
      conditions: ['Migraine', 'Anxiety'],
      medications: 3,
      lastVisit: '2024-01-10',
      status: 'inactive',
    },
    {
      id: 4,
      firstName: 'David',
      lastName: 'Rodriguez',
      dateOfBirth: '1965-05-30',
      gender: 'male',
      phone: '(555) 456-7890',
      email: 'david.rodriguez@email.com',
      conditions: ['Arthritis', 'High Cholesterol'],
      medications: 4,
      lastVisit: '2024-01-08',
      status: 'active',
    },
    {
      id: 5,
      firstName: 'Lisa',
      lastName: 'Anderson',
      dateOfBirth: '1983-12-03',
      gender: 'female',
      phone: '(555) 567-8901',
      email: 'lisa.anderson@email.com',
      conditions: ['Depression'],
      medications: 1,
      lastVisit: '2024-01-05',
      status: 'pending',
    },
  ];

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || patient.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Patients
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your patient information and medical records
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2, py: 1.5, px: 3 }}
        >
          Add New Patient
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search patients by name or email..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 300 }}
            />
            <TextField
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              sx={{ borderRadius: 2 }}
            >
              More Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Age/Gender</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Conditions</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Medications</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Visit</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((patient) => (
                  <TableRow
                    key={patient.id}
                    hover
                    sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getInitials(patient.firstName, patient.lastName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {patient.firstName} {patient.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {patient.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {calculateAge(patient.dateOfBirth)} years
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {patient.gender}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{patient.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {patient.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {patient.conditions
                          .slice(0, 2)
                          .map((condition, index) => (
                            <Chip
                              key={index}
                              label={condition}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem', height: 24 }}
                            />
                          ))}
                        {patient.conditions.length > 2 && (
                          <Chip
                            label={`+${patient.conditions.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 24 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={patient.medications}
                        size="small"
                        color="primary"
                        sx={{ minWidth: 40 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(patient.lastVisit).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={patient.status}
                        size="small"
                        color={getStatusColor(patient.status)}
                        sx={{ textTransform: 'capitalize', minWidth: 70 }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          justifyContent: 'center',
                        }}
                      >
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Patient">
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={handleMenuClick}
                            color="primary"
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredPatients.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 18 }} />
          View Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Edit Patient
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete Patient
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Patients;
