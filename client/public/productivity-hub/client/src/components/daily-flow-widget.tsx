import { useState, useEffect } from "react";
import { X, Sun, Moon, Zap, Target, Flame, CheckCircle, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFlowScore, getFlowMessage, getFlowColor } from "@/hooks/use-flow-score";
import { useQuery } from "@tanstack/react-query";
import type { Task, Habit, HabitEntry } from "@shared/schema";

type WidgetMode = 'morning' | 'evening' | 'hidden';

interface DailyFlowWidgetProps {
  onClose?: () => void;
}

export default function DailyFlowWidget({ onClose }: DailyFlowWidgetProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mode, setMode] = useState<WidgetMode>('hidden');
  const flowScore = useFlowScore();
  
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });

  // Determine widget mode based on time and activity
  useEffect(() => {
    const hour = new Date().getHours();
    const today = new Date().toISOString().split('T')[0];
    const dismissedKey = `flow-widget-dismissed-${today}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    
    if (wasDismissed) {
      setDismissed(true);
      setMode('hidden');
      return;
    }
    
    // Morning: 5am - 12pm
    if (hour >= 5 && hour < 12) {
      setMode('morning');
    }
    // Evening: 6pm - 11pm (only if there's activity to celebrate)
    else if (hour >= 18 && hour < 23) {
      const hasActivity = flowScore.tasksCompleted > 0 || flowScore.habitsCompleted > 0 || flowScore.focusMinutes > 0;
      setMode(hasActivity ? 'evening' : 'hidden');
    }
    else {
      setMode('hidden');
    }
  }, [flowScore.tasksCompleted, flowScore.habitsCompleted, flowScore.focusMinutes]);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`flow-widget-dismissed-${today}`, 'true');
    setDismissed(true);
    setMode('hidden');
    onClose?.();
  };

  if (mode === 'hidden' || dismissed) {
    return null;
  }

  // Get high priority tasks for today
  const highPriorityTasks = tasks
    .filter(t => t.status !== 'completed' && t.priority === 'high')
    .slice(0, 3);

  // Get habits at risk (with streaks)
  const today = new Date().toISOString().split('T')[0];
  const getHabitStreak = (habitId: number): number => {
    let streak = 0;
    for (let i = 1; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasEntry = habitEntries.some(e => e.habitId === habitId && e.date === dateStr && e.completed);
      if (hasEntry) streak++;
      else break;
    }
    return streak;
  };

  const habitsAtRisk = habits
    .filter(habit => {
      const todayEntry = habitEntries.find(e => e.habitId === habit.id && e.date === today && e.completed);
      if (todayEntry) return false;
      return getHabitStreak(habit.id) >= 3;
    })
    .slice(0, 2);

  // Get incomplete habits for today
  const incompleteHabits = habits.filter(habit => {
    const todayEntry = habitEntries.find(e => e.habitId === habit.id && e.date === today && e.completed);
    return !todayEntry;
  });

  // Focus themes based on tasks
  const getFocusTheme = (): string => {
    const categories = tasks
      .filter(t => t.status !== 'completed' && t.priority === 'high')
      .map(t => t.category)
      .filter(Boolean);
    
    if (categories.includes('Dev')) return "Deep Work Day - Code & Create";
    if (categories.includes('Meeting')) return "Connection Day - Collaborate & Align";
    if (categories.includes('Content')) return "Creative Day - Write & Design";
    if (categories.includes('Finance')) return "Strategy Day - Plan & Analyze";
    if (highPriorityTasks.length >= 3) return "Power Day - Tackle the Big Ones";
    if (incompleteHabits.length > habits.length / 2) return "Foundation Day - Build Your Habits";
    return "Flow Day - Find Your Rhythm";
  };

  // Morning Briefing
  if (mode === 'morning') {
    return (
      <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-lg" data-testid="morning-briefing">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X size={14} />
        </Button>
        
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Sun Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Sun className="text-white" size={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Greeting */}
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                Good Morning! ☀️
              </h3>
              
              {/* Focus Theme */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Today's focus: <span className="font-semibold text-orange-600 dark:text-orange-400">{getFocusTheme()}</span>
              </p>
              
              {/* Quick Stats Row */}
              <div className="flex flex-wrap gap-3 mb-3">
                {highPriorityTasks.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                    <Target size={12} />
                    <span>{highPriorityTasks.length} priority task{highPriorityTasks.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {incompleteHabits.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    <CheckCircle size={12} />
                    <span>{incompleteHabits.length} habit{incompleteHabits.length > 1 ? 's' : ''} today</span>
                  </div>
                )}
                {flowScore.streakMultiplier > 1 && (
                  <div className="flex items-center gap-1.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                    <Flame size={12} />
                    <span>{flowScore.streakMultiplier.toFixed(1)}x streak bonus</span>
                  </div>
                )}
              </div>
              
              {/* Streaks at Risk Warning */}
              {habitsAtRisk.length > 0 && (
                <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Flame size={12} />
                  <span>
                    {habitsAtRisk.length === 1 
                      ? `"${habitsAtRisk[0].name}" streak needs you today!`
                      : `${habitsAtRisk.length} streaks need you today!`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Evening Recap
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-lg" data-testid="evening-recap">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
        onClick={handleDismiss}
      >
        <X size={14} />
      </Button>
      
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Moon Icon with Score */}
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg leading-none">{flowScore.score}</span>
            <span className="text-white/70 text-[10px]">Flow</span>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Evening Greeting */}
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
              {flowScore.level === 'unstoppable' || flowScore.level === 'blazing' 
                ? "Amazing day! 🌟" 
                : flowScore.level === 'flowing' 
                  ? "Solid progress! 👏" 
                  : "Day complete! 🌙"
              }
            </h3>
            
            {/* Today's Wins */}
            <div className="flex flex-wrap gap-3 mb-3">
              {flowScore.tasksCompleted > 0 && (
                <div className="flex items-center gap-1.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                  <CheckCircle size={12} />
                  <span>{flowScore.tasksCompleted} task{flowScore.tasksCompleted > 1 ? 's' : ''} done</span>
                </div>
              )}
              {flowScore.habitsCompleted > 0 && (
                <div className="flex items-center gap-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  <Zap size={12} />
                  <span>{flowScore.habitsCompleted}/{flowScore.totalHabits} habits</span>
                </div>
              )}
              {flowScore.focusMinutes > 0 && (
                <div className="flex items-center gap-1.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                  <Clock size={12} />
                  <span>{Math.round(flowScore.focusMinutes)}min focus</span>
                </div>
              )}
            </div>
            
            {/* Tomorrow's Priority */}
            {highPriorityTasks.length > 0 && (
              <div className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <ChevronRight size={12} />
                <span>Tomorrow's focus: {highPriorityTasks[0].title}</span>
              </div>
            )}
            
            {/* Motivational Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {getFlowMessage(flowScore.level)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact FlowScore badge for header
export function FlowScoreBadge() {
  const flowScore = useFlowScore();
  const gradientColor = getFlowColor(flowScore.level);
  
  return (
    <div 
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${gradientColor} text-white text-xs font-semibold shadow-sm cursor-default`}
      title={`FlowScore: ${flowScore.score}/100 - ${getFlowMessage(flowScore.level)}`}
      data-testid="flow-score-badge"
    >
      <Zap size={12} />
      <span>{flowScore.score}</span>
    </div>
  );
}

// Weekly trend mini chart
export function FlowTrendChart() {
  const flowScore = useFlowScore();
  const maxScore = Math.max(...flowScore.weeklyTrend, 1);
  
  return (
    <div className="flex items-end gap-0.5 h-6" title="Last 7 days">
      {flowScore.weeklyTrend.map((score, idx) => (
        <div
          key={idx}
          className={`w-1.5 rounded-t bg-gradient-to-t from-blue-500 to-cyan-400 transition-all ${
            idx === 6 ? 'opacity-100' : 'opacity-60'
          }`}
          style={{ height: `${Math.max((score / maxScore) * 100, 10)}%` }}
        />
      ))}
    </div>
  );
}
