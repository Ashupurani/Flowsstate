import { useEffect, useState } from "react";
import { useLayoutStore } from "@/lib/store";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { leftSidebarCollapsed, rightSidebarCollapsed } = useLayoutStore();
  const [contentWidth, setContentWidth] = useState('auto');

  useEffect(() => {
    // Calculate content width based on sidebar states
    const updateContentWidth = () => {
      const leftWidth = leftSidebarCollapsed ? 0 : 320; // 80 * 4 = 320px (w-80)
      const rightWidth = rightSidebarCollapsed ? 0 : 320; // 80 * 4 = 320px (w-80)
      const headerHeight = 80; // Approximate header height
      
      const availableWidth = window.innerWidth - leftWidth - rightWidth;
      setContentWidth(`${availableWidth}px`);
    };

    updateContentWidth();
    window.addEventListener('resize', updateContentWidth);
    
    return () => {
      window.removeEventListener('resize', updateContentWidth);
    };
  }, [leftSidebarCollapsed, rightSidebarCollapsed]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      {children}
      
      {/* Custom styles for responsive content */}
      <style>{`
        .task-board-container {
          width: ${contentWidth};
          transition: width 0.3s ease-in-out;
          ${!leftSidebarCollapsed && !rightSidebarCollapsed ? 'overflow-x: auto;' : ''}
        }
        
        @media (max-width: 1024px) {
          .task-board-container {
            width: 100% !important;
            overflow-x: auto;
          }
        }
        
        /* Smooth transitions for sidebar animations */
        .sidebar-transition {
          transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;
        }
        
        /* Custom scrollbar for horizontal scroll */
        .task-board-container::-webkit-scrollbar {
          height: 8px;
        }
        
        .task-board-container::-webkit-scrollbar-track {
          background: var(--background);
          border-radius: 4px;
        }
        
        .task-board-container::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        
        .task-board-container::-webkit-scrollbar-thumb:hover {
          background: var(--muted-foreground);
        }
        
        /* Grid layout adjustments */
        .task-columns {
          min-width: 1200px; /* Minimum width to accommodate all columns */
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        
        @media (max-width: 1400px) {
          .task-columns {
            min-width: 1000px;
            gap: 1rem;
          }
        }
        
        @media (max-width: 1200px) {
          .task-columns {
            min-width: 900px;
            gap: 0.75rem;
          }
        }
        
        /* Content-responsive habit sidebar */
        .habit-sidebar {
          ${leftSidebarCollapsed ? 'width: 0; overflow: hidden;' : 'width: 320px;'}
          transition: width 0.3s ease-in-out;
        }
        
        /* Content-responsive calendar sidebar */
        .calendar-sidebar {
          ${rightSidebarCollapsed ? 'width: 0; overflow: hidden;' : 'width: 320px;'}
          transition: width 0.3s ease-in-out;
        }
        
        /* Dynamic padding for main content based on available space */
        .main-content {
          padding: ${!leftSidebarCollapsed && !rightSidebarCollapsed ? '1rem' : '1.5rem'};
          transition: padding 0.3s ease-in-out;
        }
        
        /* Responsive text sizes based on available space */
        @media (max-width: 1400px) {
          .task-card h3 {
            font-size: 0.9rem;
          }
          
          .task-card p {
            font-size: 0.8rem;
          }
        }
        
        /* Auto-adjusting margin for pomodoro timer */
        .pomodoro-timer {
          ${!leftSidebarCollapsed && !rightSidebarCollapsed ? 'margin: 0 2rem;' : 'margin: 0 1rem;'}
          transition: margin 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}