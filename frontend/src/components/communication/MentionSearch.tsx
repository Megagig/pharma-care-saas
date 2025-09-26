import MentionDisplay from './MentionDisplay';

import { Input, Label, Select, Tooltip, Spinner, Alert, Avatar, Separator } from '@/components/ui/button';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: 'pharmacist' | 'doctor' | 'patient';
  email?: string;
  avatar?: string;
}
interface MentionSearchResult {
  _id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: {
    text: string;
    type: string;
  };
  mentions: string[];
  mentionedUsers: User[];
  createdAt: string;
  priority: 'normal' | 'urgent';
}
interface MentionSearchProps {
  conversationId?: string;
  onMessageClick?: (messageId: string, conversationId: string) => void;
  onUserClick?: (userId: string) => void;
  maxHeight?: string | number;
}
const MentionSearch: React.FC<MentionSearchProps> = ({ 
  conversationId,
  onMessageClick,
  onUserClick,
  maxHeight = '400px'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [results, setResults] = useState<MentionSearchResult[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalMentions: number;
    mentionsByUser: Record<string, number>;
  } | null>(null);
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, userId: string) => {
      if (!conversationId) return;
      setLoading(true);
      setError(null);
      try {
        const searchResults =
          await mentionNotificationService.searchMessagesByMentions(
            conversationId,
            userId === 'all' ? undefined : userId,
            50
          );
        // Filter by search query if provided
        const filteredResults = query
          ? searchResults.filter(
              (result) =>
                result.content.text
                  .toLowerCase()
                  .includes(query.toLowerCase()) ||
                result.mentionedUsers.some((user) =>
                  `${user.firstName} ${user.lastName}`
                    .toLowerCase()
                    .includes(query.toLowerCase())
                )
            )
          : searchResults;
        setResults(filteredResults);
      } catch (error) {
        console.error('Error searching mentions:', error);
        setError('Failed to search mentions. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300),
    [conversationId]
  );
  // Load mentioned users and stats
  useEffect(() => {
    if (!conversationId) return;
    const loadData = async () => {
      try {
        const [mentionedUsers, mentionStats] = await Promise.all([
          mentionNotificationService.getMentionedUsers(conversationId),
          mentionNotificationService.getMentionStats(conversationId),
        ]);
        setUsers(mentionedUsers);
        setStats(mentionStats);
      } catch (error) {
        console.error('Error loading mention data:', error);
      }
    };
    loadData();
  }, [conversationId]);
  // Trigger search when query or user filter changes
  useEffect(() => {
    debouncedSearch(searchQuery, selectedUser);
  }, [searchQuery, selectedUser, debouncedSearch]);
  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  // Handle user filter change
  const handleUserFilterChange = (event: any) => {
    setSelectedUser(event.target.value);
  };
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedUser('all');
  };
  // Export search results
  const handleExport = () => {
    const data = results.map((result) => ({ 
      messageId: result._id}
      sender: `${result.sender.firstName} ${result.sender.lastName}`,
      content: result.content.text,
      mentions: result.mentionedUsers.map(
        (u) => `${u.firstName} ${u.lastName}`
      ),
      timestamp: result.createdAt}
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'}
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentions-${conversationId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return <MedicalServices />;
      case 'pharmacist':
        return <LocalPharmacy />;
      case 'patient':
        return <Person />;
      default:
        return <Person />;
    }
  };
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
        return 'grey.500';
    }
  };
  if (!conversationId) {
    return (
      <div className="">
        <div  color="text.secondary">
          Select a conversation to search mentions
        </div>
      </div>
    );
  }
  return (
    <div className="">
      {/* Header */}
      <div className="">
        <div
          className=""
        >
          <div >Mention Search</div>
          <div className="">
            <Tooltip title="Export results">
              <IconButton size="small" onClick={handleExport}>
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear search">
              <IconButton size="small" onClick={handleClearSearch}>
                <Clear />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        {/* Stats */}
        {stats && (
          <div className="">
            <div  color="text.secondary">
              Total mentions: {stats.totalMentions}
            </div>
          </div>
        )}
        {/* Search Controls */}
        <div className="">
          <Input
            fullWidth
            size="small"
            placeholder="Search mentions..."
            value={searchQuery}
            onChange={handleSearchChange}
            
          />
          <div size="small" className="">
            <Label>User</Label>
            <Select
              value={selectedUser}
              label="User"
              onChange={handleUserFilterChange}
            >
              <MenuItem value="all">All Users</MenuItem>
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}
                </MenuItem>
              ))}
            </Select>
          </div>
        </div>
      </div>
      {/* Results */}
      <div className="">
        {loading ? (
          <div
            className=""
          >
            <Spinner />
          </div>
        ) : error ? (
          <Alert severity="error" className="">
            {error}
          </Alert>
        ) : results.length === 0 ? (
          <div
            className=""
          >
            <Search className="" />
            <div  color="text.secondary" gutterBottom>
              No mentions found
            </div>
            <div  color="text.secondary">
              {searchQuery || selectedUser !== 'all'
                ? 'Try adjusting your search criteria'
                : 'No mentions in this conversation yet'}
            </div>
          </div>
        ) : (
          <List>
            {results.map((result, index) => (
              <React.Fragment key={result._id}>
                <div
                  button
                  onClick={() =>
                    onMessageClick?.(result._id, result.conversationId)}
                  }
                  className=""
                >
                  <divAvatar>
                    <Avatar
                      className=""
                    >
                      {result.sender.avatar ? (
                        <img
                          src={result.sender.avatar}
                          alt={`${result.sender.firstName} ${result.sender.lastName}`}
                          
                        />
                      ) : (
                        getRoleIcon(result.sender.role)
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <div
                    primary={
                      <div
                        className=""
                      >
                        <div  fontWeight="bold">}
                          {result.sender.firstName} {result.sender.lastName}
                        </div>
                        <div  color="text.secondary">
                          {formatDistanceToNow(new Date(result.createdAt), {
                            addSuffix: true, }}
                        </div>
                        {result.priority === 'urgent' && (
                          <Chip
                            label="Urgent"
                            size="small"
                            color="error"
                            
                            className=""
                          />
                        )}
                      </div>
                    }
                    secondary={
                      <div>
                        <MentionDisplay}
                          text={result.content.text}
                          mentions={result.mentions}
                          users={result.mentionedUsers}
                          
                          onMentionClick={onUserClick}
                          className=""
                        />
                        <div
                          className=""
                        >
                          {result.mentionedUsers.map((user) => (
                            <Chip
                              key={user._id}
                              label={`@${user.firstName} ${user.lastName}`}
                              size="small"
                              
                              className=""
                              
                            />
                          ))}
                        </div>
                      </div>
                    }
                  />
                </div>
                {index < results.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </List>
        )}
      </div>
    </div>
  );
};
export default MentionSearch;
