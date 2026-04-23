import { LayoutList, CalendarDays, BarChart3, Target, Home, LogOut, ChevronLeft, ChevronRight, Zap, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useLayoutStore } from "@/lib/store";
import { useState, useEffect } from "react";
import PomodoroTimer from "@/components/pomodoro-timer";
import SettingsDialog from "@/components/settings-dialog";
import SmartNotifications from "@/components/smart-notifications";
import SyncIndicator from "@/components/sync-indicator";
import { FlowScoreBadge } from "@/components/daily-flow-widget";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { leftSidebarCollapsed, rightSidebarCollapsed, toggleLeftSidebar, toggleRightSidebar } = useLayoutStore();
  const [location] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Load profile photo from localStorage
    const savedPhoto = localStorage.getItem("profilePhoto");
    if (savedPhoto) setProfilePhoto(savedPhoto);

    // Listen for profile photo updates
    const handleStorageChange = () => {
      const photo = localStorage.getItem("profilePhoto");
      setProfilePhoto(photo);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    const handlePhotoUpdate = () => {
      const photo = localStorage.getItem("profilePhoto");
      setProfilePhoto(photo);
    };
    window.addEventListener('profilePhotoUpdated', handlePhotoUpdate);

    const handleCalendarDateChange = (event: CustomEvent) => {
      setSelectedDate(event.detail.date);
    };

    window.addEventListener('calendarDateChanged', handleCalendarDateChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profilePhotoUpdated', handlePhotoUpdate);
      window.removeEventListener('calendarDateChanged', handleCalendarDateChange as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    try {
      // Call logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and redirect regardless of API call result
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between min-h-[60px]">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-4 md:space-x-6 flex-1 min-w-0">
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
              <img 
                src="/favicon.png" 
                alt="Productivity Hub Logo" 
                className="w-10 h-10 flex-shrink-0 object-contain"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  Productivity Hub
                </h1>
                {selectedDate && (
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
            </div>
            
            {/* Tab Navigation */}
            <nav className="hidden md:flex items-center bg-muted/50 rounded-lg p-1 flex-shrink-0">
              <Link href="/">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    location === "/" 
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Home size={16} />
                  <span>Dashboard</span>
                </button>
              </Link>
              <Link href="/today">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    location === "/today" 
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Sun size={16} />
                  <span>Today</span>
                </button>
              </Link>
              <Link href="/analytics">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    location === "/analytics" 
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <BarChart3 size={16} />
                  <span>Analytics</span>
                </button>
              </Link>
              <Link href="/goals">
                <button 
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    location === "/goals" 
                      ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <Target size={16} />
                  <span>Goals</span>
                </button>
              </Link>
            </nav>
          </div>

          {/* Center Section - FlowScore + Pomodoro Timer + Sync */}
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
            <FlowScoreBadge />
            <PomodoroTimer />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new Event('openFocusMode'))}
              className="flex items-center gap-1 px-2 h-7 rounded-full bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
            >
              <Zap size={12} />
              <span className="text-xs font-medium hidden 2xl:inline">Focus</span>
            </Button>
            <SyncIndicator />
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Sidebar Controls - Only show on Dashboard */}
            {location === "/" && (
              <div className="hidden lg:flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLeftSidebar}
                  className={`
                    flex items-center gap-1 px-2 h-7 rounded-full
                    transition-all duration-200 ease-in-out
                    ${leftSidebarCollapsed 
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20' 
                      : 'bg-violet-500 border-violet-500 text-white hover:bg-violet-600'
                    }
                  `}
                  data-testid="button-toggle-habits"
                  title="Toggle Habits Sidebar"
                >
                  <LayoutList size={12} />
                  <span className="text-xs font-medium hidden 2xl:inline">Habits</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRightSidebar}
                  className={`
                    flex items-center gap-1 px-2 h-7 rounded-full
                    transition-all duration-200 ease-in-out
                    ${rightSidebarCollapsed 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20' 
                      : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600'
                    }
                  `}
                  data-testid="button-toggle-calendar"
                  title="Toggle Calendar Sidebar"
                >
                  <CalendarDays size={12} />
                  <span className="text-xs font-medium hidden 2xl:inline">Calendar</span>
                </Button>
              </div>
            )}

            {/* Notifications */}
            <div className="hidden sm:block">
              <SmartNotifications />
            </div>

            {/* Settings */}
            <SettingsDialog />

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profilePhoto || (user as any).profileImageUrl || ""} 
                        alt={(user as any).name || (user as any).email || ""} 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(user as any).name ? (user as any).name.charAt(0).toUpperCase() : 
                         (user as any).email ? (user as any).email.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {(user as any).name && (
                        <p className="font-medium">{(user as any).name}</p>
                      )}
                      {(user as any).email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {(user as any).email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
