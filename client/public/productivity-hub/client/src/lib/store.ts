import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  currentSession: number;
  sessionType: 'focus' | 'short_break' | 'long_break';
  endTime: number | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimeLeft: (time: number) => void;
  incrementSession: () => void;
  getActualTimeLeft: () => number;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      timeLeft: 1500,
      isRunning: false,
      currentSession: 1,
      sessionType: 'focus',
      endTime: null,
      startTimer: () => {
        const { timeLeft } = get();
        set({ 
          isRunning: true, 
          endTime: Date.now() + timeLeft * 1000 
        });
      },
      pauseTimer: () => {
        const { endTime } = get();
        if (endTime) {
          const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
          set({ isRunning: false, timeLeft: remaining, endTime: null });
        } else {
          set({ isRunning: false, endTime: null });
        }
      },
      resetTimer: () => set({ timeLeft: 1500, isRunning: false, endTime: null }),
      setTimeLeft: (time) => set({ timeLeft: time, endTime: null }),
      incrementSession: () => set((state) => ({ 
        currentSession: state.currentSession + 1,
        sessionType: state.currentSession % 4 === 0 ? 'long_break' : 
                    state.sessionType === 'focus' ? 'short_break' : 'focus'
      })),
      getActualTimeLeft: () => {
        const { isRunning, endTime, timeLeft } = get();
        if (isRunning && endTime) {
          return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        }
        return timeLeft;
      },
    }),
    {
      name: 'pomodoro-storage',
    }
  )
);

interface CalendarState {
  currentMonth: Date;
  selectedDate: Date | null;
  weekStartDate: Date;
  setCurrentMonth: (month: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  setWeekStartDate: (date: Date) => void;
  getWeekKey: () => string;
  getCurrentWeekDates: () => Date[];
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
}

function getStartOfWeek(date: Date): Date {
  const startDate = new Date(date);
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Monday is start of week
  startDate.setDate(diff);
  startDate.setHours(0, 0, 0, 0);
  return startDate;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      currentMonth: new Date(),
      selectedDate: null,
      weekStartDate: getStartOfWeek(new Date()), // Always start with current week
      
      setCurrentMonth: (month) => set({ currentMonth: month }),
      setSelectedDate: (date) => {
        if (date) {
          const weekStart = getStartOfWeek(date);
          set({ selectedDate: date, weekStartDate: weekStart, currentMonth: date });
        } else {
          set({ selectedDate: date });
        }
      },
      setWeekStartDate: (date) => set({ weekStartDate: getStartOfWeek(date) }),
      
      getWeekKey: () => {
        const { weekStartDate } = get();
        return weekStartDate.toISOString().split('T')[0];
      },
      
      getCurrentWeekDates: () => {
        const { weekStartDate } = get();
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStartDate);
          date.setDate(weekStartDate.getDate() + i);
          dates.push(date);
        }
        return dates;
      },
      
      goToNextWeek: () => {
        const { weekStartDate } = get();
        const nextWeek = new Date(weekStartDate);
        nextWeek.setDate(weekStartDate.getDate() + 7);
        set({ weekStartDate: nextWeek, currentMonth: nextWeek });
      },
      
      goToPrevWeek: () => {
        const { weekStartDate } = get();
        const prevWeek = new Date(weekStartDate);
        prevWeek.setDate(weekStartDate.getDate() - 7);
        set({ weekStartDate: prevWeek, currentMonth: prevWeek });
      },
    }),
    {
      name: 'calendar-storage',
      // Custom serialization to handle Date objects
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          
          // Convert date strings back to Date objects
          if (data.state) {
            if (data.state.currentMonth) {
              data.state.currentMonth = new Date(data.state.currentMonth);
            }
            if (data.state.selectedDate) {
              data.state.selectedDate = new Date(data.state.selectedDate);
            }
            if (data.state.weekStartDate) {
              data.state.weekStartDate = new Date(data.state.weekStartDate);
            }
          }
          
          return data;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

interface LayoutState {
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftSidebarCollapsed: false,
      rightSidebarCollapsed: false,
      toggleLeftSidebar: () => set((state) => ({ leftSidebarCollapsed: !state.leftSidebarCollapsed })),
      toggleRightSidebar: () => set((state) => ({ rightSidebarCollapsed: !state.rightSidebarCollapsed })),
      setLeftSidebarCollapsed: (collapsed) => set({ leftSidebarCollapsed: collapsed }),
      setRightSidebarCollapsed: (collapsed) => set({ rightSidebarCollapsed: collapsed }),
    }),
    {
      name: 'layout-storage',
    }
  )
);
