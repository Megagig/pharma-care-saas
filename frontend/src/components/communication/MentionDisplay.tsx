
import { Tooltip } from '@/components/ui/button';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: 'pharmacist' | 'doctor' | 'patient';
  email?: string;
  avatar?: string;
}
interface MentionDisplayProps {
  text: string;
  mentions?: string[];
  users?: User[];
  onMentionClick?: (userId: string) => void;
  variant?: 'body1' | 'body2' | 'caption';
  color?: string;
  sx?: any;
}
const MentionDisplay: React.FC<MentionDisplayProps> = ({ 
  text,
  mentions = [],
  users = [],
  onMentionClick,
  variant = 'body2',
  color,
  sx
}) => {
  // Create a map of user IDs to user data for quick lookup
  const userMap = users.reduce((acc, user) => {
    acc[user._id] = user;
    return acc;
  }, {} as Record<string, User>);
  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'primary.main';
      case 'pharmacist':
        return 'secondary.main';
      case 'patient':
        return 'info.main';
      default:
        return 'text.primary';
    }
  };
  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return <MedicalServices className="" />;
      case 'pharmacist':
        return <LocalPharmacy className="" />;
      case 'patient':
        return <Person className="" />;
      default:
        return <Person className="" />;
    }
  };
  // Parse text and render with mentions highlighted
  const renderTextWithMentions = () => {
    if (!text) return null;
    // Regex to match mention format: @[Display Name](userId)
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const [fullMatch, displayName, userId] = match;
      const user = userMap[userId];
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      // Add mention component
      if (user) {
        parts.push(
          <Tooltip
            key={`mention-${match.index}`}
            title={
              <div>
                <div  fontWeight="bold">}
                  {user.firstName} {user.lastName}
                </div>
                <br />
                <div >
                  {user.role} • {user.email}
                </div>
              </div>
            }
            arrow
          >
            <Chip
              label={displayName}
              size="small"
              icon={getRoleIcon(user.role)}
              onClick={
                onMentionClick ? () => onMentionClick(userId) : undefined}
              }
              className=""
                '&:hover': onMentionClick
                  ? {
                      opacity: 0.8,
                    }
                  : {},
            />
          </Tooltip>
        );
      } else {
        // Fallback for unknown users
        parts.push(
          <Chip
            key={`mention-unknown-${match.index}`}
            label={displayName}
            size="small"
            
            className=""
          />
        );
      }
      lastIndex = match.index + fullMatch.length;
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
      );
    }
    return parts.length > 0 ? parts : text;
  };
  // Handle URL links in text (basic implementation)
  const renderWithLinks = (content: any) => {
    if (typeof content === 'string') {
      // Simple URL regex
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = content.split(urlRegex);
      return parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <Link
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className=""
            >
              {part}
            </Link>
          );
        }
        return part;
      });
    }
    return content;
  };
  const content = renderTextWithMentions();
  const finalContent = Array.isArray(content)
    ? content.map((part, index) => (
        <span key={index}>{renderWithLinks(part)}</span>
      ))
    : renderWithLinks(content);
  return (
    <div
      variant={variant}
      color={color}
      className=""
    >
      {finalContent}
    </div>
  );
};
export default MentionDisplay;
