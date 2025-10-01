import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Skeleton,
  Alert,
  Avatar,
  Chip,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  LocalHospital as LocalHospitalIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useDiagnosticReferrals } from '../../../queries/useDiagnosticHistory';
import { DiagnosticReferral } from '../../../services/diagnosticHistoryService';

const DiagnosticReferralsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReferral, setSelectedReferral] = useState<DiagnosticReferral | null>(null);

  const {
    data: referralsData,
    isLoading,
    error,
    refetch,
  } = useDiagnosticReferrals({
    page: page + 1,
    limit: rowsPerPage,
    status: statusFilter || undefined,
    specialty: specialtyFilter || undefined,
  });

  const referrals = referralsData?.referrals || [];
  const pagination = referralsData?.pagination || {
    current: 1,
    total: 1,
    count: 0,
    totalReferrals: 0,
  };
  const statistics = referralsData?.statistics || {
    pending: 0,
    sent: 0,
    acknowledged: 0,
    completed: 0,
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleSpecialtyFilterChange = (event: any) => {
    setSpecialtyFilter(event.target.value);
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, referral: DiagnosticReferral) => {
    setAnchorEl(event.currentTarget);
    setSelectedReferral(referral);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReferral(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'acknowledged':
        return 'info';
      case 'sent':
        return 'primary';
      default:
        return 'warning';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'error';
      case 'within_24h':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return <WarningIcon fontSize="small" />;
      case 'within_24h':
        return <ScheduleIcon fontSize="small" />;
      default:
        return <AssignmentIcon fontSize="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton
            onClick={() => navigate('/pharmacy/diagnostics')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', flex: 1 }}>
            Diagnostic Referrals
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={statistics.pending} color="warning">
                  <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1 }}>
                    <ScheduleIcon />
                  </Avatar>
                </Badge>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {statistics.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={statistics.sent} color="primary">
                  <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
                    <SendIcon />
                  </Avatar>
                </Badge>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {statistics.sent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={statistics.acknowledged} color="info">
                  <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
                    <VisibilityIcon />
                  </Avatar>
                </Badge>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {statistics.acknowledged}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Acknowledged
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Badge badgeContent={statistics.completed} color="success">
                  <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
                    <CheckCircleIcon />
                  </Avatar>
                </Badge>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {statistics.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Specialty</InputLabel>
                <Select
                  value={specialtyFilter}
                  label="Specialty"
                  onChange={handleSpecialtyFilterChange}
                >
                  <MenuItem value="">All Specialties</MenuItem>
                  <MenuItem value="cardiology">Cardiology</MenuItem>
                  <MenuItem value="dermatology">Dermatology</MenuItem>
                  <MenuItem value="endocrinology">Endocrinology</MenuItem>
                  <MenuItem value="gastroenterology">Gastroenterology</MenuItem>
                  <MenuItem value="neurology">Neurology</MenuItem>
                  <MenuItem value="oncology">Oncology</MenuItem>
                  <MenuItem value="orthopedics">Orthopedics</MenuItem>
                  <MenuItem value="psychiatry">Psychiatry</MenuItem>
                  <MenuItem value="pulmonology">Pulmonology</MenuItem>
                  <MenuItem value="urology">Urology</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Referrals Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {error ? (
            <Alert severity="error" sx={{ m: 3 }}>
              Failed to load referrals. Please try refreshing the page.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Case ID</TableCell>
                      <TableCell>Specialty</TableCell>
                      <TableCell>Urgency</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Pharmacist</TableCell>
                      <TableCell>Generated</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      // Loading skeletons
                      [...Array(rowsPerPage)].map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton width={150} /></TableCell>
                          <TableCell><Skeleton width={100} /></TableCell>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={150} /></TableCell>
                          <TableCell><Skeleton width={100} /></TableCell>
                          <TableCell><Skeleton width={50} /></TableCell>
                        </TableRow>
                      ))
                    ) : referrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <LocalHospitalIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No referrals found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {statusFilter || specialtyFilter
                              ? 'Try adjusting your filter criteria'
                              : 'No referrals have been generated yet'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      referrals.map((referral) => (
                        <TableRow key={referral._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                <PersonIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {referral.patientId?.firstName} {referral.patientId?.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {referral.patientId?.age}y, {referral.patientId?.gender}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {referral.caseId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={referral.referral?.specialty}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getUrgencyIcon(referral.referral?.urgency)}
                              label={referral.referral?.urgency?.replace('_', ' ')}
                              size="small"
                              color={getUrgencyColor(referral.referral?.urgency) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={referral.referral?.status}
                              size="small"
                              color={getStatusColor(referral.referral?.status) as any}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {referral.pharmacistId?.firstName} {referral.pharmacistId?.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {referral.referral?.generatedAt
                                ? format(new Date(referral.referral.generatedAt), 'MMM dd, yyyy')
                                : 'N/A'}
                            </Typography>
                            {referral.referral?.generatedAt && (
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(referral.referral.generatedAt), 'HH:mm')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/pharmacy/diagnostics/case/${referral.caseId}/results`)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More Actions">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, referral)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={pagination.totalReferrals}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItemComponent
            onClick={() => {
              if (selectedReferral) {
                navigate(`/pharmacy/diagnostics/case/${selectedReferral.caseId}/results`);
              }
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Case Details</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent
            onClick={() => {
              // TODO: Implement download referral document
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download Referral</ListItemText>
          </MenuItemComponent>
          <MenuItemComponent
            onClick={() => {
              // TODO: Implement send referral
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <SendIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send Referral</ListItemText>
          </MenuItemComponent>
        </MenuList>
      </Menu>
    </Container>
  );
};

export default DiagnosticReferralsPage;