  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,

import MobileFileUpload from './MobileFileUpload';

import { Button, Input, Spinner } from '@/components/ui/button';

interface MobileMessageInputProps {
  conversationId: string;
  onSendMessage: (
    content: string,
    attachments?: File[],
    threadId?: string,
    parentMessageId?: string,
    mentions?: string[]
  ) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyToMessage?: any;
  onCancelReply?: () => void;
  threadId?: string;
  parentMessageId?: string;
}
export interface MobileMessageInputRef {
  focus: () => void;
  clear: () => void;
  insertText: (text: string) => void;
}
const MobileMessageInput = forwardRef<
>(
  (
    {
      conversationId,
      onSendMessage,
      onTypingStart,
      onTypingStop,
      disabled = false,
      placeholder = 'Type a message...',
      replyToMessage,
      onCancelReply,
      threadId,
      parentMessageId,
    },
    ref
  ) => {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [attachmentMenuAnchor, setAttachmentMenuAnchor] =
      useState<null | HTMLElement>(null);
    const [mentions, setMentions] = useState<string[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const isTouchDevice = useIsTouchDevice();
    // Expose methods via ref
    useImperativeHandle(ref, () => ({ 
      focus: () => inputRef.current?.focus(),
      clear: () => {
        setMessage('');
        setAttachments([]);
        setMentions([]); })
      },
      insertText: (text: string) => {
        setMessage((prev) => prev + text);
        inputRef.current?.focus();
      }
    // Handle typing indicators
    useEffect(() => {
      if (message.trim()) {
        onTypingStart?.();
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(() => {
          onTypingStop?.();
        }, 1000);
      } else {
        onTypingStop?.();
      }
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }, [message, onTypingStart, onTypingStop]);
    // Handle message change
    const handleMessageChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = event.target.value;
      setMessage(value);
      // Detect mentions (@username)
      const mentionMatches = value.match(/@\w+/g);
      if (mentionMatches) {
        setMentions(mentionMatches.map((mention) => mention.substring(1)));
      } else {
        setMentions([]);
      }
    };
    // Handle send message
    const handleSendMessage = async () => {
      if (
        (!message.trim() && attachments.length === 0) ||
        isSending ||
        disabled
      ) {
        return;
      }
      setIsSending(true);
      try {
        await onSendMessage(
          message.trim(),
          attachments.length > 0 ? attachments : undefined,
          threadId,
          parentMessageId,
          mentions.length > 0 ? mentions : undefined
        );
        // Clear input after successful send
        setMessage('');
        setAttachments([]);
        setMentions([]);
        onCancelReply?.();
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    };
    // Handle key press
    const handleKeyPress = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    };
    // Handle file attachment
    const handleFileAttachment = (files: File[]) => {
      setAttachments((prev) => [...prev, ...files]);
      setShowAttachmentMenu(false);
    };
    // Remove attachment
    const removeAttachment = (index: number) => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    };
    // Handle camera capture
    const handleCameraCapture = () => {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
      setShowAttachmentMenu(false);
    };
    // Handle file selection
    const handleFileSelection = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      setShowAttachmentMenu(false);
    };
    // Handle voice recording
    const handleVoiceRecording = async () => {
      if (isRecording) {
        // Stop recording
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
      } else {
        // Start recording
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true}
          });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
          };
          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: 'audio/wav' });
            const audioFile = new File([audioBlob], 'voice-message.wav', {
              type: 'audio/wav'}
            handleFileAttachment([audioFile]);
            // Stop all tracks
            stream.getTracks().forEach((track) => track.stop());
          };
          mediaRecorder.start();
          setIsRecording(true);
        } catch (error) {
          console.error('Failed to start recording:', error);
        }
      }
    };
    // Attachment menu items
    const attachmentMenuItems = [
      {
        icon: <PhotoLibrary />,
        label: 'Photo Library',
        onClick: handleFileSelection,
      },
      {
        icon: <CameraAlt />,
        label: 'Camera',
        onClick: handleCameraCapture,
      },
      {
        icon: <Description />,
        label: 'Document',
        onClick: handleFileSelection,
      },
      {
        icon: <LocationOn />,
        label: 'Location',
        onClick: () => {
          // TODO: Implement location sharing
          setShowAttachmentMenu(false);
        },
      },
    ];
    // Common emojis for healthcare
    const commonEmojis = [
      '👍',
      '👎',
      '❤️',
      '😊',
      '😢',
      '😮',
      '🤔',
      '✅',
      '❌',
      '⚠️',
      '🚨',
      '📋',
      '💊',
      '🩺',
      '📊',
      '🏥',
    ];
    return (
      <div className="">
        {/* Reply indicator */}
        <Collapse in={!!replyToMessage}>
          {replyToMessage && (
            <div
              
              className=""
            >
              <div className="">
                <div  color="primary">
                  Replying to {replyToMessage.senderName}
                </div>
                <div  noWrap>
                  {replyToMessage.content.text}
                </div>
              </div>
              <IconButton size="small" onClick={onCancelReply}>
                <Close />
              </IconButton>
            </div>
          )}
        </Collapse>
        {/* Attachments preview */}
        <Collapse in={attachments.length > 0}>
          <div className="">
            {attachments.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => removeAttachment(index)}
                size="small"
                
                className=""
              />
            ))}
          </div>
        </Collapse>
        {/* Emoji picker */}
        <Collapse in={showEmojiPicker}>
          <div
            
            className=""
          >
            {commonEmojis.map((emoji) => (
              <Button
                key={emoji}
                size="small"
                
                className=""
              >
                {emoji}
              </Button>
            ))}
          </div>
        </Collapse>
        {/* Main input area */}
        <div
          className=""
        >
          {/* Attachment button */}
          <IconButton
            size="small"
            
            disabled={disabled}
          >
            <Add />
          </IconButton>
          {/* Text input */}
          <Input
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? 'This conversation is closed' : placeholder}
            disabled={disabled}
            
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '16px', // Prevent zoom on iOS
                lineHeight: 1.4,}
              },
            className="" />
          {/* Emoji button */}
          <IconButton
            size="small"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            color={showEmojiPicker ? 'primary' : 'default'}
          >
            <EmojiEmotions />
          </IconButton>
          {/* Voice/Send button */}
          {message.trim() || attachments.length > 0 ? (
            <IconButton
              size="small"
              onClick={handleSendMessage}
              disabled={disabled || isSending}
              color="primary"
              className="">
              {isSending ? (
                <Spinner size={20} color="inherit" />
              ) : (
                <Send />
              )}
            </IconButton>
          ) : (
            <IconButton
              size="small"
              onClick={handleVoiceRecording}
              disabled={disabled}
              color={isRecording ? 'error' : 'default'}
              className="">
              <Mic />
            </IconButton>
          )}
        </div>
        {/* Attachment menu */}
        <Menu
          anchorEl={attachmentMenuAnchor}
          open={showAttachmentMenu}
          onClose={() => setShowAttachmentMenu(false)}
          >
          {attachmentMenuItems.map((item) => (
            <MenuItem key={item.label} onClick={item.onClick}>
              {item.icon}
              <div className="">{item.label}</div>
            </MenuItem>
          ))}
        </Menu>
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFileAttachment(files);}
            }
            e.target.value = '';
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFileAttachment(files);}
            }
            e.target.value = '';
        />
      </div>
    );
  }
);
MobileMessageInput.displayName = 'MobileMessageInput';
export default MobileMessageInput;
