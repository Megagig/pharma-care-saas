import ConversationItem from './ConversationItem';

import { Spinner } from '@/components/ui/button';

interface VirtualizedConversationListProps {
  conversations: Conversation[];
  height: number;
  onSelectConversation?: (conversation: Conversation) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  selectedConversationId?: string;
  itemSize?: number;
  overscan?: number;
}
interface ConversationItemData {
  conversations: Conversation[];
  onSelectConversation?: (conversation: Conversation) => void;
  selectedConversationId?: string;
  isMobile: boolean;
}
// Memoized conversation item component for virtualization
const VirtualizedConversationItem = React.memo<
>(({ index, style, data }) => {
  const conversation = data.conversations[index];
  const isSelected = conversation._id === data.selectedConversationId;
  return (
    <div style={style}>
      <ConversationItem
        conversation={conversation}
        
        onClick={() => data.onSelectConversation?.(conversation)}
        compact={data.isMobile}
      />
    </div>
  );
});
VirtualizedConversationItem.displayName = 'VirtualizedConversationItem';
const VirtualizedConversationList: React.FC = ({ 
  conversations,
  height,
  onSelectConversation,
  onLoadMore,
  hasMore = false,
  loading = false,
  selectedConversationId,
  itemSize = 80,
  overscan = 5
}) => {
  const { isMobile } = useResponsive();
  const listRef = useRef<List>(null);
  const loadingRef = useRef(false);
  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo<ConversationItemData>(
    () => ({ 
      conversations,
      onSelectConversation,
      selectedConversationId,
      isMobile}
    }),
    [conversations, onSelectConversation, selectedConversationId, isMobile]
  );
  // Handle scroll to load more conversations
  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested, scrollDirection }: unknown) => {
      if (
        scrollUpdateWasRequested ||
        loadingRef.current ||
        !hasMore ||
        !onLoadMore
      ) {
        return;
      }
      const listHeight = height;
      const totalHeight = conversations.length * itemSize;
      const scrollBottom = scrollOffset + listHeight;
      // Load more when scrolled near bottom
      if (scrollDirection === 'forward' && scrollBottom >= totalHeight - 200) {
        loadingRef.current = true;
        onLoadMore();
        // Reset loading flag after a delay
        setTimeout(() => {
          loadingRef.current = false;
        }, 1000);
      }
    },
    [hasMore, onLoadMore, height, conversations.length, itemSize]
  );
  // Dynamic item size calculation based on conversation content
  const getItemSize = useCallback(
    (index: number) => {
      const conversation = conversations[index];
      if (!conversation) return itemSize;
      let estimatedHeight = itemSize;
      // Increase height for mobile
      if (isMobile) {
        estimatedHeight = Math.max(estimatedHeight, 72); // Minimum touch target
      }
      // Add height for priority indicators
      if (
        conversation.priority === 'urgent' ||
        conversation.priority === 'high'
      ) {
        estimatedHeight += 8;
      }
      // Add height for unread count
      if (conversation.unreadCount && conversation.unreadCount > 0) {
        estimatedHeight += 4;
      }
      return estimatedHeight;
    },
    [conversations, itemSize, isMobile]
  );
  if (conversations.length === 0 && !loading) {
    return (
      <div
        className=""
      >
        <div >No conversations found</div>
      </div>
    );
  }
  return (
    <div className="">
      {/* Virtualized list */}
      <List
        ref={listRef}
        height={height}
        itemCount={conversations.length}
        itemSize={itemSize}
        itemData={itemData}
        overscanCount={overscan}
        onScroll={handleScroll}
      >
        {VirtualizedConversationItem}
      </List>
      {/* Loading indicator at bottom */}
      {loading && (
        <div
          className=""
        >
          <Spinner size={16} />
          <div  className="">
            Loading conversations...
          </div>
        </div>
      )}
    </div>
  );
};
export default VirtualizedConversationList;
