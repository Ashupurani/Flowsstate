import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Task, HabitEntry, PomodoroSession } from "@shared/schema";

const MICRO_WIN_MESSAGES = {
  firstTask: ["First task done! 🎯 Keep the momentum going!", "Task #1 complete! You're on a roll! 💪"],
  thirdTask: ["3 tasks crushed! 🔥 You're in the zone!", "Hat trick! Three tasks down! ⚡"],
  fifthTask: ["5 tasks complete! 🚀 Unstoppable!", "Halfway to ten! Amazing progress! 🌟"],
  habitComplete: ["Habit done! Building consistency! 💫", "Another brick in the wall! Keep it up! 🧱"],
  allHabits: ["All habits complete! Perfect day! 🏆", "100% habits! You're crushing it! 👑"],
  focusHour: ["1 hour of deep focus! 🎯 Great work!", "60 minutes of flow! 💡"],
  focusTwoHours: ["2 hours focused! 🔥 Productivity beast!", "120 minutes of deep work! 🚀"],
  streakMilestone: ["Streak growing! 📈 Keep showing up!", "Consistency pays off! 💪"],
};

export function useMicroWins() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const prevTasksCompleted = useRef(0);
  const prevHabitsCompleted = useRef(0);
  const prevFocusMinutes = useRef(0);
  const shownToasts = useRef<Set<string>>(new Set());
  const lastToastTime = useRef(0);

  const { data: tasks = [] } = useQuery<Task[]>({ 
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
  });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ 
    queryKey: ["/api/habit-entries"],
    enabled: isAuthenticated,
  });
  const { data: habits = [] } = useQuery<any[]>({ 
    queryKey: ["/api/habits"],
    enabled: isAuthenticated,
  });
  const { data: pomodoroSessions = [] } = useQuery<PomodoroSession[]>({ 
    queryKey: ["/api/pomodoro-sessions"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    // Only run when authenticated
    if (!isAuthenticated) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Reset shown toasts at midnight
    const storedDate = localStorage.getItem('microWinsDate');
    if (storedDate !== today) {
      shownToasts.current.clear();
      localStorage.setItem('microWinsDate', today);
    } else {
      // Load previously shown toasts
      const stored = localStorage.getItem('shownMicroWins');
      if (stored) {
        shownToasts.current = new Set(JSON.parse(stored));
      }
    }

    const showToast = (key: string, messages: string[]) => {
      if (shownToasts.current.has(key)) return;
      
      // Debounce: Only show one toast per 5 seconds to prevent spam
      const now = Date.now();
      if (now - lastToastTime.current < 5000) return;
      
      shownToasts.current.add(key);
      lastToastTime.current = now;
      localStorage.setItem('shownMicroWins', JSON.stringify(Array.from(shownToasts.current)));
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      toast({
        title: "🎉 Micro Win!",
        description: message,
        duration: 3000,
      });
    };

    // Count completed tasks
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    
    // Count today's completed habits
    const todayHabits = habitEntries.filter(e => e.date === today && e.completed);
    const habitsCompleted = new Set(todayHabits.map(e => e.habitId)).size;
    const totalHabits = habits.length;
    
    // Count today's focus time
    const todaySessions = pomodoroSessions.filter(s => {
      const sessionDate = s.completedAt ? new Date(s.completedAt).toISOString().split('T')[0] : null;
      return sessionDate === today && s.type === 'focus';
    });
    const focusMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Check for task milestones
    if (tasksCompleted >= 1 && prevTasksCompleted.current < 1) {
      showToast('firstTask', MICRO_WIN_MESSAGES.firstTask);
    }
    if (tasksCompleted >= 3 && prevTasksCompleted.current < 3) {
      showToast('thirdTask', MICRO_WIN_MESSAGES.thirdTask);
    }
    if (tasksCompleted >= 5 && prevTasksCompleted.current < 5) {
      showToast('fifthTask', MICRO_WIN_MESSAGES.fifthTask);
    }

    // Check for habit completions
    if (habitsCompleted > prevHabitsCompleted.current && habitsCompleted > 0) {
      if (habitsCompleted === totalHabits && totalHabits > 0) {
        showToast('allHabits', MICRO_WIN_MESSAGES.allHabits);
      } else if (habitsCompleted > prevHabitsCompleted.current) {
        showToast(`habit-${habitsCompleted}`, MICRO_WIN_MESSAGES.habitComplete);
      }
    }

    // Check for focus time milestones
    if (focusMinutes >= 60 && prevFocusMinutes.current < 60) {
      showToast('focusHour', MICRO_WIN_MESSAGES.focusHour);
    }
    if (focusMinutes >= 120 && prevFocusMinutes.current < 120) {
      showToast('focusTwoHours', MICRO_WIN_MESSAGES.focusTwoHours);
    }

    // Update refs for next comparison
    prevTasksCompleted.current = tasksCompleted;
    prevHabitsCompleted.current = habitsCompleted;
    prevFocusMinutes.current = focusMinutes;

  }, [tasks, habitEntries, habits, pomodoroSessions, toast, isAuthenticated]);
}
