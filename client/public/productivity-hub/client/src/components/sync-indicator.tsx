import { useState, useEffect } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { RefreshCw, Check, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function SyncIndicator() {
  const isFetching = useIsFetching();
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (isFetching === 0) {
      setLastSynced(new Date());
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/50">
          {isFetching > 0 ? (
            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          ) : showCheck ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Wifi className="w-3 h-3 text-green-500" />
          )}
          <span className="hidden sm:inline">
            {isFetching > 0 ? 'Syncing...' : getTimeAgo()}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Last synced: {lastSynced.toLocaleTimeString()}</p>
        <p className="text-xs text-muted-foreground">Data refreshes when you return to this tab</p>
      </TooltipContent>
    </Tooltip>
  );
}
