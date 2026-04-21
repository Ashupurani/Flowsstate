import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeatureSuggestions from "@/components/feature-suggestions";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
  category: 'productivity' | 'analytics' | 'social' | 'automation';
  estimatedTime: string;
}

export default function SuggestionsPage() {
  const { toast } = useToast();

  const handleFeatureSelect = (feature: Feature) => {
    toast({
      title: "Feature Request Noted!",
      description: `I'll start working on "${feature.title}" - estimated time: ${feature.estimatedTime}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Feature Suggestions
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore exciting features we can add to enhance your productivity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <FeatureSuggestions onFeatureSelect={handleFeatureSelect} />
      </div>
    </div>
  );
}