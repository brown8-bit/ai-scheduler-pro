import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Link2, 
  Check, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Settings,
  Trash2,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CalendarConnection {
  id: string;
  provider: string;
  provider_email: string | null;
  sync_enabled: boolean;
  sync_status: string;
  last_synced_at: string | null;
  settings: {
    working_hours_start: number;
    working_hours_end: number;
    buffer_minutes: number;
    no_meeting_days: number[];
  } | null;
}

interface CalendarConnectionRow {
  id: string;
  provider: string;
  provider_email: string | null;
  sync_enabled: boolean | null;
  sync_status: string | null;
  last_synced_at: string | null;
  settings: unknown;
}

const PROVIDERS = [
  {
    id: "google",
    name: "Google Calendar",
    icon: "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png",
    color: "bg-blue-500",
    available: true,
  },
  {
    id: "outlook",
    name: "Outlook / Office 365",
    icon: "https://img.icons8.com/color/48/microsoft-outlook-2019.png",
    color: "bg-blue-600",
    available: true,
  },
  {
    id: "apple",
    name: "Apple iCloud",
    icon: "https://img.icons8.com/color/48/apple-calendar.png",
    color: "bg-gray-500",
    available: false,
  },
];

const CalendarConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("calendar_connections")
        .select("id, provider, provider_email, sync_enabled, sync_status, last_synced_at, settings")
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Map the data to our interface
      const mappedConnections: CalendarConnection[] = (data || []).map((row) => ({
        id: row.id,
        provider: row.provider,
        provider_email: row.provider_email,
        sync_enabled: row.sync_enabled ?? true,
        sync_status: row.sync_status ?? "pending",
        last_synced_at: row.last_synced_at,
        settings: row.settings as CalendarConnection["settings"],
      }));
      
      setConnections(mappedConnections);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    
    // For now, show a coming soon message since OAuth requires setup
    toast({
      title: "Coming Soon! 🚀",
      description: `${PROVIDERS.find(p => p.id === providerId)?.name} integration is coming soon. We'll notify you when it's ready!`,
    });
    
    setConnecting(null);
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("calendar_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast({
        title: "Calendar disconnected",
        description: "Your calendar has been disconnected.",
      });
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect calendar.",
        variant: "destructive",
      });
    }
  };

  const handleSync = async (connectionId: string) => {
    toast({
      title: "Syncing...",
      description: "Calendar sync is in progress.",
    });
    // Sync logic would be implemented via edge function
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "synced":
        return (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" />
            Synced
          </span>
        );
      case "syncing":
        return (
          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Syncing
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            Pending
          </span>
        );
    }
  };

  const connectedProviders = connections.map(c => c.provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected Calendars */}
      {connections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Connected</h3>
          {connections.map((connection) => {
            const provider = PROVIDERS.find(p => p.id === connection.provider);
            return (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${provider?.color} flex items-center justify-center`}>
                    <img 
                      src={provider?.icon} 
                      alt={provider?.name} 
                      className="w-6 h-6"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{provider?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {connection.provider_email || "Connected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(connection.sync_status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSync(connection.id)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(connection.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Providers */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          {connections.length > 0 ? "Add More" : "Connect Your Calendars"}
        </h3>
        {PROVIDERS.filter(p => !connectedProviders.includes(p.id)).map((provider) => (
          <button
            key={provider.id}
            onClick={() => provider.available && handleConnect(provider.id)}
            disabled={connecting === provider.id || !provider.available}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              provider.available 
                ? "bg-card border-border hover:border-primary/50 hover:shadow-sm cursor-pointer" 
                : "bg-secondary/30 border-border/50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${provider.color} flex items-center justify-center`}>
                <img 
                  src={provider.icon} 
                  alt={provider.name} 
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{provider.name}</p>
                <p className="text-xs text-muted-foreground">
                  {provider.available ? "Click to connect" : "Coming soon"}
                </p>
              </div>
            </div>
            {connecting === provider.id ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : provider.available ? (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">Soon</span>
            )}
          </button>
        ))}
      </div>

      {/* Info Note */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex gap-3">
          <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Auto-sync your calendars</p>
            <p className="text-xs text-muted-foreground mt-1">
              Schedulr will automatically respect your existing events and working hours. 
              Your calendar data is encrypted and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarConnections;
