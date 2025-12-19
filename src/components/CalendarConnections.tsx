import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Check, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Trash2,
  ChevronRight,
  Clock,
  Settings2,
  Zap
} from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
    available: false,
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
  const {
    connections,
    loading,
    syncing,
    connecting,
    connect,
    disconnect,
    syncCalendar,
    updateSettings,
  } = useGoogleCalendar();

  const [expandedConnection, setExpandedConnection] = useState<string | null>(null);

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

  const formatLastSynced = (lastSynced: string | null) => {
    if (!lastSynced) return "Never";
    const date = new Date(lastSynced);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
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
            const isExpanded = expandedConnection === connection.id;
            
            return (
              <Collapsible
                key={connection.id}
                open={isExpanded}
                onOpenChange={() => setExpandedConnection(isExpanded ? null : connection.id)}
              >
                <div className="rounded-xl bg-secondary/50 border border-border overflow-hidden">
                  <div className="flex items-center justify-between p-4">
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
                        onClick={() => syncCalendar(connection.id)}
                        disabled={syncing}
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => disconnect(connection.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
                      {/* Sync Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Last synced: {formatLastSynced(connection.last_synced_at)}
                        {connection.settings?.timezone && (
                          <span className="ml-2">• {connection.settings.timezone}</span>
                        )}
                      </div>

                      {/* Smart Features */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Smart Features
                        </h4>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`focus-${connection.id}`} className="text-sm">
                            Auto-block focus time
                          </Label>
                          <Switch
                            id={`focus-${connection.id}`}
                            checked={connection.settings?.auto_block_focus || false}
                            onCheckedChange={(checked) => 
                              updateSettings(connection.id, { auto_block_focus: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Buffer between meetings</Label>
                          <Select
                            value={String(connection.settings?.buffer_minutes || 0)}
                            onValueChange={(value) => 
                              updateSettings(connection.id, { buffer_minutes: parseInt(value) })
                            }
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              <SelectItem value="5">5 min</SelectItem>
                              <SelectItem value="10">10 min</SelectItem>
                              <SelectItem value="15">15 min</SelectItem>
                              <SelectItem value="30">30 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Connected Calendars */}
                      {connection.settings?.calendars && connection.settings.calendars.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Synced Calendars</h4>
                          <div className="flex flex-wrap gap-2">
                            {connection.settings.calendars.map((cal) => (
                              <span
                                key={cal.id}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  cal.primary 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'bg-secondary text-secondary-foreground'
                                }`}
                              >
                                {cal.name}
                                {cal.primary && ' (Primary)'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
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
            onClick={() => provider.available && provider.id === "google" && connect()}
            disabled={connecting || !provider.available}
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
            {connecting && provider.id === "google" ? (
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
