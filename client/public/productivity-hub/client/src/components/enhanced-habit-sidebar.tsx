import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Plus, Trash2, Calendar, Target, Star, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getStreakLength } from "@shared/achievements";
import type { Habit, HabitEntry, InsertHabit, InsertHabitEntry } from "@shared/schema";

type CreateHabitPayload = Omit<InsertHabit, "userId">;
type CreateHabitEntryPayload = Omit<InsertHabitEntry, "userId">;

interface EnhancedHabitSidebarProps {
  isCollapsed: boolean;
}

const habitCategories = [
  { value: "health", label: "Health & Fitness", color: "#10b981" },
  { value: "productivity", label: "Productivity", color: "#3b82f6" },
  { value: "mindfulness", label: "Mindfulness", color: "#8b5cf6" },
  { value: "learning", label: "Learning", color: "#f59e0b" },
  { value: "social", label: "Social", color: "#ef4444" },
  { value: "creative", label: "Creative", color: "#ec4899" },
];

const habitSchedules = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays Only" },
  { value: "weekends", label: "Weekends Only" },
  { value: "custom", label: "Custom Days" },
];

const habitIcons = [
  "fas fa-dumbbell", "fas fa-running", "fas fa-heart", "fas fa-leaf",
  "fas fa-book", "fas fa-pen", "fas fa-coffee", "fas fa-moon",
  "fas fa-sun", "fas fa-music", "fas fa-camera", "fas fa-gamepad"
];

export default function EnhancedHabitSidebar({ isCollapsed }: EnhancedHabitSidebarProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ["/api/habits"] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ["/api/habit-entries"] });

  const createHabit = useMutation({
    mutationFn: (data: CreateHabitPayload) => apiRequest("POST", "/api/habits", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Habit created successfully!" });
    },
  });

  const updateHabitEntry = useMutation({
    mutationFn: (data: CreateHabitEntryPayload) => apiRequest("POST", "/api/habit-entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-entries"] });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({ title: "Habit deleted successfully!" });
    },
  });

  const handleCreateHabit = (formData: FormData) => {
    const data: CreateHabitPayload = {
      name: formData.get("name") as string,
      icon: formData.get("icon") as string,
      color: formData.get("color") as string,
      streakGoal: parseInt(formData.get("streakGoal") as string) || 7,
    };
    createHabit.mutate(data);
  };

  const toggleHabitEntry = (habitId: number, date: string, currentlyCompleted: boolean) => {
    updateHabitEntry.mutate({
      habitId,
      date,
      completed: !currentlyCompleted,
    });
  };

  const getHabitEntry = (habitId: number, date: string) => {
    return habitEntries.find(entry => entry.habitId === habitId && entry.date === date);
  };

  const getHabitStats = (habit: Habit) => {
    const streak = getStreakLength(habitEntries, habit.id);
    const totalCompletions = habitEntries.filter(entry => entry.habitId === habit.id && entry.completed).length;
    const last30Days = habitEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return entry.habitId === habit.id && entry.completed && entryDate >= thirtyDaysAgo;
    }).length;
    
    return {
      streak,
      totalCompletions,
      monthlyRate: (last30Days / 30) * 100,
    };
  };

  const filteredHabits = selectedCategory === "all" 
    ? habits 
    : habits.filter(habit => habit.name.toLowerCase().includes(selectedCategory.toLowerCase()));

  const getDaysOfWeek = () => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0,
      });
    }
    return days;
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col items-center py-4 space-y-3">
        {habits.slice(0, 5).map((habit) => {
          const today = new Date().toISOString().split('T')[0];
          const entry = getHabitEntry(habit.id, today);
          const stats = getHabitStats(habit);
          
          return (
            <div key={habit.id} className="relative group">
              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-xl transition-all duration-200 ${
                  entry?.completed 
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 scale-105' 
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                onClick={() => toggleHabitEntry(habit.id, today, entry?.completed || false)}
              >
                <i className={habit.icon} style={{ color: habit.color }} />
              </Button>
              {stats.streak > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-500">
                  {stats.streak}
                </Badge>
              )}
            </div>
          );
        })}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-10 h-10 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl"
        >
          <Plus size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Flame className="mr-2 text-orange-500" size={20} />
            Habits
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCreateDialogOpen(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {habitCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="habits" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="habits">Daily Tracking</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="space-y-4 mt-4">
            {/* Week View */}
            <div className="space-y-3">
              {filteredHabits.map((habit) => {
                const stats = getHabitStats(habit);
                const days = getDaysOfWeek();
                
                return (
                  <Card key={habit.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <i className={habit.icon} style={{ color: habit.color }} />
                          <CardTitle className="text-sm">{habit.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-1">
                          {stats.streak > 0 && (
                            <Badge variant="outline" className="flex items-center space-x-1">
                              <Flame size={10} className="text-orange-500" />
                              <span>{stats.streak}</span>
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteHabit.mutate(habit.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-7 gap-1">
                        {days.map((day) => {
                          const entry = getHabitEntry(habit.id, day.date);
                          return (
                            <div key={day.date} className="text-center">
                              <div className="text-xs text-gray-500 mb-1">{day.label}</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`w-8 h-8 p-0 rounded-full transition-all ${
                                  entry?.completed
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : day.isToday
                                    ? 'border-2 border-primary text-primary hover:bg-primary/10'
                                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => toggleHabitEntry(habit.id, day.date, entry?.completed || false)}
                              >
                                {entry?.completed ? '✓' : ''}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Monthly completion</span>
                          <span>{stats.monthlyRate.toFixed(0)}%</span>
                        </div>
                        <Progress value={stats.monthlyRate} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="space-y-4">
              {filteredHabits.map((habit) => {
                const stats = getHabitStats(habit);
                return (
                  <Card key={habit.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <i className={habit.icon} style={{ color: habit.color }} />
                        <CardTitle className="text-sm">{habit.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-lg font-bold text-orange-500">{stats.streak}</div>
                          <div className="text-xs text-gray-500">Current Streak</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-500">{stats.totalCompletions}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-500">{stats.monthlyRate.toFixed(0)}%</div>
                          <div className="text-xs text-gray-500">30-Day Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Habit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Habit</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateHabit(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Habit Name</Label>
              <Input id="name" name="name" placeholder="e.g., Morning meditation" required />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="category">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {habitCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select name="icon" defaultValue="fas fa-star">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {habitIcons.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center space-x-2">
                          <i className={icon} />
                          <span>{icon.split('-').pop()}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue="#3b82f6"
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="streakGoal">Streak Goal (days)</Label>
              <Input
                id="streakGoal"
                name="streakGoal"
                type="number"
                defaultValue="7"
                min="1"
                max="365"
              />
            </div>

            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select name="schedule" defaultValue="daily">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {habitSchedules.map((schedule) => (
                    <SelectItem key={schedule.value} value={schedule.value}>
                      {schedule.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={createHabit.isPending}>
              {createHabit.isPending ? "Creating..." : "Create Habit"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}