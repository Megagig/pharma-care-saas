import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserPlus,
  MoreVertical,
  Pill,
  HeartPulse,
  User as UserIcon,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

// Mock data and types
interface Conversation { participants: any[]; type: string; priority: string; }
interface ParticipantListProps {
  conversation: Conversation;
  onAddParticipant?: (userId: string, role: string) => void;
  onRemoveParticipant?: (userId: string) => void;
  onChangeRole?: (userId: string, newRole: string) => void;
  canManageParticipants?: boolean;
}
interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ 
  conversation,
  onAddParticipant,
  onRemoveParticipant,
  onChangeRole,
  canManageParticipants = true
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('pharmacist');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'pharmacist': return <Pill className="h-4 w-4" />;
      case 'doctor': return <HeartPulse className="h-4 w-4" />;
      case 'patient': return <UserIcon className="h-4 w-4" />;
      case 'admin': return <ShieldCheck className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({conversation.participants.length})
        </h3>
        {canManageParticipants && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><UserPlus className="h-4 w-4 mr-2" />Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Participant</DialogTitle></DialogHeader>
              {/* Add participant form here */}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {conversation.participants.map((participant: any) => (
          <div key={participant.userId} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">User Name</p>
                <p className="text-sm text-muted-foreground">user@example.com</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getRoleIcon(participant.role)}
                {participant.role}
              </Badge>
              {canManageParticipants && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onChangeRole?.(participant.userId, 'pharmacist')}>Make Pharmacist</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onChangeRole?.(participant.userId, 'doctor')}>Make Doctor</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => onRemoveParticipant?.(participant.userId)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantList;