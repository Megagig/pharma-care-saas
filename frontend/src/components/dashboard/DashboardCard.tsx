import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  navigateTo?: string;
  subtitle?: string;
  loading?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color,
  navigateTo,
  subtitle,
  loading = false,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: navigateTo ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': navigateTo
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          : {},
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              sx={{ color, fontWeight: 'bold' }}
            >
              {loading ? '...' : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Box sx={{ color, fontSize: '2.5rem', mb: 1 }}>{icon}</Box>
            {navigateTo && (
              <IconButton size="small" sx={{ color }}>
                <ArrowForwardIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
