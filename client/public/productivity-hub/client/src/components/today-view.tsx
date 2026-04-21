import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useCalendarStore } from '@/lib/store';
import { useFlowScore } from '@/hooks/use-flow-score';
import { CheckCircle2, Circle, Target, Flame, Clock, TrendingUp } from 'lucide-react';
import type { Task, Habit, HabitEntry } from '@shared/schema';

export default function TodayView() {
  const queryClient = useQueryClient();
  const selectedDate = useCalendarStore(state => state.selectedDate);
  const flowScore = useFlowScore();
  
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ['/api/tasks'] });
  const { data: habits = [] } = useQuery<Habit[]>({ queryKey: ['/api/habits'] });
  const { data: habitEntries = [] } = useQuery<HabitEntry[]>({ queryKey: ['/api/habit-entries'] });

  const today = useMemo(() => {
    const date = selectedDate || new Date();
    return {
      dateStr: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      displayDate: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }, [selectedDate]);

  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.dayOfWeek === today.dayOfWeek);
  }, [tasks, today.dayOfWeek]);

  const todayHabits = useMemo(() => {
    return habits.map(habit => {
      const entry = habitEntries.find(e => 
        e.habitId === habit.id && e.date === today.dateStr
      );
      return { ...habit, completed: entry?.completed || false, entryId: entry?.id };
    });
  }, [habits, habitEntries, today.dateStr]);

  const completedTasksCount = todayTasks.filter(t => t.status === 'completed').length;
  const completedHabitsCount = todayHabits.filter(h => h.completed).length;

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number; completed: boolean }) => {
      return apiRequest('/api/habit-entries', {
        method: 'POST',
        body: JSON.stringify({
          habitId,
          date: today.dateStr,
          completed,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habit-entries'] });
    },
  });

  const priorityColors: Record<string, string> = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{today.displayDate}</h2>
          <p className="text-muted-foreground">Your daily productivity snapshot</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{flowScore.score}</div>
            <div className="text-xs text-muted-foreground">FlowScore</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedTasksCount}/{todayTasks.length}</div>
                <div className="text-xs text-muted-foreground">Tasks Done</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedHabitsCount}/{todayHabits.length}</div>
                <div className="text-xs text-muted-foreground">Habits Done</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{flowScore.streakMultiplier.toFixed(1)}x</div>
                <div className="text-xs text-muted-foreground">Streak Bonus</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{flowScore.focusMinutes}m</div>
                <div className="text-xs text-muted-foreground">Focus Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                Today's Tasks
              </span>
              <Badge variant="outline">{completedTasksCount}/{todayTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {todayTasks.length > 0 ? (
              todayTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    task.status === 'completed' ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={(checked) => {
                      updateTaskMutation.mutate({
                        id: task.id,
                        status: checked ? 'completed' : 'proposed',
                      });
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{task.category}</Badge>
                      <span className={`text-xs ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No tasks for today</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Today's Habits
              </span>
              <Badge variant="outline">{completedHabitsCount}/{todayHabits.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {todayHabits.length > 0 ? (
              todayHabits.map(habit => (
                <div 
                  key={habit.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    habit.completed ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={habit.completed}
                    onCheckedChange={(checked) => {
                      toggleHabitMutation.mutate({
                        habitId: habit.id,
                        completed: !!checked,
                      });
                    }}
                  />
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: habit.color + '20' }}
                  >
                    <i className={habit.icon} style={{ color: habit.color }} />
                  </div>
                  <span className={`font-medium ${habit.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {habit.name}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No habits tracked</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Tasks ({Math.round(flowScore.tasksScore)}%)</span>
              <span>{completedTasksCount}/{todayTasks.length} completed</span>
            </div>
            <Progress value={flowScore.tasksScore} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Habits ({Math.round(flowScore.habitsScore)}%)</span>
              <span>{completedHabitsCount}/{todayHabits.length} completed</span>
            </div>
            <Progress value={flowScore.habitsScore} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Focus Time ({Math.round(flowScore.focusScore)}%)</span>
              <span>{flowScore.focusMinutes}/{flowScore.focusGoalMinutes} minutes</span>
            </div>
            <Progress value={flowScore.focusScore} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
