import { Lightbulb, Target, Calendar, BarChart3, Bell, Zap, Users, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'analytics' | 'social' | 'automation';
  estimatedTime: string;
}

const FEATURE_SUGGESTIONS: FeatureSuggestion[] = [
  {
    id: 'goal_setting',
    title: 'Smart Goal Setting',
    description: 'Set weekly/monthly goals for habits and tasks with progress tracking and automated reminders.',
    icon: Target,
    priority: 'high',
    category: 'productivity',
    estimatedTime: '2-3 days'
  },
  {
    id: 'analytics_dashboard',
    title: 'Advanced Analytics',
    description: 'Detailed insights with charts showing productivity trends, best performing days, and habit correlation analysis.',
    icon: BarChart3,
    priority: 'high',
    category: 'analytics',
    estimatedTime: '3-4 days'
  },
  {
    id: 'smart_scheduling',
    title: 'AI-Powered Scheduling',
    description: 'Automatically schedule tasks based on energy levels, past performance, and available time slots.',
    icon: Calendar,
    priority: 'medium',
    category: 'productivity',
    estimatedTime: '4-5 days'
  },
  {
    id: 'team_collaboration',
    title: 'Team Workspaces',
    description: 'Share tasks, track team habits, and collaborate on projects with team members.',
    icon: Users,
    priority: 'medium',
    category: 'social',
    estimatedTime: '5-7 days'
  },
  {
    id: 'smart_notifications',
    title: 'Context-Aware Notifications',
    description: 'Intelligent notifications that adapt to your schedule, location, and current activity.',
    icon: Bell,
    priority: 'high',
    category: 'automation',
    estimatedTime: '2-3 days'
  },
  {
    id: 'habit_templates',
    title: 'Habit Templates & Library',
    description: 'Pre-built habit templates for fitness, learning, wellness with expert recommendations.',
    icon: BookOpen,
    priority: 'medium',
    category: 'productivity',
    estimatedTime: '2-3 days'
  },
  {
    id: 'energy_tracking',
    title: 'Energy Level Tracking',
    description: 'Track energy levels throughout the day to optimize task scheduling and habit timing.',
    icon: Zap,
    priority: 'low',
    category: 'analytics',
    estimatedTime: '3-4 days'
  },
  {
    id: 'integration_hub',
    title: 'Third-Party Integrations',
    description: 'Connect with Google Calendar, Todoist, Apple Health, Fitbit, and other productivity tools.',
    icon: Lightbulb,
    priority: 'medium',
    category: 'automation',
    estimatedTime: '4-6 days'
  }
];

interface FeatureSuggestionsProps {
  onFeatureSelect: (feature: FeatureSuggestion) => void;
}

export default function FeatureSuggestions({ onFeatureSelect }: FeatureSuggestionsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'productivity': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'analytics': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'social': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
      case 'automation': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🚀 Feature Suggestions
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Here are some exciting features we could add to enhance your productivity experience
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURE_SUGGESTIONS.map(feature => {
          const IconComponent = feature.icon;
          return (
            <Card key={feature.id} className="p-4 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <IconComponent size={20} className="text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {feature.title}
                    </h3>
                    <div className="flex space-x-1 ml-2">
                      <Badge className={`text-xs ${getPriorityColor(feature.priority)}`}>
                        {feature.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Badge className={`text-xs ${getCategoryColor(feature.category)}`}>
                        {feature.category}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ~{feature.estimatedTime}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onFeatureSelect(feature)}
                    >
                      Build This
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-dashed">
        <div className="text-center">
          <Lightbulb className="mx-auto mb-2 text-primary" size={24} />
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Have Your Own Ideas?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Let me know what features would make your productivity workflow even better!
          </p>
        </div>
      </Card>
    </div>
  );
}