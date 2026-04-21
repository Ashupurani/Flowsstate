import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCalendarStore, useLayoutStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import type { Task, Habit, HabitEntry, PomodoroSession } from "@shared/schema";

export default function CalendarSidebar() {
  const { currentMonth, setCurrentMonth, selectedDate, setSelectedDate, getCurrentWeekDates } = useCalendarStore();
  const { rightSidebarCollapsed, toggleRightSidebar } = useLayoutStore();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Listen for category filter changes from task board
  useEffect(() => {
    const handleCategoryChange = (event: CustomEvent) => {
      setActiveCategory(event.detail.category);
    };
    window.addEventListener('categoryFilterChanged', handleCategoryChange as EventListener);
    return () => {
      window.removeEventListener('categoryFilterChanged', handleCategoryChange as EventListener);
    };
  }, []);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: habitsData = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Deduplicate habits to avoid inflated totals
  const habits = habitsData.filter((habit, index, self) => 
    index === self.findIndex((h) => h.id === habit.id)
  );

  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({
    queryKey: ["/api/habit-entries"],
  });

  const { data: pomodoroSessions = [] } = useQuery<PomodoroSession[]>({
    queryKey: ["/api/pomodoro-sessions"],
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    // Ensure currentMonth is a valid Date object
    const currentDate = currentMonth instanceof Date ? currentMonth : new Date(currentMonth);
    const newMonth = new Date(currentDate);
    if (direction === 'prev') {
      newMonth.setMonth(currentDate.getMonth() - 1);
    } else {
      newMonth.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = () => {
    // Ensure currentMonth is a valid Date object before calling date methods
    const currentDate = currentMonth instanceof Date ? currentMonth : new Date(currentMonth);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonth.getDate() - i)
      });
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i)
      });
    }

    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i)
      });
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasEvents = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.some(task => {
      // Check if there are any tasks for this date
      return task.createdAt && new Date(task.createdAt).toISOString().split('T')[0] === dateStr;
    }) || habitEntries.some(entry => entry.date === dateStr);
  };

  const getCompletedTasksCount = () => {
    return tasks.filter(task => task.status === 'completed').length;
  };

  const getTotalTasksCount = () => {
    return tasks.length;
  };

  const getCompletedHabitsCount = () => {
    // Get current week dates and filter entries for this week only
    const weekDates = getCurrentWeekDates();
    if (!weekDates || weekDates.length === 0) return 0;
    
    const weekDateStrings = weekDates.map(date => date.toISOString().split('T')[0]);
    return habitEntries.filter(entry => 
      entry.completed && weekDateStrings.includes(entry.date)
    ).length;
  };

  const getTotalHabitsCount = () => {
    // Use actual habits count × 7 days per week
    if (!habits || habits.length === 0) return 0;
    return habits.length * 7;
  };

  const getFocusSessionsCount = () => {
    return pomodoroSessions.filter(session => session.type === 'focus').length;
  };

  const getProductivityScore = () => {
    const taskScore = getTotalTasksCount() > 0 ? (getCompletedTasksCount() / getTotalTasksCount()) * 40 : 0;
    const habitScore = getTotalHabitsCount() > 0 ? (getCompletedHabitsCount() / getTotalHabitsCount()) * 40 : 0;
    const focusScore = Math.min(getFocusSessionsCount() * 5, 20); // 5 points per session, max 20
    
    return Math.round(taskScore + habitScore + focusScore);
  };

  const days = getDaysInMonth();
  // Ensure currentMonth is a valid Date object
  const currentDate = currentMonth instanceof Date ? currentMonth : new Date(currentMonth);
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (rightSidebarCollapsed) {
    return (
      <div className="fixed right-0 top-20 z-40 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-l-lg shadow-lg">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleRightSidebar}
          className="w-10 h-10 rounded-l-lg rounded-r-none hover:bg-primary/10 transition-colors"
          title="Show Calendar Sidebar"
        >
          <ChevronLeft size={16} className="rotate-180 text-primary" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-border overflow-y-auto shadow-sm">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground tracking-tight">{monthYear}</h2>
          <div className="flex space-x-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigateMonth('prev')}
              className="w-8 h-8"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigateMonth('next')}
              className="w-8 h-8"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleRightSidebar}
              className="w-8 h-8"
            >
              <ChevronRight size={16} className="hidden md:block" />
              <X size={16} className="block md:hidden" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {/* Day Headers */}
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedDate(day.fullDate);
                // Dispatch event to update dashboard based on selected date
                window.dispatchEvent(new CustomEvent('calendarDateChanged', { 
                  detail: { 
                    date: day.fullDate,
                    dayOfWeek: day.fullDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
                  } 
                }));
              }}
              className={`w-8 h-8 flex items-center justify-center text-sm rounded cursor-pointer transition-colors relative ${
                isToday(day.fullDate) 
                  ? 'bg-primary text-white' 
                  : day.isCurrentMonth 
                    ? 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700' 
                    : 'text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {day.date}
              {hasEvents(day.fullDate) && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-warning rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">This Week</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tasks Completed:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getCompletedTasksCount()}/{getTotalTasksCount()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Habits Completed:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getCompletedHabitsCount()}/{getTotalHabitsCount()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Focus Sessions:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getFocusSessionsCount()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-success to-primary rounded-lg p-4 text-white">
            <h3 className="font-semibold mb-2">Productivity Score</h3>
            <div className="text-2xl font-bold">{getProductivityScore()}%</div>
            <div className="text-sm opacity-90">Keep up the great work!</div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              {activeCategory === 'all' ? 'Top Priorities' : `${activeCategory} Tasks`}
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(() => {
                const incompleteTasks = tasks.filter(task => task.status !== 'completed');
                
                // Priority order for sorting
                const priorityOrder: Record<string, number> = { 'high': 0, 'medium': 1, 'low': 2 };
                
                // Category color mapping
                const getCategoryColor = (category: string) => {
                  const colors: Record<string, string> = {
                    'Dev': 'bg-blue-500',
                    'Finance': 'bg-green-500',
                    'HR': 'bg-purple-500',
                    'Content': 'bg-orange-500',
                    'Sales': 'bg-pink-500',
                    'Meeting': 'bg-yellow-500',
                    'Communication': 'bg-cyan-500',
                    'MLF': 'bg-indigo-500',
                  };
                  return colors[category] || 'bg-gray-500';
                };
                
                const getPriorityBadge = (priority: string) => {
                  if (priority === 'high') return <span className="ml-1 text-xs text-red-500">●</span>;
                  if (priority === 'medium') return <span className="ml-1 text-xs text-yellow-500">●</span>;
                  return null;
                };
                
                // CASE 1: Specific category selected - show top 3 from that category
                if (activeCategory !== 'all') {
                  const categoryTasks = incompleteTasks
                    .filter(task => task.category === activeCategory)
                    .sort((a, b) => (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2))
                    .slice(0, 3);
                  
                  if (categoryTasks.length === 0) {
                    return <div className="text-sm text-gray-500 dark:text-gray-400">No tasks in {activeCategory}</div>;
                  }
                  
                  return (
                    <div className="space-y-2">
                      {categoryTasks.map((task, idx) => (
                        <div key={task.id} className="flex items-center text-sm gap-2">
                          <span className="text-gray-400 text-xs w-4">{idx + 1}.</span>
                          <span className="text-gray-900 dark:text-white truncate flex-1">{task.title}</span>
                          {getPriorityBadge(task.priority || 'low')}
                        </div>
                      ))}
                    </div>
                  );
                }
                
                // CASE 2: All categories - show top 3 from 2 most important categories
                const tasksByCategory = incompleteTasks.reduce((acc, task) => {
                  const category = task.category || 'Uncategorized';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(task);
                  return acc;
                }, {} as Record<string, Task[]>);
                
                // Rank categories by importance (high priority task count)
                const categoryImportance = Object.entries(tasksByCategory).map(([cat, catTasks]) => ({
                  category: cat,
                  tasks: catTasks,
                  highPriorityCount: catTasks.filter(t => t.priority === 'high').length,
                  totalCount: catTasks.length
                })).sort((a, b) => {
                  // Sort by high priority count first, then by total count
                  if (b.highPriorityCount !== a.highPriorityCount) {
                    return b.highPriorityCount - a.highPriorityCount;
                  }
                  return b.totalCount - a.totalCount;
                });
                
                const topCategories = categoryImportance.slice(0, 2);
                
                if (topCategories.length === 0) {
                  return <div className="text-sm text-gray-500 dark:text-gray-400">No upcoming tasks</div>;
                }
                
                return topCategories.map(({ category, tasks: catTasks }) => {
                  const sortedTasks = catTasks
                    .sort((a, b) => (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2))
                    .slice(0, 3);
                    
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getCategoryColor(category)}`}></div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                          {category}
                        </span>
                      </div>
                      <div className="pl-4 space-y-1">
                        {sortedTasks.map((task, idx) => (
                          <div key={task.id} className="flex items-center text-sm gap-1">
                            <span className="text-gray-400 text-xs w-3">{idx + 1}.</span>
                            <span className="text-gray-900 dark:text-white truncate flex-1">{task.title}</span>
                            {getPriorityBadge(task.priority || 'low')}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
