import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Mock hook
const useTypingIndicator = (conversationId: string) => ({
  typingUsers: ['1', '2'],
});

interface TypingIndicatorProps {
  conversationId: string;
  participants?: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }>;
  variant?: 'compact' | 'full' | 'avatars';
  maxVisible?: number;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  conversationId,
  participants = [],
  variant = 'compact',
  maxVisible = 3
}) => {
  const { typingUsers } = useTypingIndicator(conversationId);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [typingUsers]);

  if (typingUsers.length === 0) {
    return null;
  }

  const typingParticipants = typingUsers
    .map((userId) => participants.find((p) => p.userId === userId))
    .filter(Boolean)
    .slice(0, maxVisible);

  const remainingCount = Math.max(0, typingUsers.length - maxVisible);

  const getTypingText = () => {
    if (typingParticipants.length === 0) {
      return `${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`;
    }
    const names = typingParticipants.map((p) => p!.firstName);
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else {
      const displayNames = names.slice(0, 2).join(', ');
      const additionalCount = names.length - 2 + remainingCount;
      return `${displayNames} and ${additionalCount} other${additionalCount > 1 ? 's' : ''} are typing...`;
    }
  };

  if (variant === 'avatars') {
    return (
      <div key={animationKey} className="flex items-center space-x-2 p-2">
        <div className="flex -space-x-2">
          {typingParticipants.map((participant) => (
            <Avatar key={participant!.userId} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={participant!.avatar} />
              <AvatarFallback>{participant!.firstName[0]}{participant!.lastName[0]}</AvatarFallback>
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <Avatar className="h-6 w-6 border-2 border-background bg-muted text-muted-foreground">
              <AvatarFallback>+{remainingCount}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <TypingDots />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div key={animationKey} className="flex items-center space-x-2 p-2">
        <div className="flex -space-x-2">
          {typingParticipants.slice(0, 3).map((participant) => (
            <Avatar key={participant!.userId} className="h-8 w-8 border-2 border-background">
              <AvatarImage src={participant!.avatar} />
              <AvatarFallback>{participant!.firstName[0]}{participant!.lastName[0]}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{getTypingText()}</p>
        <TypingDots />
      </div>
    );
  }

  return (
    <div key={animationKey} className="flex items-center space-x-1.5 px-3 py-1.5 text-sm text-muted-foreground">
      <p>{getTypingText()}</p>
      <TypingDots size="small" />
    </div>
  );
};

const TypingDots: React.FC<{ size?: 'small' | 'medium' }> = ({ size = 'medium' }) => {
  const dotSize = size === 'small' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`${dotSize} rounded-full bg-muted-foreground animate-bounce`}
          style={{ animationDelay: `${index * 0.2}s` }}
        />
      ))}
    </div>
  );
};

export default TypingIndicator;