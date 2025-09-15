import React from 'react';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  navigateTo: string;
  buttonText?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  color,
  navigateTo,
  buttonText = 'Go',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(navigateTo);
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
      }}
      onClick={handleClick}
    >
      <CardContent
        sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <Box sx={{ color, fontSize: '2rem', mr: 2 }}>{icon}</Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, flexGrow: 1 }}
        >
          {description}
        </Typography>

        <Button
          variant="contained"
          sx={{
            backgroundColor: color,
            '&:hover': {
              backgroundColor: `${color}dd`,
            },
            alignSelf: 'flex-start',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActionCard;
