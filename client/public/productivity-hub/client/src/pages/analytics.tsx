import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, Flame, Clock, TrendingUp, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import Header from "@/components/header";
import StreakCalendar from "@/components/streak-calendar";
import { trackEvent } from "@/lib/telemetry";
import type { Task, Habit, HabitEntry, PomodoroSession } from "@shared/schema";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ProductivityAnalytics {
  tasksTotal: number;
  tasksCompleted: number;
  completionRate: number;
  highPriorityCompletionRate: number;
  habitsTotal: number;
  habitEntriesTotal: number;
  habitsCompleted: number;
  habitCompletionRate: number;
  focusSessionsTotal: number;
  focusMinutesTotal: number;
  focusMinutesLast7Days: number;
  northStarMetToday: boolean;
  taskSpecificityScoreAvg: number;
  generatedAt: string;
}

export default function Analytics() {
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });
  const { data: pomodoroSessions = [] } = useQuery<PomodoroSession[]>({ queryKey: ["/api/pomodoro-sessions"] });
  const { data: productivityAnalytics } = useQuery<ProductivityAnalytics>({
    queryKey: ["/api/analytics/productivity"],
  });

  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tasksByCategory = tasks.reduce((acc, task) => {
    if (task.category) {
      acc[task.category] = (acc[task.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const completionRate = tasks.length > 0 ? (tasksByStatus.completed || 0) / tasks.length * 100 : 0;
  const focusSessions = pomodoroSessions.filter(s => s.type === 'focus' || s.type === 'focus_block').length;
  const totalFocusMinutes = Math.round(pomodoroSessions.filter(s => s.type === 'focus' || s.type === 'focus_block').reduce((acc, s) => acc + s.duration, 0) / 60);
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayTasks = tasks.filter((task) => task.dayOfWeek === todayName);
  const top3Planned = todayTasks.filter((task) => task.status !== "completed").length >= 3;
  const onePriorityDone = todayTasks.some((task) => task.priority === "high" && task.status === "completed");
  const northStarMet = top3Planned && onePriorityDone;

  const getHabitStreak = (habitId: number) => {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split("T")[0];
      const hasEntry = habitEntries.some(
        (entry) => entry.habitId === habitId && entry.date === dateString && entry.completed,
      );
      if (hasEntry) streak++;
      else if (i === 0) continue;
      else break;
    }
    return streak;
  };

  const habitsWithStreak = habits.filter((habit) => getHabitStreak(habit.id) >= 2).length;
  const habitStreakContinuationRate = habits.length > 0 ? (habitsWithStreak / habits.length) * 100 : 0;
  const serverCompletionRate = productivityAnalytics?.completionRate ?? completionRate;
  const serverHabitCompletionRate = productivityAnalytics?.habitCompletionRate ?? habitStreakContinuationRate;
  const serverFocusMinutes = productivityAnalytics?.focusMinutesTotal ?? totalFocusMinutes;
  const serverNorthStarMet = productivityAnalytics?.northStarMetToday ?? northStarMet;
  const serverTaskSpecificity = productivityAnalytics?.taskSpecificityScoreAvg ?? 0;

  const apiErrorCount = Number(sessionStorage.getItem("sessionApiErrors") || "0");
  const crashCount = Number(sessionStorage.getItem("sessionCrashCount") || "0");
  const crashFree = crashCount === 0;
  const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const pageLoadMs = navEntry ? Math.round(navEntry.loadEventEnd - navEntry.startTime) : 0;

  const statusData = Object.entries(tasksByStatus).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count
  }));

  const categoryData = Object.entries(tasksByCategory).map(([category, count]) => ({
    name: category,
    value: count
  }));

  useEffect(() => {
    trackEvent("analytics_page_viewed", {
      source: "analytics_page",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Success Metrics Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={serverNorthStarMet ? "border-green-300 dark:border-green-700" : "border-yellow-300 dark:border-yellow-700"}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${serverNorthStarMet ? "bg-green-500" : "bg-yellow-500"}`}>
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">North Star</p>
                  <p className="text-xs text-muted-foreground">Top-3 plan + 1 high-priority done</p>
                  <p className="text-lg font-semibold">{serverNorthStarMet ? "Met today" : "Not met yet"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Core Metrics</p>
                  <p className="text-xs text-muted-foreground">Task completion / habit completion / specificity</p>
                  <p className="text-lg font-semibold">{serverCompletionRate.toFixed(0)}% / {serverHabitCompletionRate.toFixed(0)}% / {serverTaskSpecificity.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${crashFree && apiErrorCount === 0 ? "bg-green-500" : "bg-red-500"}`}>
                  {crashFree && apiErrorCount === 0 ? <ShieldCheck className="h-5 w-5 text-white" /> : <AlertTriangle className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Quality</p>
                  <p className="text-xs text-muted-foreground">Crash-free / API errors / page load</p>
                  <p className="text-lg font-semibold">{crashFree ? "Yes" : "No"} • {apiErrorCount} • {pageLoadMs}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{tasks.length}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{completionRate.toFixed(0)}%</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{habits.length}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Habits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{serverFocusMinutes}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Focus Mins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Task Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No tasks yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  No categories yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Streak Calendar */}
        <StreakCalendar />

        {/* Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tasks Completed</span>
                <span className="font-medium">{tasksByStatus.completed || 0}/{tasks.length}</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Focus Sessions</span>
                <span className="font-medium">{focusSessions} sessions</span>
              </div>
              <Progress value={Math.min(focusSessions * 10, 100)} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Habits Tracked</span>
                <span className="font-medium">{habitEntries.filter(e => e.completed).length} completed</span>
              </div>
              <Progress value={Math.min(habitEntries.filter(e => e.completed).length * 5, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
