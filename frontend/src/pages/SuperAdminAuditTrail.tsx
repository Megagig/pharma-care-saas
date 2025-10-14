import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Pagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import superAdminAuditService, {
    AuditFilters as AuditFiltersType,
    AuditLog,
    AuditStats as AuditStatsType,
} from '../services/superAdminAuditService';
import ActivityCard from '../components/audit/ActivityCard';
import AuditFilters from '../components/audit/AuditFilters';
import AuditStats from '../components/audit/AuditStats';

const SuperAdminAuditTrail: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStatsType | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 50,
        pages: 0,
    });
    const [filters, setFilters] = useState<AuditFiltersType>({
        page: 1,
        limit: 50,
    });
    const [activityTypes, setActivityTypes] = useState<string[]>([]);
    const [riskLevels, setRiskLevels] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<AuditLog | null>(null);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Fetch audit trail
    const fetchAuditTrail = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await superAdminAuditService.getAuditTrail(filters);
            setLogs(response.logs);
            setPagination(response.pagination);
        } catch (err: any) {
            const errorMessage = typeof err.response?.data?.error === 'string'
                ? err.response.data.error
                : err.response?.data?.message || err.message || 'Failed to fetch audit trail';
            setError(errorMessage);
            showSnackbar(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const statsData = await superAdminAuditService.getAuditStats(
                filters.workplaceId,
                filters.startDate,
                filters.endDate
            );
            setStats(statsData);
        } catch (err: any) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [filters.workplaceId, filters.startDate, filters.endDate]);

    // Fetch activity types and risk levels
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [types, levels] = await Promise.all([
                    superAdminAuditService.getActivityTypes(),
                    superAdminAuditService.getRiskLevels(),
                ]);
                setActivityTypes(types);
                setRiskLevels(levels);
            } catch (err) {
                console.error('Failed to fetch metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch data on mount and filter changes
    useEffect(() => {
        fetchAuditTrail();
    }, [fetchAuditTrail]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Handle filter changes
    const handleFilterChange = (newFilters: AuditFiltersType) => {
        setFilters({ ...newFilters, page: 1 });
    };

    // Handle pagination
    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
        setFilters({ ...filters, page });
    };

    // Handle flag toggle
    const handleFlag = async (auditId: string, flagged: boolean) => {
        try {
            await superAdminAuditService.flagAuditEntry(auditId, flagged);
            showSnackbar(`Activity ${flagged ? 'flagged' : 'unflagged'} successfully`, 'success');
            fetchAuditTrail();
            fetchStats();
        } catch (err: any) {
            showSnackbar('Failed to update flag status', 'error');
        }
    };

    // Handle review
    const handleOpenReview = (activity: AuditLog) => {
        setSelectedActivity(activity);
        setReviewNotes('');
        setReviewDialogOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedActivity || !reviewNotes.trim()) {
            showSnackbar('Please enter review notes', 'error');
            return;
        }

        try {
            await superAdminAuditService.reviewAuditEntry(selectedActivity._id, reviewNotes);
            showSnackbar('Review submitted successfully', 'success');
            setReviewDialogOpen(false);
            setSelectedActivity(null);
            setReviewNotes('');
            fetchAuditTrail();
            fetchStats();
        } catch (err: any) {
            showSnackbar('Failed to submit review', 'error');
        }
    };

    // Handle export
    const handleExport = async (format: 'json' | 'csv') => {
        try {
            showSnackbar(`Exporting audit data as ${format.toUpperCase()}...`, 'info');
            const blob = await superAdminAuditService.exportAuditData(filters, format);
            const filename = `audit-trail-${new Date().toISOString().split('T')[0]}.${format}`;
            superAdminAuditService.downloadFile(blob, filename);
            showSnackbar('Export completed successfully', 'success');
        } catch (err: any) {
            showSnackbar('Failed to export data', 'error');
        }
    };

    // Show snackbar
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Unified Audit Trail
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comprehensive activity log for all system operations
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                            fetchAuditTrail();
                            fetchStats();
                        }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExport('csv')}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExport('json')}
                    >
                        Export JSON
                    </Button>
                </Box>
            </Box>

            {/* Statistics */}
            <AuditStats stats={stats} loading={statsLoading} />

            {/* Filters */}
            <AuditFilters
                filters={filters}
                onChange={handleFilterChange}
                activityTypes={activityTypes}
                riskLevels={riskLevels}
            />

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Activity List */}
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        Activity Log ({pagination.total.toLocaleString()} total)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Page {pagination.page} of {pagination.pages}
                    </Typography>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress />
                    </Box>
                ) : logs.length === 0 ? (
                    <Box textAlign="center" py={8}>
                        <Typography variant="h6" color="text.secondary">
                            No activities found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Try adjusting your filters
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {logs.map((activity) => (
                            <ActivityCard
                                key={activity._id}
                                activity={activity}
                                onFlag={handleFlag}
                                onViewDetails={handleOpenReview}
                            />
                        ))}

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <Box display="flex" justifyContent="center" mt={4}>
                                <Pagination
                                    count={pagination.pages}
                                    page={pagination.page}
                                    onChange={handlePageChange}
                                    color="primary"
                                    size="large"
                                />
                            </Box>
                        )}
                    </>
                )}
            </Paper>

            {/* Review Dialog */}
            <Dialog
                open={reviewDialogOpen}
                onClose={() => setReviewDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Review Activity</DialogTitle>
                <DialogContent>
                    {selectedActivity && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {selectedActivity.description}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Review Notes"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Enter your review notes here..."
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmitReview} variant="contained" color="primary">
                        Submit Review
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default SuperAdminAuditTrail;
