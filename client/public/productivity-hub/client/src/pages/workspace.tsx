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
  AlertCircle, X, User, Building2, Kanban, Calendar, Flag, ChevronDown, Loader2,
  ChevronUp, MessageSquare, List, Send, Tag, CheckSquare, Square, SlidersHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workspace {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  type: string; // "personal" | "team"
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

interface WorkspaceTask {
  id: number;
  workspaceId: number;
  createdBy: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: number | null;
  dueDate: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  assigneeName: string | null;
}

interface WorkspaceColumn {
  id: number;
  workspaceId: number;
  key: string;
  name: string;
  color: string;
  position: number;
  createdAt: string;
}

interface WorkspaceSubtask {
  id: number;
  taskId: number;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
}

interface WorkspaceTaskComment {
  id: number;
  taskId: number;
  userId: number;
  body: string;
  createdAt: string;
  authorName: string;
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

const PREDEFINED_LABELS = [
  { key: "bug",      label: "Bug",      color: "#ef4444" },
  { key: "feature",  label: "Feature",  color: "#3b82f6" },
  { key: "design",   label: "Design",   color: "#8b5cf6" },
  { key: "research", label: "Research", color: "#f59e0b" },
  { key: "docs",     label: "Docs",     color: "#10b981" },
  { key: "urgent",   label: "Urgent",   color: "#f97316" },
  { key: "blocked",  label: "Blocked",  color: "#6b7280" },
  { key: "review",   label: "Review",   color: "#06b6d4" },
];

const COLUMN_COLORS = ["#94a3b8", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#f97316"];

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  low:    { label: "Low",    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  medium: { label: "Medium", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  high:   { label: "High",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

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
  const [type, setType] = useState<"personal" | "team">(workspace?.type === "personal" ? "personal" : "team");

  useEffect(() => {
    setName(workspace?.name ?? "");
    setDescription(workspace?.description ?? "");
    setColor(workspace?.color ?? "#6366f1");
    setIcon(workspace?.icon ?? "folder");
    setType(workspace?.type === "personal" ? "personal" : "team");
  }, [workspace, open]);

  const mutation = useMutation({
    mutationFn: (data: { name: string; description: string; color: string; icon: string; type: string }) =>
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
          {/* Workspace type selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("personal")}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${type === "personal" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-muted hover:border-muted-foreground/30"}`}
            >
              <User size={20} className={type === "personal" ? "text-indigo-600" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${type === "personal" ? "text-indigo-700 dark:text-indigo-300" : "text-muted-foreground"}`}>My Space</span>
              <span className="text-xs text-muted-foreground text-center leading-tight">Private, solo workspace</span>
            </button>
            <button
              type="button"
              onClick={() => setType("team")}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${type === "team" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-muted hover:border-muted-foreground/30"}`}
            >
              <Building2 size={20} className={type === "team" ? "text-indigo-600" : "text-muted-foreground"} />
              <span className={`text-sm font-medium ${type === "team" ? "text-indigo-700 dark:text-indigo-300" : "text-muted-foreground"}`}>Team Space</span>
              <span className="text-xs text-muted-foreground text-center leading-tight">Collaborative, role-based</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder={type === "personal" ? "My Workspace" : "Team Workspace"} value={name} onChange={e => setName(e.target.value)} />
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
            <Button className="flex-1" disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate({ name, description, color, icon, type })}>
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

const ROLE_DESCRIPTIONS: Record<string, { label: string; desc: string; cls: string }> = {
  viewer: { label: "Viewer", desc: "View content, tasks, and activity. Cannot create or edit anything.", cls: "border-slate-200 bg-slate-50 dark:bg-slate-900/30" },
  editor: { label: "Editor", desc: "Create and edit content and tasks. Cannot manage members or settings.", cls: "border-green-200 bg-green-50 dark:bg-green-900/20" },
  admin:  { label: "Admin",  desc: "Full access — manage members, invite links, content, tasks, and settings.", cls: "border-blue-200 bg-blue-50 dark:bg-blue-900/20" },
};

function InviteMemberModal({ workspaceId, workspaceName, open, onOpenChange }: {
  workspaceId: number;
  workspaceName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
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

  const roleInfo = ROLE_DESCRIPTIONS[role];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserPlus size={18} /> Invite to {workspaceName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Role in this workspace</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {roleInfo && (
              <div className={`text-xs rounded-lg border p-2.5 ${roleInfo.cls}`}>
                <span className="font-medium">{roleInfo.label}: </span>
                <span className="text-muted-foreground">{roleInfo.desc}</span>
              </div>
            )}
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

      <InviteMemberModal workspaceId={workspace.id} workspaceName={workspace.name} open={showInvite} onOpenChange={setShowInvite} />
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
      case "task_created": return `created task "${m?.title}"`;
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

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({ members, filterPriority, setFilterPriority, filterAssignee, setFilterAssignee, filterLabel, setFilterLabel, hideCompleted, setHideCompleted }: {
  members: WorkspaceMember[];
  filterPriority: string; setFilterPriority: (v: string) => void;
  filterAssignee: string; setFilterAssignee: (v: string) => void;
  filterLabel: string;    setFilterLabel: (v: string) => void;
  hideCompleted: boolean; setHideCompleted: (v: boolean) => void;
}) {
  const hasFilters = filterPriority !== "all" || filterAssignee !== "all" || filterLabel !== "all" || hideCompleted;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={filterPriority} onValueChange={setFilterPriority}>
        <SelectTrigger className="h-7 text-xs w-[118px]"><Flag size={10} className="mr-1" /><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      {members.length > 0 && (
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="h-7 text-xs w-[120px]"><User size={10} className="mr-1" /><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={filterLabel} onValueChange={setFilterLabel}>
        <SelectTrigger className="h-7 text-xs w-[100px]"><Tag size={10} className="mr-1" /><SelectValue placeholder="Label" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Labels</SelectItem>
          {PREDEFINED_LABELS.map(l => (
            <SelectItem key={l.key} value={l.key}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant={hideCompleted ? "secondary" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setHideCompleted(!hideCompleted)}>
        {hideCompleted ? <CheckSquare size={11} className="mr-1" /> : <Square size={11} className="mr-1" />}
        Hide Done
      </Button>
      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { setFilterPriority("all"); setFilterAssignee("all"); setFilterLabel("all"); setHideCompleted(false); }}>
          <X size={11} className="mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}

// ─── Manage Columns Modal ─────────────────────────────────────────────────────

function ManageColumnsModal({ workspaceId, open, onOpenChange }: { workspaceId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState("#94a3b8");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: columns = [] } = useQuery<WorkspaceColumn[]>({
    queryKey: [`/api/workspaces/${workspaceId}/columns`],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => apiRequest("POST", `/api/workspaces/${workspaceId}/columns`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/columns`] }); setNewColName(""); setNewColColor("#94a3b8"); toast({ title: "Column added!" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PUT", `/api/workspaces/${workspaceId}/columns/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/columns`] }); setEditingId(null); toast({ title: "Column updated!" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/workspaces/${workspaceId}/columns/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/columns`] }); queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks`] }); toast({ title: "Column deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: (order: number[]) => apiRequest("PUT", `/api/workspaces/${workspaceId}/columns/reorder`, { order }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/columns`] }),
  });

  const sorted = [...columns].sort((a, b) => a.position - b.position);

  const moveCol = (idx: number, dir: -1 | 1) => {
    const arr = [...sorted];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    reorderMutation.mutate(arr.map(c => c.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Kanban size={16} /> Manage Columns</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {sorted.map((col, idx) => (
            <div key={col.id} className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/20">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
              {editingId === col.id ? (
                <Input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)} className="h-7 text-sm flex-1"
                  onKeyDown={e => { if (e.key === "Enter" && editingName.trim()) updateMutation.mutate({ id: col.id, data: { name: editingName } }); if (e.key === "Escape") setEditingId(null); }} />
              ) : (
                <span className="text-sm flex-1 font-medium">{col.name}</span>
              )}
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" disabled={idx === 0} onClick={() => moveCol(idx, -1)}><ChevronUp size={11} /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" disabled={idx === sorted.length - 1} onClick={() => moveCol(idx, 1)}><ChevronDown size={11} /></Button>
                {editingId === col.id ? (
                  <>
                    <Button size="sm" className="h-6 px-2 text-xs" disabled={!editingName.trim()} onClick={() => updateMutation.mutate({ id: col.id, data: { name: editingName } })}>Save</Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => { setEditingId(col.id); setEditingName(col.name); }}><Edit3 size={11} /></Button>
                )}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-600" disabled={columns.length <= 1} onClick={() => deleteMutation.mutate(col.id)}><Trash2 size={11} /></Button>
              </div>
            </div>
          ))}
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add Column</p>
            <div className="flex gap-2">
              <Input placeholder="Column name" value={newColName} onChange={e => setNewColName(e.target.value)} className="h-8 text-sm"
                onKeyDown={e => { if (e.key === "Enter" && newColName.trim()) createMutation.mutate({ name: newColName, color: newColColor }); }} />
              <Button size="sm" className="h-8" disabled={!newColName.trim() || createMutation.isPending} onClick={() => createMutation.mutate({ name: newColName, color: newColColor })}><Plus size={13} /></Button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {COLUMN_COLORS.map(c => (
                <button key={c} type="button" className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newColColor === c ? "border-gray-800 dark:border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} onClick={() => setNewColColor(c)} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Task Detail Dialog ────────────────────────────────────────────────────────

function TaskDetailDialog({ task, workspaceId, workspace, myRole, members, open, onOpenChange, onUpdated, onDeleted }: {
  task: WorkspaceTask | null;
  workspaceId: number;
  workspace: Workspace;
  myRole: string;
  members: WorkspaceMember[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editAssignedTo, setEditAssignedTo] = useState("none");
  const [editDueDate, setEditDueDate] = useState("");
  const [editLabels, setEditLabels] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description ?? "");
      setEditPriority(task.priority);
      setEditAssignedTo(task.assignedTo ? String(task.assignedTo) : "none");
      setEditDueDate(task.dueDate ?? "");
      setEditLabels(task.labels ?? []);
      setEditStatus(task.status);
    }
  }, [task?.id]);

  const { data: subtasks = [] } = useQuery<WorkspaceSubtask[]>({
    queryKey: [`/api/workspaces/${workspaceId}/tasks/${task?.id}/subtasks`],
    enabled: open && !!task,
  });
  const { data: comments = [] } = useQuery<WorkspaceTaskComment[]>({
    queryKey: [`/api/workspaces/${workspaceId}/tasks/${task?.id}/comments`],
    enabled: open && !!task,
  });
  const { data: columns = [] } = useQuery<WorkspaceColumn[]>({
    queryKey: [`/api/workspaces/${workspaceId}/columns`],
    enabled: open && !!task,
  });

  const updateMutation = useMutation({
    mutationFn: (data: object) => apiRequest("PUT", `/api/workspaces/${workspaceId}/tasks/${task!.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks`] }); toast({ title: "Task updated!" }); onUpdated(); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/workspaces/${workspaceId}/tasks/${task!.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks`] }); onDeleted(); onOpenChange(false); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const addSubMutation = useMutation({
    mutationFn: (title: string) => apiRequest("POST", `/api/workspaces/${workspaceId}/tasks/${task!.id}/subtasks`, { title }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks/${task?.id}/subtasks`] }); setNewSubtask(""); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const toggleSubMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) => apiRequest("PUT", `/api/workspaces/${workspaceId}/tasks/${task!.id}/subtasks/${id}`, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks/${task?.id}/subtasks`] }),
  });
  const deleteSubMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/workspaces/${workspaceId}/tasks/${task!.id}/subtasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks/${task?.id}/subtasks`] }),
  });
  const addCommentMutation = useMutation({
    mutationFn: (body: string) => apiRequest("POST", `/api/workspaces/${workspaceId}/tasks/${task!.id}/comments`, { body }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks/${task?.id}/comments`] }); setNewComment(""); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/workspaces/${workspaceId}/tasks/${task!.id}/comments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/tasks/${task?.id}/comments`] }),
  });

  const toggleLabel = (key: string) => setEditLabels(prev => prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]);
  const saveTask = () => updateMutation.mutate({ title: editTitle, description: editDesc || null, priority: editPriority, dueDate: editDueDate || null, assignedTo: editAssignedTo !== "none" ? Number(editAssignedTo) : null, labels: editLabels, status: editStatus });
  const sortedCols = [...columns].sort((a, b) => a.position - b.position);
  const completedCount = subtasks.filter(s => s.completed).length;

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="text-base font-semibold">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          <div className="grid grid-cols-[1fr,260px] gap-5">
            {/* Left */}
            <div className="space-y-4 min-w-0">
              {canEdit(myRole) ? (
                <>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Title</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="font-medium" /></div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} placeholder="Add a description…" /></div>
                </>
              ) : (
                <div>
                  <p className="font-medium">{task.title}</p>
                  {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                </div>
              )}

              {/* Labels */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Labels</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_LABELS.map(l => {
                    const active = editLabels.includes(l.key);
                    return (
                      <button key={l.key} type="button" disabled={!canEdit(myRole)}
                        onClick={() => canEdit(myRole) && toggleLabel(l.key)}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-all ${active ? "text-white border-transparent" : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground"}`}
                        style={active ? { backgroundColor: l.color } : {}}>
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtasks */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckSquare size={11} /> Subtasks {subtasks.length > 0 && <span className="text-muted-foreground/60">({completedCount}/{subtasks.length})</span>}
                </Label>
                <div className="space-y-1">
                  {subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 group">
                      <button type="button" disabled={!canEdit(myRole)} className="flex-shrink-0 disabled:cursor-default"
                        onClick={() => canEdit(myRole) && toggleSubMutation.mutate({ id: sub.id, completed: !sub.completed })}>
                        {sub.completed ? <CheckSquare size={14} className="text-emerald-500" /> : <Square size={14} className="text-muted-foreground" />}
                      </button>
                      <span className={`text-sm flex-1 ${sub.completed ? "line-through text-muted-foreground" : ""}`}>{sub.title}</span>
                      {canEdit(myRole) && (
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                          onClick={() => deleteSubMutation.mutate(sub.id)}><X size={11} /></Button>
                      )}
                    </div>
                  ))}
                </div>
                {canEdit(myRole) && (
                  <div className="flex gap-2">
                    <Input placeholder="Add subtask…" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} className="h-7 text-sm"
                      onKeyDown={e => { if (e.key === "Enter" && newSubtask.trim()) addSubMutation.mutate(newSubtask.trim()); }} />
                    <Button size="sm" className="h-7 px-2" disabled={!newSubtask.trim()} onClick={() => addSubMutation.mutate(newSubtask.trim())}><Plus size={12} /></Button>
                  </div>
                )}
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare size={11} /> Comments ({comments.length})
                </Label>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2 group">
                      <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                        <AvatarFallback className="text-[10px]">{initials(c.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{c.authorName}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 break-words">{c.body}</p>
                      </div>
                      {(c.userId === (user as any)?.id || canManage(myRole)) && (
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 flex-shrink-0"
                          onClick={() => deleteCommentMutation.mutate(c.id)}><X size={11} /></Button>
                      )}
                    </div>
                  ))}
                  {comments.length === 0 && <p className="text-xs text-muted-foreground/50">No comments yet.</p>}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Write a comment…" value={newComment} onChange={e => setNewComment(e.target.value)} className="h-8 text-sm"
                    onKeyDown={e => { if (e.key === "Enter" && newComment.trim()) addCommentMutation.mutate(newComment.trim()); }} />
                  <Button size="sm" className="h-8 px-2" disabled={!newComment.trim()} onClick={() => addCommentMutation.mutate(newComment.trim())}><Send size={12} /></Button>
                </div>
              </div>
            </div>

            {/* Right: metadata */}
            <div className="space-y-3 border-l pl-4 min-w-0">
              {canEdit(myRole) ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {sortedCols.map(col => <SelectItem key={col.key} value={col.key}>{col.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <Select value={editPriority} onValueChange={setEditPriority}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className="h-8 text-xs" />
                  </div>
                  {workspace.type === "team" && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Assignee</Label>
                      <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {members.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2 text-sm">
                  <div><span className="text-xs text-muted-foreground block">Status</span>{task.status}</div>
                  <div><span className="text-xs text-muted-foreground block">Priority</span>{task.priority}</div>
                  {task.dueDate && <div><span className="text-xs text-muted-foreground block">Due</span>{task.dueDate}</div>}
                  {task.assigneeName && <div><span className="text-xs text-muted-foreground block">Assignee</span>{task.assigneeName}</div>}
                </div>
              )}
              <div className="pt-1 text-[11px] text-muted-foreground space-y-0.5">
                <p>Created by {task.creatorName}</p>
                <p>{new Date(task.createdAt).toLocaleDateString()}</p>
              </div>
              {canEdit(myRole) && (
                <div className="pt-2 space-y-1.5">
                  <Button className="w-full h-8 text-xs" disabled={!editTitle.trim() || updateMutation.isPending} onClick={saveTask}>
                    {updateMutation.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button variant="outline" className="w-full h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={() => deleteMutation.mutate()}>
                    <Trash2 size={11} className="mr-1" /> Delete Task
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Workspace Board (Kanban) ─────────────────────────────────────────────────

function WorkspaceBoard({ workspace, myRole, members }: { workspace: Workspace; myRole: string; members: WorkspaceMember[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [boardView, setBoardView] = useState<"board" | "list" | "calendar">("board");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [addingCol, setAddingCol] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [detailTask, setDetailTask] = useState<WorkspaceTask | null>(null);
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [dragOverColKey, setDragOverColKey] = useState<string | null>(null);
  const [showManageCols, setShowManageCols] = useState(false);

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<WorkspaceTask[]>({
    queryKey: [`/api/workspaces/${workspace.id}/tasks`],
  });
  const { data: columns = [], isLoading: colsLoading } = useQuery<WorkspaceColumn[]>({
    queryKey: [`/api/workspaces/${workspace.id}/columns`],
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", `/api/workspaces/${workspace.id}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/tasks`] });
      setAddingCol(null); setNewTitle(""); setNewPriority("medium"); setNewLabels([]);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => apiRequest("PUT", `/api/workspaces/${workspace.id}/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/tasks`] }),
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const moveTask = (task: WorkspaceTask, newStatus: string) => updateMutation.mutate({ id: task.id, data: { status: newStatus } });

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  const applyFilters = (list: WorkspaceTask[]) => list.filter(t => {
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterAssignee === "unassigned" && t.assignedTo !== null) return false;
    if (filterAssignee !== "all" && filterAssignee !== "unassigned" && String(t.assignedTo) !== filterAssignee) return false;
    if (filterLabel !== "all" && !(t.labels ?? []).includes(filterLabel)) return false;
    return true;
  });

  const filteredTasks = applyFilters(tasks);

  const handleDragStart = (taskId: number) => setDragTaskId(taskId);
  const handleDragEnd = () => { setDragTaskId(null); setDragOverColKey(null); };
  const handleDragOver = (e: React.DragEvent, colKey: string) => { e.preventDefault(); setDragOverColKey(colKey); };
  const handleDrop = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (dragTaskId !== null) {
      const task = tasks.find(t => t.id === dragTaskId);
      if (task && task.status !== colKey) moveTask(task, colKey);
    }
    setDragTaskId(null); setDragOverColKey(null);
  };

  if (tasksLoading || colsLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-8 w-full mb-3 rounded-lg" />
            <div className="space-y-2">{[1, 2].map(j => <Skeleton key={j} className="h-24 rounded-xl" />)}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-0.5 border rounded-lg p-0.5 bg-muted/30">
          <Button variant={boardView === "board" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs" onClick={() => setBoardView("board")}>
            <Kanban size={12} className="mr-1.5" /> Board
          </Button>
          <Button variant={boardView === "list" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs" onClick={() => setBoardView("list")}>
            <List size={12} className="mr-1.5" /> List
          </Button>
          <Button variant={boardView === "calendar" ? "secondary" : "ghost"} size="sm" className="h-7 px-2.5 text-xs" onClick={() => setBoardView("calendar")}>
            <Calendar size={12} className="mr-1.5" /> Calendar
          </Button>
        </div>
        <div className="flex-1">
          <FilterBar members={members} filterPriority={filterPriority} setFilterPriority={setFilterPriority} filterAssignee={filterAssignee} setFilterAssignee={setFilterAssignee} filterLabel={filterLabel} setFilterLabel={setFilterLabel} hideCompleted={hideCompleted} setHideCompleted={setHideCompleted} />
        </div>
        {canManage(myRole) && (
          <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0" onClick={() => setShowManageCols(true)}>
            <SlidersHorizontal size={12} className="mr-1.5" /> Columns
          </Button>
        )}
      </div>

      {/* Board view */}
      {boardView === "board" && (
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
          {sortedColumns
            .filter(col => !(hideCompleted && col.key === "completed"))
            .map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.key);
              const isAdding = addingCol === col.key;
              const isDragOver = dragOverColKey === col.key;
              return (
                <div key={col.key} className="flex-shrink-0 w-72 flex flex-col"
                  onDragOver={e => handleDragOver(e, col.key)}
                  onDrop={e => handleDrop(e, col.key)}>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border border-b-0 border-border/50 transition-colors ${isDragOver ? "bg-blue-50 dark:bg-blue-900/20" : "bg-muted/30"}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: col.color }}>{col.name}</span>
                      <span className="text-xs text-muted-foreground bg-background/60 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>
                    {canEdit(myRole) && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => { setAddingCol(isAdding ? null : col.key); setNewTitle(""); setNewPriority("medium"); setNewLabels([]); }}>
                        {isAdding ? <X size={12} /> : <Plus size={12} />}
                      </Button>
                    )}
                  </div>
                  <div className={`flex-1 border border-border/50 rounded-b-xl p-2 space-y-2 min-h-[200px] transition-colors ${isDragOver ? "bg-blue-50/40 dark:bg-blue-900/10" : "bg-muted/20"}`}>
                    {isAdding && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-xl p-3 space-y-2 shadow-sm">
                        <Input autoFocus placeholder="Task title…" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-8 text-sm"
                          onKeyDown={e => { if (e.key === "Enter" && newTitle.trim()) createMutation.mutate({ title: newTitle, priority: newPriority, status: col.key, labels: newLabels }); if (e.key === "Escape") setAddingCol(null); }} />
                        <div className="flex gap-2">
                          <Select value={newPriority} onValueChange={setNewPriority}>
                            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="h-7 px-3 text-xs" disabled={!newTitle.trim() || createMutation.isPending}
                            onClick={() => createMutation.mutate({ title: newTitle, priority: newPriority, status: col.key, labels: newLabels })}>
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {PREDEFINED_LABELS.map(l => (
                            <button key={l.key} type="button"
                              onClick={() => setNewLabels(prev => prev.includes(l.key) ? prev.filter(x => x !== l.key) : [...prev, l.key])}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${newLabels.includes(l.key) ? "text-white border-transparent" : "border-border text-muted-foreground"}`}
                              style={newLabels.includes(l.key) ? { backgroundColor: l.color } : {}}>
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {colTasks.map(task => (
                      <motion.div key={task.id} layout draggable={canEdit(myRole)}
                        onDragStart={() => handleDragStart(task.id)} onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: dragTaskId === task.id ? 0.5 : 1, scale: 1 }}
                        className={`group bg-card border rounded-xl p-3 hover:shadow-md transition-all ${canEdit(myRole) ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                        onClick={() => setDetailTask(task)}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-sm font-medium leading-snug flex-1">{task.title}</span>
                          {canEdit(myRole) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" onClick={e => e.stopPropagation()}>
                                  <MoreHorizontal size={12} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); setDetailTask(task); }}>
                                  <Edit3 size={12} className="mr-2" /> Open / Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {sortedColumns.filter(c => c.key !== task.status).map(c => (
                                  <DropdownMenuItem key={c.key} onClick={e => { e.stopPropagation(); moveTask(task, c.key); }}>
                                    <ChevronDown size={12} className="mr-2" /> Move to {c.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>}
                        {(task.labels ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {(task.labels ?? []).map(lKey => {
                              const lDef = PREDEFINED_LABELS.find(l => l.key === lKey);
                              return lDef ? <span key={lKey} className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: lDef.color }}>{lDef.label}</span> : null;
                            })}
                          </div>
                        )}
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_CONFIG[task.priority]?.cls ?? PRIORITY_CONFIG.medium.cls}`}>
                            {PRIORITY_CONFIG[task.priority]?.label ?? task.priority}
                          </span>
                          {task.dueDate && (
                            <span className={`text-[10px] flex items-center gap-0.5 ${new Date(task.dueDate) < new Date() && task.status !== "completed" ? "text-red-500" : "text-muted-foreground"}`}>
                              <Calendar size={9} /> {task.dueDate}
                            </span>
                          )}
                          {task.assigneeName && <span className="text-[10px] text-muted-foreground ml-auto">{task.assigneeName}</span>}
                        </div>
                      </motion.div>
                    ))}
                    {colTasks.length === 0 && !isAdding && (
                      <div className={`text-center py-8 text-muted-foreground/50 rounded-lg border-2 border-dashed transition-colors ${isDragOver ? "border-blue-300 dark:border-blue-700" : "border-transparent"}`}>
                        <p className="text-xs">{isDragOver ? "Drop here" : "No tasks"}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {boardView === "list" && (
        <WorkspaceListView tasks={filteredTasks} columns={sortedColumns} hideCompleted={hideCompleted} onOpenTask={setDetailTask} />
      )}

      {boardView === "calendar" && (
        <WorkspaceCalendarView tasks={filteredTasks} onOpenTask={setDetailTask} />
      )}

      <TaskDetailDialog
        task={detailTask} workspaceId={workspace.id} workspace={workspace}
        myRole={myRole} members={members}
        open={!!detailTask} onOpenChange={v => !v && setDetailTask(null)}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspace.id}/tasks`] })}
        onDeleted={() => setDetailTask(null)}
      />

      {canManage(myRole) && (
        <ManageColumnsModal workspaceId={workspace.id} open={showManageCols} onOpenChange={setShowManageCols} />
      )}
    </>
  );
}

// ─── List View ────────────────────────────────────────────────────────────────

function WorkspaceListView({ tasks, columns, hideCompleted, onOpenTask }: {
  tasks: WorkspaceTask[];
  columns: WorkspaceColumn[];
  hideCompleted: boolean;
  onOpenTask: (task: WorkspaceTask) => void;
}) {
  const [sortBy, setSortBy] = useState<"title" | "priority" | "dueDate" | "status">("status");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => (d === 1 ? -1 : 1));
    else { setSortBy(col); setSortDir(1); }
  };

  const completedKey = columns.find(c => c.key === "completed")?.key ?? "completed";
  const display = hideCompleted ? tasks.filter(t => t.status !== completedKey) : tasks;

  const PRIO: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sorted = [...display].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "title") cmp = a.title.localeCompare(b.title);
    else if (sortBy === "priority") cmp = (PRIO[a.priority] ?? 1) - (PRIO[b.priority] ?? 1);
    else if (sortBy === "dueDate") { if (!a.dueDate && !b.dueDate) cmp = 0; else if (!a.dueDate) cmp = 1; else if (!b.dueDate) cmp = -1; else cmp = a.dueDate.localeCompare(b.dueDate); }
    else if (sortBy === "status") { const ap = columns.find(c => c.key === a.status)?.position ?? 99; const bp = columns.find(c => c.key === b.status)?.position ?? 99; cmp = ap - bp; }
    return cmp * sortDir;
  });

  const SH = ({ col }: { col: typeof sortBy }) => sortBy === col
    ? (sortDir === 1 ? <ChevronDown size={10} className="ml-0.5 text-blue-500" /> : <ChevronUp size={10} className="ml-0.5 text-blue-500" />)
    : <ChevronDown size={10} className="ml-0.5 opacity-30" />;

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <List size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">
              <button className="flex items-center" onClick={() => toggleSort("title")}>Title <SH col="title" /></button>
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
              <button className="flex items-center" onClick={() => toggleSort("status")}>Status <SH col="status" /></button>
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">
              <button className="flex items-center" onClick={() => toggleSort("priority")}>Priority <SH col="priority" /></button>
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs hidden sm:table-cell">Assignee</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs hidden md:table-cell">
              <button className="flex items-center" onClick={() => toggleSort("dueDate")}>Due <SH col="dueDate" /></button>
            </th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs hidden lg:table-cell">Labels</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task, idx) => {
            const colDef = columns.find(c => c.key === task.status);
            const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== completedKey;
            return (
              <tr key={task.id} className={`border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors ${idx % 2 !== 0 ? "bg-muted/5" : ""}`} onClick={() => onOpenTask(task)}>
                <td className="px-4 py-2.5">
                  <span className="font-medium line-clamp-1">{task.title}</span>
                  {task.description && <span className="text-xs text-muted-foreground block line-clamp-1 mt-0.5">{task.description}</span>}
                </td>
                <td className="px-3 py-2.5">
                  {colDef ? <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: colDef.color }}>{colDef.name}</span> : <span className="text-xs text-muted-foreground">{task.status}</span>}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_CONFIG[task.priority]?.cls ?? PRIORITY_CONFIG.medium.cls}`}>{PRIORITY_CONFIG[task.priority]?.label ?? task.priority}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{task.assigneeName ?? <span className="opacity-40">—</span>}</td>
                <td className={`px-3 py-2.5 text-xs hidden md:table-cell ${overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>{task.dueDate ?? <span className="opacity-40">—</span>}</td>
                <td className="px-3 py-2.5 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(task.labels ?? []).map(lKey => {
                      const lDef = PREDEFINED_LABELS.find(l => l.key === lKey);
                      return lDef ? <span key={lKey} className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: lDef.color }}>{lDef.label}</span> : null;
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function WorkspaceCalendarView({ tasks, onOpenTask }: { tasks: WorkspaceTask[]; onOpenTask: (task: WorkspaceTask) => void }) {
  const [currentDate, setCurrentDate] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = new Date().toISOString().split("T")[0];

  const byDate: Record<string, WorkspaceTask[]> = {};
  tasks.forEach(t => { if (t.dueDate) { if (!byDate[t.dueDate]) byDate[t.dueDate] = []; byDate[t.dueDate].push(t); } });

  const taskBg = (priority: string) => priority === "high" ? "#fee2e2" : priority === "medium" ? "#fef3c7" : "#f1f5f9";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="h-7" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft size={14} /></Button>
        <span className="font-medium text-sm">{monthName}</span>
        <Button variant="outline" size="sm" className="h-7" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight size={14} /></Button>
      </div>
      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border border rounded-xl overflow-hidden">
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - firstDow + 1;
          const inMonth = day >= 1 && day <= daysInMonth;
          const dateStr = inMonth ? `${year}-${pad(month + 1)}-${pad(day)}` : "";
          const dayTasks = dateStr ? (byDate[dateStr] ?? []) : [];
          const isToday = dateStr === today;
          return (
            <div key={i} className={`min-h-[76px] p-1.5 ${!inMonth ? "bg-muted/30" : isToday ? "bg-blue-50 dark:bg-blue-950/30" : "bg-background"}`}>
              {inMonth && (
                <>
                  <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full mb-1 ${isToday ? "bg-blue-500 text-white font-bold" : "text-muted-foreground"}`}>{day}</span>
                  {dayTasks.slice(0, 3).map(t => (
                    <button key={t.id} onClick={() => onOpenTask(t)} title={t.title}
                      className="w-full text-left text-[10px] px-1.5 py-0.5 rounded mb-0.5 truncate hover:opacity-80 transition-opacity text-gray-800"
                      style={{ backgroundColor: taskBg(t.priority) }}>
                      {t.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && <span className="text-[10px] text-muted-foreground pl-1">+{dayTasks.length - 3}</span>}
                </>
              )}
            </div>
          );
        })}
      </div>
      {tasks.filter(t => !t.dueDate).length > 0 && (
        <div className="border rounded-xl p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">No due date ({tasks.filter(t => !t.dueDate).length})</p>
          <div className="flex flex-wrap gap-2">
            {tasks.filter(t => !t.dueDate).map(t => (
              <button key={t.id} onClick={() => onOpenTask(t)}
                className="text-xs px-2 py-1 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors max-w-[200px] truncate">
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}
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

// ─── Pending Workspace Invitations ───────────────────────────────────────────

interface PendingInvite {
  id: number;
  workspaceId: number;
  workspaceName: string;
  workspaceColor: string;
  inviterName: string;
  role: string;
  expiresAt: string;
  token: string;
}

function PendingWorkspaceInvitations({ onAccepted }: { onAccepted: (workspaceId: number) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invites = [] } = useQuery<PendingInvite[]>({
    queryKey: ["/api/my-workspace-invitations"],
    refetchInterval: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (token: string) => apiRequest("POST", `/api/workspace-invitations/${token}/accept`),
    onSuccess: (data: { workspaceId: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-workspace-invitations"] });
      toast({ title: "Joined workspace!" });
      onAccepted(data.workspaceId);
    },
    onError: (e: Error) => toast({ title: "Failed to accept", description: e.message, variant: "destructive" }),
  });

  if (invites.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {invites.map(inv => (
        <motion.div
          key={inv.id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl border bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: inv.workspaceColor }}>
            <Folder size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              <span className="text-muted-foreground">{inv.inviterName} invited you to</span>{" "}
              {inv.workspaceName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <RoleBadge role={inv.role} />
              <span className="text-xs text-muted-foreground">· expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>
          <Button
            size="sm"
            className="flex-shrink-0 h-7 px-3 text-xs"
            disabled={acceptMutation.isPending}
            onClick={() => acceptMutation.mutate(inv.token)}
          >
            {acceptMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : "Accept"}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("board");
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
    setActiveTab("board");
  };

  const { data: selectedMembers = [] } = useQuery<WorkspaceMember[]>({
    queryKey: [`/api/workspaces/${selectedId}/members`],
    enabled: !!selectedId,
  });

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
              <span className="font-semibold text-sm">Spaces</span>
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
                <p className="text-xs text-muted-foreground mb-3">No spaces yet</p>
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setShowCreate(true)}>
                  <Plus size={12} className="mr-1" /> Create one
                </Button>
              </div>
            ) : (() => {
              const personal = workspaces.filter(w => w.type === "personal");
              const team = workspaces.filter(w => w.type !== "personal");
              const renderWs = (ws: Workspace) => (
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
              );
              return (
                <>
                  {personal.length > 0 && (
                    <div className="mb-1">
                      {!sidebarCollapsed && (
                        <p className="px-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                          <User size={9} /> My Space
                        </p>
                      )}
                      {personal.map(renderWs)}
                    </div>
                  )}
                  {team.length > 0 && (
                    <div>
                      {!sidebarCollapsed && (
                        <p className="px-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2 flex items-center gap-1">
                          <Building2 size={9} /> Team Spaces
                        </p>
                      )}
                      {team.map(renderWs)}
                    </div>
                  )}
                </>
              );
            })()}
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
          {/* Pending invitations — always visible at top */}
          <div className="px-6 pt-4">
            <PendingWorkspaceInvitations onAccepted={(wsId) => { setSelectedId(wsId); setActiveTab("board"); }} />
          </div>

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold truncate">{selected.name}</h1>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${selected.type === "personal" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"}`}>
                      {selected.type === "personal" ? <User size={10} /> : <Building2 size={10} />}
                      {selected.type === "personal" ? "My Space" : "Team Space"}
                    </span>
                  </div>
                  {selected.description && <p className="text-muted-foreground text-sm mt-0.5">{selected.description}</p>}
                </div>
                <RoleBadge role={myRole} />
              </motion.div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="board" className="flex items-center gap-1.5">
                    <Kanban size={13} /> Board
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-1.5">
                    <FileText size={13} /> Notes
                  </TabsTrigger>
                  {selected.type === "team" && (
                    <TabsTrigger value="members" className="flex items-center gap-1.5">
                      <Users size={13} /> Members
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="activity" className="flex items-center gap-1.5">
                    <Activity size={13} /> Activity
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-1.5">
                    <Settings size={13} /> Settings
                  </TabsTrigger>
                </TabsList>

                <motion.div key={`${selected.id}-${activeTab}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                  <TabsContent value="board">
                    <WorkspaceBoard workspace={selected} myRole={myRole} members={selectedMembers} />
                  </TabsContent>
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
