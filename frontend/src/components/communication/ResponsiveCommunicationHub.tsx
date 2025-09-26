import ChatInterface from './ChatInterface';

import MobileChatInterface from './MobileChatInterface';

import ConversationList from './ConversationList';

interface ResponsiveCommunicationHubProps {
  initialConversationId?: string;
  patientId?: string;
  height?: string | number;
  onConversationChange?: (conversationId: string | null) => void;
}
const ResponsiveCommunicationHub: React.FC<ResponsiveCommunicationHubProps> = ({ 
  initialConversationId,
  patientId,
  height = '100vh',
  onConversationChange
}) => {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop, screenWidth } = useResponsive();
  const isTouchDevice = useIsTouchDevice();
  const { activeConversation, setActiveConversation, fetchConversations } =
    useCommunicationStore();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(initialConversationId);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  // Update conversation selection when prop changes
  useEffect(() => {
    if (initialConversationId !== selectedConversationId) {
      setSelectedConversationId(initialConversationId);
    }
  }, [initialConversationId, selectedConversationId]);
  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);
  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversationId(conversation._id);
    setActiveConversation(conversation);
    onConversationChange?.(conversation._id);
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  // Handle back navigation (mobile)
  const handleBack = () => {
    setSelectedConversationId(undefined);
    setActiveConversation(null);
    onConversationChange?.(null);
    setSidebarOpen(true);
  };
  // Mobile layout
  if (isMobile) {
    return (
      <div className="">
        <MobileChatInterface
          conversationId={selectedConversationId}
          onBack={handleBack}
          onConversationSelect={handleConversationSelect}
        />
      </div>
    );
  }
  // Tablet layout - side-by-side with collapsible sidebar
  if (isTablet) {
    return (
      <div
        className=""
      >
        {/* Conversation List Sidebar */}
        <div
          className="">
          {sidebarOpen && (
            <ConversationList
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversationId}
              height="100%"
              patientId={patientId}
              compact={true}
            />
          )}
        </div>
        {/* Main Chat Area */}
        <div className="">
          {selectedConversationId ? (
            <ChatInterface
              conversationId={selectedConversationId}
              patientId={patientId}
              height="100%"
              showParticipants={true}
              showHeader={true}
              
            />
          ) : (
            <div
              className=""
            >
              <div
                className=""
              >
                💬
              </div>
              <div>
                <div className="">
                  Select a conversation
                </div>
                <div className="">
                  Choose a conversation from the sidebar to start messaging
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Sidebar toggle button for tablet */}
        <div
          className="">
          <div
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="">
            {sidebarOpen ? '‹' : '›'}
          </div>
        </div>
      </div>
    );
  }
  // Desktop layout - full side-by-side
  return (
    <div
      className=""
    >
      {/* Conversation List Sidebar */}
      <div
        className=""
      >
        <ConversationList
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversationId}
          height="100%"
          patientId={patientId}
          compact={false}
        />
      </div>
      {/* Main Chat Area */}
      <div className="">
        {selectedConversationId ? (
          <ChatInterface
            conversationId={selectedConversationId}
            patientId={patientId}
            height="100%"
            showParticipants={true}
            showHeader={true}
            
          />
        ) : (
          <div
            className=""
          >
            <div
              className=""
            >
              💬
            </div>
            <div>
              <div className="">
                Welcome to Communication Hub
              </div>
              <div className="">
                Select a conversation from the sidebar to start messaging, or
                create a new conversation to begin collaborating with your
                healthcare team.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ResponsiveCommunicationHub;
