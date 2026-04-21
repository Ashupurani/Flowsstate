import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Task, Habit, HabitEntry, PomodoroSession } from "@shared/schema";

interface FlowScoreData {
  score: number;
  tasksScore: number;
  habitsScore: number;
  focusScore: number;
  tasksCompleted: number;
  totalTasks: number;
  habitsCompleted: number;
  totalHabits: number;
  focusMinutes: number;
  focusGoalMinutes: number;
  streakMultiplier: number;
  weeklyTrend: number[];
  level: 'starting' | 'warming' | 'flowing' | 'blazing' | 'unstoppable';
}

const FOCUS_GOAL_MINUTES = 120; // 2 hours daily focus goal

export function useFlowScore(): FlowScoreData {
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });
  const { data: pomodoroSessions = [] } = useQuery<PomodoroSession[]>({ queryKey: ["/api/pomodoro-sessions"] });

  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Helper to get current week's Monday
    const getWeekStart = (): string => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now);
      monday.setDate(diff);
      return monday.toISOString().split('T')[0];
    };
    const weekStart = getWeekStart();
    
    // Calculate tasks score (40% weight) - only count THIS WEEK's tasks
    const thisWeekTasks = tasks.filter(task => {
      return task.weekKey === weekStart || !task.weekKey; // Current week or unassigned
    });
    const completedThisWeek = thisWeekTasks.filter(t => t.status === 'completed');
    const incompleteThisWeek = thisWeekTasks.filter(t => t.status !== 'completed');
    
    // Weight by priority: high=3, medium=2, low=1
    const getPriorityWeight = (priority: string | null): number => {
      if (priority === 'high') return 3;
      if (priority === 'medium') return 2;
      return 1;
    };
    
    const completedWeight = completedThisWeek.reduce((sum, t) => sum + getPriorityWeight(t.priority), 0);
    const totalWeight = thisWeekTasks.reduce((sum, t) => sum + getPriorityWeight(t.priority), 0);
    const tasksScore = totalWeight > 0 ? Math.min((completedWeight / totalWeight) * 100, 100) : 0;
    // Note: Tasks don't have completedAt field, so we track weekly progress instead of daily
    const tasksCompletedThisWeek = completedThisWeek.length;
    const totalTasks = thisWeekTasks.length;
    
    // Calculate habits score (30% weight)
    const uniqueHabits = habits.filter((habit, index, self) => 
      index === self.findIndex((h) => h.id === habit.id)
    );
    const todayEntries = habitEntries.filter(e => e.date === today && e.completed);
    const habitsCompleted = new Set(todayEntries.map(e => e.habitId)).size;
    const totalHabits = uniqueHabits.length;
    const habitsScore = totalHabits > 0 ? (habitsCompleted / totalHabits) * 100 : 0;
    
    // Calculate focus score (30% weight)
    const todaySessions = pomodoroSessions.filter(s => {
      const sessionDate = s.completedAt ? new Date(s.completedAt).toISOString().split('T')[0] : null;
      return sessionDate === today && s.type === 'focus';
    });
    const focusMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const focusScore = Math.min((focusMinutes / FOCUS_GOAL_MINUTES) * 100, 100);
    
    // Calculate streak multiplier (1.0 - 2.0x based on consecutive productive days)
    const getStreakDays = (): number => {
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        // Check if any habits were completed on this specific date
        const dayHabitsCompleted = habitEntries.filter(e => e.date === dateStr && e.completed).length;
        
        if (dayHabitsCompleted > 0) {
          streak++;
        } else if (i > 0) {
          // Skip today (i=0) since it might not be complete yet
          break;
        }
      }
      return streak;
    };
    
    const streakDays = getStreakDays();
    const streakMultiplier = Math.min(1 + (streakDays * 0.1), 2.0); // Max 2x at 10+ days
    
    // Calculate weighted score
    const baseScore = (tasksScore * 0.4) + (habitsScore * 0.3) + (focusScore * 0.3);
    const finalScore = Math.round(Math.min(baseScore * streakMultiplier, 100));
    
    // Determine level
    const getLevel = (score: number): FlowScoreData['level'] => {
      if (score >= 90) return 'unstoppable';
      if (score >= 70) return 'blazing';
      if (score >= 50) return 'flowing';
      if (score >= 25) return 'warming';
      return 'starting';
    };
    
    // Calculate weekly trend (last 7 days scores)
    const weeklyTrend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayHabits = habitEntries.filter(e => e.date === dateStr && e.completed).length;
      const dayHabitScore = totalHabits > 0 ? (dayHabits / totalHabits) * 100 : 0;
      
      const daySessions = pomodoroSessions.filter(s => {
        const sDate = s.completedAt ? new Date(s.completedAt).toISOString().split('T')[0] : null;
        return sDate === dateStr && s.type === 'focus';
      });
      const dayFocusMinutes = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const dayFocusScore = Math.min((dayFocusMinutes / FOCUS_GOAL_MINUTES) * 100, 100);
      
      // Simplified daily score
      const dayScore = Math.round((dayHabitScore * 0.5) + (dayFocusScore * 0.5));
      weeklyTrend.push(dayScore);
    }
    
    return {
      score: finalScore,
      tasksScore: Math.round(tasksScore),
      habitsScore: Math.round(habitsScore),
      focusScore: Math.round(focusScore),
      tasksCompleted: tasksCompletedThisWeek,
      totalTasks,
      habitsCompleted,
      totalHabits,
      focusMinutes,
      focusGoalMinutes: FOCUS_GOAL_MINUTES,
      streakMultiplier,
      weeklyTrend,
      level: getLevel(finalScore),
    };
  }, [tasks, habits, habitEntries, pomodoroSessions]);
}

// Helper to get motivational message based on score
export function getFlowMessage(level: FlowScoreData['level']): string {
  switch (level) {
    case 'unstoppable': return "You're unstoppable! 🚀";
    case 'blazing': return "Blazing through it! 🔥";
    case 'flowing': return "In the flow! 💫";
    case 'warming': return "Warming up! ☀️";
    case 'starting': return "Let's get started! 💪";
  }
}

// Helper to get level color
export function getFlowColor(level: FlowScoreData['level']): string {
  switch (level) {
    case 'unstoppable': return 'from-purple-500 to-pink-500';
    case 'blazing': return 'from-orange-500 to-red-500';
    case 'flowing': return 'from-blue-500 to-cyan-500';
    case 'warming': return 'from-yellow-500 to-orange-400';
    case 'starting': return 'from-gray-400 to-gray-500';
  }
}
