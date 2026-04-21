import { useState, useEffect } from "react";
import { Plus, Lightbulb, Clock, AlertTriangle, CheckCircle, Trash2, Calendar, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCalendarStore } from "@/lib/store";
import type { Task } from "@shared/schema";
import TaskModal from "./task-modal";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Helper to get current week dates or week containing selected date
const getCurrentWeekDates = (referenceDate?: Date, selectedCalendarDate?: Date | null) => {
  const baseDate = referenceDate || selectedCalendarDate || new Date();
  const firstDayOfWeek = new Date(baseDate);
  firstDayOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + 1); // Monday
  const dates = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};
const COLUMNS = [
  { id: "proposed", label: "Proposed", icon: Lightbulb, color: "blue" },
  { id: "in_task", label: "In Task", icon: Clock, color: "yellow" },
  { id: "hurdles", label: "Hurdles", icon: AlertTriangle, color: "red" },
  { id: "completed", label: "Completed", icon: CheckCircle, color: "green" },
];

// Helper to calculate week key from any date
const calculateWeekKey = (date: Date): string => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(date);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.toISOString().split('T')[0];
};

export default function TaskBoard() {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  // Initialize with current week's key to avoid blank renders
  const [currentWeekKey, setCurrentWeekKey] = useState<string>(() => calculateWeekKey(new Date()));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskDay, setNewTaskDay] = useState<string>("monday");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Emit category changes so calendar sidebar can listen
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('categoryFilterChanged', { detail: { category: selectedCategory } }));
  }, [selectedCategory]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { weekStartDate, getWeekKey } = useCalendarStore();

  useEffect(() => {
    const handleCalendarDateChange = (event: CustomEvent) => {
      setSelectedCalendarDate(event.detail.date);
    };

    window.addEventListener('calendarDateChanged', handleCalendarDateChange as EventListener);
    
    return () => {
      window.removeEventListener('calendarDateChanged', handleCalendarDateChange as EventListener);
    };
  }, []);

  // Update week key when calendar date changes or store week changes
  // This allows users to navigate to different weeks and see tasks for those weeks
  useEffect(() => {
    const baseDate = selectedCalendarDate || weekStartDate || new Date();
    const weekKey = calculateWeekKey(baseDate);
    setCurrentWeekKey(weekKey);
    console.log('🔥 VIEWING WEEK KEY:', weekKey, selectedCalendarDate ? '(from calendar)' : '(current week)');
  }, [selectedCalendarDate, weekStartDate]);

  // Query for all tasks - this is our primary data source
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Debug tasks loading
  useEffect(() => {
    console.log('🔥 ALL TASKS LOADED:', allTasks.length);
    if (allTasks.length > 0) {
      console.log('🔥 SAMPLE TASK:', allTasks[0]);
    }
  }, [allTasks]);

  // Use consistent week key calculation
  const getWeekKeyFromDate = (date: Date): string => {
    return calculateWeekKey(date);
  };

  // Don't use week-specific query as it changes with calendar navigation
  // Instead rely on the allTasks query which is stable



  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      return apiRequest(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/tasks"] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(["/api/tasks"]);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData<Task[]>(["/api/tasks"], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        );
      });
      
      // Return context with the snapshot for rollback
      return { previousTasks };
    },
    onError: (error, variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["/api/tasks"], context.previousTasks);
      }
      console.error('Task update failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Refetch after mutation settles to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/tasks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Task carry-forward mutation
  const carryForwardMutation = useMutation({
    mutationFn: async ({ fromWeekKey, toWeekKey }: { fromWeekKey: string; toWeekKey: string }) => {
      return apiRequest('/api/tasks/carry-forward', {
        method: 'POST',
        body: JSON.stringify({ fromWeekKey, toWeekKey })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Tasks Carried Forward",
        description: `${data.carriedTasks} incomplete tasks moved to current week`,
      });
    },
    onError: (error) => {
      console.error('Carry forward failed:', error);
      toast({
        title: "Carry Forward Failed",
        description: "Failed to carry forward tasks. Please try again.",
        variant: "destructive"
      });
    }
  });

  const getTasksByDayAndStatus = (day: string, status: string) => {
    // Filter by day, status, AND week - tasks stay pinned to their exact week
    const filtered = allTasks.filter(task => {
      const matchesDay = task.dayOfWeek === day;
      const matchesStatus = task.status === status;
      
      // IMPORTANT: Only show tasks that belong to the currently viewed week
      const matchesWeek = task.weekKey === currentWeekKey;
      
      // Normalize both values for comparison to handle whitespace/casing variants
      const normalizedTaskCategory = typeof task.category === "string" ? task.category.trim() : "";
      const normalizedSelectedCategory = selectedCategory.trim();
      const matchesCategory = normalizedSelectedCategory === "all" || normalizedTaskCategory === normalizedSelectedCategory;
      
      return matchesDay && matchesStatus && matchesCategory && matchesWeek;
    });
    
    return filtered;
  };

  // Get unique categories from all tasks, filtering out empty/null/undefined values and normalizing
  const uniqueCategories = Array.from(
    new Set(
      allTasks
        .map(task => task.category)
        .filter(category => typeof category === "string" && category.trim().length > 0)
        .map(category => category.trim())
    )
  ).sort();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "Finance": "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200",
      "HR": "bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200", 
      "Dev": "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200",
      "Content": "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200",
      "Sales": "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200",
      "Meeting": "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
      "Communication": "bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, day: string, status: string) => {
    e.preventDefault();
    if (draggedTask && (draggedTask.dayOfWeek !== day || draggedTask.status !== status)) {
      updateTaskMutation.mutate({
        id: draggedTask.id,
        updates: { dayOfWeek: day, status: status }
      });
    }
    setDraggedTask(null);
  };

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedCalendarDate ? 'Daily Task Board' : 'Weekly Task Board'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 flex items-center">
            <i className="fas fa-calendar-alt mr-2 text-sm"></i>
            {selectedCalendarDate 
              ? selectedCalendarDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric' 
                })
              : `${new Date().toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric' 
                })} - Week View`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger 
                className="w-[180px] shadow-md" 
                data-testid="select-category-filter"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="category-option-all">
                  All Categories
                </SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    data-testid={`category-option-${category.toLowerCase()}`}
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            variant="outline"
            onClick={() => {
              const previousWeek = new Date();
              previousWeek.setDate(previousWeek.getDate() - 7);
              const prevWeekKey = getWeekKeyFromDate(previousWeek);
              
              carryForwardMutation.mutate({
                fromWeekKey: prevWeekKey,
                toWeekKey: currentWeekKey
              });
            }}
            disabled={carryForwardMutation.isPending}
            className="shadow-md hover:shadow-lg transition-all"
            data-testid="button-carry-forward"
          >
            {carryForwardMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carrying Forward...
              </>
            ) : (
              'Carry Forward Tasks'
            )}
          </Button>
          <Button 
            className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).openTaskModal) {
                (window as any).openTaskModal();
              }
            }}
            data-testid="button-add-task"
          >
            <Plus size={16} className="mr-2" />
            Add New Task
          </Button>
        </div>
      </div>

      {/* Empty State Check */}
      {allTasks.length === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600">
          <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
            <Plus className="h-12 w-12 text-gray-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Tasks Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get started by creating your first task. You can organize tasks by day of the week and track their progress.
          </p>
          <Button 
            className="bg-primary text-white hover:bg-primary/90 shadow-lg"
            onClick={() => {
              setNewTaskDay("monday");
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            Create Your First Task
          </Button>
        </div>
      )}

      {/* Task Board Grid - Now with horizontal scroll */}
      <div className={`overflow-x-auto ${allTasks.length === 0 ? 'hidden' : ''}`}>
        <div className="grid grid-cols-5 gap-4 min-w-[1000px]">
          {/* Days Column */}
          <div className="space-y-4">
            <div className="h-14 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg">
              Days
            </div>
            <div className="space-y-4">
              {/* Always show full week display with selected date highlighted */}
              {DAY_LABELS.map((dayLabel, index) => {
                const currentWeekDates = getCurrentWeekDates(undefined, selectedCalendarDate);
                const date = currentWeekDates[index];
                const today = new Date();
                const isToday = date.toDateString() === today.toDateString();
                const isSelectedDate = selectedCalendarDate && 
                  date.toDateString() === selectedCalendarDate.toDateString();
                
                return (
                  <div 
                    key={dayLabel}
                    className={`h-32 flex flex-col items-center justify-center font-medium rounded-lg border shadow-sm transition-all ${
                      isSelectedDate 
                        ? "text-gray-900 dark:text-white bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40" 
                        : isToday
                          ? "text-primary dark:text-primary bg-primary/5 dark:bg-primary/10 border-primary/50 dark:border-primary/60 font-bold"
                          : "text-gray-900 dark:text-white bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-1 text-sm font-semibold">
                      <Calendar size={12} />
                      <span className={isToday ? 'font-bold' : ''}>{dayLabel}</span>
                      {isToday && <span className="text-xs bg-primary text-white px-1 rounded-full">TODAY</span>}
                    </div>
                    <div className={`text-xs mt-1 ${isToday ? 'text-primary font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Task Columns */}
        {COLUMNS.map(column => (
          <div key={column.id} className="space-y-4">
            <div className={`h-14 flex items-center justify-center font-semibold text-gray-700 dark:text-gray-300 bg-${column.color}-50 dark:bg-${column.color}-900/30 rounded-lg border border-${column.color}-200 dark:border-${column.color}-800`}>
              <column.icon size={16} className={`mr-2 text-${column.color}-500`} />
              {column.label}
            </div>
            
            <div className="space-y-4">
              {/* Always show full week columns */}
              {DAYS.map((day, dayIndex) => {
                const currentWeekDates = getCurrentWeekDates(undefined, selectedCalendarDate);
                const date = currentWeekDates[dayIndex];
                const today = new Date();
                const isToday = date.toDateString() === today.toDateString();
                const isSelectedDate = selectedCalendarDate && 
                  date.toDateString() === selectedCalendarDate.toDateString();
                const dayTasks = getTasksByDayAndStatus(day, column.id);
                
                return (
                  <div 
                    key={`${column.id}-${day}`}
                    className={`h-32 rounded-lg border p-3 space-y-2 overflow-y-auto transition-all ${
                      isSelectedDate 
                        ? "bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary/40" 
                        : isToday
                          ? "bg-primary/3 dark:bg-primary/8 border-primary/40 dark:border-primary/50"
                          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, column.id)}
                  >
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDoubleClick={() => {
                          console.log('Double-click to edit task:', task.id, task.title);
                          setEditingTask(task);
                          setIsTaskModalOpen(true);
                        }}
                        className={`task-card bg-${column.color}-50 dark:bg-${column.color}-900/30 p-2 rounded border border-${column.color}-200 dark:border-${column.color}-800 cursor-move transition-all hover:shadow-md hover:-translate-y-1 group relative`}
                        title="Double-click to edit task"
                      >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTaskMutation.mutate(task.id);
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 hover:text-white rounded text-red-500"
                            title="Delete task"
                          >
                            <Trash2 size={12} />
                          </button>
                          
                          <div className={`font-medium text-sm text-gray-900 dark:text-white pr-6 ${task.status === 'completed' ? 'line-through opacity-75' : ''}`}>
                            {task.title}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="secondary" className={`text-xs ${getCategoryColor(task.category)}`}>
                              {task.category}
                            </Badge>
                            <i className={`fas fa-flag text-xs ${getPriorityColor(task.priority)}`}></i>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Task Button - Always visible at bottom of each cell */}
                      <Button 
                        onClick={() => {
                          console.log('Add task button clicked for day:', day);
                          setNewTaskDay(day);
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2 opacity-70 hover:opacity-100 transition-opacity text-xs"
                        title={`Add task for ${day}`}
                      >
                        <Plus size={12} className="mr-1" />
                        Add Task
                      </Button>
                    </div>
                  );
                })
              }
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => {
          console.log('TaskModal onClose called');
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
        defaultDay={newTaskDay}
      />
    </main>
  );
}
