import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePomodoroStore, useLayoutStore } from '@/lib/store';
import { X, Play, Pause, RotateCcw, CheckCircle2, Zap } from 'lucide-react';
import type { Task } from '@shared/schema';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask?: Task | null;
}

export default function FocusMode({ isOpen, onClose, selectedTask }: FocusModeProps) {
  const { 
    timeLeft, 
    isRunning, 
    sessionType, 
    startTimer, 
    pauseTimer, 
    resetTimer 
  } = usePomodoroStore();
  
  const { setLeftSidebarCollapsed, setRightSidebarCollapsed } = useLayoutStore();
  
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ['/api/tasks'] });
  
  const [focusTask, setFocusTask] = useState<Task | null>(selectedTask || null);

  useEffect(() => {
    if (isOpen) {
      setLeftSidebarCollapsed(true);
      setRightSidebarCollapsed(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, setLeftSidebarCollapsed, setRightSidebarCollapsed]);

  useEffect(() => {
    if (selectedTask) {
      setFocusTask(selectedTask);
    }
  }, [selectedTask]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = sessionType === 'focus' ? 25 * 60 : sessionType === 'short_break' ? 5 * 60 : 15 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const inProgressTasks = tasks.filter(t => t.status === 'in-progress' || t.status === 'proposed');
  const highPriorityTasks = inProgressTasks.filter(t => t.priority === 'high').slice(0, 3);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="max-w-2xl w-full mx-auto px-6 text-center space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-purple-300">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              {sessionType === 'focus' ? 'Deep Focus' : sessionType === 'short_break' ? 'Short Break' : 'Long Break'}
            </span>
          </div>
          
          <div className="text-8xl font-bold text-white tracking-tight">
            {formatTime(timeLeft)}
          </div>
          
          <Progress value={progress} className="h-2 w-64 mx-auto bg-white/20" />
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={resetTimer}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          
          <Button
            size="lg"
            onClick={isRunning ? pauseTimer : startTimer}
            className={`w-20 h-20 rounded-full text-2xl ${
              isRunning 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            onClick={onClose}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Exit
          </Button>
        </div>

        {focusTask ? (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
                <div className="text-left flex-1">
                  <p className="font-medium text-lg">{focusTask.title}</p>
                  <p className="text-sm text-white/60">
                    {focusTask.category} • {focusTask.priority} priority
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : highPriorityTasks.length > 0 ? (
          <div className="space-y-3">
            <p className="text-white/60 text-sm">Select a task to focus on:</p>
            {highPriorityTasks.map(task => (
              <Card 
                key={task.id} 
                className="bg-white/10 border-white/20 text-white cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => setFocusTask(task)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    <span>{task.title}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-white/60">No tasks selected. Focus on your breath and work.</p>
        )}

        <div className="pt-8 text-white/40 text-sm">
          Press <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> to exit focus mode
        </div>
      </div>
    </div>
  );
}
