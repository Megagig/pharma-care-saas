import React from 'react';
import { Button, Box, Typography } from '@mui/material';

interface DebugConversationClickProps {
  conversationId: string;
  onSelect: (id: string) => void;
}

const DebugConversationClick: React.FC<DebugConversationClickProps> = ({
  conversationId,
  onSelect,
}) => {
  const handleClick = () => {
    console.log('🔍 [DebugConversationClick] Button clicked for:', conversationId);
    onSelect(conversationId);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid red', m: 1 }}>
      <Typography variant="body2">Debug: Conversation {conversationId}</Typography>
      <Button 
        variant="contained" 
        onClick={handleClick}
        sx={{ mt: 1 }}
      >
        Select This Conversation
      </Button>
    </Box>
  );
};

export default DebugConversationClick;