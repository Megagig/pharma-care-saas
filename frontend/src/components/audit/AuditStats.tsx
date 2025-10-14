import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
    Timeline as ActivityIcon,
    TrendingUp as TrendingUpIcon,
    Error as ErrorIcon,
    Flag as FlagIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { AuditStats as AuditStatsType } from '../../services/superAdminAuditService';

interface AuditStatsProps {
    stats: AuditStatsType | null;
    loading?: boolean;
}

const AuditStatsCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color }}>
                        {value.toLocaleString()}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        bgcolor: `${color}20`,
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color,
                    }}
                >
                    {icon}
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const AuditStats: React.FC<AuditStatsProps> = ({ stats, loading }) => {
    if (loading || !stats) {
        return <Typography>Loading statistics...</Typography>;
    }

    return (
        <Box mb={3}>
            <Grid container spacing={3}>
                {/* Total Activities */}
                <Grid item xs={12} sm={6} md={3}>
                    <AuditStatsCard
                        title="Total Activities"
                        value={stats.totalActivities}
                        icon={<ActivityIcon />}
                        color="#1976d2"
                    />
                </Grid>

                {/* Failed Activities */}
                <Grid item xs={12} sm={6} md={3}>
                    <AuditStatsCard
                        title="Failed Activities"
                        value={stats.failedActivities}
                        icon={<ErrorIcon />}
                        color="#d32f2f"
                        subtitle={`${((stats.failedActivities / stats.totalActivities) * 100).toFixed(1)}% failure rate`}
                    />
                </Grid>

                {/* Flagged Activities */}
                <Grid item xs={12} sm={6} md={3}>
                    <AuditStatsCard
                        title="Flagged for Review"
                        value={stats.flaggedActivities}
                        icon={<FlagIcon />}
                        color="#ed6c02"
                    />
                </Grid>

                {/* Critical Events */}
                <Grid item xs={12} sm={6} md={3}>
                    <AuditStatsCard
                        title="Critical Events"
                        value={stats.activityByRisk.find((r) => r._id === 'critical')?.count || 0}
                        icon={<WarningIcon />}
                        color="#d32f2f"
                    />
                </Grid>

                {/* Activity by Type */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Activity Distribution
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1}>
                                {stats.activityByType.slice(0, 5).map((activity) => (
                                    <Box
                                        key={activity._id}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Typography variant="body2">
                                            {activity._id.replace(/_/g, ' ').toUpperCase()}
                                        </Typography>
                                        <Chip label={activity.count.toLocaleString()} size="small" color="primary" />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Top Users */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Most Active Users
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1}>
                                {stats.topUsers.slice(0, 5).map((user, index) => (
                                    <Box
                                        key={user._id}
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                    >
                                        <Typography variant="body2">
                                            #{index + 1} {user.userDetails.firstName} {user.userDetails.lastName}
                                        </Typography>
                                        <Chip label={user.count.toLocaleString()} size="small" color="secondary" />
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Risk Distribution */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Risk Level Distribution
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {stats.activityByRisk.map((risk) => {
                                    const colors: Record<string, string> = {
                                        low: '#2e7d32',
                                        medium: '#ed6c02',
                                        high: '#f57c00',
                                        critical: '#d32f2f',
                                    };
                                    return (
                                        <Chip
                                            key={risk._id}
                                            label={`${risk._id.toUpperCase()}: ${risk.count.toLocaleString()}`}
                                            sx={{
                                                bgcolor: colors[risk._id] || '#757575',
                                                color: 'white',
                                                fontWeight: 'bold',
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AuditStats;
