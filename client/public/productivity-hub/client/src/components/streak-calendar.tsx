import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Task, HabitEntry, PomodoroSession } from '@shared/schema';
import { Flame } from 'lucide-react';

interface DayActivity {
  date: string;
  tasksCompleted: number;
  habitsCompleted: number;
  focusMinutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export default function StreakCalendar() {
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ['/api/tasks'] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ['/api/habit-entries'] });
  const { data: pomodoroSessions = [] } = useQuery<PomodoroSession[]>({ queryKey: ['/api/pomodoro-sessions'] });

  const activityData = useMemo(() => {
    const days: DayActivity[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const tasksCompleted = tasks.filter(t => 
        t.status === 'completed' && 
        t.createdAt && new Date(t.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const habitsCompleted = habitEntries.filter(e => 
        e.date === dateStr && e.completed
      ).length;
      
      const focusMinutes = pomodoroSessions
        .filter(s => {
          if (!s.completedAt) return false;
          const sessionDate = new Date(s.completedAt).toISOString().split('T')[0];
          return sessionDate === dateStr && s.type === 'focus';
        })
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      
      const totalActivity = tasksCompleted + habitsCompleted + Math.floor(focusMinutes / 30);
      
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (totalActivity >= 10) level = 4;
      else if (totalActivity >= 6) level = 3;
      else if (totalActivity >= 3) level = 2;
      else if (totalActivity >= 1) level = 1;
      
      days.push({ date: dateStr, tasksCompleted, habitsCompleted, focusMinutes, level });
    }
    
    return days;
  }, [tasks, habitEntries, pomodoroSessions]);

  const weeks = useMemo(() => {
    const result: DayActivity[][] = [];
    for (let i = 0; i < activityData.length; i += 7) {
      result.push(activityData.slice(i, i + 7));
    }
    return result;
  }, [activityData]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = activityData.length - 1; i >= 0; i--) {
      if (activityData[i].level > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [activityData]);

  const totalActiveDays = activityData.filter(d => d.level > 0).length;

  const levelColors = {
    0: 'bg-gray-100 dark:bg-slate-700',
    1: 'bg-green-200 dark:bg-green-900',
    2: 'bg-green-400 dark:bg-green-700',
    3: 'bg-green-500 dark:bg-green-500',
    4: 'bg-green-600 dark:bg-green-400',
  };

  const monthLabels = useMemo(() => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = '';
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0];
      if (firstDayOfWeek) {
        const date = new Date(firstDayOfWeek.date);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        if (month !== lastMonth) {
          labels.push({ month, index: weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [weeks]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Activity Streak
          </span>
          <div className="flex items-center gap-4 text-sm font-normal">
            <span className="text-muted-foreground">
              {currentStreak} day streak
            </span>
            <span className="text-muted-foreground">
              {totalActiveDays} active days
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="relative min-w-fit">
            <div className="flex text-xs text-muted-foreground mb-1 ml-6">
              {monthLabels.map((label, i) => (
                <div 
                  key={i} 
                  style={{ marginLeft: i === 0 ? 0 : `${(label.index - (monthLabels[i-1]?.index || 0)) * 12 - 24}px` }}
                >
                  {label.month}
                </div>
              ))}
            </div>
            
            <div className="flex gap-1">
              <div className="flex flex-col text-xs text-muted-foreground justify-around pr-1 h-[84px]">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>
              
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => (
                      <Tooltip key={`${weekIndex}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <div 
                            className={`w-[10px] h-[10px] rounded-sm ${levelColors[day.level]} cursor-pointer transition-transform hover:scale-125`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</p>
                          <p className="text-xs text-muted-foreground">
                            {day.tasksCompleted} tasks • {day.habitsCompleted} habits • {day.focusMinutes}m focus
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground justify-end">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map(level => (
                <div 
                  key={level} 
                  className={`w-[10px] h-[10px] rounded-sm ${levelColors[level as 0|1|2|3|4]}`} 
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
