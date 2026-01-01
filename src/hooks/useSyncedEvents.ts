import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SyncedEvent {
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
  connection_id: string;
  source: "google";
}

export function useSyncedEvents() {
  const { user } = useAuth();
  const [syncedEvents, setSyncedEvents] = useState<SyncedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSyncedEvents = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const start = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("synced_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_time", start.toISOString())
        .lte("end_time", end.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      const mapped: SyncedEvent[] = (data || []).map((event) => ({
        ...event,
        source: "google" as const,
      }));

      setSyncedEvents(mapped);
    } catch (error) {
      console.error("Error fetching synced events:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSyncedEvents();
  }, [fetchSyncedEvents]);

  return {
    syncedEvents,
    loading,
    refetch: fetchSyncedEvents,
  };
}
