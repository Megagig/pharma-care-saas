import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Card } from '@/components/ui/card';

import { CardContent } from '@/components/ui/card';

import { CardHeader } from '@/components/ui/card';

import { Dialog } from '@/components/ui/dialog';

import { DialogContent } from '@/components/ui/dialog';

import { DialogTitle } from '@/components/ui/dialog';

import { Select } from '@/components/ui/select';

import { Spinner } from '@/components/ui/spinner';

import { Separator } from '@/components/ui/separator';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  workspace: string;
}
const InvitationManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([
    {
      id: '1',
      email: 'newuser@example.com',
      role: 'pharmacist',
      status: 'pending',
      invitedBy: 'admin@example.com',
      invitedAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 604800000).toISOString(),
      workspace: 'Main Pharmacy',
    },
    {
      id: '2',
      email: 'teamuser@example.com',
      role: 'pharmacy_team',
      status: 'accepted',
      invitedBy: 'admin@example.com',
      invitedAt: new Date(Date.now() - 172800000).toISOString(),
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      workspace: 'Main Pharmacy',
    },
    {
      id: '3',
      email: 'expired@example.com',
      role: 'intern_pharmacist',
      status: 'expired',
      invitedBy: 'admin@example.com',
      invitedAt: new Date(Date.now() - 604800000).toISOString(),
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      workspace: 'Main Pharmacy',
    },
    {
      id: '4',
      email: 'rejected@example.com',
      role: 'pharmacy_outlet',
      status: 'rejected',
      invitedBy: 'admin@example.com',
      invitedAt: new Date(Date.now() - 259200000).toISOString(),
      expiresAt: new Date(Date.now() + 345600000).toISOString(),
      workspace: 'Branch Pharmacy',
    },
  ]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newInvitation, setNewInvitation] = useState({ 
    email: '',
    role: 'pharmacist',
    workspace: 'Main Pharmacy'}
  });
  const addNotification = useUIStore((state) => state.addNotification);
  const handleSendInvitation = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      addNotification({ 
        type: 'info',
        title: 'Invitation Sent'}
        message: `Invitation sent to ${newInvitation.email}`}
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Add the new invitation to the list
      const invitation: Invitation = {
        id: (invitations.length + 1).toString(),
        email: newInvitation.email,
        role: newInvitation.role,
        status: 'pending',
        invitedBy: 'current_user@example.com',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
        workspace: newInvitation.workspace,
      };
      setInvitations([invitation, ...invitations]);
      setShowInviteDialog(false);
      setNewInvitation({ 
        email: '',
        role: 'pharmacist',
        workspace: 'Main Pharmacy'}
      });
    } catch (err) {
      addNotification({ 
        type: 'error',
        title: 'Invitation Failed'}
        message: `Failed to send invitation to ${newInvitation.email}`}
    } finally {
      setLoading(false);
    }
  };
  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      addNotification({ 
        type: 'info',
        title: 'Invitation Revoked'}
        message: `Invitation revoked for ID: ${invitationId}`}
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Update the invitation status
      setInvitations(
        invitations.map((inv) =>
          inv.id === invitationId ? { ...inv, status: 'rejected' } : inv
        )
      );
    } catch (err) {
      addNotification({ 
        type: 'error',
        title: 'Revoke Failed'}
        message: `Failed to revoke invitation: ${invitationId}`}
    } finally {
      setLoading(false);
    }
  };
  const handleResendInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      // In a real implementation, this would call an API
      // For now, we'll simulate the process
      addNotification({ 
        type: 'info',
        title: 'Invitation Resent'}
        message: `Invitation resent for ID: ${invitationId}`}
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Update the invitation expiration date
      setInvitations(
        invitations.map((inv) =>
          inv.id === invitationId
            ? {
                ...inv,
                expiresAt: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
              }
            : inv
        )
      );
    } catch (err) {
      addNotification({ 
        type: 'error',
        title: 'Resend Failed'}
        message: `Failed to resend invitation: ${invitationId}`}
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'expired':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <AcceptedIcon />;
      case 'rejected':
        return <RejectedIcon />;
      case 'expired':
        return <RejectedIcon />;
      case 'pending':
        return <PendingIcon />;
      default:
        return <PendingIcon />;
    }
  };
  const filteredInvitations = invitations.filter((invitation) => {
    const matchesSearch =
      invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitation.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || invitation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });
  return (
    <div>
      <div
        className=""
      >
        <div className="">
          <InviteIcon className="" />
          <div  component="h1">
            Invitation Management
          </div>
        </div>
        <div>
          <Button
            
            startIcon={<InviteIcon />}
            onClick={() => setShowInviteDialog(true)}
            className=""
          >
            Invite User
          </Button>
          <Button
            
            startIcon={<RefreshIcon />}
            onClick={() => setLoading(true)}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Invitation Stats */}
      <div container spacing={3} className="">
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="primary.main" gutterBottom>
                {invitations.length}
              </div>
              <div  color="textSecondary">
                Total Invitations
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="info.main" gutterBottom>
                {invitations.filter((i) => i.status === 'pending').length}
              </div>
              <div  color="textSecondary">
                Pending
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="success.main" gutterBottom>
                {invitations.filter((i) => i.status === 'accepted').length}
              </div>
              <div  color="textSecondary">
                Accepted
              </div>
            </CardContent>
          </Card>
        </div>
        <div item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="">
              <div  color="warning.main" gutterBottom>
                {
                  invitations.filter(
                    (i) => i.status === 'expired' || i.status === 'rejected'
                  ).length
                }
              </div>
              <div  color="textSecondary">
                Expired/Rejected
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Search and Filter */}
      <Card className="">
        <CardContent>
          <div container spacing={2}>
            <div item xs={12} md={6}>
              <Input
                fullWidth
                placeholder="Search by email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                
              />
            </div>
            <div item xs={12} md={6}>
              <div fullWidth>
                <Label>Status Filter</Label>
                <Select
                  value={filterStatus}
                  label="Status Filter"
                  onChange={(e) => setFilterStatus(e.target.value as string)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Invitation List */}
      <div container spacing={3}>
        <div item xs={12}>
          <Card>
            <CardHeader
              title="Invitation List"
              subheader="Manage all workspace invitations"
            />
            <Separator />
            <CardContent>
              {filteredInvitations.length === 0 ? (
                <div className="">
                  <div  color="textSecondary">
                    No invitations found
                  </div>
                </div>
              ) : (
                <List>
                  {filteredInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className=""
                    >
                      <div className="">
                        <EmailIcon />
                      </div>
                      <div
                        primary={
                          <div
                            className=""
                          >
                            <div  className="">}
                              {invitation.email}
                            </div>
                            <Chip
                              label={invitation.status}
                              size="small"
                              color={getStatusColor(invitation.status) as any}
                            />
                            <Chip
                              label={invitation.role}
                              size="small"
                              
                              className=""
                            />
                          </div>
                        }
                        secondary={
                          <div>
                            <div  color="textSecondary">}
                              Invited by {invitation.invitedBy} to{' '}
                              {invitation.workspace}
                            </div>
                            <div
                              className=""
                            >
                              <div
                                
                                color="textSecondary"
                                className=""
                              >
                                Invited:{' '}
                                {new Date(
                                  invitation.invitedAt
                                ).toLocaleDateString()}
                              </div>
                              <div
                                
                                color="textSecondary"
                              >
                                Expires:{' '}
                                {new Date(
                                  invitation.expiresAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        }
                      />
                      <div>
                        {invitation.status === 'pending' && (
                          <>
                            <Button
                              
                              size="small"
                              onClick={() =>
                                handleResendInvitation(invitation.id)}
                              }
                              className=""
                            >
                              Resend
                            </Button>
                            <Button
                              
                              color="error"
                              size="small"
                              onClick={() =>
                                handleRevokeInvitation(invitation.id)}
                              }
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                        {invitation.status === 'expired' && (
                          <Button
                            
                            size="small"
                            onClick={() =>
                              handleResendInvitation(invitation.id)}
                            }
                          >
                            Resend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Invite User Dialog */}
      <Dialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div className="">
            <InviteIcon className="" />
            Invite New User
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="">
            <Input
              fullWidth
              label="Email Address"
              type="email"
              value={newInvitation.email}
              onChange={(e) =>}
                setNewInvitation({ ...newInvitation, email: e.target.value })
              }
              margin="normal"
              required
            />
            <div fullWidth margin="normal">
              <Label>Role</Label>
              <Select
                value={newInvitation.role}
                label="Role"
                onChange={(e) =>
                  setNewInvitation({ 
                    ...newInvitation}
                    role: e.target.value as string,}
                  })
                }
              >
                <MenuItem value="pharmacist">Pharmacist</MenuItem>
                <MenuItem value="pharmacy_team">Pharmacy Team</MenuItem>
                <MenuItem value="pharmacy_outlet">Pharmacy Outlet</MenuItem>
                <MenuItem value="intern_pharmacist">Intern Pharmacist</MenuItem>
              </Select>
            </div>
            <div fullWidth margin="normal">
              <Label>Workspace</Label>
              <Select
                value={newInvitation.workspace}
                label="Workspace"
                onChange={(e) =>
                  setNewInvitation({ 
                    ...newInvitation}
                    workspace: e.target.value as string,}
                  })
                }
              >
                <MenuItem value="Main Pharmacy">Main Pharmacy</MenuItem>
                <MenuItem value="Branch Pharmacy">Branch Pharmacy</MenuItem>
                <MenuItem value="Mobile Unit">Mobile Unit</MenuItem>
              </Select>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInviteDialog(false)}>Cancel</Button>
          <Button
            
            onClick={handleSendInvitation}
            disabled={
              loading ||
              !newInvitation.email ||
              !newInvitation.email.includes('@')}
            }
            startIcon={loading ? <Spinner size={20} /> : <EmailIcon />}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
export default InvitationManagement;
