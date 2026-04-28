import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Folder, Users, CheckCircle, AlertCircle, Loader2, Crown, Shield, Edit3, Eye } from "lucide-react";

const ROLE_INFO: Record<string, { label: string; desc: string; icon: JSX.Element; cls: string }> = {
  viewer: { label: "Viewer",  desc: "View content and tasks — read only.",                             icon: <Eye size={13} />,    cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  editor: { label: "Editor",  desc: "Create and edit content and tasks.",                              icon: <Edit3 size={13} />,  cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  admin:  { label: "Admin",   desc: "Full access — manage members, settings, and content.",            icon: <Shield size={13} />, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  owner:  { label: "Owner",   desc: "Full ownership of this workspace.",                               icon: <Crown size={13} />,  cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

export default function JoinWorkspace() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const t = parts[parts.length - 1];
    if (t) setToken(t);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated && token) {
      sessionStorage.setItem("pendingInviteUrl", window.location.href);
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, token, setLocation]);

  // Fetch invite preview (public endpoint — no auth required)
  const { data: info, isLoading: infoLoading, error: infoError } = useQuery<{
    workspaceName: string;
    workspaceColor: string;
    workspaceIcon: string;
    role: string;
  }>({
    queryKey: [`/api/workspace-join/${token}`],
    enabled: !!token,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/workspace-join/${token}`),
    onSuccess: () => {
      setJoined(true);
      toast({ title: "Joined workspace!", description: `Welcome to ${info?.workspaceName ?? "the workspace"}!` });
      setTimeout(() => setLocation("/workspace"), 1500);
    },
    onError: (e: Error) => {
      toast({ title: "Could not join", description: e.message, variant: "destructive" });
    },
  });

  if (authLoading || !token) {
    return <LoadingCard />;
  }

  if (joined) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm text-center shadow-xl">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">You're in!</h2>
              <p className="text-muted-foreground text-sm mt-1">Redirecting to Spaces…</p>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (infoLoading) return <LoadingCard />;

  if (infoError || !info) {
    return (
      <PageShell>
        <Card className="w-full max-w-sm shadow-xl">
          <CardContent className="p-8 space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Invalid Link</h2>
              <p className="text-muted-foreground text-sm mt-1">
                {(infoError as Error)?.message ?? "This invite link is no longer valid."}
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/workspace")}>
              Go to Spaces
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const roleInfo = ROLE_INFO[info.role] ?? ROLE_INFO.viewer;

  return (
    <PageShell>
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center pb-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
            style={{ backgroundColor: info.workspaceColor }}
          >
            <Users size={32} className="text-white" />
          </div>
          <CardTitle className="text-xl">You've been invited</CardTitle>
          <CardDescription>to join a workspace on Flowsstate</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Workspace info */}
          <div className="bg-muted/40 rounded-xl p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
              style={{ backgroundColor: info.workspaceColor }}
            >
              <Folder size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm">{info.workspaceName}</p>
              <p className="text-xs text-muted-foreground">Team Workspace</p>
            </div>
          </div>

          {/* Role being granted */}
          <div className={`rounded-xl border p-3 space-y-1 ${roleInfo.cls}`}>
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              {roleInfo.icon}
              You'll join as: {roleInfo.label}
            </div>
            <p className="text-xs opacity-80">{roleInfo.desc}</p>
          </div>

          <Button
            className="w-full font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${info.workspaceColor}, ${info.workspaceColor}cc)` }}
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? (
              <><Loader2 size={15} className="mr-2 animate-spin" /> Joining…</>
            ) : (
              `Join ${info.workspaceName}`
            )}
          </Button>

          {joinMutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{(joinMutation.error as Error).message}</span>
            </div>
          )}

          <Button variant="ghost" className="w-full text-sm text-muted-foreground" onClick={() => setLocation("/")}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 p-4">
      {children}
    </div>
  );
}

function LoadingCard() {
  return (
    <PageShell>
      <Card className="w-full max-w-sm shadow-xl">
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </PageShell>
  );
}
