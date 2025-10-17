import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  MoreVert,
  Info,
  Archive,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useCommunicationStore } from '../../stores/communicationStore';
import { useSocketConnection } from '../../hooks/useSocket';
import MessageThread from './MessageThread';
import ParticipantList from './ParticipantList';
import ConnectionStatus from './ConnectionStatus';
import TypingIndicator from './TypingIndicator';
import { Conversation, Message } from '../../stores/types';

interface ChatInterfaceProps {
  conversationId: string;
  patientId?: string;
  height?: string | number;
  showParticipants?: boolean;
  showHeader?: boolean;
  onConversationAction?: (action: string, conversationId: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  patientId,
  height = '600px',
  showParticipants = true,
  showHeader = true,
  onConversationAction,
}) => {
  const {
    activeConversation,
    messages,
    messageLoading,
    setActiveConversation,
    fetchMessages,
    sendMessage,
    markConversationAsRead,
    loading,
    errors,
  } = useCommunicationStore();

  const { isConnected } = useSocketConnection();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get conversation messages
  const conversationMessages = messages[conversationId] || [];

  // Get current conversation
  const conversation =
    activeConversation?._id === conversationId ? activeConversation : null;

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      markConversationAsRead(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Handle sending messages
  const handleSendMessage = async (
    content: string,
    attachments?: File[],
    threadId?: string,
    parentMessageId?: string,
    mentions?: string[]
  ) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return;
    }

    const messageData = {
      conversationId,
      content: {
        text: content.trim(),
        type: 'text' as const,
        attachments,
      },
      threadId,
      parentMessageId,
      mentions,
    };

    await sendMessage(messageData);
  };

  // Handle conversation actions
  const handleConversationAction = (action: string) => {
    onConversationAction?.(action, conversationId);
  };

  // Get conversation status info
  const getStatusInfo = () => {
    if (!conversation) return null;

    switch (conversation.status) {
      case 'resolved':
        return {
          icon: <CheckCircle color="success" />,
          text: 'Resolved',
          color: 'success.main',
        };
      case 'archived':
        return {
          icon: <Archive color="disabled" />,
          text: 'Archived',
          color: 'text.disabled',
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  // Show error if conversation not found
  if (!conversation && !messageLoading) {
    return (
      <Paper
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box textAlign="center">
          <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            Conversation not found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The conversation you're looking for doesn't exist or you don't have
            access to it.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      {showHeader && conversation && (
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" noWrap>
                {conversation.title || 'Conversation'}
              </Typography>
              {statusInfo && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: statusInfo.color,
                  }}
                >
                  {statusInfo.icon}
                  <Typography variant="caption">{statusInfo.text}</Typography>
                </Box>
              )}
            </Box>

            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                {conversation.participants.length} participant
                {conversation.participants.length !== 1 ? 's' : ''}
              </Typography>

              {conversation.priority !== 'normal' && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor:
                      conversation.priority === 'urgent'
                        ? 'error.light'
                        : 'warning.light',
                    color:
                      conversation.priority === 'urgent'
                        ? 'error.contrastText'
                        : 'warning.contrastText',
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                  }}
                >
                  {conversation.priority}
                </Typography>
              )}

              <ConnectionStatus variant="icon" size="small" />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showParticipants && (
              <Tooltip title="Show participants">
                <IconButton
                  size="small"
                  onClick={() => setParticipantsOpen(!participantsOpen)}
                  color={participantsOpen ? 'primary' : 'default'}
                >
                  <Info />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="More options">
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert severity="warning" sx={{ m: 1 }}>
          You're currently offline. Messages will be sent when connection is
          restored.
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Messages Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Message Thread */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <MessageThread
              conversationId={conversationId}
              messages={conversationMessages}
              onSendMessage={handleSendMessage}
              loading={messageLoading || loading.fetchMessages}
              error={errors.fetchMessages}
            />
          </Box>

          {/* Typing Indicator */}
          <TypingIndicator
            conversationId={conversationId}
            participants={conversation?.participants.map((p) => ({
              userId: p.userId,
              firstName: 'User', // TODO: Get actual user names
              lastName: '',
            }))}
            variant="compact"
          />

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </Box>

        {/* Participants Sidebar */}
        {showParticipants && participantsOpen && conversation && (
          <>
            <Divider orientation="vertical" />
            <Box sx={{ width: 280, flexShrink: 0 }}>
              <ParticipantList
                conversation={conversation}
                onAddParticipant={(userId, role) => {
                  // TODO: Implement add participant
                  console.log('Add participant:', userId, role);
                }}
                onRemoveParticipant={(userId) => {
                  // TODO: Implement remove participant
                  console.log('Remove participant:', userId);
                }}
              />
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default ChatInterface;
