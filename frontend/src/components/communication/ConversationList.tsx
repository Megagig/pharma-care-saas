import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, ArrowUpDown, Filter, X } from 'lucide-react';
import ConversationItem from './ConversationItem';
import NewConversationModal from './NewConversationModal';

// Mock data and hooks
const useCommunicationStore = () => ({
  conversations: [],
  conversationFilters: { search: '', type: '', status: '', priority: '' },
  conversationPagination: { total: 0 },
  loading: { fetchConversations: false },
  errors: { fetchConversations: null },
  fetchConversations: () => {},
  setConversationFilters: (filters: any) => {},
  clearConversationFilters: () => {},
  archiveConversation: (id: string) => {},
  resolveConversation: (id: string) => {},
  deleteConversation: (id: string) => {},
});
const useDebounce = (value: any, delay: number) => value;

interface Conversation {}

interface ConversationListProps {
  onConversationSelect?: (conversation: Conversation) => void;
  selectedConversationId?: string;
  height?: string | number;
  showNewButton?: boolean;
  patientId?: string;
  compact?: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
  onConversationSelect,
  selectedConversationId,
  height = '100%',
  showNewButton = true,
  patientId,
  compact = false
}) => {
  const { conversations, conversationFilters, conversationPagination, loading, errors, fetchConversations, setConversationFilters, clearConversationFilters } = useCommunicationStore();
  const [searchTerm, setSearchTerm] = useState(conversationFilters.search || '');
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setConversationFilters({ search: debouncedSearchTerm, page: 1 });
  }, [debouncedSearchTerm, setConversationFilters]);

  const handleFilterChange = (filterKey: string, value: any) => {
    const newFilters = { ...selectedFilters, [filterKey]: value };
    setSelectedFilters(newFilters);
    setConversationFilters({ ...newFilters, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedFilters({});
    clearConversationFilters();
  };

  const renderSkeleton = () => (
    <div className="space-y-2 p-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {!compact && (
        <div className="p-2 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Conversations</h3>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={fetchConversations}><RefreshCw className="h-4 w-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Refresh</p></TooltipContent>
                </Tooltip>
                {/* Sort and Filter Dropdowns */}
              </TooltipProvider>
            </div>
          </div>
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {errors.fetchConversations && (
        <Alert variant="destructive" className="m-2">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errors.fetchConversations}</AlertDescription>
        </Alert>
      )}

      <div className="flex-grow overflow-y-auto">
        {loading.fetchConversations ? (
          renderSkeleton()
        ) : conversations.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="space-y-1 p-1">
            {conversations.map((conversation: any) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                onClick={() => onConversationSelect?.(conversation)}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {showNewButton && (
        <Button className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg" size="icon" onClick={() => setNewConversationOpen(true)}>
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <NewConversationModal
        open={newConversationOpen}
        onClose={() => setNewConversationOpen(false)}
        patientId={patientId}
      />
    </div>
  );
};

export default ConversationList;