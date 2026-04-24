import { useEffect } from "react";
import Header from "@/components/header";
import TodayView from "@/components/today-view";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import { useMicroWins } from "@/hooks/use-micro-wins";
import GuidedOnboarding from "@/components/guided-onboarding";

export default function Today() {
  useMicroWins();

  useEffect(() => {
    document.title = "Today - Productivity Hub";
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen font-sans">
      <Header />
      <main className="max-w-6xl mx-auto p-6">
        <TodayView />
      </main>
      <GuidedOnboarding />
      <MobileBottomNav />
    </div>
  );
}
