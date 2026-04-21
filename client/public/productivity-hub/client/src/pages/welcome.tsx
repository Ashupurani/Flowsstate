import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Users, Brain, Calendar, Target, Clock, TrendingUp, Star, Play } from "lucide-react";
import { AuthForms } from "@/components/auth-forms";
import { VideoPlayer } from "@/components/VideoPlayer";

export default function Welcome() {
  const [isVisible, setIsVisible] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [demoVideoPath, setDemoVideoPath] = useState<string>('');
  
  // Check if user has token and should be redirected
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    console.log('💭 Welcome page - checking token:', !!token);
    if (token) {
      console.log('💭 Token found, but still showing welcome page - auth might be failing');
      // Show auth form by default if we have a token but are still here
      setShowAuthForm(true);
    }
  }, []);

  useEffect(() => {
    document.title = "Welcome to Productivity Hub - Your Personal Productivity Platform";
    setIsVisible(true);
    // Load demo video path from localStorage
    const storedVideoPath = localStorage.getItem('demoVideoPath');
    if (storedVideoPath) {
      setDemoVideoPath(storedVideoPath);
    }
  }, []);

  const features = [
    {
      icon: Target,
      title: "Smart Task Management",
      description: "Kanban-style boards with AI-powered categorization and priority detection",
      color: "text-blue-500"
    },
    {
      icon: Calendar,
      title: "Habit Tracking",
      description: "Daily habit tracking with streak rewards and completion analytics",
      color: "text-green-500"
    },
    {
      icon: Clock,
      title: "Pomodoro Timer",
      description: "Built-in focus sessions with automatic break scheduling",
      color: "text-orange-500"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share workspaces, assign tasks, and track team productivity",
      color: "text-purple-500"
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Smart recommendations and productivity pattern analysis",
      color: "text-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Comprehensive reports and goal tracking with visual dashboards",
      color: "text-indigo-500"
    }
  ];

  const benefits = [
    "Increase productivity by up to 40%",
    "Reduce task switching and context loss",
    "Build consistent daily habits",
    "Collaborate effectively with teams",
    "Make data-driven productivity decisions"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative container mx-auto px-6 pt-16 pb-24">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <img 
              src="/logo.png" 
              alt="Productivity Hub Logo" 
              className="w-20 h-20 mx-auto mb-4 object-contain"
            />
            <Badge variant="secondary" className="mb-4 text-sm font-medium">
              <Star size={14} className="mr-1" />
              Enterprise-Grade Productivity Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Productivity Hub
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your workflow with AI-powered task management, habit tracking, and team collaboration. 
              Built for modern professionals and teams who demand excellence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => setShowAuthForm(true)}
                className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started Free
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-4">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full">
                  <DialogHeader>
                    <DialogTitle>Productivity Hub Demo</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    {demoVideoPath ? (
                      <VideoPlayer 
                        videoPath={demoVideoPath} 
                        title="Productivity Hub Demo"
                        className="w-full"
                      />
                    ) : (
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-12 text-center">
                        <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Demo Video Not Available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          The demo video is currently being prepared. Please check back soon!
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 transition-all duration-500 delay-${index * 100}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive productivity tools designed to streamline your workflow and maximize your potential.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm`}
            >
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mb-4`}>
                  <feature.icon size={24} className={feature.color} />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already revolutionized their workflow with Productivity Hub.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => setShowAuthForm(true)}
            className="text-lg px-8 py-4 bg-white text-gray-900 hover:bg-gray-100"
          >
            Start Your Journey Today
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 dark:bg-slate-950 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Productivity Hub. Built with modern technology for modern professionals.
          </p>
        </div>
      </div>

      {/* Authentication Modal Overlay */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative max-w-md w-full">
            <button
              onClick={() => setShowAuthForm(false)}
              className="absolute -top-4 -right-4 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 shadow-lg z-10"
            >
              ×
            </button>
            <AuthForms />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .bg-grid-pattern {
            background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
            background-size: 24px 24px;
          }
        `
      }} />
    </div>
  );
}