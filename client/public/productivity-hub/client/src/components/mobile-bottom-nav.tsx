import { Home, Calendar, BarChart3, Users, Menu, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useLayoutStore } from "@/lib/store";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { toggleLeftSidebar, toggleRightSidebar } = useLayoutStore();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { href: "/", icon: Sun, label: "Today" },
    { href: "/dashboard", icon: Home, label: "Board" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/goals", icon: Users, label: "Goals" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-2 flex justify-around items-center md:hidden z-50">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={location === item.href ? "default" : "ghost"}
            size="sm"
            className="flex flex-col items-center space-y-1 h-auto py-2 px-2 min-w-0"
          >
            <item.icon size={16} />
            <span className="text-xs leading-tight">{item.label}</span>
          </Button>
        </Link>
      ))}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLeftSidebar}
        className="flex flex-col items-center space-y-1 h-auto py-2 px-2 min-w-0"
      >
        <Menu size={16} />
        <span className="text-xs leading-tight">Habits</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleRightSidebar}
        className="flex flex-col items-center space-y-1 h-auto py-2 px-2 min-w-0"
      >
        <Calendar size={16} />
        <span className="text-xs leading-tight">Calendar</span>
      </Button>
    </div>
  );
}
