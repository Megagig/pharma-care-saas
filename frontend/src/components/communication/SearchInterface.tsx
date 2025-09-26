import MessageSearch from './MessageSearch';

import ConversationSearch from './ConversationSearch';

import { Tabs } from '@/components/ui/button';

interface SearchInterfaceProps {
  height?: string;
  defaultTab?: 'messages' | 'conversations';
  onMessageSelect?: (result: any) => void;
  onConversationSelect?: (conversation: any) => void;
  showSavedSearches?: boolean;
  showSuggestions?: boolean;
}
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const TabPanel: React.FC<TabPanelProps> = ({ 
  children,
  value,
  index,
  ...other })
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
      >
      {value === index && <div className="">{children}</div>}
    </div>
  );
};
const SearchInterface: React.FC<SearchInterfaceProps> = ({ 
  height = '600px',
  defaultTab = 'messages',
  onMessageSelect,
  onConversationSelect,
  showSavedSearches = true,
  showSuggestions = true
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(defaultTab === 'messages' ? 0 : 1);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  const handleMessageResultSelect = (result: any) => {
    onMessageSelect?.(result);
    // Also navigate to the conversation if callback is provided
    if (onConversationSelect) {
      onConversationSelect(result.conversation._id);
    }
  };
  return (
    <div
      className=""
    >
      {/* Header with Tabs */}
      <div className="">
        <div className="">
          <div
            
            className=""
          >
            <SearchIcon />
            Communication Search
          </div>
        </div>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="search tabs"
          className=""
        >
          <Tab
            icon={<MessageIcon />}
            label="Messages"
            id="search-tab-0"
            aria-controls="search-tabpanel-0"
            className=""
          />
          <Tab
            icon={<ChatIcon />}
            label="Conversations"
            id="search-tab-1"
            aria-controls="search-tabpanel-1"
            className=""
          />
        </Tabs>
      </div>
      {/* Tab Content */}
      <div className="">
        <TabPanel value={activeTab} index={0}>
          <MessageSearch
            height="100%"
            onResultSelect={handleMessageResultSelect}
            onConversationSelect={onConversationSelect}
            showSavedSearches={showSavedSearches}
            showSuggestions={showSuggestions}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <ConversationSearch
            height="100%"
            onConversationSelect={onConversationSelect}
            showSavedSearches={showSavedSearches}
          />
        </TabPanel>
      </div>
    </div>
  );
};
export default SearchInterface;
