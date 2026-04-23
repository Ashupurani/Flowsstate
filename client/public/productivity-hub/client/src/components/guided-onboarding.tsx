import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCalendarStore } from "@/lib/store";
import { Rocket, CheckCircle2 } from "lucide-react";

const ONBOARDING_KEY = "flowsstate_onboarding_v1_done";

export default function GuidedOnboarding() {
  const [open, setOpen] = useState(false);
  const [topTask, setTopTask] = useState("");
  const [habitName, setHabitName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const getWeekKey = useCalendarStore((state) => state.getWeekKey);

  const dayOfWeek = useMemo(() => {
    const date = selectedDate || new Date();
    return date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  }, [selectedDate]);

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) return;
    const alreadyDone = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (!alreadyDone) {
      setOpen(true);
      setTopTask("Finish my most important task");
      setHabitName("Plan tomorrow before sleep");
    }
  }, []);

  const setupMutation = useMutation({
    mutationFn: async () => {
      const requests: Promise<any>[] = [];

      if (topTask.trim()) {
        requests.push(
          apiRequest("/api/tasks", {
            method: "POST",
            body: JSON.stringify({
              title: topTask.trim(),
              category: "general",
              priority: "high",
              status: "proposed",
              dayOfWeek,
              weekKey: getWeekKey(),
              notes: "Auto-created via quick start",
            }),
          }),
        );
      }

      if (habitName.trim()) {
        requests.push(
          apiRequest("/api/habits", {
            method: "POST",
            body: JSON.stringify({
              name: habitName.trim(),
              icon: "fas fa-check",
              color: "#3b82f6",
              category: "daily",
            }),
          }),
        );
      }

      if (requests.length > 0) {
        await Promise.all(requests);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/habits"] }),
      ]);
      localStorage.setItem(ONBOARDING_KEY, "true");
      setOpen(false);
      toast({
        title: "You're ready to roll 🚀",
        description: "Your first setup is complete. Plan → Do → Review starts now.",
      });
    },
    onError: () => {
      toast({
        title: "Setup failed",
        description: "Could not create starter task/habit. You can still continue manually.",
        variant: "destructive",
      });
    },
  });

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            2-Minute Quick Start
          </DialogTitle>
          <DialogDescription>
            Set one top task + one habit now. Keep it simple and start moving.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Today's top priority</label>
              <Input value={topTask} onChange={(e) => setTopTask(e.target.value)} placeholder="What must get done today?" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">A daily habit to build</label>
              <Input value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="Example: 10 min planning" />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Promise: plan fast, stay focused, finish what matters.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={setupMutation.isPending}>
            Skip
          </Button>
          <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
            {setupMutation.isPending ? "Setting up..." : "Start My Day"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
