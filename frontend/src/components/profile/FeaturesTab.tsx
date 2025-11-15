import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Collapse,
    IconButton,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Lock as LockIcon,
    TrendingUp as TrendingUpIcon,
    Info as InfoIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useRBAC } from '../../hooks/useRBAC';
import { useSubscriptionStatus } from '../../hooks/useSubscription';
import { apiClient } from '../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

interface FeatureInfo {
    key: string;
    name: string;
    description: string;
    category: string;
    tier: string;
    enabled: boolean;
    usageCount?: number;
    usageLimit?: number;
}

interface TierComparison {
    tier: string;
    name: string;
    price: number;
    features: string[];
}

const FeaturesTab: React.FC = () => {
    const { user } = useAuth();
    const { hasFeature } = useRBAC();
    const subscriptionStatus = useSubscriptionStatus();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [features, setFeatures] = useState<FeatureInfo[]>([]);
    const [tierComparison, setTierComparison] = useState<TierComparison[]>([]);
    const [showComparison, setShowComparison] = useState(false);

    useEffect(() => {
        fetchFeaturesData();
    }, []);

    const fetchFeaturesData = async () => {
        try {
            setLoading(true);

            // Fetch all features with user's access status
            const featuresResponse = await apiClient.get('/features/available');
            if (featuresResponse.data.success) {
                setFeatures(featuresResponse.data.data || []);
            }

            // Fetch tier comparison data
            const tiersResponse = await apiClient.get('/pricing/tiers-comparison');
            if (tiersResponse.data.success) {
                setTierComparison(tiersResponse.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching features data:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupFeaturesByCategory = () => {
        const grouped: { [key: string]: FeatureInfo[] } = {};
        features.forEach(feature => {
            if (!grouped[feature.category]) {
                grouped[feature.category] = [];
            }
            grouped[feature.category].push(feature);
        });
        return grouped;
    };

    const getUsagePercentage = (used: number, limit: number | null) => {
        if (!limit) return 0;
        return (used / limit) * 100;
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'error';
        if (percentage >= 75) return 'warning';
        return 'success';
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    const groupedFeatures = groupFeaturesByCategory();
    const enabledFeatures = features.filter(f => f.enabled);
    const lockedFeatures = features.filter(f => !f.enabled);

    return (
        <Box>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Enabled Features
                            </Typography>
                            <Typography variant="h3" color="success.main">
                                {enabledFeatures.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Locked Features
                            </Typography>
                            <Typography variant="h3" color="warning.main">
                                {lockedFeatures.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Current Tier
                            </Typography>
                            <Chip
                                label={subscriptionStatus.tier?.toUpperCase() || 'FREE'}
                                color="primary"
                                sx={{ fontSize: '1rem', height: 40 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Enabled Features by Category */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Your Enabled Features
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
                        const enabledInCategory = categoryFeatures.filter(f => f.enabled);
                        if (enabledInCategory.length === 0) return null;

                        return (
                            <Box key={category} sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" color="primary" gutterBottom>
                                    {category}
                                </Typography>
                                <Grid container spacing={2}>
                                    {enabledInCategory.map((feature) => (
                                        <Grid item xs={12} sm={6} md={4} key={feature.key}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <CheckCircleIcon color="success" fontSize="small" sx={{ mt: 0.5 }} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {feature.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {feature.description}
                                                    </Typography>

                                                    {/* Usage tracking if available */}
                                                    {feature.usageCount !== undefined && (
                                                        <Box sx={{ mt: 1 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Usage
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {feature.usageCount} / {feature.usageLimit || '∞'}
                                                                </Typography>
                                                            </Box>
                                                            {feature.usageLimit && (
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={getUsagePercentage(feature.usageCount, feature.usageLimit)}
                                                                    color={getUsageColor(getUsagePercentage(feature.usageCount, feature.usageLimit))}
                                                                    sx={{ height: 4, borderRadius: 2 }}
                                                                />
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Locked Features - Upgrade Prompts */}
            {lockedFeatures.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Unlock More Features
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<TrendingUpIcon />}
                                onClick={() => navigate('/subscriptions')}
                            >
                                Upgrade Now
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Upgrade your plan to unlock these premium features and grow your pharmacy practice.
                        </Alert>

                        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
                            const lockedInCategory = categoryFeatures.filter(f => !f.enabled);
                            if (lockedInCategory.length === 0) return null;

                            return (
                                <Box key={category} sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        {category}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {lockedInCategory.map((feature) => (
                                            <Grid item xs={12} sm={6} md={4} key={feature.key}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 1,
                                                        opacity: 0.7,
                                                        p: 1,
                                                        borderRadius: 1,
                                                        bgcolor: 'action.hover',
                                                    }}
                                                >
                                                    <LockIcon color="action" fontSize="small" sx={{ mt: 0.5 }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {feature.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {feature.description}
                                                        </Typography>
                                                        <Chip
                                                            label={`${feature.tier.toUpperCase()} Plan`}
                                                            size="small"
                                                            color="warning"
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Tier Comparison */}
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Plan Comparison
                        </Typography>
                        <IconButton onClick={() => setShowComparison(!showComparison)}>
                            {showComparison ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>

                    <Collapse in={showComparison}>
                        <Divider sx={{ mb: 2 }} />
                        {tierComparison.length > 0 ? (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Feature</TableCell>
                                            {tierComparison.map((tier) => (
                                                <TableCell key={tier.tier} align="center">
                                                    <Box>
                                                        <Typography variant="subtitle2">{tier.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            ₦{tier.price.toLocaleString()}/mo
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Generate comparison rows based on features */}
                                        {features.slice(0, 10).map((feature) => (
                                            <TableRow key={feature.key}>
                                                <TableCell>{feature.name}</TableCell>
                                                {tierComparison.map((tier) => (
                                                    <TableCell key={tier.tier} align="center">
                                                        {tier.features.includes(feature.key) ? (
                                                            <CheckCircleIcon color="success" fontSize="small" />
                                                        ) : (
                                                            <LockIcon color="disabled" fontSize="small" />
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Alert severity="info">
                                Plan comparison data is not available. Visit the{' '}
                                <Button onClick={() => navigate('/subscriptions')} sx={{ textTransform: 'none' }}>
                                    subscriptions page
                                </Button>
                                {' '}to see all available plans.
                            </Alert>
                        )}
                    </Collapse>
                </CardContent>
            </Card>
        </Box>
    );
};

export default FeaturesTab;
