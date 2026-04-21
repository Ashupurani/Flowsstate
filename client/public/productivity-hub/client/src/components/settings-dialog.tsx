import { useState, useEffect } from "react";
import { Settings, User, Bell, Palette, Volume2, Download, Upload, Moon, Sun, Monitor, Trash2, AlertTriangle, Camera, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SettingsDialogProps {
  className?: string;
}

export default function SettingsDialog({ className }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState([50]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState("chime");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedPhoto = localStorage.getItem("profilePhoto");
    const savedName = localStorage.getItem("userName");
    const savedEmail = localStorage.getItem("userEmail");
    if (savedPhoto) setProfilePhoto(savedPhoto);
    if (savedName) setUserName(savedName);
    if (savedEmail) setUserEmail(savedEmail);
  }, []);

  const soundOptions = [
    { value: "chime", label: "Gentle Chime" },
    { value: "bell", label: "Classic Bell" },
    { value: "ding", label: "Modern Ding" },
  ];

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      toast({
        title: permission === 'granted' ? "Notifications Enabled" : "Notifications Disabled",
        description: permission === 'granted' 
          ? "You'll receive notifications when sessions complete."
          : "Enable notifications in browser settings.",
        variant: permission === 'granted' ? "default" : "destructive",
      });
    }
  };

  const handlePhotoUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setProfilePhoto(dataUrl);
      localStorage.setItem("profilePhoto", dataUrl);
      window.dispatchEvent(new Event('profilePhotoUpdated'));
      setIsUploading(false);
      toast({ title: "Photo updated!", description: "Your profile photo is now visible in the header." });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({ title: "Upload failed", description: "Could not read the image file.", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const resetDataMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/user/reset-data', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to reset data');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/habit-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pomodoro-sessions'] });
      setShowResetConfirm(false);
      toast({
        title: "Data Reset Complete",
        description: "All your tasks, habits, and sessions have been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Reset Failed",
        description: "Could not reset your data. Please try again.",
        variant: "destructive",
      });
    }
  });

  const exportData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [tasks, habits, habitEntries, pomodoroSessions] = await Promise.all([
        fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` }}).then(r => r.json()),
        fetch('/api/habits', { headers: { 'Authorization': `Bearer ${token}` }}).then(r => r.json()),
        fetch('/api/habit-entries', { headers: { 'Authorization': `Bearer ${token}` }}).then(r => r.json()),
        fetch('/api/pomodoro-sessions', { headers: { 'Authorization': `Bearer ${token}` }}).then(r => r.json()),
      ]);

      const exportData = { tasks, habits, habitEntries, pomodoroSessions, exportDate: new Date().toISOString() };
      const dataBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `productivity-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({ title: "Export Complete", description: "Your data has been downloaded." });
    } catch {
      toast({ title: "Export Failed", description: "Could not export data.", variant: "destructive" });
    }
  };

  const exportExcel = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/export/excel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `productivity-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();

      toast({ title: "Excel Export Complete", description: "Your data has been exported as Excel." });
    } catch {
      toast({ title: "Export Failed", description: "Could not export Excel file.", variant: "destructive" });
    }
  };

  const saveProfile = () => {
    localStorage.setItem("userName", userName);
    localStorage.setItem("userEmail", userEmail);
    toast({ title: "Profile Saved", description: "Your profile has been updated." });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className={className} data-testid="button-settings">
            <Settings size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile"><User className="w-4 h-4 mr-1" />Profile</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Alerts</TabsTrigger>
              <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1" />Theme</TabsTrigger>
              <TabsTrigger value="data"><Download className="w-4 h-4 mr-1" />Data</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Profile Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profilePhoto || undefined} />
                      <AvatarFallback className="text-lg bg-primary/10">
                        {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isUploading}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handlePhotoUpload(file);
                          };
                          input.click();
                        }}
                        data-testid="button-upload-photo"
                      >
                        <Camera size={14} className="mr-1" />
                        {isUploading ? "Uploading..." : "Upload Photo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG up to 2MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Personal Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your name"
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={userEmail} 
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="your@email.com"
                      data-testid="input-email"
                    />
                  </div>
                  <Button onClick={saveProfile} className="w-full" data-testid="button-save-profile">
                    Save Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Browser Notifications</h4>
                      <p className="text-sm text-muted-foreground">Get alerts when sessions complete</p>
                    </div>
                    <Switch 
                      checked={notificationsEnabled} 
                      onCheckedChange={(checked) => {
                        setNotificationsEnabled(checked);
                        if (checked) requestNotificationPermission();
                      }}
                      data-testid="switch-notifications"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Sound Alerts</h4>
                      <p className="text-sm text-muted-foreground">Play sound when done</p>
                    </div>
                    <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} data-testid="switch-sound" />
                  </div>

                  {soundEnabled && (
                    <div className="space-y-3 pl-4 border-l-2">
                      <div className="flex items-center gap-2">
                        <Select value={selectedSound} onValueChange={setSelectedSound}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {soundOptions.map((sound) => (
                              <SelectItem key={sound.value} value={sound.value}>{sound.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon">
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-sm">Volume: {soundVolume[0]}%</Label>
                        <Slider value={soundVolume} onValueChange={setSoundVolume} max={100} step={5} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Theme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setTheme("light")}
                      data-testid="button-theme-light"
                    >
                      <Sun className="w-5 h-5 mb-1" />
                      <span className="text-xs">Light</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setTheme("dark")}
                      data-testid="button-theme-dark"
                    >
                      <Moon className="w-5 h-5 mb-1" />
                      <span className="text-xs">Dark</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setTheme("system")}
                      data-testid="button-theme-system"
                    >
                      <Monitor className="w-5 h-5 mb-1" />
                      <span className="text-xs">Auto</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Export Data</CardTitle>
                  <CardDescription>Download a backup of all your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={exportData} className="w-full" variant="outline" data-testid="button-export-json">
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button onClick={exportExcel} className="w-full" variant="outline" data-testid="button-export-excel">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-red-600 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    This will permanently delete all your tasks, habits, and sessions.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowResetConfirm(true)}
                    disabled={resetDataMutation.isPending}
                    data-testid="button-reset-data"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {resetDataMutation.isPending ? "Resetting..." : "Reset All Data"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your:
              <ul className="list-disc ml-6 mt-2">
                <li>Tasks and their history</li>
                <li>Habits and completion records</li>
                <li>Pomodoro session history</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => resetDataMutation.mutate()}
              data-testid="button-confirm-reset"
            >
              Yes, Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
