import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Button,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    Collapse,
} from '@mui/material';
import {
    FilterList as FilterListIcon,
    Clear as ClearIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuditFilters as AuditFiltersType } from '../../services/superAdminAuditService';

interface AuditFiltersProps {
    filters: AuditFiltersType;
    onChange: (filters: AuditFiltersType) => void;
    activityTypes: string[];
    riskLevels: string[];
}

const AuditFilters: React.FC<AuditFiltersProps> = ({
    filters,
    onChange,
    activityTypes,
    riskLevels,
}) => {
    const [expanded, setExpanded] = React.useState(true);

    const handleFilterChange = (field: string, value: any) => {
        onChange({
            ...filters,
            [field]: value === '' ? undefined : value,
        });
    };

    const handleClearFilters = () => {
        onChange({
            page: 1,
            limit: 50,
        });
    };

    const activeFiltersCount = Object.keys(filters).filter(
        (key) => filters[key as keyof AuditFiltersType] && !['page', 'limit'].includes(key)
    ).length;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <FilterListIcon color="primary" />
                        <Typography variant="h6">Filters</Typography>
                        {activeFiltersCount > 0 && (
                            <Chip
                                label={`${activeFiltersCount} active`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        )}
                    </Box>
                    <Box>
                        {activeFiltersCount > 0 && (
                            <Tooltip title="Clear all filters">
                                <IconButton size="small" onClick={handleClearFilters} color="error">
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={expanded ? 'Collapse filters' : 'Expand filters'}>
                            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={2}>
                            {/* Date Range */}
                            <Grid item xs={12} md={6}>
                                <DatePicker
                                    label="Start Date"
                                    value={filters.startDate ? new Date(filters.startDate) : null}
                                    onChange={(date) =>
                                        handleFilterChange('startDate', date ? date.toISOString() : '')
                                    }
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <DatePicker
                                    label="End Date"
                                    value={filters.endDate ? new Date(filters.endDate) : null}
                                    onChange={(date) =>
                                        handleFilterChange('endDate', date ? date.toISOString() : '')
                                    }
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: 'small',
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Activity Type */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Activity Type</InputLabel>
                                    <Select
                                        value={filters.activityType || ''}
                                        label="Activity Type"
                                        onChange={(e) => handleFilterChange('activityType', e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>All</em>
                                        </MenuItem>
                                        {activityTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type.replace(/_/g, ' ').toUpperCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Risk Level */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Risk Level</InputLabel>
                                    <Select
                                        value={filters.riskLevel || ''}
                                        label="Risk Level"
                                        onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>All</em>
                                        </MenuItem>
                                        {riskLevels.map((level) => (
                                            <MenuItem key={level} value={level}>
                                                {level.toUpperCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Success Status */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={
                                            filters.success === undefined ? '' : filters.success ? 'true' : 'false'
                                        }
                                        label="Status"
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'success',
                                                e.target.value === '' ? undefined : e.target.value === 'true'
                                            )
                                        }
                                    >
                                        <MenuItem value="">
                                            <em>All</em>
                                        </MenuItem>
                                        <MenuItem value="true">Success</MenuItem>
                                        <MenuItem value="false">Failed</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Flagged Status */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Flagged</InputLabel>
                                    <Select
                                        value={
                                            filters.flagged === undefined ? '' : filters.flagged ? 'true' : 'false'
                                        }
                                        label="Flagged"
                                        onChange={(e) =>
                                            handleFilterChange(
                                                'flagged',
                                                e.target.value === '' ? undefined : e.target.value === 'true'
                                            )
                                        }
                                    >
                                        <MenuItem value="">
                                            <em>All</em>
                                        </MenuItem>
                                        <MenuItem value="true">Flagged</MenuItem>
                                        <MenuItem value="false">Not Flagged</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Compliance Category */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Compliance Category</InputLabel>
                                    <Select
                                        value={filters.complianceCategory || ''}
                                        label="Compliance Category"
                                        onChange={(e) => handleFilterChange('complianceCategory', e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>All</em>
                                        </MenuItem>
                                        <MenuItem value="HIPAA">HIPAA</MenuItem>
                                        <MenuItem value="SOX">SOX</MenuItem>
                                        <MenuItem value="GDPR">GDPR</MenuItem>
                                        <MenuItem value="PCI_DSS">PCI DSS</MenuItem>
                                        <MenuItem value="GENERAL">GENERAL</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Search Query */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Search"
                                    placeholder="Search descriptions, users, emails..."
                                    value={filters.searchQuery || ''}
                                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                                />
                            </Grid>

                            {/* User ID (for advanced filtering) */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="User ID"
                                    placeholder="Filter by specific user ID"
                                    value={filters.userId || ''}
                                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                                />
                            </Grid>

                            {/* Workplace ID (for advanced filtering) */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Workplace ID"
                                    placeholder="Filter by specific workplace ID"
                                    value={filters.workplaceId || ''}
                                    onChange={(e) => handleFilterChange('workplaceId', e.target.value)}
                                />
                            </Grid>

                            {/* Items per page */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Items per page</InputLabel>
                                    <Select
                                        value={filters.limit || 50}
                                        label="Items per page"
                                        onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                                    >
                                        <MenuItem value={10}>10</MenuItem>
                                        <MenuItem value={25}>25</MenuItem>
                                        <MenuItem value={50}>50</MenuItem>
                                        <MenuItem value={100}>100</MenuItem>
                                        <MenuItem value={200}>200</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Apply/Reset Buttons */}
                            <Grid item xs={12}>
                                <Box display="flex" justifyContent="flex-end" gap={2}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        onClick={handleClearFilters}
                                        disabled={activeFiltersCount === 0}
                                    >
                                        Reset All
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default AuditFilters;
