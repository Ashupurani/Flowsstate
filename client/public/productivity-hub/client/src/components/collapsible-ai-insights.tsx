import { useState } from "react";
import { ChevronDown, ChevronUp, Brain, TrendingUp, Target, Clock, Lightbulb, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

export default function CollapsibleAIInsights() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: habitEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/habit-entries"],
  });

  const { data: pomodoroSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/pomodoro-sessions"],
  });

  // AI-powered analytics calculations
  const getProductivityScore = () => {
    const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
    const totalTasks = tasks.length;
    const completedHabits = habitEntries.filter((entry: any) => entry.completed).length;
    const focusSessions = pomodoroSessions.filter((session: any) => session.type === 'focus').length;
    
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 40 : 0;
    const habitScore = completedHabits * 2; // 2 points per completed habit
    const focusScore = Math.min(focusSessions * 5, 20); // 5 points per session, max 20
    
    return Math.min(Math.round(taskScore + habitScore + focusScore), 100);
  };

  const getAIInsights = () => {
    const score = getProductivityScore();
    const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
    const inProgressTasks = tasks.filter((task: any) => task.status === 'in_task').length;
    const focusSessions = pomodoroSessions.filter((session: any) => session.type === 'focus').length;
    
    const insights = [];
    
    if (score >= 80) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Excellent Productivity',
        message: 'You\'re performing exceptionally well! Keep up the momentum.',
        color: 'text-green-500'
      });
    } else if (score >= 60) {
      insights.push({
        type: 'warning',
        icon: Target,
        title: 'Good Progress',
        message: 'You\'re on track. Consider focusing on completing more tasks.',
        color: 'text-yellow-500'
      });
    } else {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Room for Improvement',
        message: 'Try breaking tasks into smaller chunks for better completion rates.',
        color: 'text-blue-500'
      });
    }
    
    if (inProgressTasks > 5) {
      insights.push({
        type: 'warning',
        icon: Clock,
        title: 'Too Many Active Tasks',
        message: 'Focus on completing current tasks before starting new ones.',
        color: 'text-orange-500'
      });
    }
    
    if (focusSessions < 3) {
      insights.push({
        type: 'info',
        icon: Brain,
        title: 'More Focus Time Needed',
        message: 'Try scheduling more Pomodoro sessions for better concentration.',
        color: 'text-purple-500'
      });
    }
    
    return insights;
  };

  const getTopCategories = () => {
    const categoryCount: { [key: string]: number } = {};
    tasks.forEach((task: any) => {
      categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
  };

  const insights = getAIInsights();
  const productivityScore = getProductivityScore();
  const topCategories = getTopCategories();

  return (
    <Card className="bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Brain size={20} className="mr-2 text-primary" />
            AI Insights
            <Badge variant="secondary" className="ml-2 text-xs">
              {productivityScore}% Score
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-6">
            {/* Productivity Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <BarChart3 size={14} className="mr-2" />
                  Productivity Score
                </h4>
                <span className="text-sm font-bold text-primary">{productivityScore}%</span>
              </div>
              <Progress value={productivityScore} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Based on task completion, habit tracking, and focus sessions
              </p>
            </div>

            {/* AI Recommendations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Lightbulb size={14} className="mr-2" />
                Smart Recommendations
              </h4>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600"
                  >
                    <insight.icon size={16} className={`mt-0.5 ${insight.color}`} />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                        {insight.title}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories */}
            {topCategories.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <Target size={14} className="mr-2" />
                  Most Active Categories
                </h4>
                <div className="space-y-2">
                  {topCategories.map(({ category, count }, index) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {category}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {count} tasks
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200 dark:border-slate-600">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {tasks.filter((task: any) => task.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {habitEntries.filter((entry: any) => entry.completed).length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Habits</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {pomodoroSessions.filter((session: any) => session.type === 'focus').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Focus</div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}