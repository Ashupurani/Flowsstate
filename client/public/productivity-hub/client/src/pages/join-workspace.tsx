import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Folder, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/workspace-join/${token}`),
    onSuccess: (data: { workspaceId: number }) => {
      setJoined(true);
      toast({ title: "Joined workspace!", description: "You now have access." });
      setTimeout(() => setLocation("/workspace"), 1500);
    },
    onError: (e: Error) => {
      toast({ title: "Could not join", description: e.message, variant: "destructive" });
    },
  });

  if (authLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">You're in!</h2>
              <p className="text-muted-foreground text-sm mt-1">Redirecting to your workspace…</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-xl">Join Workspace</CardTitle>
          <CardDescription>
            You've been invited to collaborate on a Flowsstate workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/40 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
              <Folder size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Team Workspace</p>
              <p className="text-xs text-muted-foreground">Invite link</p>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold"
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                Joining…
              </>
            ) : (
              "Accept & Join Workspace"
            )}
          </Button>

          {joinMutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{(joinMutation.error as Error).message}</span>
            </div>
          )}

          <Button variant="ghost" className="w-full text-sm" onClick={() => setLocation("/")}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
