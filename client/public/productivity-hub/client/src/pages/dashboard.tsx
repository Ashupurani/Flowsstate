import { useEffect, useState } from "react";
import Header from "@/components/header";
import HabitSidebar from "@/components/habit-sidebar";
import TaskBoard from "@/components/task-board";
import CalendarSidebar from "@/components/calendar-sidebar";
import TaskModal from "@/components/task-modal";
import CollapsibleAIInsights from "@/components/collapsible-ai-insights";
import MySpaceTasks from "@/components/my-space-tasks";
import PWAInstall from "@/components/pwa-install";
import Achievements from "@/components/achievements";
import DailyFlowWidget from "@/components/daily-flow-widget";
import FocusMode from "@/components/focus-mode";
import TaskTemplates from "@/components/task-templates";
import { useMicroWins } from "@/hooks/use-micro-wins";
import { useAuth } from "@/hooks/useAuth";

import MobileBottomNav from "@/components/mobile-bottom-nav";
import { useLayoutStore } from "@/lib/store";

export default function Dashboard() {
  const { leftSidebarCollapsed, rightSidebarCollapsed } = useLayoutStore();
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const { user } = useAuth();

  // Enable micro-win toast notifications
  useMicroWins();

  useEffect(() => {
    const firstName = user?.name?.split(" ")[0] || "Your";
    document.title = `Flowsstate - ${firstName}'s Personal Dashboard`;
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusModeOpen) {
        setFocusModeOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setFocusModeOpen(true);
      }
    };
    
    const handleFocusModeOpen = () => setFocusModeOpen(true);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openFocusMode', handleFocusModeOpen);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openFocusMode', handleFocusModeOpen);
    };
  }, [focusModeOpen]);

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        <div className={`desktop-sidebar transition-all duration-300 ease-in-out ${
          leftSidebarCollapsed ? 'w-0' : 'w-80'
        } flex-shrink-0`}>
          <HabitSidebar />
        </div>
        
        <div className="flex-1 overflow-x-auto task-board-container">
          <div className="main-content p-6">
            {/* Daily Flow Briefing/Recap - Shows in morning and evening */}
            <div className="mb-4">
              <DailyFlowWidget />
            </div>
            
            <div className="mb-6 flex justify-between items-center">
              <div className="flex space-x-3">
                <Achievements />
                <TaskTemplates />
              </div>
            </div>
            <div className="my-6">
              <TaskBoard />
            </div>
            <div className="space-y-6 mt-8">
              <MySpaceTasks />
              <CollapsibleAIInsights />
            </div>
          </div>
        </div>
        
        <div className={`desktop-sidebar transition-all duration-300 ease-in-out ${
          rightSidebarCollapsed ? 'w-0' : 'w-80'
        } flex-shrink-0`}>
          <CalendarSidebar />
        </div>
      </div>

      {/* Mobile Bottom Navigation - Only show on mobile */}
      <MobileBottomNav />

      <TaskModal />
      <PWAInstall />
      <FocusMode isOpen={focusModeOpen} onClose={() => setFocusModeOpen(false)} />
    </div>
  );
}
