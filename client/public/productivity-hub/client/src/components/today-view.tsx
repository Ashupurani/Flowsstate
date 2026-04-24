import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useCalendarStore } from '@/lib/store';
import { useFlowScore } from '@/hooks/use-flow-score';
import { useToast } from "@/hooks/use-toast";
import PomodoroTimer from "@/components/pomodoro-timer";
import FocusBlockPanel from "@/components/focus-block-panel";
import { CheckCircle2, Target, Flame, Clock, TrendingUp, Shield, Download, Archive } from 'lucide-react';
import type { Task, Habit, HabitEntry } from '@shared/schema';

export default function TodayView() {
  const queryClient = useQueryClient();
  const selectedDate = useCalendarStore(state => state.selectedDate);
  const flowScore = useFlowScore();
  const { toast } = useToast();
  
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ['/api/tasks'] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ['/api/habits'] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ['/api/habit-entries'] });

  const today = useMemo(() => {
    const date = selectedDate || new Date();
    return {
      dateStr: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      displayDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }, [selectedDate]);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.dayOfWeek === today.dayOfWeek);
  }, [tasks, today.dayOfWeek]);

  const topThreePriorities = useMemo(() => {
    const rank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return todayTasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => rank[a.priority] - rank[b.priority])
      .slice(0, 3);
  }, [todayTasks]);

  const todayHabits = useMemo(() => {
    return habits.map(habit => {
      const entry = habitEntries.find(e => 
        e.habitId === habit.id && e.date === today.dateStr
      );
      return { ...habit, completed: entry?.completed || false, entryId: entry?.id };
    });
  }, [habits, habitEntries, today.dateStr]);

  const completedTasksCount = todayTasks.filter(t => t.status === 'completed').length;
  const completedHabitsCount = todayHabits.filter(h => h.completed).length;
  const completedPriorityTask = todayTasks.some((task) => task.priority === "high" && task.status === "completed");
  const dailyPlanReady = topThreePriorities.length >= 3;
  const northStarMet = dailyPlanReady && completedPriorityTask;

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: number }) => {
      return apiRequest('/api/habit-entries/toggle', {
        method: 'POST',
        body: JSON.stringify({
          habitId,
          date: today.dateStr,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habit-entries'] });
    },
  });

  const priorityColors: Record<string, string> = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  };

  const handleCreateBackup = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/backup/create", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("backup failed");
      const result = await response.json();
      const recordsText =
        result && typeof result.totalRecords === "number"
          ? `${result.totalRecords} records protected.`
          : "Backup snapshot created successfully.";
      toast({
        title: "Backup snapshot created",
        description: recordsText,
      });
    } catch {
      toast({
        title: "Backup failed",
        description: "Could not create backup snapshot.",
        variant: "destructive",
      });
    }
  };

  const handleExportZip = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/export/zip", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("zip failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `productivity_backup_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Backup ZIP downloaded" });
    } catch {
      toast({
        title: "ZIP export failed",
        description: "Could not export ZIP backup.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{today.displayDate}</h2>
          <p className="text-muted-foreground">Plan your day fast, stay focused, finish what matters.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{flowScore.score}</div>
            <div className="text-xs text-muted-foreground">FlowScore</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedTasksCount}/{todayTasks.length}</div>
                <div className="text-xs text-muted-foreground">Tasks Done</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedHabitsCount}/{todayHabits.length}</div>
                <div className="text-xs text-muted-foreground">Habits Done</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{flowScore.streakMultiplier.toFixed(1)}x</div>
                <div className="text-xs text-muted-foreground">Streak Bonus</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{flowScore.focusMinutes}m</div>
                <div className="text-xs text-muted-foreground">Focus Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                Plan (Top 3 Priorities)
              </span>
              <Badge variant={dailyPlanReady ? "default" : "outline"}>{topThreePriorities.length}/3</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {topThreePriorities.length > 0 ? (
              topThreePriorities.map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    task.status === 'completed' ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={(checked) => {
                      updateTaskMutation.mutate({
                        id: task.id,
                        status: checked ? 'completed' : 'proposed',
                      });
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{task.category}</Badge>
                      <span className={`text-xs ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No priority tasks yet. Add your top 3 to start.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Do (Focus + Habits)
              </span>
              <Badge variant="outline">{completedHabitsCount}/{todayHabits.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
            <div className="overflow-x-auto pb-1">
              <PomodoroTimer />
            </div>
            {todayHabits.length > 0 ? (
              todayHabits.map(habit => (
                <div 
                  key={habit.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    habit.completed ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={habit.completed}
                    onCheckedChange={() => {
                      toggleHabitMutation.mutate({
                        habitId: habit.id,
                      });
                    }}
                  />
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: habit.color + '20' }}
                  >
                    <i className={habit.icon} style={{ color: habit.color }} />
                  </div>
                  <span className={`font-medium ${habit.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {habit.name}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No habits tracked</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Review
              </span>
              <Badge variant={northStarMet ? "default" : "secondary"}>
                {northStarMet ? "North Star Met" : "In Progress"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tasks ({Math.round(flowScore.tasksScore)}%)</span>
                <span>{completedTasksCount}/{todayTasks.length}</span>
              </div>
              <Progress value={flowScore.tasksScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Habits ({Math.round(flowScore.habitsScore)}%)</span>
                <span>{completedHabitsCount}/{todayHabits.length}</span>
              </div>
              <Progress value={flowScore.habitsScore} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Focus ({Math.round(flowScore.focusScore)}%)</span>
                <span>{flowScore.focusMinutes}/{flowScore.focusGoalMinutes}m</span>
              </div>
              <Progress value={flowScore.focusScore} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground">
              North star = top-3 plan ready + at least one high-priority task completed.
            </p>
          </CardContent>
        </Card>
      </div>

      <FocusBlockPanel />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Data Safety (Quick Actions)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleCreateBackup}>
            <Shield className="mr-2 h-4 w-4" />
            Create Backup Snapshot
          </Button>
          <Button variant="outline" onClick={handleExportZip}>
            <Archive className="mr-2 h-4 w-4" />
            Download ZIP Backup
          </Button>
          <Button asChild variant="ghost" className="md:col-span-2">
            <a href="/admin">
              <Download className="mr-2 h-4 w-4" />
              Open Full Data Export Center
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
