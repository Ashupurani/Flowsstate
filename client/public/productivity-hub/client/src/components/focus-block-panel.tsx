import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent } from "@/lib/telemetry";
import { useToast } from "@/hooks/use-toast";
import { Pause, Play, CheckCircle2, AlertCircle, Timer } from "lucide-react";

type ActiveFocusBlock = {
  id: number;
  plannedDurationMin: number;
  status: "active" | "paused";
  startedAt: string;
  pausedAt: string | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  interruptions: Array<{ id: number }>;
};

type FocusBlockHistory = {
  id: number;
  durationSeconds: number;
  completedAt: string;
};

const PRESETS = [25, 50, 90];

function formatSeconds(total: number): string {
  const safe = Math.max(0, total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function FocusBlockPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeBlock } = useQuery<ActiveFocusBlock | null>({
    queryKey: ["/api/focus-blocks/active"],
    refetchInterval: 1000,
  });

  const { data: history = [] } = useQuery<FocusBlockHistory[]>({
    queryKey: ["/api/focus-blocks"],
  });

  const startMutation = useMutation({
    mutationFn: async (plannedDurationMin: number) =>
      apiRequest("/api/focus-blocks/start", {
        method: "POST",
        body: JSON.stringify({ plannedDurationMin }),
      }),
    onSuccess: async (data) => {
      await trackEvent("focus_block_started", { plannedDurationMin: data?.plannedDurationMin });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-blocks/active"] });
      toast({ title: "Focus block started" });
    },
    onError: () => {
      toast({ title: "Could not start focus block", variant: "destructive" });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/focus-blocks/${id}/pause`, { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/focus-blocks/active"] }),
  });

  const resumeMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/focus-blocks/${id}/resume`, { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/focus-blocks/active"] }),
  });

  const interruptionMutation = useMutation({
    mutationFn: async (id: number) =>
      apiRequest(`/api/focus-blocks/${id}/interruptions`, {
        method: "POST",
        body: JSON.stringify({ interruptionType: "manual" }),
      }),
    onSuccess: async () => {
      await trackEvent("focus_block_interrupted", { source: "manual" });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-blocks/active"] });
      toast({ title: "Interruption logged" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/focus-blocks/${id}/complete`, { method: "PUT" }),
    onSuccess: async () => {
      await trackEvent("focus_block_completed", { source: "focus_block_panel" });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-blocks/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/focus-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pomodoro-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/productivity"] });
      toast({ title: "Focus block completed" });
    },
    onError: () => {
      toast({ title: "Could not complete focus block", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (activeBlock && activeBlock.remainingSeconds === 0) {
      completeMutation.mutate(activeBlock.id);
    }
  }, [activeBlock, completeMutation]);

  const weekStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const recent = history.filter((item) => new Date(item.completedAt) >= weekAgo);
    const totalMinutes = Math.round(recent.reduce((sum, item) => sum + item.durationSeconds, 0) / 60);

    return {
      blockCount: recent.length,
      totalMinutes,
    };
  }, [history]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-blue-600" />
            Focus Blocks
          </span>
          <Badge variant="outline">{weekStats.totalMinutes}m / 7d</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!activeBlock ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Start a protected focus block.</p>
            <div className="flex gap-2">
              {PRESETS.map((minutes) => (
                <Button
                  key={minutes}
                  size="sm"
                  variant="outline"
                  onClick={() => startMutation.mutate(minutes)}
                  disabled={startMutation.isPending}
                  data-testid={`button-focus-start-${minutes}`}
                >
                  {minutes}m
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Block</p>
                  <p className="text-xs text-muted-foreground">
                    Planned {activeBlock.plannedDurationMin}m
                  </p>
                </div>
                <div className="text-2xl font-mono font-bold">
                  {formatSeconds(activeBlock.remainingSeconds)}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Status: {activeBlock.status}</span>
                <span>•</span>
                <span>{activeBlock.interruptions.length} interruption(s)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeBlock.status === "active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pauseMutation.mutate(activeBlock.id)}
                  data-testid="button-focus-pause"
                >
                  <Pause className="mr-1 h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resumeMutation.mutate(activeBlock.id)}
                  data-testid="button-focus-resume"
                >
                  <Play className="mr-1 h-4 w-4" />
                  Resume
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => interruptionMutation.mutate(activeBlock.id)}
                data-testid="button-focus-interruption"
              >
                <AlertCircle className="mr-1 h-4 w-4" />
                Log interruption
              </Button>

              <Button
                size="sm"
                onClick={() => completeMutation.mutate(activeBlock.id)}
                data-testid="button-focus-complete"
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Complete
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Last 7 days: {weekStats.blockCount} block(s) completed.
        </div>
      </CardContent>
    </Card>
  );
}
