import { useState } from "react";
import { ChevronDown, ChevronUp, Users, UserPlus, Mail, Shield, Crown, Eye, Trash2, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CollapsibleTeamCollaboration() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/team/members"],
  });

  const { data: teamInvitations = [] } = useQuery<any[]>({
    queryKey: ["/api/team/invitations"],
  });

  const inviteMutation = useMutation({
    mutationFn: async (inviteData: { email: string; role: string; inviterName: string }) => {
      return await apiRequest("/api/team/invite", {
        method: "POST",
        body: JSON.stringify(inviteData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
      setIsInviteDialogOpen(false);
      toast({
        title: "Invitation Sent",
        description: "Team invitation has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleInvite = (formData: FormData) => {
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const inviterName = formData.get('inviterName') as string || "Team Member";

    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    inviteMutation.mutate({ email, role, inviterName });
  };

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: number; newRole: string }) => {
      return await apiRequest(`/api/team/members/${memberId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      toast({
        title: "Role Updated",
        description: "Team member role has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      return await apiRequest(`/api/team/invitations/${invitationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
      toast({
        title: "Invitation Deleted",
        description: "Team invitation has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invitation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown size={14} className="text-yellow-500" />;
      case 'admin': return <Shield size={14} className="text-blue-500" />;
      case 'member': return <Users size={14} className="text-green-500" />;
      case 'viewer': return <Eye size={14} className="text-gray-500" />;
      default: return <Users size={14} className="text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 'admin': return "bg-blue-100 text-blue-800 border-blue-300";
      case 'member': return "bg-green-100 text-green-800 border-green-300";
      case 'viewer': return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Users size={20} className="mr-2 text-primary" />
            Team Collaboration
            <Badge variant="secondary" className="ml-2 text-xs">
              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Team Members */}
            {teamMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Users size={14} className="mr-2" />
                  Team Members
                </h4>
                <div className="space-y-2">
                  {teamMembers.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {member.name || 'Team Member'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Invitations */}
            {teamInvitations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Clock size={14} className="mr-2" />
                  Pending Invitations ({teamInvitations.length})
                </h4>
                <div className="space-y-2">
                  {teamInvitations.map((invitation: any) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                          <Mail size={14} className="text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {invitation.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Invited as {invitation.role} • {new Date(invitation.sentAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                          Pending
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteInvitationMutation.mutate(invitation.id)}
                          disabled={deleteInvitationMutation.isPending}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-invitation-${invitation.id}`}
                          title="Delete invitation"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {teamMembers.length === 0 && teamInvitations.length === 0 && (
              <div className="text-center py-8">
                <Users size={32} className="mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  No team members yet
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Invite team members to collaborate on productivity goals
                </p>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs" data-testid="button-invite-empty">
                      <UserPlus size={14} className="mr-2" />
                      Invite Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Mail size={20} />
                        <span>Invite Team Member</span>
                      </DialogTitle>
                      <DialogDescription>
                        Send an email invitation to add a new team member.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleInvite(formData);
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="inviterName">Your Name</Label>
                        <Input
                          id="inviterName"
                          name="inviterName"
                          placeholder="Enter your full name"
                          defaultValue="Team Leader"
                          required
                          data-testid="input-inviter-name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="colleague@company.com"
                          required
                          data-testid="input-email"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select name="role" defaultValue="member">
                          <SelectTrigger data-testid="select-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer - Can view tasks and data</SelectItem>
                            <SelectItem value="member">Member - Can create and edit tasks</SelectItem>
                            <SelectItem value="admin">Admin - Full management access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={inviteMutation.isPending} className="flex-1" data-testid="button-send-invitation">
                          {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
              <div className="flex space-x-2">
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1 text-xs" data-testid="button-invite-member">
                      <UserPlus size={14} className="mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Mail size={20} />
                        <span>Invite Team Member</span>
                      </DialogTitle>
                      <DialogDescription>
                        Send an email invitation to add a new team member.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleInvite(formData);
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="inviterName2">Your Name</Label>
                        <Input
                          id="inviterName2"
                          name="inviterName"
                          placeholder="Enter your full name"
                          defaultValue="Team Leader"
                          required
                          data-testid="input-inviter-name-main"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email2">Email Address</Label>
                        <Input
                          id="email2"
                          name="email"
                          type="email"
                          placeholder="colleague@company.com"
                          required
                          data-testid="input-email-main"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role2">Role</Label>
                        <Select name="role" defaultValue="member">
                          <SelectTrigger data-testid="select-role-main">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer - Can view tasks and data</SelectItem>
                            <SelectItem value="member">Member - Can create and edit tasks</SelectItem>
                            <SelectItem value="admin">Admin - Full management access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={inviteMutation.isPending} className="flex-1" data-testid="button-send-invitation-main">
                          {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={isManageRolesOpen} onOpenChange={setIsManageRolesOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1 text-xs" data-testid="button-manage-roles">
                      <Shield size={14} className="mr-2" />
                      Manage Roles
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Shield size={20} />
                        <span>Manage Team Roles</span>
                      </DialogTitle>
                      <DialogDescription>
                        Update team member roles and permissions.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {teamMembers.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {member.name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white">
                                {member.name || 'Team Member'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {member.email}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(member.role)}
                              <span className="text-sm font-medium">
                                {member.role}
                              </span>
                            </div>
                            
                            {member.role !== 'owner' && (
                              <Select
                                value={member.role}
                                onValueChange={(newRole) => updateRoleMutation.mutate({ memberId: member.id, newRole })}
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="w-32" data-testid={`select-role-${member.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            {member.role === 'owner' && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                Owner
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {teamMembers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No team members to manage
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => setIsManageRolesOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}