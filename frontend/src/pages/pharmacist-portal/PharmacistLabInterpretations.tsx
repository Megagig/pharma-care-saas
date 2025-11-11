/**
 * Pharmacist Lab Interpretations Page
 * Allows pharmacists to add patient-friendly interpretations to lab results
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    Stack,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Badge,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { format } from 'date-fns';
import { apiHelpers } from '../../utils/apiHelpers';
import LabInterpretationDialog from '../../components/diagnostics/LabInterpretationDialog';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/SkeletonLoaders';

interface PendingLabResult {
    _id: string;
    caseId: string;
    patientId: {
        _id: string;
        firstName: string;
        lastName: string;
        mrn: string;
    };
    testName: string;
    testDate: string;
    testType: string;
    status: string;
    hasInterpretation: boolean;
    visibleToPatient: boolean;
    interpretedAt?: string;
    interpretedBy?: {
        firstName: string;
        lastName: string;
    };
}

const PharmacistLabInterpretations: React.FC = () => {
    const [labResults, setLabResults] = useState<PendingLabResult[]>([]);
    const [filteredResults, setFilteredResults] = useState<PendingLabResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<{
        caseId: string;
        patientName: string;
        interpretation?: any;
    } | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0,
    });

    // Fetch pending lab results
    const fetchLabResults = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiHelpers.get('/pharmacist/lab-results/pending-interpretation?page=1&limit=100');

            if (response.success) {
                const results = response.data.diagnosticCases || [];

                setLabResults(results);
                setFilteredResults(results);

                // Calculate stats
                const pending = results.filter((r: PendingLabResult) => !r.hasInterpretation).length;
                const completed = results.filter((r: PendingLabResult) => r.hasInterpretation).length;
                setStats({
                    total: results.length,
                    pending,
                    completed,
                });

            } else {
                console.warn('⚠️ Response success flag is false:', response);
            }
        } catch (err: any) {
            console.error('❌ Error fetching lab results:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
                stack: err.stack,
            });
            setError(err.response?.data?.message || err.message || 'Failed to fetch lab results. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabResults();
    }, []);

    // Handle search
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredResults(labResults);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = labResults.filter((result) => {
                const patientName = `${result.patientId.firstName} ${result.patientId.lastName}`.toLowerCase();
                const mrn = result.patientId.mrn.toLowerCase();
                const testName = result.testName.toLowerCase();
                return patientName.includes(query) || mrn.includes(query) || testName.includes(query);
            });
            setFilteredResults(filtered);
        }
        setPage(0); // Reset to first page when searching
    }, [searchQuery, labResults]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDialog = async (result: PendingLabResult) => {
        try {
            // Fetch existing interpretation if available
            let interpretation = null;
            if (result.hasInterpretation) {
                const response = await apiHelpers.get(
                    `/pharmacist/lab-results/${result._id}/interpretation`
                );
                if (response.success) {
                    interpretation = response.data.diagnosticCase.patientInterpretation;
                }
            }

            setSelectedCase({
                caseId: result._id,
                patientName: `${result.patientId.firstName} ${result.patientId.lastName}`,
                interpretation,
            });
            setDialogOpen(true);
        } catch (err: any) {
            console.error('Error fetching interpretation:', err);
            setError('Failed to load interpretation');
        }
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedCase(null);
    };

    const handleSuccess = () => {
        fetchLabResults(); // Refresh the list
        handleCloseDialog();
    };

    const getStatusChip = (result: PendingLabResult) => {
        if (result.hasInterpretation && result.visibleToPatient) {
            return (
                <Chip
                    icon={<CheckCircleIcon />}
                    label="Published"
                    color="success"
                    size="small"
                />
            );
        } else if (result.hasInterpretation && !result.visibleToPatient) {
            return (
                <Chip
                    icon={<VisibilityIcon />}
                    label="Draft"
                    color="warning"
                    size="small"
                />
            );
        } else {
            return (
                <Chip
                    icon={<PendingActionsIcon />}
                    label="Pending"
                    color="error"
                    size="small"
                />
            );
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Lab Result Interpretations
                </Typography>
                <TableSkeleton rows={10} columns={6} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon /> Lab Result Interpretations
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Add patient-friendly interpretations to lab results to help patients understand their health data
                </Typography>
            </Box>

            {/* Stats Cards */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            Total Lab Results
                        </Typography>
                        <Typography variant="h4">{stats.total}</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            Pending Interpretation
                        </Typography>
                        <Typography variant="h4" color="error.main">
                            {stats.pending}
                        </Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1 }}>
                    <CardContent>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                            Completed
                        </Typography>
                        <Typography variant="h4" color="success.main">
                            {stats.completed}
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>

            {/* Search Bar */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by patient name, MRN, or test name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Table */}
            {filteredResults.length === 0 ? (
                <EmptyState
                    type="no-search-results"
                    title="No Lab Results Found"
                    description={
                        searchQuery
                            ? 'No lab results match your search criteria'
                            : 'There are no lab results requiring interpretation at this time'
                    }
                />
            ) : (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Patient</TableCell>
                                    <TableCell>MRN</TableCell>
                                    <TableCell>Test Name</TableCell>
                                    <TableCell>Test Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Interpreted By</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredResults
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((result) => (
                                        <TableRow
                                            key={result._id}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => handleOpenDialog(result)}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {result.patientId.firstName} {result.patientId.lastName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {result.patientId.mrn}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {result.testName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {format(new Date(result.testDate), 'MMM dd, yyyy')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{getStatusChip(result)}</TableCell>
                                            <TableCell>
                                                {result.interpretedBy ? (
                                                    <Typography variant="body2">
                                                        {result.interpretedBy.firstName}{' '}
                                                        {result.interpretedBy.lastName}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        -
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip
                                                    title={
                                                        result.hasInterpretation
                                                            ? 'Edit Interpretation'
                                                            : 'Add Interpretation'
                                                    }
                                                >
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDialog(result);
                                                        }}
                                                    >
                                                        {result.hasInterpretation ? (
                                                            <EditIcon />
                                                        ) : (
                                                            <Badge badgeContent="!" color="error">
                                                                <EditIcon />
                                                            </Badge>
                                                        )}
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredResults.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}

            {/* Interpretation Dialog */}
            {selectedCase && (
                <LabInterpretationDialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    caseId={selectedCase.caseId}
                    patientName={selectedCase.patientName}
                    existingInterpretation={selectedCase.interpretation}
                    onSuccess={handleSuccess}
                />
            )}
        </Box>
    );
};

export default PharmacistLabInterpretations;
