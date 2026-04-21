import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Mail, Shield, Crown, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  avatar?: string;
  joinedAt: string;
  lastActive: string;
}

interface TeamInvitation {
  id: number;
  email: string;
  role: string;
  invitedBy: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function TeamCollaboration() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: members = [] } = useQuery<TeamMember[]>({ queryKey: ["/api/team/members"] });
  const { data: invitations = [] } = useQuery<TeamInvitation[]>({ queryKey: ["/api/team/invitations"] });

  const inviteMutation = useMutation({
    mutationFn: async (inviteData: { email: string; role: string; inviterName: string }) => {
      // Send email invitation
      const response = await apiRequest("/api/team/invite", {
        method: "POST",
        body: JSON.stringify(inviteData),
      });

      // Send email using a mock email service (would use SendGrid in production)
      const emailContent = generateInvitationEmail(inviteData);
      
      // In production, this would actually send an email
      console.log("Email invitation sent:", emailContent);
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/invitations"] });
      setIsInviteDialogOpen(false);
      toast({
        title: "Invitation Sent",
        description: "Team invitation email has been sent successfully.",
      });
    },
  });

  const generateInvitationEmail = (inviteData: { email: string; role: string; inviterName: string }) => {
    const emailTemplate = `
Subject: You've been invited to join our Productivity Hub team!

Dear ${inviteData.email},

${inviteData.inviterName} has invited you to join their team on Productivity Hub as a ${inviteData.role}.

Productivity Hub is a comprehensive productivity platform that combines:
- Task management with Kanban-style boards
- Daily habit tracking with streak rewards
- Pomodoro timer for focused work sessions
- Team collaboration and shared workspaces
- Analytics and AI-powered insights

Your Role: ${inviteData.role.charAt(0).toUpperCase() + inviteData.role.slice(1)}

To accept this invitation and start collaborating:
1. Click the link below to create your account
2. Set up your profile and productivity preferences
3. Start managing tasks and building habits with your team

[Accept Invitation] (This would be a secure invitation link)

Benefits of joining:
✓ Collaborate on shared tasks and projects
✓ Track team productivity metrics
✓ Share habits and motivate each other
✓ Access to advanced analytics and insights
✓ Real-time updates and notifications

If you have any questions, feel free to reach out to ${inviteData.inviterName} or our support team.

Welcome to more productive teamwork!

Best regards,
The Productivity Hub Team

---
This invitation was sent by ${inviteData.inviterName} on ${new Date().toLocaleDateString()}.
If you weren't expecting this invitation, you can safely ignore this email.
    `;

    return emailTemplate.trim();
  };

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="text-yellow-500" size={16} />;
      case 'admin': return <Shield className="text-blue-500" size={16} />;
      case 'member': return <Edit className="text-green-500" size={16} />;
      case 'viewer': return <Eye className="text-gray-500" size={16} />;
      default: return <Users className="text-gray-500" size={16} />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case 'admin': return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case 'member': return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case 'viewer': return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Users size={24} />
            <span>Team Collaboration</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your team members and collaborate on productivity goals.
          </p>
        </div>
        
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <UserPlus size={16} />
              <span>Invite Member</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Mail size={20} />
                <span>Invite Team Member</span>
              </DialogTitle>
              <DialogDescription>
                Send an email invitation to add a new team member to your productivity workspace.
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
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="member">
                  <SelectTrigger>
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
                <Button type="submit" disabled={inviteMutation.isPending} className="flex-1">
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

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users size={20} />
            <span>Team Members</span>
            <Badge variant="secondary">{members.length}</Badge>
          </CardTitle>
          <CardDescription>
            Active team members and their roles in your productivity workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No team members yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start collaborating by inviting team members to join your workspace.
              </p>
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus size={16} className="mr-2" />
                Invite Your First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{member.name}</h4>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleIcon(member.role)}
                          <span className="ml-1">{member.role}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <p className="text-xs text-gray-400">
                        Last active: {new Date(member.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {member.role !== 'owner' && (
                      <Button size="sm" variant="outline">
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail size={20} />
              <span>Pending Invitations</span>
              <Badge variant="outline">{invitations.length}</Badge>
            </CardTitle>
            <CardDescription>
              Email invitations that haven't been accepted yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Invited as {invitation.role} by {invitation.invitedBy}
                    </p>
                    <p className="text-xs text-gray-400">
                      Sent {new Date(invitation.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      Pending
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}