import React from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Chip,
    LinearProgress,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Button,
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Business as BusinessIcon,
    CalendarToday as CalendarIcon,
    TrendingUp as TrendingUpIcon,
    Group as GroupIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useSubscriptionStatus } from '../../hooks/useSubscription';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const OverviewTab: React.FC = () => {
    const { user } = useAuth();
    const subscriptionStatus = useSubscriptionStatus();
    const navigate = useNavigate();

    if (!user) {
        return (
            <Alert severity="info">
                Loading user information...
            </Alert>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'success';
            case 'trial':
            case 'trialing':
                return 'info';
            case 'past_due':
                return 'warning';
            case 'expired':
            case 'canceled':
                return 'error';
            default:
                return 'default';
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case 'enterprise':
                return 'error';
            case 'pro':
            case 'pharmily':
                return 'secondary';
            case 'basic':
                return 'primary';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            {/* Profile Summary Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Avatar and Basic Info */}
                        <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                    src={getAvatarUrl(user.avatar)}
                                    sx={{ width: 120, height: 120, fontSize: '3rem' }}
                                >
                                    {user.firstName?.[0]}
                                    {user.lastName?.[0]}
                                </Avatar>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" gutterBottom>
                                        {user.firstName} {user.lastName}
                                    </Typography>
                                    <Chip
                                        label={user.role?.replace('_', ' ').toUpperCase()}
                                        color="primary"
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                    {user.professionalTitle && (
                                        <Typography variant="body2" color="text.secondary">
                                            {user.professionalTitle}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Grid>

                        {/* Contact Information */}
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" gutterBottom>
                                Contact Information
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon>
                                        <EmailIcon color="action" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Email"
                                        secondary={user.email}
                                    />
                                </ListItem>
                                {user.phone && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <PhoneIcon color="action" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Phone"
                                            secondary={user.phone}
                                        />
                                    </ListItem>
                                )}
                                {user.location && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <BusinessIcon color="action" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Location"
                                            secondary={user.location}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Grid>

                        {/* Account Status */}
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" gutterBottom>
                                Account Status
                            </Typography>
                            <List dense>
                                <ListItem>
                                    <ListItemIcon>
                                        {user.status === 'active' ? (
                                            <CheckCircleIcon color="success" />
                                        ) : (
                                            <WarningIcon color="warning" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Status"
                                        secondary={
                                            <Chip
                                                label={user.status?.toUpperCase()}
                                                size="small"
                                                color={user.status === 'active' ? 'success' : 'warning'}
                                            />
                                        }
                                    />
                                </ListItem>
                                {user.createdAt && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <CalendarIcon color="action" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Member Since"
                                            secondary={format(new Date(user.createdAt), 'MMMM yyyy')}
                                        />
                                    </ListItem>
                                )}
                                {user.lastLoginAt && (
                                    <ListItem>
                                        <ListItemIcon>
                                            <InfoIcon color="action" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Last Login"
                                            secondary={format(new Date(user.lastLoginAt), 'PPp')}
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Subscription Status Card */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Subscription Status
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate('/subscriptions')}
                        >
                            View Plans
                        </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Current Plan
                                </Typography>
                                <Chip
                                    label={subscriptionStatus.tier?.replace('_', ' ').toUpperCase() || 'FREE'}
                                    color={getTierColor(subscriptionStatus.tier || '')}
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Status
                                </Typography>
                                <Chip
                                    label={subscriptionStatus.status?.toUpperCase() || 'UNKNOWN'}
                                    color={getStatusColor(subscriptionStatus.status || '')}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Access Level
                                </Typography>
                                <Typography variant="h6" color="primary">
                                    {subscriptionStatus.accessLevel?.toUpperCase() || 'BASIC'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {subscriptionStatus.isTrialActive ? 'Trial Days Left' : 'Days Until Renewal'}
                                </Typography>
                                <Typography variant="h6" color={subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining < 7 ? 'error' : 'success'}>
                                    {subscriptionStatus.daysRemaining || 'N/A'}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {subscriptionStatus.message && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {subscriptionStatus.message}
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <Grid container spacing={3}>
                {/* Workspace Stats - Placeholder for future implementation */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <BusinessIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Workspace
                                    </Typography>
                                    <Typography variant="h6">
                                        Active
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Team Members - Placeholder */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <GroupIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Team Members
                                    </Typography>
                                    <Typography variant="h6">
                                        {user.teamMembers?.length || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Features Enabled - Placeholder */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TrendingUpIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Features Enabled
                                    </Typography>
                                    <Typography variant="h6">
                                        {user.features?.length || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Permissions - Placeholder */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <PeopleIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Permissions
                                    </Typography>
                                    <Typography variant="h6">
                                        {user.permissions?.length || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default OverviewTab;
