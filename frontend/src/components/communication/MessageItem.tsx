import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Paper,
  Tooltip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  MoreVert,
  Reply,
  Edit,
  Delete,
  Check,
  CheckCircle,
  Schedule,
  Error as ErrorIcon,
  AttachFile,
  Download,
  Image as ImageIcon,
  Description,
} from '@mui/icons-material';
import { Message } from '../../stores/types';
import { formatDistanceToNow, format } from 'date-fns';
import MentionDisplay from './MentionDisplay';

interface MessageItemProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isOwn?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  compact?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  showAvatar = true,
  showTimestamp = true,
  isOwn = false,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  compact = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(message.content.text || '');
  const [showReactions, setShowReactions] = useState(false);

  const menuOpen = Boolean(menuAnchor);

  // Handle menu actions
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleReply = () => {
    onReply?.(message);
    handleMenuClose();
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(message._id);
    handleMenuClose();
  };

  const handleEditSave = () => {
    if (editContent.trim() !== message.content.text) {
      onEdit?.(message._id, editContent.trim());
    }
    setEditDialogOpen(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content.text || '');
    setEditDialogOpen(false);
  };

  // Handle reactions
  const handleReactionClick = (emoji: string) => {
    onReaction?.(message._id, emoji);
    setShowReactions(false);
  };

  // Get message status icon
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check fontSize="small" color="disabled" />;
      case 'delivered':
        return <CheckCircle fontSize="small" color="disabled" />;
      case 'read':
        return <CheckCircle fontSize="small" color="primary" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <Schedule fontSize="small" color="disabled" />;
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon />;
    }
    return <Description />;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, yyyy h:mm a');
  };

  // Check if user has reacted with emoji
  const hasUserReacted = (emoji: string) => {
    // TODO: Get current user ID and check reactions
    return false;
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  if (message.isDeleted) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1,
          px: 2,
          opacity: 0.6,
        }}
      >
        {showAvatar && (
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
            <Delete fontSize="small" />
          </Avatar>
        )}
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          This message was deleted
        </Typography>
        {showTimestamp && (
          <Typography variant="caption" color="text.secondary">
            {formatTimestamp(message.deletedAt || message.createdAt)}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        py: compact ? 0.5 : 1,
        px: 1,
        '&:hover': {
          bgcolor: 'action.hover',
        },
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar sx={{ width: 32, height: 32 }}>
          {/* TODO: Get user initials or avatar */}U
        </Avatar>
      ) : (
        <Box sx={{ width: 32 }} /> // Spacer for alignment
      )}

      {/* Message Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        {showAvatar && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {/* TODO: Get user name */}
              User Name
            </Typography>

            {message.priority === 'urgent' && (
              <Chip
                label="Urgent"
                size="small"
                color="error"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            )}

            {showTimestamp && (
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(message.createdAt)}
              </Typography>
            )}

            {message.editHistory.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                (edited)
              </Typography>
            )}
          </Box>
        )}

        {/* Message Content */}
        <Box>
          {/* Text Content with Mentions */}
          {message.content.text && (
            <MentionDisplay
              text={message.content.text}
              mentions={message.mentions}
              variant="body2"
              onMentionClick={(userId) => {
                // TODO: Handle mention click (e.g., show user profile)
                console.log('Mention clicked:', userId);
              }}
              sx={{
                mb: message.content.attachments?.length ? 1 : 0,
              }}
            />
          )}

          {/* Attachments */}
          {message.content.attachments &&
            message.content.attachments.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {message.content.attachments.map((attachment, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{
                      p: 1,
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      maxWidth: 300,
                    }}
                  >
                    {getFileIcon(attachment.mimeType)}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {attachment.fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() =>
                          window.open(attachment.secureUrl, '_blank')
                        }
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
              </Box>
            )}

          {/* Reactions */}
          {Object.keys(groupedReactions).length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <Chip
                  key={emoji}
                  label={`${emoji} ${reactions.length}`}
                  size="small"
                  variant={hasUserReacted(emoji) ? 'filled' : 'outlined'}
                  onClick={() => handleReactionClick(emoji)}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Status Icon */}
        {isOwn && (
          <Tooltip title={`Message ${message.status}`}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getStatusIcon()}
            </Box>
          </Tooltip>
        )}

        {/* Quick Actions */}
        <Box
          sx={{
            display: 'flex',
            opacity: 0,
            transition: 'opacity 0.2s',
            '.MuiBox-root:hover &': {
              opacity: 1,
            },
          }}
        >
          <Tooltip title="Reply">
            <IconButton size="small" onClick={handleReply}>
              <Reply fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add reaction">
            <IconButton
              size="small"
              onClick={() => setShowReactions(!showReactions)}
            >
              😊
            </IconButton>
          </Tooltip>

          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleReply}>
          <Reply fontSize="small" sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        {isOwn && (
          <MenuItem onClick={handleEdit}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        {isOwn && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Reaction Picker */}
      {showReactions && (
        <Paper
          sx={{
            position: 'absolute',
            zIndex: 1000,
            p: 1,
            display: 'flex',
            gap: 0.5,
            mt: 4,
          }}
        >
          {['👍', '❤️', '😊', '😮', '😢', '😡'].map((emoji) => (
            <Button
              key={emoji}
              size="small"
              onClick={() => handleReactionClick(emoji)}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              {emoji}
            </Button>
          ))}
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your message..."
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={!editContent.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageItem;
