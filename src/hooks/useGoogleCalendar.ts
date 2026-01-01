import { useState, useEffect, useCallback } from "react";
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
    timezone?: string;
    calendars?: Array<{ id: string; name: string; primary?: boolean }>;
    auto_block_focus?: boolean;
    buffer_minutes?: number;
  } | null;
}

interface SyncedEvent {
  id: string;
  external_event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  status: string | null;
  is_busy: boolean;
}

interface CreateEventParams {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [events, setEvents] = useState<SyncedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("calendar_connections")
        .select("id, provider, provider_email, sync_enabled, sync_status, last_synced_at, settings")
        .eq("user_id", user.id)
        .eq("provider", "google");

      if (error) throw error;

      const mapped: CalendarConnection[] = (data || []).map((row) => ({
        id: row.id,
        provider: row.provider,
        provider_email: row.provider_email,
        sync_enabled: row.sync_enabled ?? true,
        sync_status: row.sync_status ?? "pending",
        last_synced_at: row.last_synced_at,
        settings: row.settings as CalendarConnection["settings"],
      }));

      setConnections(mapped);
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  }, [user]);

  // Fetch synced events
  const fetchEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!user) return;

    try {
      const now = new Date();
      const start = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("synced_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", start.toISOString())
        .lte("end_time", end.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchConnections(), fetchEvents()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, fetchConnections, fetchEvents]);

  // Map OAuth error codes to user-friendly messages
  const getOAuthErrorMessage = (error: string): { title: string; description: string } => {
    const errorMessages: Record<string, { title: string; description: string }> = {
      access_denied: {
        title: "Access Denied",
        description: "You declined the calendar permissions. Please try again and allow access to connect your calendar.",
      },
      invalid_scope: {
        title: "Invalid Permissions",
        description: "The requested calendar permissions are not available. Please contact support.",
      },
      invalid_client: {
        title: "Configuration Error",
        description: "Google Calendar integration is not properly configured. Please contact support.",
      },
      invalid_grant: {
        title: "Authorization Expired",
        description: "The authorization has expired. Please try connecting again.",
      },
      token_exchange_failed: {
        title: "Connection Failed",
        description: "Failed to complete the Google sign-in. Please try again or check your internet connection.",
      },
      missing_params: {
        title: "Connection Interrupted",
        description: "The connection process was interrupted. Please try again.",
      },
      invalid_state: {
        title: "Security Error",
        description: "The connection request could not be verified. Please try again.",
      },
      popup_blocked: {
        title: "Popup Blocked",
        description: "Please allow popups for this site to connect your Google Calendar.",
      },
      network_error: {
        title: "Network Error",
        description: "Unable to reach Google servers. Please check your internet connection and try again.",
      },
    };

    return errorMessages[error] || {
      title: "Connection Failed",
      description: `Unable to connect to Google Calendar: ${error}. Please try again or contact support.`,
    };
  };

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "google-calendar-success") {
        toast({
          title: "Calendar Connected! 🎉",
          description: "Your Google Calendar has been successfully connected. Events will now sync automatically.",
        });
        fetchConnections();
        setConnecting(false);

        // Auto-sync after connection
        setTimeout(() => syncCalendar(), 1000);
      } else if (event.data?.type === "google-calendar-error") {
        const errorInfo = getOAuthErrorMessage(event.data.error || "unknown");
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: "destructive",
        });
        setConnecting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchConnections]);

  // Connect to Google Calendar
  const connect = async () => {
    setConnecting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: "Please Log In",
          description: "You need to be logged in to connect your calendar.",
          variant: "destructive",
        });
        setConnecting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("google-calendar-auth", {
        body: { redirectUrl: window.location.origin + "/settings" },
      });

      if (error) {
        // Handle specific edge function errors
        if (error.message?.includes("not configured")) {
          toast({
            title: "Not Available",
            description: "Google Calendar integration is not configured yet. Please contact support.",
            variant: "destructive",
          });
        } else if (error.message?.includes("fetch")) {
          toast({
            title: "Network Error",
            description: "Unable to connect to the server. Please check your internet connection.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setConnecting(false);
        return;
      }

      if (data?.url) {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.url,
          "google-oauth",
          `width=${width},height=${height},left=${left},top=${top},popup=1`
        );

        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          const errorInfo = getOAuthErrorMessage("popup_blocked");
          toast({
            title: errorInfo.title,
            description: errorInfo.description,
            variant: "destructive",
          });
          setConnecting(false);
          return;
        }

        // Monitor popup for closure without success message
        const popupMonitor = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupMonitor);
            // Give a brief moment for the success message to arrive
            setTimeout(() => {
              if (connecting) {
                setConnecting(false);
              }
            }, 500);
          }
        }, 500);
      } else {
        toast({
          title: "Connection Error",
          description: "Unable to start Google sign-in. Please try again.",
          variant: "destructive",
        });
        setConnecting(false);
      }
    } catch (error) {
      console.error("Connect error:", error);
      toast({
        title: "Connection Error",
        description: "Something went wrong while connecting to Google. Please try again.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  // Disconnect calendar
  const disconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("calendar_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      // Also delete synced events
      await supabase
        .from("synced_events")
        .delete()
        .eq("connection_id", connectionId);

      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      setEvents((prev) => prev.filter((e) => e.id !== connectionId));

      toast({
        title: "Calendar Disconnected",
        description: "Your Google Calendar has been disconnected.",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect calendar.",
        variant: "destructive",
      });
    }
  };

  // Sync calendar
  const syncCalendar = async (connectionId?: string) => {
    if (connections.length === 0 && !connectionId) {
      toast({
        title: "No Calendar Connected",
        description: "Please connect a Google Calendar first.",
      });
      return;
    }

    setSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { connectionId, syncDays: 30 },
      });

      if (error) throw error;

      toast({
        title: "Calendar Synced",
        description: `Successfully synced ${data.results?.[0]?.eventsSync || 0} events.`,
      });

      await Promise.all([fetchConnections(), fetchEvents()]);
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Error",
        description: "Failed to sync calendar.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Create event in Google Calendar
  const createEvent = async (connectionId: string, params: CreateEventParams) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-events", {
        body: {
          action: "create",
          connectionId,
          ...params,
        },
      });

      if (error) throw error;

      toast({
        title: "Event Created",
        description: "Event has been added to your Google Calendar.",
      });

      await fetchEvents();
      return data.event;
    } catch (error) {
      console.error("Create event error:", error);
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create focus block
  const createFocusBlock = async (
    connectionId: string,
    start: string,
    end: string,
    title?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-events", {
        body: {
          action: "createFocusBlock",
          connectionId,
          start,
          end,
          title,
        },
      });

      if (error) throw error;

      toast({
        title: "Focus Block Created",
        description: "Focus time has been blocked on your calendar.",
      });

      await fetchEvents();
      return data.event;
    } catch (error) {
      console.error("Create focus block error:", error);
      toast({
        title: "Error",
        description: "Failed to create focus block.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete event
  const deleteEvent = async (connectionId: string, eventId: string) => {
    try {
      const { error } = await supabase.functions.invoke("google-calendar-events", {
        body: {
          action: "delete",
          connectionId,
          eventId,
        },
      });

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Event has been removed from your Google Calendar.",
      });

      await fetchEvents();
    } catch (error) {
      console.error("Delete event error:", error);
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    }
  };

  // Update connection settings
  const updateSettings = async (
    connectionId: string,
    settings: Partial<CalendarConnection["settings"]>
  ) => {
    try {
      const connection = connections.find((c) => c.id === connectionId);
      if (!connection) return;

      const newSettings = { ...connection.settings, ...settings };

      const { error } = await supabase
        .from("calendar_connections")
        .update({ settings: newSettings })
        .eq("id", connectionId);

      if (error) throw error;

      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, settings: newSettings } : c))
      );

      toast({
        title: "Settings Updated",
        description: "Calendar settings have been saved.",
      });
    } catch (error) {
      console.error("Update settings error:", error);
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  // Check if a time slot is busy
  const isTimeSlotBusy = (start: Date, end: Date): boolean => {
    return events.some((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      return event.is_busy && start < eventEnd && end > eventStart;
    });
  };

  // Get free slots for a date
  const getFreeSlotsForDate = (
    date: Date,
    durationMinutes: number,
    workingHoursStart: number = 9,
    workingHoursEnd: number = 17
  ): Array<{ start: Date; end: Date }> => {
    const slots: Array<{ start: Date; end: Date }> = [];
    const dayStart = new Date(date);
    dayStart.setHours(workingHoursStart, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(workingHoursEnd, 0, 0, 0);

    // Get events for this day
    const dayEvents = events
      .filter((event) => {
        const eventStart = new Date(event.start_time);
        return (
          event.is_busy &&
          eventStart.toDateString() === date.toDateString()
        );
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    let currentTime = dayStart;

    for (const event of dayEvents) {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      // Check if there's a gap before this event
      while (currentTime.getTime() + durationMinutes * 60000 <= eventStart.getTime()) {
        const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);
        if (slotEnd <= dayEnd) {
          slots.push({ start: new Date(currentTime), end: slotEnd });
        }
        currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30 min increments
      }

      // Move past the event
      if (eventEnd > currentTime) {
        currentTime = new Date(eventEnd);
      }
    }

    // Check remaining time after last event
    while (currentTime.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);
      slots.push({ start: new Date(currentTime), end: slotEnd });
      currentTime = new Date(currentTime.getTime() + 30 * 60000);
    }

    return slots;
  };

  const isConnected = connections.length > 0;
  const primaryConnection = connections[0];

  return {
    // State
    connections,
    events,
    loading,
    syncing,
    connecting,
    isConnected,
    primaryConnection,

    // Actions
    connect,
    disconnect,
    syncCalendar,
    createEvent,
    createFocusBlock,
    deleteEvent,
    updateSettings,
    fetchEvents,

    // Utilities
    isTimeSlotBusy,
    getFreeSlotsForDate,
  };
}
