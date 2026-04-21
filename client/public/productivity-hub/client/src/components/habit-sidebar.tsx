import { useState, useRef, useEffect } from "react";
import { Plus, ChevronLeft, Check, X, Edit2, Trash2, Flame, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHabitSchema } from "@shared/schema";
import type { Habit, HabitEntry } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLayoutStore, useCalendarStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getStreakLength, getEarnedAchievements } from "@shared/achievements";
import AchievementNotification, { useAchievementNotifications } from "./achievement-notification";

export default function HabitSidebar() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [deleteHabitId, setDeleteHabitId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const editInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { leftSidebarCollapsed, toggleLeftSidebar } = useLayoutStore();
  const { getCurrentWeekDates } = useCalendarStore();
  const { toast } = useToast();
  const { notifications, showAchievement, removeNotification } = useAchievementNotifications();

  const { data: habitsData = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const habits = habitsData.filter((habit, index, self) =>
    index === self.findIndex((h) => h.id === habit.id)
  );

  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({
    queryKey: ["/api/habit-entries"],
  });

  // Unique user-created categories from existing actions (non-empty only)
  const userCategories = Array.from(
    new Set(
      habits
        .map((h) => h.category)
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    )
  ).sort();

  // Filter: "all" shows everything; any other value shows only matching category
  const filteredHabits =
    selectedCategory === "all"
      ? habits
      : habits.filter((h) => h.category === selectedCategory);

  const clientHabitSchema = insertHabitSchema.omit({ userId: true });

  const createHabitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clientHabitSchema>) => {
      const existingHabit = habits.find(
        (h) => h.name.toLowerCase() === data.name.toLowerCase()
      );
      if (existingHabit) throw new Error(`Action "${data.name}" already exists`);
      return apiRequest("/api/habits", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Success", description: "Daily action created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to create action", variant: "destructive" });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: { name?: string; category?: string | null } }) => {
      return apiRequest(`/api/habits/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setEditingHabitId(null);
      setEditingCategoryId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update action. Please try again.", variant: "destructive" });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: string }) => {
      return apiRequest("/api/habit-entries/toggle", {
        method: "POST",
        body: JSON.stringify({ habitId, date }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-entries"] });
      setTimeout(() => {
        const currentAchievements = getEarnedAchievements(habitEntries, habits);
        const previousAchievements = JSON.parse(localStorage.getItem("earnedAchievements") || "[]");
        const newAchievements = currentAchievements.filter(
          (a) => !previousAchievements.some((p: any) => p.id === a.id)
        );
        newAchievements.forEach((a) => showAchievement(a));
        localStorage.setItem("earnedAchievements", JSON.stringify(currentAchievements));
      }, 500);
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/habits/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-entries"] });
      setDeleteHabitId(null);
      toast({ title: "Action deleted", description: "Action has been successfully deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete action.", variant: "destructive" });
    },
  });

  const form = useForm({
    resolver: zodResolver(clientHabitSchema),
    defaultValues: { name: "", icon: "fas fa-check", color: "blue-500", category: "", streakGoal: 7 },
  });

  const onSubmit = (values: z.infer<typeof clientHabitSchema>) => {
    createHabitMutation.mutate(values);
  };

  useEffect(() => {
    if (editingHabitId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingHabitId]);

  useEffect(() => {
    if (editingCategoryId && categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, [editingCategoryId]);

  const startEditingName = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditingName(habit.name);
    setEditingCategoryId(null);
  };

  const saveEditingName = () => {
    if (editingHabitId && editingName.trim()) {
      updateHabitMutation.mutate({ id: editingHabitId, updates: { name: editingName.trim() } });
    }
  };

  const cancelEditingName = () => {
    setEditingHabitId(null);
    setEditingName("");
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEditingName();
    else if (e.key === "Escape") cancelEditingName();
  };

  const startEditingCategory = (habit: Habit) => {
    setEditingCategoryId(habit.id);
    setEditingCategoryValue(habit.category ?? "");
    setEditingHabitId(null);
  };

  const saveEditingCategory = (habitId: number) => {
    const trimmed = editingCategoryValue.trim();
    updateHabitMutation.mutate({
      id: habitId,
      updates: { category: trimmed || null },
    });
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryValue("");
  };

  const handleCategoryKeyPress = (habitId: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEditingCategory(habitId);
    else if (e.key === "Escape") cancelEditingCategory();
  };

  const getWeekDates = () =>
    getCurrentWeekDates().map((d) => d.toISOString().split("T")[0]);

  const isHabitCompleted = (habitId: number, date: string) =>
    habitEntries.some((e) => e.habitId === habitId && e.date === date && e.completed);

  const getHabitCompletionCount = (habitId: number) => {
    const weekDates = getWeekDates();
    return weekDates.filter((d) => isHabitCompleted(habitId, d)).length;
  };

  const getTotalCompleted = () => {
    const weekDates = getWeekDates();
    return habitEntries.filter((e) => e.completed && weekDates.includes(e.date)).length;
  };

  const getTotalPossible = () => habits.length * 7;

  const weekDates = getWeekDates();

  if (leftSidebarCollapsed) {
    return (
      <div className="fixed left-0 top-20 z-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-r-lg shadow-lg">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleLeftSidebar}
          className="w-10 h-10 rounded-r-lg rounded-l-none hover:bg-primary/10 transition-colors"
          title="Show Daily Actions Sidebar"
        >
          <Plus size={16} className="rotate-45 text-primary" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-r border-border overflow-y-auto shadow-sm">
      <div className="p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Daily Actions</h2>
          <div className="flex items-center space-x-2">
            <Button size="icon" variant="ghost" onClick={toggleLeftSidebar} className="w-8 h-8">
              <ChevronLeft size={16} className="hidden md:block" />
              <X size={16} className="block md:hidden" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="w-8 h-8 bg-primary text-white rounded-full">
                  <Plus size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Daily Action</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Drink Water" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                placeholder="Type a new category or pick below"
                                {...field}
                                value={field.value ?? ""}
                              />
                              {userCategories.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {userCategories.map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => field.onChange(field.value === cat ? "" : cat)}
                                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                        field.value === cat
                                          ? "bg-primary text-white border-primary"
                                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon (Font Awesome class)</FormLabel>
                          <FormControl>
                            <Input placeholder="fas fa-tint" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color (Tailwind class)</FormLabel>
                          <FormControl>
                            <Input placeholder="blue-500" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="streakGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Streak Goal (days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="7"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-3 pt-2">
                      <Button type="submit" className="flex-1" disabled={createHabitMutation.isPending}>
                        {createHabitMutation.isPending ? "Creating..." : "Create Action"}
                      </Button>
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Category Filter Pills */}
        {userCategories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary bg-transparent"
              }`}
            >
              All
            </button>
            {userCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary bg-transparent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Action Cards */}
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredHabits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {selectedCategory === "all"
                ? "No daily actions yet. Click + to add one."
                : `No actions in "${selectedCategory}" category.`}
            </div>
          )}

          {filteredHabits.map((habit) => {
            const streak = getStreakLength(habitEntries, habit.id);
            const completionCount = getHabitCompletionCount(habit.id);
            const isEditingThisName = editingHabitId === habit.id;
            const isEditingThisCategory = editingCategoryId === habit.id;

            return (
              <div
                key={habit.id}
                className="bg-card border border-border rounded-xl p-4 group hover:shadow-md transition-all duration-200"
              >
                {/* Top row: icon + name + streak + count + actions */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <i className={`${habit.icon} text-${habit.color} flex-shrink-0`} />

                    {isEditingThisName ? (
                      <div className="flex items-center space-x-1 flex-1">
                        <Input
                          ref={editInputRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={handleNameKeyPress}
                          className="h-7 text-sm font-medium"
                          onBlur={saveEditingName}
                        />
                        <Button size="icon" variant="ghost" className="w-5 h-5 flex-shrink-0" onClick={saveEditingName}>
                          <Check size={11} className="text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-5 h-5 flex-shrink-0" onClick={cancelEditingName}>
                          <X size={11} className="text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                          onClick={() => startEditingName(habit)}
                        >
                          {habit.name}
                        </span>
                        {streak > 0 && (
                          <div className="flex items-center gap-0.5 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            <Flame size={10} className="text-orange-500" />
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{streak}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                    {!isEditingThisName && (
                      <span className="text-xs font-bold text-foreground">{completionCount}/7</span>
                    )}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isEditingThisName && (
                        <Button size="icon" variant="ghost" className="w-5 h-5" onClick={() => startEditingName(habit)}>
                          <Edit2 size={10} />
                        </Button>
                      )}
                      <AlertDialog
                        open={deleteHabitId === habit.id}
                        onOpenChange={(open) => !open && setDeleteHabitId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-5 h-5 text-red-400 hover:text-red-600"
                            onClick={() => setDeleteHabitId(habit.id)}
                          >
                            <Trash2 size={10} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Action</AlertDialogTitle>
                            <AlertDialogDescription>
                              Delete "{habit.name}"? All completion records will also be removed. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteHabitMutation.mutate(habit.id)}
                              disabled={deleteHabitMutation.isPending}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteHabitMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>

                {/* Category row */}
                <div className="mb-3">
                  {isEditingThisCategory ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={categoryInputRef}
                        value={editingCategoryValue}
                        onChange={(e) => setEditingCategoryValue(e.target.value)}
                        onKeyDown={(e) => handleCategoryKeyPress(habit.id, e)}
                        placeholder="Category name..."
                        className="h-6 text-xs py-0 px-2"
                      />
                      {/* Quick-pick existing categories */}
                      {userCategories.length > 0 && (
                        <div className="flex gap-1">
                          {userCategories.slice(0, 3).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setEditingCategoryValue(cat)}
                              className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:border-primary hover:text-primary"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                      <Button size="icon" variant="ghost" className="w-5 h-5 flex-shrink-0" onClick={() => saveEditingCategory(habit.id)}>
                        <Check size={10} className="text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-5 h-5 flex-shrink-0" onClick={cancelEditingCategory}>
                        <X size={10} className="text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditingCategory(habit)}
                      className="flex items-center gap-1 group/cat"
                    >
                      {habit.category ? (
                        <Badge
                          variant="secondary"
                          className="text-xs h-5 px-2 font-normal cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Tag size={9} className="mr-1" />
                          {habit.category}
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors flex items-center gap-1">
                          <Tag size={9} />
                          Add category
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Week tracker */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-7 gap-0.5">
                    {weekDates.map((date) => {
                      const dayName = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
                      const dayNumber = new Date(date + "T00:00:00").getDate();
                      const isToday = date === new Date().toISOString().split("T")[0];
                      return (
                        <div key={date} className="text-center">
                          <span
                            className="block text-[11px] font-black"
                            style={{ color: isToday ? "#4f46e5" : "#000000" }}
                          >
                            {dayName}
                          </span>
                          <span
                            className={`block text-sm font-black ${isToday ? "bg-indigo-100 rounded-full w-7 h-7 leading-7 mx-auto" : ""}`}
                            style={{ color: isToday ? "#4f46e5" : "#000000" }}
                          >
                            {dayNumber}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {weekDates.map((date) => {
                      const isCompleted = isHabitCompleted(habit.id, date);
                      const isToday = date === new Date().toISOString().split("T")[0];
                      return (
                        <button
                          key={`${habit.id}-${date}`}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await toggleHabitMutation.mutateAsync({ habitId: habit.id, date });
                          }}
                          disabled={toggleHabitMutation.isPending}
                          className={`w-6 h-6 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : isToday
                              ? "border-primary border-2 bg-primary/5 hover:bg-primary/10"
                              : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                          }`}
                          title={`${isCompleted ? "Completed" : "Not completed"} on ${new Date(date + "T00:00:00").toLocaleDateString()}${isToday ? " (Today)" : ""}`}
                        >
                          {isCompleted && <i className="fas fa-check text-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Progress Summary */}
        {habits.length > 0 && (
          <div className="mt-5 bg-gradient-to-r from-primary to-secondary rounded-lg p-4 text-white shadow-lg">
            <h3 className="font-bold mb-3 text-base flex items-center">
              <i className="fas fa-chart-bar mr-2" />
              This Week's Progress
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Total Completed:</span>
                <span className="font-bold text-xl">{getTotalCompleted()}/{getTotalPossible()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Success Rate:</span>
                <span className="font-bold text-xl">
                  {getTotalPossible() > 0
                    ? Math.round((getTotalCompleted() / getTotalPossible()) * 100)
                    : 0}%
                </span>
              </div>
              <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{
                    width: `${getTotalPossible() > 0 ? (getTotalCompleted() / getTotalPossible()) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {notifications.map((n) => (
        <AchievementNotification key={n.id} achievement={n} onClose={() => removeNotification(n.id)} />
      ))}
    </aside>
  );
}
