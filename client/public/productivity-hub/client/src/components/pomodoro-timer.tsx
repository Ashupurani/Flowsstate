import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePomodoroStore } from "@/lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PomodoroTimer() {
  const {
    timeLeft,
    isRunning,
    currentSession,
    sessionType,
    endTime,
    startTimer,
    pauseTimer,
    setTimeLeft,
    incrementSession,
    getActualTimeLeft,
  } = usePomodoroStore();

  const [displayTime, setDisplayTime] = useState(timeLeft);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSessionMutation = useMutation({
    mutationFn: async (data: { duration: number; type: string }) => {
      return apiRequest("/api/pomodoro-sessions", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pomodoro-sessions"] });
    },
  });

  useEffect(() => {
    const updateDisplay = () => {
      const actual = getActualTimeLeft();
      setDisplayTime(actual);
      
      if (isRunning && actual <= 0) {
        pauseTimer();
        const duration = sessionType === 'focus' ? 1500 : sessionType === 'short_break' ? 300 : 900;
        createSessionMutation.mutate({ duration, type: sessionType });
        incrementSession();
        
        const nextType = currentSession % 4 === 0 ? 'long_break' : 
                        sessionType === 'focus' ? 'short_break' : 'focus';
        const nextDuration = nextType === 'focus' ? 1500 : nextType === 'short_break' ? 300 : 900;
        setTimeLeft(nextDuration);
        setDisplayTime(nextDuration);
        
        toast({
          title: sessionType === 'focus' ? "🎯 Focus Complete!" : "☕ Break Over!",
          description: nextType === 'focus' ? "Ready to focus again?" : "Time for a break!",
        });

        if (Notification.permission === 'granted') {
          new Notification(sessionType === 'focus' ? "Focus Complete!" : "Break Over!", {
            body: nextType === 'focus' ? "Ready to focus again?" : "Time for a break!",
            icon: '/favicon.png'
          });
        }
      }
    };

    updateDisplay();

    if (isRunning) {
      intervalRef.current = setInterval(updateDisplay, 1000);
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateDisplay();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, endTime, sessionType, currentSession, pauseTimer, setTimeLeft, incrementSession, toast, createSessionMutation, getActualTimeLeft]);

  useEffect(() => {
    if (!isRunning) {
      setDisplayTime(timeLeft);
    }
  }, [timeLeft, isRunning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handleReset = () => {
    pauseTimer();
    const defaultDuration = sessionType === 'focus' ? 1500 : sessionType === 'short_break' ? 300 : 900;
    setTimeLeft(defaultDuration);
    setDisplayTime(defaultDuration);
  };

  const switchSession = (type: 'focus' | 'short_break' | 'long_break') => {
    pauseTimer();
    const durations = { focus: 1500, short_break: 300, long_break: 900 };
    usePomodoroStore.setState({ sessionType: type, timeLeft: durations[type], endTime: null });
    setDisplayTime(durations[type]);
  };

  const isFocus = sessionType === 'focus';

  return (
    <div className={`rounded-xl px-4 py-2 shadow-lg flex items-center gap-3 ${
      isFocus 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
        : 'bg-gradient-to-r from-green-500 to-emerald-500'
    }`}>
      <div className="flex gap-1">
        <button
          onClick={() => switchSession('focus')}
          className={`p-1.5 rounded-lg transition-all ${
            isFocus 
              ? 'bg-white/30 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
          title="Focus Mode"
          data-testid="button-focus-mode"
        >
          <Target size={14} />
        </button>
        <button
          onClick={() => switchSession('short_break')}
          className={`p-1.5 rounded-lg transition-all ${
            !isFocus 
              ? 'bg-white/30 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
          title="Break Mode"
          data-testid="button-break-mode"
        >
          <Coffee size={14} />
        </button>
      </div>

      <div className="text-white text-center">
        <div className="text-xl font-bold font-mono leading-none" data-testid="text-timer">
          {formatTime(displayTime)}
        </div>
        <div className="text-[10px] opacity-80 uppercase tracking-wide">
          {isFocus ? 'Focus' : 'Break'}
        </div>
      </div>

      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayPause}
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
          data-testid="button-play-pause"
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleReset}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80"
          title="Reset"
          data-testid="button-reset"
        >
          <RotateCcw size={12} />
        </Button>
      </div>

      <div className="text-white/80 text-xs font-medium" data-testid="text-session-count">
        #{currentSession}
      </div>
    </div>
  );
}
