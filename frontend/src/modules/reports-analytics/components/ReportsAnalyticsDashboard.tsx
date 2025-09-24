// Reports Analytics Dashboard - Safe store integration
import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useReportsStore } from '../stores';
import { useDashboardStore } from '../stores/dashboardStore';
import { ReportType } from '../types/reports';
import FixedGrid from '../../../components/common/FixedGrid';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StarIcon from '@mui/icons-material/Star';
import SecurityIcon from '@mui/icons-material/Security';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';

interface ReportsAnalyticsDashboardProps {
  initialReportType?: string;
  workspaceId?: string;
  userPermissions?: string[];
}

const ReportsAnalyticsDashboard: React.FC<
  ReportsAnalyticsDashboardProps
> = () => {
  // Get store state directly for reactive updates
  const activeReport = useReportsStore((state) => state.activeReport);
  const setActiveReportStore = useReportsStore(
    (state) => state.setActiveReport
  );
  const addToHistory = useReportsStore((state) => state.addToHistory);

  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const selectedCategory = useDashboardStore((state) => state.selectedCategory);
  const favoriteReports = useDashboardStore((state) => state.favoriteReports);
  const setSearchQueryStore = useDashboardStore(
    (state) => state.setSearchQuery
  );
  const setSelectedCategoryStore = useDashboardStore(
    (state) => state.setSelectedCategory
  );
  const toggleFavoriteStore = useDashboardStore(
    (state) => state.toggleFavorite
  );
  const addToRecentlyViewed = useDashboardStore(
    (state) => state.addToRecentlyViewed
  );
  const recentlyViewed = useDashboardStore((state) => state.recentlyViewed);

  // Get store instances for fallback
  const reportsStore = useReportsStore();
  const dashboardStore = useDashboardStore();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Create icon elements once to prevent recreation
  const icons = useMemo(
    () => ({
      trendingUp: <TrendingUpIcon />,
      localPharmacy: <LocalPharmacyIcon />,
      analytics: <AnalyticsIcon />,
      star: <StarIcon />,
      security: <SecurityIcon />,
      attachMoney: <AttachMoneyIcon />,
      timeline: <TimelineIcon />,
      speed: <SpeedIcon />,
      inventory: <InventoryIcon />,
      people: <PeopleIcon />,
      warning: <WarningIcon />,
      build: <BuildIcon />,
    }),
    []
  );

  // Report configuration with categories, icons, and metadata
  const reportConfig = useMemo(() => {
    const config = {
      [ReportType.PATIENT_OUTCOMES]: {
        label: 'Patient Outcomes',
        description:
          'Analyze patient therapy outcomes, clinical improvements, and quality of life metrics.',
        icon: icons.trendingUp,
        category: 'Clinical',
        priority: 1,
        tags: ['outcomes', 'clinical', 'therapy'],
        color: theme.palette.success.main,
      },
      [ReportType.PHARMACIST_INTERVENTIONS]: {
        label: 'Pharmacist Interventions',
        description:
          'Track pharmacist interventions, acceptance rates, and clinical impact.',
        icon: icons.localPharmacy,
        category: 'Clinical',
        priority: 2,
        tags: ['interventions', 'pharmacist', 'clinical'],
        color: theme.palette.primary.main,
      },
      [ReportType.THERAPY_EFFECTIVENESS]: {
        label: 'Therapy Effectiveness',
        description:
          'Evaluate medication adherence, therapy completion rates, and effectiveness.',
        icon: icons.analytics,
        category: 'Clinical',
        priority: 3,
        tags: ['therapy', 'effectiveness', 'adherence'],
        color: theme.palette.info.main,
      },
      [ReportType.QUALITY_IMPROVEMENT]: {
        label: 'Quality Improvement',
        description:
          'Monitor quality metrics, completion times, and process improvements.',
        icon: icons.star,
        category: 'Quality',
        priority: 4,
        tags: ['quality', 'improvement', 'metrics'],
        color: theme.palette.warning.main,
      },
      [ReportType.REGULATORY_COMPLIANCE]: {
        label: 'Regulatory Compliance',
        description:
          'Ensure regulatory compliance with audit trails and documentation.',
        icon: icons.security,
        category: 'Compliance',
        priority: 5,
        tags: ['compliance', 'regulatory', 'audit'],
        color: theme.palette.error.main,
      },
      [ReportType.COST_EFFECTIVENESS]: {
        label: 'Cost Effectiveness',
        description:
          'Analyze cost savings, ROI, and financial impact of interventions.',
        icon: icons.attachMoney,
        category: 'Financial',
        priority: 6,
        tags: ['cost', 'financial', 'roi'],
        color: theme.palette.success.dark,
      },
      [ReportType.TREND_FORECASTING]: {
        label: 'Trend Forecasting',
        description:
          'Identify trends and generate forecasts for strategic planning.',
        icon: icons.timeline,
        category: 'Analytics',
        priority: 7,
        tags: ['trends', 'forecasting', 'analytics'],
        color: theme.palette.secondary.main,
      },
      [ReportType.OPERATIONAL_EFFICIENCY]: {
        label: 'Operational Efficiency',
        description:
          'Optimize workflows, resource utilization, and operational performance.',
        icon: icons.speed,
        category: 'Operations',
        priority: 8,
        tags: ['operations', 'efficiency', 'workflow'],
        color: theme.palette.info.dark,
      },
      [ReportType.MEDICATION_INVENTORY]: {
        label: 'Medication Inventory',
        description:
          'Manage inventory, track usage patterns, and forecast demand.',
        icon: icons.inventory,
        category: 'Operations',
        priority: 9,
        tags: ['inventory', 'medication', 'demand'],
        color: theme.palette.primary.dark,
      },
      [ReportType.PATIENT_DEMOGRAPHICS]: {
        label: 'Patient Demographics',
        description:
          'Understand patient populations and service utilization patterns.',
        icon: icons.people,
        category: 'Analytics',
        priority: 10,
        tags: ['demographics', 'patients', 'population'],
        color: theme.palette.secondary.dark,
      },
      [ReportType.ADVERSE_EVENTS]: {
        label: 'Adverse Events',
        description:
          'Monitor adverse events, safety patterns, and risk assessment.',
        icon: icons.warning,
        category: 'Safety',
        priority: 11,
        tags: ['safety', 'adverse', 'events'],
        color: theme.palette.error.dark,
      },
      [ReportType.CUSTOM_TEMPLATES]: {
        label: 'Custom Templates',
        description:
          'Create and manage custom report templates for specific needs.',
        icon: icons.build,
        category: 'Templates',
        priority: 12,
        tags: ['templates', 'custom', 'builder'],
        color: theme.palette.grey[600],
      },
    };
    return config;
  }, [theme, icons]);

  // Get report categories
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(Object.values(reportConfig).map((r) => r.category))
    );
    return ['all', ...cats.sort()];
  }, [reportConfig]);

  // Get recent reports from store
  const recentReports = recentlyViewed.slice(0, 5);

  // Store interaction functions
  const handleReportClick = useCallback(
    (reportType: string) => {
      console.log('🎯 Report clicked:', reportType);

      try {
        const reportTypeEnum = reportType as ReportType;

        // Update stores directly using the store functions
        setActiveReportStore(reportTypeEnum);
        console.log('✅ Active report set to:', reportTypeEnum);

        // Add to recent reports
        const filters = {
          dateRange: {
            startDate: new Date(),
            endDate: new Date(),
            preset: '30d' as const,
          },
        };
        addToHistory(reportTypeEnum, filters);
        console.log('✅ Added to reports history');

        // Add to dashboard recents
        addToRecentlyViewed(reportTypeEnum, filters);
        console.log('✅ Added to dashboard recents');

        console.log('🎉 Report activation completed successfully');
      } catch (error) {
        console.error('❌ Error handling report click:', error);
      }
    },
    [setActiveReportStore, addToHistory, addToRecentlyViewed]
  );

  const handleFavoriteToggle = useCallback(
    (reportType: string) => {
      console.log('⭐ Favorite toggle clicked:', reportType);

      try {
        const reportTypeEnum = reportType as ReportType;

        // Update store directly
        toggleFavoriteStore(reportTypeEnum);
        console.log('✅ Store favorite toggled');

        console.log('🎉 Favorite toggle completed successfully');
      } catch (error) {
        console.error('❌ Error toggling favorite:', error);
      }
    },
    [toggleFavoriteStore]
  );

  const isFavoriteReport = (reportType: string) =>
    favoriteReports.includes(reportType as ReportType);

  // Handle report generation
  const handleGenerateReport = useCallback(
    (reportType: ReportType) => {
      console.log('🚀 Generate report clicked for:', reportType);

      const reportLabel = reportConfig[reportType]?.label || reportType;

      // Show immediate feedback
      alert(`Generating ${reportLabel} report...`);

      // Simulate report generation
      setTimeout(() => {
        console.log('✅ Report generation completed (simulated)');
        alert(`${reportLabel} report generated successfully!`);

        // You could add actual report generation logic here
        // For example: navigate to a report view, download a file, etc.
      }, 1500);
    },
    [reportConfig]
  );

  // Filter reports based on search and category
  const filteredReports = useMemo(() => {
    let reports = Object.entries(reportConfig);

    // Filter by category
    if (selectedCategory !== 'all') {
      reports = reports.filter(
        ([, config]) => config.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      reports = reports.filter(
        ([reportType, config]) =>
          config.label.toLowerCase().includes(query) ||
          config.description.toLowerCase().includes(query) ||
          config.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort by priority
    return reports.sort(([, a], [, b]) => a.priority - b.priority);
  }, [reportConfig, selectedCategory, searchQuery]);

  // Handle search with store sync
  const handleSearchChange = useCallback(
    (value: string) => {
      console.log('🔍 Search query changed:', value);

      // Update store directly
      setSearchQueryStore(value);
      console.log('✅ Store search query updated');
    },
    [setSearchQueryStore]
  );

  // Handle category change with store sync
  const handleCategoryChange = useCallback(
    (category: string) => {
      console.log('📂 Category changed:', category);

      // Update store directly
      setSelectedCategoryStore(category);
      console.log('✅ Store category updated');
    },
    [setSelectedCategoryStore]
  );

  // Render main dashboard
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Typography
        variant={isMobile ? 'h5' : 'h4'}
        component="h1"
        gutterBottom
        sx={{ fontWeight: 600 }}
      >
        Reports & Analytics
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 600 }}
      >
        Generate comprehensive reports and gain actionable insights into your
        pharmacy operations.
      </Typography>

      {/* Quick Stats */}
      <FixedGrid container spacing={2} sx={{ mb: 4 }}>
        <FixedGrid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary.main">
              {Object.keys(reportConfig).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Report Types
            </Typography>
          </Paper>
        </FixedGrid>
        <FixedGrid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {categories.length - 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories
            </Typography>
          </Paper>
        </FixedGrid>
        <FixedGrid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {recentReports.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recent Reports
            </Typography>
          </Paper>
        </FixedGrid>
        <FixedGrid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              Live
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time Data
            </Typography>
          </Paper>
        </FixedGrid>
      </FixedGrid>

      {/* Search and Filter */}
      <Box sx={{ mb: 4 }}>
        <FixedGrid container spacing={2} alignItems="center">
          <FixedGrid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleSearchChange('')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </FixedGrid>
          <FixedGrid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category === 'all' ? 'All Categories' : category}
                  onClick={() => handleCategoryChange(category)}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  variant={
                    selectedCategory === category ? 'filled' : 'outlined'
                  }
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Box>
          </FixedGrid>
        </FixedGrid>
      </Box>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 4 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No reports found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms or category filter.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              handleSearchChange('');
              handleCategoryChange('all');
            }}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <FixedGrid container spacing={3}>
          {filteredReports.map(([reportType, config]) => (
            <FixedGrid
              item
              xs={12}
              sm={6}
              md={isTablet ? 6 : 4}
              lg={4}
              key={reportType}
            >
              <Fade in timeout={300}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    border:
                      activeReport === reportType
                        ? `2px solid ${config.color}`
                        : '1px solid transparent',
                    backgroundColor:
                      activeReport === reportType
                        ? `${config.color}08`
                        : 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => handleReportClick(reportType)}
                >
                  <CardContent
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}
                    >
                      <Box sx={{ mr: 2, color: config.color, fontSize: 32 }}>
                        {config.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {config.label}
                        </Typography>
                        <Chip
                          label={config.category}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: config.color,
                            color: config.color,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 2,
                      }}
                    >
                      {config.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        mb: 2,
                      }}
                    >
                      {config.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                  <Box
                    sx={{
                      p: 2,
                      pt: 0,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Button size="small" sx={{ color: config.color }}>
                      View Report
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(reportType);
                      }}
                      sx={{
                        color: isFavoriteReport(reportType)
                          ? 'warning.main'
                          : 'text.secondary',
                      }}
                    >
                      <StarIcon
                        fontSize="small"
                        sx={{
                          fill: isFavoriteReport(reportType)
                            ? 'currentColor'
                            : 'none',
                          stroke: 'currentColor',
                          strokeWidth: isFavoriteReport(reportType) ? 0 : 1,
                        }}
                      />
                    </IconButton>
                  </Box>
                </Card>
              </Fade>
            </FixedGrid>
          ))}
        </FixedGrid>
      )}

      {/* Active Report Display */}
      {activeReport && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            {reportConfig[activeReport]?.label || activeReport}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {reportConfig[activeReport]?.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={() => handleGenerateReport(activeReport)}
            >
              Generate Report
            </Button>
            <Button
              variant="outlined"
              onClick={() => setActiveReportStore(null)}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ReportsAnalyticsDashboard;
