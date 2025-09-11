import React, { useState } from 'react';
import {
   Box,
   Card,
   CardContent,
   CardHeader,
   Chip,
   CircularProgress,
   Divider,
   Grid,
   List,
   ListItem,
   ListItemText,
   Typography,
   Alert,
   Button,
   Paper,
   TextField,
   Dialog,
   DialogTitle,
   DialogContent,
   DialogActions,
   FormControl,
   InputLabel,
   Select,
   MenuItem,
   IconButton,
} from '@mui/material';
import {
   Email as EmailIcon,
   PersonAdd as InviteIcon,
   CheckCircle as AcceptedIcon,
   HourglassEmpty as PendingIcon,
   Cancel as RejectedIcon,
   Refresh as RefreshIcon,
   Delete as DeleteIcon,
   Search as SearchIcon,
} from '@mui/icons-material';
import { useUIStore } from '../../stores';

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
      workspace: 'Main Pharmacy',
   });

   const addNotification = useUIStore((state) => state.addNotification);

   const handleSendInvitation = async () => {
      try {
         setLoading(true);

         // In a real implementation, this would call an API
         // For now, we'll simulate the process
         addNotification({
            type: 'info',
            title: 'Invitation Sent',
            message: `Invitation sent to ${newInvitation.email}`,
         });

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
            workspace: 'Main Pharmacy',
         });
      } catch (err) {
         addNotification({
            type: 'error',
            title: 'Invitation Failed',
            message: `Failed to send invitation to ${newInvitation.email}`,
         });
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
            title: 'Invitation Revoked',
            message: `Invitation revoked for ID: ${invitationId}`,
         });

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
            title: 'Revoke Failed',
            message: `Failed to revoke invitation: ${invitationId}`,
         });
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
            title: 'Invitation Resent',
            message: `Invitation resent for ID: ${invitationId}`,
         });

         // Simulate API call delay
         await new Promise((resolve) => setTimeout(resolve, 1000));

         // Update the invitation expiration date
         setInvitations(
            invitations.map((inv) =>
               inv.id === invitationId
                  ? {
                       ...inv,
                       expiresAt: new Date(
                          Date.now() + 604800000
                       ).toISOString(), // 7 days from now
                    }
                  : inv
            )
         );
      } catch (err) {
         addNotification({
            type: 'error',
            title: 'Resend Failed',
            message: `Failed to resend invitation: ${invitationId}`,
         });
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
      <Box>
         <Box
            sx={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               mb: 3,
            }}
         >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
               <InviteIcon sx={{ mr: 1, color: 'primary.main' }} />
               <Typography variant="h5" component="h1">
                  Invitation Management
               </Typography>
            </Box>
            <Box>
               <Button
                  variant="contained"
                  startIcon={<InviteIcon />}
                  onClick={() => setShowInviteDialog(true)}
                  sx={{ mr: 1 }}
               >
                  Invite User
               </Button>
               <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setLoading(true)}
               >
                  Refresh
               </Button>
            </Box>
         </Box>

         {/* Invitation Stats */}
         <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
               <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                     <Typography variant="h4" color="primary.main" gutterBottom>
                        {invitations.length}
                     </Typography>
                     <Typography variant="body2" color="textSecondary">
                        Total Invitations
                     </Typography>
                  </CardContent>
               </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
               <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                     <Typography variant="h4" color="info.main" gutterBottom>
                        {
                           invitations.filter((i) => i.status === 'pending')
                              .length
                        }
                     </Typography>
                     <Typography variant="body2" color="textSecondary">
                        Pending
                     </Typography>
                  </CardContent>
               </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
               <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                     <Typography variant="h4" color="success.main" gutterBottom>
                        {
                           invitations.filter((i) => i.status === 'accepted')
                              .length
                        }
                     </Typography>
                     <Typography variant="body2" color="textSecondary">
                        Accepted
                     </Typography>
                  </CardContent>
               </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
               <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                     <Typography variant="h4" color="warning.main" gutterBottom>
                        {
                           invitations.filter(
                              (i) =>
                                 i.status === 'expired' ||
                                 i.status === 'rejected'
                           ).length
                        }
                     </Typography>
                     <Typography variant="body2" color="textSecondary">
                        Expired/Rejected
                     </Typography>
                  </CardContent>
               </Card>
            </Grid>
         </Grid>

         {/* Search and Filter */}
         <Card sx={{ mb: 3 }}>
            <CardContent>
               <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                     <TextField
                        fullWidth
                        placeholder="Search by email or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                           startAdornment: (
                              <SearchIcon
                                 sx={{ mr: 1, color: 'text.secondary' }}
                              />
                           ),
                        }}
                     />
                  </Grid>
                  <Grid item xs={12} md={6}>
                     <FormControl fullWidth>
                        <InputLabel>Status Filter</InputLabel>
                        <Select
                           value={filterStatus}
                           label="Status Filter"
                           onChange={(e) =>
                              setFilterStatus(e.target.value as string)
                           }
                        >
                           <MenuItem value="all">All Statuses</MenuItem>
                           <MenuItem value="pending">Pending</MenuItem>
                           <MenuItem value="accepted">Accepted</MenuItem>
                           <MenuItem value="rejected">Rejected</MenuItem>
                           <MenuItem value="expired">Expired</MenuItem>
                        </Select>
                     </FormControl>
                  </Grid>
               </Grid>
            </CardContent>
         </Card>

         {/* Invitation List */}
         <Grid container spacing={3}>
            <Grid item xs={12}>
               <Card>
                  <CardHeader
                     title="Invitation List"
                     subheader="Manage all workspace invitations"
                  />
                  <Divider />
                  <CardContent>
                     {filteredInvitations.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                           <Typography variant="body1" color="textSecondary">
                              No invitations found
                           </Typography>
                        </Box>
                     ) : (
                        <List>
                           {filteredInvitations.map((invitation) => (
                              <ListItem
                                 key={invitation.id}
                                 sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    '&:last-child': { mb: 0 },
                                 }}
                              >
                                 <Box sx={{ mr: 2, mt: 0.5 }}>
                                    <EmailIcon />
                                 </Box>
                                 <ListItemText
                                    primary={
                                       <Box
                                          sx={{
                                             display: 'flex',
                                             alignItems: 'center',
                                             mb: 0.5,
                                          }}
                                       >
                                          <Typography
                                             variant="subtitle1"
                                             sx={{ mr: 1 }}
                                          >
                                             {invitation.email}
                                          </Typography>
                                          <Chip
                                             label={invitation.status}
                                             size="small"
                                             color={
                                                getStatusColor(
                                                   invitation.status
                                                ) as any
                                             }
                                          />
                                          <Chip
                                             label={invitation.role}
                                             size="small"
                                             variant="outlined"
                                             sx={{ ml: 1 }}
                                          />
                                       </Box>
                                    }
                                    secondary={
                                       <Box>
                                          <Typography
                                             variant="body2"
                                             color="textSecondary"
                                          >
                                             Invited by {invitation.invitedBy}{' '}
                                             to {invitation.workspace}
                                          </Typography>
                                          <Box
                                             sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                mt: 1,
                                             }}
                                          >
                                             <Typography
                                                variant="caption"
                                                color="textSecondary"
                                                sx={{ mr: 2 }}
                                             >
                                                Invited:{' '}
                                                {new Date(
                                                   invitation.invitedAt
                                                ).toLocaleDateString()}
                                             </Typography>
                                             <Typography
                                                variant="caption"
                                                color="textSecondary"
                                             >
                                                Expires:{' '}
                                                {new Date(
                                                   invitation.expiresAt
                                                ).toLocaleDateString()}
                                             </Typography>
                                          </Box>
                                       </Box>
                                    }
                                 />
                                 <Box>
                                    {invitation.status === 'pending' && (
                                       <>
                                          <Button
                                             variant="outlined"
                                             size="small"
                                             onClick={() =>
                                                handleResendInvitation(
                                                   invitation.id
                                                )
                                             }
                                             sx={{ mr: 1 }}
                                          >
                                             Resend
                                          </Button>
                                          <Button
                                             variant="outlined"
                                             color="error"
                                             size="small"
                                             onClick={() =>
                                                handleRevokeInvitation(
                                                   invitation.id
                                                )
                                             }
                                          >
                                             Revoke
                                          </Button>
                                       </>
                                    )}
                                    {invitation.status === 'expired' && (
                                       <Button
                                          variant="outlined"
                                          size="small"
                                          onClick={() =>
                                             handleResendInvitation(
                                                invitation.id
                                             )
                                          }
                                       >
                                          Resend
                                       </Button>
                                    )}
                                 </Box>
                              </ListItem>
                           ))}
                        </List>
                     )}
                  </CardContent>
               </Card>
            </Grid>
         </Grid>

         {/* Invite User Dialog */}
         <Dialog
            open={showInviteDialog}
            onClose={() => setShowInviteDialog(false)}
            maxWidth="sm"
            fullWidth
         >
            <DialogTitle>
               <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InviteIcon sx={{ mr: 1 }} />
                  Invite New User
               </Box>
            </DialogTitle>
            <DialogContent>
               <Box sx={{ pt: 1 }}>
                  <TextField
                     fullWidth
                     label="Email Address"
                     type="email"
                     value={newInvitation.email}
                     onChange={(e) =>
                        setNewInvitation({
                           ...newInvitation,
                           email: e.target.value,
                        })
                     }
                     margin="normal"
                     required
                  />
                  <FormControl fullWidth margin="normal">
                     <InputLabel>Role</InputLabel>
                     <Select
                        value={newInvitation.role}
                        label="Role"
                        onChange={(e) =>
                           setNewInvitation({
                              ...newInvitation,
                              role: e.target.value as string,
                           })
                        }
                     >
                        <MenuItem value="pharmacist">Pharmacist</MenuItem>
                        <MenuItem value="pharmacy_team">Pharmacy Team</MenuItem>
                        <MenuItem value="pharmacy_outlet">
                           Pharmacy Outlet
                        </MenuItem>
                        <MenuItem value="intern_pharmacist">
                           Intern Pharmacist
                        </MenuItem>
                     </Select>
                  </FormControl>
                  <FormControl fullWidth margin="normal">
                     <InputLabel>Workspace</InputLabel>
                     <Select
                        value={newInvitation.workspace}
                        label="Workspace"
                        onChange={(e) =>
                           setNewInvitation({
                              ...newInvitation,
                              workspace: e.target.value as string,
                           })
                        }
                     >
                        <MenuItem value="Main Pharmacy">Main Pharmacy</MenuItem>
                        <MenuItem value="Branch Pharmacy">
                           Branch Pharmacy
                        </MenuItem>
                        <MenuItem value="Mobile Unit">Mobile Unit</MenuItem>
                     </Select>
                  </FormControl>
               </Box>
            </DialogContent>
            <DialogActions>
               <Button onClick={() => setShowInviteDialog(false)}>
                  Cancel
               </Button>
               <Button
                  variant="contained"
                  onClick={handleSendInvitation}
                  disabled={
                     loading ||
                     !newInvitation.email ||
                     !newInvitation.email.includes('@')
                  }
                  startIcon={
                     loading ? <CircularProgress size={20} /> : <EmailIcon />
                  }
               >
                  Send Invitation
               </Button>
            </DialogActions>
         </Dialog>
      </Box>
   );
};

export default InvitationManagement;
