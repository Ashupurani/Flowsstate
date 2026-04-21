import { useEffect, useRef } from 'react';
import { useCalendarStore } from '@/lib/store';
import { queryClient } from '@/lib/queryClient';

export function useDayChange() {
  const lastDateRef = useRef<string>(new Date().toISOString().split('T')[0]);
  const setSelectedDate = useCalendarStore(state => state.setSelectedDate);
  const setWeekStartDate = useCalendarStore(state => state.setWeekStartDate);

  useEffect(() => {
    const checkDayChange = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (currentDate !== lastDateRef.current) {
        console.log('🌅 Day changed! Resetting to today:', currentDate);
        lastDateRef.current = currentDate;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(today);
        weekStart.setDate(diff);
        
        setSelectedDate(today);
        setWeekStartDate(weekStart);
        
        queryClient.invalidateQueries();
        
        window.dispatchEvent(new CustomEvent('dayChanged', { detail: { date: today } }));
      }
    };

    checkDayChange();

    const interval = setInterval(checkDayChange, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDayChange();
      }
    };
    
    const handleFocus = () => {
      checkDayChange();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [setSelectedDate, setWeekStartDate]);
}
