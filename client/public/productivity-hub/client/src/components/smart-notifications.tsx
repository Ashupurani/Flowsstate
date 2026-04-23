import { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, Target, Flame, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { Task, Habit, HabitEntry, Goal } from "@shared/schema";

interface SmartNotification {
  id: string;
  type: 'deadline' | 'habit_reminder' | 'streak_risk' | 'achievement' | 'break_reminder' | 'goal_progress';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: () => void;
  timestamp: Date;
  read: boolean;
}

export default function SmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });
  const { data: pomodoroSessions = [] } = useQuery<any[]>({ queryKey: ["/api/pomodoro-sessions"] });

  // Generate smart notifications - OPTIMIZED: Only show important, consolidated alerts
  useEffect(() => {
    const newNotifications: SmartNotification[] = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const hour = now.getHours();

    // Check dismissed notifications from localStorage (with daily reset)
    const dismissedData = JSON.parse(localStorage.getItem('dismissedNotifications') || '{"ids":[],"date":""}');
    const dismissed: string[] = dismissedData.date === today ? dismissedData.ids : [];
    if (dismissedData.date !== today) {
      localStorage.setItem('dismissedNotifications', JSON.stringify({ ids: [], date: today }));
    }

    // 1. HIGH PRIORITY TASKS - Only one consolidated notification
    const urgentTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');
    if (urgentTasks.length >= 2) {
      newNotifications.push({
        id: 'high-priority-tasks',
        type: 'deadline',
        title: 'High Priority Tasks',
        message: `${urgentTasks.length} urgent tasks need your attention today.`,
        priority: 'high',
        actionable: true,
        timestamp: now,
        read: false,
      });
    }

    // 2. HABIT STREAKS AT RISK - Only show for significant streaks (5+ days), only after 8pm
    if (hour >= 20) {
      const atRiskHabits = habits.filter(habit => {
        const todayEntry = habitEntries.find(e => e.habitId === habit.id && e.date === today);
        if (todayEntry) return false;
        const streak = getHabitStreak(habit.id, habitEntries);
        return streak >= 5; // Only care about 5+ day streaks
      });

      if (atRiskHabits.length > 0) {
        const topHabit = atRiskHabits[0];
        const streak = getHabitStreak(topHabit.id, habitEntries);
        newNotifications.push({
          id: 'streak-at-risk',
          type: 'streak_risk',
          title: `${streak}-Day Streak at Risk`,
          message: atRiskHabits.length === 1 
            ? `Complete "${topHabit.name}" to keep your streak!`
            : `${atRiskHabits.length} habits with good streaks need completing.`,
          priority: 'high',
          actionable: true,
          timestamp: now,
          read: false,
        });
      }
    }

    // 3. DAILY HABITS SUMMARY - Single reminder at 7pm, only if many incomplete
    if (hour >= 19 && hour < 20) {
      const incompleteHabits = habits.filter(habit => {
        const todayEntry = habitEntries.find(e => e.habitId === habit.id && e.date === today);
        return !todayEntry;
      });

      if (incompleteHabits.length >= 3) {
        newNotifications.push({
          id: 'daily-habits-reminder',
          type: 'habit_reminder',
          title: 'Habits Check-in',
          message: `${incompleteHabits.length} habits left for today. You've got this!`,
          priority: 'medium',
          actionable: true,
          timestamp: now,
          read: false,
        });
      }
    }

    // 4. MILESTONE ACHIEVEMENTS - Only show for big milestones (7, 14, 30, 60, 90 days)
    const milestones = [7, 14, 30, 60, 90];
    habits.forEach(habit => {
      const streak = getHabitStreak(habit.id, habitEntries);
      if (milestones.includes(streak)) {
        const shownKey = `achievement-shown-${habit.id}-${streak}`;
        if (!localStorage.getItem(shownKey)) {
          newNotifications.push({
            id: `milestone-${habit.id}-${streak}`,
            type: 'achievement',
            title: `${streak}-Day Milestone!`,
            message: `Amazing! "${habit.name}" streak reached ${streak} days.`,
            priority: 'medium',
            actionable: false,
            timestamp: now,
            read: false,
          });
          localStorage.setItem(shownKey, 'true');
        }
      }
    });

    // Filter out dismissed and limit to 3 most important
    const filteredNotifications = newNotifications
      .filter(n => !dismissed.includes(n.id))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 3); // Max 3 notifications at a time
    
    setNotifications(filteredNotifications);
  }, [tasks.length, habits.length, habitEntries.length]);

  const getHabitStreak = (habitId: number, entries: HabitEntry[]): number => {
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
        continue; // Today might not be completed yet
      } else {
        break;
      }
    }
    
    return streak;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    // Store dismissed notifications in localStorage (with date tracking)
    const today = new Date().toISOString().split('T')[0];
    const dismissedData = JSON.parse(localStorage.getItem('dismissedNotifications') || '{"ids":[],"date":""}');
    const dismissed: string[] = dismissedData.date === today ? dismissedData.ids : [];
    localStorage.setItem('dismissedNotifications', JSON.stringify({ 
      ids: [...dismissed, id], 
      date: today 
    }));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <AlertTriangle className="text-red-500" size={16} />;
      case 'habit_reminder': return <Clock className="text-blue-500" size={16} />;
      case 'streak_risk': return <Flame className="text-orange-500" size={16} />;
      case 'achievement': return <CheckCircle className="text-green-500" size={16} />;
      case 'break_reminder': return <Clock className="text-purple-500" size={16} />;
      case 'goal_progress': return <Target className="text-indigo-500" size={16} />;
      default: return <Bell className="text-gray-500" size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show browser notifications - RATE LIMITED: Only for high priority, max once per hour
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const lastBrowserNotif = localStorage.getItem('lastBrowserNotification');
    const lastNotifTime = lastBrowserNotif ? new Date(lastBrowserNotif).getTime() : 0;
    const hourAgo = Date.now() - (60 * 60 * 1000);
    
    // Only show one browser notification per hour maximum
    if (lastNotifTime > hourAgo) return;
    
    const criticalNotif = notifications.find(n => !n.read && n.priority === 'high');
    if (criticalNotif) {
      new Notification(criticalNotif.title, {
        body: criticalNotif.message,
        icon: '/favicon.png',
        tag: 'productivity-hub-alert',
      });
      localStorage.setItem('lastBrowserNotification', new Date().toISOString());
    }
  }, [notifications]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Smart Notifications</span>
            </DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
          <DialogDescription>
            AI-powered insights and reminders for your productivity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">All caught up! No new notifications.</p>
            </div>
          ) : (
            notifications
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`relative ${getPriorityColor(notification.priority)} ${
                    notification.read ? 'opacity-60' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getNotificationIcon(notification.type)}
                        <CardTitle className="text-sm">{notification.title}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <CheckCircle size={12} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {notification.timestamp.toLocaleDateString()} at{' '}
                        {notification.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {notification.actionable && notification.action && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            notification.action?.();
                            markAsRead(notification.id);
                          }}
                        >
                          Take Action
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}