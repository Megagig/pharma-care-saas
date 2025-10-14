import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
    Collapse,
} from '@mui/material';
import {
    Person as PersonIcon,
    Flag as FlagIcon,
    FlagOutlined as FlagOutlinedIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { AuditLog } from '../../services/superAdminAuditService';

interface ActivityCardProps {
    activity: AuditLog;
    onFlag?: (auditId: string, flagged: boolean) => void;
    onViewDetails?: (activity: AuditLog) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onFlag, onViewDetails }) => {
    const [expanded, setExpanded] = React.useState(false);

    const getRiskLevelColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'critical':
                return 'error';
            case 'high':
                return 'warning';
            case 'medium':
                return 'info';
            case 'low':
            default:
                return 'success';
        }
    };

    const getRiskLevelIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case 'critical':
                return <ErrorIcon fontSize="small" />;
            case 'high':
                return <WarningIcon fontSize="small" />;
            case 'medium':
                return <InfoIcon fontSize="small" />;
            case 'low':
            default:
                return <CheckCircleIcon fontSize="small" />;
        }
    };

    const getActivityTypeColor = (activityType: string): any => {
        const colors: Record<string, any> = {
            authentication: 'primary',
            authorization: 'secondary',
            user_management: 'info',
            patient_management: 'success',
            medication_management: 'warning',
            mtr_session: 'info',
            clinical_intervention: 'success',
            communication: 'primary',
            workspace_management: 'secondary',
            security_event: 'error',
            system_configuration: 'warning',
            file_operation: 'default',
            report_generation: 'info',
            audit_export: 'warning',
            diagnostic_ai: 'secondary',
            subscription_management: 'primary',
            payment_transaction: 'success',
            compliance_event: 'warning',
            data_export: 'error',
            data_import: 'info',
            other: 'default',
        };
        return colors[activityType] || 'default';
    };

    const handleToggleFlag = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onFlag) {
            onFlag(activity._id, !activity.flagged);
        }
    };

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    return (
        <Card
            sx={{
                mb: 2,
                border: activity.flagged ? '2px solid' : '1px solid',
                borderColor: activity.flagged ? 'error.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                },
            }}
            onClick={() => onViewDetails && onViewDetails(activity)}
        >
            <CardContent>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                    {/* User Avatar and Details */}
                    <Box display="flex" alignItems="flex-start" flex={1}>
                        <Avatar
                            src={activity.userDetails.avatarUrl}
                            sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.main' }}
                        >
                            {activity.userDetails.firstName.charAt(0)}
                            {activity.userDetails.lastName.charAt(0)}
                        </Avatar>

                        <Box flex={1}>
                            {/* User Name and Email */}
                            <Typography variant="subtitle1" fontWeight="bold">
                                {activity.userDetails.firstName} {activity.userDetails.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                {activity.userDetails.email} · {activity.userDetails.role}
                                {activity.userDetails.workplaceRole && ` (${activity.userDetails.workplaceRole})`}
                            </Typography>

                            {/* Description */}
                            <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                                {activity.description}
                            </Typography>

                            {/* Target Entity */}
                            {activity.targetEntity && (
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <Typography variant="caption" color="text.secondary">
                                        Target:
                                    </Typography>
                                    <Chip
                                        label={`${activity.targetEntity.entityType}: ${activity.targetEntity.entityName}`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            )}

                            {/* Chips */}
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                                <Chip
                                    label={activity.activityType.replace(/_/g, ' ')}
                                    size="small"
                                    color={getActivityTypeColor(activity.activityType)}
                                    variant="filled"
                                />
                                <Chip
                                    icon={getRiskLevelIcon(activity.riskLevel)}
                                    label={activity.riskLevel.toUpperCase()}
                                    size="small"
                                    color={getRiskLevelColor(activity.riskLevel)}
                                    variant="outlined"
                                />
                                {activity.complianceCategory && (
                                    <Chip
                                        label={activity.complianceCategory}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                )}
                                {!activity.success && (
                                    <Chip
                                        label="FAILED"
                                        size="small"
                                        color="error"
                                        variant="filled"
                                    />
                                )}
                            </Box>

                            {/* Timestamp and Location */}
                            <Box display="flex" gap={2} mt={1}>
                                <Typography variant="caption" color="text.secondary">
                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })} ·{' '}
                                    {new Date(activity.timestamp).toLocaleString()}
                                </Typography>
                                {activity.ipAddress && (
                                    <Typography variant="caption" color="text.secondary">
                                        IP: {activity.ipAddress}
                                    </Typography>
                                )}
                                {activity.location && (
                                    <Typography variant="caption" color="text.secondary">
                                        {[activity.location.city, activity.location.region, activity.location.country]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Actions */}
                    <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
                        <Box>
                            <Tooltip title={activity.flagged ? 'Unflag' : 'Flag for review'}>
                                <IconButton
                                    size="small"
                                    onClick={handleToggleFlag}
                                    color={activity.flagged ? 'error' : 'default'}
                                >
                                    {activity.flagged ? <FlagIcon /> : <FlagOutlinedIcon />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={expanded ? 'Show less' : 'Show more'}>
                                <IconButton size="small" onClick={handleExpandClick}>
                                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                </Box>

                {/* Expanded Details */}
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {/* Request Details */}
                        {activity.requestMethod && activity.requestPath && (
                            <Box mb={2}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                    Request Details:
                                </Typography>
                                <Typography variant="body2">
                                    {activity.requestMethod} {activity.requestPath}
                                    {activity.responseStatus && ` (${activity.responseStatus})`}
                                </Typography>
                            </Box>
                        )}

                        {/* Changes */}
                        {activity.changes && activity.changes.length > 0 && (
                            <Box mb={2}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                    Changes:
                                </Typography>
                                {activity.changes.map((change, index) => (
                                    <Box key={index} sx={{ ml: 1, mt: 0.5 }}>
                                        <Typography variant="body2">
                                            <strong>{change.field}:</strong>{' '}
                                            <span style={{ textDecoration: 'line-through', color: 'red' }}>
                                                {JSON.stringify(change.oldValue)}
                                            </span>{' '}
                                            →{' '}
                                            <span style={{ color: 'green' }}>
                                                {JSON.stringify(change.newValue)}
                                            </span>
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* Metadata */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <Box mb={2}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                    Metadata:
                                </Typography>
                                <Box
                                    component="pre"
                                    sx={{
                                        fontSize: '0.75rem',
                                        bgcolor: 'grey.100',
                                        p: 1,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        maxHeight: '200px',
                                    }}
                                >
                                    {JSON.stringify(activity.metadata, null, 2)}
                                </Box>
                            </Box>
                        )}

                        {/* Error Details */}
                        {activity.errorMessage && (
                            <Box>
                                <Typography variant="caption" fontWeight="bold" color="error">
                                    Error:
                                </Typography>
                                <Typography variant="body2" color="error">
                                    {activity.errorMessage}
                                </Typography>
                            </Box>
                        )}

                        {/* Review Notes */}
                        {activity.reviewNotes && (
                            <Box mt={2} p={1} bgcolor="info.light" borderRadius={1}>
                                <Typography variant="caption" fontWeight="bold">
                                    Review Notes:
                                </Typography>
                                <Typography variant="body2">{activity.reviewNotes}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Reviewed {formatDistanceToNow(new Date(activity.reviewedAt!), { addSuffix: true })}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default ActivityCard;
