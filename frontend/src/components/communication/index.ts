// Core chat interface components
export { default as ChatInterface } from './ChatInterface';
export { default as MessageThread } from './MessageThread';
export { default as MessageItem } from './MessageItem';
export { default as ParticipantList } from './ParticipantList';

// Conversation management components
export { default as ConversationList } from './ConversationList';
export { default as ConversationItem } from './ConversationItem';
export { default as NewConversationModal } from './NewConversationModal';
export { default as ConversationSettings } from './ConversationSettings';

// Utility components
export { default as ConnectionStatus } from './ConnectionStatus';
export { default as TypingIndicator } from './TypingIndicator';

// File management components
export { default as FileUpload } from './FileUpload';
export { default as FilePreview } from './FilePreview';

// Notification components
export { default as NotificationCenter } from './NotificationCenter';
export { default as NotificationItem } from './NotificationItem';
export { default as NotificationPreferences } from './NotificationPreferences';
export { default as NotificationIndicators } from './NotificationIndicators';

// Patient query management components
export { default as PatientQueryDashboard } from './PatientQueryDashboard';
export { default as QueryCard } from './QueryCard';

// Export types for external use
export type { default as ChatInterfaceProps } from './ChatInterface';
export type { default as MessageThreadProps } from './MessageThread';
export type { default as MessageItemProps } from './MessageItem';
export type { default as ParticipantListProps } from './ParticipantList';