import { useState } from "react";
import { VideoUploader } from "@/components/VideoUploader";
import { VideoPlayer } from "@/components/VideoPlayer";
import DataExport from "@/components/data-export";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const [demoVideoPath, setDemoVideoPath] = useState<string>('');
  const [testVideoPath, setTestVideoPath] = useState<string>('');
  const { toast } = useToast();

  const handleDemoVideoUpload = (videoPath: string) => {
    setDemoVideoPath(videoPath);
    // Store in localStorage for persistence
    localStorage.setItem('demoVideoPath', videoPath);
  };

  const handleTestPath = () => {
    if (testVideoPath) {
      setDemoVideoPath(testVideoPath);
      localStorage.setItem('demoVideoPath', testVideoPath);
      toast({
        title: "Video Path Updated",
        description: "Demo video path has been set successfully",
      });
    }
  };

  // Load stored video path on component mount
  useState(() => {
    const stored = localStorage.getItem('demoVideoPath');
    if (stored) {
      setDemoVideoPath(stored);
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage demo videos and platform content
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Video</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>



        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Demo Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <VideoUploader onUploadComplete={handleDemoVideoUpload} />
                </div>
                <div className="flex-1">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="test-path">Test Video Path</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="test-path"
                          placeholder="/objects/uploads/..."
                          value={testVideoPath}
                          onChange={(e) => setTestVideoPath(e.target.value)}
                        />
                        <Button onClick={handleTestPath} variant="outline">
                          Set
                        </Button>
                      </div>
                    </div>
                    {demoVideoPath && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Current Demo Video
                        </h4>
                        <code className="text-sm text-blue-700 dark:text-blue-300 break-all">
                          {demoVideoPath}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {demoVideoPath ? (
                <div className="max-w-2xl">
                  <VideoPlayer 
                    videoPath={demoVideoPath} 
                    title="Flowsstate Demo"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No demo video uploaded yet. Go to the Upload tab to add one.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Demo Video Path</Label>
                <Input 
                  value={demoVideoPath} 
                  readOnly 
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <h4 className="font-medium mb-2">Instructions:</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Upload videos up to 100MB in size</li>
                  <li>Supported formats: MP4, WebM, MOV</li>
                  <li>Videos are automatically set to public visibility</li>
                  <li>Demo videos appear on the welcome page</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Backup & Export Section - Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
        <DataExport />
      </div>
    </div>
  );
}