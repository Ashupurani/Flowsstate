import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, Clock, Target, Lightbulb, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import type { Task, Habit, HabitEntry, PomodoroSession } from "@shared/schema";

interface AIInsight {
  id: string;
  type: 'productivity_pattern' | 'task_optimization' | 'habit_recommendation' | 'time_management' | 'goal_suggestion';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

export default function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });
  const { data: pomodoroSessions = [] } = useQuery<PomodoroSession[]>({ queryKey: ["/api/pomodoro-sessions"] });

  // Generate AI insights based on user data
  useEffect(() => {
    const generateInsights = () => {
      const newInsights: AIInsight[] = [];

      // Productivity Pattern Analysis
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

      if (completionRate < 60) {
        newInsights.push({
          id: 'low-completion-rate',
          type: 'productivity_pattern',
          title: 'Task Completion Pattern Detected',
          description: `Your task completion rate is ${completionRate.toFixed(1)}%. Consider breaking down larger tasks into smaller, manageable subtasks to improve completion rates.`,
          confidence: 85,
          actionable: true,
          priority: 'medium',
          data: { completionRate, suggestion: 'break_down_tasks' }
        });
      }

      // Task Category Analysis
      const categoryStats = tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantCategory = Object.entries(categoryStats).sort(([,a], [,b]) => b - a)[0];
      if (dominantCategory && dominantCategory[1] > totalTasks * 0.4) {
        newInsights.push({
          id: 'category-dominance',
          type: 'task_optimization',
          title: 'Task Category Imbalance',
          description: `${dominantCategory[1]} of your tasks are in ${dominantCategory[0]}. Consider diversifying your task categories for better work-life balance.`,
          confidence: 75,
          actionable: true,
          priority: 'low',
          data: { category: dominantCategory[0], percentage: (dominantCategory[1] / totalTasks) * 100 }
        });
      }

      // Habit Streak Analysis
      const habitStreaks = habits.map(habit => {
        const streak = getStreakLength(habitEntries, habit.id);
        return { habit, streak };
      });

      const strugglingHabits = habitStreaks.filter(h => h.streak === 0 && 
        habitEntries.some(entry => entry.habitId === h.habit.id)
      );

      if (strugglingHabits.length > 0) {
        newInsights.push({
          id: 'struggling-habits',
          type: 'habit_recommendation',
          title: 'Habit Consistency Opportunity',
          description: `${strugglingHabits.length} habit(s) need attention. Try habit stacking - link new habits to existing routines for better consistency.`,
          confidence: 80,
          actionable: true,
          priority: 'medium',
          data: { strugglingHabits: strugglingHabits.map(h => h.habit.name) }
        });
      }

      // Peak Productivity Time Analysis
      const sessionTimes = pomodoroSessions.map(session => {
        if (session.completedAt) {
          const time = new Date(session.completedAt);
          return time.getHours();
        }
        return null;
      }).filter(Boolean) as number[];

      if (sessionTimes.length > 5) {
        const hourCounts = sessionTimes.reduce((acc, hour) => {
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const peakHour = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0];
        if (peakHour) {
          const peakTime = parseInt(peakHour[0]);
          const timeString = peakTime === 0 ? '12 AM' : 
                            peakTime < 12 ? `${peakTime} AM` : 
                            peakTime === 12 ? '12 PM' : 
                            `${peakTime - 12} PM`;
          
          newInsights.push({
            id: 'peak-productivity',
            type: 'time_management',
            title: 'Peak Productivity Hours Identified',
            description: `Your most productive time appears to be around ${timeString}. Schedule your most important tasks during this window.`,
            confidence: 90,
            actionable: true,
            priority: 'high',
            data: { peakHour: peakTime, sessionCount: Number(peakHour[1]) }
          });
        }
      }

      // Goal Setting Recommendation
      if (habits.length > 0 && tasks.length > 0) {
        const avgHabitCompletion = habitEntries.filter(e => e.completed).length / Math.max(habits.length, 1);
        const avgTaskCompletion = completedTasks.length / Math.max(totalTasks, 1);
        
        if (avgHabitCompletion > 0.7 && avgTaskCompletion > 0.6) {
          newInsights.push({
            id: 'goal-opportunity',
            type: 'goal_suggestion',
            title: 'Ready for Bigger Goals',
            description: `You're consistently completing habits and tasks. Consider setting a challenging 30-day goal to push your productivity further.`,
            confidence: 85,
            actionable: true,
            priority: 'medium',
            data: { habitRate: avgHabitCompletion, taskRate: avgTaskCompletion }
          });
        }
      }

      // Weekly Planning Insight
      const tasksByDay = tasks.reduce((acc, task) => {
        acc[task.dayOfWeek] = (acc[task.dayOfWeek] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const heaviestDay = Object.entries(tasksByDay).sort(([,a], [,b]) => b - a)[0];
      const lightestDay = Object.entries(tasksByDay).sort(([,a], [,b]) => a - b)[0];

      if (heaviestDay && lightestDay && heaviestDay[1] > lightestDay[1] * 2) {
        newInsights.push({
          id: 'workload-balance',
          type: 'time_management',
          title: 'Workload Distribution Imbalance',
          description: `${heaviestDay[0]} has ${heaviestDay[1]} tasks while ${lightestDay[0]} has ${lightestDay[1]}. Consider redistributing for better weekly balance.`,
          confidence: 75,
          actionable: true,
          priority: 'low',
          data: { heaviestDay: heaviestDay[0], lightestDay: lightestDay[0] }
        });
      }

      setInsights(newInsights);
      setIsLoading(false);
    };

    // Simulate AI processing delay
    const timer = setTimeout(generateInsights, 1500);
    return () => clearTimeout(timer);
  }, [tasks, habits, habitEntries, pomodoroSessions]);

  const getStreakLength = (entries: HabitEntry[], habitId: number): number => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const hasEntry = entries.some(entry => 
        entry.habitId === habitId && 
        entry.date === dateString && 
        entry.completed
      );
      
      if (hasEntry) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity_pattern': return <TrendingUp className="text-blue-500" size={20} />;
      case 'task_optimization': return <Target className="text-green-500" size={20} />;
      case 'habit_recommendation': return <CheckCircle className="text-purple-500" size={20} />;
      case 'time_management': return <Clock className="text-orange-500" size={20} />;
      case 'goal_suggestion': return <Lightbulb className="text-yellow-500" size={20} />;
      default: return <Brain className="text-gray-500" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="text-primary animate-pulse" size={20} />
            <span>AI Insights</span>
          </CardTitle>
          <CardDescription>Analyzing your productivity patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="text-primary" size={20} />
            <span>AI Insights</span>
          </CardTitle>
          <CardDescription>Keep using the app to get personalized insights</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Not enough data yet. Complete more tasks and habits to unlock AI-powered recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="text-primary" size={20} />
          <span>AI Insights</span>
        </CardTitle>
        <CardDescription>Personalized recommendations based on your activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.type)}
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {insight.confidence}% confidence
                  </Badge>
                  <Badge 
                    variant={insight.priority === 'high' ? 'destructive' : 
                            insight.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {insight.priority}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {insight.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Progress value={insight.confidence} className="flex-1 mr-3 h-2" />
                {insight.actionable && (
                  <Button size="sm" variant="outline">
                    Apply Suggestion
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}