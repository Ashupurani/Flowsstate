import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import {
  Folder, FolderPlus, Users, FileText, Activity, Settings,
  Plus, Crown, Shield, Edit3, Eye, Trash2, UserPlus, Link2,
  Copy, Check, MoreHorizontal, Pin, PinOff,
  Briefcase, Code, Star, Heart, Home, Zap, Flame, Target,
  Layers, Book, Globe, Music, Coffee, Trophy, ChevronLeft, ChevronRight,
  AlertCircle, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workspace {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  ownerId: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  myRole: string;
}

interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number;
  role: string;
  joinedAt: string;
  lastActive: string;
  name: string;
  email: string;
}

interface WorkspaceContent {
  id: number;
  workspaceId: number;
  authorId: number;
  title: string;
  body: string;
  type: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

interface WorkspaceActivityItem {
  id: number;
  workspaceId: number;
  userId: number | null;
  action: string;
  targetUserId: number | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  actorName: string;
  targetName?: string;
}

interface WorkspaceInviteLink {
  id: number;
  workspaceId: number;
  token: string;
  role: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKSPACE_COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#f97316",
  "#14b8a6", "#06b6d4",
];

const WORKSPACE_ICONS = [
  { name: "folder", icon: Folder },
  { name: "briefcase", icon: Briefcase },
  { name: "code", icon: Code },
  { name: "star", icon: Star },
  { name: "heart", icon: Heart },
  { name: "home", icon: Home },
  { name: "zap", icon: Zap },
  { name: "flame", icon: Flame },
  { name: "target", icon: Target },
  { name: "layers", icon: Layers },
  { name: "book", icon: Book },
  { name: "globe", icon: Globe },
  { name: "music", icon: Music },
  { name: "coffee", icon: Coffee },
  { name: "trophy", icon: Trophy },
];

function WorkspaceIcon({ name, size = 16 }: { name: string; size?: number }) {
  const found = WORKSPACE_ICONS.find(i => i.name === name);
  const IconComp = found?.icon ?? Folder;
  return <IconComp size={size} />;
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    owner: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
    editor: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
    viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
  };
  const icons: Record<string, JSX.Element> = {
    owner: <Crown size={11} />,
    admin: <Shield size={11} />,
    editor: <Edit3 size={11} />,
    viewer: <Eye size={11} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] ?? colors.viewer}`}>
      {icons[role] ?? <Eye size={11} />}
      {role}
    </span>
  );
}

function canManage(role: string) { return role === "owner" || role === "admin"; }
function canEdit(role: string) { return role === "owner" || role === "admin" || role === "editor"; }

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Create / Edit Workspace Modal ───────────────────────────────────────────

function CreateWorkspaceModal({
  open, onOpenChange, workspace, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspace?: Workspace;
  onSuccess: (ws: Workspace) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [color, setColor] = useState(workspace?.color ?? "#6366f1");
  const [icon, setIcon] = useState(workspace?.icon ?? "folder");

  useEffect(() => {
    setName(workspace?.name ?? "");
    setDescription(workspace?.description ?? "");
    setColor(workspace?.color ?? "#6366f1");
    setIcon(workspace?.icon ?? "folder");
  }, [workspace, open]);

  const mutation = useMutation({
    mutationFn: (data: { name: string; description: string; color: string; icon: string }) =>
      workspace
        ? apiRequest("PUT", `/api/workspaces/${workspace.id}`, data)
        : apiRequest("POST", "/api/workspaces", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      onSuccess(data);
      onOpenChange(false);
      toast({ title: workspace ? "Workspace updated!" : "Workspace created!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{workspace ? "Edit Workspace" : "New Workspace"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="My Team Workspace" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea placeholder="What is this workspace for?" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {WORKSPACE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {WORKSPACE_ICONS.map(({ name: n, icon: IconComp }) => (
                <button
                  key={n}
                  type="button"
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all hover:scale-110 ${icon === n ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400"}`}
                  onClick={() => setIcon(n)}
                >
                  <IconComp size={16} />
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: color }}>
              <WorkspaceIcon name={icon} size={18} />
            </div>
            <span className="font-medium text-sm truncate">{name || "Workspace name"}</span>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate({ name, description, color, icon })}>
              {mutation.isPending ? "Saving..." : workspace ? "Save Changes" : "Create Workspace"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invite Member Modal ──────────────────────────────────────────────────────

function InviteMemberModal({ workspaceId, open, onOpenChange }: { workspaceId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");

  const mutation = useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      apiRequest("POST", `/api/workspaces/${workspaceId}/invitations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/invitations`] });
      setEmail(""); setRole("viewer");
      onOpenChange(false);
      toast({ title: "Invitation sent!", description: `Invite sent to ${email}` });
    },
    onError: (e: Error) => toast({ title: "Failed to send invite", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus size={18} /> Invite Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer — read only</SelectItem>
                <SelectItem value="editor">Editor — create &amp; edit content</SelectItem>
                <SelectItem value="admin">Admin — full management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" disabled={!email || mutation.isPending} onClick={() => mutation.mutate({ email, role })}>
              {mutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invite Link Modal ────────────────────────────────────────────────────────

function InviteLinkModal({ workspaceId, open, onOpenChange }: { workspaceId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [role, setRole] = useState("viewer");
  const [maxUses, setMaxUses] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: links = [] } = useQuery<WorkspaceInviteLink[]>({
    queryKey: [`/api/workspaces/${workspaceId}/invite-links`],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: { role: string; maxUses?: number }) =>
      apiRequest("POST", `/api/workspaces/${workspaceId}/invite-links`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/invite-links`] });
      toast({ title: "Invite link created!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (linkId: number) =>
      apiRequest("DELETE", `/api/workspaces/${workspaceId}/invite-links/${linkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/invite-links`] });
      toast({ title: "Link deactivated" });
    },
  });

  const copyLink = (link: WorkspaceInviteLink) => {
    const url = `${window.location.origin}/join-workspace/${link.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Link2 size={18} /> Invite Links</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Max uses (∞)"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              className="w-36"
            />
            <Button
              onClick={() => createMutation.mutate({ role, ...(maxUses ? { maxUses: Number(maxUses) } : {}) })}
              disabled={createMutation.isPending}
            >
              <Plus size={14} className="mr-1" /> Create
            </Button>
          </div>

          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active links. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <RoleBadge role={link.role} />
                      <span className="text-xs text-muted-foreground">{link.useCount}/{link.maxUses ?? "∞"} uses</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">/join-workspace/{link.token.slice(0, 16)}…</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyLink(link)}>
                    {copiedId === link.id ? <Check size={13} /> : <Copy size={13} />}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 h-8 w-8 p-0" onClick={() => deleteMutation.mutate(link.id)}>
                    <X size={13} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Members Panel ────────────────────────────────────────────────────────────

function MembersPanel({ workspace, myRole }: { workspace: Workspace; myRole: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);

  const { data: members = [], isLoading } = useQuery<WorkspaceMember[]>({
    queryKey: [`/api/workspaces/${workspace.id}/members`],
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiRequest("PUT", `/api/workspaces/${workspace.id}/members/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/members`] });
      toast({ title: "Role updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest("DELETE", `/api/workspaces/${workspace.id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/members`] });
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      setRemoveTarget(null);
      toast({ title: "Member removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Members <span className="text-muted-foreground font-normal text-sm">({members.length})</span>
        </h3>
        {canManage(myRole) && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowInviteLink(true)}>
              <Link2 size={13} className="mr-1" /> Invite Link
            </Button>
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={13} className="mr-1" /> Invite
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback style={{ backgroundColor: workspace.color + "30", color: workspace.color }}>
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{member.name}</span>
                    <RoleBadge role={member.role} />
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>

              {canManage(myRole) && member.role !== "owner" && member.userId !== (user as any)?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => changeRoleMutation.mutate({ userId: member.userId, role: "viewer" })}>
                      <Eye size={13} className="mr-2" /> Set Viewer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeRoleMutation.mutate({ userId: member.userId, role: "editor" })}>
                      <Edit3 size={13} className="mr-2" /> Set Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeRoleMutation.mutate({ userId: member.userId, role: "admin" })}>
                      <Shield size={13} className="mr-2" /> Set Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setRemoveTarget(member)}>
                      <Trash2 size={13} className="mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      <InviteMemberModal workspaceId={workspace.id} open={showInvite} onOpenChange={setShowInvite} />
      <InviteLinkModal workspaceId={workspace.id} open={showInviteLink} onOpenChange={setShowInviteLink} />

      <AlertDialog open={!!removeTarget} onOpenChange={v => !v && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{removeTarget?.name}</strong> from this workspace? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => removeTarget && removeMutation.mutate(removeTarget.userId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({ workspaceId }: { workspaceId: number }) {
  const { data: activities = [], isLoading } = useQuery<WorkspaceActivityItem[]>({
    queryKey: [`/api/workspaces/${workspaceId}/activity`],
    refetchInterval: 30_000,
  });

  const actionLabel = (activity: WorkspaceActivityItem) => {
    const m = activity.metadata as any;
    switch (activity.action) {
      case "workspace_created": return "created this workspace";
      case "workspace_updated": return "updated workspace settings";
      case "member_joined": return "joined the workspace";
      case "member_invited": return `invited ${activity.targetName ?? m?.email ?? "someone"}`;
      case "member_removed": return `removed ${activity.targetName ?? "a member"}`;
      case "role_changed": return `changed ${activity.targetName ?? "a member"}'s role to ${m?.role ?? m?.newRole}`;
      case "content_created": return `created "${m?.title}"`;
      case "content_updated": return `updated "${m?.title}"`;
      case "content_deleted": return `deleted "${m?.title}"`;
      case "content_pinned": return `pinned "${m?.title}"`;
      case "content_unpinned": return `unpinned "${m?.title}"`;
      case "invite_link_created": return "created an invite link";
      case "invite_link_deleted": return "deactivated an invite link";
      default: return activity.action.replace(/_/g, " ");
    }
  };

  const actionIcon = (action: string) => {
    if (action.includes("member") || action.includes("role")) return <Users size={13} />;
    if (action.includes("content")) return <FileText size={13} />;
    if (action.includes("invite")) return <UserPlus size={13} />;
    return <Activity size={13} />;
  };

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No activity yet. Start collaborating!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {activities.map(a => (
        <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center mt-0.5 text-muted-foreground">
            {actionIcon(a.action)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">{a.actorName}</span>{" "}
              <span className="text-muted-foreground">{actionLabel(a)}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({
  item, myRole, workspaceColor, onEdit, onDelete, onPin,
}: {
  item: WorkspaceContent;
  myRole: string;
  workspaceColor: string;
  onEdit: (item: WorkspaceContent) => void;
  onDelete: (item: WorkspaceContent) => void;
  onPin: (id: number, pinned: boolean) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative border rounded-xl p-4 bg-card hover:shadow-md transition-all cursor-default"
    >
      {item.isPinned && <Pin size={11} className="absolute top-2.5 right-2.5 text-muted-foreground opacity-50" />}
      <h4 className="font-medium text-sm mb-1 pr-5 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-3 mb-3 min-h-[3rem]">{item.body || <em className="opacity-50">No content</em>}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{item.authorName} · {new Date(item.updatedAt).toLocaleDateString()}</span>
        {canEdit(myRole) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onPin(item.id, !item.isPinned)}>
              {item.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit(item)}>
              <Edit3 size={11} />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" onClick={() => onDelete(item)}>
              <Trash2 size={11} />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Content Area ─────────────────────────────────────────────────────────────

function ContentArea({ workspace, myRole }: { workspace: Workspace; myRole: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WorkspaceContent | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceContent | null>(null);

  const { data: content = [], isLoading } = useQuery<WorkspaceContent[]>({
    queryKey: [`/api/workspaces/${workspace.id}/content`],
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; body: string; type: string }) =>
      apiRequest("POST", `/api/workspaces/${workspace.id}/content`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/content`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/activity`] });
      setShowForm(false); setTitle(""); setBody("");
      toast({ title: "Note created!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkspaceContent> }) =>
      apiRequest("PUT", `/api/workspaces/${workspace.id}/content/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/content`] });
      setEditing(null); setTitle(""); setBody("");
      toast({ title: "Note updated!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/workspaces/${workspace.id}/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/content`] });
      setDeleteTarget(null);
      toast({ title: "Note deleted" });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: number; isPinned: boolean }) =>
      apiRequest("PUT", `/api/workspaces/${workspace.id}/content/${id}`, { isPinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/content`] }),
  });

  const startEdit = (item: WorkspaceContent) => {
    setEditing(item); setTitle(item.title); setBody(item.body); setShowForm(true);
  };

  const pinned = content.filter(c => c.isPinned);
  const unpinned = content.filter(c => !c.isPinned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Notes &amp; Documents <span className="text-muted-foreground font-normal text-sm">({content.length})</span>
        </h3>
        {canEdit(myRole) && (
          <Button size="sm" onClick={() => { setShowForm(true); setEditing(null); setTitle(""); setBody(""); }}>
            <Plus size={13} className="mr-1" /> New Note
          </Button>
        )}
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="border rounded-xl p-4 bg-card space-y-3">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="font-medium" />
          <Textarea placeholder="Write something…" value={body} onChange={e => setBody(e.target.value)} rows={4} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!title.trim() || createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                if (editing) updateMutation.mutate({ id: editing.id, data: { title, body } });
                else createMutation.mutate({ title, body, type: "note" });
              }}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}</div>
      ) : content.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{canEdit(myRole) ? "Create your first note!" : "No notes yet."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Pin size={10} /> Pinned
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {pinned.map(item => (
                  <ContentCard key={item.id} item={item} myRole={myRole} workspaceColor={workspace.color}
                    onEdit={startEdit} onDelete={setDeleteTarget} onPin={(id, pinned) => pinMutation.mutate({ id, isPinned: pinned })} />
                ))}
              </div>
            </div>
          )}
          {unpinned.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {unpinned.map(item => (
                <ContentCard key={item.id} item={item} myRole={myRole} workspaceColor={workspace.color}
                  onEdit={startEdit} onDelete={setDeleteTarget} onPin={(id, pinned) => pinMutation.mutate({ id, isPinned: pinned })} />
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>"{deleteTarget?.title}"</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel({ workspace, myRole, onUpdate, onDeleted }: {
  workspace: Workspace;
  myRole: string;
  onUpdate: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const archiveMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/workspaces/${workspace.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      toast({ title: "Workspace archived" });
      onDeleted();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (!canManage(myRole)) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Only admins and owners can access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="font-semibold mb-1">Workspace Details</h3>
        <p className="text-sm text-muted-foreground mb-3">Update the name, description, color, and icon.</p>
        <div className="flex items-center gap-4 p-4 border rounded-xl bg-card">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: workspace.color }}>
            <WorkspaceIcon name={workspace.icon} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{workspace.name}</p>
            <p className="text-sm text-muted-foreground truncate">{workspace.description || "No description"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Edit3 size={13} className="mr-1" /> Edit
          </Button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-1">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-3">Archive this workspace. Members will lose access immediately.</p>
        <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={() => setShowArchive(true)}>
          <Trash2 size={13} className="mr-1" /> Archive Workspace
        </Button>
      </div>

      <CreateWorkspaceModal open={showEdit} onOpenChange={setShowEdit} workspace={workspace} onSuccess={() => { onUpdate(); setShowEdit(false); }} />

      <AlertDialog open={showArchive} onOpenChange={setShowArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Archive <strong>{workspace.name}</strong>? All members will lose access. Content is preserved but the workspace won't appear in the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => archiveMutation.mutate()}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [showCreate, setShowCreate] = useState(false);

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
  });

  useEffect(() => {
    if (workspaces.length > 0 && !selectedId) {
      setSelectedId(workspaces[0].id);
    }
  }, [workspaces, selectedId]);

  useEffect(() => {
    document.title = "Flowsstate - Workspaces";
  }, []);

  const selected = workspaces.find(w => w.id === selectedId) ?? null;
  const myRole = selected?.myRole ?? "viewer";

  const handleWorkspaceSelect = (id: number) => {
    setSelectedId(id);
    setActiveTab("content");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 73px)" }}>

        {/* Sidebar */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 52 : 240 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="border-r bg-muted/20 dark:bg-slate-900/40 flex flex-col flex-shrink-0 overflow-hidden"
        >
          {!sidebarCollapsed && (
            <div className="h-12 px-3 border-b flex items-center justify-between flex-shrink-0">
              <span className="font-semibold text-sm">Workspaces</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => setShowCreate(true)} title="New workspace">
                <FolderPlus size={14} />
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-2 px-1.5">
            {isLoading ? (
              <div className="space-y-1 px-1">{[1, 2, 3].map(i => <Skeleton key={i} className="h-9 rounded-lg" />)}</div>
            ) : workspaces.length === 0 && !sidebarCollapsed ? (
              <div className="px-2 py-6 text-center">
                <p className="text-xs text-muted-foreground mb-3">No workspaces yet</p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setShowCreate(true)}>
                  <Plus size={12} className="mr-1" /> Create one
                </Button>
              </div>
            ) : (
              workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => handleWorkspaceSelect(ws.id)}
                  title={sidebarCollapsed ? ws.name : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                    selectedId === ws.id
                      ? "bg-background shadow-sm font-medium text-foreground"
                      : "font-normal text-muted-foreground hover:text-foreground hover:bg-background/60"
                  }`}
                >
                  <div className="w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: ws.color }}>
                    <WorkspaceIcon name={ws.icon} size={12} />
                  </div>
                  {!sidebarCollapsed && <span className="truncate text-left flex-1">{ws.name}</span>}
                </button>
              ))
            )}
          </div>

          <div className="p-2 border-t flex-shrink-0">
            {sidebarCollapsed ? (
              <Button variant="ghost" size="sm" className="w-full h-8 p-0 flex items-center justify-center" onClick={() => setSidebarCollapsed(false)} title="Expand sidebar">
                <ChevronRight size={14} />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="w-full h-8 flex items-center justify-center gap-1.5" onClick={() => setSidebarCollapsed(true)}>
                <ChevronLeft size={13} />
                <span className="text-xs">Collapse</span>
              </Button>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-background">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-sm">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Folder size={36} className="text-muted-foreground opacity-40" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {workspaces.length === 0 ? "No workspaces yet" : "Select a workspace"}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {workspaces.length === 0
                      ? "Create your first workspace to start collaborating with your team."
                      : "Pick a workspace from the sidebar to get started."}
                  </p>
                </div>
                {workspaces.length === 0 && (
                  <Button onClick={() => setShowCreate(true)}>
                    <FolderPlus size={15} className="mr-2" /> Create Workspace
                  </Button>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="p-6 max-w-5xl mx-auto">
              {/* Workspace Header */}
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 mb-6"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: selected.color }}>
                  <WorkspaceIcon name={selected.icon} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold truncate">{selected.name}</h1>
                  {selected.description && <p className="text-muted-foreground text-sm mt-0.5">{selected.description}</p>}
                </div>
                <RoleBadge role={myRole} />
              </motion.div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="content" className="flex items-center gap-1.5">
                    <FileText size={13} /> Content
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex items-center gap-1.5">
                    <Users size={13} /> Members
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-1.5">
                    <Activity size={13} /> Activity
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-1.5">
                    <Settings size={13} /> Settings
                  </TabsTrigger>
                </TabsList>

                <motion.div key={`${selected.id}-${activeTab}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                  <TabsContent value="content">
                    <ContentArea workspace={selected} myRole={myRole} />
                  </TabsContent>
                  <TabsContent value="members">
                    <MembersPanel workspace={selected} myRole={myRole} />
                  </TabsContent>
                  <TabsContent value="activity">
                    <ActivityFeed workspaceId={selected.id} />
                  </TabsContent>
                  <TabsContent value="settings">
                    <SettingsPanel
                      workspace={selected}
                      myRole={myRole}
                      onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] })}
                      onDeleted={() => setSelectedId(null)}
                    />
                  </TabsContent>
                </motion.div>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <CreateWorkspaceModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={ws => setSelectedId(ws.id)}
      />
    </div>
  );
}
