import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Info,
  MoreVertical,
  Bell,
  Search,
  Plus,
  Archive,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Mock data and hooks
const useCommunicationStore = () => ({
  activeConversation: { _id: '1', title: 'Conversation 1', participants: [{}, {}], status: 'active' },
  conversations: [],
  messages: { '1': [] },
  notifications: [],
  unreadCount: 2,
  setActiveConversation: (conv: any) => {},
  fetchMessages: (id: string) => {},
  sendMessage: (msg: any) => {},
  markConversationAsRead: (id: string) => {},
});
const useResponsive = () => ({ isMobile: true, isSmallMobile: false, screenHeight: 800 });
const useIsTouchDevice = () => true;
const useOrientation = () => 'portrait';
const useSafeAreaInsets = () => ({ top: 20, bottom: 20 });
const useTouchGestures = (opts: any) => ({ attachGestures: (el: any) => {} });

// Mock Components
const ConversationList: React.FC<any> = ({ onConversationSelect }) => <div onClick={() => onConversationSelect({ _id: '1' })}>Conversation List</div>;
const ParticipantList: React.FC<any> = () => <div>Participant List</div>;
const NotificationCenter: React.FC<any> = () => <div>Notification Center</div>;
const MessageThread: React.FC<any> = () => <div>Message Thread</div>;
const MobileMessageInput: React.FC<any> = () => <div>Message Input</div>;

interface Conversation {
  _id: string;
  title: string;
  participants: any[];
  status: string;
}

interface MobileChatInterfaceProps {
  conversationId?: string;
  onBack?: () => void;
  onConversationSelect?: (conversation: Conversation) => void;
}

const MobileChatInterface: React.FC<MobileChatInterfaceProps> = ({ 
  conversationId,
  onBack,
  onConversationSelect
}) => {
  const { activeConversation, setActiveConversation } = useCommunicationStore();
  const [conversationListOpen, setConversationListOpen] = useState(!conversationId);

  const handleConversationSelect = (conv: Conversation) => {
    setActiveConversation(conv);
    onConversationSelect?.(conv);
    setConversationListOpen(false);
  };

  const handleBack = () => {
    setActiveConversation(null);
    onBack?.();
    setConversationListOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-2 border-b bg-card text-card-foreground">
        {conversationId ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft />
            </Button>
            <div className="flex-grow mx-2">
              <h2 className="font-semibold truncate">{activeConversation?.title}</h2>
              <p className="text-xs text-muted-foreground">
                {activeConversation?.participants.length} participants
              </p>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Participants</SheetTitle></SheetHeader>
                <ParticipantList conversation={activeConversation} />
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-semibold text-lg">Messages</h2>
            <div className="flex-grow" />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Bell />
                  {useCommunicationStore().unreadCount > 0 && <Badge className="absolute top-1 right-1 h-4 w-4 justify-center p-0.5 text-xs">{useCommunicationStore().unreadCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader><SheetTitle>Notifications</SheetTitle></SheetHeader>
                <NotificationCenter notifications={useCommunicationStore().notifications} />
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon">
              <Search />
            </Button>
          </>
        )}
      </header>

      <main className="flex-grow overflow-y-auto">
        {conversationId ? (
          <MessageThread />
        ) : (
          <ConversationList onConversationSelect={handleConversationSelect} />
        )}
      </main>

      {conversationId && <MobileMessageInput />}

      {!conversationId && (
        <Popover>
          <PopoverTrigger asChild>
            <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg" size="icon">
              <Plus />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <Button variant="ghost" className="w-full justify-start"><Plus className="mr-2 h-4 w-4" />New Conversation</Button>
            <Button variant="ghost" className="w-full justify-start"><Search className="mr-2 h-4 w-4" />Search</Button>
            <Button variant="ghost" className="w-full justify-start"><Archive className="mr-2 h-4 w-4" />Archived</Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default MobileChatInterface;