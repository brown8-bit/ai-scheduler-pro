import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOfflineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
        isOnline
          ? "bg-green-500 text-white animate-in fade-in slide-in-from-bottom-4"
          : "bg-destructive text-destructive-foreground animate-in fade-in slide-in-from-bottom-4"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          Back online
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          You're offline — viewing cached data
        </>
      )}
    </div>
  );
};
