import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, Clock, Calendar, Zap, Award, TrendingUp } from "lucide-react";
import type { Task, Habit, HabitEntry, PomodoroSession } from "@shared/schema";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'tasks' | 'habits' | 'pomodoro' | 'streaks' | 'productivity';
  icon: React.ReactNode;
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });
  const { data: pomodoroSessions = [] } = useQuery<PomodoroSession[]>({ queryKey: ["/api/pomodoro-sessions"] });

  // Calculate achievement progress
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const highPriorityCompleted = tasks.filter(t => t.status === 'completed' && t.priority === 'high').length;
  const totalHabits = habits.length;
  const completedHabitEntries = habitEntries.filter(entry => entry.completed).length;
  const pomodoroCount = (pomodoroSessions as PomodoroSession[]).length;

  // Calculate streaks
  const getHabitStreak = (habitId: number): number => {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const entry = habitEntries.find(e => 
        e.habitId === habitId && 
        e.date === dateStr && 
        e.completed
      );
      
      if (entry) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => getHabitStreak(h.id))) : 0;

  const achievements: Achievement[] = [
    // Task Achievements
    {
      id: 'first-task',
      title: 'Getting Started',
      description: 'Complete your first task',
      category: 'tasks',
      icon: <Target className="text-blue-500" size={24} />,
      requirement: 1,
      progress: completedTasks,
      unlocked: completedTasks >= 1,
      points: 10,
      rarity: 'common'
    },
    {
      id: 'task-achiever',
      title: 'Task Achiever',
      description: 'Complete 10 tasks',
      category: 'tasks',
      icon: <Trophy className="text-green-500" size={24} />,
      requirement: 10,
      progress: completedTasks,
      unlocked: completedTasks >= 10,
      points: 50,
      rarity: 'uncommon'
    },
    {
      id: 'priority-master',
      title: 'Priority Master',
      description: 'Complete 5 high-priority tasks',
      category: 'tasks',
      icon: <Star className="text-red-500" size={24} />,
      requirement: 5,
      progress: highPriorityCompleted,
      unlocked: highPriorityCompleted >= 5,
      points: 75,
      rarity: 'rare'
    },

    // Habit Achievements
    {
      id: 'habit-builder',
      title: 'Habit Builder',
      description: 'Create your first habit',
      category: 'habits',
      icon: <Calendar className="text-purple-500" size={24} />,
      requirement: 1,
      progress: totalHabits,
      unlocked: totalHabits >= 1,
      points: 15,
      rarity: 'common'
    },
    {
      id: 'consistency-champion',
      title: 'Consistency Champion',
      description: 'Complete 30 habit entries',
      category: 'habits',
      icon: <TrendingUp className="text-green-600" size={24} />,
      requirement: 30,
      progress: completedHabitEntries,
      unlocked: completedHabitEntries >= 30,
      points: 100,
      rarity: 'rare'
    },

    // Streak Achievements
    {
      id: 'week-warrior',
      title: 'Week Warrior',
      description: 'Maintain a 7-day habit streak',
      category: 'streaks',
      icon: <Zap className="text-yellow-500" size={24} />,
      requirement: 7,
      progress: maxStreak,
      unlocked: maxStreak >= 7,
      points: 80,
      rarity: 'uncommon'
    },
    {
      id: 'streak-legend',
      title: 'Streak Legend',
      description: 'Maintain a 30-day habit streak',
      category: 'streaks',
      icon: <Award className="text-orange-500" size={24} />,
      requirement: 30,
      progress: maxStreak,
      unlocked: maxStreak >= 30,
      points: 300,
      rarity: 'legendary'
    },

    // Pomodoro Achievements
    {
      id: 'focus-beginner',
      title: 'Focus Beginner',
      description: 'Complete your first Pomodoro session',
      category: 'pomodoro',
      icon: <Clock className="text-indigo-500" size={24} />,
      requirement: 1,
      progress: pomodoroCount,
      unlocked: pomodoroCount >= 1,
      points: 20,
      rarity: 'common'
    },
    {
      id: 'productivity-master',
      title: 'Productivity Master',
      description: 'Complete 50 Pomodoro sessions',
      category: 'pomodoro',
      icon: <Trophy className="text-gold-500" size={24} />,
      requirement: 50,
      progress: pomodoroCount,
      unlocked: pomodoroCount >= 50,
      points: 250,
      rarity: 'epic'
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700';
      case 'uncommon': return 'bg-green-100 text-green-700';
      case 'rare': return 'bg-blue-100 text-blue-700';
      case 'epic': return 'bg-purple-100 text-purple-700';
      case 'legendary': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
  const completionPercentage = Math.round((unlockedAchievements.length / achievements.length) * 100);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Trophy size={16} />
          <span>Achievements</span>
          <Badge variant="secondary">{unlockedAchievements.length}/{achievements.length}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trophy className="text-yellow-500" size={24} />
            <span>Achievement Gallery</span>
          </DialogTitle>
          <DialogDescription>
            Track your productivity milestones and unlock achievements as you build better habits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{unlockedAchievements.length}</div>
                <div className="text-sm text-gray-500">Achievements Unlocked</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{totalPoints}</div>
                <div className="text-sm text-gray-500">Total Points</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{completionPercentage}%</div>
                <div className="text-sm text-gray-500">Completion Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Category Filter */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="habits">Habits</TabsTrigger>
              <TabsTrigger value="streaks">Streaks</TabsTrigger>
              <TabsTrigger value="pomodoro">Focus</TabsTrigger>
              <TabsTrigger value="productivity">Productivity</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((achievement) => (
                  <Card key={achievement.id} className={`transition-all duration-200 ${
                    achievement.unlocked 
                      ? 'border-green-200 bg-green-50/50 dark:bg-green-900/20' 
                      : 'border-gray-200 opacity-75'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {achievement.icon}
                          <div>
                            <CardTitle className={`text-lg ${achievement.unlocked ? '' : 'text-gray-500'}`}>
                              {achievement.title}
                            </CardTitle>
                            <CardDescription>{achievement.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                          <div className="text-sm font-medium text-blue-600">
                            {achievement.points} pts
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {Math.min(achievement.progress, achievement.requirement)}/{achievement.requirement}
                          </span>
                        </div>
                        <Progress 
                          value={(achievement.progress / achievement.requirement) * 100} 
                          className="h-2"
                        />
                        {achievement.unlocked && (
                          <div className="flex items-center space-x-1 text-green-600 text-sm">
                            <Trophy size={14} />
                            <span>Unlocked!</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}