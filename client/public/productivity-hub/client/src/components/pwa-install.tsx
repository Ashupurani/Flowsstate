import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smartphone, Download, X, Wifi, Bell, Zap, Users } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after user has been on the site for 30 seconds
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    // Don't show again for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  if (isInstalled) return null;

  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <div className="flex items-center space-x-2">
            <Wifi size={16} />
            <span>Offline Mode</span>
          </div>
        </div>
      )}

      {/* Install Prompt Dialog */}
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Smartphone size={24} className="text-primary" />
              <span>Install Productivity Hub</span>
            </DialogTitle>
            <DialogDescription>
              Get the full app experience with offline access and native features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="pwa-install-prompt">
              <h3 className="font-semibold mb-3">Why install the app?</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Wifi size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Work Offline</p>
                    <p className="text-sm opacity-90">Access your tasks and habits without internet</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Smart Notifications</p>
                    <p className="text-sm opacity-90">Get reminders for habits and deadlines</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Faster Performance</p>
                    <p className="text-sm opacity-90">Native app speed and responsiveness</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="font-medium">Home Screen Access</p>
                    <p className="text-sm opacity-90">Quick access from your phone's home screen</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleInstallClick} className="flex-1">
                <Download size={16} className="mr-2" />
                Install App
              </Button>
              <Button variant="outline" onClick={dismissInstallPrompt}>
                <X size={16} className="mr-2" />
                Not Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Install Button (for browsers that support it) */}
      {deferredPrompt && !showInstallPrompt && (
        <Card className="m-4 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Smartphone size={20} className="text-primary" />
              <span>Install App</span>
            </CardTitle>
            <CardDescription>
              Get faster access and offline capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInstallClick} size="sm" className="w-full">
              <Download size={16} className="mr-2" />
              Add to Home Screen
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}