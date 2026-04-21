import { useEffect, useState } from "react";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Achievement } from "@shared/achievements";

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export default function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'from-green-400 to-green-600 text-white',
      yellow: 'from-yellow-400 to-yellow-600 text-black',
      orange: 'from-orange-400 to-orange-600 text-white',
      purple: 'from-purple-400 to-purple-600 text-white',
      blue: 'from-blue-400 to-blue-600 text-white',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className={`p-4 min-w-[300px] bg-gradient-to-r ${getColorClasses(achievement.color)} shadow-2xl border-0`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <i className={`${achievement.icon} text-lg`}></i>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy size={16} />
              <h3 className="font-semibold text-sm">Achievement Unlocked!</h3>
            </div>
            <h4 className="font-bold text-base mb-1">{achievement.title}</h4>
            <p className="text-sm opacity-90">{achievement.description}</p>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="w-6 h-6 text-current hover:bg-white hover:bg-opacity-20"
          >
            <X size={14} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Hook to manage achievement notifications
export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<Achievement[]>([]);

  const showAchievement = (achievement: Achievement) => {
    setNotifications(prev => [...prev, { ...achievement, id: `${achievement.id}_${Date.now()}` }]);
  };

  const removeNotification = (achievementId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== achievementId));
  };

  return { notifications, showAchievement, removeNotification };
}