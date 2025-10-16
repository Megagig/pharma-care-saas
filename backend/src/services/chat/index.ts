/**
 * Chat Services Index
 * 
 * Exports all chat-related services for the communication module rebuild
 */

export { ChatService, chatService } from './ChatService';
export type {
  CreateConversationDTO,
  UpdateConversationDTO,
  ConversationFilters,
  SendMessageDTO,
  MessageFilters,
} from './ChatService';

export { ChatSocketService, initializeChatSocketService, getChatSocketService } from './ChatSocketService';

export { ChatFileService, chatFileService } from './ChatFileService';
export type { UploadFileData, FileUploadResult } from './ChatFileService';

export { ChatNotificationService, chatNotificationService } from './ChatNotificationService';
export type { ChatNotificationPreferences } from './ChatNotificationService';
