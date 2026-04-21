import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useCalendarStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckSquare, Target, Clock, Command } from 'lucide-react';

type QuickAddMode = 'task' | 'habit' | 'pomodoro';

export default function QuickAddDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<QuickAddMode>('task');
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const getWeekKey = useCalendarStore(state => state.getWeekKey);
  const selectedDate = useCalendarStore(state => state.selectedDate);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(true);
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getDayOfWeek = () => {
    const date = selectedDate || new Date();
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; dayOfWeek: string; weekKey: string }) => {
      return apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          category: 'general',
          priority: 'medium',
          status: 'proposed',
          dayOfWeek: data.dayOfWeek,
          weekKey: data.weekKey,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Task added!', description: title });
      setTitle('');
      setOpen(false);
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return apiRequest('/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          icon: '✓',
          color: '#8b5cf6',
          frequency: 'daily',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      toast({ title: 'Habit created!', description: title });
      setTitle('');
      setOpen(false);
    },
  });

  const startPomodoroMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/pomodoro-sessions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'focus',
          duration: 25,
          completedAt: new Date().toISOString(),
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pomodoro-sessions'] });
      toast({ title: 'Focus session started!', description: '25 minutes of deep work' });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'task' && title.trim()) {
      createTaskMutation.mutate({
        title: title.trim(),
        dayOfWeek: getDayOfWeek(),
        weekKey: getWeekKey(),
      });
    } else if (mode === 'habit' && title.trim()) {
      createHabitMutation.mutate({ name: title.trim() });
    } else if (mode === 'pomodoro') {
      startPomodoroMutation.mutate();
    }
  };

  const isPending = createTaskMutation.isPending || createHabitMutation.isPending || startPomodoroMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Add
            <Badge variant="outline" className="ml-auto text-xs">
              <Command className="w-3 h-3 mr-1" />K
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === 'task' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('task')}
            className="flex-1"
          >
            <CheckSquare className="w-4 h-4 mr-1" />
            Task
          </Button>
          <Button
            type="button"
            variant={mode === 'habit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('habit')}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-1" />
            Habit
          </Button>
          <Button
            type="button"
            variant={mode === 'pomodoro' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('pomodoro')}
            className="flex-1"
          >
            <Clock className="w-4 h-4 mr-1" />
            Focus
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode !== 'pomodoro' ? (
            <div className="space-y-4">
              <Input
                placeholder={mode === 'task' ? 'What needs to be done?' : 'New habit name...'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                disabled={isPending}
              />
              <div className="flex justify-between items-center">
                {mode === 'task' && (
                  <span className="text-sm text-muted-foreground">
                    Adding to {getDayOfWeek()}
                  </span>
                )}
                <Button type="submit" disabled={!title.trim() || isPending} className="ml-auto">
                  {isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                Start a 25-minute focus session to boost your FlowScore
              </p>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Starting...' : 'Start Focus Session'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
